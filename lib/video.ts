/**
 * Only YouTube is supported: it's the only provider with seeded video URLs.
 * Add Vimeo/Bunny here once both ingestion and an embed case exist for them (AGENTS.md §9).
 */
export function getYouTubeEmbedUrl(videoUrl: string, startSeconds?: number): string | null {
  let url: URL
  try {
    url = new URL(videoUrl)
  } catch {
    return null
  }

  let videoId: string | null = null
  if (url.hostname === "youtu.be") {
    videoId = url.pathname.slice(1);
  } else if (url.hostname.endsWith("youtube.com")) {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    } else if (url.pathname.startsWith("/embed/")) {
      videoId = url.pathname.replace("/embed/", "");
    }
  }

  if (!videoId) return null;
  const params = new URLSearchParams({ enablejsapi: "1" });
  if (startSeconds != null && Number.isFinite(startSeconds) && startSeconds > 0) {
    params.set("start", String(Math.round(startSeconds)));
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
