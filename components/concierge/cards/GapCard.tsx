import type { LogGapResult } from "@/lib/contracts";

export function GapCardLoading() {
  return <div className="my-2 rounded-md border border-line bg-ground px-3 py-2 text-sm text-steel">Sending your question to the team…</div>;
}

export function GapCard({ result }: { result: LogGapResult }) {
  return (
    <div className="my-2 overflow-hidden rounded-md border border-go/40 bg-panel text-sm">
      <p className="flex items-center gap-2 border-b border-go/30 bg-go/10 px-3 py-1.5 font-semibold text-go">
        <span aria-hidden>✓</span> Sent to the Acme team
      </p>
      <div className="px-3 py-2">
        <p className="font-medium text-ink">“{result.question}”</p>
        <p className="text-steel">{result.email ? `The answer goes to ${result.email}` : "We'll add the answer to our help pages"}</p>
      </div>
    </div>
  );
}
