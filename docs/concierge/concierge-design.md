# Concierge — design notes

Working design for our hackathon product: a customer-facing AI agent for Ambiguous clients, embedded on their websites, answering from their Ambiguous workspace and rendering generative UI.
Status: **discussion draft, 2026-09-12**. Nothing here is built yet. Items marked **Unverified** have not been tested against the live systems.

Background reading:
- `../ambiguous/ambiguous-context.md` — Ambiguous API, CLI, MCP, auth, sandbox, pricing
- `../copilotkit/copilotkit-context.md` — CopilotKit v2 runtime, hooks, generative UI, MCP

## 1. The idea

Ambiguous (ambiguous.ai) is a workspace of 17 apps shared by humans and AI coworkers. Its clients are B2B companies. Those companies serve either other businesses (B2B) or consumers (B2C).

Concierge adds an **outward-facing** agent to that stack:

- A widget on the client's website talks to their visitors and customers.
- The agent's "company context" is the client's own Ambiguous workspace: Wiki, Docs, CRM, Calendar, Tasks, Chat, Sheets.
- Each client configures what the agent does: welcome and qualify leads (typical B2B), answer order and support questions (typical B2C), or both.
- Answers can be rich components (slot pickers, order cards, source cards), not only text.
- The same agent core can later serve other channels: email, internal staff chat.

## 2. Architecture

```
Client website ─ <script> widget (React, CopilotKit v2 UI + generative UI components)
        │ AG-UI over HTTPS   (public tenant id + visitor session token)
        ▼
Concierge backend (ours, multi-tenant)
  ├─ Copilot Runtime  (createCopilotRuntimeHandler, hooks.onRequest validates session)
  ├─ tenant registry: Ambiguous ak_ key (encrypted), playbook cache, tool allowlist
  ├─ agent per request: BuiltInAgent (Claude) + server tools for this tenant's playbook
  └─ server tools (defineTool) ──── REST, Authorization: Bearer ak_… ────┐
                                                                         ▼
                                   Client's Ambiguous workspace
                                   Wiki · Docs · CRM · Calendar · Tasks · Chat · Mail · Sheets
```

## 3. Design decisions

Each decision lists the fact it rests on and the case where it stops holding.

### D1. Knowledge retrieval: live search, no vector database

- At question time, call `GET /api/wiki/search` and `GET|POST /api/search`, then read the matching pages.
- Nothing to sync, nothing goes stale.
- **Revisit when:** a client has thousands of pages or search latency hurts the chat. Then build our own index and keep it fresh with `/api/webhooks` (list event types via `GET /api/webhooks/event-types`).

### D2. Access to client workspaces: one dedicated agent identity + API key per client

- Onboarding per client: `POST /api/admin/users/provision-agent` creates the Concierge agent; `POST /api/agents/{id}/api-keys` mints its `ak_` key; `POST /api/identity/api-keys/{id}/rotate` rotates it.
- Store the key encrypted server-side. The browser never sees it.
- **Why not OAuth:** Ambiguous OAuth issues 1-hour tokens with no refresh token, and service-auth identity assertions expire 24 hours after approval. A widget running 24/7 would lose access daily.
- **Revisit when:** Ambiguous offers a partner "install app" flow with long-lived tokens. Ask their team.

### D3. Tools: a small allowlist per playbook, via REST

- 5–8 `defineTool` server tools per playbook, each wrapping one Ambiguous REST call.
- **Why not Ambiguous MCP directly:** its `tools/list` returns 856 tools (~775 KB). CopilotKit's `mcpServers` would hand every schema to the model on every run. If MCP is ever needed, use `mcpClients` with an allowlist (see copilotkit-context.md §9, Option B).
- A fixed, narrow tool set also limits what a prompt-injected visitor can make the agent do.

### D4. Per-client behaviour: a playbook page in the client's Wiki

- Each client keeps a Wiki page, e.g. "Concierge playbook": persona and tone, enabled use cases, allowed actions, handoff channel, business hours, scheduler link.
- The backend reads it at session start (cache it; refresh via webhook or TTL).
- Clients change the agent from inside Ambiguous; we skip building an admin UI.
- **Revisit when:** clients need validated settings (typos silently breaking behaviour). Then move settings to a Form or our own settings screen.

### D5. Visitor trust tiers

