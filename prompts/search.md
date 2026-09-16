# Intelligent search: MCP wiring + server-side search API

## Scope for this pass

Per user decisions during scoping:

- **No results page UI this pass.** There is no design reference image for search
  results in `design/` (only home, course, lesson, design-system). AGENTS.md §3
  forbids designing UI without a reference image. The results page (video cards,
  lesson cards, sort control, empty state) is deferred to a follow-up task once a
  design image exists.
- **No video-moment data this pass.** There is no `video` document schema and no
  ingestion pipeline (AGENTS.md §8–9) — no chapters, no transcript chunks. Video
  results require a matched second and clip length, which don't exist yet. This
  pass builds the full search architecture with both result kinds represented in
  the API contract, but video results will come back empty until a separate
  ingestion task adds video documents. That's expected, not a bug.

This pass delivers: the Sanity Context MCP wired up, the Sanity Studio side
(plugin + Context document) needed for the MCP to serve the dataset, and the
server-side `POST /api/search` route that queries content via the MCP and
returns grounded, Zod-validated, ranked results over courses and lessons.

## Skills read

- `create-agent-with-sanity-context` (full skill + `references/nextjs-agent.md`,
  `references/studio-setup.md`, `references/system-prompts.md`,
  `references/adapting-to-stacks.md`, and the reference `route.ts`) — MCP
  connection pattern, initial-context caching, Studio plugin setup.
- `dial-your-context` — format for the Context document's Instructions field
  (pure deltas only, nothing the schema already makes obvious).
- `shape-your-agent` — kept the inline system prompt short; skipped the full
  interactive tone session because AGENTS.md §11 already dictates the agent's
  behavior in full (grounded, no invented data, token-based matching, two result
  kinds, ranked by specificity) — there's no open tone/persona decision to make.
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` —
  Route Handler conventions for the App Router.

## Code inspected

- `studio/schemaTypes/` — `course`, `lesson`, `instructor`, `category`, and the
  `module`/`courseOutcome`/`lessonResource` objects. No `video` document and no
  `sanity.agentContext` document (plugin not installed).
- `studio/sanity.config.ts`, `studio/structure.ts` — `structureTool` uses an
  **explicit** structure, but it only pins `course`/`instructor`/`category` and
  spreads `S.documentTypeListItems()` for everything else, filtered to exclude
  those three. New document types (including the Context plugin's) will appear
  automatically after the divider — no structure change needed.
- `studio/package.json` — Sanity v5.31.2, no `@sanity/context` yet. Latest
  `@sanity/context` on npm is `2.0.0`.
- `sanity/lib/client.ts`, `sanity/env.server.ts` — server-only client, `useCdn:
  false`, `perspective: 'published'`, read token `SANITY_API_READ_TOKEN`
  (viewer role). Reused as-is for search; no new Sanity token needed since
  search is read-only.
- `sanity/lib/queries.ts`, `sanity/lib/data.ts` — existing GROQ projections and
  fetch helpers for courses/lessons/instructors/categories. Confirmed: a lesson
  doesn't store its parent course (reverse-referenced via
  `*[_type == "course" && references(^._id)]`), and module/lesson numbers are
  derived from array order, never stored — both become Instructions-field
  deltas since the MCP's auto-schema can't infer them.
- `.env.example` — Clerk + Sanity vars only. No `OPENAI_API_KEY`, no MCP URL.
- `package.json` (root = the web workspace) — no AI SDK packages, no `zod`
  installed yet.
- `app/api/` — doesn't exist yet; no existing route handlers to match
  conventions against, so following AGENTS.md §5 boundaries (search route is
  server-only) and the Next.js Route Handler doc directly.

## Decisions & assumptions

- **Model/provider**: Vercel AI SDK with the OpenAI provider per AGENTS.md §6.
  New deps: `ai`, `@ai-sdk/openai`, `@ai-sdk/mcp`, `zod` (root package.json).
  Default model `gpt-4.1`, overridable via `OPENAI_MODEL` env var.
- **Structured output**: use the AI SDK's structured-output-while-using-tools
  mode (`generateText` with `tools` for the MCP's `groq_query`/`schema_explorer`
  plus a Zod-validated final output) so the model can query Sanity through the
  MCP and still return a typed, validated result instead of free-text/markdown.
  Search is result cards, not a chatbox, per AGENTS.md §7/§11.
- **Auth token for MCP**: reuse `SANITY_API_READ_TOKEN` (viewer role) as the MCP
  bearer token — search is read-only, no write/insights token needed this pass.
- **MCP URL**: document-scoped
  (`https://api.sanity.io/v2026-03-03/context/mcp/:projectId/:dataset/search`),
  using a new Sanity Context document with slug `search`, so Studio users can
  tune the filter/instructions without a code change (AGENTS.md §10).
