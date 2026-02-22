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
  Tent,
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

// === تعريف أعمدة جدول المخيمات ===
const campColumns: ColumnConfig[] = [
  { key: "name", label: "الاسم", defaultVisible: true, defaultWidth: 220, minWidth: 150, maxWidth: 400, sortType: 'string' },
  { key: "slug", label: "الرابط", defaultVisible: true, defaultWidth: 160, minWidth: 100, maxWidth: 300, sortType: 'string' },
  { key: "status", label: "الحالة", defaultVisible: true, defaultWidth: 100, minWidth: 80, maxWidth: 200, sortType: 'string' },
  { key: "startDate", label: "تاريخ البداية", defaultVisible: true, defaultWidth: 140, minWidth: 100, maxWidth: 250, sortType: 'date' },
  { key: "endDate", label: "تاريخ النهاية", defaultVisible: true, defaultWidth: 140, minWidth: 100, maxWidth: 250, sortType: 'date' },
  { key: "actions", label: "الإجراءات", defaultVisible: true, defaultWidth: 180, minWidth: 140, maxWidth: 300, sortable: false },
];

export default function CampsManagement() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCamp, setEditingCamp] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCamp, setDeletingCamp] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    isActive: true,
    startDate: "",
    endDate: "",
    freeOffers: "",
    discountedOffers: "",
    availableProcedures: "",
    galleryImages: "",
  });

  // === useTableFeatures hook ===
  const campTable = useTableFeatures({
    tableKey: 'camps',
    columns: campColumns,
    defaultFrozenColumns: ['name'],
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
      setShowAddDialog(false);
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
      setDeleteDialogOpen(false);
      setDeletingCamp(null);
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
      freeOffers: "",
      discountedOffers: "",
      availableProcedures: "",
      galleryImages: "",
    });
    setEditingCamp(null);
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
      freeOffers: camp.freeOffers || "",
      discountedOffers: camp.discountedOffers || "",
      availableProcedures: camp.availableProcedures || "",
      galleryImages: camp.galleryImages || "",
    });
    setShowAddDialog(true);
  };

  const filteredCamps = useMemo(() => {
    if (!camps) return [];
    let filtered = [...camps];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c: any) =>
          c.name.toLowerCase().includes(term) ||
          c.slug.toLowerCase().includes(term)
      );
    }

    return campTable.sortData(filtered, (item: any, key: string) => {
      switch (key) {
        case 'name': return item.name;
        case 'slug': return item.slug;
        case 'status': return item.status;
        case 'startDate': return item.startDate;
        case 'endDate': return item.endDate;
        default: return item[key];
      }
    });
  }, [camps, searchTerm, campTable.sortState, campTable.sortData]);

  // Calculate stats
  const totalCamps = camps?.length || 0;
  const activeCamps = camps?.filter(c => c.isActive === true).length || 0;
  const inactiveCamps = camps?.filter(c => c.isActive === false).length || 0;

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
        {/* إجمالي المخيمات */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">إجمالي المخيمات</span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Tent className="h-4 w-4 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalCamps}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">جميع المخيمات</p>
        </div>

        {/* مخيمات نشطة */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">مخيمات نشطة</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{activeCamps}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">نشطة حالياً</p>
        </div>

        {/* مخيمات غير نشطة */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">غير نشطة</span>
            <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-gray-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-500">{inactiveCamps}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">معطلة</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1 w-full">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث بالاسم أو الرابط..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <ColumnVisibility {...campTable.columnVisibilityProps} />
        </div>
        <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 ml-2" />
          إضافة مخيم جديد
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {filteredCamps.length === 0 ? (
          <EmptyState
            icon={Tent}
            title={searchTerm ? "لا توجد نتائج مطابقة" : "لا توجد مخيمات بعد"}
            description={searchTerm ? "جرّب تغيير كلمات البحث" : "ابدأ بإضافة أول مخيم طبي إلى النظام"}
            action={!searchTerm ? { label: "إضافة مخيم جديد", onClick: () => { resetForm(); setShowAddDialog(true); } } : undefined}
          />
        ) : (
          <ResizableTable {...campTable.resizableTableProps}>
            <TableHeader>
              <TableRow>
                {campTable.visibleColumnOrder.map(colKey => {
                  const col = campColumns.find(c => c.key === colKey);
                  if (!col || !campTable.visibleColumns[colKey]) return null;
                  return (
                    <ResizableHeaderCell
                      key={colKey}
                      columnKey={colKey}
                      width={campTable.columnWidths.columnWidths[colKey] || col.defaultWidth || 150}
                      minWidth={col.minWidth || 80}
                      maxWidth={col.maxWidth || 500}
                      onResize={campTable.columnWidths.handleResize}
                      {...campTable.getSortProps(colKey)}
                    >
                      {col.label}
                    </ResizableHeaderCell>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCamps.map((camp: any) => (
                <TableRow key={camp.id} className="hover:bg-gray-50/50">
                  {campTable.visibleColumnOrder.map(colKey => {
                    if (!campTable.visibleColumns[colKey]) return null;
                    
                    switch (colKey) {
                      case 'name':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey} className="font-medium">
                            <div className="flex items-center gap-3">
                              {camp.imageUrl ? (
                                <img
                                  src={camp.imageUrl}
                                  alt={camp.name}
                                  className="h-10 w-10 rounded-lg object-cover flex-shrink-0 ring-1 ring-gray-100"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                                  <Tent className="h-5 w-5 text-purple-500" />
                                </div>
                              )}
                              <span className="truncate text-sm font-semibold">{camp.name}</span>
                            </div>
                          </FrozenTableCell>
                        );
                      case 'slug':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey}>
                            <a href={`/camps/${camp.slug}`} target="_blank" className="text-blue-600 hover:underline text-sm truncate">
                              {camp.slug}
                            </a>
                          </FrozenTableCell>
                        );
                      case 'status':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey}>
                            <Badge variant="outline" className={camp.isActive 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : "bg-gray-50 text-gray-600 border-gray-200"}>
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ml-1.5 ${camp.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                              {camp.isActive ? "نشط" : "غير نشط"}
                            </Badge>
                          </FrozenTableCell>
                        );
                      case 'startDate':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey} className="text-sm text-gray-600">
                            {camp.startDate ? new Date(camp.startDate).toLocaleDateString('ar-YE') : "-"}
                          </FrozenTableCell>
                        );
                      case 'endDate':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey} className="text-sm text-gray-600">
                            {camp.endDate ? new Date(camp.endDate).toLocaleDateString('ar-YE') : "-"}
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
                                onClick={() => handleEdit(camp)}
                              >
                                <Edit className="h-3.5 w-3.5 text-gray-500" />
                              </Button>
                              <Button 
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setDeletingCamp(camp);
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
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${editingCamp ? "bg-blue-50" : "bg-emerald-50"}`}>
                {editingCamp ? <Edit className="h-4 w-4 text-blue-600" /> : <Plus className="h-4 w-4 text-emerald-600" />}
              </div>
              {editingCamp ? "تعديل المخيم" : "إضافة مخيم جديد"}
            </DialogTitle>
            <DialogDescription>
              {editingCamp ? "قم بتعديل بيانات المخيم" : "أدخل بيانات المخيم الجديد"}
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
                <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="name">اسم المخيم *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: مخيم الجراحة العامة"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="slug">الرابط (slug) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="مثال: surgery-camp"
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
                placeholder="وصف تفصيلي للمخيم..."
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="imageUrl">رابط الصورة الرئيسية</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/camp-image.jpg"
                dir="ltr"
              />
            </div>

            {/* تفاصيل المخيم */}
            <div className="space-y-1 mb-4 mt-6">
              <h4 className="text-sm font-semibold text-gray-700">تفاصيل المخيم</h4>
              <div className="h-px bg-gray-100" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="freeOffers">العروض المجانية</Label>
              <Textarea
                id="freeOffers"
                value={formData.freeOffers}
                onChange={(e) => setFormData({ ...formData, freeOffers: e.target.value })}
                placeholder="أدخل العروض المجانية (كل عرض في سطر جديد)"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="discountedOffers">العروض المخفضة</Label>
              <Textarea
                id="discountedOffers"
                value={formData.discountedOffers}
                onChange={(e) => setFormData({ ...formData, discountedOffers: e.target.value })}
                placeholder="أدخل العروض المخفضة (كل عرض في سطر جديد)"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="availableProcedures">الإجراءات المتاحة</Label>
              <Textarea
                id="availableProcedures"
                value={formData.availableProcedures}
                onChange={(e) => setFormData({ ...formData, availableProcedures: e.target.value })}
                placeholder="أدخل الإجراءات المتاحة (كل إجراء في سطر جديد)"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="galleryImages">روابط الصور الإضافية</Label>
              <Textarea
                id="galleryImages"
                value={formData.galleryImages}
                onChange={(e) => setFormData({ ...formData, galleryImages: e.target.value })}
                placeholder="أدخل روابط الصور (كل رابط في سطر جديد)"
                rows={3}
                dir="ltr"
              />
            </div>

            {/* الإعدادات والتواريخ */}
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
              <Label htmlFor="isActive" className="text-sm text-gray-700">المخيم نشط</Label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.name || !formData.slug || createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : editingCamp ? "حفظ التعديلات" : "إضافة المخيم"}
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
              هل أنت متأكد من حذف المخيم <strong>"{deletingCamp?.name}"</strong>؟
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
                if (deletingCamp) {
                  deleteMutation.mutate({ id: deletingCamp.id });
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
                  حذف المخيم
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
