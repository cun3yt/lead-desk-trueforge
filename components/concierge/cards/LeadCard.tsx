import type { CreateLeadResult } from "@/lib/contracts";

export function LeadCardLoading({ company }: { company?: string }) {
  return (
    <div className="my-2 rounded-md border border-line bg-ground px-3 py-2 text-sm text-steel">
      Passing {company ?? "your details"} to the sales team…
    </div>
  );
}

export function LeadCard({ result }: { result: CreateLeadResult }) {
  return (
    <div className="my-2 overflow-hidden rounded-md border border-go/40 bg-panel text-sm">
      <p className="flex items-center gap-2 border-b border-go/30 bg-go/10 px-3 py-1.5 font-semibold text-go">
        <span aria-hidden>✓</span> Sales team has your details
      </p>
      <div className="px-3 py-2">
        <p className="font-display text-xl font-semibold uppercase tracking-wide text-ink">{result.company}</p>
        <dl className="mt-1 grid grid-cols-3 gap-2">
          {[
            ["Seats", String(result.seats)],
            ["Live by", result.timeline],
            ["Needs", result.need],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-steel">{label}</dt>
              <dd className="font-medium text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