| Tier | Who | Allowed |
|---|---|---|
| Anonymous | Any website visitor | Public knowledge answers, lead capture, meeting booking, handoff request |
| Verified | Logged-in customer of the client | Everything above + their own orders / account data |

- Verification options: the client's site passes a signed token for its logged-in user (validated in the runtime's `hooks.onRequest`), or we send a one-time code by email via Ambiguous Mail.
- Derive tenant and user identity from the verified token, never from browser-supplied props (CopilotKit docs: `properties`/forwardedProps are not an auth channel).
- **Not needed for:** a pure B2B lead-welcome deployment with no private data.

### D6. Orders: Ambiguous has no orders module

- Ambiguous API groups cover mail, crm, tasks, admin, chat, drive, calendars, wiki, documents, sheets, forms, automations, slides, sign — no orders.
- Order questions need either (a) a per-tenant tool calling the client's own system (Shopify, ERP, custom API), or (b) orders stored in Ambiguous Sheets or CRM deals.
- Hackathon: fake orders in a Sheet, read via `GET /api/public/sheets/{id}/range` or the authenticated sheets API.

### D7. Human handoff

- The agent posts a summary in the client's Chat channel (named in the playbook) and creates a Task.
- A human's reply flows back to the widget via webhook (or the CLI `notifications watch` pattern for an agent identity).
- The widget shows a "a human is on it" state.

### D8. Cost model

- Concierge is an external (bring-your-own-LLM) agent from Ambiguous' point of view. Per Ambiguous pricing, external agents' routine CRUD does not consume the client's AI actions; only premium operations (image generation, web search) do.
- We pay the LLM bill. Clients' Free plan (1,000 actions/month) stays untouched by normal Concierge traffic.
- **Revisit when:** we route work through Ambiguous' built-in Assistant or use premium operations.

### D9. One agent instance per request

- CopilotKit `BuiltInAgent` instances refuse concurrent runs ("Agent is already running"). With many visitors across many tenants, construct the agent per request with that tenant's prompt and tools.
- **Unverified:** the cleanest way to build a per-request agent inside `createCopilotRuntimeHandler` (e.g. constructing `CopilotRuntime` per request in the route handler). Check the runtime types before coding.

## 4. Generative UI catalog

Components the widget renders when the agent calls a tool. Frontend: `useRenderTool` for server tools, `useHumanInTheLoop` for anything needing visitor confirmation, `useComponent` for display-only UI (all from `@copilotkit/react-core/v2`).

| Component | When | Backed by |
|---|---|---|
| Answer with source cards | Knowledge question | `GET /api/wiki/search`, `GET /api/search`, `GET /api/public/wiki/pages/{id}` |
| Meeting slot picker → confirmation | Lead wants a call / demo | `GET /api/public/scheduler/{workspaceSlug}/{userSlug}/{linkSlug}/slots`, `POST .../book` (public, no auth) |
| Lead qualification card | New prospect | `POST /api/crm/contacts`, `POST /api/crm/deals` |
| Order status card | Verified customer asks about an order | Sheets range (demo) or client's own system |
| Handoff status | Escalation | `POST /api/tasks` + Chat message |
| Form embed | Structured intake (RFQ, returns) | Forms module; responses at `GET /api/forms/{id}/responses` |
| Quote / contract to sign | B2B close | Sign module (19 API paths; not explored yet) |

Rule: every component has a plain-text fallback (slot picker → scheduler link, source card → page link) so the same agent can answer over email or chat.

## 5. Channels

