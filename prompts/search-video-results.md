# Wire video-moment results into search: two-stage timestamp resolution

## Goal

`app/api/search/route.ts` and `studio/scripts/seed/search-context.ndjson` were
deliberately built lesson-only because no `video` document type existed yet
(flagged as a follow-up at the end of `prompts/video-ingestion-pipeline.md`).
That pipeline now exists and `videos.ndjson` (120 documents, real chapters,
partial transcript coverage) has been generated. This pass wires `kind:
"video"` results back into the search agent: match a query against a video's
chapters first, fall back to transcript chunks only when no chapter matches,
and resolve each match to its owning lesson for a timestamped deep link.

The result card deep link (`/lessons/[slug]?t=<second>`) and the lesson page's
embedded YouTube player seeking to that second via `getYouTubeEmbedUrl`'s
`start` param are **already built and already correct** — confirmed by
reading `components/ui/SearchResultCard.tsx`, `app/lessons/[slug]/page.tsx`,
`components/ui/VideoPlayer.tsx`, and `lib/video.ts`. No changes needed there.
This pass is entirely about getting the search agent to *produce* grounded
`video` results — no application code changes, no schema changes.

## Skills read

- `dial-your-context` — format for the Context document's Instructions field
  (deltas only, nothing the schema already makes obvious). Applied to the
  rewrite of `search-context.ndjson`'s Instructions.
- `create-agent-with-sanity-context` (`references/system-prompts.md`) —
  confirms query-pattern guidance belongs in the system prompt as concrete
  GROQ examples, not abstract rules, which is how the existing lesson-topic
  pattern in both `route.ts` and `search-context.ndjson` is already written.

## Code inspected

- `app/api/search/route.ts` — inline `SYSTEM_PROMPT` currently hard-codes
  "there is no video transcript or chapter data in this dataset yet" and
  instructs the model to always set `kind: "lesson"` and leave
  `matchedSecond`/`clipLengthSeconds`/`thumbnailUrl` null. This is the main
  edit target.
- `studio/scripts/seed/search-context.ndjson` — the live Context document's
  `groqFilter` is `_type in ["course", "lesson", "instructor", "category"]`
  (no `video`) and its Instructions field's "Known limitations" section
  repeats the same stale claim. Both need updating.
- `lib/search-schema.ts` — `SearchResult` already has `kind: "video"` and the
  nullable `matchedSecond`/`clipLengthSeconds`/`thumbnailUrl` fields, with a
  comment noting they're "structurally supported now" pending the pipeline.
  No schema change needed; only that comment is now stale (will update it as
  part of the edit for accuracy, not because it affects behavior).
- `studio/schemaTypes/documents/video.ts`, `objects/videoChapter.ts`,
  `objects/videoChunk.ts` — confirmed shape: `video.id` (e.g.
  `"youtube-9602Yzvd7ik"`), `video.url` (matches a lesson's `videoUrl`
  exactly, not a reference), `chapters[]{ startSeconds, label }`,
  `chunks[]{ startSeconds, text }`. No reference from video back to lesson —
  resolving the owning lesson means querying
  `*[_type == "lesson" && videoUrl == $url][0]`.
- `studio/scripts/seed/videos.ndjson` — spot-checked real entries: chapters
  are present and clean; transcript chunk coverage is partial (YouTube ASR
  restriction noted in the ingestion prompt), so some videos will only ever
  match on chapters. That's expected, not a bug — the fallback stays a
  fallback, not a requirement.
- `lib/video.ts` — confirms only YouTube is supported today, and its ID
  extraction; used this to design the thumbnail derivation below.
- `components/ui/SearchResultCard.tsx` — video-kind rendering already reads
  `thumbnailUrl`, `clipLengthSeconds` (rendered via `formatTimestamp`), and
  `matchedSecond` (drives both the "Watch from Xm Ys" label and the `?t=`
  link). Confirms the exact shape/units the agent must produce:
  `clipLengthSeconds` is a duration (seconds), `matchedSecond` is an absolute
  offset into the video.
- AGENTS.md §12 — "Never return a whole transcript or chunks array to the
  model... Fetch only the filtered matches, a few per video." Drove the GROQ
  patterns below (filtered array projections, never the full array).

## Decisions & assumptions

