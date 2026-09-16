# Offline video ingestion pipeline: video documents with chapters + transcript chunks

## Goal

Build the `video` Sanity document type (AGENTS.md §8) and the offline ingestion
script (§9) that populates it: one `video` document per unique lesson video
URL, holding chapter markers (table of contents) and the transcript split into
short timestamped chunks. This is the missing piece the search route already
expects (`app/api/search/route.ts` currently hard-codes "no video document
type yet" and only returns `lesson`-kind results).

Explicitly out of scope for this pass: wiring `video`-kind results back into
the search system prompt / Context document instructions. That's a follow-up
once video documents exist and can be queried live — flagged under "Needs your
attention" at the end, not attempted here, per AGENTS.md "Build nothing beyond
what's asked."

## Skills read

- `sanity-migration` (`references/general.md` conventions) — deterministic,
  source-derived document IDs; `createOrReplace`/`sanity dataset import
  --replace` so reruns converge; snapshot-then-transform; track per-document
  quality issues before calling it done. All applied below.
- `sanity-best-practices` (top-level `SKILL.md`, "Video" section) — confirms:
  never store/serve video via Sanity `file` assets; for non-Enterprise plans,
  host on YouTube/Vimeo/Bunny and store only the embed URL. Matches what we're
  doing (video documents store `url`, never a file asset). Its "Global Rules"
  say to let Sanity auto-generate `_id` and avoid slug/source-derived IDs —
  this project already deviates from that convention for every other document
  type (`lesson.<slug>`, `instructor.<slug>`, `category.<slug>`), and AGENTS.md
  §9 explicitly requires a URL-derived ID for video docs so re-running
  ingestion converges on the same document instead of duplicating. Following
  AGENTS.md + existing project convention over the skill's generic default.

## Code inspected

- `studio/schemaTypes/` — no `video` document exists yet. `documents/lesson.ts`
  has `videoUrl` (required `url` field) but no reference to a video document
  (§8: "Lessons link to them by video URL", not by reference). Existing
  object-schema pattern: small single-purpose files in `objects/`
  (`courseOutcome.ts`, `lessonResource.ts`, `module.ts`), each registered in
  `documents/index.ts`.
- `studio/scripts/seed/videos.json` — an existing manifest, keyed by lesson
  slug, of `{ id, title, channel, duration, query }` for each seeded lesson's
  real YouTube video. `id` is the YouTube video ID. This is raw discovery data
  from when the sample content was put together — not consumed by anything
  yet. `studio/scripts/seed/seed.ndjson` has the matching lessons, each with
  `videoUrl: "https://www.youtube.com/watch?v=<id>"` — same IDs, confirming
  `seed.ndjson` (not `videos.json`) is the authoritative source of which video
  URLs need ingesting (`videos.json`'s `duration`/`title`/`channel`/`query`
  fields are leftover discovery metadata, not part of the video document shape
  in §8 and not used by this pipeline).
- `lib/video.ts` — `getYouTubeEmbedUrl()`: the only supported provider today,
  parses `youtube.com/watch?v=`, `youtu.be/`, and `/embed/` URL shapes. The
  ingestion script needs an equivalent ID-extraction step; kept as a small
  duplicate in the script rather than a cross-workspace import, since `studio`
  and the web app are intentionally independent workspaces (AGENTS.md §5).
- `app/api/search/route.ts` and `prompts/search.md` — confirm the search route
  was deliberately built to return only `lesson`-kind results because "there
  is no video document type yet," and the Context document's Instructions
  field (`studio/scripts/seed/search-context.ndjson`) says the same under
  "Known limitations." Both will go stale once this pipeline runs — flagged as
  a follow-up, not fixed here.
- `studio/schemaTypes/documents/{course,lesson,instructor,category}.ts` — every
  document type uses a deterministic, slug-derived `_id`
  (`instructor.mira-kovac`, `category.web-development`, `lesson.<slug>`).
  Following the same `video.<id>` convention.
- `studio/sanity.config.ts` / `structure.ts` — `structureTool` pins
  course/instructor/category and spreads `S.documentTypeListItems()` for
  everything else. A new `video` type needs no structure change to appear in
  Studio (same conclusion `prompts/search.md` reached for the Context
  document type).
- `studio/package.json` — no script runner (`tsx`/`ts-node`) and no HTTP/video
  library installed yet. `studio/scripts/seed/*.ndjson` files are imported by
  hand with `npx sanity dataset import ... --replace` (confirmed in
  `prompts/search.md`'s manual test steps) — there's no existing seed *script*,
  only static ndjson fixtures. This pipeline introduces the project's first
  actual script.
- `.env.example` — no write token exists yet (only `SANITY_API_READ_TOKEN`,
  viewer role). Following the ndjson-then-`sanity dataset import` pattern
  avoids needing one: the script never talks to Sanity directly, it only
  generates a file, exactly like the existing seed fixtures.

## Spike: live YouTube caption/chapter fetching (done before writing this prompt)

Tested three approaches against real seeded video IDs to find out what's
actually reachable right now, since this determines the whole design:

- **Chapters — works.** `youtubei.js`'s `Innertube.getInfo(videoId)` exposes
  authored chapter markers at
  `info.player_overlays.decorated_player_bar.player_bar.markers_map`, under
  the marker keyed `DESCRIPTION_CHAPTERS`, each with `title.text` and
  `time_range_start_millis`. Verified against a real seeded video
  (`rGPpQdbDbwo`, "React Server Components Change Everything") — returned 10
  real chapters with correct titles/timestamps.
- **Transcript — currently blocked.** The video's only caption track is
  `kind: "asr"` (auto-generated). Fetching its `base_url` (directly, and via
  `youtubei.js`'s `getTranscript()`) returns HTTP 200 with an empty body from
  every angle tried (raw XML, `&fmt=json3`, with a browser `User-Agent`
  header). Separately tried `yt-dlp` (industry-standard, more actively
  patched against YouTube's anti-scraping changes) — it currently fails with
  YouTube's own `"The page needs to be reloaded"` bot-check error. This is a
  current, external YouTube-side restriction on ASR caption delivery to
  unauthenticated/scripted clients, not a bug in our approach — and it may
  differ by network/environment or improve as these libraries patch against
  it.
- Per your call in the question panel: build the **real integration** (live
  `youtubei.js` fetch for both chapters and transcript) rather than falling
  back to authored fixtures, and make per-video transcript failure
  **non-fatal**: log it and still write the video document with real chapters
  and an empty `chunks: []`. Chapters alone are still useful — §7's two-stage
  timestamp resolution (chapters first, transcript as backstop) degrades
  gracefully to chapter-only matching when there's no transcript.

## Decisions & assumptions

- **Schema**: new `video` document type with `id` (string, the derived
  provider-prefixed ID), `url` (url), `chapters` (array of a new `videoChapter`
  object: `startSeconds` number, `label` string), `chunks` (array of a new
  `videoChunk` object: `startSeconds` number, `text` text). Matches §8 exactly
  — "an id and url, a chapters array of `{ startSeconds, label }`... and a
  chunks array of `{ startSeconds, text }`." No reference field back to
  lessons (§8: lessons link to videos by URL, not the reverse).
- **Document ID**: `video.<id>` where `id = "youtube-" + videoId`, sanitized by
  stripping anything outside `[A-Za-z0-9_-]` (§9's "stripping any characters
  the datastore rejects in ids" — a no-op for YouTube's already-safe 11-char
  IDs, but written generically so Vimeo/Bunny ingestion can reuse it later).
  Deterministic ID means re-running ingestion **converges** (creates or
  replaces the same doc) instead of duplicating, per the sanity-migration
  skill's defaults.
- **Input source**: parse `studio/scripts/seed/seed.ndjson` for `lesson`
  documents, collect the distinct set of `videoUrl` values (§8: "one per
  unique video URL" — some lessons could in principle share a video). Not
  `videos.json`, which is unused leftover metadata (see Code Inspected).
- **Only YouTube**: matches every seeded `videoUrl` and the only provider with
  both ingestion and playback today (§9's "don't treat a provider as
  supported until both exist" — no Vimeo/Bunny playback case exists in
  `VideoPlayer.tsx` either, so no Vimeo/Bunny ingestion this pass).
- **Chunking**: merge consecutive caption cues into chunks targeting ~20
  seconds of transcript each (accumulate cue text until the running span
  reaches the target, then flush), rather than one chunk per caption cue —
  keeps `chunks` "short timestamped pieces" (§8) without being so granular
  that search has to stitch together dozens of two-word fragments. 20s is a
  constant at the top of the script, easy to retune.
- **Caption track choice**: prefer a manually-authored English track over
  `asr` when both exist (manual captions are cleaner and, per the spike,
  might not be subject to the same ASR delivery restriction); otherwise use
  whatever English track is available; skip transcript entirely (empty
  `chunks`) if no English track exists or the fetch comes back empty.
  Non-English-only videos aren't in the seed data, so no i18n handling needed.
- **Failure isolation**: each video is ingested in its own try/catch. A
  chapter-fetch or transcript-fetch failure for one video never stops the
  batch; it's logged to stderr with the video ID and lesson slug(s) that use
  it, and the script's final summary lists every video with zero chapters
  and/or zero chunks so it's obvious what needs attention after a run.
- **Rate limiting**: a small fixed delay (500ms) between videos to avoid
  hammering YouTube during a batch of ~90 seeded videos.
- **Output format**: ndjson written to `studio/scripts/seed/videos.ndjson`,
  matching the existing `seed.ndjson`/`search-context.ndjson` convention
  exactly, imported the same way (`sanity dataset import ... --replace`). No
  write token, no live Sanity client in the script — it only ever reads local
  files and the public YouTube endpoints, then writes a local file.
- **Script runtime**: add `tsx` and `youtubei.js` as `studio` devDependencies;
  add a `studio/package.json` script `"ingest:videos": "tsx
  scripts/ingest-videos.ts"`. Lives in `studio/scripts/` since it's authoring
  tooling for the dataset, consistent with the existing `scripts/seed/`
  fixtures it reads from and writes to.

## Files expected to touch

- `studio/schemaTypes/objects/videoChapter.ts` (new)
- `studio/schemaTypes/objects/videoChunk.ts` (new)
- `studio/schemaTypes/documents/video.ts` (new)
- `studio/schemaTypes/index.ts` — register the three new types
- `studio/scripts/ingest-videos.ts` (new) — the pipeline
- `studio/scripts/seed/videos.ndjson` (new, generated by running the script,
  committed like the other seed fixtures so the dataset is reproducible)
- `studio/package.json` — add `tsx`, `youtubei.js` devDependencies; add
  `ingest:videos` script
- `studio/scripts/seed/videos.json` — delete: superseded by `videos.ndjson`,
  no longer needed once ingestion consumes `seed.ndjson` directly (confirm in
  review; flagged as a cleanup candidate, not a hard requirement)

## Requirements

- `video` schema matches §8's shape exactly: `id`, `url`, `chapters[]`
  (`startSeconds`, `label`), `chunks[]` (`startSeconds`, `text`). All required
  except `chapters`/`chunks` may be empty arrays (degraded video is still
  valid, per the spike's transcript-failure handling).
- Script is idempotent: running it twice produces the same `_id`s and the
  import uses `--replace` semantics, so reruns converge instead of
  duplicating documents.
- One `video` document per **unique** `videoUrl` across all seeded lessons
  (dedupe before fetching, not after).
- Chapters come from YouTube's own chapter markers (`DESCRIPTION_CHAPTERS`),
  never invented or derived from the transcript.
- Transcript chunks are grouped (~20s target), timestamped, short — never one
  giant string (§9/§12: "Keep whole transcripts out of anything the request
  path returns" — applies to how the data is shaped at rest, not just at query
  time).
- A transcript fetch failure for one video does not fail the batch or omit
  that video's chapters.
- Script prints a per-run summary: videos processed, videos with chapters,
  videos with transcript chunks, and an explicit list of videos with neither
  (so a human can decide whether to re-run, wait, or author fixtures for
  those specific ones later).
- No changes to the request path (`app/`) — this is purely offline tooling
  per AGENTS.md §5 ("It never runs in the request path").

## Security considerations

- No secrets involved: the script only reads local ndjson and calls public
  YouTube endpoints (no API key). Nothing is written to Sanity directly, so no
  write token is introduced.
- `studio/scripts/seed/videos.ndjson` is committed like the other seed
  fixtures — contains only public YouTube video IDs/URLs/captions/chapters,
  nothing sensitive.
- No user input reaches this script; it's operator-run offline tooling, not
  exposed via any route.

## Acceptance criteria

- `npx tsx studio/scripts/ingest-videos.ts` (or `npm run ingest:videos` from
  `studio/`) runs to completion against the real seeded lessons and produces
  `studio/scripts/seed/videos.ndjson` with one document per unique
  `videoUrl`.
- At least the videos confirmed in the spike (e.g. the React Server
  Components one) come back with real, non-empty `chapters`.
- The summary output clearly reports how many videos got transcript chunks
  vs. how many didn't, given the known current YouTube ASR restriction.
- `npx sanity dataset import studio/scripts/seed/videos.ndjson <dataset>
  --replace` succeeds and the documents are visible in Studio.
- Re-running the script and re-importing does not create duplicate documents
  (same `_id`s).
- Studio type check / schema extraction succeeds with the new types.

## Checks to run

- Studio: `npx tsc --noEmit` (or the studio's type-check equivalent — confirm
  exact command while implementing), `npx sanity schema extract` (validates
  the new schema compiles), `npx sanity deploy` only if needed to re-serve an
  updated schema to the MCP (not required for this pass since search wiring
  is out of scope, but harmless to confirm the deploy still succeeds).
- Manual: run the ingestion script for real against the live seeded lessons
  and inspect `videos.ndjson` for at least 3 videos — confirm chapters look
  real (not fabricated/empty placeholders) and note the transcript
  success/failure split.

## Manual test steps

1. `cd studio && npm install` (installs `tsx`, `youtubei.js`).
2. `npm run ingest:videos` — watch the console for per-video progress and the
   final summary (processed / with chapters / with chunks / with neither).
3. Open `studio/scripts/seed/videos.ndjson` and spot-check 2–3 entries:
   confirm `_id` is `video.youtube-<id>`, `url` matches the lesson's
   `videoUrl`, `chapters` have plausible timestamps/labels for a video you
   recognize (e.g. search youtube for the ID and compare against its actual
   chapter list).
4. `npx sanity dataset import studio/scripts/seed/videos.ndjson <dataset-name>
   --replace` — confirm it reports N documents created/updated with no errors.
5. In Sanity Studio, open a `video` document and confirm chapters/chunks
   render correctly in the array editors.
6. Re-run steps 2–4 once more — confirm the import reports the same
   documents replaced, not new ones (check the total video document count in
   Studio stays the same).

## Needs your attention (once implemented)

- `app/api/search/route.ts`'s system prompt and
  `studio/scripts/seed/search-context.ndjson`'s Instructions field both still
  say "no video document type yet" / "never produce a video result." Now that
  video documents exist, wiring `video`-kind results into search (chapters
  first, transcript fallback, per §7) is a follow-up task, not part of this
  one.
- Transcript coverage depends on YouTube's current ASR-delivery restriction
  (see spike above) — expect some/most videos to end up with real chapters
  but empty `chunks` until that loosens, a caption library patches around it,
  or we revisit with an authored-fixture fallback for the videos that matter
  most.
