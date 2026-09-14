# Implementation Prompt: Sanity Content Model, Studio, and Server Read Data Layer

## Goal
Build the Sanity content model for Vertex (course, module, lesson, instructor, category — AGENTS.md section 8) as a **standalone Studio workspace**, and build the web app's server-only Sanity client and typed data-fetching layer. No pages consume this data yet — that's later prompts.

## Skills consulted
- `sanity-best-practices` skill — `references/schema.md` (strict `defineType`/`defineField`/`defineArrayMember`, icons, references vs. embedded objects, `_key` handling), `references/project-structure.md` (standalone Studio vs. embedded), `references/nextjs.md` section 5 (migrating an embedded Studio to standalone), `references/typegen.md` (TypeGen wiring).
- AGENTS.md sections 5 ("two standalone workspaces… do not embed the Studio inside Next.js"), 6 (tech stack), 8 (data shape), 12 ("an embedded Studio" listed as something not to use; private dataset; server-only tokens).

## Code inspected
- Root `sanity.config.ts`, `sanity.cli.ts`, `app/studio/[[...tool]]/page.tsx`, `sanity/schemaTypes/index.ts` (empty), `sanity/structure.ts`, `sanity/env.ts`, `sanity/lib/client.ts`, `sanity/lib/live.ts`, `sanity/lib/image.ts` — this is the default `create sanity` **embedded**-Studio scaffold (mounted at `/studio` inside the Next.js app, `'use client'` config).
- `.env.local` — has `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET`, no read token yet.
- `package.json` — single workspace at repo root (`next-sanity`, `sanity`, `@sanity/vision`, `@sanity/image-url` already installed at root). `@sanity/icons` is present in `node_modules` but not yet a declared dependency. `server-only` is present transitively (via `next-sanity`) but not declared either.
- `tsconfig.json` — `@/*` aliases to repo root.

## Decision flagged for approval: de-embed the Studio
AGENTS.md is explicit that Studio and web must be separate workspaces and that an embedded Studio is one of the things *not* to use (sections 5 and 12), and the `sanity-best-practices` skill independently recommends the same (slower builds, no auto-updates, no TypeGen watch mode, content model becomes web-centric). The current scaffold is the embedded pattern. Since no schema exists yet, this is the cheapest possible moment to fix it. I will:

