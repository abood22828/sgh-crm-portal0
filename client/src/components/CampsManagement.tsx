import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function CampsManagement() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCamp, setEditingCamp] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    isActive: true,
    startDate: "",
    endDate: "",
  });

  const { data: camps, isLoading, refetch } = trpc.camps.getAll.useQuery();
  
  const createMutation = trpc.camps.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء المخيم بنجاح");
      refetch();
      setShowAddDialog(false);
      resetForm();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إنشاء المخيم");
    },
  });

  const updateMutation = trpc.camps.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث المخيم بنجاح");
      refetch();
      setEditingCamp(null);
      resetForm();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث المخيم");
    },
  });

  const deleteMutation = trpc.camps.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المخيم بنجاح");
      refetch();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف المخيم");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      imageUrl: "",
      isActive: true,
      startDate: "",
      endDate: "",
    });
  };

  const handleSubmit = () => {
    if (editingCamp) {
      updateMutation.mutate({
        id: editingCamp.id,
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      });
    } else {
      createMutation.mutate({
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      });
    }
  };

  const handleEdit = (camp: any) => {
    setEditingCamp(camp);
    setFormData({
      name: camp.name,
      slug: camp.slug,
      description: camp.description || "",
      imageUrl: camp.imageUrl || "",
      isActive: camp.isActive,
      startDate: camp.startDate ? new Date(camp.startDate).toISOString().split('T')[0] : "",
      endDate: camp.endDate ? new Date(camp.endDate).toISOString().split('T')[0] : "",
    });
    setShowAddDialog(true);
  };

  // Calculate stats
  const totalCamps = camps?.length || 0;
  const activeCamps = camps?.filter(c => c.isActive === true).length || 0;
  const inactiveCamps = camps?.filter(c => c.isActive === false).length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle>إدارة المخيمات الطبية</CardTitle>
            <CardDescription>إضافة وتعديل وحذف المخيمات الطبية</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setEditingCamp(null); setShowAddDialog(true); }} className="w-full sm:w-auto">
            إضافة مخيم جديد
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-4 pb-4 px-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs md:text-sm text-purple-700 mb-1">إجمالي المخيمات</div>
                  <div className="text-lg md:text-xl font-bold text-purple-900">{totalCamps}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-4 pb-4 px-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs md:text-sm text-green-700 mb-1">مخيمات نشطة</div>
                  <div className="text-lg md:text-xl font-bold text-green-900">{activeCamps}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardContent className="pt-4 pb-4 px-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs md:text-sm text-gray-700 mb-1">مخيمات غير نشطة</div>
                  <div className="text-lg md:text-xl font-bold text-gray-900">{inactiveCamps}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : camps && camps.length > 0 ? (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right hidden md:table-cell">الرابط</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">تاريخ البداية</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">تاريخ النهاية</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {camps.map((camp) => (
                  <TableRow key={camp.id}>
                    <TableCell className="font-medium">{camp.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <a href={`/camps/${camp.slug}`} target="_blank" className="text-green-600 hover:underline text-sm">
                        {camp.slug}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge className={camp.isActive ? "bg-green-500" : "bg-gray-500"}>
                        {camp.isActive ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {camp.startDate ? new Date(camp.startDate).toLocaleDateString('ar-YE') : "-"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {camp.endDate ? new Date(camp.endDate).toLocaleDateString('ar-YE') : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(camp)}>
                          تعديل
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => {
                            if (confirm("هل أنت متأكد من حذف هذا المخيم؟")) {
                              deleteMutation.mutate({ id: camp.id });
                            }
                          }}
                        >
                          حذف
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد مخيمات حالياً. قم بإضافة مخيم جديد.
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingCamp ? "تعديل المخيم" : "إضافة مخيم جديد"}</DialogTitle>
            <DialogDescription>
              {editingCamp ? "قم بتعديل بيانات المخيم" : "أدخل بيانات المخيم الجديد"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-right block" htmlFor="name">اسم المخيم *</Label>
              <Input className="text-right"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: مخيم الجراحة العامة"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-right block" htmlFor="slug">الرابط (slug) *</Label>
              <Input className="text-right"
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="مثال: surgery-camp"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-right block" htmlFor="description">الوصف</Label>
              <Textarea className="text-right"
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف تفصيلي للمخيم..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-right block" htmlFor="imageUrl">رابط الصورة</Label>
              <Input className="text-right"
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                dir="ltr"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-right block" htmlFor="startDate">تاريخ البداية</Label>
                <Input className="text-right"
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-right block" htmlFor="endDate">تاريخ النهاية</Label>
                <Input className="text-right"
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <Label className="text-right block" htmlFor="isActive">المخيم نشط</Label>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); setEditingCamp(null); }}>
                إلغاء
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!formData.name || !formData.slug || createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : editingCamp ? "حفظ التغييرات" : "إضافة المخيم"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
