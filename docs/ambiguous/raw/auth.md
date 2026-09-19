---
title: "auth.md"
canonical: "https://www.ambiguous.ai/auth.md"
---

# auth.md

Authentication for Ambiguous Workspace. The resource server and OAuth authorization
server are at https://app.ambiguous.ai. Marketing pages at https://www.ambiguous.ai require no credentials.
Ambiguous supports API keys, OAuth authorization code with PKCE, and the WorkOS
`auth.md` `service_auth` registration and claim flow described below.

## 1. Discover

An unauthenticated tool call to [MCP](https://app.ambiguous.ai/mcp) returns 401 with a
`WWW-Authenticate: Bearer resource_metadata="…"` header. Follow that URL or fetch
[protected resource metadata](https://app.ambiguous.ai/.well-known/oauth-protected-resource).
Read `resource`, `resource_name`, `resource_logo_uri`, `authorization_servers`,
`scopes_supported`, and `bearer_methods_supported`. Fetch the advertised server's
[authorization metadata](https://app.ambiguous.ai/.well-known/oauth-authorization-server)
for OAuth endpoints, supported grants, and the `agent_auth` block. Live metadata is authoritative.

`agent_auth` supplies `skill`, `identity_endpoint`, `claim_endpoint`,
`identity_types_supported: ["service_auth"]`, and `events_supported: []`.
Only service-issued identity assertions are accepted for renewal. External ID-JAG
providers, anonymous registration, upstream security events, and refresh tokens are
not supported. There is no `events_endpoint` for this service-auth-only profile.

## 2. Pick a method

- Testing an integration with synthetic data: use the [disposable sandbox](https://www.ambiguous.ai/sandbox.md); no user identity is needed.
- Existing saved credential: verify it in the intended workspace before proceeding.
- Agent with the user's email: use the service authentication flow in section 3.
- Terminal host: use Connect in the workspace and its CLI setup instructions.
- MCP host: add https://app.ambiguous.ai/mcp and complete browser OAuth sign-in and consent.
- New workspace explicitly requested: follow [agent signup](https://www.ambiguous.ai/agents/cli).
  A human claims the provisional workspace by email. Service authentication can also
  resume after a human signs up and creates their workspace in the confirmation flow.

Do not register a new workspace when a saved credential is missing or rejected.
Never send credentials to the marketing site, the public skill, or an unrelated host.

## 3. Register or connect

### Service authentication: email → human confirmation → credential

Before registration, show the user the resource name, logo, and requested scope
`*` (their permissions in the workspace they select), and get their agreement.
Use the user's own login email. Do not substitute an email you control.

POST JSON to the discovered `agent_auth.identity_endpoint`
(currently https://app.ambiguous.ai/oauth/agent/identity):

```json
{"type":"service_auth","login_hint":"USER_LOGIN_EMAIL"}
```

The response contains `registration_id`, `registration_type`, `claim_token`,
`claim_token_expires`, `claim_url`, `post_claim_scopes`, and a `claim` object
with `user_code`, `verification_uri`, `expires_in`, and `interval`.
No access token is issued at registration. Keep the claim token private.

Give the human the returned verification link and six-digit code. They open the
link, sign in or sign up, verify their email if needed, choose their workspace,
and enter the code to approve or decline. The code comes from you; never ask the
human to send you a password, email verification token, or browser session.
Do not automate their approval or submit the code to the confirmation page yourself.
The link alone cannot authorize access. Each code expires after ten minutes.

Wait at least `claim.interval` seconds (initially five), then POST form data to
`token_endpoint` (currently https://app.ambiguous.ai/oauth/token):

```text
grant_type=urn:workos:agent-auth:grant-type:claim
claim_token=THE_PRIVATE_CLAIM_TOKEN
```

These are form fields: URL-encode them using your HTTP client's form encoder.
For `authorization_pending`, keep waiting at the current interval. For `slow_down`,
add at least five seconds to all subsequent polling intervals. A successful response
contains `access_token`, `token_type: "Bearer"`, `expires_in: 3600`, `scope: "*"`,
`identity_assertion`, and `assertion_expires`. A claim token is exchanged only once.
Stop polling after success, denial, or expiry; do not replay a consumed claim token.

If the code expires while `claim_token_expires` is still in the future, POST JSON
`{"claim_token":"THE_PRIVATE_CLAIM_TOKEN","email":"THE_SAME_LOGIN_EMAIL"}`
to the discovered `claim_endpoint` (currently https://app.ambiguous.ai/oauth/agent/claim).
Read the new `claim_attempt` block and give its replacement code and link to the
human. Earlier codes and links stop working. Once the outer 24-hour claim window
expires, begin a new registration with the user's agreement. A declined registration
cannot be restarted.

Store both the access token and identity assertion in your secret store. Before the
one-hour access token expires, POST form fields to `token_endpoint`:

```text
grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer
assertion=THE_SERVICE_ISSUED_IDENTITY_ASSERTION
resource=THE_EXACT_RESOURCE_FROM_PROTECTED_RESOURCE_METADATA
```

This returns a new one-hour access token. The assertion expires 24 hours after the
initial claim exchange; renewal does not extend that deadline. Treat the assertion
as opaque. On expiry or revocation, obtain new human consent through registration.

### Terminal and MCP hosts

Terminal hosts run the Connect command for the chosen identity, then verify it:

```sh
npx ambiguous whoami --json
```

Use `AMBI_API_TOKEN` only when environment-based credentials are needed, such as CI.
`AMBI_API_URL` selects the intended API origin. Keep tokens out of logs, prompts,
and source control.

MCP hosts register a public OAuth client through `registration_endpoint`, then use
`response_type=code`, an exact registered redirect URI, and PKCE
`code_challenge_method=S256`. Exchange the returned code at `token_endpoint`
with the original `code_verifier`. Let the MCP host manage this flow.

## 4. Scopes and permissions

OAuth and service registration advertise `*`: access is bounded by the confirming
identity's current role and resource permissions in their selected workspace.
API keys can have narrower permissions, including `documents.read`, `tasks.read`,
and `tasks.write`. Use a scoped API key when a smaller grant is needed; arbitrary
granular OAuth scope requests are not supported.

## 5. Use the credential

Workspace REST and MCP requests use `Authorization: Bearer <access_token>`.
Read the public [OpenAPI contract](https://app.ambiguous.ai/api/openapi.json) for schemas.
A safe first check is `GET https://app.ambiguous.ai/api/users/me` or the CLI `whoami --json`
command above. Confirm the account, workspace, and credential source before reading
or changing workspace data.

## 6. Errors

| Response | Action |
| --- | --- |
| 400 invalid_request | Correct the request using the published schema. |
| authorization_pending | Wait for human confirmation and poll at the current interval. |
| slow_down | Add five seconds to the polling interval. |
| access_denied | Stop: the human declined. |
| expired_token / claim_expired | Restart the attempt if the outer claim token is valid; otherwise register again with consent. |
| invalid_grant | The credential expired, was revoked, or was already consumed; reconnect with human consent. |
| anonymous_not_enabled / issuer_not_enabled | Use service_auth with the user's agreement. |
| 401 | Reconnect using the intended account; never create a replacement workspace. |
| 403 | Request the missing permission or complete the indicated verification step. |
| 404 | Check the resource link and access with its owner; do not infer private content exists. |
| 429 | Wait for Retry-After before retrying. |

## 7. Revocation

POST form-encoded `token=THE_ACCESS_TOKEN` to the advertised `revocation_endpoint`
(currently https://app.ambiguous.ai/oauth/revoke). The token authenticates this request;
unknown and already revoked tokens return 200. This revokes that access token only.

The human can [manage agent access](https://app.ambiguous.ai/oauth/agent/connections), also
linked from Settings → Security & sign-in. Disconnecting a registration revokes every
access token issued from it and prevents further assertion-based renewal. API keys
can also be revoked individually in workspace settings.
