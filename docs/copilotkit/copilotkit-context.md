# CopilotKit — agent context

Read this before writing any CopilotKit code (React chat UI, Copilot Runtime endpoint, frontend/server tools, generative UI, human-in-the-loop, MCP) or wiring CopilotKit to Ambiguous. Fetched 2026-09-12 from `https://docs.copilotkit.ai/llms.txt` + `llms-full.txt` (raw copies in `raw/`), npm registry, and package type definitions (`@copilotkit/runtime@1.71.1`). Snippets marked "docs" are verbatim from the docs (highlight comments stripped). When this file and the live docs disagree, trust the docs page URL listed next to the section, then the package `.d.mts` types.

## 1. What it is

CopilotKit = "the frontend stack where agents meet users". Three layers connected by the open **AG-UI** event protocol (docs: https://docs.copilotkit.ai/concepts/architecture):

| Layer | What | Where it runs |
|---|---|---|
| Frontend | `CopilotKitProvider`, `CopilotChat` / `CopilotSidebar` / `CopilotPopup`, hooks (`useFrontendTool`, `useAgent`, ...). React, Angular, Vue, React Native | Browser |
| Copilot Runtime | Request handler mounted in your server (Next.js, Express, Hono, Node, Bun, Deno, CF Workers). Auth, routing, tool relay, AG-UI SSE stream | Your server |
| Agent | `BuiltInAgent` (in-process, Vercel AI SDK) **or** any AG-UI agent: LangGraph (Py/TS/FastAPI), Mastra, CrewAI Flows, PydanticAI, Google ADK, Agno, AG2, LlamaIndex, AWS Strands (Py/TS), MS Agent Framework (Py/.NET), Claude Agent SDK (Py/TS), Deep Agents | Runtime process or separate service |

- AG-UI: 16 event types (text deltas, tool calls, state snapshot/delta, run lifecycle), SSE by default. Frontend tools are executed in the browser; runtime relays call and result.
- **CopilotKit Intelligence** (separate backend service, cloud or self-hosted Helm chart) adds durable threads, persistence across reloads/devices, realtime sync, hosted inspector, memories, learning, Channels (Slack/Teams). Not needed for a working chat app.

## 2. Packages, versions (npm, 2026-09-12)

| Package | Version | Use |
|---|---|---|
| `@copilotkit/react-core` | 1.71.1 | React hooks + UI components. Import from **`@copilotkit/react-core/v2`**; CSS `@copilotkit/react-core/v2/styles.css`. Peers: `react ^18\|\|^19`, `zod >=3.25`, `@modelcontextprotocol/sdk ^1.29.0` |
| `@copilotkit/runtime` | 1.71.1 | Runtime. Import from **`@copilotkit/runtime/v2`** (also `/v2/express`, `/v2/hono`, `/v2/node`, `/langgraph`). Bundles `ai@^6`, `@ai-sdk/openai|anthropic|google`, `@ai-sdk/mcp`, `@modelcontextprotocol/sdk` |
| `@copilotkit/react-ui` | 1.71.1 | **v1 only** — not needed for v2 (components moved into react-core/v2) |
| `@copilotkit/core`, `@copilotkit/shared`, `@copilotkit/runtime-client-gql`, `@copilotkit/sdk-js` | 1.71.1 | Internal / v1 / LangGraph JS SDK |
| `@copilotkit/vue` | 1.71.1 | Vue (`/v2` subpath) |
| `@copilotkit/angular` | 0.5.2 | Angular |
| `copilotkit` (npm CLI) | 4.9.60 | `npx copilotkit@latest create` (new project only), `login`, `project select` |
| `copilotkit` (PyPI) | 0.1.96 | Python agent side, e.g. `LangGraphAGUIAgent` |
| `@ag-ui/client`, `@ag-ui/core` | 0.0.59 | `HttpAgent`, AG-UI types (re-exported from react-core/v2) |
| `@ag-ui/mcp-apps-middleware` | 0.1.1 latest (runtime pins 0.0.3) | MCP Apps (server-supplied UI) |
| `@copilotkitnext/*` | 1.54.1 (stale since 2026-06) | Not referenced in current docs. Do not use |

```bash
npm install @copilotkit/react-core @copilotkit/runtime zod
# only if you build a user-managed MCP client (sections 8-9):
npm install @ai-sdk/mcp @modelcontextprotocol/sdk
```

## 3. v1 is deprecated — use v2 names (https://docs.copilotkit.ai/migrate/v2)

v1 and v2 coexist in the same packages; IDE deprecation warnings since 1.68.2. The docs' own reason for deprecating: overlapping names make "developers and coding agents select stale examples". **Never generate v1 for new code**; exact per-export replacements: https://docs.copilotkit.ai/reference/v1/export-map.

| v1 (deprecated) | v2 (current) |
|---|---|
| `import ... from "@copilotkit/react-core"` | `from "@copilotkit/react-core/v2"` |
| `@copilotkit/react-ui` (`CopilotChat`, `CopilotSidebar`, `CopilotPopup`) | `@copilotkit/react-core/v2` |
| `<CopilotKit agent="x">` (still exported as back-compat wrapper) | `<CopilotKitProvider agentId="x">` |
| `useCopilotAction` | `useFrontendTool` (or `useComponent`, `useHumanInTheLoop`) |
| `useCopilotReadable`, `useCopilotAdditionalInstructions` | `useAgentContext` |
| `useCoAgent` | `useAgent` |
| `useCopilotChat` | `useAgent` (low-level: `useCopilotChatHeadless_c`) |
| v1 `useRenderToolCall` (registration) | `useRenderTool` (v2 `useRenderToolCall` is a different, headless consumer API) |
| `useLangGraphInterrupt` | `useInterrupt` |
| `Parameter[]` tool schemas | Standard Schema (`z.object(...)`) |
| `@copilotkit/runtime` + `OpenAIAdapter`/`AnthropicAdapter` service adapters, `copilotRuntimeNextJSAppRouterEndpoint` (GraphQL, single-route) | `@copilotkit/runtime/v2`: `CopilotRuntime` + `BuiltInAgent` + `createCopilotRuntimeHandler` |
| `createCopilotEndpoint*` | `createCopilotHonoHandler` / `createCopilotExpressHandler` |
| Python `CopilotKitRemoteEndpoint`, `LangGraphAgent` | Python `LangGraphAGUIAgent` served by your own FastAPI route (see /auth) |

## 4. Minimal quickstart — Next.js App Router + Built-in Agent (docs: /quickstart)

Prereqs: Node.js 20+, one model key.

```plaintext title=".env"
OPENAI_API_KEY=your_openai_api_key
```

```ts title="app/api/copilotkit/[[...slug]]/route.ts"
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { BuiltInAgent } from "@copilotkit/runtime/v2";

const builtInAgent = new BuiltInAgent({
  model: "openai:gpt-5.4-mini",
});

const runtime = new CopilotRuntime({
  agents: { default: builtInAgent },
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
});

export const GET = handler;
export const POST = handler;
```

```tsx title="app/layout.tsx"
import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import './globals.css';

export default function RootLayout({ children }: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        <CopilotKitProvider runtimeUrl="/api/copilotkit">
          {children}
        </CopilotKitProvider>
      </body>
    </html>
  );
}
```

```tsx title="app/page.tsx"
import { CopilotSidebar } from "@copilotkit/react-core/v2";

export default function Page() {
  return (
    <main>
      <h1>Your App</h1>
      <CopilotSidebar />
    </main>
  );
}
```

- Route file must be the catch-all `[[...slug]]` (multi-route handler). Relative `runtimeUrl` only works when Next serves the runtime; a Vite SPA needs a standalone runtime + absolute URL (`/frontends/react-spa`).
- Verify: `GET /api/copilotkit/info` lists your agents; on localhost the **Inspector** button shows Agents → AG-UI Events / Frontend Tools.
- Prebuilt components use the agent registered as `default`; others via `<CopilotChat agentId="...">`.
- **Already have a LangGraph/Mastra/CrewAI/... agent? Do not register `BuiltInAgent`** — take runtime wiring from that framework's quickstart.

## 5. Runtime details (docs: /backend/copilot-runtime, /backend/runtime-endpoints, /runtime-server-adapter)

| Server | Import | Function |
|---|---|---|
| Next.js App Router, Bun, Deno, CF Workers | `@copilotkit/runtime/v2` | `createCopilotRuntimeHandler({ runtime, basePath, cors?, mode? })` |
| Node http | `@copilotkit/runtime/v2/node` | `createCopilotNodeHandler` / `createCopilotNodeListener` |
| Express | `@copilotkit/runtime/v2/express` | `createCopilotExpressHandler` |
| Hono | `@copilotkit/runtime/v2/hono` | `createCopilotHonoHandler` |

Multi-route (default) routes under `basePath`: `GET /info`, `POST /agent/:agentId/run` (body = AG-UI `RunAgentInput`, SSE response), `POST /agent/:agentId/connect`, `POST /agent/:agentId/stop/:threadId`, `POST /transcribe`. Single-route: `mode: "single-route"`, one `POST {basePath}` with `{ "method": "agent/run", "params": {...}, "body": {...} }`.

- Provider without `useSingleEndpoint` auto-detects mode (since 1.70.2). Pinning the wrong value 404s while `/info` still returns 200.
- `agents` takes `AbstractAgent` instances (`BuiltInAgent`, `LangGraphAgent`/`LangGraphHttpAgent` from `@copilotkit/runtime/langgraph`, `HttpAgent` from `@ag-ui/client`, `@ag-ui/<framework>` wrappers) — not a framework's own SDK client. External agent URL = the agent's own server, not `/api/copilotkit`.
- `runner` is optional (quickstart omits it; runtime page passes `new InMemoryAgentRunner()`). In-memory store bounded at 1000 threads / 100 runs per thread / ~512 MiB; history lost on restart unless Intelligence or a custom runner.
- Header forwarding runtime → agent: `authorization` + `x-*` forwarded (minus infra denylist); server-configured agent headers win. Tune with `forwardHeaders`.
- Frontend auth: `<CopilotKitProvider headers={{ Authorization: \`Bearer ${token}\` }}>`. `properties` is not an auth channel (becomes AG-UI `forwardedProps`).

External agent example (docs: /langgraph-python/quickstart, FastAPI tab, Intelligence lines omitted):

```ts
import { CopilotRuntime, createCopilotRuntimeHandler } from "@copilotkit/runtime/v2";
import { LangGraphHttpAgent } from "@copilotkit/runtime/langgraph";
const runtime = new CopilotRuntime({
  agents: {
    sample_agent: new LangGraphHttpAgent({
      url:  process.env.LANGGRAPH_DEPLOYMENT_URL || "http://localhost:8123",
    }),
  },
});
```

## 6. Built-in Agent: models and server tools (docs: /model-selection, /server-tools, /advanced-configuration)

`BuiltInAgent` options (from types): `model` (string `"provider:model"` or `"provider/model"`, or any AI SDK `LanguageModel`), `apiKey?`, `prompt?` (system prompt), `maxSteps?` (default 1 step — set ≥2 for tool calling), `toolChoice?`, `tools?: ToolDefinition[]`, `mcpServers?`, `mcpClients?`, `maxRetries?`, `providerOptions?`.

| Provider | Example specifier | Env var |
|---|---|---|
| OpenAI | `openai:gpt-5`, `openai:gpt-5-mini`, `openai:gpt-4.1` (quickstart uses `openai:gpt-5.4-mini`) | `OPENAI_API_KEY` |
| Anthropic | `anthropic:claude-sonnet-4-6`, `anthropic:claude-opus-4-8`, `anthropic:claude-haiku-4-5` | `ANTHROPIC_API_KEY` |
| Google | `google:gemini-2.5-pro`, `google:gemini-2.5-flash` | `GOOGLE_API_KEY` |
| OpenAI-compatible (OpenRouter, Ollama, Groq, proxies) | `createOpenAI({ baseURL, apiKey })("model")` from `@ai-sdk/openai` | your choice |

```typescript title="docs: /server-tools"
import { BuiltInAgent, defineTool } from "@copilotkit/runtime/v2";
import { z } from "zod";

const getWeather = defineTool({
  name: "getWeather",
  description: "Get the current weather for a location",
  parameters: z.object({
    location: z.string().describe("The location's name"),
  }),
  execute: async ({ location }) => {
    // Your implementation here
    return { temperature: 72, condition: "sunny", location };
  },
});

const builtInAgent = new BuiltInAgent({
  model: "openai:gpt-5.4-mini",
  tools: [getWeather],
  maxSteps: 2                   //Important for tool calls
});
```

- `parameters` must be a Standard Schema validator (Zod etc.); plain JSON Schema throws.
- Return plain JSON-serializable data; throw `Error` to report failure to the model.
- Server tool wins a name collision with a frontend tool. Don't name tools `AGUISendStateSnapshot` / `AGUISendStateDelta` (built-in shared-state tools).
- A `factory`-mode agent ignores `tools` (convert with `convertToolDefinitionsToVercelAITools`).

## 7. Frontend hooks (all from `@copilotkit/react-core/v2`; docs: /concepts/which-hook, /reference/v2/hooks/*)

| Hook | Purpose |
|---|---|
| `useAgentContext({ description, value })` | Readable app context for the agent. Non-string `value` is `JSON.stringify`'d (self-hosted agents must `JSON.parse`) |
| `useFrontendTool({ name, description, parameters, handler, render? })` | Tool executed in browser; optional inline UI |
| `useComponent({ name, description?, parameters?, render })` | Component-first generative UI (wraps `useFrontendTool`) |
| `useRenderTool({ name, parameters, render })` | Render UI for a named tool call (e.g. a server/MCP tool) without a handler |
| `useDefaultRenderTool({ render? })` | Wildcard renderer (`name: "*"`); no args = built-in default card. Render props: `name, parameters, status, result` |
| `useHumanInTheLoop({ name, description, parameters, render })` | LLM-initiated pause; `render` gets `respond(result)` when `status === "executing"` |
| `useInterrupt` | Graph-initiated pause (LangGraph `interrupt()`) |
| `useAgent({ agentId? })` → `{ agent }` | `agent.state` (reactive), `agent.setState`, `agent.messages`, `agent.isRunning`, `agent.subscribe({...})` — shared state + headless |
| `useRenderToolCall` | Headless: render function for your own chat UI |
| `useConfigureSuggestions`, `useSuggestions`, `useThreads`, `useCopilotKit`, `useCapabilities` | Suggestions, threads (Intelligence), core access |

```tsx title="docs: /frontend-tools"
import { z } from "zod";
import { useFrontendTool } from "@copilotkit/react-core/v2";

useFrontendTool({
  name: "sayHello",
  description: "Say hello to the user",
  parameters: z.object({
    name: z.string().describe("The name of the user to say hello to"),
  }),
  handler: async ({ name }) => {
    alert(`Hello, ${name}!`);
    return `Said hello to ${name}!`;
  },
});
```

```tsx title="docs: /agent-app-context + /shared-state"
useAgentContext({ description: "The currently logged-in user", value: user });

const { agent } = useAgent();
const tasks = (agent.state.tasks as any[]) ?? [];
agent.setState({ ...agent.state, userPreferences: { theme } });
```

```tsx title="adapted from /reference/v2/hooks/useHumanInTheLoop (UI simplified; ToolCallStatus is re-exported from @copilotkit/core via react-core/v2)"
useHumanInTheLoop({
  name: "confirmDeletion",
  description: "Ask the user to confirm before deleting items",
  parameters: z.object({
    itemName: z.string().describe("Name of the item to delete"),
    itemCount: z.number().describe("Number of items to delete"),
  }),
  render: ({ args, status, respond, result }) => {
    if (status === ToolCallStatus.InProgress) return <div>Preparing confirmation...</div>;
    if (status === ToolCallStatus.Executing && respond) {
      return <button onClick={() => respond({ confirmed: true })}>Delete {args.itemCount}</button>;
    }
    return <div>{result}</div>;
  },
});
```

Other generative UI options (docs: /concepts/generative-ui-overview): tool rendering, state rendering, A2UI (`a2ui: {}` on `CopilotRuntime`), Open-JSON-UI, MCP Apps.

## 8. MCP support (docs: /mcp-servers, /generative-ui/mcp-apps, /agentic-protocols/mcp)

CopilotKit is an **MCP client**, configured server-side on the Built-in Agent. It does not expose your app as an MCP server.

| Mechanism | Where | Behavior |
|---|---|---|
| `mcpServers: [{ type: "http", url, options? }]` / `[{ type: "sse", url, headers? }]` | `BuiltInAgent` | Fresh MCP connection **per agent run**; all tools merged into agent tool set |
| `mcpClients: [provider]` where `provider.tools(): Promise<ToolSet>` | `BuiltInAgent` | You own lifecycle: persistent client, caching, token refresh, **tool filtering**. Name collision: `mcpServers` wins |
| `mcpApps: { servers: [{ type: "http", url, agentId? }] }` | `CopilotRuntime` | MCP Apps (tools with UI resources rendered in sandboxed iframe). Runtime pins middleware 0.0.3: `includeTools`/`excludeTools` throw |
| `.use(new MCPAppsMiddleware({ mcpServers: [{ type, url, serverId }] }))` | agent | Same via `@ag-ui/mcp-apps-middleware`; always set `serverId` |
| `useCopilotKit().setMcpServers([{ endpoint }])` | frontend | Shown on /agentic-protocols/mcp with `publicApiKey` (Copilot Cloud) + v1 runtime snippet. Legacy-shaped; **unverified** for self-hosted v2 — avoid |

Auth header gotcha (from `@copilotkit/runtime` types): `headers` exists **only on `type: "sse"`**. For Streamable HTTP pass `options: StreamableHTTPClientTransportOptions` — `requestInit: { headers }` (merged into every request in `@modelcontextprotocol/sdk@1.30.0` source), `fetch` wrapper, or OAuth `authProvider`.

Documented `mcpClients` snippet (createMCPClient + StreamableHTTPClientTransport) is the basis of Option B in section 9; tool caching and token-refresh variants are on /mcp-servers.

Render MCP tool calls in chat: `useDefaultRenderTool()` (catch-all) or `useRenderTool({ name: "<mcp tool name>", ... })`. For mutating tools the docs recommend a renderer + human-in-the-loop approval, not an MCP App.

## 9. Integrating with Ambiguous

Facts checked 2026-09-12 (see `../ambiguous/ambiguous-context.md`):
- `POST https://app.ambiguous.ai/mcp` `initialize` and `tools/list` work **without auth** (stateless, no `Mcp-Session-Id`). `tools/list` returned **856 tools, ~775 KB JSON**, no pagination. Tool names = OpenAPI operationIds (`list_tasks`, `create_task`, `get_task`, `update_task`, `auth_whoami`, `send_email`, `list_documents`, ...).
- Server card `authentication.schemes: ["bearer","oauth2"]`, `apiKeyFormat: "ak_..."`. REST: `Authorization: Bearer ak_...`, OpenAPI `bearerAuth`.
- `POST /api/tasks` (`create_task`): `title` required (1–255), `description` markdown, `status` ∈ todo|in_progress|done|cancelled|blocked, `priority` ∈ urgent|high|medium|low, `due_date` YYYY-MM-DD, `assignee_id`/`project_id` uuid → 201.
- `send_email` has `destructiveHint: true` → gate with `useHumanInTheLoop`.
- **Not verified**: an authenticated `tools/call` with an `ak_` key over MCP (no key used). The Ambiguous docs describe MCP as OAuth for hosts; Bearer on MCP comes from the server card only.

Keep `AMBI_API_TOKEN=ak_...` server-side only (runtime env; never `NEXT_PUBLIC_`). One service identity = every chat user acts as that Ambiguous identity.

### Option A — REST via `defineTool` (simplest, most control; recommended for a hackathon demo)

Pattern from /server-tools; Ambiguous endpoint/fields from its OpenAPI. Not run end-to-end.

```ts
import { BuiltInAgent, defineTool } from "@copilotkit/runtime/v2";
import { z } from "zod";

const AMBI = "https://app.ambiguous.ai";
async function ambi(path: string, init: RequestInit = {}) {
  const res = await fetch(`${AMBI}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.AMBI_API_TOKEN}`, "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok) throw new Error(`Ambiguous ${res.status}: ${await res.text()}`);
  return res.json();
}

const createTask = defineTool({
  name: "createAmbiguousTask",
  description: "Create a task in the user's Ambiguous workspace",
  parameters: z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    priority: z.enum(["urgent", "high", "medium", "low"]).optional(),
    due_date: z.string().describe("YYYY-MM-DD").optional(),
  }),
  execute: async (args) => ambi("/api/tasks", { method: "POST", body: JSON.stringify(args) }),
});

export const agent = new BuiltInAgent({ model: "openai:gpt-5.4-mini", tools: [createTask], maxSteps: 5 });
```

