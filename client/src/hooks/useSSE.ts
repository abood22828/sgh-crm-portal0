import { useEffect, useRef } from 'react';

type SSEHandler = (event: MessageEvent) => void;

/**
 * Stable SSE hook — the EventSource is only recreated when `url` changes.
 * The `onMessage` callback is stored in a ref so that changing it never
 * triggers a reconnect (avoids the "re-render → new callback → new ES" loop).
 * Includes exponential-backoff auto-reconnect on error.
 */
export function useSSE(url: string | null, onMessage?: SSEHandler) {
  const esRef = useRef<EventSource | null>(null);
  // Keep the latest handler in a ref — changing it never triggers reconnect
  const handlerRef = useRef<SSEHandler | undefined>(onMessage);
  useEffect(() => {
    handlerRef.current = onMessage;
  });

  useEffect(() => {
    if (!url || typeof window === 'undefined') return;

    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;
    const MAX_RETRIES = 10;
    const BASE_DELAY = 1000;

    function connect() {
      try {
        const es = new EventSource(url!);
        esRef.current = es;

        // Dispatch to the latest handler via ref
        const dispatch = (e: MessageEvent) => handlerRef.current?.(e);

        // Named events the server emits (event: <name>\n)
        const namedEvents = ['message_created', 'message_updated', 'conversation_updated', 'new_conversation', 'new_message', 'new_inbound_message'];
        namedEvents.forEach((name) => es.addEventListener(name, dispatch as EventListener));
        // Fallback for plain data lines without an event name
        es.addEventListener('message', dispatch as EventListener);

        es.addEventListener('open', () => {
          retryCount = 0;
        });

        es.addEventListener('error', () => {
          es.close();
          esRef.current = null;
          if (retryCount < MAX_RETRIES) {
            const delay = Math.min(BASE_DELAY * 2 ** retryCount, 30000);
            retryCount++;
            retryTimeout = setTimeout(connect, delay);
          }
        });
      } catch (err) {
        console.warn('[SSE] failed to init', err);
      }
    }

    connect();

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      esRef.current?.close();
      esRef.current = null;
    };
  }, [url]); // ← only url in deps; handler changes never trigger reconnect
}

export default useSSE;
