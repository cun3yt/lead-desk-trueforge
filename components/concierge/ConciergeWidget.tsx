"use client";

import { useMemo } from "react";
import {
  CopilotPopup,
  ToolCallStatus,
  useAgentContext,
  useFrontendTool,
  useHumanInTheLoop,
  useRenderTool,
} from "@copilotkit/react-core/v2";
import {
  TOOL,
  bookMeetingParams,
  captureEmailParams,
  chooseSlotParams,
  createLeadParams,
  searchKnowledgeParams,
  type BookMeetingResult,
  type CaptureEmailResult,
  type ChooseSlotResult,
  type CreateLeadResult,
  type LogGapResult,
  type SearchKnowledgeResult,
  getSlotsParams,
  highlightPlanParams,
  logGapParams,
  type Plan,
} from "@/lib/contracts";
import type { Playbook } from "@/lib/playbook";
import { BookedCard, BookedCardLoading } from "./cards/BookedCard";
import { EmailCapture, EmailCaptured } from "./cards/EmailCapture";
import { GapCard, GapCardLoading } from "./cards/GapCard";
import { LeadCard, LeadCardLoading } from "./cards/LeadCard";
import { parseResult } from "./cards/parse";
import { SlotPicked, SlotPicker, SlotPickerLoading } from "./cards/SlotPicker";
import { SourceCard, SourceCardLoading } from "./cards/SourceCard";

// X1: the agent drives the page. Scroll to the plan card and mark it; CSS in globals.css draws the highlight.
function highlightPlan(plan: Plan) {
  document.querySelectorAll("[data-plan]").forEach((card) => card.removeAttribute("data-highlighted"));
  const card = document.getElementById(`plan-${plan}`);
  if (!card) return false;
  card.setAttribute("data-highlighted", "true");
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  return true;
}

export function ConciergeWidget({ playbook, greeting }: { playbook: Playbook; greeting: string }) {
  // Stable labels object: a new one on every render would re-trigger the chat configuration.
  const labels = useMemo(
    () => ({
      modalHeaderTitle: "Acme assistant",
      welcomeMessageText: greeting,
      chatInputPlaceholder: "Ask about Acme…",
    }),
    [greeting],
  );

  // Flow B: the company's playbook (Wiki → Home → Concierge playbook), read on page load.
  useAgentContext({
    description:
      "Company playbook written by Acme in its Wiki. Use its tone for every reply, mention the offer when it is relevant " +
      "(offer null = no offer, never invent one) and follow every rule.",
    value: playbook,
  });

  useFrontendTool(
    {
      name: TOOL.highlightPlan,
      description:
        "Scroll the website to the pricing section and highlight one plan. Call when the visitor asks which plan fits them, " +
        "after checking pricing with search_knowledge.",
      parameters: highlightPlanParams,
      handler: async ({ plan }) => (highlightPlan(plan) ? "highlighted" : `no plan card for ${plan}`),
      render: ({ status, args }) =>
        status === ToolCallStatus.Complete ? (
          <div className="my-2 rounded-md border border-line bg-ground px-3 py-2 text-sm text-steel">
            Highlighted <span className="font-semibold capitalize text-ink">{args.plan}</span> on the pricing section
          </div>
        ) : null,
    },
    [],
  );

  useRenderTool(
    {
      name: TOOL.searchKnowledge,
      parameters: searchKnowledgeParams,
      render: ({ status, parameters, result }) => {
        if (status !== "complete") return <SourceCardLoading query={parameters.query} />;
        const parsed = parseResult<SearchKnowledgeResult>(result);
        return parsed ? <SourceCard result={parsed} /> : null;
      },
    },
    [],
  );

  useRenderTool(
    {
      name: TOOL.createLead,
      parameters: createLeadParams,
      render: ({ status, parameters, result }) => {
        if (status !== "complete") return <LeadCardLoading company={parameters.company} />;
        const parsed = parseResult<CreateLeadResult>(result);
        return parsed ? <LeadCard result={parsed} /> : null;
      },
    },
    [],
  );

  useRenderTool(
    {
      name: TOOL.getSlots,
      parameters: getSlotsParams,
      render: ({ status }) => (status === "complete" ? null : <SlotPickerLoading />), // slots show in choose_slot
    },
    [],
  );

  // Human in the loop: the agent pauses until the visitor picks a slot (or declines).
  useHumanInTheLoop(
    {
      name: TOOL.chooseSlot,
      description:
        "Show the slots from get_slots as buttons and wait for the visitor to pick one. " +
        "Returns { start } or { declined: true }.",
      parameters: chooseSlotParams,
      render: ({ status, args, respond, result }) => {
        const slots = args.slots ?? [];
        if (status === ToolCallStatus.InProgress) return <SlotPickerLoading />;
        if (status === ToolCallStatus.Executing) return <SlotPicker slots={slots} onPick={(picked) => void respond(picked)} />;
        return <SlotPicked slots={slots} result={parseResult<ChooseSlotResult>(result)} />;
      },
    },
    [],
  );

  useRenderTool(
    {
      name: TOOL.bookMeeting,
      parameters: bookMeetingParams,
      render: ({ status, result }) => {
        if (status !== "complete") return <BookedCardLoading />;
        const parsed = parseResult<BookMeetingResult>(result);
        return parsed ? <BookedCard result={parsed} /> : null;
      },
    },
    [],
  );

  // Knowledge gap (Flow E): ask where to send the answer, then show that the team got the question.
  useHumanInTheLoop(
    {
      name: TOOL.captureEmail,
      description:
        "Ask the visitor for an email so the team can send the answer to a question the Wiki could not answer. " +
        "Returns { email } or { declined: true }.",
      parameters: captureEmailParams,
      render: ({ status, args, respond, result }) => {
        if (status === ToolCallStatus.Executing) return <EmailCapture question={args.question} onSubmit={(value) => void respond(value)} />;
        if (status === ToolCallStatus.Complete) return <EmailCaptured result={parseResult<CaptureEmailResult>(result)} />;
        return null;
      },
    },
    [],
  );

  useRenderTool(
    {
      name: TOOL.logGap,
      parameters: logGapParams,
      render: ({ status, result }) => {
        if (status !== "complete") return <GapCardLoading />;
        const parsed = parseResult<LogGapResult>(result);
        return parsed ? <GapCard result={parsed} /> : null;
      },
    },
    [],
  );

  // notify_team has no card on purpose: the alert shows up in Ambiguous #sales (right screen).

  return (
    <CopilotPopup labels={labels} />
  );
}
