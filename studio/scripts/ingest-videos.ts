/**
 * Offline video ingestion pipeline (AGENTS.md §9).
 *
 * Reads every lesson's videoUrl out of scripts/seed/seed.ndjson, fetches each
 * unique video's chapters and transcript from YouTube, and writes one `video`
 * document per unique URL to scripts/seed/videos.ndjson for import via
 * `sanity dataset import`.
 *
 * Usage: npm run ingest:videos   (from studio/)
 */
import { createReadStream } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { Innertube } from "youtubei.js";

const SEED_PATH = path.join(__dirname, "seed", "seed.ndjson");
const OUTPUT_PATH = path.join(__dirname, "seed", "videos.ndjson");

/** Target span (seconds) each transcript chunk accumulates before flushing. */
const CHUNK_TARGET_SECONDS = 20;
/** Delay between per-video fetches so we don't hammer YouTube in a batch. */
const REQUEST_DELAY_MS = 500;

type LessonDoc = { _type: string; videoUrl?: string; slug?: { current?: string } };

type VideoChapter = { _key: string; startSeconds: number; label: string };
type VideoChunk = { _key: string; startSeconds: number; text: string };

type VideoDoc = {
  _id: string;
  _type: "video";
  id: string;
  url: string;
  chapters: VideoChapter[];
  chunks: VideoChunk[];
};

/** Only YouTube is supported: the only provider with both ingestion and playback (AGENTS.md §9). */
function getYouTubeVideoId(videoUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(videoUrl);
  } catch {
    return null;
  }

  if (url.hostname === "youtu.be") {
    return url.pathname.slice(1) || null;
  }
  if (url.hostname.endsWith("youtube.com")) {
    if (url.pathname === "/watch") return url.searchParams.get("v");
    if (url.pathname.startsWith("/embed/")) return url.pathname.replace("/embed/", "");
  }
  return null;
}

/** Strips anything the datastore rejects in ids (AGENTS.md §9). No-op for YouTube's safe IDs. */
function sanitizeId(raw: string): string {
  return raw.replace(/[^A-Za-z0-9_-]/g, "");
}

async function readSeedVideoUrls(): Promise<Map<string, string[]>> {
  const urlToSlugs = new Map<string, string[]>();
  const rl = readline.createInterface({ input: createReadStream(SEED_PATH), crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line.trim()) continue;
    const doc = JSON.parse(line) as LessonDoc;
    if (doc._type !== "lesson" || !doc.videoUrl) continue;
    const slug = doc.slug?.current ?? doc.videoUrl;
    const existing = urlToSlugs.get(doc.videoUrl);
    if (existing) existing.push(slug);
    else urlToSlugs.set(doc.videoUrl, [slug]);
  }

  return urlToSlugs;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n/g, " ")
    .trim();
}

type Cue = { startSeconds: number; text: string };

function parseCaptionXml(xml: string): Cue[] {
  const cues: Cue[] = [];
  const re = /<text start="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) {
    const text = decodeEntities(match[2]);
    if (!text) continue;
    cues.push({ startSeconds: Math.floor(Number(match[1])), text });
  }
  return cues;
}

function chunkCues(cues: Cue[]): VideoChunk[] {
  if (cues.length === 0) return [];

  const chunks: VideoChunk[] = [];
  let bucket: Cue[] = [];

  const flush = () => {
    if (bucket.length === 0) return;
    const startSeconds = bucket[0].startSeconds;
    const text = bucket.map((c) => c.text).join(" ").replace(/\s+/g, " ").trim();
    if (text) chunks.push({ _key: `chunk-${chunks.length}`, startSeconds, text });
    bucket = [];
  };

  for (const cue of cues) {
    bucket.push(cue);
    const span = cue.startSeconds - bucket[0].startSeconds;
    if (span >= CHUNK_TARGET_SECONDS) flush();
  }
  flush();

  return chunks;
}

