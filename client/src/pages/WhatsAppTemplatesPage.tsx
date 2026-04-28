import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  FileText, Plus, Edit, Trash2, Copy, RefreshCw, Send, Eye,
  CheckCircle2, Clock, AlertCircle, XCircle, Search, Filter,
  BarChart2, MessageSquare, Smartphone, Globe, Loader2, Star,
  ChevronDown, ChevronUp, Info, Check, X, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { processPhoneInput } from "@/hooks/usePhoneFormat";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Template {
  id: number;
  name: string;
  content: string;
  category: string;
  variables?: string | null;
  isActive: number;
  metaName?: string | null;
  metaStatus?: string | null;
  languageCode?: string | null;
  headerType?: string | null;
  headerContent?: string | null;
  headerText?: string | null;
  footerContent?: string | null;
  footerText?: string | null;
  buttons?: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <Badge variant="outline" className="text-[10px] gap-1"><Clock className="h-2.5 w-2.5" />غير محدد</Badge>;
  const map: Record<string, { label: string; icon: any; className: string }> = {
    APPROVED: { label: "معتمد", icon: CheckCircle2, className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400" },
    PENDING: { label: "قيد المراجعة", icon: Clock, className: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400" },
    REJECTED: { label: "مرفوض", icon: XCircle, className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400" },
    PAUSED: { label: "موقوف", icon: AlertCircle, className: "bg-orange-100 text-orange-700 border-orange-200" },
    DISABLED: { label: "معطّل", icon: X, className: "bg-gray-100 text-gray-600 border-gray-200" },
  };
  const cfg = map[status] || { label: status, icon: Info, className: "bg-gray-100 text-gray-600" };
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`text-[10px] gap-1 ${cfg.className}`}>
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </Badge>
  );
}

// ─── القوالب المستخدمة في الرسائل التلقائية ─────────────────────────────────
const AUTO_TEMPLATES: Record<string, string> = {
  appointment_confirmation: "تأكيد الموعد تلقائياً",
  appointment_reminder: "تذكير 24ساعة / 1ساعة تلقائياً",
  missed_appointment: "موعد فائت (يدوي)",
};

// ─── Usage Badge ──────────────────────────────────────────────────────────────
function UsageBadge({ metaName }: { metaName?: string | null }) {
  if (!metaName || !AUTO_TEMPLATES[metaName]) return null;
  return (
    <Badge variant="outline" className="text-[10px] gap-1 bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300">
      <Zap className="h-2.5 w-2.5" />
      {AUTO_TEMPLATES[metaName]}
    </Badge>
  );
}

// ─── Category Badge ───────────────────────────────────────────────────────────
function CategoryBadge({ category }: { category: string }) {
  const map: Record<string, { label: string; color: string }> = {
    confirmation: { label: "تأكيد", color: "bg-blue-100 text-blue-700 border-blue-200" },
    reminder: { label: "تذكير", color: "bg-purple-100 text-purple-700 border-purple-200" },
    followup: { label: "متابعة", color: "bg-teal-100 text-teal-700 border-teal-200" },
    thank_you: { label: "شكر", color: "bg-pink-100 text-pink-700 border-pink-200" },
    welcome: { label: "ترحيب", color: "bg-green-100 text-green-700 border-green-200" },
    cancellation: { label: "إلغاء", color: "bg-red-100 text-red-700 border-red-200" },
    update: { label: "تحديث", color: "bg-orange-100 text-orange-700 border-orange-200" },
    custom: { label: "مخصص", color: "bg-gray-100 text-gray-700 border-gray-200" },
    UTILITY: { label: "خدمات", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
    MARKETING: { label: "تسويق", color: "bg-violet-100 text-violet-700 border-violet-200" },
    AUTHENTICATION: { label: "مصادقة", color: "bg-amber-100 text-amber-700 border-amber-200" },
  };
  const cfg = map[category] || { label: category, color: "bg-gray-100 text-gray-600" };
  return <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>;
}

// ─── WhatsApp Message Preview ─────────────────────────────────────────────────
function WhatsAppPreview({ template }: { template: Template }) {
  const vars = template.variables ? JSON.parse(template.variables) : [];
  let preview = template.content;
  vars.forEach((v: string, i: number) => {
    preview = preview.replace(`{{${i + 1}}}`, `[${v}]`);
  });

  const buttons = template.buttons ? JSON.parse(template.buttons) : [];

  return (
    <div className="bg-[#e5ddd5] dark:bg-gray-800 rounded-xl p-3 max-w-xs mx-auto">
      <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm relative">
        {(template.headerContent || template.headerText) && (
          <div className="font-semibold text-sm mb-2 pb-2 border-b">{template.headerContent || template.headerText}</div>
        )}
        <p className="text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-100">{preview}</p>
        {(template.footerContent || template.footerText) && (
          <p className="text-[10px] text-gray-400 mt-2 pt-2 border-t">{template.footerContent || template.footerText}</p>
        )}
        {buttons.length > 0 && (
          <div className="mt-3 space-y-2">
            {buttons.map((button: any, index: number) => (
              <button
                key={index}
                className={`w-full py-2 px-3 rounded-lg text-xs font-medium ${
                  button.type === 'QUICK_REPLY' || button.type === 'quick_reply'
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {button.text}
              </button>
            ))}
          </div>
        )}
        <div className="flex justify-end mt-1">
          <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
            الآن <CheckCircle2 className="h-2.5 w-2.5 text-blue-500" />
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Template Card ────────────────────────────────────────────────────────────
function TemplateCard({
  template,
  onEdit,
  onDelete,
  onTest,
  onCopy,
  onPreview,
}: {
  template: Template;
  onEdit: (t: Template) => void;
  onDelete: (id: number) => void;
  onTest: (t: Template) => void;
  onCopy: (t: Template) => void;
  onPreview: (t: Template) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const vars = template.variables ? JSON.parse(template.variables) : [];

  return (
    <Card className="group hover:shadow-md transition-shadow border dark:border-gray-800">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold truncate">{template.name}</CardTitle>
            {template.metaName && template.metaName !== template.name && (
              <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{template.metaName}</p>
            )}
          </div>
          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          <StatusBadge status={template.metaStatus} />
          <CategoryBadge category={template.category} />
          <UsageBadge metaName={template.metaName} />
          {template.languageCode && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <Globe className="h-2.5 w-2.5" />
              {template.languageCode}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Content Preview */}
        <div
          className={`text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5 cursor-pointer ${expanded ? "" : "line-clamp-3"}`}
          onClick={() => setExpanded(!expanded)}
        >
          {template.content}
          {!expanded && template.content.length > 120 && (
            <span className="text-green-600 ml-1">...عرض المزيد</span>
          )}
        </div>

        {/* Variables */}
        {vars.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {vars.map((v: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-[10px] font-mono">
                {`{{${i + 1}}}`} = {v}
              </Badge>
            ))}
          </div>
        )}

        {/* Time */}
        <p className="text-[10px] text-muted-foreground">
          أُنشئ {formatDistanceToNow(new Date(template.createdAt), { locale: ar, addSuffix: true })}
        </p>

        {/* Actions */}
        <div className="flex gap-1.5 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-7 text-[10px] gap-1"
            onClick={() => onPreview(template)}
          >
            <Eye className="h-3 w-3" />
            معاينة
          </Button>
          {template.metaStatus === "APPROVED" && (
            <Button
              size="sm"
              className="flex-1 h-7 text-[10px] gap-1 bg-green-600 hover:bg-green-700"
              onClick={() => onTest(template)}
            >
              <Send className="h-3 w-3" />
              اختبار
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0"
            onClick={() => onCopy(template)}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0"
            onClick={() => onEdit(template)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => onDelete(template.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WhatsAppTemplatesPage() {
  return (
    <DashboardLayout pageTitle="قوالب واتساب" pageDescription="إدارة قوالب رسائل واتساب">
      <WhatsAppTemplatesContent />
    </DashboardLayout>
  );
}

function WhatsAppTemplatesContent() {
  // State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // Form state
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("UTILITY");
  const [language, setLanguage] = useState("ar");
  const [testPhone, setTestPhone] = useState("");

  // Queries
  const { data: templates, isLoading, refetch } = trpc.whatsapp.templates.list.useQuery();

  // Mutations
  const syncFromMetaMutation = trpc.whatsapp.templates.syncFromMeta.useMutation({
    onSuccess: (result: any) => {
      toast.success(result.message || `تمت المزامنة: ${result.synced} قالب جديد`);
      refetch();
    },
    onError: (error: any) => toast.error(`فشل المزامنة: ${error?.message || 'خطأ'}`),
  });

  const createMutation = trpc.whatsapp.templates.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء القالب بنجاح");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    },
    onError: (error: any) => toast.error(`فشل إنشاء القالب: ${error?.message || 'خطأ'}`),
  });

  const updateMutation = trpc.whatsapp.templates.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث القالب بنجاح");
      setIsEditOpen(false);
      resetForm();
      refetch();
    },
    onError: (error: any) => toast.error(`فشل تحديث القالب: ${error?.message || 'خطأ'}`),
  });

  const deleteMutation = trpc.whatsapp.templates.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف القالب");
      refetch();
    },
    onError: (error: any) => toast.error(`فشل الحذف: ${error?.message || 'خطأ'}`),
  });

  const sendTemplateMutation = trpc.whatsapp.sendTemplate.useMutation({
    onSuccess: () => {
      toast.success("✅ تم إرسال القالب بنجاح! تحقق من هاتفك.");
      setIsTestOpen(false);
      setTestPhone("");
    },
    onError: (error: any) => toast.error(`فشل الإرسال: ${error?.message || 'خطأ'}`),
  });

  const resetForm = () => {
    setName(""); setContent(""); setCategory("UTILITY"); setLanguage("ar");
    setSelectedTemplate(null);
  };

  const handleCreate = () => {
    if (!name.trim() || !content.trim()) { toast.error("يرجى إدخال اسم القالب والمحتوى"); return; }
    createMutation.mutate({ name: name.trim(), content: content.trim(), category, language });
  };

  const handleUpdate = () => {
    if (!selectedTemplate) return;
    updateMutation.mutate({ id: selectedTemplate.id, name: name.trim(), content: content.trim(), category });
  };

  const handleEdit = (t: Template) => {
    setSelectedTemplate(t);
    setName(t.name); setContent(t.content); setCategory(t.category);
    setIsEditOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا القالب؟")) {
      deleteMutation.mutate({ id });
    }
  };

  const handlePreview = (t: Template) => {
    setSelectedTemplate(t);
    setIsPreviewOpen(true);
  };

  const handleTest = (t: Template) => {
    setSelectedTemplate(t);
    setIsTestOpen(true);
  };

  const handleCopy = (t: Template) => {
    setName(`نسخة من ${t.name}`);
    setContent(t.content);
    setCategory(t.category);
    setIsCreateOpen(true);
    toast.info("تم نسخ القالب — قم بتعديله وحفظه");
  };

  const handleSendTest = () => {
    if (!testPhone.trim()) { toast.error("يرجى إدخال رقم الهاتف"); return; }
    if (!selectedTemplate) return;
    sendTemplateMutation.mutate({
      phone: testPhone,
      templateName: selectedTemplate.metaName || selectedTemplate.name,
      language: selectedTemplate.languageCode || "ar",
    });
  };

  // Stats
  const stats = useMemo(() => {
    if (!templates) return { total: 0, approved: 0, pending: 0, rejected: 0 };
    return {
      total: templates.length,
      approved: templates.filter((t: Template) => t.metaStatus === "APPROVED").length,
      pending: templates.filter((t: Template) => t.metaStatus === "PENDING").length,
      rejected: templates.filter((t: Template) => t.metaStatus === "REJECTED").length,
    };
  }, [templates]);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    let result = templates || [];
    if (filterStatus !== "all") result = result.filter((t: Template) => t.metaStatus === filterStatus);
    if (filterCategory !== "all") result = result.filter((t: Template) => t.category === filterCategory);
    if (searchQuery) {
      result = result.filter((t: Template) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.metaName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [templates, filterStatus, filterCategory, searchQuery]);

  return (
    <div className="space-y-4 md:space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            قوالب الرسائل
          </h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة قوالب واتساب المعتمدة من Meta</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => syncFromMetaMutation.mutate()}
            variant="outline"
            size="sm"
            disabled={syncFromMetaMutation.isPending}
            className="gap-1.5"
          >
            {syncFromMetaMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            مزامنة Meta
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={(v) => { setIsCreateOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700">
                <Plus className="h-3.5 w-3.5" />
                قالب جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg" dir="rtl">
              <DialogHeader>
                <DialogTitle>إنشاء قالب جديد</DialogTitle>
                <DialogDescription>أنشئ قالب رسالة جديد لاستخدامه في الحملات</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>اسم القالب <span className="text-red-500">*</span></Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: تأكيد_الحجز" />
                  <p className="text-[10px] text-muted-foreground">يجب أن يكون باللغة الإنجليزية بدون مسافات (يُستخدم في Meta)</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>الفئة</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTILITY">خدمات (Utility)</SelectItem>
                        <SelectItem value="MARKETING">تسويق (Marketing)</SelectItem>
                        <SelectItem value="AUTHENTICATION">مصادقة (Authentication)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>اللغة</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar">العربية (ar)</SelectItem>
                        <SelectItem value="en">الإنجليزية (en)</SelectItem>
                        <SelectItem value="en_US">الإنجليزية الأمريكية (en_US)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>محتوى الرسالة <span className="text-red-500">*</span></Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="مرحباً {{1}}، تم تأكيد حجزك بنجاح..."
                    rows={5}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    استخدم {`{{1}}`}، {`{{2}}`}... للمتغيرات الديناميكية
                  </p>
                </div>
                {content && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">معاينة</Label>
                    <div className="bg-[#e5ddd5] rounded-lg p-3">
                      <div className="bg-white rounded-lg p-2.5 shadow-sm text-sm">{content}</div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>إلغاء</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-green-600 hover:bg-green-700">
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
                  إنشاء
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "إجمالي القوالب", value: stats.total, icon: FileText, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "معتمدة", value: stats.approved, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: "قيد المراجعة", value: stats.pending, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
          { label: "مرفوضة", value: stats.rejected, icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
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

      {/* Meta Compliance Notice */}
      <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 dark:text-amber-300">
          <strong>تنبيه Meta:</strong> يمكنك فقط إرسال رسائل باستخدام القوالب المعتمدة (APPROVED) من Meta Business Manager.
          القوالب غير المعتمدة لن تُرسل. قم بمزامنة القوالب بعد الموافقة عليها.
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="بحث في القوالب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-8 h-8 text-sm"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 text-xs w-full sm:w-36">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="APPROVED">معتمدة</SelectItem>
            <SelectItem value="PENDING">قيد المراجعة</SelectItem>
            <SelectItem value="REJECTED">مرفوضة</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-8 text-xs w-full sm:w-36">
            <SelectValue placeholder="الفئة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الفئات</SelectItem>
            <SelectItem value="UTILITY">خدمات (Utility)</SelectItem>
            <SelectItem value="MARKETING">تسويق (Marketing)</SelectItem>
            <SelectItem value="AUTHENTICATION">مصادقة (Authentication)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-green-500" />
          <p className="text-sm text-muted-foreground">جاري تحميل القوالب...</p>
        </div>
      ) : filteredTemplates && filteredTemplates.length > 0 ? (
        <>
          <p className="text-xs text-muted-foreground">
            عرض {filteredTemplates.length} من {templates?.length} قالب
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template: Template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTest={handleTest}
                onCopy={handleCopy}
                onPreview={handlePreview}
              />
            ))}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">
              {searchQuery || filterStatus !== "all" ? "لا توجد قوالب تطابق البحث" : "لا توجد قوالب حالياً"}
            </p>
            {!searchQuery && filterStatus === "all" && (
              <Button size="sm" onClick={() => syncFromMetaMutation.mutate()} variant="outline" className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                مزامنة من Meta
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(v) => { setIsEditOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل القالب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>اسم القالب</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>الفئة</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTILITY">خدمات (Utility)</SelectItem>
                  <SelectItem value="MARKETING">تسويق (Marketing)</SelectItem>
                  <SelectItem value="AUTHENTICATION">مصادقة (Authentication)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>محتوى الرسالة</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditOpen(false); resetForm(); }}>إلغاء</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="bg-green-600 hover:bg-green-700">
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Check className="h-4 w-4 ml-2" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-green-600" />
              معاينة القالب
            </DialogTitle>
            <DialogDescription>{selectedTemplate?.name}</DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="py-2">
              <WhatsAppPreview template={selectedTemplate} />
              <Separator className="my-3" />
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الحالة:</span>
                  <StatusBadge status={selectedTemplate.metaStatus} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الفئة:</span>
                  <CategoryBadge category={selectedTemplate.category} />
                </div>
                {selectedTemplate.languageCode && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">اللغة:</span>
                    <span>{selectedTemplate.languageCode}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedTemplate?.metaStatus === "APPROVED" && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 gap-1.5"
                onClick={() => { setIsPreviewOpen(false); handleTest(selectedTemplate!); }}
              >
                <Send className="h-3.5 w-3.5" />
                اختبار الإرسال
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Send Dialog */}
      <Dialog open={isTestOpen} onOpenChange={(v) => { setIsTestOpen(v); if (!v) setTestPhone(""); }}>
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-green-600" />
              اختبار إرسال القالب
            </DialogTitle>
            <DialogDescription>
              إرسال قالب <strong>{selectedTemplate?.name}</strong> إلى رقم هاتف للاختبار
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
              <p className="text-[10px] text-muted-foreground">أدخل رقم هاتف يمني (9 أرقام تبدأ بـ 7)</p>
            </div>
            {selectedTemplate && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800 dark:text-amber-300">
                <strong>ملاحظة:</strong> سيتم إرسال القالب "{selectedTemplate.metaName || selectedTemplate.name}" باللغة {selectedTemplate.languageCode || "ar"}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestOpen(false)}>إلغاء</Button>
            <Button
              onClick={handleSendTest}
              disabled={sendTemplateMutation.isPending || !testPhone.trim()}
              className="bg-green-600 hover:bg-green-700 gap-1.5"
            >
              {sendTemplateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              إرسال الاختبار
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
