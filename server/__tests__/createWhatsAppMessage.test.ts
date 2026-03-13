import { describe, it, expect, vi } from 'vitest';
import * as pubsub from '../_core/pubsub';
import * as dbModule from '../db';

describe('createWhatsAppMessage publish', () => {
  it('should publish message_created event when message has conversationId', async () => {
    const publishSpy = vi.spyOn(pubsub, 'publish').mockImplementation(() => {} as any);

    // call createWhatsAppMessage with a fake message
    const fakeMsg = { conversationId: 123, content: 'hello', direction: 'inbound', messageType: 'text', status: 'received', sentAt: new Date() };

    // We stub getDb to avoid real DB calls by mocking db.insert to return an object
    const getDbOriginal = (dbModule as any).getDb;
    // Mock minimal db with insert
    (dbModule as any).getDb = async () => ({ insert: async (table: any) => ({ 0: { insertId: 999 } }), });

    // Import and call the function
    const result = await dbModule.createWhatsAppMessage(fakeMsg as any);

    expect(publishSpy).toHaveBeenCalled();

    // restore
    publishSpy.mockRestore();
    (dbModule as any).getDb = getDbOriginal;
  });
});
