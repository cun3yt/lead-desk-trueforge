# Concierge — pitch script

Spoken intro delivered right before the 3-minute demo in [`demo-plan.md`](demo-plan.md). **Budget: under 2 minutes.** Now ≈180 spoken words ≈ 90 s at 120 wpm, leaving room for pauses. Recount after edits: `grep '^>' pitch.md | wc -w`.

---

## Hook

> Someone is on a company's website right now with a question, and nobody is there to answer it.

## The problem

> Ambiguous clients run their business in Ambiguous: knowledge in the Wiki, pipeline in the CRM, team in Chat.
>
> Their website knows none of it. Visitors get a contact form. Leads wait. Nobody learns which questions went unanswered.

## What we built

> **Concierge**: a website agent for every Ambiguous client, running on that client's own workspace.

## How it works

> **It knows.** Answers from the Wiki, live, with sources.
>
> **It acts.** Qualifies the lead, creates the deal, books the meeting, alerts sales. Can't answer? It creates a task so the team fills the gap.
>
> **It shows.** Lead cards, a meeting picker, and it highlights the right plan on the page. Generative UI, built with CopilotKit.
>
> And the company steers it from one Wiki page. No code.

## Lead into the demo

> Left: Acme's website. Right: Acme's Ambiguous workspace. Watch the right.

*(3-minute demo — see [`demo-plan.md`](demo-plan.md#3-minute-demo-script))*

## Closing line

> Every Ambiguous client gets a website agent on their own data, and routine calls cost them zero AI actions.

---

## Adjust to what gets built

| Line | Depends on | Status | If not built |
|---|---|---|---|
| "books the meeting" | Flow A booking | built (S6, scheduler) | Say "sets up the meeting" |
| "It creates a task so the team fills the gap" | Flow E | built (S7) | Cut the sentence |
| "it highlights the right plan on the page" | Extra X1 | S8, todo | Cut the phrase |
| "steers it from one Wiki page. No code." | Flow B | S8, todo | Cut the sentence |
| "routine calls cost them zero AI actions" | No premium operations (web search, image generation) in the demo | holds | Drop the claim; source: Ambiguous pricing, external agents' routine CRUD is free |
