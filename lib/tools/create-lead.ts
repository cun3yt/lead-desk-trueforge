import { defineTool } from "@copilotkit/runtime/v2";
import type { z } from "zod";
import { AMBI_URL, AmbiError, ambi } from "../ambiguous";
import { TOOL, createLeadParams, type CreateLeadResult } from "../contracts";

// Deals without a pipeline don't show on the CRM board, and the pipeline can't be set after creation.
const PIPELINE_NAME = process.env.CONCIERGE_PIPELINE ?? "Sales";

type Contact = { id: string };
type Deal = { id: string };
type Pipeline = { id: string; name: string; stages: { id: string; name: string; sort_order: number }[] };

let pipeline: { pipelineId: string; stageId: string } | undefined;

async function newLeadStage() {
  if (pipeline) return pipeline;
  const { data } = await ambi<{ data: Pipeline[] }>("/api/crm/pipelines");
  const found = data.find((p) => p.name.toLowerCase() === PIPELINE_NAME.toLowerCase());
  const first = found?.stages.toSorted((a, b) => a.sort_order - b.sort_order)[0];
  if (!found || !first) throw new Error(`No CRM pipeline named "${PIPELINE_NAME}" with stages. Create it in Ambiguous CRM.`);
  pipeline = { pipelineId: found.id, stageId: first.id };
  return pipeline;
}

// Ambiguous answers 409 {"deal_id"} when a deal with the same title exists (e.g. a demo rerun): reuse it.
async function createDeal(json: Record<string, unknown>): Promise<string> {
  try {
    const { deal } = await ambi<{ deal: Deal }>("/api/crm/deals", { method: "POST", json });
    return deal.id;
  } catch (error) {
    if (error instanceof AmbiError && error.status === 409) {
      const existing = JSON.parse(error.body) as { deal_id?: string };
      if (existing.deal_id) return existing.deal_id;
    }
    throw error;
  }
}

export async function createLead(args: z.infer<typeof createLeadParams>, titlePrefix = ""): Promise<CreateLeadResult> {
  const { company, contactName, email, seats, timeline, need } = args;
  const { pipelineId, stageId } = await newLeadStage();

  const { contact: companyContact } = await ambi<{ contact: Contact }>("/api/crm/contacts", {
    method: "POST",
    json: { type: "company", name: `${titlePrefix}${company}` },
  });
  const { contact: person } = await ambi<{ contact: Contact }>("/api/crm/contacts", {
    method: "POST",
    json: { type: "person", name: contactName, email: email ?? null, company_id: companyContact.id },
  });
  const dealId = await createDeal({
    title: `${titlePrefix}${company}: ${seats} seats, live by ${timeline}, ${need}`,
    contact_id: person.id,
    company_id: companyContact.id,
    pipeline_id: pipelineId,
    stage_id: stageId,
    status: "open",
  });

  return {
    contactId: person.id,
    dealId,
    company,
    seats,
    timeline,
    need,
    dealUrl: `${AMBI_URL}/crm/pipeline?deal=${dealId}`, // web route seen in the app; /crm/deals/{id} opens the overview
  };
}

export const createLeadTool = defineTool({
  name: TOOL.createLead,
  description:
    "Create the visitor's company, contact and an open deal in the CRM. " +
    "Call exactly once per visitor, only after you know company, contact name, seats and timeline.",
  parameters: createLeadParams,
  execute: async (args) => createLead(args),
});
