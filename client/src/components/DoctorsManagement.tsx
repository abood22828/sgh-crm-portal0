import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
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
} from "lucide-react";
import { toast } from "sonner";

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

  const { data: doctors, isLoading, refetch } = trpc.doctors.list.useQuery();

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
    if (!searchTerm) return doctors;

    const term = searchTerm.toLowerCase();
    return doctors.filter(
      (doc: any) =>
        doc.name.toLowerCase().includes(term) ||
        doc.specialty.toLowerCase().includes(term) ||
        (doc.languages && doc.languages.toLowerCase().includes(term))
    );
  }, [doctors, searchTerm]);

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

  const stats = useMemo(() => {
    if (!doctors) return { total: 0, available: 0, unavailable: 0 };
    return {
      total: doctors.length,
      available: doctors.filter((d: any) => d.available === "yes").length,
      unavailable: doctors.filter((d: any) => d.available === "no").length,
    };
  }, [doctors]);

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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأطباء</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">جميع الأطباء في النظام</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متاحون</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.available}</div>
            <p className="text-xs text-muted-foreground">أطباء متاحون للحجز</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">غير متاحين</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unavailable}</div>
            <p className="text-xs text-muted-foreground">أطباء غير متاحين حالياً</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>إدارة الأطباء</CardTitle>
              <CardDescription>إضافة وتعديل وحذف بيانات الأطباء</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة طبيب جديد
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث بالاسم، التخصص، أو اللغات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">التخصص</TableHead>
                  <TableHead className="text-right">الخبرة</TableHead>
                  <TableHead className="text-right">اللغات</TableHead>
                  <TableHead className="text-right">رسوم الاستشارة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDoctors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد أطباء متاحة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDoctors.map((doctor: any) => (
                    <TableRow key={doctor.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {doctor.image ? (
                            <img
                              src={doctor.image}
                              alt={doctor.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Stethoscope className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <span>{doctor.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{doctor.specialty}</TableCell>
                      <TableCell>{doctor.experience || "-"}</TableCell>
                      <TableCell>{doctor.languages || "-"}</TableCell>
                      <TableCell>{doctor.consultationFee || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            doctor.available === "yes" ? "bg-green-500" : "bg-red-500"
                          }
                        >
                          {doctor.available === "yes" ? "متاح" : "غير متاح"}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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
              <Label htmlFor="name">الاسم *</Label>
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
              <Label htmlFor="slug">الرابط (Slug) *</Label>
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
              <Label htmlFor="specialty">التخصص *</Label>
              <Input
                id="specialty"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                placeholder="أخصائي القلب والأوعية الدموية"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image">رابط الصورة</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/doctor-image.jpg"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bio">نبذة عن الطبيب</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="نبذة مختصرة عن الطبيب وخبراته..."
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="experience">سنوات الخبرة</Label>
              <Input
                id="experience"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                placeholder="15 سنة"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="languages">اللغات</Label>
              <Input
                id="languages"
                value={formData.languages}
                onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                placeholder="العربية، الإنجليزية"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="consultationFee">رسوم الاستشارة</Label>
              <Input
                id="consultationFee"
                value={formData.consultationFee}
                onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                placeholder="200 ريال"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="procedures">الإجراءات المتاحة (فصل بفاصلة)</Label>
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
              <Label htmlFor="isVisiting">طبيب زائر</Label>
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
              <Label htmlFor="available">الحالة</Label>
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
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
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
