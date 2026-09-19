import { defineTool } from "@copilotkit/runtime/v2";
import type { z } from "zod";
import { AMBI_URL, ambi } from "../ambiguous";
import { TOOL, bookMeetingParams, type BookMeetingResult } from "../contracts";
import { TIMEZONE, schedulerPath, slotLabel } from "./scheduler";

const PIPELINE_NAME = process.env.CONCIERGE_PIPELINE ?? "Sales";
const BOOKED_STAGE = "Meeting booked";
// Fallback task owner when the scheduler fails: the sales rep (Cuneyt).
const SALES_REP_ID = process.env.CONCIERGE_SALES_REP_ID ?? "8d3729d6-a075-481d-a661-31722bdc802c";

type Booking = { id: string; start_at: string; end_at: string; status: string };
type Pipeline = { name: string; stages: { id: string; name: string }[] };

function when(start: string, end?: string) {
  const endTime = end
    ? new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: TIMEZONE }).format(new Date(end))
    : undefined;
  return endTime ? `${slotLabel(start)}–${endTime}` : slotLabel(start);
}

// Best effort: the booking already succeeded, so a failed stage move must not fail the tool.
async function moveDealToBooked(dealId: string) {
  try {
    const { data } = await ambi<{ data: Pipeline[] }>("/api/crm/pipelines");
    const stage = data.find((p) => p.name === PIPELINE_NAME)?.stages.find((s) => s.name === BOOKED_STAGE);
    if (stage) await ambi(`/api/crm/deals/${dealId}`, { method: "PATCH", json: { stage_id: stage.id } });
  } catch (error) {
    console.warn("[book_meeting] could not move deal", dealId, error);
  }
}

export async function bookMeeting(args: z.infer<typeof bookMeetingParams>): Promise<BookMeetingResult> {
  const { start, company, contactName, email, dealId } = args;
  try {
    const { booking } = await ambi<{ booking: Booking }>(`${schedulerPath}/book`, {
      method: "POST",
      json: { start_at: start, guest_name: contactName, guest_email: email, notes: `${company}, booked by Concierge on the website` },
    });
    if (dealId) await moveDealToBooked(dealId);
    return { confirmed: booking.status === "confirmed", when: when(booking.start_at, booking.end_at), via: "scheduler", url: `${AMBI_URL}/calendar` };
  } catch (error) {
    // Fallback: a task for the sales rep to call the visitor at that time.
    console.warn("[book_meeting] scheduler failed, creating a task instead", error);
    await ambi("/api/tasks", {
      method: "POST",
      json: {
        title: `Call ${contactName} (${company}) at ${when(start)}`,
        description: `Meeting requested on the website by ${contactName} <${email}>. The scheduler booking failed.`,
        priority: "high",
        assignee_id: SALES_REP_ID,
        due_date: start.slice(0, 10),
        ...(dealId ? { deal_id: dealId } : {}),
      },
    });
    return { confirmed: true, when: when(start), via: "task", url: `${AMBI_URL}/tasks` }; // task deep-link format unverified
  }
}

export const bookMeetingTool = defineTool({
  name: TOOL.bookMeeting,
  description:
    "Book the call at the slot the visitor picked in choose_slot. Needs their name, company and email, " +
    "and the dealId from create_lead if there is one.",
  parameters: bookMeetingParams,
  execute: async (args) => bookMeeting(args),
});
