import { memo, useCallback, useState } from "react";
import { processPhoneInput } from "@/hooks/usePhoneFormat";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  MessageCircle, Send, Search, Plus, FileText, User, Phone,
  Smartphone, Wifi, WifiOff, Loader2 as LoaderIcon, ArrowRight,
  ChevronLeft, AlertCircle,
} from "lucide-react";
import ChatWindow from "@/components/ChatWindow";
import ConversationInfo from "@/components/ConversationInfo";
import useSSE from "@/hooks/useSSE";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Conversation {
  id: number;
  customerName?: string | null;
  phoneNumber: string;
  lastMessage?: string | null;
  lastMessageAt?: string | Date | null;
  unreadCount: number;
}

interface Template {
  id: number;
  name: string;
  content: string;
  category: string;
  variables?: string | null;
  isActive: number;
  metaName?: string | null;
  languageCode?: string | null;
}

// ─── ConversationsList — defined OUTSIDE WhatsAppContent to prevent re-mount ─
interface ConversationsListProps {
  filteredConversations: Conversation[] | undefined;
  conversationsLoading: boolean;
  selectedConversation: number | null;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onSelectConversation: (id: number) => void;
  isNewMessageOpen: boolean;
  onNewMessageOpenChange: (v: boolean) => void;
  newMessagePhone: string;
  onNewMessagePhoneChange: (v: string) => void;
  newMessageText: string;
  onNewMessageTextChange: (v: string) => void;
  newMessageTemplateId: number | null;
  onNewMessageTemplateIdChange: (v: number | null) => void;
  templates: Template[] | undefined;
  onSendNewMessage: () => void;
  isSendingNewMessage: boolean;
  connectionStatus: { isReady?: boolean; isConnecting?: boolean } | undefined;
  statusLoading: boolean;
}

