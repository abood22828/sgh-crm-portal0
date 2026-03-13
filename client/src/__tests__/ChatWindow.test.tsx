import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import ChatWindow from '@/components/ChatWindow';

// Mock trpc hook used in component
vi.mock('@/lib/trpc', () => ({
  trpc: {
    whatsapp: {
      messages: {
        listByConversation: { useQuery: () => ({ data: [], refetch: () => {} }) },
        send: { useMutation: () => ({ mutate: () => {}, isPending: false }) },
      },
    },
  },
}));

// Provide a mock EventSource
class MockEventSource {
  url: string;
  listeners: Record<string, Function[]> = {};
  constructor(url: string) {
    this.url = url;
  }
  addEventListener(event: string, cb: Function) {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(cb);
  }
  removeEventListener(event: string, cb: Function) {
    this.listeners[event] = (this.listeners[event] || []).filter(f => f !== cb);
  }
  close() {}
  // helper to emit
  emit(data: any) {
    const ev = { data: JSON.stringify(data) } as any;
    (this.listeners['message'] || []).forEach((cb) => cb(ev));
  }
}

(global as any).EventSource = MockEventSource;

describe('ChatWindow SSE', () => {
  it('displays incoming SSE message', async () => {
    await act(async () => {
      render(<ChatWindow conversationId={42} />);
    });

    // simulate server event
    const es = (global as any).EventSource.instances?.[0];
    // If instances tracker not implemented, find by URL
    // @ts-ignore
    const instance = new (global as any).EventSource(`/api/whatsapp/stream/42`);
    act(() => {
      instance.emit({ event: 'message_created', data: { id: 1, conversationId: 42, content: 'hello', direction: 'inbound', status: 'received', sentAt: new Date().toISOString() } });
    });

    expect(await screen.findByText('hello')).toBeTruthy();
  });
});
