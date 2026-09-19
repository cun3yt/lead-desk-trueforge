"use client";

import { useState } from "react";
import type { CaptureEmailResult } from "@/lib/contracts";

// Waiting state: the agent is paused until the visitor sends an email or skips.
export function EmailCapture({ question, onSubmit }: { question?: string; onSubmit: (result: CaptureEmailResult) => void }) {
  const [email, setEmail] = useState("");
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return (
    <form
      className="my-2 overflow-hidden rounded-md border border-signal/50 bg-panel text-sm"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) onSubmit({ email });
      }}
    >
      <p className="border-b border-signal/30 bg-signal/10 px-3 py-1.5 font-semibold text-signal-ink">Where should we send the answer?</p>
      <div className="space-y-2 p-3">
        {question && <p className="text-steel">“{question}”</p>}
        <div className="flex gap-2">
          <label htmlFor="concierge-gap-email" className="sr-only">
            Email
          </label>
          <input
            id="concierge-gap-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            className="min-w-0 flex-1 rounded-sm border border-line px-2 py-1.5 text-ink outline-none focus:border-signal"
          />
          <button
            type="submit"
            disabled={!valid}
            className="rounded-sm bg-signal px-3 py-1.5 font-semibold text-white disabled:opacity-40"
          >
            Send
          </button>
        </div>
        <div className="text-right">
          <button type="button" onClick={() => onSubmit({ declined: true })} className="text-steel underline-offset-2 hover:underline">
            Skip
          </button>
        </div>
      </div>
    </form>
  );
}

export function EmailCaptured({ result }: { result: CaptureEmailResult | null }) {
  const text = result && "email" in result ? `We'll reply to ${result.email}` : "No email left";
  return <div className="my-2 rounded-md border border-line bg-ground px-3 py-2 text-sm text-steel">{text}</div>;
}
