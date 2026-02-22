import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Send, Search, Plus, FileText, Clock, CheckCheck, User, Phone, Settings, Smartphone, Wifi, WifiOff, Loader2 as LoaderIcon } from "lucide-react";
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
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);

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
      refetchInterval: 5000, // Poll every 5 seconds
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

  const sendNewMessageMutation = trpc.whatsapp.messages.send.useMutation({
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

  // Filter conversations based on search
  const filteredConversations = conversations?.filter((conv: any) =>
    conv.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.phoneNumber?.includes(searchQuery)
  );

  // Get selected conversation details
  const selectedConv = conversations?.find((c: any) => c.id === selectedConversation);

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

    // Create or get conversation first, then send message
    // For now, we'll need to handle this differently
    toast.error("يرجى اختيار محادثة موجودة أو إنشاء محادثة جديدة أولاً");
  };

  const handleUseTemplate = (templateContent: string) => {
    // Auto-fill variables from conversation data
    let filledContent = templateContent;
    
    if (selectedConv) {
      // Replace {name} with customer name
      if (selectedConv.customerName) {
        filledContent = filledContent.replaceAll("{name}", selectedConv.customerName);
      }
      
      // Replace {phone} with customer phone
      if (selectedConv.phoneNumber) {
        filledContent = filledContent.replaceAll("{phone}", selectedConv.phoneNumber);
      }
      
      // Replace {date} with today's date
      const today = new Date().toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      filledContent = filledContent.replaceAll("{date}", today);
      
      // Replace {time} with current time
      const now = new Date().toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
      });
      filledContent = filledContent.replaceAll("{time}", now);
    }
    
    setMessageText(filledContent);
    toast.success("تم تطبيق القالب مع ملء المتغيرات تلقائياً");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-green-500" />;
      case "failed":
        return <span className="text-red-500 text-xs">فشل</span>;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50" dir="rtl">
      <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 sm:p-3 rounded-xl shadow-lg">
              <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">إدارة محادثات واتساب</h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">تواصل مع العملاء عبر واتساب بيزنس</p>
            </div>
            <div className="flex gap-1 sm:gap-2 items-center flex-shrink-0">
              {/* Connection Status Badge */}
              {statusLoading ? (
                <Badge variant="secondary" className="gap-1">
                  <LoaderIcon className="h-3 w-3 animate-spin" />
                  جاري التحقق...
                </Badge>
              ) : connectionStatus?.isReady ? (
                <Badge className="bg-green-500 hover:bg-green-600 gap-1">
                  <Wifi className="h-3 w-3" />
                  متصل
                </Badge>
              ) : connectionStatus?.isConnecting ? (
                <Badge variant="secondary" className="gap-1">
                  <LoaderIcon className="h-3 w-3 animate-spin" />
                  جاري الاتصال...
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <WifiOff className="h-3 w-3" />
                  غير متصل
                </Badge>
              )}
              
              <Link href="/dashboard/whatsapp/connection">
                <Button variant="outline" size="sm" className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
                  <Smartphone className="h-4 w-4" />
                  <span className="hidden sm:inline">الاتصال</span>
                </Button>
              </Link>
              <Link href="/dashboard/whatsapp/templates">
                <Button variant="outline" size="sm" className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">القوالب</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
          {/* Conversations List */}
          <Card className="lg:col-span-1 shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-xl">المحادثات</CardTitle>
                <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="secondary" className="gap-2">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">رسالة جديدة</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent dir="rtl">
                    <DialogHeader>
                      <DialogTitle>إرسال رسالة جديدة</DialogTitle>
                      <DialogDescription>
                        أرسل رسالة واتساب إلى عميل جديد
                      </DialogDescription>
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
                        className="gap-2"
                      >
                        <Send className="h-4 w-4" />
                        {sendNewMessageMutation.isPending ? "جاري الإرسال..." : "إرسال"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="relative mt-4">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="ابحث عن محادثة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 bg-white/90 dark:bg-gray-800/90"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-300px)]">
                {conversationsLoading ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">جاري التحميل...</div>
                ) : filteredConversations && filteredConversations.length > 0 ? (
                  <div className="divide-y">
                    {filteredConversations.map((conv: any, index: number) => (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        style={{
                          opacity: 0,
                          animation: `row-enter 0.35s ease-out ${Math.min(index * 60, 600)}ms forwards`,
                        }}
                        className={`p-4 cursor-pointer transition-colors hover:bg-green-50 dark:hover:bg-green-900/20 ${
                          selectedConversation === conv.id ? "bg-green-100 dark:bg-green-900/30 border-r-4 border-green-600" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-full">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {conv.customerName || "عميل جديد"}
                              </h3>
                              {conv.unreadCount > 0 && (
                                <Badge variant="destructive" className="rounded-full px-2 badge-pulse">
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                              <Phone className="h-3 w-3" />
                              <span dir="ltr">{conv.phoneNumber}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {conv.lastMessageAt
                                ? formatDistanceToNow(new Date(conv.lastMessageAt), {
                                    addSuffix: true,
                                    locale: ar,
                                  })
                                : "لا توجد رسائل"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p>لا توجد محادثات</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 shadow-lg border-0">
            {selectedConversation ? (
              <>
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {selectedConv?.customerName || "عميل جديد"}
                      </CardTitle>
                      <CardDescription className="text-white/80" dir="ltr">
                        {selectedConv?.phoneNumber}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-[calc(100vh-300px)]">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {messagesLoading ? (
                      <div className="text-center text-gray-500 dark:text-gray-400">جاري تحميل الرسائل...</div>
                    ) : messages && messages.length > 0 ? (
                      <div className="space-y-4">
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
                              className={`max-w-[70%] rounded-lg p-3 ${
                                msg.direction === "outbound"
                                  ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              <div
                                className={`flex items-center gap-1 mt-1 text-xs ${
                                  msg.direction === "outbound" ? "text-white/80" : "text-gray-500 dark:text-gray-400"
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
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <p>لا توجد رسائل في هذه المحادثة</p>
                      </div>
                    )}
                  </ScrollArea>

                  {/* Templates Quick Access */}
                  {templates && templates.length > 0 && (
                    <div className="border-t dark:border-gray-700 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-semibold text-purple-900 dark:text-purple-300">ردود سريعة (قوالب):</span>
                        </div>
                        <Link href="/dashboard/whatsapp/templates">
                          <Button size="sm" variant="ghost" className="text-xs text-purple-600 hover:text-purple-700">
                            عرض الكل
                          </Button>
                        </Link>
                      </div>
                      <ScrollArea className="max-h-24">
                        <div className="flex flex-wrap gap-2">
                          {templates.map((template: any) => (
                            <Button
                              key={template.id}
                              size="sm"
                              variant="outline"
                              onClick={() => handleUseTemplate(template.content)}
                              className="text-xs bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-700 hover:border-purple-300"
                            >
                              <FileText className="h-3 w-3 ml-1" />
                              {template.name}
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="mt-2 text-xs text-purple-700 dark:text-purple-300 bg-purple-100/50 dark:bg-purple-900/30 p-2 rounded">
                        💡 سيتم ملء المتغيرات ({'{'}name{'}'}, {'{'}date{'}'}, {'{'}time{'}'}) تلقائياً
                      </div>
                    </div>
                  )}

                  {/* Message Input */}
                  <div className="border-t dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
                    <div className="flex gap-2">
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
                        rows={2}
                        className="flex-1 resize-none"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sendMessageMutation.isPending}
                        className="bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-[calc(100vh-200px)]">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p className="text-lg">اختر محادثة لبدء المراسلة</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
