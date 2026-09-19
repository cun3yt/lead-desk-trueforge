# Lead Desk — an inbound sales agent on TrueForge

Built at the Agent Harness Hackathon (HackerSquad × TrueFoundry, Santa Clara, 2026-09-19).

An inbound email lands. Lead Desk reads the company wiki, answers the prospect's question with a source, then finishes the job inside the company's [Ambiguous](https://www.ambiguous.ai) workspace: creates the contact and deal in CRM, books the demo on the calendar, alerts the sales channel. Every write pauses for human approval in TrueForge. Deny, and nothing lands.

No application code. One system prompt, one MCP connection, one workspace. The harness does the rest.

## What TrueForge does here

| Harness feature | How Lead Desk uses it |
|---|---|
| MCP with header auth | Ambiguous exposes one MCP server for its whole workspace at `https://app.ambiguous.ai/mcp`, 895 tools. Registered once in Settings → Connectors with an `ak_` API key. |
| Tool allowlist + deferred loading | The agent sees 9 of 895 tools. The other 886 never reach the model. A raw `tools/list` from this server is 775 KB; without the allowlist it would not fit a prompt. |
| Approval gates | `create_deal`, `create_event`, `send_message`, `create_task` pause with the full arguments on screen. Contacts and reads run without a gate. |
| Durable sessions | Refresh mid-run; the pending approval is still there. |
| Prompt-injection containment | The inbound email is untrusted. The agent can only touch six write tools, and every customer-visible one needs a human click. See `trueforge/inbound-3-injection.txt`. |

Sandbox and subagents are off. This job does not need them.

## Run it

Requirements: Node 22.14+, an Anthropic API key, an Ambiguous workspace with an agent API key (`ak_…`).

```bash
cp .env.example .env           # fill ANTHROPIC_API_KEY, AMBI_API_TOKEN, AMBI_API_URL
npx @truefoundry/trueforge@latest   # http://localhost:8790, leave it running
./trueforge/setup.sh           # registers model provider, Ambiguous connector, lead-desk agent
```

Open http://localhost:8790 → Agents → `lead-desk`, paste `trueforge/inbound-2.txt`, click Allow three times.

Headless, over the TrueForge API (auto-approves every gated write):

```bash
python3 trueforge/run.py trueforge/inbound-2.txt
```

Reset the workspace between runs: `./trueforge/reset.sh Bluebird`.

The workspace needs a CRM pipeline named "Sales" whose first stage is the new-lead stage, a `#sales` channel, and wiki pages for the playbook and pricing. IDs are in `trueforge/instructions.md`; change them for your workspace.

## Files

```
trueforge/
  instructions.md            agent system prompt (source of truth)
  agent.json                 exported TrueForge agent manifest: model, tools, approval list
  setup.sh                   one-shot setup against a fresh local TrueForge
  run.py                     headless driver over POST /sessions and /turns, handles tool.approval_required
  reset.sh                   deletes one company's deal, event, message and contacts
  inbound-1.txt, inbound-2.txt   happy-path emails
  inbound-3-injection.txt    email with injected instructions, for the Deny beat
  DEMO.md                    3-minute demo script
  STEPS.md                   build log
```

`app/`, `components/`, `lib/`, `scripts/`, `docs/` are an earlier CopilotKit widget version of the same idea with hand-written tools. Kept for reference; not part of this submission.

## Demo video

_link added at submission_

## Team

Cuneyt Mertayak
