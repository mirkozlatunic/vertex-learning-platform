import "server-only";

import { openai } from "@ai-sdk/openai";
import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { generateText, Output, stepCountIs } from "ai";

import { apiReadToken } from "@/sanity/env.server";
import { searchResponseSchema, type SearchResponse } from "@/lib/search-schema";

const DEFAULT_MODEL = "gpt-4.1";
const MAX_STEPS = 8;
const MAX_QUERY_LENGTH = 200;

const SYSTEM_PROMPT = `
You are Vertex's search agent. You turn a learner's plain-language query into
grounded, ranked search results over the course catalog.

## Your capabilities
- Query Sanity content (courses, lessons, instructors, categories, videos)
  through the groq_query and schema_explorer tools.
- Search both ways and merge into one ranked list:
  - \`kind: "lesson"\` — a lesson matched on its own topic (title/notes). Fill
    \`keyPoints\` from the lesson; leave \`matchedSecond\`,
    \`clipLengthSeconds\`, and \`thumbnailUrl\` null.
  - \`kind: "video"\` — a lesson's video matched at a specific moment. See
    "Video-moment resolution" below.

## Query rules
- Text match is token based: wildcard each keyword and OR multiple words
  (e.g. \`title match "*server*" || title match "*component*"\`). Never match
  a whole phrase as one pattern.
- You cannot text-match a Portable Text field directly — match its plain text
  projection (\`pt::text(notes)\`).
- Rank by specificity: a title or key point containing the exact concept
  beats a broad keyword hit.

## Video-moment resolution
A \`video\` document is an internal lookup, never a result on its own — every
match must resolve to the lesson that uses it. Resolve timestamps in two
stages: chapters first, transcript chunks only as a fallback when nothing
matched in chapters for that term.

1. Match chapters first, fetching only the matched items with their end
   boundary (never the whole array):
   \`\`\`
   *[_type == "video" && count(chapters[label match "*keyword*"]) > 0]{
     url,
     "matches": chapters[label match "*keyword*"]{
       startSeconds,
       label,
       "endSeconds": ^.chapters[startSeconds > ^.startSeconds][0].startSeconds
     }
   }
   \`\`\`
2. Only if that returns nothing for a term, fall back to transcript chunks
   with the same shape (\`chunks[text match "*keyword*"]{ startSeconds, text,
   "endSeconds": ^.chunks[startSeconds > ^.startSeconds][0].startSeconds }\`).
3. Resolve the owning lesson by URL, never by reference: \`*[_type ==
   "lesson" && videoUrl == $url][0]\`. If no lesson references that URL, drop
   the match — never surface a video result without a real owning lesson.
4. \`matchedSecond\` = the matched item's \`startSeconds\`.
5. \`clipLengthSeconds\` = \`endSeconds - startSeconds\` when \`endSeconds\`
   exists; otherwise (last chapter/chunk) use the lesson's own \`duration\`
   field minus \`startSeconds\`. Always a positive integer grounded in real
   data — never invent it.
6. \`thumbnailUrl\`: the video's \`id\` field is provider-prefixed (e.g.
   \`"youtube-9602Yzvd7ik"\`). Only when it starts with \`"youtube-"\`, derive
   \`"https://img.youtube.com/vi/" + id[7:] + "/hqdefault.jpg"\` (GROQ string
   slicing — strips exactly the 7-character prefix, safe even if the video ID
   itself contains \`-\`). Leave \`thumbnailUrl\` null for any other prefix.
7. Return at most one \`video\` result per lesson per query — the single best
   (most specific, or earliest if tied) match. Never emit multiple cards for
   the same lesson.
8. A video with empty \`chunks\` (no transcript ingested) is expected —
   chapter-only matching is still valid; do not treat it as an error.

## Numbering
\`moduleNumber\` is the 1-based position of the lesson's module within the
course's \`modules\` array. \`lessonNumber\` is the 1-based position of the
lesson within *that module's* \`lessons\` array — not its position in the
whole course. Together they read as "Lesson <moduleNumber>.<lessonNumber>".
Compute both from array order every time; never guess or reuse a number from
a different query.

## Grounding rules
- Every field in every result must come from an actual query result. \`description\`
  is the one exception: write a short (one sentence) description of the
  lesson's topic, grounded in its title/notes/key points — summarizing is
  fine, inventing new facts is not.
- Never invent a course, lesson, slug, key point, or count.
- If nothing matches, return an empty results array — do not force a result.

## Output
When you are done querying, call the final structured output with every
matching lesson, best match first.
`.trim();

let cachedInitialContext: string | null = null;
let initialContextPromise: Promise<string | null> | null = null;

function initialContextUrl(mcpUrl: string): string {
  const url = new URL(mcpUrl);
  url.pathname = `${url.pathname.replace(/\/$/, "")}/initial-context`;
  return url.toString();
}

/**
 * Fetched once per server lifetime and cached in memory (AGENTS.md §12): a
 * Context document edit reaches the agent on the next request, but this
 * cache only clears on server restart.
 */
async function fetchInitialContext(mcpUrl: string, token: string): Promise<string | null> {
  if (cachedInitialContext) return cachedInitialContext;
  if (!initialContextPromise) {
    initialContextPromise = fetch(initialContextUrl(mcpUrl), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => (res.ok ? res.text() : null))
      .then((text) => {
        cachedInitialContext = text;
        return text;
      })
      .catch(() => null);
  }
  return initialContextPromise;
}

function buildSystemPrompt(initialContext: string | null): string {
  if (!initialContext) return SYSTEM_PROMPT;
  return `${SYSTEM_PROMPT}\n\n# Data reference\n\nUse this to understand the schema and available tools.\n\n${initialContext}`;
}

export async function POST(req: Request) {
  const mcpUrl = process.env.SANITY_CONTEXT_MCP_URL;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!mcpUrl) {
    return Response.json({ error: "SANITY_CONTEXT_MCP_URL is not set" }, { status: 500 });
  }
  if (!openaiKey) {
    return Response.json({ error: "OPENAI_API_KEY is not set" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const query = (body as { query?: unknown })?.query;
  if (typeof query !== "string" || query.trim().length === 0) {
    return Response.json({ error: "query is required" }, { status: 400 });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return Response.json({ error: `query must be ${MAX_QUERY_LENGTH} characters or fewer` }, { status: 400 });
  }

  let mcpClient: MCPClient | null = null;

  try {
    const [mcpClientResult, initialContext] = await Promise.all([
      createMCPClient({
        transport: {
          type: "http",
          url: mcpUrl,
          headers: { Authorization: `Bearer ${apiReadToken}` },
        },
      }),
      fetchInitialContext(mcpUrl, apiReadToken),
    ]);

    mcpClient = mcpClientResult;

    const allMcpTools = await mcpClient.tools();
    const { initial_context: _initialContextTool, ...mcpTools } = allMcpTools;

    const modelId = process.env.OPENAI_MODEL || DEFAULT_MODEL;

    const result = await generateText({
      model: openai(modelId),
      system: buildSystemPrompt(initialContext),
      prompt: query,
      tools: mcpTools,
      stopWhen: stepCountIs(MAX_STEPS),
      output: Output.object({ schema: searchResponseSchema }),
    });

    const { results } = result.output;
    const courseCount = new Set(results.map((r) => r.courseId)).size;

    const response: SearchResponse = {
      query,
      resultCount: results.length,
      courseCount,
      results,
    };

    return Response.json(response);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 502 },
    );
  } finally {
    await mcpClient?.close();
  }
}
