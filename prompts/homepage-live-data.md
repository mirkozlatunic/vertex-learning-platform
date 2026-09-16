# Implementation Prompt: Wire Homepage Course Grid to Sanity

## Goal
Replace the hardcoded `courses` array in `app/page.tsx` with real seeded Sanity content, so "All Courses" shows the actual catalog (same data source as the course detail page).

## Skills / docs read
- AGENTS.md (sections 1, 5, 14 — read-only pages, no overbuilding).
- No new skill needed; this reuses the existing Sanity data layer already used by `app/courses/[slug]/page.tsx`.

## Code inspected
- `app/page.tsx` — currently a client-agnostic server component rendering a static `courses` array (3 hardcoded entries with `initial`/`iconClassName` decorative badges that don't correspond to real content).
- `sanity/lib/queries.ts` (`COURSES_QUERY`, `courseCardProjection`) and `sanity/lib/data.ts` (`getCourses()`) — already fetch `title`, `slug`, `summary`, `coverImage`, `level`, `price`, `popular`, `studentCount`, `instructor`, `category`, but **not** module count or total duration (both shown on `CourseCard`).
- Verified via a live query against the dataset that `"moduleCount": count(modules)` and `"totalDuration": math::sum(modules[].lessons[]->duration)` both resolve correctly and cheaply (no need to fetch full lesson objects) — confirmed real values for all 10 seeded courses (e.g. Next.js App Router in Depth: 4 modules, 7169s ≈ 1h59m).
- `components/ui/CourseCard.tsx` — takes `initial: ReactNode`, `iconClassName?`, `title`, `description`, `level`, `duration`, `moduleCount`. The `initial` badge was designed for a decorative letter/emoji, not a real cover image.
- Seeded courses (`studio/scripts/seed/seed.ndjson`) all have a `coverImage`.

## Decisions & assumptions (flagging for approval)
1. **Add `moduleCount` and `totalDuration` to the shared `courseCardProjection`** in `queries.ts` (rather than a one-off query just for the homepage), since it's cheap and the same shape is reusable for a future `/courses` catalog page and the instructor page's course list — avoids a duplicate near-identical query.
2. **Card image**: swap the decorative letter/emoji badge for the course's real `coverImage` (via `urlFor`, small thumbnail), falling back to the existing first-letter tile only when a course has no cover image. I'll widen nothing else on `CourseCard` — just pass an `<img>` as `initial` with an `iconClassName` that removes the padding/background so the image fills the 48×48 tile.
3. **Description**: use `course.summary` directly (already free text, same as the course detail page) instead of a hand-written blurb.
4. **Ordering/count**: show all courses returned by `getCourses()` (already ordered by title) — matches "All Courses" being the full catalog; no client-side slicing/limiting added since the homepage doesn't currently paginate and AGENTS.md says not to overbuild.
5. **`app/page.tsx` becomes `async`** (already a server component, no directive change needed) to call `getCourses()`.

## Files expected to touch
- `sanity/lib/queries.ts` — add `moduleCount`/`totalDuration` to `courseCardProjection`.
- `sanity.types.ts` — regenerate via Sanity TypeGen (or hand-add the two fields if regen isn't run) so `COURSES_QUERY_RESULT` reflects the new fields.
- `app/page.tsx` — fetch `getCourses()`, map each course to `CourseCard` props (title, summary, level, formatted duration/module count, cover image).
- Reuses `lib/format.ts` (`formatDuration`) and `sanity/lib/image.ts` (`urlFor`) already built for the course detail page — no new helpers needed.

## Requirements
- Homepage course grid reflects live Sanity content; editing/adding a course in the Studio changes what appears without a code change.
- No change to hero, search bar, or footer sections.
- Preserve existing responsive grid behavior.

## Security considerations
Read-only server-side fetch through the existing private-dataset client; no new attack surface.

## Acceptance criteria
- `/` renders all 10 seeded courses with correct title, summary, level, duration, module count, and cover image.
- `/design-system` still renders (no breaking change to `CourseCard`'s prop types).
- No TypeScript or lint errors.

## Checks to run
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- Manual: `npm run dev`, view `/` and confirm it matches the live dataset (compare a couple of titles/durations against Studio).

## Manual test steps
1. Run `npm run dev`.
2. Open `http://localhost:3000` and confirm the "All Courses" grid shows the 10 seeded courses (not the old placeholder 3).
3. Spot check one card's duration/module count against the course's own detail page.
4. Open `/design-system` and confirm `CourseCard` still renders correctly there.
