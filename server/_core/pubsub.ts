type EventCallback = (event: string, data: any) => void;

// Simple in-memory pub/sub for SSE - suitable for single-instance dev or MVP.
const subscribers: Map<string, Set<EventCallback>> = new Map();

export function subscribe(channel: string, cb: EventCallback) {
  if (!subscribers.has(channel)) subscribers.set(channel, new Set());
  subscribers.get(channel)!.add(cb);
  return () => unsubscribe(channel, cb);
}

export function unsubscribe(channel: string, cb: EventCallback) {
  const s = subscribers.get(channel);
  if (!s) return;
  s.delete(cb);
  if (s.size === 0) subscribers.delete(channel);
}

export function publish(channel: string, event: string, data: any) {
  const s = subscribers.get(channel);
  if (!s) return;
  for (const cb of Array.from(s)) {
    try {
      cb(event, data);
    } catch (err) {
      // swallow - subscriber issues shouldn't crash publisher
      console.warn('[pubsub] subscriber callback error', err);
    }
  }
}

// Convenience helpers for common channels
export const channelForConversation = (conversationId: number) => `conversation:${conversationId}`;
export const channelForUser = (userId: number) => `user:${userId}`;

export default { subscribe, unsubscribe, publish };