- **Query direction**: search still runs both directions per AGENTS.md §11 —
  lesson-topic match (unchanged) and video-moment match (new). For the
  video-moment direction: query the `video` type's `chapters` first; only
  query `chunks` as a fallback for terms that produced no chapter match
  anywhere. This is the literal two-stage resolution from AGENTS.md §7.
- **Resolving the owning lesson**: a video document has no back-reference, so
  every video match must be joined via `*[_type == "lesson" && videoUrl ==
  <matched video's url>][0]`. If no lesson references that URL, the match is
  dropped (AGENTS.md §11: "a video result is always tied to the lesson that
  uses that video, never shown on its own"). Course/module/lesson labeling
  reuses the exact reverse-reference and array-order-numbering pattern
  already documented for lesson results.
- **One video result per lesson per query**: AGENTS.md §11 describes "a
  lesson's video matched at a specific moment" (singular). Instructing the
  model to keep only the single best (most specific / earliest-ranked) match
  per lesson rather than emitting one card per matching chapter — avoids
  flooding results with near-duplicate cards for the same lesson.
- **`clipLengthSeconds` derivation**: computed in GROQ via a projected
  `endSeconds` — the next chapter's (or chunk's) `startSeconds` after the
  matched one, using `^` to reference the parent array from inside the
  filtered projection:
  ```
  chapters[label match $t]{
    startSeconds,
    label,
    "endSeconds": ^.chapters[startSeconds > ^.startSeconds][0].startSeconds
  }
  ```
  This returns only the matched items (never the whole array, per §12) while
  still giving the model enough to compute a duration. `clipLengthSeconds =
  endSeconds - startSeconds` when `endSeconds` exists; for the last
  chapter/chunk (no `endSeconds`), fall back to the lesson's own `duration`
  field minus `startSeconds` — grounded in a real field, not invented. Same
  pattern for `chunks`.
- **`thumbnailUrl` derivation**: `video.id` is provider-prefixed
  (`"youtube-<videoId>"`). For YouTube (the only supported provider today,
  per `lib/video.ts`), the thumbnail is deterministic:
  `"https://img.youtube.com/vi/" + id[7:] + "/hqdefault.jpg"` (GROQ string
  slicing strips the 7-character `"youtube-"` prefix, safe regardless of `-`
  or `_` inside the video ID itself, unlike splitting on `-`). Instructing
  the model to only derive this when `id` starts with `"youtube-"` and leave
  `thumbnailUrl` null otherwise, so this degrades safely if a non-YouTube
  video document ever appears before that provider has ingestion+playback
  (AGENTS.md §9).
- **Content scope**: `video` must be added to the Context document's
  `groqFilter` so the agent can query it at all — but the instructions
  explicitly state it's an internal lookup joined onto lessons, never
  surfaced as its own result, matching AGENTS.md §7's "Treat these documents
  as an internal lookup and never show them to the user as results."
- **No code changes to the results UI, video player, or schema** — this pass
  only changes what the agent is told to query and produce. The stale
  doc-comment in `lib/search-schema.ts` gets a one-line accuracy update.

## Files expected to touch

- `app/api/search/route.ts` — rewrite the video-related portion of
  `SYSTEM_PROMPT`: remove the "no video data" instruction, add the two-stage
  chapters-then-chunks query patterns, the lesson-join pattern, the
  one-result-per-lesson rule, and the `clipLengthSeconds`/`thumbnailUrl`
  derivation rules.
- `studio/scripts/seed/search-context.ndjson` — add `"video"` to `groqFilter`;
  replace the "Known limitations" paragraph in `instructions` with the same
  query-pattern guidance (kept as short deltas per `dial-your-context`,
  mirroring, not duplicating verbatim, the inline prompt).
- `lib/search-schema.ts` — update the now-stale comment on the video fields
  (no behavior change).

## Requirements

- A query matching a video's chapter label produces a `kind: "video"` result
  with `matchedSecond` equal to that chapter's `startSeconds`.
- A query with no chapter match anywhere, but a transcript chunk match, still
  produces a `kind: "video"` result via the chunk fallback — confirming the
  two-stage order is actually enforced, not just documented.
- A query matching both a chapter and a transcript chunk in the same video
  uses the chapter match (chapters take priority, per AGENTS.md §7).