Pair with `useRenderTool({ name: "createAmbiguousTask", ... })` for a task card. For dev without an account: base `https://app.ambiguous.ai/sandbox`, token from `POST /sandbox/session` (tasks CRUD only, `description` ≤2,000 chars there).

### Option B — Ambiguous MCP via `mcpClients` with an allowlist

Do **not** pass `{ type: "http", url: "https://app.ambiguous.ai/mcp" }` in `mcpServers`: it reconnects every run and hands all 856 tool schemas to the model. Filter instead. Wiring uses documented `mcpClients` + MCP SDK `requestInit`; Bearer `ak_` on MCP is unverified.

```ts
import { BuiltInAgent } from "@copilotkit/runtime/v2";
import { createMCPClient } from "@ai-sdk/mcp";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const ALLOW = new Set(["list_tasks", "get_task", "create_task", "update_task", "auth_whoami"]);
let cached: Record<string, any> | null = null;

const ambiguousMcp = {
  async tools() {
    if (cached) return cached;
    const client = await createMCPClient({
      transport: new StreamableHTTPClientTransport(new URL("https://app.ambiguous.ai/mcp"), {
        requestInit: { headers: { Authorization: `Bearer ${process.env.AMBI_API_TOKEN}` } },
      }),
    });
    const all = await client.tools();
    cached = Object.fromEntries(Object.entries(all).filter(([name]) => ALLOW.has(name)));
    return cached;
  },
};

export const agent = new BuiltInAgent({ model: "openai:gpt-5.4-mini", mcpClients: [ambiguousMcp], maxSteps: 5 });
```

