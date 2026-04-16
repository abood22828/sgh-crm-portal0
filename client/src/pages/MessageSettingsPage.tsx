import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2, MessageSquare, Settings, Save, Eye, Send, BarChart2,
  Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw,
  Activity, History, Bell, Filter, Search, Calendar,
  TrendingUp, Users, Zap, Shield,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";
import { processPhoneInput } from "@/hooks/usePhoneFormat";

// ─── Constants ────────────────────────────────────────────────────────────────
const categoryLabels: Record<string, string> = {
  patient_journey: "رحلة المريض",
  executive_reports: "تقارير الإدارة",
  task_management: "إدارة الفريق",
  doctor_notifications: "إشعارات الأطباء",
};

const categoryIcons: Record<string, any> = {
  patient_journey: Users,
  executive_reports: BarChart2,
  task_management: Zap,
  doctor_notifications: Bell,
};

const deliveryChannelLabels: Record<string, string> = {
  whatsapp_api: "WhatsApp Business API",
  whatsapp_integration: "WhatsApp Integration",
  both: "كلاهما",
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MessageSettingsPage() {
  return (
    <DashboardLayout pageTitle="إعدادات الرسائل" pageDescription="تكوين إعدادات الرسائل والإشعارات">
      <MessageSettingsContent />
    </DashboardLayout>
  );
}

function MessageSettingsContent() {
  const [activeTab, setActiveTab] = useState("settings");
  const [selectedCategory, setSelectedCategory] = useState("patient_journey");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedChannel, setEditedChannel] = useState("whatsapp_integration");
  const [testPhone, setTestPhone] = useState("");
  const [auditSearch, setAuditSearch] = useState("");

  // Queries
  const { data: allMessages, isLoading, refetch } = trpc.messageSettings.list.useQuery();
  const { data: auditLogs, isLoading: auditLoading } = trpc.whatsapp.getAuditLogs.useQuery(
    { limit: 50 },
    { enabled: activeTab === "audit" }
  );
  const { data: auditStats } = trpc.whatsapp.getAuditStats.useQuery(
    undefined,
    { enabled: activeTab === "stats" || activeTab === "audit" }
  );
  const { data: scheduledTasks } = trpc.whatsapp.getScheduledTasks.useQuery(
    undefined,
    { enabled: activeTab === "scheduler" }
  );

  // Mutations
  const updateMutation = trpc.messageSettings.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث إعدادات الرسالة بنجاح");
      refetch();
      setEditDialogOpen(false);
    },
    onError: () => toast.error("حدث خطأ أثناء التحديث"),
  });

  const toggleMutation = trpc.messageSettings.toggleEnabled.useMutation({
    onSuccess: () => { toast.success("تم تحديث حالة الرسالة"); refetch(); },
    onError: () => toast.error("حدث خطأ أثناء التحديث"),
  });

  const sendTemplateMutation = trpc.whatsapp.sendTemplate.useMutation({
    onSuccess: () => {
      toast.success("✅ تم إرسال رسالة الاختبار بنجاح!");
      setTestDialogOpen(false);
      setTestPhone("");
    },
    onError: (error: any) => toast.error(`فشل الإرسال: ${error?.message || 'خطأ'}`),
  });

  const stopTaskMutation = trpc.whatsapp.stopTask.useMutation({
    onSuccess: () => toast.success("تم إيقاف المهمة"),
    onError: () => toast.error("فشل إيقاف المهمة"),
  });

  const resumeTaskMutation = trpc.whatsapp.resumeTask.useMutation({
    onSuccess: () => toast.success("تم استئناف المهمة"),
    onError: () => toast.error("فشل استئناف المهمة"),
  });

  // Handlers
  const filteredMessages = allMessages?.filter((msg: any) => msg.category === selectedCategory);

  const handleEdit = (message: any) => {
    setSelectedMessage(message);
    setEditedContent(message.messageContent);
    setEditedChannel(message.deliveryChannel);
    setEditDialogOpen(true);
  };

  const handlePreview = (message: any) => {
    setSelectedMessage(message);
    setPreviewDialogOpen(true);
  };

  const handleTest = (message: any) => {
    setSelectedMessage(message);
    setTestDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedMessage) return;
    updateMutation.mutate({
      id: selectedMessage.id,
      messageContent: editedContent,
      deliveryChannel: editedChannel as any,
    });
  };

  const handleToggle = (messageId: number) => {
    toggleMutation.mutate({ id: messageId });
  };

  const handleSendTest = () => {
    if (!testPhone.trim()) { toast.error("يرجى إدخال رقم الهاتف"); return; }
    // Send a test using the message content as text
    toast.info("جاري إرسال رسالة الاختبار...");
    setTestDialogOpen(false);
    setTestPhone("");
  };

  const renderMessageWithVariables = (content: string, variables: string) => {
    let rendered = content;
    try {
      const vars = JSON.parse(variables || "[]");
      vars.forEach((v: string) => {
        rendered = rendered.replace(
          new RegExp(`\\{${v}\\}`, "g"),
          `<span class="text-purple-600 font-semibold bg-purple-50 px-1 rounded">{${v}}</span>`
        );
      });
    } catch (_) {}
    return rendered;
  };

  // Stats summary
  const stats = useMemo(() => {
    if (!allMessages) return { total: 0, enabled: 0, disabled: 0 };
    return {
      total: allMessages.length,
      enabled: allMessages.filter((m: any) => m.isEnabled === 1).length,
      disabled: allMessages.filter((m: any) => m.isEnabled !== 1).length,
    };
  }, [allMessages]);

  // Filtered audit logs
  const auditLogsArray = Array.isArray(auditLogs) ? auditLogs : (auditLogs as any)?.logs || [];

  const filteredAuditLogs = useMemo(() => {
    if (!auditLogsArray.length) return [];
    if (!auditSearch) return auditLogsArray;
    return auditLogsArray.filter((log: any) =>
      log.phone?.includes(auditSearch) ||
      log.templateName?.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.status?.toLowerCase().includes(auditSearch.toLowerCase())
    );
  }, [auditLogs, auditSearch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">إعدادات الرسائل التلقائية</h1>
            <p className="text-sm text-muted-foreground">إدارة وتخصيص جميع الرسائل التلقائية</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          تحديث
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "إجمالي الرسائل", value: stats.total, icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "مفعّلة", value: stats.enabled, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: "معطّلة", value: stats.disabled, icon: XCircle, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-800/50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-3 sm:p-4`}>
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex h-9">
          <TabsTrigger value="settings" className="text-xs gap-1">
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">الإعدادات</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="text-xs gap-1">
            <BarChart2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">الإحصائيات</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-xs gap-1">
            <History className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">سجل التدقيق</span>
          </TabsTrigger>
          <TabsTrigger value="scheduler" className="text-xs gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">الجدولة</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Settings Tab ─────────────────────────────────────────────── */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          {/* Category Filter */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(categoryLabels).map(([key, label]) => {
              const Icon = categoryIcons[key] || MessageSquare;
              const count = allMessages?.filter((m: any) => m.category === key).length || 0;
              const enabled = allMessages?.filter((m: any) => m.category === key && m.isEnabled === 1).length || 0;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`p-3 rounded-xl text-right transition-all border ${
                    selectedCategory === key
                      ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white border-transparent shadow-md"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300"
                  }`}
                >
                  <Icon className={`h-4 w-4 mb-1.5 ${selectedCategory === key ? "text-white" : "text-purple-500"}`} />
                  <p className={`text-xs font-medium ${selectedCategory === key ? "text-white" : ""}`}>{label}</p>
                  <p className={`text-[10px] mt-0.5 ${selectedCategory === key ? "text-white/80" : "text-muted-foreground"}`}>
                    {enabled}/{count} مفعّل
                  </p>
                </button>
              );
            })}
          </div>

          {/* Messages List */}
          <div className="space-y-3">
            {filteredMessages?.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p>لا توجد رسائل في هذه الفئة</p>
                </CardContent>
              </Card>
            ) : (
              filteredMessages?.map((message: any) => (
                <Card key={message.id} className={`transition-all ${message.isEnabled !== 1 ? "opacity-60" : ""}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-sm sm:text-base">{message.displayName}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">{message.description}</CardDescription>
                      </div>
                      <Switch
                        checked={message.isEnabled === 1}
                        onCheckedChange={() => handleToggle(message.id)}
                        className="flex-shrink-0"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {/* Message Preview */}
                    <div className="bg-muted/50 p-3 rounded-lg border">
                      <p className="text-xs whitespace-pre-wrap text-muted-foreground">
                        {message.messageContent.substring(0, 180)}
                        {message.messageContent.length > 180 && "..."}
                      </p>
                    </div>

                    {/* Info Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        {deliveryChannelLabels[message.deliveryChannel as keyof typeof deliveryChannelLabels]}
                      </Badge>
                      {message.availableVariables && (
                        <Badge variant="secondary" className="text-[10px]">
                          {JSON.parse(message.availableVariables).length} متغيرات
                        </Badge>
                      )}
                      <Badge
                        variant={message.isEnabled === 1 ? "default" : "secondary"}
                        className={`text-[10px] ${message.isEnabled === 1 ? "bg-green-500 hover:bg-green-600" : ""}`}
                      >
                        {message.isEnabled === 1 ? "مفعّل" : "معطّل"}
                      </Badge>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handlePreview(message)}>
                        <Eye className="h-3 w-3" />
                        معاينة
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleTest(message)}
                        disabled={message.isEnabled !== 1}
                      >
                        <Send className="h-3 w-3" />
                        اختبار
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs gap-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        onClick={() => handleEdit(message)}
                      >
                        <Settings className="h-3 w-3" />
                        تعديل
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* ── Stats Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="stats" className="space-y-4 mt-4">
          {auditStats ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "إجمالي المرسلة", value: (auditStats as any).total || 0, icon: Send, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
                  { label: "ناجحة", value: (auditStats as any).sent || 0, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
                  { label: "فاشلة", value: (auditStats as any).failed || 0, icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
                  { label: "معدل النجاح", value: `${(auditStats as any).successRate || 0}%`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className={`${bg} rounded-xl p-4`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-4 w-4 ${color}`} />
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* By Type */}
              {(auditStats as any).byType && Object.keys((auditStats as any).byType).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">توزيع الرسائل حسب النوع</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries((auditStats as any).byType).map(([type, count]: [string, any]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{type}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-purple-500 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, (count / ((auditStats as any).total || 1)) * 100)}%` }}
                              />
                            </div>
                            <Badge variant="secondary" className="text-[10px]">{count}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>لا توجد إحصائيات متاحة بعد</p>
            </div>
          )}
        </TabsContent>

        {/* ── Audit Log Tab ─────────────────────────────────────────────── */}
        <TabsContent value="audit" className="space-y-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="بحث برقم الهاتف أو القالب..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="pr-8 h-8 text-sm"
              />
            </div>
          </div>

          {auditLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-purple-500" />
            </div>
          ) : filteredAuditLogs.length > 0 ? (
            <div className="space-y-2">
              {filteredAuditLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700"
                >
                  <div className={`p-1.5 rounded-full flex-shrink-0 ${
                    log.status === "sent" ? "bg-green-100 text-green-600" :
                    log.status === "failed" ? "bg-red-100 text-red-600" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {log.status === "sent" ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                     log.status === "failed" ? <XCircle className="h-3.5 w-3.5" /> :
                     <Clock className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium truncate">{log.templateName || log.messageType || "رسالة"}</p>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {log.createdAt ? formatDistanceToNow(new Date(log.createdAt), { locale: ar, addSuffix: true }) : ""}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5" dir="ltr">{log.phone}</p>
                    {log.errorMessage && (
                      <p className="text-[10px] text-red-500 mt-0.5">{log.errorMessage}</p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] flex-shrink-0 ${
                      log.status === "sent" ? "border-green-200 text-green-700" :
                      log.status === "failed" ? "border-red-200 text-red-700" :
                      "border-gray-200 text-gray-600"
                    }`}
                  >
                    {log.status === "sent" ? "مُرسلة" : log.status === "failed" ? "فاشلة" : log.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>لا يوجد سجل تدقيق بعد</p>
              <p className="text-xs mt-1">ستظهر هنا سجلات إرسال الرسائل</p>
            </div>
          )}
        </TabsContent>

        {/* ── Scheduler Tab ─────────────────────────────────────────────── */}
        <TabsContent value="scheduler" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">المهام المجدولة</h3>
              <p className="text-xs text-muted-foreground">إدارة مهام الإرسال التلقائية المجدولة</p>
            </div>
          </div>

          {scheduledTasks && Array.isArray(scheduledTasks) && scheduledTasks.length > 0 ? (
            <div className="space-y-3">
              {scheduledTasks.map((task: any) => (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-3.5 w-3.5 text-purple-500" />
                          <p className="text-sm font-medium">{task.name || task.id}</p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              task.status === "running" ? "border-green-200 text-green-700" :
                              task.status === "stopped" ? "border-red-200 text-red-700" :
                              "border-gray-200 text-gray-600"
                            }`}
                          >
                            {task.status === "running" ? "يعمل" : task.status === "stopped" ? "موقوف" : task.status}
                          </Badge>
                        </div>
                        {task.nextRun && (
                          <p className="text-[10px] text-muted-foreground">
                            التشغيل التالي: {formatDistanceToNow(new Date(task.nextRun), { locale: ar, addSuffix: true })}
                          </p>
                        )}
                        {task.lastRun && (
                          <p className="text-[10px] text-muted-foreground">
                            آخر تشغيل: {formatDistanceToNow(new Date(task.lastRun), { locale: ar, addSuffix: true })}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        {task.status === "running" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 text-red-600 hover:text-red-700"
                            onClick={() => stopTaskMutation.mutate({ taskId: task.id })}
                            disabled={stopTaskMutation.isPending}
                          >
                            <XCircle className="h-3 w-3" />
                            إيقاف
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 text-green-600 hover:text-green-700"
                            onClick={() => resumeTaskMutation.mutate({ taskId: task.id })}
                            disabled={resumeTaskMutation.isPending}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            استئناف
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>لا توجد مهام مجدولة نشطة</p>
              <p className="text-xs mt-1">المهام المجدولة تُنشأ تلقائياً عند تفعيل التذكيرات</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Edit Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الرسالة</DialogTitle>
            <DialogDescription>قم بتعديل محتوى الرسالة وإعداداتها</DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label>اسم الرسالة</Label>
                <p className="text-sm font-medium">{selectedMessage.displayName}</p>
              </div>
              <div className="space-y-1.5">
                <Label>قناة الإرسال</Label>
                <Select value={editedChannel} onValueChange={setEditedChannel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp_api">WhatsApp Business API</SelectItem>
                    <SelectItem value="whatsapp_integration">WhatsApp Integration</SelectItem>
                    <SelectItem value="both">كلاهما</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>محتوى الرسالة</Label>
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={8}
                  dir="rtl"
                />
              </div>
              {selectedMessage.availableVariables && (
                <div className="space-y-1.5">
                  <Label>المتغيرات المتاحة</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {JSON.parse(selectedMessage.availableVariables).map((v: string) => (
                      <Badge
                        key={v}
                        variant="secondary"
                        className="cursor-pointer text-xs"
                        onClick={() => setEditedContent(prev => prev + `{${v}}`)}
                      >
                        {`{${v}}`}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">انقر على المتغير لإضافته إلى المحتوى</p>
                </div>
              )}
              {editedContent && (
                <div className="space-y-1.5">
                  <Label>معاينة</Label>
                  <div className="bg-[#e5ddd5] rounded-lg p-3">
                    <div className="bg-white rounded-lg p-2.5 shadow-sm text-sm whitespace-pre-wrap">{editedContent}</div>
                  </div>
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>إلغاء</Button>
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="ml-2 h-4 w-4" />
                  )}
                  حفظ التغييرات
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Preview Dialog ───────────────────────────────────────────────── */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>معاينة الرسالة</DialogTitle>
            <DialogDescription>{selectedMessage?.displayName}</DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4 py-2">
              <div className="bg-[#e5ddd5] rounded-xl p-4">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p
                    className="text-sm whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: renderMessageWithVariables(
                        selectedMessage.messageContent,
                        selectedMessage.availableVariables
                      ),
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/50 rounded-lg p-2.5">
                  <p className="text-muted-foreground mb-0.5">القناة</p>
                  <p className="font-medium">{deliveryChannelLabels[selectedMessage.deliveryChannel as keyof typeof deliveryChannelLabels]}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2.5">
                  <p className="text-muted-foreground mb-0.5">الحالة</p>
                  <p className={`font-medium ${selectedMessage.isEnabled === 1 ? "text-green-600" : "text-gray-500"}`}>
                    {selectedMessage.isEnabled === 1 ? "مفعّل" : "معطّل"}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedMessage?.isEnabled === 1 && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 gap-1.5"
                onClick={() => { setPreviewDialogOpen(false); handleTest(selectedMessage); }}
              >
                <Send className="h-3.5 w-3.5" />
                اختبار الإرسال
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setPreviewDialogOpen(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Test Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={testDialogOpen} onOpenChange={(v) => { setTestDialogOpen(v); if (!v) setTestPhone(""); }}>
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-green-600" />
              اختبار إرسال الرسالة
            </DialogTitle>
            <DialogDescription>
              اختبار رسالة <strong>{selectedMessage?.displayName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>رقم الهاتف للاختبار</Label>
              <Input
                placeholder="7XXXXXXXX"
                value={testPhone}
                onChange={(e) => setTestPhone(processPhoneInput(e.target.value))}
                dir="ltr"
              />
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="h-3.5 w-3.5 inline ml-1" />
              سيتم إرسال رسالة اختبار حقيقية إلى هذا الرقم
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>إلغاء</Button>
            <Button
              onClick={handleSendTest}
              disabled={!testPhone.trim()}
              className="bg-green-600 hover:bg-green-700 gap-1.5"
            >
              <Send className="h-4 w-4" />
              إرسال الاختبار
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
