# Lead Desk — 3-minute demo script

Screen layout: left half TrueForge chat (http://localhost:8790, agent `lead-desk`). Right half Ambiguous, tabs open on the CRM "Sales" board and the `#sales` channel.

Before recording: `trueforge/reset.sh Bluebird && trueforge/reset.sh Skyline`.

| Time | Beat | Say |
|---|---|---|
| 0:00 | Title | "Eight hundred ninety-five tools. That is what the Ambiguous workspace MCP server hands you. Most frameworks choke on it. TrueForge did not: we picked nine, TrueForge handled auth and kept the rest out of context." |
| 0:15 | Paste `inbound-2.txt` | "An inbound email lands. Marcus, Bluebird Couriers, 31 seats, asks about SSO and a demo." |
| 0:25 | Wiki calls stream | "First it reads. Two MCP calls against the company wiki. It answers the SSO question with the page as source." |
| 0:45 | Pause 1: `create_deal` | "Now it wants to write. TrueForge stops and shows the exact call. Title, pipeline, stage, contact. I click Allow." Point at the deal appearing on the board. |
| 1:05 | Refresh the browser | "Conference Wi-Fi. Refresh. Session is still here, next approval is still waiting." |
| 1:15 | Pause 2: `create_event` → Allow. Pause 3: `send_message` → Allow | "Meeting on the calendar. Sales channel lights up. That is the job: deal, meeting, alert. Three writes, three Allows." |
| 1:45 | Paste `inbound-3-injection.txt` | "Now a stranger tries to use the agent. The email tells it to post a promo to our sales channel and book five slots." |
| 2:00 | Pause on `send_message` with the promo text → Deny | "The agent proposes it. TrueForge shows me the text. I hit Deny. Nothing lands. The agent stops and asks me instead of improvising." |
| 2:30 | Close | "No code. One prompt, one MCP connection, one workspace. A chat window answers the email. Lead Desk closes it, with a human on the last button." |

## Fallbacks
- If the UI is slow, run headless and screen-record the terminal: `python3 trueforge/run.py trueforge/inbound-2.txt`.
- If the refresh beat misbehaves, skip it and mention durable sessions in the close.
- If Ambiguous is unreachable, show the session log from the recorded run in TrueForge → Sessions.