### Option C — per-user Ambiguous identity (unverified, heavier)

Each signed-in user does Ambiguous OAuth (DCR RFC 7591, PKCE S256, resource-bound tokens, no refresh tokens) and your server stores the token; pass it via `StreamableHTTPClientTransport` `authProvider` or per-request `requestInit`, with a per-request `BuiltInAgent` (instances refuse concurrent runs). CopilotKit docs have no Ambiguous- or OAuth-MCP example. Skip unless per-user attribution is a requirement.

Other backends: a LangGraph/Mastra/etc. agent can call Ambiguous REST/MCP itself; CopilotKit only needs the AG-UI endpoint.

## 10. Licensing, pricing, hosting

- OSS core (react-core, runtime, AG-UI, BuiltInAgent, integrations): **MIT** per GitHub repo `CopilotKit/CopilotKit` and `@copilotkit/runtime/package.json`. The docs page /concepts/oss-vs-enterprise says "Apache 2.0" — docs and repo disagree; the repo LICENSE is authoritative.
- Intelligence (www.copilotkit.ai/pricing, `raw/www.copilotkit.ai/pricing.txt`):

| Plan | Price | Thread retention | Max threads | Hosting |
|---|---|---|---|---|
| Developer | Free, 1 developer | 3 days | 200 | Cloud; VPC/on-prem "runtime only" |
| Pro | $39/month | 5 days | 5,000 | Cloud |
| Team | $100/seat/month (≤5 seats) | 14 days | 25,000 | Cloud or self-host incl. DB |
| Enterprise | Custom | Custom | Unlimited | VPC/on-prem included |

