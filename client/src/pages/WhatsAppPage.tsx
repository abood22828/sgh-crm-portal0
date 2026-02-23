import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MessageCircle, Send, Search, Plus, FileText, Clock, CheckCheck, User, Phone, Smartphone, Wifi, WifiOff, Loader2 as LoaderIcon, ArrowRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "wouter";

export default function WhatsAppPage() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessagePhone, setNewMessagePhone] = useState("");
  const [newMessageText, setNewMessageText] = useState("");
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  // Mobile: show chat view when a conversation is selected
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: conversations, isLoading: conversationsLoading, refetch: refetchConversations } = 
    trpc.whatsapp.conversations.list.useQuery();
  
  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = 
    trpc.whatsapp.messages.listByConversation.useQuery(
      { conversationId: selectedConversation! },
      { enabled: selectedConversation !== null }
    );

  const { data: templates } = trpc.whatsapp.templates.list.useQuery();

  // WhatsApp connection status
  const { data: connectionStatus, isLoading: statusLoading } = 
    trpc.whatsapp.connection.status.useQuery(undefined, {
      refetchInterval: 5000,
    });

  // Mutations
  const sendMessageMutation = trpc.whatsapp.messages.send.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال الرسالة بنجاح");
      setMessageText("");
      refetchMessages();
      refetchConversations();
    },
    onError: (error) => {
      toast.error(`فشل إرسال الرسالة: ${error.message}`);
    },
  });

  const sendNewMessageMutation = trpc.whatsapp.messages.sendDirect.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال الرسالة بنجاح");
      setNewMessagePhone("");
      setNewMessageText("");
      setIsNewMessageOpen(false);
      refetchConversations();
    },
    onError: (error) => {
      toast.error(`فشل إرسال الرسالة: ${error.message}`);
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filter conversations based on search
  const filteredConversations = conversations?.filter((conv: any) =>
    conv.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.phoneNumber?.includes(searchQuery)
  );

  // Get selected conversation details
  const selectedConv = conversations?.find((c: any) => c.id === selectedConversation);

  const handleSelectConversation = (id: number) => {
    setSelectedConversation(id);
    setMobileShowChat(true);
  };

  const handleBackToList = () => {
    setMobileShowChat(false);
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;
    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: messageText.trim(),
    });
  };

  const handleSendNewMessage = () => {
    if (!newMessagePhone.trim() || !newMessageText.trim()) {
      toast.error("يرجى إدخال رقم الهاتف ونص الرسالة");
      return;
    }
    sendNewMessageMutation.mutate({
      phone: newMessagePhone.trim(),
      content: newMessageText.trim(),
    });
  };

  const handleUseTemplate = (templateContent: string) => {
    let filledContent = templateContent;
    if (selectedConv) {
      if (selectedConv.customerName) {
        filledContent = filledContent.replaceAll("{name}", selectedConv.customerName);
      }
      if (selectedConv.phoneNumber) {
        filledContent = filledContent.replaceAll("{phone}", selectedConv.phoneNumber);
      }
      const today = new Date().toLocaleDateString("ar-EG", {
        year: "numeric", month: "long", day: "numeric",
      });
      filledContent = filledContent.replaceAll("{date}", today);
      const now = new Date().toLocaleTimeString("ar-EG", {
        hour: "2-digit", minute: "2-digit",
      });
      filledContent = filledContent.replaceAll("{time}", now);
    }
    setMessageText(filledContent);
    toast.success("تم تطبيق القالب مع ملء المتغيرات تلقائياً");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-green-500" />;
      case "failed":
        return <span className="text-red-500 text-xs">فشل</span>;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  // ─── Conversations List Panel ───
  const ConversationsList = () => (
    <div className="flex flex-col h-full">
      {/* Conversations Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 sm:p-4 rounded-t-lg">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-bold">المحادثات</h2>
          <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary" className="gap-1.5 h-8 text-xs sm:text-sm">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">جديدة</span>
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="w-[calc(100vw-2rem)] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>إرسال رسالة جديدة</DialogTitle>
                <DialogDescription>أرسل رسالة واتساب إلى عميل جديد</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    placeholder="967734000018"
                    value={newMessagePhone}
                    onChange={(e) => setNewMessagePhone(e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label htmlFor="message">نص الرسالة</Label>
                  <Textarea
                    id="message"
                    placeholder="اكتب رسالتك هنا..."
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleSendNewMessage}
                  disabled={sendNewMessageMutation.isPending}
                  className="gap-2 w-full sm:w-auto"
                >
                  <Send className="h-4 w-4" />
                  {sendNewMessageMutation.isPending ? "جاري الإرسال..." : "إرسال"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن محادثة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-white/90 dark:bg-gray-800/90 h-9 text-sm"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {conversationsLoading ? (
          <div className="p-6 text-center text-muted-foreground">
            <LoaderIcon className="h-6 w-6 animate-spin mx-auto mb-2" />
            جاري التحميل...
          </div>
        ) : filteredConversations && filteredConversations.length > 0 ? (
          <div className="divide-y">
            {filteredConversations.map((conv: any, index: number) => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                style={{
                  opacity: 0,
                  animation: `row-enter 0.35s ease-out ${Math.min(index * 60, 600)}ms forwards`,
                }}
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
                        <Badge variant="destructive" className="rounded-full px-1.5 text-[10px] sm:text-xs h-5 sm:h-auto badge-pulse flex-shrink-0 mr-1">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground mb-0.5">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span dir="ltr" className="truncate">{conv.phoneNumber}</span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {conv.lastMessageAt
                        ? formatDistanceToNow(new Date(conv.lastMessageAt), {
                            addSuffix: true,
                            locale: ar,
                          })
                        : "لا توجد رسائل"}
                    </p>
                  </div>
                  {/* Arrow for mobile */}
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
      </ScrollArea>
    </div>
  );

  // ─── Chat Area Panel ───
  const ChatArea = () => (
    <div className="flex flex-col h-full">
      {selectedConversation ? (
        <>
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 sm:p-4 rounded-t-lg lg:rounded-tr-lg lg:rounded-tl-none">
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Back button for mobile */}
              <button
                onClick={handleBackToList}
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
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-[#e5ddd5] dark:bg-gray-900/50" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}>
            {messagesLoading ? (
              <div className="text-center text-muted-foreground py-8">
                <LoaderIcon className="h-6 w-6 animate-spin mx-auto mb-2" />
                جاري تحميل الرسائل...
              </div>
            ) : messages && messages.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {messages.map((msg: any, index: number) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === "outbound" ? "justify-start" : "justify-end"}`}
                    style={{
                      opacity: 0,
                      animation: `row-enter 0.3s ease-out ${Math.min(index * 50, 500)}ms forwards`,
                    }}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-lg p-2.5 sm:p-3 shadow-sm ${
                        msg.direction === "outbound"
                          ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-bl-none"
                          : "bg-white dark:bg-gray-800 text-foreground rounded-br-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed">{msg.content}</p>
                      <div
                        className={`flex items-center gap-1 mt-1 text-[10px] sm:text-xs ${
                          msg.direction === "outbound" ? "text-white/70" : "text-muted-foreground"
                        }`}
                      >
                        <span>
                          {new Date(msg.sentAt).toLocaleTimeString("ar-EG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {msg.direction === "outbound" && getStatusIcon(msg.status)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <MessageCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm sm:text-base">لا توجد رسائل في هذه المحادثة</p>
              </div>
            )}
          </div>

          {/* Templates Quick Access */}
          {templates && templates.length > 0 && (
            <div className="border-t dark:border-gray-700 px-3 py-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-900 dark:text-purple-300">ردود سريعة:</span>
                </div>
                <Link href="/dashboard/whatsapp/templates">
                  <Button size="sm" variant="ghost" className="text-[10px] sm:text-xs text-purple-600 hover:text-purple-700 h-6 px-2">
                    عرض الكل
                  </Button>
                </Link>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {templates.map((template: any) => (
                  <Button
                    key={template.id}
                    size="sm"
                    variant="outline"
                    onClick={() => handleUseTemplate(template.content)}
                    className="text-[10px] sm:text-xs bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-700 hover:border-purple-300 h-7 px-2 flex-shrink-0 whitespace-nowrap"
                  >
                    <FileText className="h-3 w-3 ml-1" />
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="border-t dark:border-gray-700 p-2.5 sm:p-3 bg-white dark:bg-gray-900">
            <div className="flex gap-2 items-end">
              <Textarea
                placeholder="اكتب رسالتك هنا..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                className="flex-1 resize-none min-h-[40px] max-h-[120px] text-sm sm:text-base"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!messageText.trim() || sendMessageMutation.isPending}
                size="icon"
                className="bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 h-10 w-10 flex-shrink-0"
              >
                {sendMessageMutation.isPending ? (
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900/30 rounded-lg">
          <div className="text-center text-muted-foreground p-8">
            <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <MessageCircle className="h-12 w-12 text-green-500" />
            </div>
            <p className="text-lg font-medium mb-1">إدارة محادثات واتساب</p>
            <p className="text-sm">اختر محادثة من القائمة لبدء المراسلة</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" dir="rtl">
      <div className="container mx-auto p-2 sm:p-4 md:p-6 max-w-7xl">
        {/* Header */}
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
              {/* Connection Status Badge */}
              {statusLoading ? (
                <Badge variant="secondary" className="gap-1 text-[10px] sm:text-xs h-6 sm:h-auto">
                  <LoaderIcon className="h-3 w-3 animate-spin" />
                  <span className="hidden sm:inline">جاري التحقق...</span>
                </Badge>
              ) : connectionStatus?.isReady ? (
                <Badge className="bg-green-500 hover:bg-green-600 gap-1 text-[10px] sm:text-xs h-6 sm:h-auto">
                  <Wifi className="h-3 w-3" />
                  <span>متصل</span>
                </Badge>
              ) : connectionStatus?.isConnecting ? (
                <Badge variant="secondary" className="gap-1 text-[10px] sm:text-xs h-6 sm:h-auto">
                  <LoaderIcon className="h-3 w-3 animate-spin" />
                  <span className="hidden sm:inline">جاري الاتصال...</span>
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1 text-[10px] sm:text-xs h-6 sm:h-auto">
                  <WifiOff className="h-3 w-3" />
                  <span className="hidden xs:inline">غير متصل</span>
                </Badge>
              )}
              
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
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden border dark:border-gray-800" style={{ height: "calc(100vh - 140px)", minHeight: "400px" }}>
          {/* Desktop: side-by-side layout */}
          <div className="hidden lg:grid lg:grid-cols-[340px_1fr] h-full">
            <div className="border-l dark:border-gray-800 h-full overflow-hidden">
              <ConversationsList />
            </div>
            <div className="h-full overflow-hidden">
              <ChatArea />
            </div>
          </div>

          {/* Mobile: toggle between conversations and chat */}
          <div className="lg:hidden h-full">
            {mobileShowChat && selectedConversation ? (
              <ChatArea />
            ) : (
              <ConversationsList />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
