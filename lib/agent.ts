import { BuiltInAgent } from "@copilotkit/runtime/v2";
import { bookMeetingTool } from "./tools/book-meeting";
import { createLeadTool } from "./tools/create-lead";
import { logGapTool } from "./tools/log-gap";
import { notifyTeamTool } from "./tools/notify-team";
import { searchKnowledgeTool } from "./tools/search-knowledge";
import { getSlotsTool } from "./tools/slots";

// Override with CONCIERGE_MODEL in .env.local if the bundled @ai-sdk/anthropic rejects the default.
export const MODEL = process.env.CONCIERGE_MODEL ?? "anthropic:claude-sonnet-5";
const COMPANY = process.env.CONCIERGE_COMPANY ?? "Acme";

const PROMPT = `You are Concierge, the website assistant for ${COMPANY}. Visitors are potential customers.

Playbook: the company playbook in your context sets your tone, the current offer and rules. It overrides your
default style. Mention the offer when it is relevant; if the offer is null, never mention or invent discounts.

Knowledge: call search_knowledge before answering any product question. Answer only from its results.
If it returns nothing, or nothing that answers the question, never guess: say you'll check with the team,
call capture_email with the question (skip it if you already know their email), then call log_gap with
the question and the email if they gave one.

Qualifying: when a visitor shows buying interest, find out their company, name, email, how many seats and
their timeline. Ask only for what is missing, in one short question. Once you know all five, call
create_lead exactly once, then offer a 30-minute call with the sales team.

Meetings: if the visitor wants a call, call get_slots, then choose_slot with those slots (the visitor picks
in the chat; never list times in text), then book_meeting with the picked start, their name, company, email
and the dealId. Then call notify_team with a two-line summary including the meeting time, and the dealUrl.
If they decline a call or pick no slot, call notify_team right away without a meeting time.

Plans: when the visitor asks which plan fits them, call search_knowledge for pricing, pick the plan whose
seat range fits, call highlight_plan with it, and answer in one sentence.

Replies: at most 2 short sentences. Cards in the chat show the details, so don't repeat them.`;

export function createConciergeAgent() {
  return new BuiltInAgent({
    model: MODEL,
    prompt: PROMPT,
    maxSteps: 8,
    // One tool call per step. With parallel calls, a server tool + a browser tool in the same step made the
    // follow-up run fail ("Tool result is missing for tool call …") and the reply never arrived.
    providerOptions: { anthropic: { disableParallelToolUse: true } },
    tools: [searchKnowledgeTool, createLeadTool, getSlotsTool, bookMeetingTool, notifyTeamTool, logGapTool],
  });
}
