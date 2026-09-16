# Implementation Prompt: Lesson Page

## Goal
Implement `/lessons/[slug]`, matching `design/vertex-lesson.png`: a lesson sidebar (course mini-card, module/lesson nav), breadcrumbs, lesson header, an embedded playable video, Lesson Content / Notes tabs, a resources grid, and previous/next lesson navigation — all wired to the seeded Sanity content, with the lesson's real video playing on the page.

## Skills / docs read
- AGENTS.md (sections 1, 3, 5, 7, 8, 9, 14): pages are read-only display of stored data; no custom video player — playback is the provider's own embed; the My Learning page, notifications bell, and **the lesson Notes tab are presentational only with no backend**; progress tracking is a distinct, not-yet-built feature; don't overbuild.
- `node_modules/next/dist/docs/` App Router routing/data-fetching docs (dynamic segment `[slug]`, server components).

## Code inspected
- `app/courses/[slug]/page.tsx` — established page pattern: `Navbar`, `Breadcrumbs`, server-fetched data, Tailwind design tokens (`font-display`, `text-display-2`, `text-heading-*`, `text-body*`), sticky bottom progress bar hardcoded to `value={0}` (no progress backend exists yet — I'm following this exact precedent, not inventing new fake data).
- `sanity/lib/queries.ts` / `data.ts` — `LESSON_BY_SLUG_QUERY` / `getLessonBySlug()` already exist and already derive `moduleNumber`/`lessonNumber`/`moduleTitle` from array order (never stored), per the doc comment. Currently the query returns only `lessonSlugs` per module (enough for numbering) but not full lesson cards, so it can't drive the sidebar or prev/next nav yet.
- `studio/schemaTypes/documents/lesson.ts` — fields: `title`, `slug`, `videoUrl` (YouTube/Vimeo/Bunny), `poster`, `duration` (seconds), `freePreview`, `studentCount`, `notes` (Portable Text), `keyPoints` (string array), `proTip` (text), `resources` (array of `lessonResource`: `type`, `title`, `description`, `url`). No per-lesson course/module link (derive via reverse reference, already handled).
- `studio/schemaTypes/documents/course.ts` / `objects/module.ts` — `course.level`, `modules[]` embedded objects with `title`, `summary`, ordered `lessons[]` references.
- Seed data (`studio/scripts/seed/seed.ndjson`) — every seeded `videoUrl` is a `youtube.com/watch?v=...` URL; no Vimeo/Bunny URLs exist. Per AGENTS.md §9 ("don't treat a provider as supported until both ingestion and playback exist"), I'm only building YouTube embed playback now.
- `components/brand/Navbar.tsx`, `components/ui/Breadcrumbs.tsx`, `components/ui/ProgressBar.tsx`, `components/ui/StatusIndicator.tsx`, `components/ui/CourseContent.tsx` (expand/collapse module pattern to copy for the sidebar), `components/ui/Badge.tsx`, `components/ui/Icon.tsx`, `lib/format.ts` (`formatDuration`, `formatCount`), `lib/cn.ts`, `lib/posthog-client.ts` (typed `PostHogEventName` union — new lesson events must be added there).
- `components/ui/ResourceCard.tsx` and `LessonCard.tsx` are only used on `app/design-system/page.tsx`; they model the **search-results** UI (`format`/`size` props) not the `lessonResource` schema (`type`/`url`), so I'm adding a small new component for the resources grid instead of repurposing them.
- `package.json` — no Portable Text renderer installed yet; need to add `@portabletext/react` for `lesson.notes`.
- Tailwind tokens in `app/globals.css`: `primary-500` (#f97316, orange) for accents/current-item highlight, `neutral-*` grays, the type scale used everywhere else.

## Decisions & assumptions
1. **"Notes" tab is the presentational, no-backend learner-notes surface named in AGENTS.md §7** — a plain textarea placeholder, not wired to any save endpoint. It is separate from the schema's `notes` field (Portable Text lesson content), which renders under the "Lesson Content" tab as the Overview section.
2. **Progress/completion is out of scope** (it's a distinct feature per AGENTS.md §7). Sidebar lesson rows show only: a filled "now playing" indicator for the current lesson, plain (unchecked) circles for every other lesson, and the mini course-progress bar hardcoded to 0%, mirroring the existing precedent in `app/courses/[slug]/page.tsx`. I will not fabricate "completed" checkmarks.
3. **Header stats row** maps to real fields only: duration = current lesson's own `duration`, level = `course.level`, students = lesson's `studentCount`. (The reference mock's numbers aren't internally consistent with a per-lesson-duration model — e.g. it shows the module's total next to the module row and again in the header — so I'm grounding every number in an actual field rather than reverse-engineering the mock's arithmetic.)
4. **Video playback**: a responsive 16:9 `<iframe>` using `youtube-nocookie.com/embed/{id}`, extracted from `videoUrl` via a small parser (`lib/video.ts`) supporting `watch?v=`, `youtu.be/`, and already-embedded URLs. Uses the provider's native controls/scrubber — I will not attempt to recreate the mock's custom-looking scrubber, per AGENTS.md's explicit "do not build a custom player."
5. **Sidebar** collapses every module except the one containing the current lesson (open by default), reusing the disclosure pattern from `CourseContent.tsx`. Only title + total duration shown per module row (no summary line, matching the reference image, which omits it here unlike the course page).
6. **Resources**: new `LessonResourceItem` component keyed off the real `lessonResource` shape (`type`, `title`, `description`, `url`), with an icon chosen from `type` (pdf/article → FileText, code → Github, video → PlayCircle, link → LinkIcon), opening in a new tab.
7. Extend `LESSON_BY_SLUG_QUERY` to return full sidebar data (course level, and for every module its lessons via `lessonCardProjection`) instead of just slugs, and compute `previousLesson`/`nextLesson` (slug, title, duration) in `getLessonBySlug` from the flattened lesson order — mirrors the existing module/lesson-number derivation already in that function.
8. Bookmark icon button next to the title is presentational only (no backend named for it in AGENTS.md) — static, non-functional, like the notifications bell in `Navbar`.
9. PostHog: add `lesson_tab_selected`, `lesson_video_played`, and `lesson_resource_opened` to the `PostHogEventName` union in `lib/posthog-client.ts` and fire them from the new client components, consistent with the existing `course_module_toggled` / `lesson_selected` instrumentation style. (Deeper video-progress-percent analytics is part of the not-yet-built progress feature — out of scope.)

## Files expected to touch
- `sanity/lib/queries.ts` — extend `LESSON_BY_SLUG_QUERY`.
- `sanity/lib/data.ts` — extend `getLessonBySlug` to add sidebar modules + prev/next lesson.
- `lib/video.ts` — new: YouTube URL → embed URL parser.
- `lib/posthog-client.ts` — add 3 event names.
- `components/ui/VideoPlayer.tsx` — new: iframe embed wrapper.
- `components/ui/LessonSidebar.tsx` — new client component.
- `components/ui/LessonTabs.tsx` — new client component (Lesson Content / Notes switcher).
- `components/ui/LessonResourceItem.tsx` — new.
- `app/lessons/[slug]/page.tsx` — new page.
- `package.json` / `package-lock.json` — add `@portabletext/react`.

## Requirements
- Server component page fetches `getLessonBySlug(slug)`; `notFound()` if missing.
- Breadcrumbs: All Courses → course title → module title → lesson title, matching `Breadcrumbs` component usage elsewhere.
- Header: `LESSON {module}.{lesson}` badge, title, description (first plain-text line of `notes`, or omit if none), stats row (duration/level/students), bookmark icon button.
- Video: real embed of `lesson.videoUrl`, playable in the browser, poster image as iframe fallback not required (YouTube shows its own thumbnail before play).
- Tabs default to "Lesson Content": Overview (rendered `notes` Portable Text via `@portabletext/react`), "In this lesson you will" checklist (`keyPoints`), Pro Tip callout (`proTip`, hidden if empty), Resources grid (`resources`, hidden if empty). "Notes" tab shows the static placeholder textarea.
- Sidebar: back-to-course link, mini course card (cover initial/image, title, 0% progress bar), scrollable module list with expand/collapse, current lesson highlighted with a "Now playing" status.
- Footer: previous/next lesson bar with title + duration, disabled/hidden state at the first/last lesson of the course.
- Responsive down to mobile: sidebar collapses above/below the main content (stacked), matching AGENTS.md §3's responsiveness requirement since no mobile reference was given.
- Reuse `Navbar`, `Breadcrumbs`, `Badge`, `Icon`, `ProgressBar`, `StatusIndicator`, `cn`, `formatDuration`, `formatCount`, `urlFor` rather than re-implementing.

## Security considerations
- Sanity fetch stays server-side via the existing `client` (private dataset, server read token) — no token reaches the browser.
- YouTube embed uses `youtube-nocookie.com` and only ever renders `videoUrl` values already stored in Sanity (author-controlled, not user input), so no injection surface from learner input.
- No new writes; the Notes tab and bookmark button are inert UI with no server route, so no new write surface is introduced.

## Acceptance criteria
- Visiting `/lessons/<seeded-slug>` renders the full layout from `design/vertex-lesson.png` with real seeded data (title, breadcrumbs, video, key points, pro tip, resources, sidebar, prev/next).
- The embedded YouTube video actually plays in the browser.
- Switching to the Notes tab shows the placeholder and back again preserves Lesson Content state (client component local state).
- Sidebar expands the current lesson's module by default; other modules collapsed; clicking a lesson row navigates to `/lessons/[that-slug]`.
- Prev/next buttons navigate across module boundaries correctly (last lesson of module N → first lesson of module N+1).
- `npx tsc --noEmit` and `npx eslint` pass in `web` (repo root here).

## Checks to run
- `npm run build` (routes/server code changed) from repo root.
- `npx tsc --noEmit`.
- `npx eslint .`.

## Manual test steps
1. `npm run dev`, open `/courses` → pick a seeded course → click a lesson in "Course Content" (or go straight to `/lessons/<seeded-slug>`).
2. Confirm the YouTube video loads and plays with sound/controls.
3. Confirm breadcrumbs, lesson badge, key points, pro tip, and resources match the seeded document (cross-check via Studio or the `sanity documents query` output).
4. Click through Lesson Content ↔ Notes tabs.
5. Expand/collapse a different module in the sidebar; click into one of its lessons; confirm the page updates and the correct module is now expanded.
6. Click "Next Lesson" repeatedly to cross a module boundary; click "Previous Lesson" back; confirm both disable/hide correctly at the course's first/last lesson.
7. Resize to mobile width and confirm the sidebar stacks sensibly and nothing overflows horizontally.