const ConversationsList = memo(function ConversationsList({
  filteredConversations,
  conversationsLoading,
  selectedConversation,
  searchQuery,
  onSearchChange,
  onSelectConversation,
  isNewMessageOpen,
  onNewMessageOpenChange,
  newMessagePhone,
  onNewMessagePhoneChange,
  newMessageText,
  onNewMessageTextChange,
  newMessageTemplateId,
  onNewMessageTemplateIdChange,
  templates,
  onSendNewMessage,
  isSendingNewMessage,
  connectionStatus,
  statusLoading,
}: ConversationsListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b dark:border-gray-800 bg-gradient-to-r from-green-500 to-emerald-600">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            <h2 className="text-sm sm:text-base font-bold text-white">المحادثات</h2>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {statusLoading ? (
              <Badge className="gap-1 text-[10px] h-5 bg-white/20 text-white border-0">
                <LoaderIcon className="h-2.5 w-2.5 animate-spin" />
              </Badge>
            ) : connectionStatus?.isReady ? (
              <Badge className="bg-white/20 text-white border-0 gap-1 text-[10px] h-5">
                <Wifi className="h-2.5 w-2.5" />
                <span className="hidden sm:inline">متصل</span>
              </Badge>
            ) : (
              <Badge className="bg-red-500/80 text-white border-0 gap-1 text-[10px] h-5">
                <WifiOff className="h-2.5 w-2.5" />
                <span className="hidden sm:inline">غير متصل</span>
              </Badge>
            )}
            <Dialog open={isNewMessageOpen} onOpenChange={onNewMessageOpenChange}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" className="h-7 px-2 gap-1 text-[10px] bg-white/20 hover:bg-white/30 text-white border-0">
                  <Plus className="h-3 w-3" />
                  <span className="hidden sm:inline">جديد</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إرسال رسالة جديدة</DialogTitle>
                  <DialogDescription>أرسل رسالة مباشرة لرقم هاتف</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label>رقم الهاتف</Label>
                    <Input
                      placeholder="7XXXXXXXX"
                      value={newMessagePhone}
                      onChange={(e) => onNewMessagePhoneChange(processPhoneInput(e.target.value))}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      قالب الرسالة
                      <span className="text-[10px] text-muted-foreground font-normal">(مطلوب للمحادثات الجديدة أو بعد 24 ساعة)</span>
                    </Label>
                    <Select
                      value={newMessageTemplateId ? String(newMessageTemplateId) : "none"}
                      onValueChange={(v) => onNewMessageTemplateIdChange(v === "none" ? null : Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر قالباً أو اكتب رسالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون قالب (للمحادثات النشطة فقط)</SelectItem>
                        {templates?.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {newMessageTemplateId && (
                      <div className="flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        <span>سيتم إرسال القالب المحدد — تأكد من أن القالب معتمد من Meta</span>
                      </div>
                    )}
                  </div>
                  {!newMessageTemplateId && (
                    <div className="space-y-1.5">
                      <Label>الرسالة</Label>
                      <Textarea
                        placeholder="اكتب رسالتك هنا..."
                        value={newMessageText}
                        onChange={(e) => onNewMessageTextChange(e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    onClick={onSendNewMessage}
                    disabled={isSendingNewMessage || !newMessagePhone.trim() || (!newMessageTemplateId && !newMessageText.trim())}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSendingNewMessage ? (
                      <LoaderIcon className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <Send className="h-4 w-4 ml-2" />
                    )}
                    إرسال
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60" />
          <Input
            placeholder="بحث في المحادثات..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-8 h-8 text-xs bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
          />
        </div>
      </div>
      {/* List */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {conversationsLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            <LoaderIcon className="h-8 w-8 animate-spin mx-auto mb-2 text-green-500" />
            <p className="text-sm">جاري تحميل المحادثات...</p>
          </div>
        ) : filteredConversations && filteredConversations.length > 0 ? (
          <div className="divide-y dark:divide-gray-800">
            {filteredConversations.map((conv, index) => (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                style={{ opacity: 0, animation: `row-enter 0.35s ease-out ${Math.min(index * 60, 600)}ms forwards` }}
                className={`p-3 sm:p-4 cursor-pointer transition-colors hover:bg-green-50 dark:hover:bg-green-900/20 active:bg-green-100 ${
                  selectedConversation === conv.id ? "bg-green-100 dark:bg-green-900/30 border-r-4 border-green-600" : ""
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                        {conv.customerName || "عميل جديد"}
                      </h3>
                      {conv.unreadCount > 0 && (
                        <Badge variant="destructive" className="rounded-full px-1.5 text-[10px] sm:text-xs h-5 flex-shrink-0 mr-1">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span dir="ltr" className="truncate">{conv.phoneNumber}</span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {conv.lastMessageAt
                        ? formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true, locale: ar })
                        : "لا توجد رسائل"}
                    </p>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground lg:hidden flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <MessageCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm sm:text-base">لا توجد محادثات</p>
          </div>
        )}
        </div>
      </ScrollArea>
    </div>
  );
});

// ─── ChatAreaHeader — defined OUTSIDE to prevent re-mount ────────────────────
interface ChatAreaHeaderProps {
  selectedConv: Conversation | undefined;
  onBackToList: () => void;
}

const ChatAreaHeader = memo(function ChatAreaHeader({ selectedConv, onBackToList }: ChatAreaHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 sm:p-4 flex-shrink-0">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={onBackToList}
          className="lg:hidden p-1.5 hover:bg-white/20 rounded-full transition-colors"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
        <div className="bg-white/20 p-1.5 sm:p-2 rounded-full flex-shrink-0">
          <User className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm sm:text-lg font-bold truncate">
            {selectedConv?.customerName || "عميل جديد"}
          </h2>
          <p className="text-white/80 text-xs sm:text-sm" dir="ltr">
            {selectedConv?.phoneNumber}
          </p>
        </div>
        <Link href="/dashboard/whatsapp/templates">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-white hover:bg-white/20 gap-1 text-[10px]">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">القوالب</span>
          </Button>
        </Link>
      </div>
    </div>
  );
});

// ─── EmptyChatPlaceholder — defined OUTSIDE ──────────────────────────────────
const EmptyChatPlaceholder = memo(function EmptyChatPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900/30">
      <div className="text-center text-muted-foreground p-8">
        <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
          <MessageCircle className="h-12 w-12 text-green-500" />
        </div>
        <p className="text-lg font-medium mb-1">إدارة محادثات واتساب</p>
        <p className="text-sm">اختر محادثة من القائمة لبدء المراسلة</p>
      </div>
    </div>
  );
});

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WhatsAppPage() {
  return (
    <DashboardLayout pageTitle="واتساب" pageDescription="إدارة رسائل واتساب">
      <WhatsAppContent />
    </DashboardLayout>
  );
}

function WhatsAppContent() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessagePhone, setNewMessagePhone] = useState("");
  const [newMessageText, setNewMessageText] = useState("");
  const [newMessageTemplateId, setNewMessageTemplateId] = useState<number | null>(null);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Queries
  const { data: conversations, isLoading: conversationsLoading, refetch: refetchConversations } =
    trpc.whatsapp.conversations.list.useQuery();
  const { data: templates } = trpc.whatsapp.templates.list.useQuery();
  const { data: connectionStatus, isLoading: statusLoading } =
    trpc.whatsapp.connection.status.useQuery(undefined, { refetchInterval: 5000 });

  // Mutations
  const markConversationAsReadMutation = trpc.whatsapp.conversations.markAsRead.useMutation();
  
  const sendNewMessageMutation = trpc.whatsapp.messages.sendDirect.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال الرسالة بنجاح");
      setNewMessagePhone("");
      setNewMessageText("");
      setNewMessageTemplateId(null);
      setIsNewMessageOpen(false);
      refetchConversations();
    },
    onError: (error) => toast.error(`فشل إرسال الرسالة: ${error.message}`),
  });

  const sendTemplateMutation = trpc.whatsapp.messages.sendTemplate.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال القالب بنجاح");
      setNewMessagePhone("");
      setNewMessageText("");
      setNewMessageTemplateId(null);
      setIsNewMessageOpen(false);
      refetchConversations();
    },
    onError: (error) => toast.error(`فشل إرسال القالب: ${error.message}`),
  });

  // Stable callbacks — useCallback prevents new references on every render
  const handleSelectConversation = useCallback((id: number) => {
    setSelectedConversation(id);
    setMobileShowChat(true);
    // Mark conversation as read when opened
    markConversationAsReadMutation.mutate({ id });
  }, [markConversationAsReadMutation]);

  const handleBackToList = useCallback(() => setMobileShowChat(false), []);
  const handleSearchChange = useCallback((v: string) => setSearchQuery(v), []);
  const handleNewMessagePhoneChange = useCallback((v: string) => setNewMessagePhone(v), []);
  const handleNewMessageTextChange = useCallback((v: string) => setNewMessageText(v), []);
  const handleNewMessageTemplateIdChange = useCallback((v: number | null) => setNewMessageTemplateId(v), []);
  const handleNewMessageOpenChange = useCallback((v: boolean) => setIsNewMessageOpen(v), []);

  const handleSendNewMessage = useCallback(() => {
    if (!newMessagePhone.trim()) {
      toast.error("يرجى إدخال رقم الهاتف");
      return;
    }
    if (newMessageTemplateId) {
      const template = templates?.find((t: Template) => t.id === newMessageTemplateId);
      if (!template) { toast.error("القالب غير موجود"); return; }
      // استخدام metaName (الاسم المعتمد من Meta) إذا كان متاحاً، وإلا name
      const templateName = template.metaName || template.name;
      const languageCode = template.languageCode || "ar";
      sendTemplateMutation.mutate({
        phone: newMessagePhone,
        templateName,
        languageCode,
        components: [],
      });
    } else {
      if (!newMessageText.trim()) {
        toast.error("يرجى إدخال الرسالة أو اختيار قالب");
        return;
      }
      sendNewMessageMutation.mutate({ phone: newMessagePhone, content: newMessageText });
    }
  }, [newMessagePhone, newMessageTemplateId, newMessageText, templates, sendTemplateMutation, sendNewMessageMutation]);

  const handleConversationUpdate = useCallback(() => refetchConversations(), [refetchConversations]);

  // ── Global SSE: refresh conversation list when a new inbound message arrives ─────────────
  useSSE('/api/whatsapp/stream/user/0', useCallback((e: MessageEvent) => {
    try {
      const eventName = (e as any).type || 'message';
      if (eventName === 'new_inbound_message') {
        refetchConversations();
      }
    } catch (_) {}
  }, [refetchConversations]));

  // Derived
  const filteredConversations = conversations?.filter((conv: Conversation) =>
    conv.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.phoneNumber?.includes(searchQuery)
  ).sort((a: Conversation, b: Conversation) => {
    // Sort by unreadCount (unread first), then by lastMessageAt (newest first)
    if (a.unreadCount !== b.unreadCount) {
      return (b.unreadCount || 0) - (a.unreadCount || 0);
    }
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });
  const selectedConv = conversations?.find((c: Conversation) => c.id === selectedConversation);
  const isSendingNewMessage = sendNewMessageMutation.isPending || sendTemplateMutation.isPending;

  // Shared props for ConversationsList
  const listProps = {
    filteredConversations,
    conversationsLoading,
    selectedConversation,
    searchQuery,
    onSearchChange: handleSearchChange,
    onSelectConversation: handleSelectConversation,
    isNewMessageOpen,
    onNewMessageOpenChange: handleNewMessageOpenChange,
    newMessagePhone,
    onNewMessagePhoneChange: handleNewMessagePhoneChange,
    newMessageText,
    onNewMessageTextChange: handleNewMessageTextChange,
    newMessageTemplateId,
    onNewMessageTemplateIdChange: handleNewMessageTemplateIdChange,
    templates,
    onSendNewMessage: handleSendNewMessage,
    isSendingNewMessage,
    connectionStatus,
    statusLoading,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" dir="rtl">
      <div className="container mx-auto p-2 sm:p-4 md:p-6 max-w-7xl">
        {/* Page Header */}
        <div className="mb-3 sm:mb-4 md:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 sm:p-3 rounded-xl shadow-lg flex-shrink-0">
              <MessageCircle className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-xl md:text-2xl font-bold text-foreground truncate">إدارة محادثات واتساب</h1>
              <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground hidden xs:block">تواصل مع العملاء عبر واتساب بيزنس</p>
            </div>
            <div className="flex gap-1 sm:gap-2 items-center flex-shrink-0">
              <Link href="/dashboard/whatsapp/connection">
                <Button variant="outline" size="sm" className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-2.5">
                  <Smartphone className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">الاتصال</span>
                </Button>
              </Link>
              <Link href="/dashboard/whatsapp/templates">
                <Button variant="outline" size="sm" className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-2.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">القوالب</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Chat Layout */}
        <div
          className="bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden border dark:border-gray-800"
          style={{ height: "calc(100vh - 140px)", minHeight: "400px" }}
        >
          {/* Desktop */}
          <div className="hidden lg:grid lg:grid-cols-[340px_1fr_280px] h-full">
            <div className="border-l dark:border-gray-800 h-full overflow-hidden flex flex-col">
              <ConversationsList {...listProps} />
            </div>
            <div className="h-full overflow-hidden flex flex-col">
              {selectedConversation ? (
                <>
                  <ChatAreaHeader selectedConv={selectedConv} onBackToList={handleBackToList} />
                  <div className="flex-1 overflow-hidden">
                    <ChatWindow conversationId={selectedConversation} lastMessageAt={selectedConv?.lastMessageAt} onConversationUpdate={handleConversationUpdate} />
                  </div>
                </>
              ) : (
                <EmptyChatPlaceholder />
              )}
            </div>
            {/* Right Sidebar - Conversation Info */}
            <div className="h-full overflow-y-auto border-l dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              {selectedConv ? (
                <ConversationInfo conversation={selectedConv} />
              ) : (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  اختر محادثة لعرض التفاصيل
                </div>
              )}
            </div>
          </div>

          {/* Mobile */}
          <div className="lg:hidden h-full flex flex-col">
            {mobileShowChat && selectedConversation ? (
              <>
                <ChatAreaHeader selectedConv={selectedConv} onBackToList={handleBackToList} />
                <div className="flex-1 overflow-hidden">
                  <ChatWindow conversationId={selectedConversation} lastMessageAt={selectedConv?.lastMessageAt} onConversationUpdate={handleConversationUpdate} />
                </div>
              </>
            ) : (
              <ConversationsList {...listProps} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
