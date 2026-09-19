// Reads the "Concierge playbook" Wiki page (internal Home space) so the company can steer Concierge without code.
// Accepts both "## Tone\nformal" and "Tone: formal" (what someone typing in the Wiki editor tends to write).
import { ambi, docToText } from "./ambiguous";

const PAGE_ID = process.env.CONCIERGE_PLAYBOOK_PAGE_ID ?? "2ccb8722-761a-4992-841d-2e684d06a831";
const COMPANY = process.env.CONCIERGE_COMPANY ?? "Acme";

export type Playbook = { tone: string; offer: string | null; rules: string[] };

const DEFAULT_PLAYBOOK: Playbook = { tone: "formal", offer: null, rules: [] };

export function parsePlaybook(text: string): Playbook {
  const sections: Record<string, string[]> = { tone: [], offer: [], rules: [] };
  let current: keyof typeof sections | null = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const heading = line.match(/^#*\s*\**(tone|offer|rules)\**\s*:?\s*(.*)$/i);
    if (heading) {
      current = heading[1].toLowerCase() as keyof typeof sections;
      if (heading[2]) sections[current].push(heading[2]);
      continue;
    }
    if (current) sections[current].push(line.replace(/^[-*]\s+/, ""));
  }
  const offer = sections.offer.join(" ").trim();
  return {
    tone: sections.tone.join(" ").trim() || DEFAULT_PLAYBOOK.tone,
    offer: offer && !/^(none|no|-|n\/a)$/i.test(offer) ? offer : null,
    rules: sections.rules,
  };
}

export async function readPlaybook(): Promise<Playbook> {
  try {
    const page = await ambi<{ content: string | null }>(`/api/wiki/pages/${PAGE_ID}`, { cache: "no-store" });
    return parsePlaybook(docToText(page.content));
  } catch (error) {
    console.warn("[playbook] could not read the playbook page; using defaults", error);
    return DEFAULT_PLAYBOOK;
  }
}

// Deterministic, instant greeting (no model call) so the change is visible the moment the page loads.
export function greetingFor({ tone, offer }: Playbook): string {
  if (/casual|friendly|relaxed/i.test(tone)) {
    return offer ? `Hey! ${offer}. What are you looking for?` : `Hey! What can I help you find at ${COMPANY}?`;
  }
  return offer ? `Welcome to ${COMPANY}. This week: ${offer}. How can I help you today?` : `Welcome to ${COMPANY}. How can I help you today?`;
}
