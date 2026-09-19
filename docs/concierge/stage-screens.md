# Concierge — stage screens

What each build stage looks like when it's done, so both of us picture the same result before building it. [`build-log.md`](build-log.md) records what was actually built; [`dev-plan.md`](dev-plan.md) says how.

- ASCII sketches, not designs. **Left** = Acme website (we build it). **Right** = Ambiguous app, drawn roughly (the real layout differs).
- Names, times, email and prices are example values. The demo company is still open; "Acme, fleet maintenance" is the placeholder from [`demo-plan.md`](demo-plan.md).
- `[A]` / `[B]` = which track builds the piece (proposed split: **A** = Cuneyt + Claude, backend; **B** = Oskar, content + UI).

| Screen | Stages | What you see |
|---|---|---|
| [S2–S4](#s2s4--nothing-new-on-the-website) | Contracts, seed, server tools | No website change: a terminal and Ambiguous |
| [S5](#s5--website--first-cards) | Website + SourceCard, LeadCard | Checkpoint: Flow A without booking |
| [S6](#s6--booking) | SlotPicker, BookedCard | End of Flow A |
| [S7](#s7--knowledge-gap-flow-e) | EmailCapture, GapCard | Flow E |
| [S8](#s8--playbook-flow-b--agent-drives-the-page-x1) | Playbook, `highlight_plan` | Flow B + X1, then feature freeze |
| [S9](#s9--reset--stage) | Reset script, split screen | Demo setup |

S1 is in the build log (screenshot). S10 (rehearsal) adds no screen.

---

## S2–S4 — nothing new on the website

S2 is a TypeScript file with no screen. S3 fills Ambiguous with the demo company's content. S4 proves the server tools work, from a terminal.

**S4 check, terminal:**

```
$ npx tsx scripts/smoke-tools.ts
search_knowledge  query="SAP"                 ok  1 result: Integrations
create_lead       company="[DEMO] Northline"  ok  contact + deal created
notify_team       summary="smoke test"        ok  message posted in #sales
3/3 tools passed
```

**Ambiguous after S3 + S4:**

```
┌─ Ambiguous - Wiki ───────────────────┐  ┌─ Ambiguous - CRM ────────────────┐
│ Search: SAP                          │  │ Deals                            │
│                                      │  │ [DEMO] Northline Freight   New   │
│ Integrations          <- 1 match     │  │                                  │
│   "Two-way sync with SAP S/4HANA..." │  └──────────────────────────────────┘
│ Pricing                              │
│ FAQ          (no on-prem answer)     │  ┌─ Ambiguous - #sales ─────────────┐
│ Concierge playbook                   │  │ Concierge (agent)                │
│ Product                              │  │ smoke test                       │
└──────────────────────────────────────┘  └──────────────────────────────────┘
```

---

## S5 — website + first cards

**Checkpoint:** Flow A without booking.

**Left, the Acme website:**

```
┌─ localhost:3000 ───────────────────────────────────────────────────────┐
│ ACME                                  Product  Integrations  Pricing   │
│                                                                        │
│ Fleet maintenance on autopilot                           [Book demo]   │
│                                                                        │
│ INTEGRATIONS    SAP  .  Salesforce  .  Slack                           │
│                                                                        │
│ PRICING         Starter $10/seat   Growth $25/seat   Enterprise        │
│                                                                        │
│ FAQ             How long is setup?  Do you have an API?  ...           │
│                                                                        │
│                                                          ( chat )      │
└────────────────────────────────────────────────────────────────────────┘
```

**Popup after two messages:**

```
┌─ Concierge ───────────────────────────────┐
│                Do you integrate with SAP? │
│                                           │
│ Yes: two-way sync with SAP S/4HANA,       │
│ set up in about a day.                    │
│ ┌─ SourceCard ──────────────────────────┐ │
│ │ Integrations  .  Acme Wiki            │ │
│ │ "Two-way sync with SAP S/4HANA..."    │ │
│ │                           Open page > │ │  <- [A] search_knowledge tool
│ └───────────────────────────────────────┘ │  <- [B] SourceCard
│                                           │
│       We're Northline Freight, 200 seats, │
│                       need it live by Q4. │
│                                           │
│ Thanks! I've passed this to sales.        │
│ ┌─ LeadCard ────────────────────────────┐ │
│ │ [x] Lead created                      │ │
│ │ Northline Freight                     │ │
│ │ 200 seats  .  Q4  .  needs SAP        │ │  <- [A] create_lead tool
│ └───────────────────────────────────────┘ │  <- [B] LeadCard
│                                           │
│ [ Type a message...                   > ] │
└───────────────────────────────────────────┘
                                                  right screen, same moment:
                                                  CRM > Deals
                                                  + Northline Freight  200 seats  New
```

---

## S6 — booking

End of Flow A. The SlotPicker is the first card where the agent **waits for the visitor** before continuing.

**Popup:**

```
┌─ Concierge ───────────────────────────────┐
│                    Can I talk to someone? │
│                                           │
│ Sure, pick a time with our sales team.    │
│ ┌─ SlotPicker ──────────────────────────┐ │
│ │ [ Tue 15 Sep 10:00 ]  [ Tue 14:30 ]   │ │  <- [A] get_slots tool
│ │ [ Wed 16 Sep 09:00 ]  [ Thu 16:00 ]   │ │  <- [B] SlotPicker: agent PAUSES here
│ │                         No thanks     │ │     until the visitor clicks
│ └───────────────────────────────────────┘ │     (human-in-the-loop)
│                                           │
│ Done, see you Tuesday!                    │
│ ┌─ BookedCard ──────────────────────────┐ │
│ │ [x] Meeting booked                    │ │
│ │ Tue 15 Sep, 10:00-10:30               │ │  <- [A] book_meeting + notify_team
│ │ with Acme sales  .  invite sent       │ │  <- [B] BookedCard
│ └───────────────────────────────────────┘ │     fallback: "Sales will call you
│                                           │     Tue 10:00" (Task, not a booking)
│ [ Type a message...                   > ] │
└───────────────────────────────────────────┘
```

**Right, same moment:**

```
┌─ Ambiguous - Chat - #sales ────────────────────────────────────────┐
│ Concierge (agent)                                          10:02   │
│ Hot lead: Northline Freight, 200 seats, live by Q4, needs SAP.     │
│ Meeting booked Tue 15 Sep 10:00.                    Open deal >    │
└────────────────────────────────────────────────────────────────────┘
```

---

## S7 — knowledge gap (Flow E)

**Popup:** the FAQ has no on-prem answer on purpose.

```
┌─ Concierge ───────────────────────────────┐
│                     Do you offer on-prem? │
│                                           │  <- [A] search_knowledge: 0 results
│ Good question, I'll check with the team.  │
│ ┌─ EmailCapture ────────────────────────┐ │
│ │ Where should we send the answer?      │ │  <- [B] EmailCapture: agent PAUSES
│ │ [ jane@northline.example ]  [Send]    │ │     until email sent or skipped
│ │                              Skip     │ │
│ └───────────────────────────────────────┘ │
│                                           │
│ ┌─ GapCard ─────────────────────────────┐ │
│ │ [x] Sent to the Acme team             │ │  <- [A] log_gap tool
│ │ "Do you offer on-prem?"               │ │  <- [B] GapCard
│ │ Answer goes to jane@northline.example │ │
│ └───────────────────────────────────────┘ │
│                                           │
│ [ Type a message...                   > ] │
└───────────────────────────────────────────┘
```

**Right, same moment:**

```
┌─ Ambiguous - Tasks ──────────────────────────────────────┐
│ [ ] FAQ gap: "Do you offer on-prem?"                     │
│     Assignee: Oskar   Created by: Concierge              │
│     Reply to: jane@northline.example                     │
└──────────────────────────────────────────────────────────┘
```

**Then, live on stage:** Oskar writes the missing page, and a new chat gets the answer.

```
┌─ Ambiguous - Wiki (Oskar) ─────────┐
│ On-prem                            │      ┌─ Concierge (new chat) ────────────────────┐
│ Yes. Acme runs on-prem on Linux,   │  ->  │                     Do you offer on-prem? │
│ Enterprise plan only.              │      │                                           │
└────────────────────────────────────┘      │ Yes, on the Enterprise plan.              │
                                            │ ┌─ SourceCard ──────────────────────────┐ │
                                            │ │ On-prem  .  Acme Wiki                 │ │
                                            │ │                           Open page > │ │
                                            │ └───────────────────────────────────────┘ │
                                            └───────────────────────────────────────────┘
```

---

## S8 — playbook (Flow B) + agent drives the page (X1)

**Flow B:** a judge edits one Wiki page; the agent changes without code. `[A]` reads the playbook, `[B]` passes it to the agent on page load.

```
BEFORE
┌─ Ambiguous - Wiki ─────────────┐      ┌─ Concierge greeting ───────────────┐
│ Concierge playbook             │      │ Good afternoon. How can I help     │
│                                │      │ you today?                         │
│ Tone:  formal                  │  ->  └────────────────────────────────────┘
│ Offer: none                    │
└────────────────────────────────┘

      judge edits the Wiki page, refreshes the website

AFTER
┌─ Ambiguous - Wiki ─────────────┐      ┌─ Concierge greeting ───────────────┐
│ Concierge playbook             │      │ Hey! 20% off all plans this week.  │
│                                │      │ What are you looking for?          │
│ Tone:  casual                  │  ->  └────────────────────────────────────┘
│ Offer: 20% off, launch week    │
└────────────────────────────────┘
```

**X1:** the agent moves the website itself, not just the chat.

```
┌─ localhost:3000/#pricing ────────────────────────────────┐
│ PRICING   (page scrolled here by the agent)              │
│                                                          │
│   ┌────────────┐   ┏━━━━━━━━━━━━┓   ┌────────────┐       │
│   │ Starter    │   ┃ Growth     ┃   │ Enterprise │       │
│   │ $10/seat   │   ┃ $25/seat   ┃   │ Custom     │       │
│   │            │   ┃ Fits 200   ┃   │            │       │
│   │            │   ┃ seats      ┃   │            │       │
│   └────────────┘   ┗━━━━━━━━━━━━┛   └────────────┘       │
│                                                          │
└──────────────────────────────────────────────────────────┘

   Visitor: "Which plan fits 200 seats?"
   Agent:   "Growth. I've highlighted it on the page."
   [A] prompt rule   [B] highlight_plan (browser tool: scroll + highlight)
```

After S8: flows A, E and B each run twice from a fresh page load → **feature freeze**.

---

## S9 — reset + stage

**`[A]` one command before every run:**

```
$ npx tsx scripts/reset-demo.ts
deleted   2 [DEMO] contacts, 2 deals, 3 tasks
restored  Concierge playbook (tone: formal, offer: none)
deleted   Wiki page "On-prem"
workspace ready for a clean run
```

**`[B]` split screen for the audience:**

```
┌─ projector ──────────────────────────────────────────────────────────┐
│ LEFT window                |  RIGHT window                           │
│ Acme website               |  app.ambiguous.ai                       │
│ localhost:3000             |  tabs: CRM | #sales | Tasks | Wiki      │
│                            |                                         │
│ visitor types here         |  deal, alert, task and page             │
│                            |  appear here live                       │
│                            |                                         │
│              ( Concierge ) |                                         │
└──────────────────────────────────────────────────────────────────────┘
```
