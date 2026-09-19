import type { ChooseSlotResult, Slot } from "@/lib/contracts";

export function SlotPickerLoading() {
  return (
    <div className="my-2 rounded-md border border-line bg-ground px-3 py-2 text-sm text-steel">Finding times with our sales team…</div>
  );
}

// Waiting state: the agent is paused until the visitor clicks.
export function SlotPicker({ slots, onPick }: { slots: Slot[]; onPick: (result: ChooseSlotResult) => void }) {
  return (
    <div className="my-2 overflow-hidden rounded-md border border-signal/50 bg-panel text-sm">
      <p className="border-b border-signal/30 bg-signal/10 px-3 py-1.5 font-semibold text-signal-ink">
        Pick a time · 30 min with Acme sales
      </p>
      <div className="grid grid-cols-2 gap-2 p-3">
        {slots.map((slot) => (
          <button
            key={slot.start}
            type="button"
            onClick={() => onPick({ start: slot.start })}
            className="rounded-sm border border-line px-2 py-2 text-left font-medium text-ink hover:border-signal hover:bg-signal/5 focus-visible:outline-2 focus-visible:outline-signal"
          >
            {slot.label}
          </button>
        ))}
      </div>
      <div className="px-3 pb-3 text-right">
        <button type="button" onClick={() => onPick({ declined: true })} className="text-steel underline-offset-2 hover:underline">
          None of these work
        </button>
      </div>
    </div>
  );
}

export function SlotPicked({ slots, result }: { slots: Slot[]; result: ChooseSlotResult | null }) {
  if (!result || "declined" in result) {
    return <div className="my-2 rounded-md border border-line bg-ground px-3 py-2 text-sm text-steel">No time picked</div>;
  }
  const label = slots.find((s) => s.start === result.start)?.label ?? result.start;
  return <div className="my-2 rounded-md border border-line bg-ground px-3 py-2 text-sm text-steel">Picked {label}</div>;
}
