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

    // Apply sorting using useTableFeatures
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle>إدارة المخيمات الطبية</CardTitle>
            <CardDescription>إضافة وتعديل وحذف المخيمات الطبية</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            إضافة مخيم جديد
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-4 pb-4 px-3">
              <div className="text-xs md:text-sm text-purple-700 mb-1">إجمالي المخيمات</div>
              <div className="text-lg md:text-xl font-bold text-purple-900">{totalCamps}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-4 pb-4 px-3">
              <div className="text-xs md:text-sm text-green-700 mb-1">مخيمات نشطة</div>
              <div className="text-lg md:text-xl font-bold text-green-900">{activeCamps}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardContent className="pt-4 pb-4 px-3">
              <div className="text-xs md:text-sm text-gray-700 mb-1">مخيمات غير نشطة</div>
              <div className="text-lg md:text-xl font-bold text-gray-900">{inactiveCamps}</div>
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
              placeholder="البحث بالاسم أو الرابط..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <ColumnVisibility {...campTable.columnVisibilityProps} />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredCamps.length > 0 ? (
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
                <TableRow key={camp.id}>
                  {campTable.visibleColumnOrder.map(colKey => {
                    if (!campTable.visibleColumns[colKey]) return null;
                    
                    switch (colKey) {
                      case 'name':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey} className="font-medium">
                            <span className="truncate">{camp.name}</span>
                          </FrozenTableCell>
                        );
                      case 'slug':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey}>
                            <a href={`/camps/${camp.slug}`} target="_blank" className="text-green-600 hover:underline text-sm truncate">
                              {camp.slug}
                            </a>
                          </FrozenTableCell>
                        );
                      case 'status':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey}>
                            <Badge className={camp.isActive ? "bg-green-500" : "bg-gray-500"}>
                              {camp.isActive ? "نشط" : "غير نشط"}
                            </Badge>
                          </FrozenTableCell>
                        );
                      case 'startDate':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey} className="text-sm">
                            {camp.startDate ? new Date(camp.startDate).toLocaleDateString('ar-YE') : "-"}
                          </FrozenTableCell>
                        );
                      case 'endDate':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey} className="text-sm">
                            {camp.endDate ? new Date(camp.endDate).toLocaleDateString('ar-YE') : "-"}
                          </FrozenTableCell>
                        );
                      case 'actions':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey}>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(camp)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => {
                                  setDeletingCamp(camp);
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
            {searchTerm ? "لا توجد نتائج مطابقة للبحث" : "لا توجد مخيمات حالياً. قم بإضافة مخيم جديد."}
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
              <Label className="text-right block" htmlFor="imageUrl">رابط الصورة الرئيسية</Label>
              <Input className="text-right"
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/camp-image.jpg"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-right block" htmlFor="freeOffers">العروض المجانية</Label>
              <Textarea className="text-right"
                id="freeOffers"
                value={formData.freeOffers}
                onChange={(e) => setFormData({ ...formData, freeOffers: e.target.value })}
                placeholder="أدخل العروض المجانية (كل عرض في سطر جديد)"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-right block" htmlFor="discountedOffers">العروض المخفضة</Label>
              <Textarea className="text-right"
                id="discountedOffers"
                value={formData.discountedOffers}
                onChange={(e) => setFormData({ ...formData, discountedOffers: e.target.value })}
                placeholder="أدخل العروض المخفضة (كل عرض في سطر جديد)"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-right block" htmlFor="availableProcedures">الإجراءات المتاحة</Label>
              <Textarea className="text-right"
                id="availableProcedures"
                value={formData.availableProcedures}
                onChange={(e) => setFormData({ ...formData, availableProcedures: e.target.value })}
                placeholder="أدخل الإجراءات المتاحة (كل إجراء في سطر جديد)"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-right block" htmlFor="galleryImages">روابط الصور الإضافية</Label>
              <Textarea className="text-right"
                id="galleryImages"
                value={formData.galleryImages}
                onChange={(e) => setFormData({ ...formData, galleryImages: e.target.value })}
                placeholder="أدخل روابط الصور (كل رابط في سطر جديد)"
                rows={3}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف المخيم "{deletingCamp?.name}"؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
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
