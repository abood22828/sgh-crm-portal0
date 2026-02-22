import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  TableBody,
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
  AlertTriangle,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { type ColumnConfig } from "@/components/ColumnVisibility";
import { ColumnVisibility } from "@/components/ColumnVisibility";
import { ResizableTable, ResizableHeaderCell, FrozenTableCell } from "@/components/ResizableTable";
import { useTableFeatures } from "@/hooks/useTableFeatures";
import EmptyState from "@/components/EmptyState";

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
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 sm:p-4">
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
          <div className="flex items-center justify-between mb-6">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-9 w-36 bg-gray-200 rounded animate-pulse" />
          </div>
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
      <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {/* إجمالي الأطباء */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">إجمالي الأطباء</span>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{doctorStats.total}</div>
          <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">جميع الأطباء</p>
        </div>

        {/* متاحون */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">متاحون</span>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-emerald-600">{doctorStats.available}</div>
          <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">متاحون للحجز</p>
        </div>

        {/* غير متاحين */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">غير متاحين</span>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
              <UserX className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-red-500">{doctorStats.unavailable}</div>
          <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">غير متاحين حالياً</p>
        </div>

        {/* أطباء زائرون */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-purple-800 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-medium text-purple-600">أطباء زائرون</span>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <Plane className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-purple-700">{doctorStats.visiting}</div>
          <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">إجمالي الزائرين</p>
        </div>

        {/* زائرون متاحون */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">زائرون متاحون</span>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-green-600">{doctorStats.visitingAvailable}</div>
          <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">زائرون للحجز</p>
        </div>

        {/* زائرون غير متاحين */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">زائرون غير متاحين</span>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
              <UserX className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-orange-500">{doctorStats.visitingUnavailable}</div>
          <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">زائرون غير متاحين</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1 w-full">
          <div className="relative flex-1 w-full max-w-md">
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
        <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 ml-2" />
          إضافة طبيب جديد
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {filteredDoctors.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title={searchTerm ? "لا توجد نتائج مطابقة" : "لا يوجد أطباء بعد"}
            description={searchTerm ? "جرّب تغيير كلمات البحث" : "ابدأ بإضافة أول طبيب إلى النظام"}
            action={!searchTerm ? { label: "إضافة طبيب جديد", onClick: () => handleOpenDialog() } : undefined}
          />
        ) : (
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
              {filteredDoctors.map((doctor: any) => (
                <TableRow key={doctor.id} className="hover:bg-gray-50/50">
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
                                  className="h-10 w-10 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <Stethoscope className="h-5 w-5 text-primary" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="truncate block text-sm font-semibold">{doctor.name}</span>
                                {doctor.isVisiting === "yes" && (
                                  <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">زائر</span>
                                )}
                              </div>
                            </div>
                          </FrozenTableCell>
                        );
                      case 'specialty':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey}>
                            <span className="truncate text-sm text-gray-700">{doctor.specialty}</span>
                          </FrozenTableCell>
                        );
                      case 'experience':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey}>
                            <span className="text-sm text-gray-600">{doctor.experience || "-"}</span>
                          </FrozenTableCell>
                        );
                      case 'languages':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey}>
                            <span className="text-sm text-gray-600">{doctor.languages || "-"}</span>
                          </FrozenTableCell>
                        );
                      case 'consultationFee':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey}>
                            <span className="text-sm font-medium text-gray-700">{doctor.consultationFee || "-"}</span>
                          </FrozenTableCell>
                        );
                      case 'isVisiting':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey}>
                            <Badge variant="outline" className={doctor.isVisiting === "yes" 
                              ? "bg-purple-50 text-purple-700 border-purple-200" 
                              : "bg-gray-50 text-gray-600 border-gray-200"}>
                              {doctor.isVisiting === "yes" ? "زائر" : "مقيم"}
                            </Badge>
                          </FrozenTableCell>
                        );
                      case 'status':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey}>
                            <Badge variant="outline" className={doctor.available === "yes" 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : "bg-red-50 text-red-600 border-red-200"}>
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ml-1.5 ${doctor.available === "yes" ? "bg-emerald-500" : "bg-red-500"}`} />
                              {doctor.available === "yes" ? "متاح" : "غير متاح"}
                            </Badge>
                          </FrozenTableCell>
                        );
                      case 'actions':
                        return (
                          <FrozenTableCell key={colKey} columnKey={colKey}>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs"
                                onClick={() => handleToggleAvailability(doctor)}
                              >
                                {doctor.available === "yes" ? (
                                  <span className="text-red-500">تعطيل</span>
                                ) : (
                                  <span className="text-emerald-600">تفعيل</span>
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenDialog(doctor)}
                              >
                                <Edit className="h-3.5 w-3.5 text-gray-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setDeletingDoctor(doctor);
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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${editingDoctor ? "bg-blue-50" : "bg-emerald-50"}`}>
                {editingDoctor ? <Edit className="h-4 w-4 text-blue-600" /> : <Plus className="h-4 w-4 text-emerald-600" />}
              </div>
              {editingDoctor ? "تعديل بيانات الطبيب" : "إضافة طبيب جديد"}
            </DialogTitle>
            <DialogDescription>
              {editingDoctor
                ? "قم بتعديل بيانات الطبيب في النموذج أدناه"
                : "أدخل بيانات الطبيب الجديد في النموذج أدناه"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* القسم الأول: المعلومات الأساسية */}
            <div className="space-y-1 mb-4">
              <h4 className="text-sm font-semibold text-gray-700">المعلومات الأساسية</h4>
              <div className="h-px bg-gray-100" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="name">الاسم *</Label>
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
              <div className="space-y-1.5">
                <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="slug">الرابط (Slug) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="dr-ahmed-mohamed"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="specialty">التخصص *</Label>
                <Input
                  id="specialty"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder="أخصائي القلب والأوعية الدموية"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="experience">سنوات الخبرة</Label>
                <Input
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  placeholder="15 سنة"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="image">رابط الصورة</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/doctor-image.jpg"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="bio">نبذة عن الطبيب</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="نبذة مختصرة عن الطبيب وخبراته..."
                rows={3}
              />
            </div>

            {/* القسم الثاني: التفاصيل */}
            <div className="space-y-1 mb-4 mt-6">
              <h4 className="text-sm font-semibold text-gray-700">التفاصيل والإعدادات</h4>
              <div className="h-px bg-gray-100" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="languages">اللغات</Label>
                <Input
                  id="languages"
                  value={formData.languages}
                  onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                  placeholder="العربية، الإنجليزية"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="consultationFee">رسوم الاستشارة</Label>
                <Input
                  id="consultationFee"
                  value={formData.consultationFee}
                  onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                  placeholder="200 ريال"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="procedures">الإجراءات المتاحة (فصل بفاصلة)</Label>
              <Textarea
                id="procedures"
                value={formData.procedures}
                onChange={(e) => setFormData({ ...formData, procedures: e.target.value })}
                placeholder="مثال: كشف عام, تخطيط قلب, إيكو على القلب"
                rows={2}
              />
              <p className="text-[11px] text-gray-400">
                سيتم عرضها في نموذج الحجز كخيارات للمريض
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="isVisiting">طبيب زائر</Label>
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
                    <SelectItem value="no">لا - مقيم</SelectItem>
                    <SelectItem value="yes">نعم - زائر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-right block text-xs font-medium text-gray-600" htmlFor="available">الحالة</Label>
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
                    <SelectItem value="yes">متاح للحجز</SelectItem>
                    <SelectItem value="no">غير متاح</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
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
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              تأكيد الحذف
            </DialogTitle>
            <DialogDescription className="pt-2">
              هل أنت متأكد من حذف الطبيب <strong>"{deletingDoctor?.name}"</strong>؟
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
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف الطبيب
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
