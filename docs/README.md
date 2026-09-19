# Docs

Context for our hackathon project: **Concierge**, a customer-facing AI agent for Ambiguous (ambiguous.ai) clients, built with CopilotKit. Written for both teammates and coding agents. Collected 2026-09-12.

## Read this when

| Doc | Read when |
|---|---|
| [`concierge/demo-plan.md`](concierge/demo-plan.md) | Hackathon build: who is who, demo stage (Acme website + Ambiguous split screen), flows with diagrams, CopilotKit interaction types, 3-minute script, 3-hour plan, cuts, fallbacks |
| [`concierge/build-log.md`](concierge/build-log.md) | Following the build: stage list, what each stage changed, how to check it, what we saw (screenshots) |
| [`concierge/dev-plan.md`](concierge/dev-plan.md) | Building it: stack, repo layout, file ownership, tool contracts, agent prompt, milestones with done-checks, risks |
| [`concierge/deck.html`](concierge/deck.html) | End-of-hackathon slides (12, with build screenshots): open locally, ← → to move, F fullscreen |
| [`concierge/pitch.md`](concierge/pitch.md) | ~60-second spoken intro before the demo: problem, solution, how it works |
| [`concierge/concierge-design.md`](concierge/concierge-design.md) | Start here. Product idea, architecture, design decisions, generative UI catalog, hackathon plan, open questions |
| [`ambiguous/ambiguous-context.md`](ambiguous/ambiguous-context.md) | Calling Ambiguous (REST, CLI, MCP), auth and API keys, event listening, sandbox, pricing |
| [`copilotkit/copilotkit-context.md`](copilotkit/copilotkit-context.md) | Writing CopilotKit code: v2 runtime, hooks, generative UI, MCP, wiring to Ambiguous |

Each context doc ends with a table of the vendor's original docs saved under its `raw/` folder.

## Key facts at a glance

- **Ambiguous**: 17 workspace apps for humans + AI coworkers. One REST API (939 paths) at `https://app.ambiguous.ai`, also exposed as CLI (`npx ambiguous@latest`) and MCP (`https://app.ambiguous.ai/mcp`, 856 tools). API keys look like `ak_…`.
- **CopilotKit**: React UI → Copilot Runtime (your server) → agent, over the AG-UI protocol. Current packages 1.71.1. **Use the v2 API only** (`@copilotkit/react-core/v2`, `@copilotkit/runtime/v2`); most examples online are deprecated v1.
- **Cost**: our backend is an external agent, so routine Ambiguous CRUD calls don't consume the client's AI actions. We pay only the LLM bill.
- **Try without an account**: Ambiguous sandbox, `POST https://app.ambiguous.ai/sandbox/session` (tasks CRUD only, 1-hour session).

## Team setup

Never share passwords with an agent or in chat; each person signs in themselves and only keys land in local, gitignored files.

1. **Ambiguous API key** — sign in at https://app.ambiguous.ai → **Connect** → identity **new agent** named `Concierge` (so demo alerts and tasks come from Concierge, not a person). Copy the command it shows and run it **in your own terminal** from the repo root:
   ```bash
   npx ambiguous@latest auth login --token ak_…   # writes ./.ambi/config.json
   npx ambiguous@latest whoami                    # confirm identity + workspace
   ```
   Do not run it through an agent chat (e.g. `! …` in Claude Code): the key would land in the transcript.
2. **Claude API key** — create `.env.local` in the repo root (gitignored) and set `ANTHROPIC_API_KEY=`. CopilotKit's `BuiltInAgent` uses it.
3. **Ambiguous key for the app** — `.env.local` also needs `AMBI_API_TOKEN=` (same `ak_` key) and `AMBI_API_URL=https://app.ambiguous.ai`. An agent can copy the token from `.ambi/config.json` without printing it.
4. **CopilotKit** — no account or key needed; the open-source packages are enough. Install packages manually (`npm install @copilotkit/react-core @copilotkit/runtime zod`); `npx copilotkit create` opens a CopilotKit Intelligence sign-in we don't need.
5. **Claude Code plugin (optional, for seeding demo data):**
   ```bash
   claude plugin marketplace add ambiguous-ai/plugins
   claude plugin install ambiguous
   ```

`.gitignore` excludes `.env*` (except `.env.example`), `.ambi/`, `node_modules/`, `.next/`.

## Open decisions

See `concierge/concierge-design.md` §9: order data source, visitor identity, distribution model.
