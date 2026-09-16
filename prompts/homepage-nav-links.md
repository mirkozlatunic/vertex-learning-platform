# Fix: logo and "Explore Courses" don't navigate anywhere

## Goal

Two dead UI elements:
- `Logo` (top-left, `components/brand/Navbar.tsx`) renders as a plain `<span>`
  with no link — clicking it on any page does nothing. Should go home (`/`).
- The homepage hero's "Explore Courses" `Button` (`app/page.tsx`) has no
  `href`/`onClick` — it's decorative only. Should go to `/courses`.

## Code inspected

- `components/brand/Logo.tsx` — just a `<span>` wrapper, icon + wordmark, no
  anchor.
- `components/brand/Navbar.tsx` — renders `<Logo />` directly; other nav links
  (`Courses`, `My Learning`) are plain `<a href=...>` tags, not `next/link`.
- `components/ui/Button.tsx` — plain `<button>`, no `href` prop.
- `app/page.tsx` — hero `<Button variant="primary" icon={...}>Explore
  Courses</Button>` has no click behavior. Elsewhere on the same page, "View
  all courses" is a `next/link` `<Link href="/courses">` wrapping text + icon
  — that's the existing pattern for this same destination.

## Fix

- Wrap `<Logo />` in `Navbar.tsx` with a plain `<a href="/">` (matching the
  existing plain-`<a>` convention used by the other nav links in the same
  file, rather than introducing `next/link` there).
- Wrap the hero `Button` in `app/page.tsx` with `next/link`'s `<Link
  href="/courses">` (the file already imports and uses `Link` for "View all
  courses"), so `Button` keeps rendering as a `<button>` inside an `<a>`.

No visual change — same markup, just made clickable.

## Files to touch

- `components/brand/Navbar.tsx`
- `app/page.tsx`

## Checks

- `tsc --noEmit`, `npm run lint`.

## Manual test

1. From `/courses`, `/lessons/<slug>`, `/search` — click the logo/"Vertex"
   text top-left, confirm it navigates to `/`.
2. From `/`, click "Explore Courses" in the hero, confirm it navigates to
   `/courses`.
