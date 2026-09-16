# Vertex search results page

## Goal

Build the search results page from `design/vertex-search.png` (AGENTS.md §3,
§11): a full results page, not a widget or chatbox, wired to the existing
`POST /api/search` route. Returns to the "no results page UI this pass" gap
`prompts/search.md` explicitly deferred — that design reference now exists.

## Skills read

- `node_modules/next/dist/docs/01-app/01-getting-started/07-linking-and-navigating.md`
  and the routing/route-handlers docs already used by `prompts/search.md` —
  confirms `page.tsx` can pair a server component (for `metadata`) with a
  client child for `useSearchParams`/fetch, same shape as other pages here.
- No sanity-best-practices/dial-your-context/shape-your-agent work needed —
  this pass is UI-only, consuming the already-built `/api/search` contract.

## Code inspected

- `design/vertex-search.png` — the reference. Header (Courses/My Learning nav,
  bell, avatar), "SEARCH RESULTS" eyebrow badge, `Results for "<query>"`
  heading, subcopy count, a search input (⌘K), a result count + "Most
  Relevant" sort control, a list of video/lesson result cards, and a persistent
  footer CTA ("Can't find what you're looking for? ... Browse all courses").
- `app/api/search/route.ts`, `lib/search-schema.ts` — existing contract:
  `POST { query }` → `{ query, resultCount, courseCount, results: SearchResult[] }`.
  `SearchResult.kind` is `"lesson" | "video"`; video-only fields
  (`matchedSecond`, `clipLengthSeconds`, `thumbnailUrl`) are always `null`
  today because no video documents exist yet — confirmed in
  `prompts/search.md` and `prompts/video-ingestion-pipeline.md` (ingestion
  pipeline is uncommitted, unrun, and *explicitly* leaves wiring `video`-kind
  results back into the system prompt as a follow-up). So today every result
  the API returns will render as a `lesson` card; the page is still built to
  handle `kind: "video"` per the schema/design so nothing else changes when
  that follow-up lands.
- `components/ui/{Input,Select,Badge,Button,Icon}.tsx`, `lib/cn.ts` — existing
  primitives to reuse as-is. `Input` already renders the search icon + ⌘K
  shortcut slot. `Badge` has `video`/`lesson`/`popular`/`outline` variants
  (solid orange/black, used top-left on the generic `LessonCard`) — none match
  the pale top-right pill badges in this design.
- `app/globals.css` — only `primary-*` (orange) and `neutral-*` tokens exist;
  no blue/purple token. Re-examining the design's "LESSON" pill against the
  palette: its muted color is `neutral-700` (`#33415f`, a blue-slate gray),
  not a distinct hue. `Badge`'s `outline` variant (`bg-primary-100/60
  text-primary-500`) already matches the pale "VIDEO" pill. Only one new
  `Badge` variant is needed: `neutral` (`bg-neutral-100 text-neutral-700`) for
  "LESSON".
- `components/ui/CourseCard.tsx` / `CourseCardLink.tsx` — the only existing
  "course icon" treatment is an initial-letter square (or cover image). No
  `icon` field exists on the `course` schema (confirmed in
  `studio/schemaTypes/documents/course.ts`) and `SearchResult` carries no
  course icon/logo. The design's per-course brand glyphs (Next.js/React/Node
  icons) aren't backed by any field — reusing the initial-letter treatment
  instead of inventing icon data, per AGENTS.md's grounding rule taking
  precedence over exact visual fidelity where the data doesn't exist.
- `lib/video.ts` (`getYouTubeEmbedUrl`), `components/ui/VideoPlayer.tsx`,
  `app/lessons/[slug]/page.tsx` — AGENTS.md §7 requires a video result's
  action to link to the lesson page with a start-seconds query param that
  makes the embed start there via the provider's own `start` parameter. None
  of this exists yet: `getYouTubeEmbedUrl` takes no start second,
  `VideoPlayer` takes no such prop, and the lesson page reads no query param.
  This is the one piece of functionality (not just page UI) the search
  result's "Watch from" action needs to actually work, so it's in scope here.
- `lib/format.ts` — has `formatDuration`/`formatCount`, nothing that renders
  seconds as `mm:ss`/`h:mm:ss` (needed for "Watch from 12:45" and clip
  length). Adding `formatTimestamp`.
- `lib/posthog-client.ts` — `PostHogEventName` union pattern to extend for
  `search_performed` and `search_result_selected` (AGENTS.md §7: "search
  performed" is a named engagement moment to instrument).
- `app/page.tsx` — the homepage hero already renders an `Input` with the exact
  "Ask anything about your learning..." / ⌘K placeholder from the design, but
  it's inert (no `<form>`, no submit handler) — currently the only way to
  reach `/search` would be typing the URL by hand. Wiring it to submit to
  `/search?q=...` is the minimum needed for the page to be reachable, not a
  redesign of the homepage.
- `app/courses/[slug]/page.tsx`, `app/lessons/[slug]/page.tsx` — confirms the
  project's pattern for pages needing both `generateMetadata`/static metadata
  and client-only behavior: an async/server `page.tsx` wrapping a `"use
  client"` child. Following that for `/search` (`useSearchParams` + `fetch`
  require a client component).

