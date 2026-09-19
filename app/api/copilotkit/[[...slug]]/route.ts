import { CopilotRuntime, createCopilotRuntimeHandler } from "@copilotkit/runtime/v2";
import { createConciergeAgent } from "@/lib/agent";

const runtime = new CopilotRuntime({
  agents: { default: createConciergeAgent() },
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
});

export const GET = handler;
export const POST = handler;