async function fetchTranscriptChunks(
  captionTracks: Array<{ language_code?: string | null; kind?: string | null; base_url?: string | null }>,
): Promise<{ chunks: VideoChunk[]; reason?: string }> {
  const english = captionTracks.filter((t) => t.language_code === "en");
  const track = english.find((t) => t.kind !== "asr") ?? english[0];

  if (!track?.base_url) return { chunks: [], reason: "no English caption track available" };

  try {
    const res = await fetch(track.base_url);
    if (!res.ok) return { chunks: [], reason: `caption fetch failed (${res.status})` };

    const xml = await res.text();
    if (!xml.trim()) return { chunks: [], reason: "caption track returned an empty body" };

    const cues = parseCaptionXml(xml);
    if (cues.length === 0) return { chunks: [], reason: "caption track had no parseable cues" };

    return { chunks: chunkCues(cues) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { chunks: [], reason: `caption fetch threw (${message})` };
  }
}

function extractChapters(info: Awaited<ReturnType<Innertube["getInfo"]>>): VideoChapter[] {
  const markers = info.player_overlays?.decorated_player_bar?.player_bar?.markers_map ?? [];
  const chapterMarker = markers.find((m) => Array.isArray(m.value?.chapters) && m.value.chapters.length > 0);
  const rawChapters = chapterMarker?.value?.chapters ?? [];

  return rawChapters.map((chapter, index) => ({
    _key: `chapter-${index}`,
    startSeconds: Math.floor((chapter.time_range_start_millis ?? 0) / 1000),
    label: chapter.title?.text ?? `Chapter ${index + 1}`,
  }));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const urlToSlugs = await readSeedVideoUrls();
  console.log(`Found ${urlToSlugs.size} unique video URL(s) across seeded lessons.\n`);

  const yt = await Innertube.create();

  const docs: VideoDoc[] = [];
  const withoutChapters: string[] = [];
  const withoutChunks: string[] = [];
  const failed: string[] = [];

  let index = 0;
  for (const [videoUrl, slugs] of urlToSlugs) {
    index += 1;
    const label = `[${index}/${urlToSlugs.size}] ${slugs.join(", ")}`;

    const videoId = getYouTubeVideoId(videoUrl);
    if (!videoId) {
      console.warn(`${label}: not a supported YouTube URL (${videoUrl}) — skipping`);
      failed.push(videoUrl);
      continue;
    }

    const id = `youtube-${sanitizeId(videoId)}`;

    try {
      const info = await yt.getInfo(videoId);
      const chapters = extractChapters(info);
      const { chunks, reason } = await fetchTranscriptChunks(info.captions?.caption_tracks ?? []);

      if (chapters.length === 0) withoutChapters.push(`${id} (${slugs.join(", ")})`);
      if (chunks.length === 0) {
        withoutChunks.push(`${id} (${slugs.join(", ")})${reason ? ` — ${reason}` : ""}`);
      }

      docs.push({
        _id: `video.${id}`,
        _type: "video",
        id,
        url: videoUrl,
        chapters,
        chunks,
      });

      console.log(`${label}: ${chapters.length} chapter(s), ${chunks.length} chunk(s)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`${label}: failed to ingest (${message}) — skipping`);
      failed.push(`${id} (${slugs.join(", ")})`);
    }

    if (index < urlToSlugs.size) await sleep(REQUEST_DELAY_MS);
  }

  const ndjson = docs.map((doc) => JSON.stringify(doc)).join("\n") + "\n";
  await writeFile(OUTPUT_PATH, ndjson, "utf8");

  console.log(`\nWrote ${docs.length} video document(s) to ${path.relative(process.cwd(), OUTPUT_PATH)}`);
  console.log(`\nSummary:`);
  console.log(`  Processed: ${urlToSlugs.size}`);
  console.log(`  With chapters: ${docs.length - withoutChapters.length}`);
  console.log(`  With transcript chunks: ${docs.length - withoutChunks.length}`);

  if (failed.length > 0) {
    console.log(`\nFailed entirely (${failed.length}):`);
    for (const entry of failed) console.log(`  - ${entry}`);
  }
  if (withoutChapters.length > 0) {
    console.log(`\nNo chapters (${withoutChapters.length}):`);
    for (const entry of withoutChapters) console.log(`  - ${entry}`);
  }
  if (withoutChunks.length > 0) {
    console.log(`\nNo transcript chunks (${withoutChunks.length}):`);
    for (const entry of withoutChunks) console.log(`  - ${entry}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
