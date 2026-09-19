---
title: "Ambiguous pricing"
canonical: "https://www.ambiguous.ai/pricing"
---

# Ambiguous pricing

All prices are in USD. Every feature on every plan. We only gate volume.

## Plans

| Plan | Price | AI actions per month | Teammates |
| --- | --- | --- | --- |
| Free | $0/workspace/month | 1,000 per workspace | 5 |
| Pro | $20/seat/month | 5,000 per seat | Unlimited |

### Free

- All 17 apps included
- 1,000 AI actions/month (workspace-pooled)
- Up to 5 teammates (humans + agents)
- No credit card required
- All export formats
- MCP + CLI + REST access
- Webhooks and integrations
- Audit logs

### Pro

- Everything in Free
- 5,000 AI actions/seat/month (pooled)
- Unlimited teammates
- Priority support
- Annual billing available (17% off)

## Top-up packs

| Pack | Price | AI actions | Price per action |
| --- | --- | --- | --- |
| Small | $5 | 500 | $0.01 |
| Medium | $20 | 2,500 | $0.008 |
| Large | $50 | 10,000 | $0.005 |

Unused actions never expire.

Non-refundable (Stripe one-time charge).

Optional auto-recharge: triggers at 100 actions remaining, buys your chosen pack (default Medium), max once per 24 hours.

## Features and limits

- No module is locked behind Pro.
- No export format requires an upgrade.
- No webhook, audit log, or integration is paywalled.
- The only differences: AI action allotment and member count.

## Questions

### Is it really free?

Yes. The workspace is free forever for up to 5 teammates with 1,000 AI actions a month. We monetize AI actions, not seats. When your AI coworkers run more than 1,000 actions in a month, you top up ($5 for 500 actions, never expiring) or upgrade to Pro ($20/seat for 5,000 actions each). No credit card required to start.

### What counts as an AI action?

An AI action is any tool call driven by the Assistant or an AI coworker: a chat reply, a document edit, a task creation, an email draft. Pure human actions (saving a doc, navigating, reading) cost zero. Premium actions like image generation or web search cost more per call and show a badge before you confirm.

### Do unused actions expire?

Your monthly allotment resets each billing cycle; unused base actions don't roll over. However, top-up packs never expire. Buy 500 actions for $5 and they stay in your balance until you use them, even across months.

### Do agents use my action budget?

The built-in Assistant uses your workspace action budget (1 action per tool call, plus vendor cost for premium operations). External coworkers (BYO-LLM agents) only consume actions when they trigger premium operations with vendor cost. Their routine CRUD operations are free.

### Can I export my data?

Every document exports to its standard format without fidelity loss. Docs export to .docx, .pdf, and .md. Sheets export to .xlsx and .csv. Slides export to .pptx. Calendar exports .ics. Drive speaks the S3 API. You can leave any time. Your data travels with you.

### Does Ambiguous work on mobile?

Yes. Ambiguous is available as a native app on iOS (App Store) and Android (Play Store), plus a responsive web app at app.ambiguous.ai. The mobile apps support all 17 modules: same workspace, same coworkers, same real-time collaboration.

### How do I install the MCP server?

Copy the MCP config block from /agents/mcp into your Claude Desktop or Cursor settings file. Your agent gets access to all 17 workspace modules as tools: Docs, Mail, CRM, Calendar, Drive, and more. First tool call lands in under 60 seconds.

### How is my data protected?

All data is encrypted at rest and in transit. Workspaces are isolated at the database level. We do not train models on your data. API access requires workspace-scoped keys with explicit permission grants. See /security for our full practices and disclosure policy.

[Compare plans](https://www.ambiguous.ai/pricing). [Connect an agent](https://www.ambiguous.ai/agents).
