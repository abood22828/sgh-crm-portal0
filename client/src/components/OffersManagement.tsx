import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { type ColumnConfig } from "@/components/ColumnVisibility";
import { ColumnVisibility } from "@/components/ColumnVisibility";
import { ResizableTable, ResizableHeaderCell, FrozenTableCell } from "@/components/ResizableTable";
import { useTableFeatures } from "@/hooks/useTableFeatures";

// === تعريف أعمدة جدول العروض ===
const offerColumns: ColumnConfig[] = [
  { key: "title", label: "العنوان", defaultVisible: true, defaultWidth: 220, minWidth: 150, maxWidth: 400, sortType: 'string' },
  { key: "slug", label: "الرابط", defaultVisible: true, defaultWidth: 160, minWidth: 100, maxWidth: 300, sortType: 'string' },
  { key: "status", label: "الحالة", defaultVisible: true, defaultWidth: 100, minWidth: 80, maxWidth: 200, sortType: 'string' },
  { key: "startDate", label: "تاريخ البداية", defaultVisible: true, defaultWidth: 140, minWidth: 100, maxWidth: 250, sortType: 'date' },
  { key: "endDate", label: "تاريخ النهاية", defaultVisible: true, defaultWidth: 140, minWidth: 100, maxWidth: 250, sortType: 'date' },
  { key: "actions", label: "الإجراءات", defaultVisible: true, defaultWidth: 180, minWidth: 140, maxWidth: 300, sortable: false },
];

export default function OffersManagement() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingOffer, setDeletingOffer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    imageUrl: "",
    isActive: true,
    startDate: "",
    endDate: "",
  });

  // === useTableFeatures hook ===
  const offerTable = useTableFeatures({
    tableKey: 'offers',
    columns: offerColumns,
    defaultFrozenColumns: ['title'],
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
      setShowAddDialog(false);
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
      setDeleteDialogOpen(false);
      setDeletingOffer(null);
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
    setEditingOffer(null);
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

  const filteredOffers = useMemo(() => {
    if (!offers) return [];
    let filtered = [...offers];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (o: any) =>
          o.title.toLowerCase().includes(term) ||
          o.slug.toLowerCase().includes(term)
      );
    }

    // Apply sorting using useTableFeatures
    return offerTable.sortData(filtered, (item: any, key: string) => {
      switch (key) {
        case 'title': return item.title;
        case 'slug': return item.slug;
        case 'status': return item.status;
        case 'startDate': return item.startDate;
        case 'endDate': return item.endDate;
        default: return item[key];
      }
    });
  }, [offers, searchTerm, offerTable.sortState, offerTable.sortData]);

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
          <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            إضافة عرض جديد
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-4 pb-4 px-3">
              <div className="text-xs md:text-sm text-blue-700 mb-1">إجمالي العروض</div>
              <div className="text-lg md:text-xl font-bold text-blue-900">{totalOffers}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-4 pb-4 px-3">
              <div className="text-xs md:text-sm text-green-700 mb-1">عروض نشطة</div>
              <div className="text-lg md:text-xl font-bold text-green-900">{activeOffers}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardContent className="pt-4 pb-4 px-3">
              <div className="text-xs md:text-sm text-gray-700 mb-1">عروض غير نشطة</div>
              <div className="text-lg md:text-xl font-bold text-gray-900">{inactiveOffers}</div>
            </CardContent>
          </Card>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search & Column Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث بالعنوان أو الرابط..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <ColumnVisibility {...offerTable.columnVisibilityProps} />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredOffers.length > 0 ? (
          <ResizableTable {...offerTable.resizableTableProps}>
            <TableHeader>
              <TableRow>
                {offerTable.visibleColumnOrder.map(colKey => {
                  const col = offerColumns.find(c => c.key === colKey);
                  if (!col || !offerTable.visibleColumns[colKey]) return null;
                  return (
                    <ResizableHeaderCell
                      key={colKey}
                      columnKey={colKey}
                      width={offerTable.columnWidths.columnWidths[colKey] || col.defaultWidth || 150}
                      minWidth={col.minWidth || 80}
                      maxWidth={col.maxWidth || 500}
                      onResize={offerTable.columnWidths.handleResize}
                      {...offerTable.getSortProps(colKey)}
                    >
                      {col.label}
                    </ResizableHeaderCell>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOffers.map((offer: any) => (
                <TableRow key={offer.id}>
                  {offerTable.visibleColumnOrder.map(colKey => {
                    if (!offerTable.visibleColumns[colKey]) return null;
                    
                    switch (colKey) {
                      case 'title':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey} className="font-medium">
                            <span className="truncate">{offer.title}</span>
                          </FrozenTableCell>
                        );
                      case 'slug':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey}>
                            <a href={`/offers/${offer.slug}`} target="_blank" className="text-blue-600 hover:underline text-sm truncate">
                              {offer.slug}
                            </a>
                          </FrozenTableCell>
                        );
                      case 'status':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey}>
                            <Badge className={offer.isActive ? "bg-green-500" : "bg-gray-500"}>
                              {offer.isActive ? "نشط" : "غير نشط"}
                            </Badge>
                          </FrozenTableCell>
                        );
                      case 'startDate':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey} className="text-sm">
                            {offer.startDate ? new Date(offer.startDate).toLocaleDateString('ar-YE') : "-"}
                          </FrozenTableCell>
                        );
                      case 'endDate':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey} className="text-sm">
                            {offer.endDate ? new Date(offer.endDate).toLocaleDateString('ar-YE') : "-"}
                          </FrozenTableCell>
                        );
                      case 'actions':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey}>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(offer)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => {
                                  setDeletingOffer(offer);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </FrozenTableCell>
                        );
                      default:
                        return null;
                    }
                  })}
                </TableRow>
              ))}
            </TableBody>
          </ResizableTable>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "لا توجد نتائج مطابقة للبحث" : "لا توجد عروض حالياً. قم بإضافة عرض جديد."}
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
              <Label className="text-right block" htmlFor="title">عنوان العرض *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="مثال: عرض الولادة الخاص"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-right block" htmlFor="slug">الرابط (slug) *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="مثال: birth-offer"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-right block" htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف تفصيلي للعرض..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-right block" htmlFor="imageUrl">رابط الصورة</Label>
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
                <Label className="text-right block" htmlFor="startDate">تاريخ البداية</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-right block" htmlFor="endDate">تاريخ النهاية</Label>
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
              <Label className="text-right block" htmlFor="isActive">العرض نشط</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.title || !formData.slug || createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : editingOffer ? "حفظ التغييرات" : "إضافة العرض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف العرض "{deletingOffer?.title}"؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingOffer) {
                  deleteMutation.mutate({ id: deletingOffer.id });
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري الحذف...
                </>
              ) : "حذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
