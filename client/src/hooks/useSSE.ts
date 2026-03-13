import { useEffect, useRef } from 'react';

type SSEHandler = (event: MessageEvent) => void;

export function useSSE(url: string | null, onMessage?: SSEHandler) {
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!url) return;
    if (typeof window === 'undefined') return;

    try {
      esRef.current = new EventSource(url);
      const es = esRef.current;

      const onMsg = (e: MessageEvent) => {
        onMessage?.(e);
      };

      es.addEventListener('message', onMsg as EventListener);
      es.addEventListener('open', () => {
        // console.debug('[SSE] connected', url);
      });
      es.addEventListener('error', (err) => {
        // console.warn('[SSE] error', err);
      });

      return () => {
        es.removeEventListener('message', onMsg as EventListener);
        es.close();
        esRef.current = null;
      };
    } catch (err) {
      console.warn('[SSE] failed to init', err);
    }
  }, [url, onMessage]);
}

export default useSSE;
