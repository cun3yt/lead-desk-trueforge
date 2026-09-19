import { defineTool } from "@copilotkit/runtime/v2";
import { ambi } from "../ambiguous";
import { TOOL, getSlotsParams, type GetSlotsResult, type Slot } from "../contracts";
import { localHour, schedulerPath, slotLabel } from "./scheduler";

type SchedulerSlot = { start: string; end: string };

// A short, readable choice: per business day, the first free slot from 10:00 and from 14:00 local time.
const PREFERRED_HOURS = [10, 14];
const MAX_SLOTS = 6;

export async function getSlots(days = 3): Promise<GetSlotsResult> {
  const slots: Slot[] = [];
  const date = new Date();
  for (let checked = 0; checked < 14 && slots.length < MAX_SLOTS && days > 0; checked++) {
    date.setUTCDate(date.getUTCDate() + 1);
    const day = date.toISOString().slice(0, 10);
    const { slots: free } = await ambi<{ slots: SchedulerSlot[] }>(`${schedulerPath}/slots?date=${day}`);
    if (free.length === 0) continue; // weekend or fully booked
    days--;
    for (const hour of PREFERRED_HOURS) {
      const slot = free.find((s) => localHour(s.start) >= hour && !slots.some((picked) => picked.start === s.start));
      if (slot) slots.push({ start: slot.start, label: slotLabel(slot.start) });
    }
  }
  return { slots: slots.slice(0, MAX_SLOTS) };
}

export const getSlotsTool = defineTool({
  name: TOOL.getSlots,
  description:
    "Get free times for a 30-minute call with the sales team. Call when the visitor wants to talk to someone, " +
    "then pass the slots to choose_slot. Never list the times in text.",
  parameters: getSlotsParams,
  execute: async ({ days }) => getSlots(days),
});
