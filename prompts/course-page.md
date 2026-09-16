# Implementation Prompt: Course Detail Page

## Goal
Implement the course detail page at `app/courses/[slug]/page.tsx` to match `design/vertex-course.png` exactly on desktop, adapted responsively for mobile, wired to real seeded Sanity content via the existing server-only data layer. This is a read-only page (AGENTS.md section 5) — no writes, no progress backend.

## Skills / docs read
- AGENTS.md (sections 1, 3, 5, 7, 14 — read-only pages, UI fidelity, presentational-only surfaces, "never invent" data).
- sanity-best-practices (GROQ projection conventions — confirmed existing `COURSE_BY_SLUG_QUERY` already covers what this page needs).

## Code inspected
- `design/vertex-course.png` — the reference.
- `sanity/lib/queries.ts`, `sanity/lib/data.ts` — `getCourseBySlug(slug)` already returns title, slug, summary, coverImage, level, price, popular, studentCount, instructor, category, outcomes, and `modules[]` with nested `lessons[]` (id, title, slug, videoUrl, poster, duration in seconds, freePreview, studentCount).
- `studio/schemaTypes/documents/course.ts`, `lesson.ts`, `objects/module.ts`, `objects/courseOutcome.ts` — confirms field shapes; module/lesson numbers are derived from array order (never stored); course has no stored total duration or lesson count — must be derived by summing `modules[].lessons[].duration`.
- `studio/scripts/seed/seed.ndjson` — real seeded course "Next.js App Router in Depth" has 4 modules (3 lessons each), `outcomes[].icon` values are lowercase lucide names (`layers`, `workflow`, `gauge`, `rocket`), lesson `duration` is in seconds (e.g. 350), no course-level total duration/lesson-count field exists.
- `components/ui/Badge.tsx` — already has a `popular` variant (orange pill) matching the "POPULAR" badge in the design; no changes needed.
- `components/ui/Button.tsx`, `Breadcrumbs.tsx`, `ProgressBar.tsx`, `Icon.tsx`, `StatusIndicator.tsx`, `LessonCard.tsx` — existing primitives to reuse.
- `components/brand/Navbar.tsx` — already renders the bell + Clerk `UserButton`/sign-in-sign-up, matching the top-right of the design; no changes needed.
- `sanity/lib/image.ts` — `urlFor()` helper for the cover image.
- `app/page.tsx`, `prompts/homepage.md` — confirms established precedent: link to not-yet-built routes (e.g. `/courses`, `/lessons/[slug]`) rather than dead `#` links, and use plain static placeholders for features with no backend yet.
- No existing lucide icon-name lookup helper and no existing catalog (`/courses`) or lesson (`/lessons/[slug]`) route yet — both are out of scope, referenced only as link targets.

## Decisions & assumptions (flagging for approval)
1. **Route**: `app/courses/[slug]/page.tsx`, a dynamic segment matching `course.slug.current`. Calls `getCourseBySlug(slug)` and calls `notFound()` if null.
2. **Derived numbers**: total course duration and lesson count are computed server-side from `modules[].lessons[].duration`/`.length` (matching the "derived from order/data, never stored" principle already applied to module/lesson numbers). "12 modules" in the reference image is just placeholder design copy — the real seeded course has 4 modules; the page must render whatever the data has, not a fixed count.
3. **Outcome icons**: `outcomes[].icon` is a free-text lucide icon name (e.g. `"layers"`). I'll add a small `getIconByName(name: string)` lookup (kebab/lowercase → PascalCase → `lucide-react` export, with a generic fallback icon) since no such helper exists yet. Small and reusable, not over-built.
4. **Progress bar / "Continue Learning" / "Bookmark"**: no progress-record schema or server route exists yet (AGENTS.md section 8's progress model isn't implemented). Per the "some surfaces are presentational only" allowance (section 7) and the homepage precedent of static placeholders for unbuilt backends, I will:
   - Render the sticky bottom progress bar and both "Continue Learning" buttons as presentational only, using the existing `ProgressBar` component with a static `0%` (no fabricated per-user progress) rather than the `35%` shown in the mockup, since inventing a real user's progress would violate the "never invent data" principle. Layout/visuals otherwise match the reference exactly.
   - "Continue Learning" links to the course's first lesson (`/lessons/<first-lesson-slug>`) as a sensible default with no resume-position backend.
   - "Bookmark" is a static, non-functional button (no bookmark field/model exists).
