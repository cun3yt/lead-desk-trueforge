# Drive one inbound message through the lead-desk agent over the TrueForge API, approving every gated write.
import json, sys, time, urllib.request
BASE = "http://localhost:8790/api/v1"
def call(m, p, body=None, stream=False, timeout=300):
    r = urllib.request.Request(BASE + p, method=m, headers={"Content-Type": "application/json", "Accept": "text/event-stream" if stream else "application/json"}, data=json.dumps(body).encode() if body else None)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as x: return x.status, x.read().decode()
    except urllib.error.HTTPError as e: return e.code, e.read().decode()
def run(msg, decide=lambda name, args: "allow"):
    s, b = call("POST", "/sessions", {"agent": {"name": "lead-desk"}}); sid = json.loads(b)["data"]["id"]; print("session", sid)
    inp = [{"type": "user.message", "content": msg}]
    while True:
        t = time.time(); s, b = call("POST", f"/sessions/{sid}/turns", {"input": inp, "stream": True}, stream=True)
        pending = None
        for l in b.splitlines():
            if not l.startswith("data:"): continue
            e = json.loads(l[5:]); ty = e.get("type")
            if ty == "tool.call": print("  call", e.get("name"), json.dumps(e.get("arguments") or e.get("input"))[:200])
            elif ty == "tool.approval_required": pending = e; print("  APPROVAL", json.dumps(e)[:600])
            elif ty in ("turn.done", "turn.failed", "error"): print("  ", ty, json.dumps(e.get("state", e))[:300], "%.0fs" % (time.time() - t))
        if not pending: return sid
        inp = []
        for tc in pending["tool_calls"]:
            name = tc.get("name") or tc.get("tool_name"); d = decide(name, tc)
            print("  ->", d, name)
            inp.append({"type": "user.tool_approval", "thread_id": pending["thread_id"], "tool_call_id": tc.get("id") or tc.get("tool_call_id"), "approval": {"status": d}})
if __name__ == "__main__":
    run(open(sys.argv[1]).read())
