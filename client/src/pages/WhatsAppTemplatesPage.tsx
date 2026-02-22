import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Edit, Trash2, Copy, Check, X } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export default function WhatsAppTemplatesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"custom" | "confirmation" | "reminder" | "followup" | "thank_you">("custom");

  // Queries
  const { data: templates, isLoading, refetch } = trpc.whatsapp.templates.list.useQuery();

  // Mutations
  const createMutation = trpc.whatsapp.templates.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء القالب بنجاح");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل إنشاء القالب: ${error.message}`);
    },
  });

  const updateMutation = trpc.whatsapp.templates.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث القالب بنجاح");
      setIsEditOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل تحديث القالب: ${error.message}`);
    },
  });

  const deleteMutation = trpc.whatsapp.templates.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف القالب بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل حذف القالب: ${error.message}`);
    },
  });

  const resetForm = () => {
    setName("");
    setContent("");
    setCategory("custom");
    setSelectedTemplate(null);
  };

  const handleCreate = () => {
    if (!name.trim() || !content.trim()) {
      toast.error("يرجى إدخال اسم القالب والمحتوى");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      content: content.trim(),
      category,
    });
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setName(template.name);
    setContent(template.content);
    setCategory(template.category);
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedTemplate || !name.trim() || !content.trim()) {
      toast.error("يرجى إدخال اسم القالب والمحتوى");
      return;
    }

    updateMutation.mutate({
      id: selectedTemplate.id,
      name: name.trim(),
      content: content.trim(),
      category,
    });
  };

  const handleDelete = (id: number, templateName: string) => {
    if (confirm(`هل أنت متأكد من حذف القالب "${templateName}"؟`)) {
      deleteMutation.mutate({ id });
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("تم نسخ المحتوى");
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "reminder":
        return "تذكير";
      case "confirmation":
        return "تأكيد";
      case "followup":
        return "متابعة";
      case "thank_you":
        return "شكر";
      default:
        return "مخصص";
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "reminder":
        return "bg-blue-100 text-blue-800";
      case "confirmation":
        return "bg-green-100 text-green-800";
      case "followup":
        return "bg-purple-100 text-purple-800";
      case "thank_you":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-muted text-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50" dir="rtl">
      <div className="container mx-auto p-4 md:p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">قوالب الرسائل</h1>
                <p className="text-muted-foreground">إدارة قوالب رسائل واتساب الجاهزة</p>
              </div>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                  <Plus className="h-5 w-5" />
                  قالب جديد
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl" className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>إنشاء قالب جديد</DialogTitle>
                  <DialogDescription>
                    أنشئ قالب رسالة جاهز للاستخدام السريع
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">اسم القالب</Label>
                    <Input
                      id="name"
                      placeholder="مثال: تذكير بموعد"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">التصنيف</Label>
                    <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                      <SelectTrigger>
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
                    <Label htmlFor="content">محتوى الرسالة</Label>
                    <Textarea
                      id="content"
                      placeholder="مرحباً {name}، نذكرك بموعدك يوم {date} الساعة {time}"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      يمكنك استخدام متغيرات: {"{name}"}, {"{date}"}, {"{time}"}, {"{doctor}"}, {"{service}"}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">نصائح لإنشاء القوالب</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
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
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : templates && templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template: any) => (
              <Card key={template.id} className="shadow-lg border-0 hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{template.name}</CardTitle>
                        <Badge className={getCategoryColor(template.category)}>
                          {getCategoryLabel(template.category)}
                        </Badge>
                      </div>
                      <CardDescription>
                        تم الإنشاء{" "}
                        {formatDistanceToNow(new Date(template.createdAt), {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{template.content}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 flex-1"
                      onClick={() => handleCopy(template.content)}
                    >
                      <Copy className="h-4 w-4" />
                      نسخ
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 flex-1"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-4 w-4" />
                      تعديل
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(template.id, template.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد قوالب</h3>
              <p className="text-muted-foreground mb-4">ابدأ بإنشاء قالب رسالة جديد</p>
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="h-5 w-5" />
                إنشاء قالب
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent dir="rtl" className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تعديل القالب</DialogTitle>
              <DialogDescription>
                قم بتعديل بيانات القالب
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">اسم القالب</Label>
                <Input
                  id="edit-name"
                  placeholder="مثال: تذكير بموعد"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">التصنيف</Label>
                <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                  <SelectTrigger>
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
                <Label htmlFor="edit-content">محتوى الرسالة</Label>
                <Textarea
                  id="edit-content"
                  placeholder="مرحباً {name}، نذكرك بموعدك يوم {date} الساعة {time}"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  يمكنك استخدام متغيرات: {"{name}"}, {"{date}"}, {"{time}"}, {"{doctor}"}, {"{service}"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "جاري التحديث..." : "تحديث"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
