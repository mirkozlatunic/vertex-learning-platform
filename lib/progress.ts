import "server-only";

import { randomUUID } from "node:crypto";
import { client } from "@/sanity/lib/client";
import { writeClient } from "@/sanity/lib/writeClient";

type Ref = { _type: "reference"; _ref: string };
type LessonPosition = { lesson: Ref; positionSeconds: number; updatedAt: string; _key: string };
type CompletedLesson = { lesson: Ref; completedAt: string; _key: string };

function progressDocId(userId: string): string {
  return `progress.${userId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

export async function getLessonProgress(
  userId: string,
  lessonId: string,
): Promise<{ positionSeconds: number | null; completed: boolean }> {
  const result = await client.fetch<{ positionSeconds: number | null; completed: boolean } | null>(
    `*[_id == $id][0]{
      "positionSeconds": lessonPositions[lesson._ref == $lessonId][0].positionSeconds,
      "completed": count(completedLessons[lesson._ref == $lessonId]) > 0
    }`,
    { id: progressDocId(userId), lessonId },
  );
  return result ?? { positionSeconds: null, completed: false };
}

export async function getCompletedLessonIds(userId: string): Promise<Set<string>> {
  const refs = await client.fetch<string[]>(`*[_id == $id][0].completedLessons[].lesson._ref`, {
    id: progressDocId(userId),
  });
  return new Set(refs ?? []);
}

function assertWritable(): NonNullable<typeof writeClient> {
  if (!writeClient) {
    throw new Error("SANITY_API_WRITE_TOKEN is not set");
  }
  return writeClient;
}

const MAX_OPTIMISTIC_RETRIES = 3;

/**
 * Retries a read-modify-write against `doc._rev` so concurrent writers (e.g. a
 * position save racing the unmount beacon) don't silently clobber each
 * other's update instead of one losing cleanly and retrying.
 */
async function withOptimisticRetry(
  write: NonNullable<typeof writeClient>,
  id: string,
  attempt: (rev: string) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < MAX_OPTIMISTIC_RETRIES; i++) {
    const doc = await write.fetch<{ _rev: string } | null>(`*[_id == $id][0]{_rev}`, { id });
    const rev = doc?._rev;
    if (!rev) return;
    try {
      await attempt(rev);
      return;
    } catch (error) {
      if (i === MAX_OPTIMISTIC_RETRIES - 1) throw error;
    }
  }
}

async function ensureProgressDoc(userId: string): Promise<string> {
  const id = progressDocId(userId);
  const write = assertWritable();
  await write.createIfNotExists({
    _id: id,
    _type: "progress",
    userId,
    completedLessons: [],
    lessonPositions: [],
  });
  return id;
}

export async function saveLessonPosition(
  userId: string,
  lessonId: string,
  positionSeconds: number,
): Promise<void> {
  const write = assertWritable();
  const id = await ensureProgressDoc(userId);

  await withOptimisticRetry(write, id, async (rev) => {
    const doc = await write.fetch<{ lessonPositions: LessonPosition[] } | null>(
      `*[_id == $id][0]{lessonPositions}`,
      { id },
    );
    const next: LessonPosition[] = (doc?.lessonPositions ?? []).filter((p) => p.lesson._ref !== lessonId);
    next.push({
      _key: randomUUID(),
      lesson: { _type: "reference", _ref: lessonId },
      positionSeconds,
      updatedAt: new Date().toISOString(),
    });
    await write.patch(id).ifRevisionId(rev).set({ lessonPositions: next }).commit();
  });
}

/** Returns whether this lesson was newly marked complete (false if it already was). */
export async function markLessonComplete(userId: string, lessonId: string): Promise<boolean> {
  const write = assertWritable();
  const id = await ensureProgressDoc(userId);

  let wasNewlyCompleted = false;

  await withOptimisticRetry(write, id, async (rev) => {
    const doc = await write.fetch<{ completedLessons: CompletedLesson[] } | null>(
      `*[_id == $id][0]{completedLessons}`,
      { id },
    );
    const existing = doc?.completedLessons ?? [];
    if (existing.some((c) => c.lesson._ref === lessonId)) {
      wasNewlyCompleted = false;
      return;
    }

    const next: CompletedLesson[] = [
      ...existing,
      {
        _key: randomUUID(),
        lesson: { _type: "reference", _ref: lessonId },
        completedAt: new Date().toISOString(),
      },
    ];
    await write.patch(id).ifRevisionId(rev).set({ completedLessons: next }).commit();
    wasNewlyCompleted = true;
  });

  return wasNewlyCompleted;
}
