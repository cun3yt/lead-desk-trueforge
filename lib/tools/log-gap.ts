import { defineTool } from "@copilotkit/runtime/v2";
import type { z } from "zod";
import { AMBI_URL, ambi } from "../ambiguous";
import { TOOL, logGapParams, type LogGapResult } from "../contracts";
import { postToChannel } from "./channels";

// The person who owns website knowledge (Oskar, playing Acme's product manager in the demo).
const ASSIGNEE_ID = process.env.CONCIERGE_GAP_ASSIGNEE_ID ?? "04a2d68a-4546-48fe-9a1f-83dee3eeff3b";
const CHANNEL_NAME = process.env.CONCIERGE_GAP_CHANNEL ?? "sales";
const WIKI_SPACE = process.env.CONCIERGE_WIKI_SPACE ?? "acme";
// Tasks outside a project are visible only to their creator (Concierge) and assignee. A workspace-visible
// project puts gap tasks on everyone's Tasks screen, including the presenter's.
const PROJECT_NAME = process.env.CONCIERGE_GAP_PROJECT ?? "Website questions";

let projectId: string | undefined;

async function gapProjectId(): Promise<string | undefined> {
  if (projectId) return projectId;
  const { data } = await ambi<{ data: { id: string; name: string }[] }>("/api/projects");
  projectId = data.find((p) => p.name === PROJECT_NAME)?.id;
  if (!projectId) console.warn(`[log_gap] no project named "${PROJECT_NAME}"; the task will be visible to the assignee only`);
  return projectId;
}

export async function logGap({ question, email }: z.infer<typeof logGapParams>): Promise<LogGapResult> {
  const project = await gapProjectId();
  const { task } = await ambi<{ task: { id: string } }>("/api/tasks", {
    method: "POST",
    json: {
      title: `FAQ gap: "${question}"`,
      description: [
        `A website visitor asked **"${question}"** and the Wiki had no answer.`,
        email ? `Send the answer to: ${email}` : "The visitor left no email.",
        `Add a page to Wiki → ${WIKI_SPACE} so Concierge can answer next time.`,
      ].join("\n\n"),
      priority: "medium",
      assignee_id: ASSIGNEE_ID,
      ...(project ? { project_id: project } : {}),
    },
  });
  // Opening a task doesn't change the app URL; the project list (verified) is the closest link.
  const taskUrl = project ? `${AMBI_URL}/tasks?project=${project}` : `${AMBI_URL}/tasks`;

  // The channel line is a heads-up only; the task is the record. A failed post must not lose the task.
  try {
    await postToChannel(CHANNEL_NAME, `❓ Website question with no Wiki answer: "${question}"\nTask created for the team: ${taskUrl}`);
  } catch (error) {
    console.warn("[log_gap] channel post failed", error);
  }

  return { taskId: task.id, taskUrl, question, ...(email ? { email } : {}) };
}

export const logGapTool = defineTool({
  name: TOOL.logGap,
  description:
    "Record a question the Wiki could not answer: creates a task for the team and a heads-up in chat. " +
    "Call once per unanswered question, after capture_email (pass the email if the visitor gave one).",
  parameters: logGapParams,
  execute: async (args) => logGap(args),
});
