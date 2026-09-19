# Concierge — development plan

How we build the demo in [`demo-plan.md`](demo-plan.md) (core flows A, E, B; extra X1). Two developers, ~3 hours, one repo, trunk-based.
Exact Ambiguous request/response shapes: [`api-contracts.md`](api-contracts.md) (being verified; until it lands, treat tool internals as provisional — tool **names and result types below are fixed**).

## Environment (already done)

| Item | State |
|---|---|
| Ambiguous workspace | `6f8cb3d3-…`; members Cuneyt (owner), Oskar (member), **Concierge** (agent, member) |
| `.env.local` (repo root, gitignored, `600`) | `ANTHROPIC_API_KEY`, `AMBI_API_TOKEN` (Concierge `ak_` key), `AMBI_API_URL` |
| Ambiguous CLI | Logged in as Cuneyt (human) in `./.ambi/` — use it to seed demo data |
| Node / npm | v24.10.0 / 11.6.1 |

The **app** acts as Concierge (`AMBI_API_TOKEN`). **Seeding** is done by humans via the CLI, so the Wiki looks human-written.

## Stack

| Layer | Choice | Note |
|---|---|---|
| App | Next.js App Router, TypeScript, Tailwind, at repo root | One app = Acme website + CopilotKit runtime |
| Chat | `@copilotkit/react-core@1.71.1` + `@copilotkit/runtime@1.71.1`, **v2 imports only** | `CopilotPopup`, `useRenderTool`, `useHumanInTheLoop`, `useFrontendTool`, `useAgentContext` |
| Agent | `BuiltInAgent`, `maxSteps: 8` | Model `anthropic:claude-sonnet-5`; if the bundled `@ai-sdk/anthropic` rejects it, `anthropic:claude-sonnet-4-6` (documented by CopilotKit) |
| Ambiguous | REST via `fetch` in server tools (`defineTool`) | No MCP (856 tools) |
| Run | `npm run dev` on `localhost:3000` | No deploy |

## Repo layout

```
app/
  layout.tsx                              CopilotKitProvider + v2 styles
  page.tsx                                Acme website (server component; reads playbook)
  api/copilotkit/[[...slug]]/route.ts     CopilotRuntime + BuiltInAgent       (P1)
components/
  site/        Nav, Hero, Integrations, Pricing, Faq                         (P2)
  concierge/
    ConciergeWidget.tsx                   'use client': popup + all hooks    (P2)
    cards/     SourceCard, LeadCard, SlotPicker, BookedCard,
               EmailCapture, GapCard                                          (P2)
lib/
  contracts.ts                            shared tool result types + fixtures (P1+P2, first 5 min)
  ambiguous.ts                            server-only fetch helper            (P1)
  tools/       search-knowledge, create-lead, slots, book-meeting,
               notify-team, log-gap                                           (P1)
  agent.ts                                system prompt + BuiltInAgent        (P1)
  playbook.ts                             read playbook wiki page             (P1)
scripts/
  smoke-tools.ts                          run each tool against the workspace (P1)
  reset-demo.ts                           delete [DEMO] records, restore playbook (P1)
  seed/*.md                               Wiki page sources                   (P2)
```

**Ownership avoids merge conflicts:** P1 owns `lib/`, `app/api/`, `scripts/*.ts`, `package.json`. P2 owns `app/page.tsx`, `app/layout.tsx`, `components/`, `scripts/seed/`. `lib/contracts.ts` is edited together at T+0, then only by agreement.

## Tool contracts (the P1 ↔ P2 interface)

Source of truth: [`lib/contracts.ts`](../../lib/contracts.ts) (names, Zod parameter schemas, result types, fixtures). The table is a summary. P2 builds cards against `FIXTURES` while P1 builds the real tools.

| Tool | Runs | Parameters | Result | Rendered by |
|---|---|---|---|---|
| `search_knowledge` | server | `query` | `{ results: { title, snippet, pageId, url, content? }[] }` (empty = gap; `content` is for the model) | `SourceCard` via `useRenderTool` |
| `create_lead` | server | `company, contactName, email?, seats, timeline, need` | `{ contactId, dealId, company, seats, timeline, need, dealUrl }` | `LeadCard` via `useRenderTool` |
| `get_slots` | server | `days?` | `{ slots: { start, label }[] }` | — (feeds `choose_slot`) |
| `choose_slot` | browser | `slots` | `{ start } \| { declined: true }` | `SlotPicker` via `useHumanInTheLoop` |
| `book_meeting` | server | `start, company, contactName, email` (scheduler requires email) | `{ confirmed, when, via: "scheduler" \| "task", url }` | `BookedCard` via `useRenderTool` |
| `notify_team` | server | `summary, dealUrl?` | `{ messageId }` | nothing in widget (shows on right screen) |
| `capture_email` | browser | `question` | `{ email } \| { declined: true }` | `EmailCapture` via `useHumanInTheLoop` |
| `log_gap` | server | `question, email?` | `{ taskId, taskUrl, question, email? }` | `GapCard` via `useRenderTool` |
| `highlight_plan` (X1) | browser | `plan: "starter" \| "growth" \| "enterprise"` | `"highlighted"` | the page itself via `useFrontendTool` |

Rules: tool names are snake_case and unique across server and browser (a server tool silently wins a name collision). Server tools throw `Error` on failure so the model sees it.

