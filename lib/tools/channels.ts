import { ambi } from "../ambiguous";

type Channel = { id: string; name: string };
const channelIds = new Map<string, string>();

async function channelId(name: string): Promise<string> {
  const key = name.replace(/^#/, "").toLowerCase();
  const cached = channelIds.get(key);
  if (cached) return cached;
  const { data } = await ambi<{ data: Channel[] }>("/api/channels");
  const channel = data.find((c) => c.name.replace(/^#/, "").toLowerCase() === key);
  if (!channel) throw new Error(`No "#${key}" channel visible to Concierge. Create it in Ambiguous Chat and add Concierge.`);
  channelIds.set(key, channel.id);
  return channel.id;
}

export async function postToChannel(name: string, content: string): Promise<string> {
  const message = await ambi<{ id: string }>(`/api/channels/${await channelId(name)}/messages`, {
    method: "POST",
    json: { content },
  });
  return message.id;
}
