# Analytics: full engagement tracking + minimal progress feature

## Goal

Instrument PostHog analytics for the engagement moments AGENTS.md §7 calls out
(search performed, video play, watch depth, lesson completed, resume used) plus
the moments already partially wired (search result selected). Two of these
events — `resume_used` and `lesson_completed` — need a real signal to fire on,
and there is currently no progress feature at all (no schema, no server route,
no saved position, no completion state). The user chose, when asked, to build
the **minimal** progress feature now (server route + Clerk-keyed Sanity record)
rather than fake these events with heuristics — see decision log below.

Keep this to what the two features need. No catalog/course-page progress
badges, no "continue watching" rail, no Notes persistence — those need design
images per AGENTS.md §3 and are out of scope here.

## Skills / docs read

- AGENTS.md §5 (server/client boundaries), §7 (progress, analytics), §8 (data
  shape: progress record keyed by Clerk user id), §12 (private token rules).
- `node_modules/next/dist/docs/` — route handlers, middleware.
- `integration-nextjs-app-router` skill (PostHog Next.js patterns) — will
  reload during implementation for exact event-naming conventions (snake_case
  events, `$` only for PostHog-reserved properties) and `posthog-node` setup
  for server capture with a shutdown-safe client.

## Code inspected

- `lib/posthog-client.ts` — client capture helper + `PostHogEventName` union
  (exhaustive by design; every new client event must be added here).
- `instrumentation-client.ts` — client `posthog.init` (public token, `2026-05-30`
  defaults, exception capture on).
- `components/PostHogIdentity.tsx` — **currently sends `email` and `name`** to
  `posthog.identify`. That's PII beyond the Clerk user id, contradicting this
  task's "don't track PII beyond the Clerk user ID" instruction. Fixing this
  is in scope since it's directly what was asked — I'll drop those two fields
  and identify with just the Clerk user id.
- Existing capture sites: `LessonResourceItem`, `LessonTabs`, `CourseCardLink`,
  `LessonSidebar`, `CourseContent`, `SearchResultsView`, `VideoPlayer`, `Navbar`.
  `search_performed` and `search_result_selected` already fire client-side in
  `SearchResultsView.tsx` (uncommitted, in-flight) — I'll extend/rename their
  properties to match the naming convention below, not duplicate them.
- `components/ui/VideoPlayer.tsx` — plain `<iframe>`, no YouTube IFrame API,
  `lesson_video_loaded` fires on `onLoad` (iframe mount, not play). No way to
  know play/pause/watched-seconds today.
- `lib/video.ts` — `getYouTubeEmbedUrl(videoUrl, startSeconds)`, YouTube only.
  Will add `enablejsapi=1` and an `enablejsapi` param / iframe `id` handling
  for the player API to attach.
- `app/lessons/[slug]/page.tsx` — server component, no auth check, `t` query
  param sets `startSeconds` (search deep link only, today). Passes
  `lesson._id` as `lessonId` everywhere.
- `sanity/lib/data.ts`, `sanity/lib/client.ts`, `sanity/env.server.ts` —
  read-only client, `SANITY_API_READ_TOKEN`. No write client, no write token.
- `components/ui/LessonSidebar.tsx` — already renders `<ProgressBar value={0} />`
  (hardcoded) and `StatusIndicator status="now-playing"`; `StatusIndicator`
  already defines a `"completed"` status. These are existing design slots I'll
  wire to real data rather than invent new UI.
- `app/layout.tsx` — `ClerkProvider` wraps the app; **no `middleware.ts`
  exists**, so `auth()` has no request context yet anywhere in the app.
- `app/api/search/route.ts` — the one existing route handler; pattern to
  follow for env validation, error responses, `"server-only"` import.
- `package.json` — no `posthog-node`, no `@sanity/client` write helper beyond
  `next-sanity`'s `createClient` (already used for reads).
- `.env.example` — no `SANITY_API_WRITE_TOKEN`, no server PostHog key.
- `studio/schemaTypes/index.ts` — current schema list (course, lesson,
  instructor, category, video + objects). Will add a `progress` document type.

## Decision log

- **Resume/completion approach**: asked the user directly since AGENTS.md
  defines progress as a real per-user Sanity record written through a server
  route, not a client heuristic. User chose to build that minimal feature now.
- **Progress document shape**: one Sanity document per learner, `_id` deterministic
  as `progress.<clerkUserId>` (sanitized), so writes are `createIfNotExists` +
  `patch` with no read-before-write race. Fields: `userId`, `completedLessons`
  (array of `{ _key, lesson: reference, completedAt }`), `lessonPositions`
  (array of `{ _key, lesson: reference, positionSeconds, updatedAt }`). This
  matches AGENTS.md §8's "which lessons they completed and their last position
  in a lesson" exactly, no more.
