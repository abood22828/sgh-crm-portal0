import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Stethoscope,
  Plane,
} from "lucide-react";
import { toast } from "sonner";
import { type ColumnConfig } from "@/components/ColumnVisibility";
import { ColumnVisibility } from "@/components/ColumnVisibility";
import { ResizableTable, ResizableHeaderCell, FrozenTableCell } from "@/components/ResizableTable";
import { useTableFeatures } from "@/hooks/useTableFeatures";

// === تعريف أعمدة جدول الأطباء ===
const doctorColumns: ColumnConfig[] = [
  { key: "name", label: "الاسم", defaultVisible: true, defaultWidth: 200, minWidth: 150, maxWidth: 400, sortType: 'string' },
  { key: "specialty", label: "التخصص", defaultVisible: true, defaultWidth: 180, minWidth: 120, maxWidth: 350, sortType: 'string' },
  { key: "experience", label: "الخبرة", defaultVisible: true, defaultWidth: 100, minWidth: 70, maxWidth: 200, sortType: 'string' },
  { key: "languages", label: "اللغات", defaultVisible: true, defaultWidth: 140, minWidth: 100, maxWidth: 300, sortType: 'string' },
  { key: "consultationFee", label: "رسوم الاستشارة", defaultVisible: true, defaultWidth: 130, minWidth: 100, maxWidth: 250, sortType: 'number' },
  { key: "isVisiting", label: "طبيب زائر", defaultVisible: false, defaultWidth: 100, minWidth: 80, maxWidth: 200, sortType: 'string' },
  { key: "status", label: "الحالة", defaultVisible: true, defaultWidth: 100, minWidth: 80, maxWidth: 200, sortType: 'string' },
  { key: "actions", label: "الإجراءات", defaultVisible: true, defaultWidth: 180, minWidth: 140, maxWidth: 300, sortable: false },
];

