#!/usr/bin/env bash
# Delete ALL transactional demo data in the Ambiguous workspace: deals, contacts, calendar events, tasks, #sales messages.
# Keeps wiki pages, the Sales pipeline and the channels themselves. Usage: trueforge/wipe.sh
set -euo pipefail
cd "$(dirname "$0")"
set -a; . ../.env; set +a
SALES_CHANNEL="1e40584f-99eb-4547-8353-d3a5d5195b69"
H=(-H "Authorization: Bearer $AMBI_API_TOKEN" -H "API-Version: 1")
api() { curl -s "${H[@]}" "$AMBI_API_URL$1" "${@:2}"; }
ids() { /usr/bin/python3 -c "import json,sys; d=json.load(sys.stdin); print('\n'.join(x['id'] for x in d.get('data',[])))"; }
wipe() { local label=$1 list=$2 base=$3; for id in $(api "$list" | ids); do api "$base/$id" -X DELETE -o /dev/null -w "$label $id %{http_code}\n"; done; }
wipe deal    "/api/crm/deals?limit=100"                                                        "/api/crm/deals"
wipe event   "/api/calendars/events?start=2026-01-01T00:00:00Z&end=2027-12-31T00:00:00Z"        "/api/calendars/events"
wipe task    "/api/tasks?limit=100"                                                            "/api/tasks"
wipe message "/api/channels/$SALES_CHANNEL/messages?limit=100"                                 "/api/channels/$SALES_CHANNEL/messages"
wipe contact "/api/crm/contacts?limit=100"                                                     "/api/crm/contacts"
