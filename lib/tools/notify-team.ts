import { defineTool } from "@copilotkit/runtime/v2";
import type { z } from "zod";
import { TOOL, notifyTeamParams, type NotifyTeamResult } from "../contracts";
import { postToChannel } from "./channels";

const CHANNEL_NAME = process.env.CONCIERGE_SALES_CHANNEL ?? "sales";

export async function notifyTeam({ summary, dealUrl }: z.infer<typeof notifyTeamParams>): Promise<NotifyTeamResult> {
  const content = dealUrl ? `🔥 Hot lead\n${summary}\n${dealUrl}` : `🔥 Hot lead\n${summary}`;
  return { messageId: await postToChannel(CHANNEL_NAME, content) };
}

export const notifyTeamTool = defineTool({
  name: TOOL.notifyTeam,
  description:
    "Post a hot-lead alert to the sales team's chat channel. Call once, after create_lead, with a two-line summary " +
    "(company, seats, timeline, need) and the dealUrl from create_lead.",
  parameters: notifyTeamParams,
  execute: async (args) => notifyTeam(args),
});
