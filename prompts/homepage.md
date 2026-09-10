# Implementation Prompt: Vertex Homepage

## Goal
Implement the Vertex marketing homepage (`app/page.tsx`) to match `design/vertex-home.png` exactly on desktop, adapted responsively for mobile. This is a presentational, read-only page — no data fetching, auth, or search wiring yet (those land in later prompts per AGENTS.md section 1/5).

## Skills / docs read
- AGENTS.md (sections 1–3, 5, 14 — read-only pages, UI fidelity to reference image, don't overbuild).
- No Sanity/Clerk/PostHog skill needed — this page has no backend behavior.

## Code inspected
- `app/page.tsx` — currently the default `create-next-app` boilerplate; will be fully replaced.
- `app/layout.tsx`, `app/globals.css` — confirms fonts (`font-display` = Playfair Display, `font-sans` = Inter), color tokens (`primary-*`, `neutral-*`), radius/shadow scale, and the type scale (`text-display-1/2`, `text-heading-1/2/3`, `text-body`, `text-small`).
- `app/design-system/page.tsx` + `prompts/design-system.md` — the existing design system and its intended component usage.
- `components/ui/Button.tsx`, `Input.tsx`, `Badge.tsx`, `CourseCard.tsx`, `Icon.tsx` — existing reusable primitives.
- `components/brand/Navbar.tsx`, `Logo.tsx` — existing nav shell (currently logo + text links only, no right-side actions).
- `lib/cn.ts` — className merge helper.

## Decisions & assumptions (flagging for approval)
1. **CourseCard title font**: the reference image shows course card titles ("Next.js for Production", etc.) in serif (Playfair Display), but the existing `CourseCard` component (built for the design system) renders titles in `font-sans` (Inter, Heading 3). Since AGENTS.md section 3 makes the reference image the source of truth, I will update `CourseCard`'s title to `font-display` (serif). This also changes how the card renders on `/design-system`, which I consider a correction toward the real design rather than a regression.
2. **CourseCard icon slot**: the reference shows three different badge treatments — a black box with a white letter (Next.js), a white/bordered box with the Docker whale logo, and a blue box with "TS". The current component only supports a single letter on a fixed dark background. I'll widen the `initial` prop to accept a `ReactNode` and add an optional `iconClassName` to override the badge's background/text classes, defaulting to today's look so `/design-system` is unaffected.
3. **Docker logo**: there's no Docker logo asset in `public/`. I'll use the 🐳 emoji on a white, bordered badge as a close visual stand-in rather than sourcing/adding a third-party logo asset. Easy to swap for a real SVG later.
4. **Navbar right-side actions**: the reference shows a notification bell and a user avatar in the navbar, which the current `Navbar` component doesn't render (no auth yet). I'll add a static bell icon button and a placeholder circular avatar (a neutral circle with a `User` icon, since no avatar image or Clerk session exists yet). These are non-functional placeholders — no click behavior, no real user data.
5. **Links with no real destination yet**: `Courses` / `My Learning` (navbar), `Explore Courses`, and `View all courses` all point to routes that don't exist yet (catalog, my-learning). I'll link them to their eventual routes (`/courses`, `/my-learning`) as plain anchors so they're wired once those pages exist, rather than dead `#` links — this matches where AGENTS.md says these pages will live.
6. **Search input**: renders the existing `Input` component (search icon + `⌘K` shortcut) with no keyboard-shortcut handler or submit behavior — that's part of the future search feature (section 11), out of scope here.
7. **Decorative bar-chart graphic** at the bottom of the page: implemented as a row of `div`s with a height gradient and an orange fade-to-transparent background (no image asset). Hidden below the `sm` breakpoint since it's purely decorative and adds no information — keeps the mobile layout clean per AGENTS.md's "adapt sensibly" guidance for responsiveness.
8. **New `Badge` variant**: the "INTELLIGENT LEARNING" eyebrow pill is outlined (pale background, thin border, orange text), which doesn't match any existing `Badge` variant (all are solid fills). I'll add an `outline` variant rather than a one-off span, so it's reusable.

## Files expected to touch
- `app/page.tsx` — full rewrite: navbar, hero, search bar, "All Courses" section, footer strip with decorative graphic.
- `components/ui/CourseCard.tsx` — widen `initial` to `ReactNode`, add `iconClassName`, switch title to `font-display`.
- `components/ui/Badge.tsx` — add `outline` variant.
- `components/brand/Navbar.tsx` — add bell icon + placeholder avatar on the right side.

No new files/components needed beyond that — everything else is composed directly in `app/page.tsx` since it's homepage-specific and not reused elsewhere yet.

## Requirements
- Match `design/vertex-home.png` exactly on desktop: spacing, type scale, colors, radii, shadows, copy.
- Reuse `Navbar`, `Button`, `Input`, `Badge`, `CourseCard`, `Icon` rather than hand-rolling new markup for things they already cover.
- Responsive down to mobile: hero text and search bar stack full-width, course grid collapses to 1 column (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`), decorative graphic hidden below `sm`.
- No client-side state, no data fetching — all copy/content is static, matching the reference image's course data (Next.js for Production / Docker Essentials / TypeScript Deep Dive with the levels, durations, module counts shown).
- Use semantic HTML (`<header>`, `<main>`, `<section>`) and accessible labeling (e.g. `aria-hidden` on the decorative bars, `aria-label` on the icon-only bell button).

## Security considerations
None — fully static, no user input is persisted, no external data, no secrets involved.

## Acceptance criteria
- `/` renders the homepage matching the reference image at desktop width.
- Page is usable and visually coherent at mobile widths (no horizontal scroll, no overlapping text).
- `/design-system` still renders correctly after the `CourseCard`/`Badge` changes (spot check visually).
- No TypeScript or lint errors.

## Checks to run
- `npm run lint`
- `npx tsc --noEmit` (or the project's type-check script if different — will confirm from `package.json`)
- `npm run build`
- Manual: `npm run dev`, view `http://localhost:3000` at desktop and mobile widths, and `http://localhost:3000/design-system` to confirm no regression.

## Manual test steps
1. Run `npm run dev`.
2. Open `http://localhost:3000` in a desktop-width browser window; compare against `design/vertex-home.png` section by section (navbar, hero, search bar, course grid, footer strip).
3. Resize to a mobile width (~375px) and confirm the layout stacks cleanly with no overflow.
4. Open `http://localhost:3000/design-system` and confirm the `CourseCard` and `Badge` sections still render sensibly with the widened prop types.
