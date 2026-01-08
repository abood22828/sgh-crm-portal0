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

export default function OffersManagement() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    imageUrl: "",
    isActive: true,
    startDate: "",
    endDate: "",
  });

  const { data: offers, isLoading, refetch } = trpc.offers.getAll.useQuery();
  
  const createMutation = trpc.offers.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء العرض بنجاح");
      refetch();
      setShowAddDialog(false);
      resetForm();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إنشاء العرض");
    },
  });

  const updateMutation = trpc.offers.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث العرض بنجاح");
      refetch();
      setEditingOffer(null);
      resetForm();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث العرض");
    },
  });

  const deleteMutation = trpc.offers.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف العرض بنجاح");
      refetch();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف العرض");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      description: "",
      imageUrl: "",
      isActive: true,
      startDate: "",
      endDate: "",
    });
  };

  const handleSubmit = () => {
    if (editingOffer) {
      updateMutation.mutate({
        id: editingOffer.id,
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

  const handleEdit = (offer: any) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      slug: offer.slug,
      description: offer.description || "",
      imageUrl: offer.imageUrl || "",
      isActive: offer.isActive,
      startDate: offer.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : "",
      endDate: offer.endDate ? new Date(offer.endDate).toISOString().split('T')[0] : "",
    });
    setShowAddDialog(true);
  };

  // Calculate stats
  const totalOffers = offers?.length || 0;
  const activeOffers = offers?.filter(o => o.isActive === true).length || 0;
  const inactiveOffers = offers?.filter(o => o.isActive === false).length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle>إدارة العروض الطبية</CardTitle>
            <CardDescription>إضافة وتعديل وحذف العروض الطبية</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setEditingOffer(null); setShowAddDialog(true); }} className="w-full sm:w-auto">
            إضافة عرض جديد
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-4 pb-4 px-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs md:text-sm text-blue-700 mb-1">إجمالي العروض</div>
                  <div className="text-lg md:text-xl font-bold text-blue-900">{totalOffers}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-4 pb-4 px-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs md:text-sm text-green-700 mb-1">عروض نشطة</div>
                  <div className="text-lg md:text-xl font-bold text-green-900">{activeOffers}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardContent className="pt-4 pb-4 px-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs md:text-sm text-gray-700 mb-1">عروض غير نشطة</div>
                  <div className="text-lg md:text-xl font-bold text-gray-900">{inactiveOffers}</div>
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
        ) : offers && offers.length > 0 ? (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">العنوان</TableHead>
                  <TableHead className="text-right hidden md:table-cell">الرابط</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">تاريخ البداية</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">تاريخ النهاية</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell className="font-medium">{offer.title}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <a href={`/offers/${offer.slug}`} target="_blank" className="text-blue-600 hover:underline text-sm">
                        {offer.slug}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge className={offer.isActive ? "bg-green-500" : "bg-gray-500"}>
                        {offer.isActive ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {offer.startDate ? new Date(offer.startDate).toLocaleDateString('ar-YE') : "-"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {offer.endDate ? new Date(offer.endDate).toLocaleDateString('ar-YE') : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(offer)}>
                          تعديل
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => {
                            if (confirm("هل أنت متأكد من حذف هذا العرض؟")) {
                              deleteMutation.mutate({ id: offer.id });
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
            لا توجد عروض حالياً. قم بإضافة عرض جديد.
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingOffer ? "تعديل العرض" : "إضافة عرض جديد"}</DialogTitle>
            <DialogDescription>
              {editingOffer ? "قم بتعديل بيانات العرض" : "أدخل بيانات العرض الجديد"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان العرض *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="مثال: عرض الولادة الخاص"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">الرابط (slug) *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="مثال: birth-offer"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف تفصيلي للعرض..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">رابط الصورة</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                dir="ltr"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">تاريخ البداية</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">تاريخ النهاية</Label>
                <Input
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
              <Label htmlFor="isActive">العرض نشط</Label>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); setEditingOffer(null); }}>
                إلغاء
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!formData.title || !formData.slug || createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : editingOffer ? "حفظ التغييرات" : "إضافة العرض"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
