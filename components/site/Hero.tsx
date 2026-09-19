const SERVICE_BOARD = [
  { unit: "TRK-214", job: "Oil & filter", due: "in 320 mi", state: "soon" },
  { unit: "TRK-087", job: "Brake inspection", due: "overdue 2 d", state: "late" },
  { unit: "TRL-530", job: "Tire rotation", due: "in 6 d", state: "ok" },
  { unit: "TRK-162", job: "DVIR defect: left mirror", due: "work order open", state: "soon" },
  { unit: "TRK-301", job: "DOT annual", due: "in 21 d", state: "ok" },
] as const;

const STATE_STYLE = {
  ok: "bg-go/10 text-go",
  soon: "bg-signal/10 text-signal-ink",
  late: "bg-red-600/10 text-red-700",
} as const;

export function Hero() {
  return (
    <section id="product" className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr_1fr] md:py-20">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-steel">Fleet maintenance software</p>
        <h1 className="mt-3 font-display text-5xl font-bold uppercase leading-[0.95] text-balance sm:text-6xl">
          Fleet maintenance <span className="text-signal">on autopilot</span>
        </h1>
        <p className="mt-5 max-w-md text-lg text-steel">
          Service schedules, work orders and driver inspections for trucking fleets. Nothing breaks down because a service was
          missed.
        </p>
        <dl className="mt-8 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-5">
          {[
            ["20–5,000", "vehicles"],
            ["1 day", "to set up"],
            ["$0", "for drivers"],
          ].map(([value, label]) => (
            <div key={label}>
              <dt className="sr-only">{label}</dt>
              <dd className="font-display text-3xl font-bold tabular-nums">{value}</dd>
              <dd className="text-sm text-steel">{label}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div aria-label="Example service board" className="rounded-md border border-line bg-panel shadow-[0_18px_40px_-24px_rgba(21,25,30,0.45)]">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="font-display text-lg font-semibold uppercase tracking-wide">Service due</span>
          <span className="font-mono text-xs text-steel">Yard 2 · 148 units</span>
        </div>
        <ul className="divide-y divide-line">
          {SERVICE_BOARD.map((row) => (
            <li key={row.unit} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 px-4 py-3 text-sm">
              <span className="font-mono font-medium">{row.unit}</span>
              <span className="truncate">{row.job}</span>
              <span className={`rounded-sm px-2 py-0.5 font-mono text-xs ${STATE_STYLE[row.state]}`}>{row.due}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
