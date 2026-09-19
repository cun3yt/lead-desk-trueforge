// Ambiguous REST client for server tools. Server-side only: AMBI_API_TOKEN must never reach the browser.
// Used by the Next.js runtime route and by scripts run with tsx.

export const AMBI_URL = process.env.AMBI_API_URL ?? "https://app.ambiguous.ai";

type AmbiInit = Omit<RequestInit, "body"> & { json?: unknown };

export class AmbiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);
  }
}

export async function ambi<T>(path: string, init: AmbiInit = {}): Promise<T> {
  const token = process.env.AMBI_API_TOKEN;
  if (!token) {
    throw new Error(
      "AMBI_API_TOKEN is empty. Set it in .env.local; if your shell exports an empty one (e.g. from .env), run: unset AMBI_API_TOKEN",
    );
  }
  const { json, headers, ...rest } = init;
  const method = rest.method ?? "GET";

  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${AMBI_URL}${path}`, {
      ...rest,
      body: json === undefined ? undefined : JSON.stringify(json),
      headers: {
        Authorization: `Bearer ${token}`,
        "API-Version": "1",
        ...(json === undefined ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
    });
    if (res.status === 429 && attempt < 3) {
      const seconds = Number(res.headers.get("Retry-After")) || 1;
      await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
      continue;
    }
    if (!res.ok) {
      const body = await res.text();
      throw new AmbiError(`Ambiguous ${method} ${path} failed with ${res.status}: ${body.slice(0, 300)}`, res.status, body);
    }
    return (await res.json()) as T;
  }
}

// Wiki page content is editor JSON (doc > paragraph/heading/list > text). Flatten it to plain text for the model.
type DocNode = { type?: string; text?: string; attrs?: { label?: string }; content?: DocNode[] };

export function docToText(content: string | null | undefined): string {
  if (!content) return "";
  let root: DocNode;
  try {
    root = JSON.parse(content) as DocNode;
  } catch {
    return content; // already plain text
  }
  const blocks: string[] = [];
  const inline = (node: DocNode): string =>
    node.text ?? (node.type === "mention" ? node.attrs?.label ?? "" : (node.content ?? []).map(inline).join(""));
  const walk = (node: DocNode) => {
    if (node.type === "paragraph" || node.type === "heading") {
      const line = inline(node).trim();
      if (line) blocks.push(line);
      return;
    }
    (node.content ?? []).forEach(walk);
  };
  walk(root);
  return blocks.join("\n");
}
