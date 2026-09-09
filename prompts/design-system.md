# Implement the Vertex Design System

## Goal
Translate `design/vertex-designsystem.png` into the project's actual design tokens and reusable UI primitives, then build a living style guide page at `/design-system` that renders every section of the reference (colors, typography, spacing, radius/shadows, icons, buttons, inputs, badges, status indicators, progress bar, cards, navigation, principles) using real components — not a static image recreation.

This is foundational work other pages (catalog, course, lesson, etc.) will build on, per AGENTS.md section 5–6. Build only the design system: tokens, primitives, and the showcase page. No app pages, no data fetching, no Sanity/Clerk/PostHog wiring.

## Skills consulted
- `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md` — `next/font/google` usage for self-hosted fonts (Playfair Display + Inter).
- `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md` — confirms Tailwind v4 `@import "tailwindcss"` + `@tailwindcss/postcss` setup already in place; no changes needed there.
- AGENTS.md section 3 (UI work: reproduce reference exactly, responsive down to mobile, reuse components before adding new ones) and section 6 (tech stack: Tailwind, TypeScript).

## Code inspected
- `package.json` — Next 16.3.4, React 19.2.8, Tailwind v4, `lucide-react`, `clsx`, `tailwind-merge` already installed (icon set and class-merging utility are ready to use).
- `app/layout.tsx` — currently wired to Geist fonts (leftover from `create-next-app`); needs to switch to Playfair Display + Inter.
- `app/globals.css` — Tailwind v4 `@theme inline` block with only `--color-background`/`--color-foreground`; needs the full token set (colors, spacing scale reference, radius, shadows) added as CSS variables + `@theme` mappings.
- `postcss.config.mjs` — standard `@tailwindcss/postcss` plugin, no change needed.
- Empty scaffold directories already exist and signal intended structure: `components/ui/`, `components/brand/`, `app/design-system/`, `lib/`. I'll fill these rather than inventing a different layout.
- `tsconfig.json` — `@/*` path alias maps to repo root, so imports will be `@/components/ui/...`, `@/lib/...`.
- No existing components to reuse yet — this prompt creates the first ones.

## Design reference readout (`design/vertex-designsystem.png`)
1. **Colors** — Primary orange scale (500 `#F97316` → 100 `#FFEEE5`), Neutral scale (900 `#0F172A` → 50 `#FAFAFC`, plus White).
2. **Typography** — Display font Playfair Display (elegant/serif), body/UI font Inter (clean/sans).
3. **Type scale** — Display 1 (48/56 Playfair Bold, page titles), Display 2 (36/44 Playfair Bold, section titles), Heading 1 (28/36 Inter SemiBold, card titles), Heading 2 (22/30 Inter SemiBold, sub-section), Heading 3 (18/26 Inter Medium, small titles), Body Large (16/24 Inter Regular), Body (14/20 Inter Regular), Small (12/16 Inter Regular, captions/meta).
4. **Spacing** — 4px base unit: 4, 8, 12, 16, 24, 32, 40, 48, 64.
5. **Radius** — xs 4px, sm 8px, md 12px, lg 16px, xl 24px, full (circle). **Shadows** — sm `0 1px 2px 0 rgba(15,23,42,.05)`, md `0 4px 12px -2px rgba(15,23,42,.08)`, lg `0 12px 24px -4px rgba(15,23,42,.10)`, xl `0 20px 40px -8px rgba(15,23,42,.12)`.
6. **Icons** — lucide-react, 24×24 grid, 2px stroke (outline default), filled variant for active/selected states. Reference set: bell, search, play-circle, file-text, bookmark, bar-chart, clock, user, chevron-right.
7. **Buttons** — Primary (solid orange), Secondary (outline orange), Tertiary (outline neutral, often with icon), Text (no border, orange text, often with icon) × states Default/Hover/Disabled. Specs: height 44px default, radius 12px, padding 0 16px(lg)/0 12px(md), font Inter Medium 14–16px.
8. **Inputs** — Search/text input with leading search icon and trailing `⌘K` hint; Select dropdown. Specs: height 44px, radius 12px, border 1px `#E2E8F0`, padding 0 16px, focus border `#FB923C` (Primary 400).
9. **Badges/Tags** — Video (orange bg), Lesson (dark/neutral bg), Popular (light orange bg) — small pill labels.
10. **Status/Indicators** — In Progress (ring icon), Completed (green check), Now Playing (orange play dot), Locked (lock icon).
11. **Progress bar** — thin track, orange fill, percentage label.
12. **Cards** — Course Card (icon avatar, title, description, level/duration/module-count meta row), Lesson Card Video variant (badge, title, description, lesson label + timestamp, "Watch from" button), Lesson Card Lesson variant (badge, title, description, module label, "View lesson" link), Resource Card (file icon, title, description, format/size, external link icon).
13. **Navigation** — top nav with logo, Courses/My Learning links; Breadcrumbs; Pagination with active page highlight.
14. **Principles** — 4 icon+text tiles: Clarity First, Consistency, Focus & Calm, Accessible.

