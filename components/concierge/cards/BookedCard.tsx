import type { BookMeetingResult } from "@/lib/contracts";

export function BookedCardLoading() {
  return <div className="my-2 rounded-md border border-line bg-ground px-3 py-2 text-sm text-steel">Booking your call…</div>;
}

export function BookedCard({ result }: { result: BookMeetingResult }) {
  const booked = result.via === "scheduler";
  return (
    <div className="my-2 overflow-hidden rounded-md border border-go/40 bg-panel text-sm">
      <p className="flex items-center gap-2 border-b border-go/30 bg-go/10 px-3 py-1.5 font-semibold text-go">
        <span aria-hidden>✓</span> {booked ? "Call booked" : "Sales will call you"}
      </p>
      <div className="px-3 py-2">
        <p className="font-display text-xl font-semibold uppercase tracking-wide text-ink">{result.when}</p>
        <p className="text-steel">{booked ? "30 min with Acme sales · calendar invite sent" : "At the time you picked"}</p>
      </div>
    </div>
  );
}
