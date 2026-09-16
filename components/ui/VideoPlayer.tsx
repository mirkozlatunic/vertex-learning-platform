"use client";

import { cn } from "@/lib/cn";
import { captureEvent } from "@/lib/posthog-client";
import { getYouTubeEmbedUrl } from "@/lib/video";

export type VideoPlayerProps = {
  videoUrl: string;
  title: string;
  lessonId: string;
  className?: string;
};

export function VideoPlayer({ videoUrl, title, lessonId, className }: VideoPlayerProps) {
  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  if (!embedUrl) {
    return (
      <div
        className={cn(
          "flex aspect-video w-full items-center justify-center rounded-md bg-neutral-900 text-sm font-sans text-white/70",
          className,
        )}
      >
        Video unavailable
      </div>
    );
  }

  return (
    <div className={cn("aspect-video w-full overflow-hidden rounded-md bg-neutral-900", className)}>
      <iframe
        className="h-full w-full"
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={() => captureEvent("lesson_video_loaded", { lesson_id: lessonId })}
      />
    </div>
  );
}