1. Create a new **standalone Studio workspace** at `studio/` (own `package.json`, `sanity.config.ts`, `sanity.cli.ts`, `schemaTypes/`), reusing the existing `projectId`/`dataset`.
2. Delete the embedded route (`app/studio/`) and the root `sanity.config.ts` / `sanity.cli.ts`.
3. Move `sanity/schemaTypes/` and `sanity/structure.ts` into `studio/`; keep `sanity/env.ts`, `sanity/lib/image.ts` in the web app (repo root) since the web app still needs projectId/dataset/image URL building, but rewrite `sanity/lib/client.ts` as the server-only read client and drop `sanity/lib/live.ts` (Visual Editing / Live Content API is not in scope per AGENTS.md's feature list — pages are read-only server-rendered fetches, not requested yet; adding it now would be overbuilding).
4. Root `package.json` gains a `dataset`/`project` info only via env; `studio/package.json` is independent so `sanity dev`/`sanity build` run on Vite, not through Next.js.

This is a structural change beyond "just add schemas," so I'm flagging it explicitly rather than doing it silently.

## Schema design (from AGENTS.md section 8)

Documents — `studio/schemaTypes/documents/`:
- `course.ts`: `title` (string, required), `slug` (slug from title, required), `summary` (text), `coverImage` (image, hotspot), `level` (string, list: Beginner/Intermediate/Advanced), `price` (number), `popular` (boolean, optional), `studentCount` (number, optional, display only), `outcomes` (array of `courseOutcome` objects), `instructor` (reference to instructor, required), `category` (reference to category, required), `modules` (array of `module` objects, required, min 1).
- `lesson.ts`: `title` (string, required), `slug` (slug, required), `videoUrl` (url, required), `poster` (image, hotspot), `duration` (number — seconds, required), `freePreview` (boolean, default false), `studentCount` (number, optional), `notes` (Portable Text array), `keyPoints` (array of string), `proTip` (text, optional), `resources` (array of `lessonResource` objects). No course reference field, per spec ("a lesson does not store its parent course") — course is derived by reverse lookup in GROQ (`*[references(^._id)]` from module lesson refs).
- `instructor.ts`: `name` (string, required), `slug` (slug, required), `photo` (image, hotspot), `expertise` (array of string), `bio` (text).
- `category.ts`: `title` (string, required), `slug` (slug, required), `description` (text).

Objects (embedded, not documents) — `studio/schemaTypes/objects/`:
- `module.ts`: `title` (string, required), `summary` (text), `lessons` (array of reference to `lesson`, required, min 1). Lives only inside `course.modules`; module numbering and lesson numbering (`Module 5`, `Lesson 5.1`) are derived from array order in the frontend, never stored.
- `courseOutcome.ts`: `icon` (string — a `lucide-react` icon name, e.g. `"BookOpen"`, rendered by the frontend), `title` (string, required), `description` (text).
- `lessonResource.ts`: `type` (string, list: pdf/article/code/video/link), `title` (string, required), `description` (text), `url` (url, required).

Every document and object gets an icon from `@sanity/icons` per the schema skill's UX convention. `studio/schemaTypes/index.ts` exports the combined array. Desk structure (`studio/structure.ts`) lists document types in a sensible grouping (Courses, Instructors, Categories at top level; lessons reachable both standalone and via course modules).

## Files expected to touch/create

New — `studio/` workspace:
- `studio/package.json`, `studio/tsconfig.json`, `studio/sanity.config.ts`, `studio/sanity.cli.ts` (with `typegen` pointing at `../` for queries and `../sanity.types.ts` for output, per the TypeGen skill).
- `studio/schemaTypes/index.ts`, `studio/schemaTypes/documents/{course,lesson,instructor,category}.ts`, `studio/schemaTypes/objects/{module,courseOutcome,lessonResource}.ts`.
- `studio/structure.ts`.

Deleted:
- `app/studio/[[...tool]]/page.tsx` (and the now-empty `app/studio/` dir).
- Root `sanity.config.ts`, `sanity.cli.ts`.
- `sanity/schemaTypes/`, `sanity/structure.ts`, `sanity/lib/live.ts` (moved/superseded as above).

Changed/new — web app data layer (repo root, existing `sanity/` dir kept for this):
- `sanity/env.ts` — keep `projectId`/`dataset`/`apiVersion`; add server-only `apiReadToken` (`SANITY_API_READ_TOKEN`, no `NEXT_PUBLIC_` prefix).
- `sanity/lib/client.ts` — rewritten: `import 'server-only'`; `createClient` with `token: apiReadToken`, `useCdn: false` (server-rendered reads of a private dataset need the token path, not the CDN), `perspective: 'published'`.
- `sanity/lib/image.ts` — unchanged (already correct: pure `urlFor` builder, safe to import from client components).
- `sanity/lib/queries.ts` — new: GROQ query strings/`defineQuery` for the catalog list, one course by slug (with resolved instructor, category, and modules→lessons expanded), one lesson by slug (with derived parent course/module via reverse reference), instructor by slug, category by slug. Every array projection includes `_key` per the schema skill's rule.
- `sanity/lib/data.ts` — new: typed async functions wrapping the client + queries (`getCourses()`, `getCourseBySlug(slug)`, `getLessonBySlug(slug)`, `getInstructorBySlug(slug)`, `getCategories()`), each `import 'server-only'` and returning `null` (not throwing) when a document isn't found, so pages can call `notFound()`.
- `package.json` (root) — add `@sanity/icons` and `server-only` as explicit dependencies (both already resolve today only because `sanity`/`next-sanity` pull them in transitively).

New root config:
- `.env.example` — canonical list of env vars (`NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`, `SANITY_API_READ_TOKEN`, plus the existing Clerk vars already in `.env.local`), per AGENTS.md section 12.
- Root `README.md` gains a short "two workspaces" note (`npm run dev` for the web app at :3000, `npm --prefix studio run dev` for the Studio at :3333) — small addition, not a rewrite.

## Requirements
- Studio and web are fully independent npm projects; the web app has zero Studio dependencies (`sanity`, `@sanity/vision`, `styled-components` move to `studio/package.json` only, since `styled-components` was a Studio-only transitive need from the embedded scaffold — will verify at implementation time whether root still needs any of them and drop what it doesn't).
- Web app never imports `sanity/lib/client.ts` from a Client Component — it's `server-only`-guarded so an accidental import fails the build loudly rather than leaking the token.
- Dataset is treated as private: no `NEXT_PUBLIC_` token, no `useCdn: true` read path that would bypass the token.
- Schema matches AGENTS.md section 8's fixed relationships (module is embedded, not a document; lesson has no back-reference to course; instructor/category are referenced, not embedded).
- All GROQ projections that touch arrays include `_key`.

## Security considerations
- `SANITY_API_READ_TOKEN` stays server-only, added to `.env.local` (already gitignored) and documented (name only, no value) in `.env.example`.
- `sanity/lib/client.ts` uses the `server-only` import guard so it cannot be bundled into client JS.
- No write access anywhere in this layer — read token only, no mutations. Progress-record writes are explicitly out of scope for this prompt (future server route, per AGENTS.md section 8/section 5).

## Acceptance criteria
- `npm --prefix studio run dev` starts the Studio on :3333, shows Course/Lesson/Instructor/Category in the desk structure, and I can create one of each by hand and see a course's modules resolve to real lessons.
- `npm run typegen` (run from `studio/`) extracts the schema and generates `sanity.types.ts` at the repo root without error.
- From the web app, `getCourses()` and `getCourseBySlug()` (called from a throwaway server component or a quick script) return real data from the dataset once test content exists, with `instructor`/`category`/`modules[].lessons[]` resolved.
- `npm run lint` and `npx tsc --noEmit` pass in both workspaces.
- `npm run build` succeeds at the repo root with the Studio route gone (smaller/faster build, no `sanity`/`@sanity/vision` in the web bundle).

## Checks to run
- Root: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- `studio/`: `npm install`, `npm run dev` (manually verify schema in the desk tool), `npm run typegen` (or `npx sanity schemas extract --force && npx sanity typegen generate` if no shortcut script).

## Manual test steps
1. `npm --prefix studio install`, then `npm --prefix studio run dev`; open `http://localhost:3333`, confirm Course/Lesson/Instructor/Category document types appear with icons.
2. Create one Category, one Instructor, one Lesson, and one Course referencing them with one Module containing that lesson; publish all.
3. `npm run dev` at repo root; in a scratch server component or `npx tsx` script, call `getCourses()` and `getCourseBySlug()` from `sanity/lib/data.ts` and confirm the returned object has the instructor name, category title, and the module's lesson resolved (not just an `_ref`).
4. `npm run build` at repo root — confirm it succeeds and the `/studio` route no longer exists (404 if visited on the running app).
5. Grep the web app's client bundle output (or just confirm `next build` doesn't error) to sanity-check `sanity/lib/client.ts` was never pulled into client-side code.
