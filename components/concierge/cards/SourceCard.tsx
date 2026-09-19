import type { SearchKnowledgeResult } from "@/lib/contracts";

// Search snippets carry Markdown and cut-off ellipses; make them readable in one or two lines.
function cleanSnippet(snippet: string) {
  return snippet
    .replace(/[#*_`>]/g, "")
    .replace(/^\s*-\s+/gm, "")
    .replace(/\s+/g, " ")
    .replace(/^\.\.\.|\.\.\.$/g, "…")
    .trim();
}

export function SourceCardLoading({ query }: { query?: string }) {
  return (
    <div className="my-2 rounded-md border border-line bg-ground px-3 py-2 text-sm text-steel">
      Searching Acme knowledge base{query ? ` for “${query}”` : ""}…
    </div>
  );
}

export function SourceCard({ result }: { result: SearchKnowledgeResult }) {
  if (result.results.length === 0) return null; // knowledge gap: the agent says so in text (S7 adds a card)
  return (
    <div className="my-2 overflow-hidden rounded-md border border-line bg-panel text-sm">
      <p className="border-b border-line bg-ground px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-steel">
        Sources · Acme knowledge base
      </p>
      <ul className="divide-y divide-line">
        {result.results.map((hit) => (
          <li key={hit.pageId} className="px-3 py-2">
            <a href={hit.url} target="_blank" rel="noreferrer" className="font-semibold text-ink hover:text-signal-ink">
              {hit.title} <span aria-hidden>↗</span>
            </a>
            <p className="mt-0.5 line-clamp-2 text-steel">{cleanSnippet(hit.snippet)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
