import { Router, Request, Response } from "express";
import { subscribe, unsubscribe, channelForConversation, channelForUser } from "./_core/pubsub";

export function createWhatsAppSseRouter(): Router {
  const router = Router();

  // Conversation-level stream: clients subscribe to specific conversation updates
  router.get('/api/whatsapp/stream/:conversationId', (req: Request, res: Response) => {
    const conversationId = Number(req.params.conversationId);
    if (isNaN(conversationId)) return res.status(400).send('Invalid conversation id');

    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.flushHeaders();

    const send = (event: string, data: any) => {
      try {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (err) {
        // ignore
      }
    };

    const unsub = subscribe(channelForConversation(conversationId), send);

    // keep-alive ping
    const keepAlive = setInterval(() => res.write(': ping\n\n'), 20000);

    req.on('close', () => {
      clearInterval(keepAlive);
      unsub();
    });
  });

  // User-level stream: for notifications like new conversation, counts etc.
  router.get('/api/whatsapp/stream/user/:userId', (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    if (isNaN(userId)) return res.status(400).send('Invalid user id');

    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.flushHeaders();

    const send = (event: string, data: any) => {
      try {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (err) {}
    };

    const unsub = subscribe(channelForUser(userId), send);

    const keepAlive = setInterval(() => res.write(': ping\n\n'), 20000);

    req.on('close', () => {
      clearInterval(keepAlive);
      unsub();
    });
  });

  return router;
}

export default createWhatsAppSseRouter;
