import React, { useEffect, useRef, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { CheckCheck, Clock, XCircle, ChevronDown, Image, FileText, Music, Video, MapPin, Users, MessageSquare, User, MoreVertical, Reply, Trash2, Forward, Download, Paperclip, Calendar, Plus, Minus, Moon, Sun, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useSSE from "@/hooks/useSSE";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface ChatWindowProps {
  conversationId: number | null;
  lastMessageAt?: string | Date | null;
  onConversationUpdate?: () => void;
  phone?: string | null; // رقم هاتف العميل لإرسال القوالب
}

/** Returns true if the last message was more than 24 hours ago (or never) */
function isOutsideWindow(lastMessageAt?: string | Date | null): boolean {
  if (!lastMessageAt) return true;
  const last = new Date(lastMessageAt).getTime();
  return Date.now() - last > 24 * 60 * 60 * 1000;
}

/** Merge two message arrays: DB data takes priority, then local additions */
function mergeMessages(dbMsgs: any[], localMsgs: any[]): any[] {
  const map = new Map<string | number, any>();
  // DB messages first (authoritative)
  for (const m of dbMsgs) {
    if (m.id != null) map.set(m.id, m);
  }
  // Local messages: only add those not in DB (new SSE arrivals or optimistic)
  for (const m of localMsgs) {
    const key = m.id;
    if (key != null && !map.has(key)) {
      map.set(key, m);
    } else if (key != null && String(key).startsWith('temp-')) {
      // Keep optimistic messages that haven't been confirmed yet
      map.set(key, m);
    }
  }
  return Array.from(map.values()).sort(
    (a: any, b: any) => new Date(a.sentAt || a.createdAt).getTime() - new Date(b.sentAt || b.createdAt).getTime()
  );
}

export default function ChatWindow({ conversationId, lastMessageAt, onConversationUpdate, phone }: ChatWindowProps) {
  const { user } = useAuth();
  const userId = user?.id;
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [messageText, setMessageText] = useState("");
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  // Track the last conversationId to reset state on change
  const prevConvIdRef = useRef<number | null>(null);
  // تتحدث بعد إرسال قالب بنجاح لفتح نافذة الكتابة
  const [localLastMessageAt, setLocalLastMessageAt] = useState<Date | null>(null);
  // Track the message being replied to
  const [replyToMessage, setReplyToMessage] = useState<any | null>(null);

  // Track attached file
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track scheduled message dialog
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduledMessage, setScheduledMessage] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  // Track message font size
  const [messageFontSize, setMessageFontSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('whatsapp-message-font-size');
      return saved ? parseInt(saved, 10) : 14;
    }
    return 14;
  });

  const handleFontSizeChange = useCallback((delta: number) => {
    setMessageFontSize(prev => {
      const newSize = Math.max(12, Math.min(20, prev + delta));
      localStorage.setItem('whatsapp-message-font-size', newSize.toString());
      return newSize;
    });
  }, []);

  const handleRemoveFile = useCallback(() => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Track night mode
  const [isNightMode, setIsNightMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('whatsapp-night-mode');
      return saved === 'true';
    }
    return false;
  });

  const handleToggleNightMode = useCallback(() => {
    setIsNightMode(prev => {
      const newValue = !prev;
      localStorage.setItem('whatsapp-night-mode', newValue.toString());
      return newValue;
    });
  }, []);

  const outsideWindow = isOutsideWindow(localLastMessageAt ?? lastMessageAt);

  const { data: messagesData, refetch: refetchMessages } = trpc.whatsapp.messages.listByConversation.useQuery(
    { conversationId: conversationId! },
    { enabled: !!conversationId }
  );

  const { data: templates } = trpc.whatsapp.templates.list.useQuery(undefined, {
    enabled: !!conversationId,
  });

  const { data: activeUsers } = trpc.users.getActiveUsers.useQuery();

  const { data: quickReplies } = trpc.whatsapp.quickReplies.list.useQuery();

  const exportConversationMutation = trpc.whatsapp.conversations.exportConversation.useMutation();

  const handleExportConversation = useCallback(() => {
    if (!conversationId) return;
    exportConversationMutation.mutate(
      { conversationId },
      {
        onSuccess: (data: any) => {
          // Create CSV content
          const headers = ["التاريخ", "الاتجاه", "النوع", "المحتوى", "الحالة"];
          const rows = data.messages.map((msg: any) => [
            new Date(msg.createdAt).toLocaleString("ar-EG"),
            msg.direction === "inbound" ? "وارد" : "صادر",
            msg.messageType,
            msg.content,
            msg.status,
          ]);

          const csvContent = [
            headers.join(","),
            ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(",")),
          ].join("\n");

          // Create and download file
          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
          const link = document.createElement("a");
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", `conversation_${conversationId}_${new Date().toISOString().split("T")[0]}.csv`);
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast.success("تم تصدير المحادثة بنجاح");
        },
        onError: (err: any) => {
          toast.error(`فشل تصدير المحادثة: ${err.message}`);
        },
      }
    );
  }, [conversationId, exportConversationMutation]);

  const sendMessageMutation = trpc.whatsapp.messages.send.useMutation({
    onSuccess: () => {
      setMessageText("");
      setReplyToMessage(null);
      refetchMessages();
      onConversationUpdate?.();
    },
    onError: (err) => {
      toast.error(`فشل إرسال الرسالة: ${err.message}`);
    },
  });

  const deleteMessageMutation = trpc.whatsapp.messages.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الرسالة");
      refetchMessages();
    },
    onError: (err) => {
      toast.error(`فشل حذف الرسالة: ${err.message}`);
    },
  });

  const forwardMessageMutation = trpc.whatsapp.messages.forward.useMutation({
    onSuccess: () => {
      toast.success("تم إعادة توجيه الرسالة");
      refetchMessages();
      onConversationUpdate?.();
    },
    onError: (err) => {
      toast.error(`فشل إعادة التوجيه: ${err.message}`);
    },
  });

  const sendTemplateMutation = trpc.whatsapp.sendTemplate.useMutation({
    onSuccess: () => {
      // فتح نافذة الكتابة فوراً بتحديث وقت آخر رسالة محلياً
      setLocalLastMessageAt(new Date());
      refetchMessages();
      onConversationUpdate?.();
      toast.success("تم إرسال القالب بنجاح — يمكنك الآن إرسال رسائل عادية");
    },
    onError: (err: any) => {
      toast.error(`فشل إرسال القالب: ${err?.message || 'خطأ غير معروف'}`);
    },
  });

  // ── Scroll helper ──────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 50);
  }, []);

  // ── Reset local state when conversation changes ────────────────────────────
  useEffect(() => {
    if (prevConvIdRef.current !== conversationId) {
      prevConvIdRef.current = conversationId;
      setLocalMessages([]);
    }
  }, [conversationId]);

  // ── Sync DB data into localMessages ───────────────────────────────────────
  useEffect(() => {
    if (messagesData && Array.isArray(messagesData)) {
      setLocalMessages((prev) => mergeMessages(messagesData, prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesData]);

  // ── SSE subscription for this conversation ────────────────────────────────
  useSSE(conversationId ? `/api/whatsapp/stream/${conversationId}` : null, useCallback((e: MessageEvent) => {
    try {
      const eventName = (e as any).type || 'message';
      let payload: any;
      try { payload = JSON.parse(e.data); } catch { return; }

      // ── New inbound message (from webhook via pubsub) ──
      if (eventName === 'new_message') {
        const msg = payload;
        if (!msg || String(msg.conversationId) !== String(conversationId)) return;
        setLocalMessages((prev) => {
          // Avoid duplicate by id or whatsappMessageId
          const isDuplicate = prev.some(
            (m) =>
              (m.id != null && m.id === msg.id) ||
              (m.whatsappMessageId && msg.whatsappMessageId && m.whatsappMessageId === msg.whatsappMessageId)
          );
          if (isDuplicate) return prev;
          const newMsg = { ...msg, id: msg.id ?? `sse-${Date.now()}` };
          return [...prev, newMsg].sort(
            (a, b) => new Date(a.sentAt || a.createdAt).getTime() - new Date(b.sentAt || b.createdAt).getTime()
          );
        });
        scrollToBottom();
        onConversationUpdate?.();
        // Trigger a background refetch to get the DB-assigned ID
        setTimeout(() => refetchMessages(), 1500);
        return;
      }

      // ── Message created (from db.ts helper for outbound) ──
      if (eventName === 'message_created') {
        const msg = payload;
        if (!msg || String(msg.conversationId) !== String(conversationId)) return;
        setLocalMessages((prev) => {
          // Replace optimistic temp message if content matches
          const tempIdx = prev.findIndex(
            (m) => String(m.id).startsWith('temp-') && m.content === msg.content && m.direction === msg.direction
          );
          if (tempIdx >= 0) {
            const copy = [...prev];
            copy[tempIdx] = { ...copy[tempIdx], ...msg };
            return copy;
          }
          // Avoid duplicate
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg].sort(
            (a, b) => new Date(a.sentAt || a.createdAt).getTime() - new Date(b.sentAt || b.createdAt).getTime()
          );
        });
        scrollToBottom();
        return;
      }

      // ── Message status updated (delivered / read) ──
      if (eventName === 'message_updated') {
        const update = payload;
        if (!update) return;
        setLocalMessages((prev) => {
          const idx = prev.findIndex(
            (m) =>
              m.id === update.messageId ||
              m.id === update.id ||
              (m.whatsappMessageId && update.whatsappMessageId && m.whatsappMessageId === update.whatsappMessageId)
          );
          if (idx < 0) return prev;
          const copy = [...prev];
          copy[idx] = { ...copy[idx], status: update.status, deliveredAt: update.deliveredAt, readAt: update.readAt };
          return copy;
        });
        return;
      }

      // ── Conversation updated ──
      if (eventName === 'conversation_updated' || payload?.event === 'conversation_updated') {
        onConversationUpdate?.();
      }
    } catch (_) {}
  }, [conversationId, scrollToBottom, onConversationUpdate, refetchMessages]));

  useEffect(() => {
    scrollToBottom();
  }, [conversationId, scrollToBottom]);

  // Scroll when messages change
  useEffect(() => {
    if (localMessages.length > 0) scrollToBottom();
  }, [localMessages.length, scrollToBottom]);

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

  const getMessageTypeIcon = (messageType: string) => {
    switch (messageType) {
      case "image":
        return <Image className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      case "audio":
        return <Music className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "location":
        return <MapPin className="h-4 w-4" />;
      case "contacts":
        return <Users className="h-4 w-4" />;
      case "template":
        return <MessageSquare className="h-4 w-4" />;
      case "interactive":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleSend = useCallback(async () => {
    if (!messageText.trim() && !attachedFile) return;
    if (!conversationId) return;

    let mediaUrl = null;
    let messageType: "text" | "image" | "document" = "text";

    // Convert file to base64 if attached
    if (attachedFile) {
      try {
        const reader = new FileReader();
        mediaUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(attachedFile);
        });

        // Determine message type based on file
        if (attachedFile.type.startsWith("image/")) {
          messageType = "image";
        } else if (attachedFile.type === "application/pdf") {
          messageType = "document";
        } else {
          messageType = "document";
        }
      } catch (error) {
        toast.error("فشل تحميل الملف");
        return;
      }
    }

    const optimistic = {
      id: `temp-${Date.now()}`,
      conversationId,
      direction: "outbound" as const,
      content: messageText || attachedFile?.name || "",
      messageType,
      status: "sent" as const,
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      sentBy: userId,
      replyToMessageId: replyToMessage?.id,
      mediaUrl,
    };
    setLocalMessages((prev) => [...prev, optimistic]);
    scrollToBottom();
    sendMessageMutation.mutate({
      conversationId,
      message: messageText.trim(),
      replyToMessageId: replyToMessage?.id || undefined,
      mediaUrl,
      messageType,
    });
    setMessageText("");
    setReplyToMessage(null);
    handleRemoveFile();
  }, [conversationId, messageText, replyToMessage, sendMessageMutation, userId, attachedFile, handleRemoveFile]);

  const handleReply = (msg: any) => {
    setReplyToMessage(msg);
    // Focus on textarea
    document.querySelector('textarea')?.focus();
  };

  const handleDelete = (msg: any) => {
    if (!msg.id) return;
    if (confirm("هل أنت متأكد من حذف هذه الرسالة؟")) {
      deleteMessageMutation.mutate({ messageId: msg.id });
    }
  };

  const handleForward = (msg: any) => {
    // For now, just show a toast - full implementation would need a conversation selector
    toast.info("ميزة إعادة التوجيه قيد التطوير");
  };

  const handleInsertQuickReply = (content: string) => {
    setMessageText(prev => prev + (prev ? " " : "") + content);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("حجم الملف كبير جداً. الحد الأقصى 10MB");
        return;
      }
      setAttachedFile(file);
    }
  };

  const handleScheduleMessage = () => {
    if (!scheduledMessage.trim() || !scheduledDate) {
      toast.error("يرجى إدخال الرسالة وتاريخ الجدولة");
      return;
    }
    if (!conversationId) return;

    // For now, just show a toast - full implementation would need backend endpoint
    toast.info("ميزة جدولة الرسائل قيد التطوير");
    setScheduleDialogOpen(false);
    setScheduledMessage("");
    setScheduledDate("");
  };

  const handleSendTemplate = (template: { id: number; name: string; content: string; metaName?: string | null; languageCode?: string | null }) => {
    if (!conversationId) return;
    if (!phone) {
      toast.error("لا يوجد رقم هاتف لهذه المحادثة");
      return;
    }
    // استخدام metaName (الاسم المعتمد من Meta) إذا كان متاحاً، وإلا name
    const templateName = template.metaName || template.name;
    const languageCode = template.languageCode || "ar";
    sendTemplateMutation.mutate({
      phone,
      templateName,
      language: languageCode,
      conversationId,
      templateContent: template.content,
    });
  };

  return (
    <div className="flex flex-col h-full" dir="rtl">
      <div className={`flex-1 overflow-y-auto p-4 ${isNightMode ? 'bg-gray-900' : 'bg-[#e5ddd5] dark:bg-gray-900/50'}`}>
        {(!localMessages || localMessages.length === 0) ? (
          <div className="text-center text-muted-foreground py-12">
            <div className="bg-green-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <span className="text-green-500 font-bold">واتساب</span>
            </div>
            <p className="text-sm">لا توجد رسائل في هذه المحادثة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {localMessages.map((msg: any, idx: number) => {
              // inbound = رسالة من العميل → تظهر على اليمين (في RTL)
              // outbound = رسالة من الموظف → تظهر على اليسار (في RTL)
              const isOutbound = msg.direction === "outbound";
              const typeIcon = getMessageTypeIcon(msg.messageType);
              // Get sender name for outbound messages
              const senderName = isOutbound && msg.sentBy 
                ? activeUsers?.find((u: any) => u.id === msg.sentBy)?.name || "موظف"
                : null;
              
              return (
                <div
                  key={msg.id || `${idx}`}
                  className={`flex ${isOutbound ? "justify-start" : "justify-end"} group`}
                >
                  <div className={`${
                    isOutbound
                      ? "bg-white dark:bg-gray-800 text-foreground rounded-bl-none"
                      : "bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-br-none"
                  } max-w-[85%] sm:max-w-[70%] rounded-lg p-2.5 sm:p-3 shadow-sm relative`}>
                    {/* Sender name for outbound messages */}
                    {senderName && (
                      <div className={`text-[10px] font-medium mb-1 ${isOutbound ? "text-blue-600" : "text-white/80"}`}>
                        <User className="h-2.5 w-2.5 inline ml-1" />
                        {senderName}
                      </div>
                    )}
                    
                    {/* Quoted message */}
                    {msg.replyToMessageId && (
                      <div className={`text-[10px] mb-1 p-1.5 rounded ${isOutbound ? "bg-gray-100 dark:bg-gray-700" : "bg-white/20"}`}>
                        <Reply className="h-2.5 w-2.5 inline ml-1" />
                        <span className="opacity-70">رد على رسالة سابقة</span>
                      </div>
                    )}
                    
                    {typeIcon && (
                      <div className={`flex items-center gap-1.5 mb-1 ${isOutbound ? "text-muted-foreground" : "text-white/80"}`}>
                        {typeIcon}
                        <span className="text-[10px] uppercase font-medium">{msg.messageType}</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap break-words leading-relaxed" style={{ fontSize: `${messageFontSize}px` }}>{msg.content}</div>
                    <div className={`flex items-center justify-between mt-1 text-[10px] sm:text-xs ${isOutbound ? "text-muted-foreground" : "text-white/80"}`}>
                      <span>{new Date(msg.sentAt || msg.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</span>
                      <div className="flex items-center gap-1">
                        {isOutbound && <span className="ml-1">{getStatusIcon(msg.status || "pending")}</span>}
                        {/* Message actions menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem onClick={() => handleReply(msg)}>
                              <Reply className="h-3.5 w-3.5 ml-2" />
                              رد
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleForward(msg)}>
                              <Forward className="h-3.5 w-3.5 ml-2" />
                              إعادة توجيه
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(msg)} className="text-red-600">
                              <Trash2 className="h-3.5 w-3.5 ml-2" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
        {/* Reply indicator */}
        {replyToMessage && (
          <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Reply className="h-4 w-4 text-blue-600" />
              <span className="text-blue-700 dark:text-blue-300">رد على: {replyToMessage.content.substring(0, 30)}...</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setReplyToMessage(null)} className="h-6 w-6 p-0">
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Attached file indicator */}
        {attachedFile && (
          <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-green-600" />
              <span className="text-green-700 dark:text-green-300">{attachedFile.name}</span>
              <span className="text-xs text-muted-foreground">({(attachedFile.size / 1024).toFixed(1)} KB)</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRemoveFile} className="h-6 w-6 p-0">
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}

        
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
            {/* Attach file button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              title="إرفاق ملف"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            {/* Schedule message button */}
            <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  title="جدولة رسالة"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>جدولة رسالة</DialogTitle>
                  <DialogDescription>
                    حدد تاريخ ووقت إرسال الرسالة
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="scheduled-message">الرسالة</Label>
                    <Textarea
                      id="scheduled-message"
                      placeholder="اكتب الرسالة المراد جدولتها..."
                      value={scheduledMessage}
                      onChange={(e) => setScheduledMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="scheduled-date">التاريخ والوقت</Label>
                    <Input
                      id="scheduled-date"
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleScheduleMessage}>
                    جدولة
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Export button */}
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              title="تصدير المحادثة"
              onClick={handleExportConversation}
              disabled={exportConversationMutation.isPending}
            >
              {exportConversationMutation.isPending ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="31.4 31.4" fill="none" />
                </svg>
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
            {/* Font size buttons */}
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                title="تصغير الخط"
                onClick={() => handleFontSizeChange(-1)}
                disabled={messageFontSize <= 12}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                title="تكبير الخط"
                onClick={() => handleFontSizeChange(1)}
                disabled={messageFontSize >= 20}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {/* Night mode button */}
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              title={isNightMode ? "الوضع الفاتح" : "الوضع الليلي"}
              onClick={handleToggleNightMode}
            >
              {isNightMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {/* Quick Replies button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10" title="الردود السريعة">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {!quickReplies || quickReplies.length === 0 ? (
                  <DropdownMenuItem disabled>لا توجد ردود سريعة</DropdownMenuItem>
                ) : (
                  (quickReplies as any[])
                    .filter((r) => r.isActive)
                    .map((r) => (
                      <DropdownMenuItem
                        key={r.id}
                        onClick={() => handleInsertQuickReply(r.content)}
                        className="flex flex-col items-start gap-1 py-2"
                      >
                        <span className="font-medium text-sm">{r.name}</span>
                        <span className="text-xs text-muted-foreground line-clamp-2">{r.content}</span>
                      </DropdownMenuItem>
                    ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Template button - always available */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10" disabled={sendTemplateMutation.isPending}>
                  <MessageSquare className="h-4 w-4" />
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