5. **Course Content accordion**: modules collapse/expand to reveal their lessons (title, duration, lock icon if not `freePreview`), each linking to `/lessons/[slug]` (route not built yet, linked per the established precedent). This needs client-side state, so I'll add a small client component, `components/ui/CourseContent.tsx` (or similar), that takes the modules array as a prop and handles expand/collapse plus the "Show all N modules" reveal (only rendered if there are more than 6 modules — the seeded course has 4, so that control won't show, but the component must handle courses with more).
6. **New presentational component**: `components/ui/OutcomeCard.tsx` for the "What you'll learn" grid tile (icon square + title + description), since nothing existing covers this shape.
7. **Cover image**: uses `urlFor(coverImage)` with a fixed aspect box; falls back to a plain dark tile with the course's first letter (matching the CourseCard pattern) if no `coverImage` is set on a course.
8. **Metadata**: add a `generateMetadata` using the course title/summary — small, standard Next.js practice, not overbuilding.

## Files expected to touch
- `app/courses/[slug]/page.tsx` — new, the full page (server component).
- `components/ui/OutcomeCard.tsx` — new.
- `components/ui/CourseContent.tsx` — new (client component: accordion + "show all modules").
- `lib/icons.ts` (or similar) — new, small lucide icon-name lookup + a duration/number formatting helpers (`formatDuration(seconds)`, `formatCount(n)`), reused across the page and the new components.
- No changes expected to `sanity/lib/queries.ts` or `data.ts` — `COURSE_BY_SLUG_QUERY`/`getCourseBySlug` already return everything needed.

## Requirements
- Match `design/vertex-course.png` exactly on desktop: breadcrumb, cover image, title/badge/description/meta row, Continue Learning + Bookmark buttons, "What you'll learn" 2x2 grid, "Course Content" module list with per-module duration and expand chevron, "Show all N modules" control, sticky bottom progress bar.
- Responsive down to mobile: hero column stacks (image above text), outcome grid collapses to 1 column, module rows remain legible, sticky bottom bar stacks progress/button if needed.
- Use real Sanity data end to end; never hardcode course-specific copy in the page component.
- Reuse existing primitives (`Badge`, `Button`, `Breadcrumbs`, `ProgressBar`, `Icon`) rather than re-implementing them.
- `notFound()` for an unknown slug.

## Security considerations
Read-only server-side fetch against the existing private-dataset client (already token-gated per `sanity/lib/client.ts`); no user input is written; no secrets introduced.

## Acceptance criteria
- `/courses/nextjs-app-router-in-depth` (and other seeded course slugs) renders real content matching the reference layout at desktop width.
- Unknown slug renders Next.js's not-found page.
- Page is usable at mobile widths with no horizontal scroll or overlap.
- No TypeScript or lint errors.

## Checks to run
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- Manual: `npm run dev`, visit `/courses/nextjs-app-router-in-depth` (and one other seeded slug) at desktop and mobile widths; visit `/courses/does-not-exist` to confirm the not-found page.

## Manual test steps
1. Run `npm run dev`.
2. Open `http://localhost:3000/courses/nextjs-app-router-in-depth`; compare against `design/vertex-course.png` section by section.
3. Click a module row to expand/collapse its lesson list; confirm lesson durations and lock icons reflect `freePreview`.
4. Resize to ~375px width; confirm no overflow and sensible stacking.
5. Visit `http://localhost:3000/courses/not-a-real-slug` and confirm the not-found page renders.
