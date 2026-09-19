# Lead Desk — an inbound sales agent built on TrueForge

Built at the Agent Harness Hackathon (HackerSquad × TrueFoundry, Santa Clara, 2026-09-19).

Lead Desk is a TrueForge agent. There is no application code in this repo: one system prompt, one MCP connector, one agent manifest. TrueForge supplies the model routing, the tool loading, the approval gates, the session store and the API.

An inbound email or web-form submission comes in. The agent reads the company wiki through MCP, answers the prospect's question with a source, then finishes the job inside the company's [Ambiguous](https://www.ambiguous.ai) workspace: creates the contact and deal in CRM, books the demo on the calendar, alerts the sales channel. Three writes, three approval pauses. Deny, and nothing lands.

In the demo the email is pasted into the TrueForge chat. The same text can arrive over the TrueForge API (`trueforge/run.py` posts it to `POST /sessions/{id}/turns`). Wiring a mailbox is the next step: a TrueForge Schedule polling Ambiguous Mail and opening one session per new message.

## TrueForge features in use

| Feature | Where | What it does for Lead Desk |
|---|---|---|
| MCP connector, header auth | Settings → Connectors, `setup.sh` | Ambiguous exposes its whole workspace as one MCP server at `https://app.ambiguous.ai/mcp`, 895 tools. Registered once with an `ak_` API key. Agents reference it by name. |
| Tool allowlist | `agent.json` → `enable_tools` | The agent sees 9 of 895 tools. The other 886 never reach the model. |
| Deferred tool loading | `agent.json` → `preload_tools` | Nine schemas load on first use; a raw `tools/list` from this server is 775 KB and would not fit a prompt. |
| Approval gates | `agent.json` → `require_approval_for_tools` | `create_deal`, `create_event`, `send_message`, `create_task` pause with full arguments on screen. Allow or Deny. Reads and contact creation run without a gate. |
| Durable sessions | Sessions tab | Refresh mid-run; the pending approval is still there. Every tool call, argument and decision is logged per session. |
| HTTP API | `run.py`, `setup.sh` | Provider, connector and agent are created with `POST /api/v1/...`. Turns stream as SSE; `tool.approval_required` is resumed with `user.tool_approval`. |
| Model provider abstraction | `setup.sh` | Anthropic by default, OpenAI by changing one line in `agent.json`. |

Off on purpose: sandbox, subagents, web search. This job does not need them.

### Why the approval gate matters here

The inbound email is written by a stranger and the agent holds write access to CRM, calendar and chat. `trueforge/inbound-3-injection.txt` is an email that tells the agent to post a promo to the sales channel and book five slots. The agent proposes the write, TrueForge shows the text, the human clicks Deny, nothing lands. Containment is two config lines: the allowlist and the approval list.

## Run it

Requirements: Node 22.14+, an Anthropic or OpenAI API key, an Ambiguous workspace with an agent API key (`ak_…`).

```bash
cp .env.example .env                 # fill AMBI_API_TOKEN, AMBI_API_URL, and ANTHROPIC_API_KEY or OPENAI_API_KEY
npx @truefoundry/trueforge@latest    # http://localhost:8790, leave it running
./trueforge/setup.sh                 # POSTs the model provider, the Ambiguous connector and the lead-desk agent
```

Open http://localhost:8790 → Agents → `lead-desk`, paste `trueforge/inbound-2.txt`, click Allow three times. Watch the deal, the calendar event and the sales-channel message appear in Ambiguous.

Headless, over the TrueForge API, auto-approving every gated write:

```bash
python3 trueforge/run.py trueforge/inbound-2.txt
```

Reset between runs: `./trueforge/reset.sh Bluebird` for one company, `./trueforge/wipe.sh` for everything.

The workspace needs a CRM pipeline named "Sales" whose first stage is the new-lead stage, a `#sales` channel, and wiki pages for the playbook and pricing. IDs are in `trueforge/instructions.md`; change them for your workspace.

## Files

```
trueforge/
  instructions.md            agent system prompt (source of truth)
  agent.json                 TrueForge agent manifest: model, MCP tools, approval list, runtime config
  setup.sh                   one-shot setup against a fresh local TrueForge over its REST API
  run.py                     headless driver: POST /sessions, POST /turns, handles tool.approval_required
  reset.sh                   deletes one company's deal, event, message and contacts in Ambiguous
  wipe.sh                    deletes every deal, contact, event, task and #sales message in Ambiguous
  inbound-1.txt, inbound-2.txt, inbound-4.txt   happy-path emails
  inbound-3-injection.txt    email with injected instructions, for the Deny beat
  DEMO.md                    3-minute demo script
  STEPS.md                   build log
```

## Demo video

_link added at submission_

## Team

Cuneyt Mertayak