- **Content filter**: `_type in ["course", "lesson", "instructor", "category"]`
  — the catalog content search reasons over. No `video` type yet (doesn't
  exist).
- **Instructions field**: hand-drafted from schema inspection rather than a
  full `dial-your-context` interactive session, since the MCP isn't reachable
  yet (Studio isn't deployed) — there's no live dataset to explore against yet.
  Content is deltas only: reverse course lookup for lessons, array-order
  numbering, `pt::text(notes)` for matching Portable Text, freePreview is
  display-only. Documented as a starting point; recommend a follow-up
  `dial-your-context` session once the Studio is deployed and the agent has
  real traffic to learn from.
- **Result shape**: a single flat array, best-first, with a `kind: "video" |
  "lesson"` discriminant (matches AGENTS.md §11 "search both ways and merge...
  rank by specificity" — one ordered list, two visual card kinds). The route
  also returns `resultCount` and `courseCount` (distinct courses represented)
  for the "found 28 results across 8 courses" copy the future UI needs.
- **No auth gate**: browsing/search stays public per AGENTS.md §5 ("gate only
  what a feature marks as private"); search isn't marked private.
- **Initial context caching**: cached in-module memory per AGENTS.md §12 — one
  process-lifetime fetch, refreshed on server restart, exactly like the
  reference implementation.
- **Deploy actions**: implementing this task requires running `npx sanity
  deploy` (Studio must be deployed for the MCP to serve the dataset, AGENTS.md
  §12) and importing the new Context document via `sanity dataset import`
  (same mechanism as the existing `studio/scripts/seed/seed.ndjson`). These
  affect the user's hosted Sanity project. Flagging before running them as part
  of implementation, since approving this prompt approves running them.

## Files expected to touch

- `studio/package.json` — add `@sanity/context`.
- `studio/sanity.config.ts` — add `contextPlugin()` to `plugins`.
- `studio/scripts/seed/search-context.ndjson` (new) — the `sanity.agentContext`
  document (slug `search`, `groqFilter`, `instructions`).
- `package.json` (root) — add `ai`, `@ai-sdk/openai`, `@ai-sdk/mcp`, `zod`.
- `.env.example` — add `OPENAI_API_KEY`, `OPENAI_MODEL` (optional),
  `SANITY_CONTEXT_MCP_URL`.
- `lib/search-schema.ts` (new) — Zod schema + inferred types for the search
  response (shared between the route and, later, the results page).
- `app/api/search/route.ts` (new) — the server route: MCP client, initial
  context caching, system prompt, `generateText` call, response.

## Requirements

- `POST /api/search` accepts `{ query: string }`, rejects empty/overlong
  queries with `400`.
- Connects to the Sanity Context MCP over HTTP with a Bearer token, per
  AGENTS.md §5 ("server route that connects to the Sanity Context MCP, injects
  the schema and the system prompt, calls the LLM").
- Fetches and caches `/initial-context` once per server lifetime; injects it
  into the system prompt; excludes the `initial_context` tool from the tools
  passed to the model.
- Inline system prompt carries the critical query/ranking rules from AGENTS.md
  §11 (token-based OR matching, wildcards, chapters-before-transcript n/a this
  pass, specificity ranking, grounding — never invent a course/lesson/
  timestamp/count). The same rules also live in the Context document's
  Instructions field, per §11's "put the critical rules in both."
- Model output is validated against a Zod schema before the route returns it;
  invalid/unparseable model output is a `502` with a clear error, never passed
  through.
- Response: `{ query, resultCount, courseCount, results: SearchResult[] }`
  where each `SearchResult` is a discriminated union on `kind`:
  - `lesson`: `courseId, courseTitle, courseSlug, moduleTitle, lessonNumber,
    lessonTitle, lessonSlug, description, keyPoints[]`.
  - `video`: same course/module/lesson identity fields, plus `matchedSecond,
    clipLengthSeconds, thumbnailUrl, description`. (Will be empty for now —
    no video documents exist.)
- Never returns a whole Portable Text field or invented data — the model must
  ground every field in a real `groq_query` result.
- No client/browser code changes this pass — route only.

## Security considerations

- `SANITY_API_READ_TOKEN` and `OPENAI_API_KEY` stay server-only env vars, never
  sent to the client (AGENTS.md §5/§12).
- The route only ever reads content (viewer-role token); it cannot write.
- User query text is never concatenated into a GROQ string directly — it's
  passed to the model as a message, and the model constructs GROQ itself via
  the MCP's `groq_query` tool (standard parameterized/tool-mediated access, no
  injection surface in this route).
- Validate the request body shape and cap query length before calling the
  model, to avoid unbounded input reaching the LLM call.
- MCP client is always closed (`finally`), including on error paths, to avoid
  connection leaks.

## Acceptance criteria

- `npx sanity deploy` succeeds and the Studio serves the current schema.
- The `search` Context document is live in the dataset with the filter and
  instructions above.
- `curl -X POST http://localhost:3000/api/search -d '{"query":"..."}'` against
  a real query (e.g. something matched by seeded lesson titles/notes) returns
  `200` with grounded lesson results whose `lessonSlug`/`courseSlug` resolve to
  real seeded documents — no fabricated titles, slugs, or numbers.
- An empty/nonsense query still returns `200` with `resultCount: 0` and an
  empty `results` array (no error).
- `results` is ordered best-first; a query containing an exact lesson/course
  title term ranks that lesson above a broad keyword hit.
- `video` kind results are structurally valid per the schema but empty, since
  no video documents exist yet.
- Type check and lint pass in the web workspace.

## Checks to run

- Web: `npm run lint`, `npx tsc --noEmit` (or the project's type-check script —
  confirming exact command while implementing), `npm run build` (route + config
  changed).
- Studio: `npx sanity deploy` (required before the MCP serves the dataset),
  `npx sanity dataset import studio/scripts/seed/search-context.ndjson
  <dataset> --replace` (or via the general Sanity MCP) to create the Context
  document.
- Manual: verify against the live MCP endpoint with the curl command above and
  at least 2–3 more real queries against the seeded catalog content.

## Manual test steps

1. `cd studio && npx sanity deploy` — confirm the Studio deploy succeeds.
2. Import the Context document: `npx sanity dataset import
   scripts/seed/search-context.ndjson <dataset-name> --replace` (run from
   `studio/`).
3. In Sanity Studio, open the new "Search" Context document and confirm the
   MCP URL shown at the top matches `SANITY_CONTEXT_MCP_URL` in `.env.local`.
4. Set `OPENAI_API_KEY`, `SANITY_CONTEXT_MCP_URL` in `.env.local`.
5. `npm run dev` from the repo root.
6. `curl -X POST http://localhost:3000/api/search -H "Content-Type:
   application/json" -d '{"query":"react server components"}'` (or a term
   matching seeded content) — confirm `200`, non-empty `results`, all
   `lessonSlug`/`courseSlug` values resolve to real Studio documents.
7. Repeat with a query that should match nothing (e.g. `"asdkjfhaslkdjf"`) —
   confirm `200`, `resultCount: 0`, `results: []`.
8. Repeat with a query containing an exact seeded lesson or course title —
   confirm that lesson/course ranks first in `results`.
9. Confirm `video` results are always `[]` for now (expected, no video docs).