export default function DoctorsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);
  const [deletingDoctor, setDeletingDoctor] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    specialty: "",
    image: "",
    bio: "",
    experience: "",
    languages: "",
    consultationFee: "",
    procedures: "",
    isVisiting: "no" as "yes" | "no",
    available: "yes" as "yes" | "no",
  });

  // === useTableFeatures hook ===
  const doctorTable = useTableFeatures({
    tableKey: 'doctors',
    columns: doctorColumns,
    defaultFrozenColumns: ['name'],
  });

  const { data: doctors, isLoading, refetch } = trpc.doctors.list.useQuery();

  const doctorStats = useMemo(() => {
    if (!doctors) return { total: 0, available: 0, unavailable: 0, visiting: 0, visitingAvailable: 0, visitingUnavailable: 0 };
    const visiting = doctors.filter(d => d.isVisiting === 'yes');
    return {
      total: doctors.length,
      available: doctors.filter(d => d.available === 'yes').length,
      unavailable: doctors.filter(d => d.available === 'no').length,
      visiting: visiting.length,
      visitingAvailable: visiting.filter(d => d.available === 'yes').length,
      visitingUnavailable: visiting.filter(d => d.available === 'no').length,
    };
  }, [doctors]);

  const createMutation = trpc.doctors.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الطبيب بنجاح");
      refetch();
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء إضافة الطبيب");
    },
  });

  const updateMutation = trpc.doctors.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث بيانات الطبيب بنجاح");
      refetch();
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء تحديث البيانات");
    },
  });

  const deleteMutation = trpc.doctors.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الطبيب بنجاح");
      refetch();
      setDeleteDialogOpen(false);
      setDeletingDoctor(null);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف الطبيب");
    },
  });

  const toggleAvailabilityMutation = trpc.doctors.toggleAvailability.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة التوفر بنجاح");
      refetch();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الحالة");
    },
  });

  const filteredDoctors = useMemo(() => {
    if (!doctors) return [];
    let filtered = [...doctors];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (doc: any) =>
          doc.name.toLowerCase().includes(term) ||
          doc.specialty.toLowerCase().includes(term) ||
          (doc.languages && doc.languages.toLowerCase().includes(term))
      );
    }

    // Apply sorting using useTableFeatures
    return doctorTable.sortData(filtered, (item: any, key: string) => {
      switch (key) {
        case 'name': return item.name;
        case 'specialty': return item.specialty;
        case 'experience': return item.experience;
        case 'languages': return item.languages;
        case 'consultationFee': return item.consultationFee;
        case 'isVisiting': return item.isVisiting ? 'نعم' : 'لا';
        case 'status': return item.status;
        default: return item[key];
      }
    });
  }, [doctors, searchTerm, doctorTable.sortState, doctorTable.sortData]);

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      specialty: "",
      image: "",
      bio: "",
      experience: "",
      languages: "",
      consultationFee: "",
      procedures: "",
      isVisiting: "no",
      available: "yes",
    });
    setEditingDoctor(null);
  };

  const handleOpenDialog = (doctor?: any) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setFormData({
        name: doctor.name || "",
        slug: doctor.slug || "",
        specialty: doctor.specialty || "",
        image: doctor.image || "",
        bio: doctor.bio || "",
        experience: doctor.experience || "",
        languages: doctor.languages || "",
        consultationFee: doctor.consultationFee || "",
        procedures: doctor.procedures || "",
        isVisiting: doctor.isVisiting || "no",
        available: doctor.available || "yes",
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.slug || !formData.specialty) {
      toast.error("الرجاء ملء جميع الحقول المطلوبة");
      return;
    }

    if (editingDoctor) {
      updateMutation.mutate({
        id: editingDoctor.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (!deletingDoctor) return;
    deleteMutation.mutate({ id: deletingDoctor.id });
  };

  const handleToggleAvailability = (doctor: any) => {
    const newAvailability = doctor.available === "yes" ? "no" : "yes";
    toggleAvailabilityMutation.mutate({
      id: doctor.id,
      available: newAvailability,
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأطباء</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doctorStats.total}</div>
            <p className="text-xs text-muted-foreground">جميع الأطباء في النظام</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متاحون</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doctorStats.available}</div>
            <p className="text-xs text-muted-foreground">أطباء متاحون للحجز</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">غير متاحين</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doctorStats.unavailable}</div>
            <p className="text-xs text-muted-foreground">أطباء غير متاحين حالياً</p>
          </CardContent>
        </Card>
      </div>

      {/* Visiting Doctors Stats */}
      {doctorStats.visiting > 0 && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">أطباء زائرون</CardTitle>
              <Plane className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">{doctorStats.visiting}</div>
              <p className="text-xs text-muted-foreground">إجمالي الأطباء الزائرين</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">زائرون متاحون</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{doctorStats.visitingAvailable}</div>
              <p className="text-xs text-muted-foreground">أطباء زائرون متاحون للحجز</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">زائرون غير متاحين</CardTitle>
              <UserX className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{doctorStats.visitingUnavailable}</div>
              <p className="text-xs text-muted-foreground">أطباء زائرون غير متاحين</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>إدارة الأطباء</CardTitle>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              إضافة طبيب جديد
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search & Column Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث بالاسم، التخصص، أو اللغات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <ColumnVisibility {...doctorTable.columnVisibilityProps} />
          </div>

          {/* Table */}
          <ResizableTable {...doctorTable.resizableTableProps}>
            <TableHeader>
              <TableRow>
                {doctorTable.visibleColumnOrder.map(colKey => {
                  const col = doctorColumns.find(c => c.key === colKey);
                  if (!col || !doctorTable.visibleColumns[colKey]) return null;
                  return (
                    <ResizableHeaderCell
                      key={colKey}
                      columnKey={colKey}
                      width={doctorTable.columnWidths.columnWidths[colKey] || col.defaultWidth || 150}
                      minWidth={col.minWidth || 80}
                      maxWidth={col.maxWidth || 500}
                      onResize={doctorTable.columnWidths.handleResize}
                      {...doctorTable.getSortProps(colKey)}
                    >
                      {col.label}
                    </ResizableHeaderCell>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDoctors.length === 0 ? (
                <TableRow>
                  <FrozenTableCell columnKey="" colSpan={doctorTable.visibleColumnOrder.filter(k => doctorTable.visibleColumns[k]).length} className="text-center py-8 text-muted-foreground">
                    لا توجد أطباء متاحة
                  </FrozenTableCell>
                </TableRow>
              ) : (
                filteredDoctors.map((doctor: any) => (
                  <TableRow key={doctor.id}>
                    {doctorTable.visibleColumnOrder.map(colKey => {
                      if (!doctorTable.visibleColumns[colKey]) return null;
                      
                      switch (colKey) {
                        case 'name':
                          return (
                            <FrozenTableCell key={colKey} columnKey={colKey} className="font-medium">
                              <div className="flex items-center gap-3">
                                {doctor.image ? (
                                  <img
                                    src={doctor.image}
                                    alt={doctor.name}
                                    className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Stethoscope className="h-5 w-5 text-primary" />
                                  </div>
                                )}
                                <span className="truncate">{doctor.name}</span>
                              </div>
                            </FrozenTableCell>
                          );
                        case 'specialty':
                          return <FrozenTableCell key={colKey} columnKey={colKey}><span className="truncate">{doctor.specialty}</span></FrozenTableCell>;
                        case 'experience':
                          return <FrozenTableCell key={colKey} columnKey={colKey}>{doctor.experience || "-"}</FrozenTableCell>;
                        case 'languages':
                          return <FrozenTableCell key={colKey} columnKey={colKey}>{doctor.languages || "-"}</FrozenTableCell>;
                        case 'consultationFee':
                          return <FrozenTableCell key={colKey} columnKey={colKey}>{doctor.consultationFee || "-"}</FrozenTableCell>;
                        case 'isVisiting':
                          return (
                            <FrozenTableCell key={colKey} columnKey={colKey}>
                              <Badge className={doctor.isVisiting === "yes" ? "bg-purple-500" : "bg-gray-400"}>
                                {doctor.isVisiting === "yes" ? "زائر" : "مقيم"}
                              </Badge>
                            </FrozenTableCell>
                          );
                        case 'status':
                          return (
                            <FrozenTableCell key={colKey} columnKey={colKey}>
                              <Badge className={doctor.available === "yes" ? "bg-green-500" : "bg-red-500"}>
                                {doctor.available === "yes" ? "متاح" : "غير متاح"}
                              </Badge>
                            </FrozenTableCell>
                          );
                        case 'actions':
                          return (
                            <FrozenTableCell key={colKey} columnKey={colKey}>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleAvailability(doctor)}
                                >
                                  {doctor.available === "yes" ? "تعطيل" : "تفعيل"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenDialog(doctor)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setDeletingDoctor(doctor);
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
                ))
              )}
            </TableBody>
          </ResizableTable>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDoctor ? "تعديل بيانات الطبيب" : "إضافة طبيب جديد"}</DialogTitle>
            <DialogDescription>
              {editingDoctor
                ? "قم بتعديل بيانات الطبيب في النموذج أدناه"
                : "أدخل بيانات الطبيب الجديد في النموذج أدناه"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-right block" htmlFor="name">الاسم *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (!editingDoctor) {
                    setFormData((prev) => ({ ...prev, slug: generateSlug(e.target.value) }));
                  }
                }}
                placeholder="د. أحمد محمد"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-right block" htmlFor="slug">الرابط (Slug) *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="dr-ahmed-mohamed"
              />
              <p className="text-xs text-muted-foreground">
                سيتم استخدامه في رابط صفحة الطبيب: /doctors/{formData.slug || "slug"}
              </p>
            </div>

            <div className="grid gap-2">
              <Label className="text-right block" htmlFor="specialty">التخصص *</Label>
              <Input
                id="specialty"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                placeholder="أخصائي القلب والأوعية الدموية"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-right block" htmlFor="image">رابط الصورة</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/doctor-image.jpg"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-right block" htmlFor="bio">نبذة عن الطبيب</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="نبذة مختصرة عن الطبيب وخبراته..."
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-right block" htmlFor="experience">سنوات الخبرة</Label>
              <Input
                id="experience"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                placeholder="15 سنة"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-right block" htmlFor="languages">اللغات</Label>
              <Input
                id="languages"
                value={formData.languages}
                onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                placeholder="العربية، الإنجليزية"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-right block" htmlFor="consultationFee">رسوم الاستشارة</Label>
              <Input
                id="consultationFee"
                value={formData.consultationFee}
                onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                placeholder="200 ريال"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-right block" htmlFor="procedures">الإجراءات المتاحة (فصل بفاصلة)</Label>
              <Textarea
                id="procedures"
                value={formData.procedures}
                onChange={(e) => setFormData({ ...formData, procedures: e.target.value })}
                placeholder="مثال: كشف عام, تخطيط قلب, إيكو على القلب"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                سيتم عرضها في نموذج الحجز كخيارات للمريض
              </p>
            </div>

            <div className="grid gap-2">
              <Label className="text-right block" htmlFor="isVisiting">طبيب زائر</Label>
              <Select
                value={formData.isVisiting}
                onValueChange={(value: "yes" | "no") =>
                  setFormData({ ...formData, isVisiting: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">لا</SelectItem>
                  <SelectItem value="yes">نعم</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className="text-right block" htmlFor="available">الحالة</Label>
              <Select
                value={formData.available}
                onValueChange={(value: "yes" | "no") =>
                  setFormData({ ...formData, available: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">متاح</SelectItem>
                  <SelectItem value="no">غير متاح</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : editingDoctor ? (
                "حفظ التعديلات"
              ) : (
                "إضافة الطبيب"
              )}
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
              هل أنت متأكد من حذف الطبيب "{deletingDoctor?.name}"؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                "حذف"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
