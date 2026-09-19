#!/usr/bin/env bash
# Remove one company's demo artifacts from the Ambiguous workspace so the demo can be rerun.
# Usage: trueforge/reset.sh "Northwind"
# Deletes: CRM deals, calendar events, #sales messages and CRM contacts whose JSON contains the name (case-insensitive).
set -euo pipefail
cd "$(dirname "$0")"
set -a; . ../.env; set +a
Q="${1:?company name}"
SALES_CHANNEL="1e40584f-99eb-4547-8353-d3a5d5195b69"
H=(-H "Authorization: Bearer $AMBI_API_TOKEN" -H "API-Version: 1")

api() { curl -s "${H[@]}" "$AMBI_API_URL$1" "${@:2}"; }
ids() { /usr/bin/python3 -c "import json,sys; print('\n'.join(x['id'] for x in json.load(sys.stdin).get('data',[]) if '$Q'.lower() in json.dumps(x).lower()))"; }
del() { api "$2" -X DELETE -o /dev/null -w "$1 %{http_code}\n"; }

for id in $(api "/api/crm/deals?limit=50" | ids); do del "deal $id" "/api/crm/deals/$id"; done
for id in $(api "/api/calendars/events?start=$(date -u +%Y-%m-%dT00:00:00Z)&end=2027-01-01T00:00:00Z" | ids); do del "event $id" "/api/calendars/events/$id"; done
for id in $(api "/api/channels/$SALES_CHANNEL/messages?limit=20" | ids); do del "message $id" "/api/channels/$SALES_CHANNEL/messages/$id"; done
for id in $(api "/api/crm/contacts?q=$(printf %s "$Q" | sed 's/ /%20/g')" | ids); do del "contact $id" "/api/crm/contacts/$id"; done