- `selfManagedAgents` (frontend → your AG-UI agent, bypassing runtime) is an Enterprise Intelligence feature; `agents__unsafe_dev_only` is the local-dev equivalent.

## 11. Env vars

| Var | Side | Purpose |
|---|---|---|
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_API_KEY` / `MINIMAX_API_KEY` | server | BuiltInAgent model provider |
| `CPK_INTELLIGENCE_API_KEY` (`cpk-...`) | server secret | `new CopilotKitIntelligence({ apiKey })`; written by `npx copilotkit project select` |
| `NEXT_PUBLIC_COPILOTKIT_LICENSE_KEY` | browser | `publicLicenseKey` prop (Intelligence features, inspector) |
| `COPILOTKIT_TELEMETRY_DISABLED=true`, `COPILOTKIT_TELEMETRY_SAMPLE_RATE` | server | Opt out of / sample anonymous telemetry (default 5%) |
| `LANGGRAPH_DEPLOYMENT_URL`, `LANGSMITH_API_KEY` | server | LangGraph integration examples |
| `AMBI_API_TOKEN` (`ak_...`) | server secret | Ambiguous REST/MCP (name follows Ambiguous CLI convention) |

## 12. Gotchas

1. The docs deprecate v1 because stale v1 examples mislead coding agents. Imports must end in `/v2`; no `@copilotkit/react-ui`, no `OpenAIAdapter`, no `useCopilotAction`/`useCopilotReadable`.
2. `BuiltInAgent` default is a single step: without `maxSteps` ≥2 the agent calls a tool and stops.
3. One `BuiltInAgent` instance = one run at a time ("Agent is already running"). Module-scope instance breaks with 2 concurrent users; construct per request for multi-user demos.
4. Provider/handler transport mismatch 404s silently (`/info` still 200). Omit `useSingleEndpoint`; use `[[...slug]]/route.ts` with multi-route.
5. `mcpServers` HTTP entries have no `headers` field — use `options.requestInit.headers`.
6. `mcpServers` against a large server (Ambiguous: 856 tools) sends every schema to the model each run → filter via `mcpClients`.
7. `useAgentContext` values arrive as JSON strings on non-built-in agents.
8. Frontend tool with same name as a server tool never fires.
9. Empty assistant reply → unsupported model string, empty `prompt`, or throwing frontend handler (`tool_handler_failed`).
10. `InMemoryAgentRunner` loses history on restart; persistent threads need Intelligence or a custom runner.
11. `npx copilotkit@latest create/init` scaffolds a **new** directory; it does not modify an existing app. It also opens CopilotKit Intelligence browser sign-in and project selection.
12. Docs pages are inconsistent: /agentic-protocols/mcp mixes v2 imports with v1 runtime + Copilot Cloud; tool-rendering page shows `args` while `useDefaultRenderTool` types say `parameters`. Check `/reference/v2/hooks/<hook>` before coding.
13. Local connection errors: try `127.0.0.1` instead of `localhost`.

## 13. Canonical links (prefix https://docs.copilotkit.ai)

- Agent index `/llms.txt`; full dump `/llms-full.txt` (9.3 MB, each page under `## Source: <url>`)
- Start: `/quickstart`, `/concepts/architecture`, `/concepts/which-hook`, `/migrate/v2`, `/reference/v2`, `/reference/v1/export-map`
- Backend: `/backend/copilot-runtime`, `/backend/runtime-endpoints`, `/runtime-server-adapter`, `/server-tools`, `/model-selection`, `/auth`
- Features: `/frontend-tools`, `/human-in-the-loop`, `/shared-state`, `/agent-app-context`, `/generative-ui/tool-rendering`, `/mcp-servers`, `/generative-ui/mcp-apps`
- Business/ops: `/concepts/oss-vs-enterprise`, `/troubleshooting/common-issues`, https://www.copilotkit.ai/pricing, https://github.com/CopilotKit/CopilotKit

## Raw sources (`raw/`)

| File | Read when |
|---|---|
| `docs.copilotkit.ai/llms.txt` | Page index, framework quickstart URLs, onboarding prompt (`npx --yes copilotkit@latest onboard start --run <run-id>`) |
| `docs.copilotkit.ai/llms-full.txt` | Exact page text. `grep -n '^## Source: ' raw/docs.copilotkit.ai/llms-full.txt` for the TOC, then `sed -n` a range — don't load it whole |
| `www.copilotkit.ai/llms.txt` | Marketing-site index (Rich Threads, Channels, Intelligence) |
| `www.copilotkit.ai/pricing.txt` | Plan limits (text extracted from HTML) |