## Agent prompt (lib/agent.ts)

```
You are Concierge, the website assistant for {company}. Visitors are potential customers.
Follow the company playbook provided in context (tone, current offer, rules).
Knowledge: call search_knowledge before answering product questions. Answer only from its
results and keep the sources. If it returns nothing: say you'll check with the team, call
capture_email, then log_gap.
Qualifying: once you know company, seats and timeline, call create_lead exactly once.
Meetings: get_slots → choose_slot → book_meeting → notify_team with a 2-line lead summary.
Plans: when asked which plan fits, call highlight_plan.
Replies: at most 2 short sentences; cards carry the details.
```

## Milestones

Clock starts when both begin (T+0). Each milestone ends on a check anyone can run.

### M0 — scaffold + seed (T+0 → T+0:30)

| Who | Work | Done when |
|---|---|---|
| Both (5 min) | Agree `lib/contracts.ts` types + fixtures | File committed |
| P1 | Scaffold Next.js (TS, Tailwind, App Router, no `src/`). `create-next-app` may refuse the non-empty root (`.env.local`, `.ambi/`): scaffold into a temp folder and move files in, merging `.gitignore`. `npm i @copilotkit/react-core@1.71.1 @copilotkit/runtime@1.71.1 zod`. Runtime route + provider + `CopilotPopup`. Confirm the Claude model specifier. | `curl localhost:3000/api/copilotkit/info` lists `default`; popup streams a reply to "hi" |
| P2 | Pick the demo company story (suggested: fleet maintenance SaaS). Write and create Wiki pages via CLI: Product, Integrations (SAP, Salesforce, Slack), Pricing (Starter/Growth/Enterprise), FAQ (**no on-prem**), Concierge playbook. Create sales channel; add Concierge and Oskar. | Wiki search for "SAP" with the Concierge key returns the Integrations page |

### M1 — Flow A without booking (T+0:30 → T+1:20)

| Who | Work | Done when |
|---|---|---|
| P1 | `lib/ambiguous.ts`; tools `search_knowledge`, `create_lead`, `notify_team`; agent prompt; `scripts/smoke-tools.ts` | Smoke script creates a `[DEMO]` contact + deal and a sales channel message, visible in the Ambiguous app |
| P2 | Acme page with section ids `#integrations`, `#pricing`, `#faq`; `ConciergeWidget`; `SourceCard`, `LeadCard` on fixtures | Cards render in the popup with fixture data |

**Checkpoint T+1:20:** in the browser, "Do you integrate with SAP?" → SourceCard; qualifying answers → LeadCard, and the deal appears in Ambiguous.

### M2 — booking, Flow E, Flow B (T+1:20 → T+2:10)

| Who | Work | Done when |
|---|---|---|
| P1 | `get_slots` + `book_meeting` — scheduler if `api-contracts.md` says usable, else **Task fallback** (decide by T+1:40); `log_gap` (assign to Oskar); `lib/playbook.ts` | Each tool passes in the smoke script |
| P2 | `SlotPicker` + `BookedCard`; `EmailCapture` + `GapCard`; page reads playbook and passes it via `useAgentContext` | HITL cards respond and the agent continues |
| Whoever frees up (P1 if fallback at T+1:40) | X1 `highlight_plan`: scroll to `#pricing`, add highlight class to the plan card | "Which plan fits 200 seats?" highlights Growth |

**Checkpoint T+2:10 → feature freeze:** flows A, E, B each run twice in a row from a fresh page load.

### M3 — demo hardening (T+2:10 → T+2:30)

| Who | Work | Done when |
|---|---|---|
| P1 | `scripts/reset-demo.ts`: delete `[DEMO]` contacts/deals/tasks, restore playbook, delete the "On-prem" page | One command resets the workspace for a clean rerun |
| P2 | Split-screen setup (two windows, Ambiguous tabs: CRM, sales channel, Tasks, Wiki); pitch lines adjusted to what got built (`pitch.md`) | Full run-through without touching code |

### M4 — rehearse (T+2:30 → T+3:00)

Reset → rehearse → reset → rehearse → record backup video → submit.

## Git workflow

- Everyone works on `main`; small commits after each green step.
- `git pull --rebase` before every push. Only P1 changes `package.json` / lockfile.
- Never commit `.env.local` or `.ambi/` (already gitignored).

## Risks

| Risk | Signal | Response |
|---|---|---|
| CopilotKit v2 wiring | No streamed reply by T+0:45 | Copy the quickstart verbatim (`copilotkit-context.md` §4); cut Flow B and GapCard |
| Claude model specifier rejected | Empty replies / provider error | Switch to `anthropic:claude-sonnet-4-6` |
| Agent stops after one tool call | Tool runs, no follow-up text | `maxSteps` too low; keep ≥ 8 |
| Scheduler endpoints unusable | `api-contracts.md` verdict, or failing at T+1:40 | Fixed slots + `book_meeting` creates a Task (`via: "task"`) |
| Agent calls tools in the wrong order | Rehearsal | Tighten prompt; give each tool's `description` its precondition |
| Demo data drift between runs | Duplicate deals on the right screen | `scripts/reset-demo.ts` before each run |
| Rate limits (429) | `Retry-After` header | Honor it; the demo makes few calls |