## Decisions & assumptions

- **Route shape**: `app/search/page.tsx` (server, static `metadata`) renders
  `SearchResultsView` (new client component) that reads `?q=` via
  `useSearchParams`, POSTs to `/api/search`, and owns loading/error/empty
  states. No server-side fetch of search results (AGENTS.md §5: search route
  is called from the client search UI, results aren't pre-rendered).
- **Query param**: `q` for the search term (e.g. `/search?q=data%20fetching`),
  matching the design's own rendered example. Submitting the page's own search
  box updates the URL (`router.push`) rather than only local state, so results
  are linkable/shareable and the input stays the single source of truth.
- **Start-seconds param on the lesson page**: `t` (seconds, integer),
  e.g. `/lessons/data-fetching-in-server-components?t=765`. `VideoPlayer`
  gets an optional `startSeconds` prop; `getYouTubeEmbedUrl` gets an optional
  second argument appending `&start=<n>` to the embed URL (YouTube's own
  param, per AGENTS.md §7 "using the provider's own start parameter"). Vimeo/
  Bunny stay unimplemented, same as today.
- **Video thumbnail placeholder**: `thumbnailUrl` is always `null` today. When
  null, render a dark placeholder tile with a play icon instead of an `<img>`
  — a UI fallback for missing data, not fabricated content.
- **Sort control**: design shows a single working default ("Most Relevant" —
  the API's own ranked order) with a chevron implying more options exist.
  AGENTS.md §11 only requires the control to exist and default to relevance;
  it doesn't specify alternatives. Adding one genuinely groundable second
  option, **Course (A–Z)**, sorted client-side off real `courseTitle` values —
  no new data, no invented ranking signal. Both are computed client-side from
  the one API response; no refetch on sort change.
- **Progress checkmarks**: the design shows a checkmark on two lesson-kind
  results. `SearchResult` carries no completion field, and AGENTS.md §7 scopes
  completion marks to "the catalog, course, and lesson pages" — search isn't
  listed. Omitting the checkmark rather than inventing completion state.
- **Result card component**: new `components/ui/SearchResultCard.tsx`
  (discriminated on `result.kind`), not a reuse/edit of the existing generic
  `LessonCard` — that component's badge placement/thumbnail slot/footer
  layout don't match this design, and AGENTS.md §3 asks to reproduce the
  reference exactly rather than force-fit an unrelated existing shape.
  `LessonCard` is left as-is (still used by the design-system page).
- **Loading/error states**: not shown in the static design reference, but
  necessary since `/api/search` calls an LLM and isn't instant. A simple
  skeleton-row state while pending and an inline error message with a retry
  affordance on failure — functional necessity, not a visual deviation from
  the reference.
- **Empty state**: per AGENTS.md §11 ("When nothing fits, show an empty state
  that points to the full catalog") and the design's own persistent footer
  CTA, the "Can't find what you're looking for? ... Browse all courses" block
  renders in both cases: as a permanent footer under results, and as the sole
  content (in place of the list) when `resultCount === 0`.
- **Analytics**: `search_performed` fires once per completed search (query,
  resultCount, courseCount). `search_result_selected` fires on a result card's
  action click (kind, courseId placeholder→courseSlug, lessonSlug). Follows
  the existing `captureEvent`/`PostHogEventName` pattern; no new PostHog
  config.
- **Homepage wiring**: hero `Input` in `app/page.tsx` gets wrapped in a
  `<form>` that navigates to `/search?q=<value>` on submit. No other homepage
  changes.

## Files expected to touch

- `app/search/page.tsx` (new) — server shell + static metadata.
- `components/search/SearchResultsView.tsx` (new) — client component: input,
  sort control, count copy, result list/empty state, footer CTA, fetch logic.
- `components/ui/SearchResultCard.tsx` (new) — video/lesson result card.
- `components/ui/Badge.tsx` — add `neutral` variant.
- `lib/format.ts` — add `formatTimestamp(seconds)` → `mm:ss` / `h:mm:ss`.
- `lib/video.ts` — `getYouTubeEmbedUrl(videoUrl, startSeconds?)`.
- `components/ui/VideoPlayer.tsx` — accept/pass through `startSeconds`.
- `app/lessons/[slug]/page.tsx` — read `t` search param, pass to `VideoPlayer`.
- `lib/posthog-client.ts` — add `search_performed`, `search_result_selected`.
- `app/page.tsx` — wrap hero `Input` in a submitting `<form>`.

## Requirements

- Visual match to `design/vertex-search.png` at desktop width; responsive
  down to mobile (stack the count/sort row, full-width cards) per AGENTS.md §3
  — no mobile reference exists, so adapt sensibly rather than guess pixel-for-
  pixel.
- Page reads `q` from the URL, fetches `/api/search` client-side, and renders:
  eyebrow badge, `Results for "<query>"` heading, count subcopy, search input
  (submitting updates `?q=`), result count + sort control, the ranked list,
  footer CTA.
- Video-kind cards: thumbnail (or placeholder), duration badge, course row,
  title, description, `Lesson <m>.<n> · <moduleTitle>`, "Watch from `mm:ss`"
  action linking to `/lessons/<lessonSlug>?t=<matchedSecond>`.
- Lesson-kind cards: key-points box, course row, title, description,
  `Module <m>`, "View lesson" action linking to `/lessons/<lessonSlug>`.
- Sort control re-orders client-side without refetching.
- Empty state (zero results) and the always-present footer CTA both link to
  `/courses`.
- `/lessons/[slug]?t=<seconds>` starts YouTube playback at that second; no `t`
  behaves exactly as today.
- No client code reads/writes a Sanity token or calls the MCP directly — the
  client only calls `/api/search` (AGENTS.md §5 boundary, already enforced by
  the existing route; this page must not bypass it).

## Security considerations

- No new server code beyond the two small `VideoPlayer`/`getYouTubeEmbedUrl`
  changes, which only ever read a `?t=` value already constrained to an
  integer before use (parsed/validated, not interpolated raw into the embed
  URL beyond the numeric `start` param).
- `q` is passed to `/api/search` exactly as the existing route already
  validates it (length/non-empty) — no new trust boundary.
- Result action links are built from `lessonSlug`/`matchedSecond` values the
  API already returned (server-validated against the Zod schema); the client
  doesn't re-derive or trust any other freeform string into a URL.

## Acceptance criteria

- `/search?q=data%20fetching` (or any seeded term) renders matching the
  design: header copy, input, sort, count, cards, footer CTA.
- Cards render correctly for `kind: "lesson"` today; a `kind: "video"` result
  (once the follow-up ingestion/prompt work lands) would render the
  video-card layout with a working "Watch from" link — verified by
  temporarily stubbing a video-kind result in dev, not by faking the API.
- Zero-result query shows the empty state, no result list.
- Sort control changes card order without a network request.
- Clicking "Watch from `mm:ss`" opens the lesson page with the video starting
  at that second (YouTube `start` param present in the embed URL).
- Homepage hero search box submits to `/search?q=...`.
- Responsive: usable and non-overlapping at mobile width (~375px).
- Type check and lint pass; production build succeeds (new route + component
  changes).

## Checks to run

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- Manual: `npm run dev`, exercise the steps below.

## Manual test steps

1. `npm run dev`, ensure `.env.local` still has `OPENAI_API_KEY` and
   `SANITY_CONTEXT_MCP_URL` set (from the earlier search pass).
2. Visit `/`, type a seeded term into the hero search box, submit — confirm
   navigation to `/search?q=<term>` with results.
3. On `/search`, confirm the header, eyebrow badge, count copy, sort control,
   and footer CTA match the design.
4. Change the sort control to "Course (A–Z)" — confirm reordering with no
   network request (check devtools Network tab).
5. Search a nonsense term (e.g. `asdkjfhaslkdjf`) — confirm the empty state
   and a working "Browse all courses" link.
6. Click a lesson-kind result's "View lesson" — confirm it opens
   `/lessons/<slug>` with no `t` param and plays normally.
7. Manually visit `/lessons/<any-seeded-slug>?t=120` — confirm the YouTube
   embed starts at 2:00 instead of 0:00.
8. Resize to ~375px width on `/search` — confirm no horizontal scroll/overlap.
9. `npm run lint`, `npx tsc --noEmit`, `npm run build` — all pass.
