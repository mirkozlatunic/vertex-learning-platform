import { z } from "zod";

/**
 * A single flat shape rather than a discriminated union: OpenAI's structured
 * output mode rejects `oneOf` nested inside an array's `items` (the JSON
 * Schema a Zod discriminated union compiles to). Video-only fields are
 * nullable instead, and null for every "lesson" result.
 */
export const searchResultSchema = z.object({
  kind: z.enum(["lesson", "video"]),
  courseId: z.string(),
  courseTitle: z.string(),
  courseSlug: z.string(),
  moduleTitle: z.string(),
  /** 1-based position of the module within the course's modules array. */
  moduleNumber: z.number().int().positive(),
  /** 1-based position of the lesson within *that module's* lessons array (e.g. the "1" in "Lesson 5.1"). */
  lessonNumber: z.number().int().positive(),
  lessonTitle: z.string(),
  lessonSlug: z.string(),
  description: z.string(),
  /** Lesson's "in this lesson you will" points. Null for "video" results. */
  keyPoints: z.array(z.string()).nullable(),
  /**
   * Video-moment fields, populated for `kind: "video"` results via two-stage
   * timestamp resolution (chapters first, transcript fallback — AGENTS.md
   * §7-9). Null for `kind: "lesson"` results.
   */
  matchedSecond: z.number().int().nonnegative().nullable(),
  clipLengthSeconds: z.number().int().positive().nullable(),
  thumbnailUrl: z.string().nullable(),
});

export const searchResponseSchema = z.object({
  results: z.array(searchResultSchema),
});

export type SearchResult = z.infer<typeof searchResultSchema>;

export type SearchResponse = {
  query: string;
  resultCount: number;
  courseCount: number;
  results: SearchResult[];
};