| Channel | Transport | UI |
|---|---|---|
| Website widget | CopilotKit runtime (AG-UI over SSE) | Full generative UI |
| Email | Ambiguous Mail (inbound to the client's support address) | Text fallback + links |
| Internal staff chat | Ambiguous Chat (agent identity, `notifications watch`) | Text; staff ask "what did this lead want?" |
| Slack / Teams | CopilotKit Intelligence Channels (paid) | Later, if at all |

## 6. Ambiguous endpoints relevant to Concierge

Found in `https://app.ambiguous.ai/api/openapi.json` (2026-09-12). Exact request/response schemas: grep the spec or run `npx ambiguous@latest catalog <module>`.

| Area | Endpoints |
|---|---|
| Provisioning | `POST /api/admin/users/provision-agent`, `POST /api/coworkers/provision`, `POST /api/agents/{id}/api-keys`, `GET|POST /api/identity/api-keys`, `POST /api/identity/api-keys/{id}/rotate`, `GET|POST /api/admin/api-keys` |
| Knowledge | `GET /api/wiki/search`, `GET|POST /api/search`, `GET /api/search/preview/{module}/{id}`, `GET /api/public/wiki/{id}`, `GET /api/public/wiki/pages/{id}`, `GET /api/public/documents/{id}` |
| CRM | `GET|POST /api/crm/contacts`, `GET|POST /api/crm/deals`, `GET /api/crm/scheduler-bookings`, `GET /api/crm/scheduler-links/{id}/bookings` |
| Scheduling | `GET /api/calendars/availability`, `GET /api/public/scheduler/{ws}/{user}/{link}/slots`, `POST .../book`, `GET|POST /api/public/scheduler/bookings/{cancelToken}[/cancel]` |
| Data | `GET /api/public/sheets/{id}/range`, `GET /api/forms/{id}/responses` |
| Events | `GET|POST /api/webhooks`, `GET /api/webhooks/event-types`, `POST /api/webhooks/{id}/test`, `GET /api/webhooks/{id}/deliveries`, `POST /api/webhooks/{id}/rotate-secret` |
| Handoff | `POST /api/tasks`, chat messages (`npx ambiguous@latest catalog chat`), `GET /api/channels/messages/search` |
| Automations | `POST /api/automations/{id}/runs` → poll `status_url` |

## 7. Hackathon plan

**Main demo — B2B lead welcome** (every step backed by an endpoint in §6):

1. Visitor opens the client's site and asks a product question → agent answers from the Wiki with source cards.
2. Agent asks qualifying questions → contact + deal appear in Ambiguous CRM.
3. Agent offers a meeting → slot picker → booking confirmed.
4. Sales team gets a Chat message with the lead summary.

**"It adapts" moment:** edit the playbook Wiki page (or switch tenants) → the same widget becomes a B2C order-status assistant reading orders from a Sheet, with a verified-customer step.

**Build order:**

1. Develop tool wrappers against the Ambiguous sandbox (`POST https://app.ambiguous.ai/sandbox/session`; tasks CRUD only, no account needed).
2. Create a real Free Ambiguous workspace for the demo (5 teammates, 1,000 actions/month; our CRUD calls don't consume actions): Wiki pages, CRM, scheduler link, Chat channel, orders Sheet.
3. CopilotKit v2 Next.js app: runtime route + `BuiltInAgent` with Claude + server tools.
4. Generative UI components (§4), starting with the slot picker and lead card.
5. Package the chat as an embeddable widget for a demo "client website".

**Tooling for us (Claude Code):** use the Ambiguous CLI plugin (`claude plugin marketplace add ambiguous-ai/plugins`, `claude plugin install ambiguous`) to seed demo data; it avoids the OAuth flow. MCP only matters for hosts without a shell (Claude.ai, ChatGPT).

## 8. Unverified — check before relying on it

- Public scheduler endpoints: whether a scheduler link must be configured first, and what `slots`/`book` payloads look like.
- Webhook event types: which events exist (message posted, wiki page updated, task updated?).
- `ak_` key as Bearer on Ambiguous MCP `tools/call` (only the server card claims it; REST Bearer is documented).
- Which API key scopes exist beyond the documented `documents.read`, `tasks.read`, `tasks.write` (e.g. CRM, calendar), so Concierge keys can be least-privilege.
- Per-request agent construction pattern in CopilotKit runtime v2 (D9).
- Claude model specifier in `BuiltInAgent`: CopilotKit docs list `anthropic:claude-sonnet-4-6`; confirm the bundled `@ai-sdk/anthropic` accepts the newest model (e.g. `anthropic:claude-sonnet-5`).
- Embedding: CopilotKit is React-based; shipping it as a `<script>` widget on non-React client sites needs a bundled standalone build (e.g. Vite library mode + shadow DOM) and CORS on the runtime. A Vite SPA needs a standalone runtime and an absolute `runtimeUrl`.

## 9. Open questions

1. **Order data:** where do target clients' orders live — their own system (Shopify, ERP) or could they be in Ambiguous Sheets / CRM?
2. **Visitor identity:** can client websites pass a signed token for logged-in users, or are visitors always anonymous?
3. **Distribution:** script embed on client sites, or pitched to Ambiguous as an app inside their product? This decides per-client API keys (D2) versus a partner OAuth flow.