- **Auth wiring**: adding `middleware.ts` with `clerkMiddleware()` and the
  default matcher, gating nothing (public browsing stays public per AGENTS.md
  §7) — it's required for `auth()` to have request context in route handlers
  at all, not a new access restriction.
- **Completion trigger**: auto-mark complete when YouTube reports ≥90% watched
  (via IFrame API `getCurrentTime`/`getDuration` polling) or on the `ENDED`
  state, whichever first. No manual "mark complete" button — no design
  reference for one, and the auto rule is a standard LMS threshold.
- **Resume trigger**: lesson page (server component) reads the learner's saved
  `lessonPositions` entry for this lesson. If no `?t=` query override is
  present and a saved position exists (and is more than a few seconds in and
  not within the last ~15s of the video), it's passed to `VideoPlayer` as the
  start point with an explicit `startSource="resume"` prop (as opposed to
  `startSource="search"` when `?t=` set it). `resume_used` only fires for the
  `"resume"` source, so a search deep link never gets double-counted as a resume.
- **Server vs. client capture**: per AGENTS.md §5/§13, the progress route is a
  server action with no browser-visible effect to "click" on — so `lesson_completed`
  and `resume_used` are captured **server-side** (via `posthog-node`) inside
  the `/api/progress` route, keyed by Clerk user id, at the moment the write
  actually succeeds — not client-side on optimistic UI state. `video_play` and
  `watch_depth` are genuinely client-only signals (iframe player state) and
  stay client-side. `search_performed` stays where it already fires (client,
  after the fetch resolves) since the search route itself doesn't know the
  final rendered result count the UI computes — no change there.

## Event list (final)

Client-side (`lib/posthog-client.ts`, `posthog-js`):

| event | fires when | properties |
|---|---|---|
| `search_performed` | search API call resolves | `query`, `result_count`, `course_count` |
| `search_result_selected` | a result card is clicked | `kind` (`lesson`\|`video`), `course_slug`, `lesson_slug` |
| `video_play` | YouTube state → PLAYING, first time per mount | `lesson_id`, `course_id`, `resumed` (bool) |
| `video_watch_depth` | playback crosses 25/50/75/100% of duration, each once per mount | `lesson_id`, `course_id`, `depth_percent` (25\|50\|75\|100) |

Server-side (`app/api/progress/route.ts`, `posthog-node`):

| event | fires when | properties |
|---|---|---|
| `lesson_completed` | POST marks a lesson complete and it wasn't already | `lesson_id`, `course_id` |
| `resume_used` | GET is served and the response includes a resume position that the lesson page will use (i.e., no `?t=` override) | `lesson_id`, `course_id`, `resume_seconds` |

All events are `snake_case`, properties are `snake_case`, no PII beyond the
Clerk user id (which PostHog already has via `identify`). No event carries
email, name, free-text notes, or full URLs with query strings.

`PostHogIdentity.tsx`: drop `email`/`name` from `posthog.identify`, keep the
Clerk user id only.

## Files expected to touch

New:
- `middleware.ts` — `clerkMiddleware()`, default matcher.
- `studio/schemaTypes/documents/progress.ts` — progress document schema.
- `sanity/lib/writeClient.ts` — server-only write client (mirrors `client.ts`).
- `sanity/env.server.ts` — add `apiWriteToken`.
- `app/api/progress/route.ts` — GET (read this user's position/completion for
  a lesson) and POST (save position / mark complete) route handlers.
- `lib/posthog-server.ts` — thin `posthog-node` wrapper (init once, `capture`,
  `shutdown` on route completion per Vercel serverless guidance from the
  `integration-nextjs-app-router` skill).

Edited:
- `lib/posthog-client.ts` — add `video_play`, `video_watch_depth` to the event
  union; adjust `search_performed`/`search_result_selected` property shapes if
  the skill's naming conventions call for it.
- `components/PostHogIdentity.tsx` — remove email/name.
- `components/ui/VideoPlayer.tsx` — YouTube IFrame API integration (load
  `iframe_api` script once, `onStateChange`, poll `getCurrentTime` while
  playing, compute watch-depth thresholds, POST position periodically + on
  unmount/`visibilitychange`, `startSource` prop).
- `lib/video.ts` — `enablejsapi=1` + a stable iframe id/origin param.
- `app/lessons/[slug]/page.tsx` — `auth()` call, fetch saved progress
  (skip if signed out), decide `startSeconds`/`startSource`, pass course id
  to `VideoPlayer`, wire real values into `LessonSidebar`'s `ProgressBar` and
  the current lesson's `StatusIndicator` (`completed` vs `now-playing`).
