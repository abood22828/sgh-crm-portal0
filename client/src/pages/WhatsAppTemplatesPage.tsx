import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Edit, Trash2, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export default function WhatsAppTemplatesPage() {
  return (
    <DashboardLayout pageTitle="قوالب واتساب" pageDescription="إدارة قوالب رسائل واتساب">
      <WhatsAppTemplatesContent />
    </DashboardLayout>
  );
}

function WhatsAppTemplatesContent() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"custom" | "confirmation" | "reminder" | "followup" | "thank_you">("custom");

  // Queries
  const { data: templates, isLoading, refetch } = trpc.whatsapp.templates.list.useQuery();

  // Sync from Meta mutation removed — feature in development

  // Mutations




  const resetForm = () => {
    setName("");
    setContent("");
    setCategory("custom");
    setSelectedTemplate(null);
  };

  const handleCreate = () => {
    toast.info("هذه الميزة قيد التطوير");
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setName(template.name);
    setContent(template.content);
    setCategory(template.category);
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    toast.info("هذه الميزة قيد التطوير");
  };

  const handleDelete = (id: number, templateName: string) => {
    toast.info("هذه الميزة قيد التطوير");
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (template: any) => {
    handleEdit(template);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    resetForm();
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    resetForm();
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("تم نسخ المحتوى");
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "reminder": return "تذكير";
      case "confirmation": return "تأكيد";
      case "followup": return "متابعة";
      case "thank_you": return "شكر";
      default: return "مخصص";
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "reminder": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "confirmation": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "followup": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "thank_you": return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300";
      default: return "bg-muted text-foreground";
    }
  };

  // Template Form (shared between create and edit dialogs)
  const TemplateForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <Label htmlFor={isEdit ? "edit-name" : "name"} className="text-sm">اسم القالب</Label>
        <Input
          id={isEdit ? "edit-name" : "name"}
          placeholder="مثال: تذكير بموعد"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-sm sm:text-base"
        />
      </div>
      <div>
        <Label htmlFor={isEdit ? "edit-category" : "category"} className="text-sm">التصنيف</Label>
        <Select value={category} onValueChange={(v: any) => setCategory(v)}>
          <SelectTrigger className="text-sm sm:text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">مخصص</SelectItem>
            <SelectItem value="reminder">تذكير</SelectItem>
            <SelectItem value="confirmation">تأكيد</SelectItem>
            <SelectItem value="followup">متابعة</SelectItem>
            <SelectItem value="thank_you">شكر</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor={isEdit ? "edit-content" : "content"} className="text-sm">محتوى الرسالة</Label>
        <Textarea
          id={isEdit ? "edit-content" : "content"}
          placeholder="مرحباً {name}، نذكرك بموعدك يوم {date} الساعة {time}"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className="text-sm sm:text-base"
        />
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5">
          يمكنك استخدام متغيرات: {"{name}"}, {"{date}"}, {"{time}"}, {"{doctor}"}, {"{service}"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" dir="rtl">
      <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 sm:p-3 rounded-xl shadow-lg flex-shrink-0">
                <FileText className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground truncate">قوالب الرسائل</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">إدارة قوالب رسائل واتساب الجاهزة</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Sync from Meta Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("هذه الميزة قيد التطوير")}
                className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9 px-2.5 sm:px-3 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400"
                title="مزامنة القوالب المعتمدة من Meta Business Manager"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">مزامنة Meta</span>
              </Button>

              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1.5 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-xs sm:text-sm h-8 sm:h-9 px-2.5 sm:px-4">
                  <Plus className="h-4 w-4" />
                  <span className="hidden xs:inline">قالب جديد</span>
                  <span className="xs:hidden">جديد</span>
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl" className="w-[calc(100vw-2rem)] sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">إنشاء قالب جديد</DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    أنشئ قالب رسالة جاهز للاستخدام السريع
                  </DialogDescription>
                </DialogHeader>
                <TemplateForm />
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="text-xs sm:text-sm h-8 sm:h-9">
                    إلغاء
                  </Button>
                  <Button onClick={handleCreate} className="text-xs sm:text-sm h-8 sm:h-9">
                    إنشاء
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          </div>

          {/* Info Card */}
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="bg-blue-500 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1 text-sm sm:text-base">نصائح لإنشاء القوالب</h3>
                  <ul className="text-xs sm:text-sm text-blue-800 dark:text-blue-400 space-y-0.5">
                    <li>• استخدم متغيرات ديناميكية مثل {"{name}"} و {"{date}"} لتخصيص الرسائل</li>
                    <li>• اجعل الرسائل واضحة ومختصرة</li>
                    <li>• صنّف القوالب حسب الغرض لسهولة الوصول إليها</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm sm:text-base">جاري التحميل...</div>
        ) : templates && templates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {templates.map((template: any) => (
              <Card key={template.id} className="shadow-md sm:shadow-lg border-0 hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 flex-wrap">
                        <CardTitle className="text-sm sm:text-lg truncate">{template.name}</CardTitle>
                        <Badge className={`${getCategoryColor(template.category)} text-[10px] sm:text-xs flex-shrink-0`}>
                          {getCategoryLabel(template.category)}
                        </Badge>
                        {template.metaStatus === 'APPROVED' && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-[10px] sm:text-xs flex-shrink-0 gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                            Meta معتمد
                          </Badge>
                        )}
                        {template.languageCode && (
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{template.languageCode}</span>
                        )}
                      </div>
                      <CardDescription className="text-[10px] sm:text-sm">
                        تم الإنشاء{" "}
                        {formatDistanceToNow(new Date(template.createdAt), {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                  <div className="bg-muted/50 rounded-lg p-2.5 sm:p-4 mb-3 sm:mb-4">
                    <p className="text-xs sm:text-sm text-foreground whitespace-pre-wrap line-clamp-4">{template.content}</p>
                  </div>
                  <div className="flex gap-1.5 sm:gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 sm:gap-2 flex-1 text-[10px] sm:text-xs h-7 sm:h-8"
                      onClick={() => handleCopy(template.content)}
                    >
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                      نسخ
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 sm:gap-2 flex-1 text-[10px] sm:text-xs h-7 sm:h-8"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      تعديل
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(template.id, template.name)}
                      className="h-7 sm:h-8 w-7 sm:w-8 p-0 flex-shrink-0"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-10 sm:py-12">
              <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">لا توجد قوالب</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">ابدأ بإنشاء قالب رسالة جديد</p>
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2 text-xs sm:text-sm h-8 sm:h-9">
                <Plus className="h-4 w-4" />
                إنشاء قالب
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent dir="rtl" className="w-[calc(100vw-2rem)] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">تعديل القالب</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                قم بتعديل بيانات القالب
              </DialogDescription>
            </DialogHeader>
            <TemplateForm isEdit />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsEditOpen(false)} className="text-xs sm:text-sm h-8 sm:h-9">
                إلغاء
              </Button>
                  <Button onClick={handleUpdate} className="text-xs sm:text-sm h-8 sm:h-9">
                    تحديث
                  </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
