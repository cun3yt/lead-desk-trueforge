#!/usr/bin/env bash
# One-shot setup of a fresh local TrueForge (http://localhost:8790): model provider, Ambiguous MCP connector, lead-desk agent.
# Needs ANTHROPIC_API_KEY, AMBI_API_TOKEN, AMBI_API_URL in ../.env
set -euo pipefail
cd "$(dirname "$0")"
set -a; . ../.env; set +a
TF="${TRUEFORGE_URL:-http://localhost:8790}/api/v1"
post() { curl -s -o /dev/null -w "$1 -> %{http_code}\n" -H "Content-Type: application/json" -X POST "$TF$1" -d "$2"; }

post /settings/model-providers "$(cat <<JSON
{"manifest":{"type":"anthropic","auth":{"api_key":"$ANTHROPIC_API_KEY"},
 "models":[{"model_id":"claude-sonnet-5","name":"claude-sonnet-5","properties":{"context_length":1000000,"max_output_tokens":128000}}]}}
JSON
)"

post /settings/mcp-servers "$(cat <<JSON
{"manifest":{"type":"remote","name":"ambiguous","url":"$AMBI_API_URL/mcp",
 "description":"Ambiguous workspace: wiki, CRM, calendar, chat, tasks. One tool per REST operation.",
 "auth":{"type":"header","headers":{"Authorization":"Bearer $AMBI_API_TOKEN"}}}}
JSON
)"

post /agents "$(/usr/bin/python3 -c "
import json; a=json.load(open('agent.json')); a['manifest']['instructions']=open('instructions.md').read(); print(json.dumps(a))")"
echo "Open ${TRUEFORGE_URL:-http://localhost:8790} -> Agents -> lead-desk"
