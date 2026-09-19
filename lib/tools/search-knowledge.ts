import { defineTool } from "@copilotkit/runtime/v2";
import { AMBI_URL, ambi, docToText } from "../ambiguous";
import { TOOL, searchKnowledgeParams, type KnowledgeHit, type SearchKnowledgeResult } from "../contracts";

// Only this Wiki space is visible to website visitors. Internal pages (e.g. the playbook) live elsewhere.
const SPACE = process.env.CONCIERGE_WIKI_SPACE ?? "acme";
const MAX_HITS = 3;
const MAX_CONTENT_CHARS = 2000;
const STOP_WORDS = new Set(["the", "and", "for", "with", "you", "your", "our", "does", "do", "can", "what", "how", "are", "is"]);

type SearchHit = { id: string; title: string; slug: string; snippet: string; space_id: string };
type Page = { id: string; title: string; slug: string; content: string | null };

async function search(q: string): Promise<SearchHit[]> {
  const params = new URLSearchParams({ q, space: SPACE, limit: String(MAX_HITS) });
  const res = await ambi<{ data: SearchHit[] }>(`/api/wiki/search?${params}`);
  return res.data;
}

// Wiki search matches whole phrases and word prefixes: "SAP integration" can miss a page that says "SAP", and
// "on-premise" misses "on-prem". Retry word by word (hyphen parts too), then with 4-letter stems of long words.
async function searchWithFallback(query: string): Promise<SearchHit[]> {
  const direct = await search(query);
  if (direct.length > 0) return direct;
  const words = [
    ...new Set(
      query
        .toLowerCase()
        .split(/[^a-z0-9/-]+/)
        .flatMap((w) => (w.includes("-") ? [w, ...w.split("-")] : [w]))
        .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
    ),
  ].sort((a, b) => b.length - a.length);
  const stems = [...new Set(words.filter((w) => w.length >= 6).map((w) => w.slice(0, 4)))];
  const seen = new Map<string, SearchHit>();
  for (const candidates of [words, stems]) {
    for (const word of candidates) {
      for (const hit of await search(word)) seen.set(hit.id, hit);
      if (seen.size >= MAX_HITS) break;
    }
    if (seen.size > 0) break;
  }
  return [...seen.values()].slice(0, MAX_HITS);
}

// Search snippets are cut mid-word ("…luded in every plan"). Prefer the page line that contains a query word,
// trying words in the order the model gave them; for a FAQ question line, show the answer below it.
function matchingLine(text: string, query: string): string | undefined {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/^[-#*\s]+/, "").replace(/\*\*/g, "").trim())
    .filter(Boolean);
  const words = query.toLowerCase().split(/[^a-z0-9/-]+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  for (const word of words) {
    const index = lines.findIndex((l) => l.length > 15 && l.toLowerCase().includes(word));
    if (index === -1) continue;
    const line = lines[index].endsWith("?") && lines[index + 1] ? lines[index + 1] : lines[index];
    return line.length > 160 ? `${line.slice(0, 157)}…` : line;
  }
  return undefined;
}

export async function searchKnowledge(query: string): Promise<SearchKnowledgeResult> {
  const hits = await searchWithFallback(query);
  const results: KnowledgeHit[] = await Promise.all(
    hits.map(async (hit) => {
      const page = await ambi<Page>(`/api/wiki/pages/${hit.id}`);
      const text = docToText(page.content);
      return {
        title: hit.title,
        snippet: matchingLine(text, query) ?? hit.snippet,
        pageId: hit.id,
        url: `${AMBI_URL}/wiki/${SPACE}/${hit.slug}`,
        content: text.slice(0, MAX_CONTENT_CHARS),
      };
    }),
  );
  return { results };
}

export const searchKnowledgeTool = defineTool({
  name: TOOL.searchKnowledge,
  description:
    "Search the company Wiki. Call before answering any question about the product, integrations, pricing or policies. " +
    "Pass 1-3 keywords (e.g. 'SAP'), not a full sentence. Answer only from the returned content. " +
    "Empty results, or results that do not answer the question, mean the Wiki has no answer.",
  parameters: searchKnowledgeParams,
  execute: async ({ query }) => searchKnowledge(query),
});
