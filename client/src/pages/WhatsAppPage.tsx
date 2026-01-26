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
import { MessageCircle, Send, Search, Plus, FileText, Clock, CheckCheck, User, Phone, Settings } from "lucide-react";
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
    setMessageText(templateContent);
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
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">إدارة محادثات واتساب</h1>
              <p className="text-gray-600">تواصل مع العملاء عبر واتساب بيزنس</p>
            </div>
            <Link href="/dashboard/whatsapp/templates">
              <Button variant="outline" className="gap-2">
                <FileText className="h-5 w-5" />
                إدارة القوالب
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="lg:col-span-1 shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">المحادثات</CardTitle>
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
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ابحث عن محادثة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 bg-white/90"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-300px)]">
                {conversationsLoading ? (
                  <div className="p-4 text-center text-gray-500">جاري التحميل...</div>
                ) : filteredConversations && filteredConversations.length > 0 ? (
                  <div className="divide-y">
                    {filteredConversations.map((conv: any) => (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        className={`p-4 cursor-pointer transition-colors hover:bg-green-50 ${
                          selectedConversation === conv.id ? "bg-green-100 border-r-4 border-green-600" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-full">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {conv.customerName || "عميل جديد"}
                              </h3>
                              {conv.unreadCount > 0 && (
                                <Badge variant="destructive" className="rounded-full px-2">
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <Phone className="h-3 w-3" />
                              <span dir="ltr">{conv.phoneNumber}</span>
                            </div>
                            <p className="text-xs text-gray-500">
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
                  <div className="p-8 text-center text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
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
                      <div className="text-center text-gray-500">جاري تحميل الرسائل...</div>
                    ) : messages && messages.length > 0 ? (
                      <div className="space-y-4">
                        {messages.map((msg: any) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.direction === "outbound" ? "justify-start" : "justify-end"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                msg.direction === "outbound"
                                  ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              <div
                                className={`flex items-center gap-1 mt-1 text-xs ${
                                  msg.direction === "outbound" ? "text-white/80" : "text-gray-500"
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
                      <div className="text-center text-gray-500 py-8">
                        <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>لا توجد رسائل في هذه المحادثة</p>
                      </div>
                    )}
                  </ScrollArea>

                  {/* Templates Quick Access */}
                  {templates && templates.length > 0 && (
                    <div className="border-t p-3 bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">قوالب سريعة:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {templates.slice(0, 3).map((template: any) => (
                          <Button
                            key={template.id}
                            size="sm"
                            variant="outline"
                            onClick={() => handleUseTemplate(template.content)}
                            className="text-xs"
                          >
                            {template.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message Input */}
                  <div className="border-t p-4 bg-white">
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
                <div className="text-center text-gray-500">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
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
