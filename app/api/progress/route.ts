import "server-only";

import { auth } from "@clerk/nextjs/server";
import { captureServerEvent } from "@/lib/posthog-server";
import { markLessonComplete, saveLessonPosition } from "@/lib/progress";

type ProgressBody = {
  lessonId?: unknown;
  courseId?: unknown;
  action?: unknown;
  positionSeconds?: unknown;
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ProgressBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { lessonId, courseId, action, positionSeconds } = body;
  if (typeof lessonId !== "string" || !lessonId) {
    return Response.json({ error: "lessonId is required" }, { status: 400 });
  }
  if (action !== "position" && action !== "complete") {
    return Response.json({ error: 'action must be "position" or "complete"' }, { status: 400 });
  }

  try {
    if (action === "position") {
      if (typeof positionSeconds !== "number" || !Number.isFinite(positionSeconds) || positionSeconds < 0) {
        return Response.json({ error: "positionSeconds must be a non-negative number" }, { status: 400 });
      }
      await saveLessonPosition(userId, lessonId, positionSeconds);
      return Response.json({ ok: true });
    }

    const wasNewlyCompleted = await markLessonComplete(userId, lessonId);
    if (wasNewlyCompleted) {
      await captureServerEvent(userId, "lesson_completed", {
        lesson_id: lessonId,
        course_id: typeof courseId === "string" ? courseId : null,
      });
    }
    return Response.json({ ok: true, wasNewlyCompleted });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
