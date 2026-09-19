// Tool contracts: the interface between Track A (server tools) and Track B (cards and browser tools).
// Change only by agreement between both tracks. Source: docs/concierge/dev-plan.md "Tool contracts".
import { z } from "zod";

// ---------- Tool names (snake_case, unique across server and browser: a server tool silently wins a collision)

export const TOOL = {
  searchKnowledge: "search_knowledge", // server
  createLead: "create_lead", // server
  getSlots: "get_slots", // server
  chooseSlot: "choose_slot", // browser, human-in-the-loop
  bookMeeting: "book_meeting", // server
  notifyTeam: "notify_team", // server
  captureEmail: "capture_email", // browser, human-in-the-loop
  logGap: "log_gap", // server
  highlightPlan: "highlight_plan", // browser
} as const;

// ---------- Parameters (what the model sends)

export const searchKnowledgeParams = z.object({
  query: z.string().min(1).describe("Search words, e.g. 'SAP integration'"),
});

export const createLeadParams = z.object({
  company: z.string().min(1),
  contactName: z.string().min(1),
  email: z.string().email().optional(),
  seats: z.number().int().positive(),
  timeline: z.string().min(1).describe("When they need it live, e.g. 'Q4'"),
  need: z.string().min(1).describe("Main need in a few words, e.g. 'SAP integration'"),
});

export const getSlotsParams = z.object({
  days: z.number().int().min(1).max(14).optional().describe("How many days ahead to look. Default 5."),
});

export const slotSchema = z.object({
  start: z.string().describe("ISO 8601 start time"),
  label: z.string().describe("Human label, e.g. 'Tue 15 Sep 10:00'"),
});

export const chooseSlotParams = z.object({
  slots: z.array(slotSchema).min(1),
});

export const bookMeetingParams = z.object({
  start: z.string().describe("ISO 8601 start from choose_slot"),
  company: z.string().min(1),
  contactName: z.string().min(1),
  email: z.string().email().describe("Required by the Ambiguous scheduler; ask the visitor first"),
  dealId: z.string().optional().describe("dealId from create_lead; the deal moves to 'Meeting booked'"),
});

export const notifyTeamParams = z.object({
  summary: z.string().min(1).describe("Two-line lead summary for the sales channel"),
  dealUrl: z.string().url().optional(),
});

export const captureEmailParams = z.object({
  question: z.string().min(1).describe("The visitor question we could not answer"),
});

export const logGapParams = z.object({
  question: z.string().min(1),
  email: z.string().email().optional(),
});

export const planSchema = z.enum(["starter", "growth", "enterprise"]);

export const highlightPlanParams = z.object({
  plan: planSchema,
});

// ---------- Results (what the tool returns; cards render these)

export type KnowledgeHit = {
  title: string;
  snippet: string; // short excerpt for the card
  pageId: string;
  url: string; // opens the page in Ambiguous
  content?: string; // page text for the model to answer from; cards ignore it
};
export type SearchKnowledgeResult = { results: KnowledgeHit[] }; // empty = knowledge gap

export type CreateLeadResult = {
  contactId: string;
  dealId: string;
  company: string;
  seats: number;
  timeline: string;
  need: string;
  dealUrl: string;
};

export type Slot = z.infer<typeof slotSchema>;
export type GetSlotsResult = { slots: Slot[] };

export type ChooseSlotResult = { start: string } | { declined: true };

export type BookMeetingResult = {
  confirmed: boolean;
  when: string; // human label, e.g. "Tue 15 Sep, 10:00-10:30"
  via: "scheduler" | "task"; // "task" = fallback: sales calls the visitor
  url: string;
};

export type NotifyTeamResult = { messageId: string };

export type CaptureEmailResult = { email: string } | { declined: true };

export type LogGapResult = {
  taskId: string;
  taskUrl: string;
  question: string;
  email?: string;
};

export type Plan = z.infer<typeof planSchema>;
export type HighlightPlanResult = "highlighted";

// ---------- Fixtures (example data for building cards before the real tools exist)

export const FIXTURES = {
  searchKnowledge: {
    results: [
      {
        title: "Integrations",
        snippet: "Two-way sync with SAP S/4HANA, set up in about a day.",
        pageId: "00000000-0000-0000-0000-000000000001",
        url: "https://app.ambiguous.ai/",
      },
    ],
  } satisfies SearchKnowledgeResult,
  searchKnowledgeEmpty: { results: [] } satisfies SearchKnowledgeResult,
  createLead: {
    contactId: "00000000-0000-0000-0000-000000000002",
    dealId: "00000000-0000-0000-0000-000000000003",
    company: "Northline Freight",
    seats: 200,
    timeline: "Q4",
    need: "SAP integration",
    dealUrl: "https://app.ambiguous.ai/",
  } satisfies CreateLeadResult,
  getSlots: {
    slots: [
      { start: "2026-09-15T10:00:00-07:00", label: "Tue 15 Sep 10:00" },
      { start: "2026-09-15T14:30:00-07:00", label: "Tue 15 Sep 14:30" },
      { start: "2026-09-16T09:00:00-07:00", label: "Wed 16 Sep 09:00" },
      { start: "2026-09-17T16:00:00-07:00", label: "Thu 17 Sep 16:00" },
    ],
  } satisfies GetSlotsResult,
  bookMeeting: {
    confirmed: true,
    when: "Tue 15 Sep, 10:00-10:30",
    via: "scheduler",
    url: "https://app.ambiguous.ai/",
  } satisfies BookMeetingResult,
  notifyTeam: { messageId: "00000000-0000-0000-0000-000000000004" } satisfies NotifyTeamResult,
  logGap: {
    taskId: "00000000-0000-0000-0000-000000000005",
    taskUrl: "https://app.ambiguous.ai/",
    question: "Do you offer on-prem?",
    email: "jane@northline.example",
  } satisfies LogGapResult,
} as const;