## Decisions & assumptions
- **Fonts**: use `next/font/google` for both Playfair Display (weights 400/700, used only for Display 1/2) and Inter (weights 400/500/600, used for everything else), each exposed as a CSS variable (`--font-display`, `--font-sans`) and wired into Tailwind's `@theme`. This replaces the leftover Geist fonts in `app/layout.tsx`.
- **Tokens live in `app/globals.css`** as `:root` CSS custom properties, mapped into Tailwind's `@theme inline` block (Tailwind v4 convention) so they're usable as utilities (`bg-primary-500`, `text-neutral-700`, `rounded-md`, `shadow-md`, etc.) rather than as a separate `tailwind.config.ts` (v4 is CSS-first; no config file exists in this project and I won't add one).
- **Spacing**: Tailwind's default spacing scale is already 4px-based (`p-1`=4px, `p-2`=8px, `p-4`=16px, `p-6`=24px, `p-8`=32px, `p-10`=40px, `p-12`=48px, `p-16`=64px), which matches the reference exactly — no custom spacing tokens needed, just use Tailwind's built-in scale.
- **`cn()` utility** at `lib/cn.ts` using `clsx` + `tailwind-merge` (both already installed), since components will need conditional/mergeable class composition.
- **Components built as variants via `class-variance-authority`?** — not installed and AGENTS.md says use what's already there; I'll hand-roll variant logic with `cn()` + simple TS union props instead of adding a new dependency, keeping components small.
- **Primitives to build** in `components/ui/`: `Button`, `Input`, `Select`, `Badge`, `StatusIndicator`, `ProgressBar`, `Icon` (thin lucide-react wrapper enforcing 24px/2px stroke default), plus card components `CourseCard`, `LessonCard` (video + lesson variant via prop), `ResourceCard`. Navigation-related: `Breadcrumbs`, `Pagination` in `components/ui/`; `Navbar`/`Logo` in `components/brand/` (brand-identity pieces vs. generic UI).
- **Showcase page** at `app/design-system/page.tsx`, server component, statically rendered, laid out as vertically stacked labeled sections mirroring the reference's 14 numbered blocks, each demonstrating the real components (not decorative boxes) — e.g. section 7 renders actual `<Button>` instances in each variant/state.
- **Disabled button state**: rendered via the native `disabled` attribute + muted styling (not a separate route/interaction).
- **"Hover" row in the reference**: since hover isn't a static state in code, I'll note it inline as a caption ("hover a button to preview") rather than faking a fixed hover snapshot — the Default row's buttons are real interactive buttons so hovering them in-browser shows the true hover style.
- Not building: dark mode (reference is light-only), the `@sanity/context`/Clerk/PostHog integration, any non-design-system route.

## Files expected to touch/create
- `app/layout.tsx` — swap Geist → Playfair Display + Inter, update metadata title/description to "Vertex".
- `app/globals.css` — full token set (colors, radius, shadow, font vars) + `@theme inline` mappings; remove now-unused Geist mono var.
- `lib/cn.ts` — new.
- `components/ui/Icon.tsx`, `Button.tsx`, `Input.tsx`, `Select.tsx`, `Badge.tsx`, `StatusIndicator.tsx`, `ProgressBar.tsx`, `CourseCard.tsx`, `LessonCard.tsx`, `ResourceCard.tsx`, `Breadcrumbs.tsx`, `Pagination.tsx` — new.
- `components/brand/Logo.tsx`, `Navbar.tsx` — new.
- `app/design-system/page.tsx` — new, the showcase.
- `app/page.tsx` — leave as-is unless it visibly conflicts (it currently still has default create-next-app content; out of scope for this prompt, will not touch).

## Requirements
- All colors, type sizes/weights, spacing, radii, and shadows match the reference values exactly.
- Buttons/inputs/cards match the reference's visual spec (heights, radii, padding, border colors, focus color) pixel-for-pixel where specified.
- Components are typed with TypeScript, accept `className` for composition, and use `cn()` internally.
- Icons come from `lucide-react` at 24px/2px stroke by default, matching the "Icon Specs" callout.
- Page is responsive: the showcase reflows to a single column on mobile; components themselves (buttons, inputs, cards) are already fluid/intrinsically responsive.
- No hardcoded hex colors inside components — everything references the Tailwind tokens defined in `globals.css`.

## Security considerations
None — this is static UI with no data fetching, no user input persistence, no external calls.

## Acceptance criteria
- `/design-system` renders all 14 reference sections with working, real components.
- `npm run lint` and TypeScript build pass with no new errors.
- Visual spot-check against `design/vertex-designsystem.png` for color values, type scale, spacing, radius/shadow, and each component state.
- Components are importable and usable from other routes going forward (e.g. `import { Button } from "@/components/ui/Button"`).

## Checks to run
- `npm run lint`
- `npx tsc --noEmit` (or rely on `next build` for the full type check)
- `npm run build`
- `npm run dev` and manually view `/design-system`, plus resize to mobile width to confirm reflow.

## Manual test steps
1. `npm run dev`, open `http://localhost:3000/design-system`.
2. Compare each numbered section side-by-side with `design/vertex-designsystem.png`.
3. Hover/focus/disable-check buttons and the search input to confirm hover and focus-ring colors.
4. Resize the browser to ~375px width and confirm the page stays usable (no horizontal scroll, sections stack).
5. Confirm favicon/tab title is no longer the default "Create Next App".
