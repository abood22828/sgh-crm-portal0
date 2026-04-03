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

  // Sync from Meta mutation
  const syncFromMetaMutation = trpc.whatsapp.templates.syncFromMeta.useMutation({
    onSuccess: (result) => {
      toast.success(result.message || `تمت المزامنة: ${result.synced} قالب جديد، ${result.updated} محدَّث`);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل المزامنة: ${error?.message || 'خطأ غير معروف'}`);
    },
  });

  // Mutations
  const createMutation = trpc.whatsapp.templates.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء القالب بنجاح");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل إنشاء القالب: ${error?.message || 'خطأ غير معروف'}`);
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

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">قوالب الرسائل</h1>
          <p className="text-gray-500 mt-2">إدارة قوالب رسائل واتساب الجاهزة</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => syncFromMetaMutation.mutate()}
            variant="outline"
            disabled={syncFromMetaMutation.isPending}
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            مزامنة Meta
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 ml-2" />
                جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إنشاء قالب جديد</DialogTitle>
                <DialogDescription>
                  أنشئ قالب رسالة جديد لاستخدامه في الحملات التسويقية
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>اسم القالب</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: تأكيد الحجز"
                  />
                </div>
                <div>
                  <Label>الفئة</Label>
                  <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">مخصص</SelectItem>
                      <SelectItem value="confirmation">تأكيد</SelectItem>
                      <SelectItem value="reminder">تذكير</SelectItem>
                      <SelectItem value="followup">متابعة</SelectItem>
                      <SelectItem value="thank_you">شكر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>محتوى الرسالة</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="أدخل محتوى الرسالة هنا..."
                    rows={4}
                  />
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
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="text-center py-12">جاري التحميل...</div>
      ) : templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      <Badge variant="outline">{template.category}</Badge>
                    </CardDescription>
                  </div>
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                  {template.content}
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  تم الإنشاء منذ{" "}
                  {formatDistanceToNow(new Date(template.createdAt), {
                    locale: ar,
                    addSuffix: true,
                  })}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Copy className="w-4 h-4 ml-1" />
                    نسخ
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="w-4 h-4 ml-1" />
                    تعديل
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">لا توجد قوالب حالياً</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