- `components/ui/LessonSidebar.tsx` — accept a `completedLessonIds`/`progressPercent`
  prop instead of hardcoded `0`; render `StatusIndicator status="completed"`
  for completed lessons in the list.
- `studio/schemaTypes/index.ts` — register `progress`.
- `.env.example` — add `SANITY_API_WRITE_TOKEN` (server-only write token) and
  the `posthog-node` server key if the skill's pattern needs one distinct from
  the public project token (else reuse `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`
  server-side, since PostHog's ingestion key is the same value for client and
  server capture — confirming this against the skill before deciding).
- `package.json` — add `posthog-node`.

## Security / boundary considerations

- Write token stays server-only (`sanity/env.server.ts`, never imported by a
  client component) — same pattern as `apiReadToken`.
- `/api/progress` POST requires `auth()` to return a `userId`; 401 otherwise.
  GET likewise — no anonymous reads of another user's progress; the document
  id is derived from the *authenticated* user's id server-side, never taken
  from the request body/query.
- Progress document id derivation sanitizes the Clerk user id the same way
  AGENTS.md §9 requires for video doc ids (strip characters the datastore
  rejects), even though Clerk ids are already GROQ/Sanity-id-safe today — do
  defensively since a future Clerk id format isn't guaranteed.
- No PII in PostHog properties beyond the identified Clerk user id (already
  covered by removing email/name from `identify`).
- `posthog-node` client is created once per server process and flushed
  (`shutdown()` or `await client.flushAsync()`) at the end of the route
  handler so events aren't dropped on serverless function exit — per the
  Next.js App Router PostHog skill's guidance.

## Acceptance criteria

- Signed-out visitor: browsing, search, and video playback all work exactly
  as before; no progress reads/writes attempted; `resume_used`/`lesson_completed`
  never fire (no user id to key them on).
- Signed-in learner opens a lesson with no `?t=`: if they have a saved
  position, video starts there, sidebar shows it, `resume_used` captured
  server-side once.
- Same learner opens a lesson via a search result (`?t=` present): starts at
  the search timestamp, not the saved position; no `resume_used`.
- Watching a video past ~90% (or to the end) marks the lesson complete exactly
  once (repeat views past 90% don't re-fire `lesson_completed`), sidebar
  `StatusIndicator` flips to "Completed" on next navigation.
- `video_play` fires once per player mount on first play, not on every
  pause/resume.
- `video_watch_depth` fires at most once per threshold (25/50/75/100) per
  mount, in order.
- No network request from the browser ever carries the Sanity write token or
  a PostHog server key.
- `PostHogIdentity` no longer sends email or name.

## Checks to run

- `web`: `npm run lint`, `tsc --noEmit` (or the project's type-check script —
  confirm exact command), `npm run build` (routes + middleware + server route
  added).
- `studio`: deploy schema (new `progress` type) so Sanity Studio and the
  Context MCP dataset stay in sync; the Context MCP's content scope should
  already exclude `progress` (app-state, not searchable content) — verify the
  Context document's scope filter still only lists course/lesson/instructor/
  category/video, or update it if it currently allows all types.

## Manual test steps

1. `npm run dev` in `web`. Sign out. Open a lesson page — confirm no console
   errors, video plays, no requests to `/api/progress`.
2. Sign in. Watch a lesson's video past ~90% (or seek near the end and let it
   finish). Check PostHog (or server logs / a temporary console.log in the
   route) for `video_play`, `video_watch_depth` (25/50/75/100), and
   `lesson_completed`. Reload the lesson — `StatusIndicator` in the sidebar
   shows "Completed" for that lesson.
3. Watch a different lesson for a few seconds, navigate away, come back to
   the same lesson with no `?t=` — video should resume near where you left
   off, and `resume_used` should have fired server-side (check logs/PostHog).
4. From `/search`, click a video/lesson result with a timestamp — lesson page
   should start at that timestamp, not any saved resume position, and
   `resume_used` should NOT fire for this load.
5. Run a search query end-to-end — confirm `search_performed` (with `query`,
   `result_count`, `course_count`) and, on clicking a card, `search_result_selected`
   (with `kind`, `course_slug`, `lesson_slug`) appear in PostHog.
6. Inspect Network tab throughout — confirm no request body/header ever
   contains `SANITY_API_WRITE_TOKEN` or exposes it in client bundle
   (`grep -r SANITY_API_WRITE_TOKEN .next/static` after build should return
   nothing).
