import React, { useEffect, useRef, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { CheckCheck, Clock, XCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useSSE from "@/hooks/useSSE";
import { toast } from "sonner";

interface ChatWindowProps {
  conversationId: number | null;
  lastMessageAt?: string | Date | null;
  onConversationUpdate?: () => void;
}

/** Returns true if the last message was more than 24 hours ago (or never) */
function isOutsideWindow(lastMessageAt?: string | Date | null): boolean {
  if (!lastMessageAt) return true;
  const last = new Date(lastMessageAt).getTime();
  return Date.now() - last > 24 * 60 * 60 * 1000;
}

export default function ChatWindow({ conversationId, lastMessageAt, onConversationUpdate }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [messageText, setMessageText] = useState("");
  const [localMessages, setLocalMessages] = useState<any[]>([]);

  const outsideWindow = isOutsideWindow(lastMessageAt);

  const { data: messagesData, refetch: refetchMessages } = trpc.whatsapp.messages.listByConversation.useQuery(
    { conversationId: conversationId! },
    { enabled: !!conversationId }
  );

  const { data: templates } = trpc.whatsapp.templates.list.useQuery(undefined, {
    enabled: outsideWindow && !!conversationId,
  });

  const sendMessageMutation = trpc.whatsapp.messages.send.useMutation({
    onSuccess: () => {
      setMessageText("");
      refetchMessages();
      onConversationUpdate?.();
    },
    onError: (err) => {
      toast.error(`فشل إرسال الرسالة: ${err.message}`);
    },
  });

  const sendTemplateMutation = trpc.whatsapp.messages.sendTemplateByConversation.useMutation({
    onSuccess: () => {
      refetchMessages();
      onConversationUpdate?.();
      toast.success("تم إرسال القالب بنجاح");
    },
    onError: (err) => {
      toast.error(`فشل إرسال القالب: ${err.message}`);
    },
  });

  // ── Scroll helper — defined before SSE callback so it can be referenced ──
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 50);
  }, []);

  // SSE subscription for this conversation
  useSSE(conversationId ? `/api/whatsapp/stream/${conversationId}` : null, (e) => {
    try {
      // SSE events are named (event: <name>\ndata: ...) — e.type holds the event name
      const eventName = (e as any).type || 'message';
      const payload = JSON.parse(e.data);

      // Handle new_message (inbound from webhook) or message_created (from db helper)
      if (eventName === 'new_message' || eventName === 'message_created' || payload?.event === 'message_created') {
        const msg = eventName === 'new_message' ? payload : payload?.data;
        if (!msg) return;
        if (String(msg.conversationId) === String(conversationId)) {
          setLocalMessages((prev) => {
            // Avoid duplicate by id or whatsappMessageId
            if (prev.some((m) => m.id === msg.id || (m.whatsappMessageId && msg.whatsappMessageId && m.whatsappMessageId === msg.whatsappMessageId))) return prev;
            // Replace optimistic pending message if content and direction match
            const idx = prev.findIndex((m) => m.id && String(m.id).startsWith('temp-') && m.content === msg.content && m.direction === msg.direction);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], ...msg };
              return copy;
            }
            return [...prev, msg];
          });
          scrollToBottom();
          onConversationUpdate?.();
        }
      } else if (eventName === 'message_updated' || payload?.event === 'message_updated') {
        // Update delivery status (delivered ✓✓ / read ✓✓ blue)
        const msg = eventName === 'message_updated' ? payload : payload?.data;
        if (!msg) return;
        setLocalMessages((prev) => {
          const idx = prev.findIndex((m) =>
            m.id === msg.messageId ||
            m.id === msg.id ||
            (m.whatsappMessageId && msg.whatsappMessageId && m.whatsappMessageId === msg.whatsappMessageId)
          );
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], ...msg, id: copy[idx].id };
            return copy;
          }
          return prev;
        });
      } else if (payload?.event === 'conversation_updated') {
        onConversationUpdate?.();
      }
    } catch (_) {}
  });

  useEffect(() => {
    if (messagesData && Array.isArray(messagesData)) {
      const map = new Map<string | number, any>();
      messagesData.forEach((m: any) => map.set(m.id, m));
      localMessages.forEach((m) => map.set(m.id, m));
      const merged = Array.from(map.values()).sort((a: any, b: any) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
      setLocalMessages(merged);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesData]);

  useEffect(() => {
    scrollToBottom();
  }, [conversationId, localMessages, scrollToBottom]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-green-500" />;
      case "failed":
        return <XCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const handleSend = () => {
    if (!messageText.trim() || !conversationId) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      conversationId,
      direction: "outbound",
      content: messageText.trim(),
      messageType: "text",
      status: "pending",
      sentAt: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, optimistic]);
    scrollToBottom();
    sendMessageMutation.mutate({
      conversationId,
      content: messageText.trim(),
      messageType: "text",
    });
  };

  const handleSendTemplate = (template: { id: number; name: string; content: string }) => {
    if (!conversationId) return;
    sendTemplateMutation.mutate({
      conversationId,
      templateName: template.name,
      languageCode: "ar",
      components: [],
    });
  };

  return (
    <div className="flex flex-col h-full" dir="rtl">
      <div className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5] dark:bg-gray-900/50">
        {(!localMessages || localMessages.length === 0) ? (
          <div className="text-center text-muted-foreground py-12">
            <div className="bg-green-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <span className="text-green-500 font-bold">واتساب</span>
            </div>
            <p className="text-sm">لا توجد رسائل في هذه المحادثة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {localMessages.map((msg: any, idx: number) => (
              <div
                key={msg.id || `${idx}`}
                className={`flex ${msg.direction === "outbound" ? "justify-start" : "justify-end"}`}
              >
                <div className={`${msg.direction === "outbound" ? "bg-white dark:bg-gray-800 text-foreground rounded-bl-none" : "bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-br-none"} max-w-[85%] sm:max-w-[70%] rounded-lg p-2.5 sm:p-3 shadow-sm`}>
                  <div className="whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed">{msg.content}</div>
                  <div className={`flex items-center gap-1 mt-1 text-[10px] sm:text-xs ${msg.direction === "outbound" ? "text-muted-foreground" : "text-white/80"}`}>
                    <span>{new Date(msg.sentAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</span>
                    {msg.direction === "outbound" && <span className="ml-1">{getStatusIcon(msg.status || "pending")}</span>}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 24-hour window warning */}
      {outsideWindow && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-700 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <span>⚠️</span>
          <span>انتهت نافذة الـ 24 ساعة — لا يمكن إرسال رسائل عادية. استخدم قالباً معتمداً من Meta.</span>
        </div>
      )}

      <div className="border-t dark:border-gray-700 p-3 bg-white dark:bg-gray-900">
        {outsideWindow ? (
          <div className="flex gap-2 items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1 justify-between text-sm"
                  disabled={sendTemplateMutation.isPending}
                >
                  <span>اختر قالباً معتمداً لإرسال الرسالة</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {!templates || templates.length === 0 ? (
                  <DropdownMenuItem disabled>لا توجد قوالب متاحة</DropdownMenuItem>
                ) : (
                  (templates as any[])
                    .filter((t) => t.isActive)
                    .map((t) => (
                      <DropdownMenuItem
                        key={t.id}
                        onClick={() => handleSendTemplate(t)}
                        className="flex flex-col items-start gap-1 py-2"
                      >
                        <span className="font-medium text-sm">{t.name}</span>
                        <span className="text-xs text-muted-foreground line-clamp-2">{t.content}</span>
                      </DropdownMenuItem>
                    ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {sendTemplateMutation.isPending && (
              <svg className="animate-spin h-5 w-5 text-green-500" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="31.4 31.4" fill="none" />
              </svg>
            )}
          </div>
        ) : (
          <div className="flex gap-2 items-end">
            <Textarea
              placeholder="اكتب رسالتك هنا..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              className="flex-1 resize-none min-h-[40px] max-h-[120px] text-sm sm:text-base"
            />
            <Button onClick={handleSend} disabled={!messageText.trim() || sendMessageMutation.isPending} size="icon" className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              {sendMessageMutation.isPending ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="31.4 31.4" fill="none" /></svg>
              ) : (
                <svg className="h-4 w-4 transform rotate-90" viewBox="0 0 24 24"><path fill="currentColor" d="M2 21l21-9L2 3v7l15 2-15 2z" /></svg>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
