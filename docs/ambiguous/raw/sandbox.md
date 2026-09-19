---
title: "Ambiguous API sandbox"
canonical: "https://www.ambiguous.ai/sandbox.md"
---

# Ambiguous API sandbox

Use the disposable sandbox to test task integration requests without accessing customer
data. It needs no signup, email, payment method, or product API key. Each session contains
synthetic records, has its own credential, and expires after one hour.

- Base URL: https://app.ambiguous.ai/sandbox
- Discovery: https://app.ambiguous.ai/sandbox
- OpenAPI: https://app.ambiguous.ai/sandbox/openapi.json
- Runnable Node.js smoke test: https://www.ambiguous.ai/sandbox/smoke.mjs

## Start a session

POST to `https://app.ambiguous.ai/sandbox/session` without an Authorization header.
The 201 response includes `access_token`, `token_type: "Bearer"`, `expires_in: 3600`,
`expires_at`, `base_url`, `openapi_url`, `fixture_task_id`, and `max_tasks: 100`.
Keep the returned `sb_` token private. It is accepted only by the sandbox; product
credentials are rejected here. No existing workspace is created, selected, or changed.

Subsequent requests use `Authorization: Bearer <sandbox access_token>` and the returned
base URL. Paths below are relative to that base, so `/api/tasks` becomes
`https://app.ambiguous.ai/sandbox/api/tasks`.

## Exercise the API

| Method and path | Behavior |
| --- | --- |
| GET /api/tasks | List synthetic tasks; one editable fixture is present initially. |
| POST /api/tasks | Create a task; returns 201 with `{ "task": … }`. |
| GET /api/tasks/{id} | Read a task; returns `{ "task": … }`. |
| PATCH /api/tasks/{id} | Update a task; returns `{ "task": … }`. |
| DELETE /api/tasks/{id} | Remove a task from the active list; returns 204. |
| GET /session | Inspect this session's expiry and fixture ID. |
| POST /session/reset | Restore the initial fixture and clear test records; expiry stays fixed. |
| DELETE /session | Delete the session and its records, revoking the credential; returns 204. |

Create and update support `title`, `description`, `status`, `priority`, and
`due_date`. A title is required on create. Descriptions are limited to 2,000 characters.
List supports `status` and `priority` filters plus `limit` (1–100) and `offset`.
Task response schemas and envelopes come from the product API contract.

Example creation body:

```json
{"title":"Test the integration","description":"Synthetic example","status":"todo"}
```

Then PATCH the returned task ID with `{"status":"done"}`, list with `?status=done`,
and delete it. A different session cannot read or change your records.

For a complete executable check, download and inspect [smoke.mjs](https://www.ambiguous.ai/sandbox/smoke.mjs),
then run `node smoke.mjs` with Node.js 18 or newer. It tests creation, reading, updates,
filtering, deletion, session isolation, and credential revocation, and cleans up both
sessions it creates. It never reads or writes your saved product credentials. For local
API development, set `SANDBOX_BASE_URL=http://localhost:YOUR_API_PORT/sandbox`.

## Limits and differences

This is a task CRUD sandbox. Mail, billing, automation, MCP, CRM, assignments, recurrence,
and SLA behavior are not simulated. Unsupported routes return 501, and unsupported
fields return 400. Consult its own OpenAPI document rather than assuming the full product
API is available. A session holds at most 100 records, including deleted tasks; reset it
to reclaim capacity. Requests are limited to 8,192 bytes, 120 calls per minute per IP,
and ten new sessions per hour per IP. On 429, wait for `Retry-After`.

Send only synthetic data. Expired credentials return 401; create a new disposable session
to continue. Resetting does not extend the one-hour lifetime. Delete a session when you
finish; abandoned expired records are pruned as new sessions are created.

When the integration is ready for real data, follow [authentication](https://www.ambiguous.ai/auth.md)
to connect the intended workspace and switch the base URL to https://app.ambiguous.ai.
Real product calls use the connected identity's permissions and can have external effects.