- Every video result's `lessonSlug`/`courseSlug`/`moduleTitle`/module and
  lesson numbers resolve to a real lesson that actually references that
  video's `url` — never a fabricated or mismatched lesson.
- `clipLengthSeconds` is a positive integer derived from real chapter/chunk
  boundaries or the lesson's real `duration` field — never invented, never
  null when `matchedSecond` is non-null.
- `thumbnailUrl` is only populated for `youtube-`-prefixed video ids, using
  the deterministic derivation above; null otherwise.
- At most one `video` result per lesson per query (the best match).
- Lesson-topic (`kind: "lesson"`) results and behavior are unchanged.
- The `video` document type itself is never returned to the user as a
  standalone result.
- Videos with empty `chunks` (no transcript, per the ingestion pipeline's
  known ASR gaps) still match correctly via chapters alone — the fallback
  path is only exercised when needed, never required.

## Security considerations

- No new tokens, routes, or write paths. Same MCP client, same viewer-role
  read token, same response validation via `searchResponseSchema` already in
  place (AGENTS.md §5/§12 boundaries unchanged).
- No user input is newly concatenated into GROQ — the model still constructs
  GROQ itself via the MCP's `groq_query` tool, same as the existing
  lesson-topic path.

## Acceptance criteria

- `curl -X POST /api/search` with a query matching a known seeded chapter
  label (e.g. a term from a chapter in `videos.ndjson`) returns a `kind:
  "video"` result with a correct `matchedSecond`, non-null
  `clipLengthSeconds`, and (for YouTube) a working `thumbnailUrl`.
- The same query's result links to `/lessons/<slug>?t=<matchedSecond>` and,
  loaded in the browser, the embedded player starts at that second (manual
  check — playback code is unchanged but this pass is what finally exercises
  it end-to-end with real data).
- A query that only matches transcript text (not any chapter label) still
  returns a video result — proves the fallback path works.
- A query matching multiple chapters within one lesson returns only one
  video result for that lesson.
- Lesson-topic results are unaffected by this change (regression check).
- Type check and lint pass in the web workspace.

## Checks to run

- Web: `npm run lint`, `npx tsc --noEmit` (or the project's exact type-check
  command), `npm run build` (route changed).
- Studio: `npx sanity dataset import studio/scripts/seed/search-context.ndjson
  <dataset> --replace` to push the updated Context document (content-only
  change, no schema/deploy needed).
- Manual: verify against the live MCP endpoint per the test steps below.
  Restart the dev server after editing `route.ts` — AGENTS.md §12: inline
  system prompt changes only take effect on restart, unlike Context document
  edits which apply on the next request.

## Manual test steps

1. Confirm `studio/scripts/seed/videos.ndjson` has already been imported to
   the live dataset (`npx sanity dataset import
   studio/scripts/seed/videos.ndjson <dataset> --replace` from `studio/`, if
   not already done).
2. `npx sanity dataset import studio/scripts/seed/search-context.ndjson
   <dataset> --replace` from `studio/` to push the updated Context document.
3. Restart the dev server (`npm run dev` from the repo root) so the updated
   inline system prompt takes effect.
4. Pick a real chapter label from `studio/scripts/seed/videos.ndjson` (e.g.
   `"Understanding File-Based Routing"`) and run:
   `curl -X POST http://localhost:3000/api/search -H "Content-Type:
   application/json" -d '{"query":"file based routing"}'` — confirm a `kind:
   "video"` result with a `matchedSecond` matching that chapter's
   `startSeconds`, a non-null `clipLengthSeconds`, and a `thumbnailUrl` of the
   form `https://img.youtube.com/vi/<id>/hqdefault.jpg`.
5. Find a video in `videos.ndjson` with non-empty `chunks` but no chapter
   covering a specific phrase inside a chunk's `text`; search for that phrase
   and confirm a video result still comes back (chunk fallback).
6. In the browser, go to `/search?q=<same query>` and click "Watch from
   <timestamp>" on a video result — confirm it lands on the lesson page with
   the player starting at the matched second.
7. Re-run a lesson-topic query from `prompts/search.md`'s original test steps
   (e.g. an exact seeded lesson title) — confirm lesson results still rank
   and render exactly as before.
