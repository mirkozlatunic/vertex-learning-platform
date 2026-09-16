# Implementation Prompt: All Courses (Catalog) Page

## Goal
Implement a simple `/courses` catalog page listing every course from Sanity, so the existing "Courses" nav link and "View all courses" homepage link resolve to a real page. No design reference exists for this page — user asked to keep it simple.

## Skills / docs read
- AGENTS.md (sections 1, 3, 5, 14 — read-only pages; "do not overbuild"; no UI reference means no fabricated visual flourishes beyond reusing what exists).

## Code inspected
- `app/page.tsx` — links to `/courses` (nav + "View all courses"), and now fetches `getCourses()` with `moduleCount`/`totalDuration` already included in `courseCardProjection`.
- `components/brand/Navbar.tsx` — reusable shell.
- `components/ui/CourseCard.tsx` — same card already used on the homepage (cover image, level, duration, module count).
- `sanity/lib/data.ts` `getCourses()` — returns all courses ordered by title; no filter/pagination params.
- `components/ui/Select.tsx`, `Pagination.tsx` exist but are unused speculative primitives — since there's no design reference and the user asked to keep this simple, and only 10 seeded courses exist, I will not wire up filtering/sorting/pagination controls now. That's a separate feature to build once there's a real UI spec.

## Decisions & assumptions
1. Reuse the same `Navbar` + `CourseCard` grid pattern as the homepage, in a simple page: heading ("All Courses") with a live course count, then the grid. No search bar, filters, or pagination — nothing to filter/paginate yet with 10 courses, and no design to match.
2. Cards link to `/courses/[slug]` like the homepage does.
3. Empty state ("No courses yet") if `getCourses()` returns an empty array, since that's a real possibility, not speculative.

## Files expected to touch
- `app/courses/page.tsx` — new.

## Requirements
- Server component, fetches `getCourses()`, renders all courses via `CourseCard` in the same responsive grid as the homepage.
- Reuse `Navbar`; no new components.

## Security considerations
Read-only server fetch through the existing client; nothing new.

## Acceptance criteria
- `/courses` renders all seeded courses.
- No TypeScript or lint errors; build succeeds.

## Checks to run
- `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- Manual: visit `/courses`, click a card, confirm the homepage's nav/"View all courses" links now resolve.
