import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  Plus,
  Edit,
  Trash2,
  Tag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { type ColumnConfig } from "@/components/ColumnVisibility";
import { ColumnVisibility } from "@/components/ColumnVisibility";
import { ResizableTable, ResizableHeaderCell, FrozenTableCell } from "@/components/ResizableTable";
import { useTableFeatures } from "@/hooks/useTableFeatures";
import EmptyState from "@/components/EmptyState";

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse" />
              </div>
              <div className="h-7 w-12 bg-gray-200 rounded animate-pulse mb-1" />
              <div className="h-2.5 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
        {/* Table Skeleton */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="h-10 w-full bg-gray-100 rounded animate-pulse mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 w-full bg-gray-50 rounded animate-pulse mb-2" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        {/* إجمالي العروض */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">إجمالي العروض</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Tag className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalOffers}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">جميع العروض</p>
        </div>

        {/* عروض نشطة */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">عروض نشطة</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{activeOffers}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">نشطة حالياً</p>
        </div>

        {/* عروض غير نشطة */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">غير نشطة</span>
            <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-gray-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-500">{inactiveOffers}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">معطلة</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1 w-full">
          <div className="relative flex-1 w-full max-w-md">
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
        <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 ml-2" />
          إضافة عرض جديد
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {filteredOffers.length === 0 ? (
          <EmptyState
            icon={Tag}
            title={searchTerm ? "لا توجد نتائج مطابقة" : "لا توجد عروض بعد"}
            description={searchTerm ? "جرّب تغيير كلمات البحث" : "ابدأ بإضافة أول عرض طبي إلى النظام"}
            action={!searchTerm ? { label: "إضافة عرض جديد", onClick: () => { resetForm(); setShowAddDialog(true); } } : undefined}
          />
        ) : (
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
                <TableRow key={offer.id} className="hover:bg-gray-50/50">
                  {offerTable.visibleColumnOrder.map(colKey => {
                    if (!offerTable.visibleColumns[colKey]) return null;
                    
                    switch (colKey) {
                      case 'title':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey} className="font-medium">
                            <div className="flex items-center gap-3">
                              {offer.imageUrl ? (
                                <img
                                  src={offer.imageUrl}
                                  alt={offer.title}
                                  className="h-10 w-10 rounded-lg object-cover flex-shrink-0 ring-1 ring-gray-100"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <Tag className="h-5 w-5 text-primary" />
                                </div>
                              )}
                              <span className="truncate text-sm font-semibold">{offer.title}</span>
                            </div>
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
                            <Badge variant="outline" className={offer.isActive 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : "bg-gray-50 text-gray-600 border-gray-200"}>
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ml-1.5 ${offer.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                              {offer.isActive ? "نشط" : "غير نشط"}
                            </Badge>
                          </FrozenTableCell>
                        );
                      case 'startDate':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey} className="text-sm text-gray-600">
                            {offer.startDate ? new Date(offer.startDate).toLocaleDateString('ar-YE') : "-"}
                          </FrozenTableCell>
                        );
                      case 'endDate':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey} className="text-sm text-gray-600">
                            {offer.endDate ? new Date(offer.endDate).toLocaleDateString('ar-YE') : "-"}
                          </FrozenTableCell>
                        );
                      case 'actions':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey}>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEdit(offer)}
                              >
                                <Edit className="h-3.5 w-3.5 text-gray-500" />
                              </Button>
                              <Button 
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setDeletingOffer(offer);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-400" />
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
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${editingOffer ? "bg-blue-50" : "bg-emerald-50"}`}>
                {editingOffer ? <Edit className="h-4 w-4 text-blue-600" /> : <Plus className="h-4 w-4 text-emerald-600" />}
              </div>
              {editingOffer ? "تعديل العرض" : "إضافة عرض جديد"}
            </DialogTitle>
            <DialogDescription>
              {editingOffer ? "قم بتعديل بيانات العرض" : "أدخل بيانات العرض الجديد"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            {/* المعلومات الأساسية */}
            <div className="space-y-1 mb-4">
              <h4 className="text-sm font-semibold text-gray-700">المعلومات الأساسية</h4>
              <div className="h-px bg-gray-100" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="title">عنوان العرض *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: عرض الولادة الخاص"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="slug">الرابط (slug) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="مثال: birth-offer"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف تفصيلي للعرض..."
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="imageUrl">رابط الصورة</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                dir="ltr"
              />
            </div>

            {/* الإعدادات */}
            <div className="space-y-1 mb-4 mt-6">
              <h4 className="text-sm font-semibold text-gray-700">الإعدادات والتواريخ</h4>
              <div className="h-px bg-gray-100" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="startDate">تاريخ البداية</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="endDate">تاريخ النهاية</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isActive" className="text-sm text-gray-700">العرض نشط</Label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
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
              ) : editingOffer ? "حفظ التعديلات" : "إضافة العرض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              تأكيد الحذف
            </DialogTitle>
            <DialogDescription className="pt-2">
              هل أنت متأكد من حذف العرض <strong>"{deletingOffer?.title}"</strong>؟
              <br />
              <span className="text-red-500 text-xs">لا يمكن التراجع عن هذا الإجراء.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
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
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف العرض
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
