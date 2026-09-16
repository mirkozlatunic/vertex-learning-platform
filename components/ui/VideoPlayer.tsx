"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/cn";
import { captureEvent } from "@/lib/posthog-client";
import { getYouTubeEmbedUrl } from "@/lib/video";

export type VideoPlayerProps = {
  videoUrl: string;
  title: string;
  lessonId: string;
  courseId?: string | null;
  startSeconds?: number;
  /** Where startSeconds came from — only "resume" is a real resume (a search deep link is not). */
  startSource?: "search" | "resume";
  className?: string;
};

const WATCH_DEPTH_THRESHOLDS = [25, 50, 75, 100] as const;
const COMPLETE_THRESHOLD_PERCENT = 90;
const POSITION_SAVE_INTERVAL_MS = 15_000;
const POLL_INTERVAL_MS = 5_000;

type YTPlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};

type YTPlayerOptions = {
  events: { onStateChange: (event: { data: number }) => void };
};

declare global {
  interface Window {
    YT?: {
      Player: new (elementId: string, options: YTPlayerOptions) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiLoadPromise: Promise<void> | null = null;

function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiLoadPromise) return apiLoadPromise;

  apiLoadPromise = new Promise((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return apiLoadPromise;
}

function postProgress(
  body: Record<string, unknown>,
  options: { useBeacon?: boolean } = {},
) {
  const payload = JSON.stringify(body);
  if (options.useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/progress", new Blob([payload], { type: "application/json" }));
    return;
  }
  fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

/** Like postProgress, but reports success so a caller can retry on failure. Never uses sendBeacon (fire-and-forget only). */
async function postProgressAwaited(body: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function VideoPlayer({
  videoUrl,
  title,
  lessonId,
  courseId,
  startSeconds,
  startSource,
  className,
}: VideoPlayerProps) {
  const embedUrl = getYouTubeEmbedUrl(videoUrl, startSeconds);
  const iframeId = `yt-player-${lessonId}`;
  const { isSignedIn } = useAuth();

  const isSignedInRef = useRef(isSignedIn);
  useEffect(() => {
    isSignedInRef.current = isSignedIn;
  }, [isSignedIn]);

  const playerRef = useRef<YTPlayer | null>(null);
  const hasPlayedRef = useRef(false);
  const depthFiredRef = useRef<Set<number>>(new Set());
  const completedRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const positionSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastKnownPositionRef = useRef(0);
  const hasPositionSampleRef = useRef(false);

  useEffect(() => {
    if (!embedUrl) return;
    let cancelled = false;

    function clearPoll() {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }

    function savePosition(useBeacon = false) {
      if (!isSignedInRef.current || !hasPositionSampleRef.current) return;
      postProgress(
        { lessonId, action: "position", positionSeconds: Math.round(lastKnownPositionRef.current) },
        { useBeacon },
      );
    }

    function markComplete() {
      if (!isSignedInRef.current || completedRef.current) return;
      completedRef.current = true;
      postProgressAwaited({ lessonId, courseId: courseId ?? null, action: "complete" }).then((ok) => {
        if (!ok) completedRef.current = false;
      });
    }

    function handleStateChange(event: { data: number }) {
      const YT = window.YT;
      const player = playerRef.current;
      if (!YT || !player) return;

      if (event.data === YT.PlayerState.PLAYING) {
        if (!hasPlayedRef.current) {
          hasPlayedRef.current = true;
          captureEvent("video_play", {
            lesson_id: lessonId,
            course_id: courseId ?? null,
            resumed: startSource === "resume",
          });
        }

        clearPoll();
        pollRef.current = setInterval(() => {
          const duration = player.getDuration();
          const current = player.getCurrentTime();
          if (!duration) return;
          lastKnownPositionRef.current = current;
          hasPositionSampleRef.current = true;
          const percent = (current / duration) * 100;

          for (const threshold of WATCH_DEPTH_THRESHOLDS) {
            if (percent >= threshold && !depthFiredRef.current.has(threshold)) {
              depthFiredRef.current.add(threshold);
              captureEvent("video_watch_depth", {
                lesson_id: lessonId,
                course_id: courseId ?? null,
                depth_percent: threshold,
              });
            }
          }
          if (percent >= COMPLETE_THRESHOLD_PERCENT) markComplete();
        }, POLL_INTERVAL_MS);

        if (!positionSaveRef.current) {
          positionSaveRef.current = setInterval(() => savePosition(), POSITION_SAVE_INTERVAL_MS);
        }
      } else if (event.data === YT.PlayerState.ENDED) {
        clearPoll();
        if (!depthFiredRef.current.has(100)) {
          depthFiredRef.current.add(100);
          captureEvent("video_watch_depth", { lesson_id: lessonId, course_id: courseId ?? null, depth_percent: 100 });
        }
        markComplete();
      } else {
        clearPoll();
      }
    }

    loadYouTubeIframeApi().then(() => {
      if (cancelled || !window.YT) return;
      playerRef.current = new window.YT.Player(iframeId, { events: { onStateChange: handleStateChange } });
    });

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") savePosition(true);
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      savePosition(true);
      clearPoll();
      if (positionSaveRef.current) {
        clearInterval(positionSaveRef.current);
        positionSaveRef.current = null;
      }
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [embedUrl, iframeId, lessonId, courseId, startSource]);

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
        id={iframeId}
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
