import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Search, 
  Clock,
  Phone,
  Mail,
  Loader2,
  Eye,
  Tent,
  Calendar,
  MessageCircle,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel, formatCampRegistrationsForExport } from "@/lib/exportToExcel";
import CampRegistrationCard from "@/components/CampRegistrationCard";
import CardSkeleton from "@/components/CardSkeleton";

const statusLabels = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  attended: "حضر",
  cancelled: "ملغي",
};

const statusColors = {
  pending: "bg-yellow-500",
  confirmed: "bg-green-500",
  attended: "bg-blue-500",
  cancelled: "bg-red-500",
};

export default function CampRegistrationsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCamp, setSelectedCamp] = useState<string>("all");
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: registrations, isLoading, refetch } = trpc.campRegistrations.list.useQuery();
  const { data: stats } = trpc.campRegistrations.stats.useQuery();

  const updateStatusMutation = trpc.campRegistrations.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة التسجيل بنجاح");
      refetch();
      setStatusDialogOpen(false);
      setSelectedRegistration(null);
      setNewStatus("");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الحالة");
    },
  });

  // Get unique camps for filter
  const uniqueCamps = useMemo(() => {
    if (!registrations) return [];
    const camps = registrations
      .filter((reg: any) => reg.campName)
      .map((reg: any) => ({ id: reg.campId, name: reg.campName }));
    const unique = Array.from(new Map(camps.map((c: any) => [c.id, c])).values());
    return unique;
  }, [registrations]);

  const filteredRegistrations = useMemo(() => {
    if (!registrations) return [];
    
    let filtered = registrations;
    
    // Filter by camp
    if (selectedCamp !== "all") {
      filtered = filtered.filter((reg: any) => reg.campId === parseInt(selectedCamp));
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (reg: any) =>
          reg.fullName.toLowerCase().includes(term) ||
          reg.phone.includes(term) ||
          (reg.email && reg.email.toLowerCase().includes(term))
      );
    }
    
    // Filter by date
    if (dateFilter && dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter((reg: any) => {
        const regDate = new Date(reg.createdAt);
        
        if (dateFilter === "today") {
          return regDate >= today;
        } else if (dateFilter === "week") {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return regDate >= weekAgo;
        } else if (dateFilter === "month") {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return regDate >= monthAgo;
        }
        return true;
      });
    }
    
    // Filter by status
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((reg: any) => reg.status === statusFilter);
    }
    
    return filtered;
  }, [registrations, searchTerm, selectedCamp, dateFilter, statusFilter]);

  const handleStatusUpdate = () => {
    if (!selectedRegistration || !newStatus) return;
    
    updateStatusMutation.mutate({
      id: selectedRegistration.id,
      status: newStatus as any,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التسجيلات</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">تسجيلات المخيمات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيد الانتظار</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">بانتظار التأكيد</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مؤكد</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.confirmed || 0}</div>
            <p className="text-xs text-muted-foreground">تسجيلات مؤكدة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حضر</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.attended || 0}</div>
            <p className="text-xs text-muted-foreground">حضروا المخيم</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>تسجيلات المخيمات</CardTitle>
              <CardDescription>إدارة ومتابعة جميع تسجيلات المخيمات الطبية</CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (!registrations || registrations.length === 0) {
                  toast.error("لا توجد بيانات لتصديرها");
                  return;
                }
                const formattedData = formatCampRegistrationsForExport(registrations);
                exportToExcel(formattedData, `camp-registrations-${new Date().toISOString().split('T')[0]}`, 'تسجيلات المخيمات');
                toast.success("تم تصدير البيانات بنجاح");
              }}
            >
              <Download className="h-4 w-4 ml-2" />
              تصدير Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث بالاسم، الهاتف، أو البريد الإلكتروني..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 h-9 md:h-10"
              />
            </div>
            <Select value={selectedCamp} onValueChange={setSelectedCamp}>
              <SelectTrigger className="w-full sm:w-[180px] h-9 md:h-10">
                <SelectValue placeholder="فلترة حسب المخيم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المخيمات</SelectItem>
                {uniqueCamps.map((camp: any) => (
                  <SelectItem key={camp.id} value={camp.id.toString()}>
                    {camp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-9 md:h-10">
                <SelectValue placeholder="كل الفترات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الفترات</SelectItem>
                <SelectItem value="today">اليوم</SelectItem>
                <SelectItem value="week">هذا الأسبوع</SelectItem>
                <SelectItem value="month">هذا الشهر</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-9 md:h-10">
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="confirmed">مؤكد</SelectItem>
                <SelectItem value="attended">حضر</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden">
            {isLoading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : filteredRegistrations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  لا توجد تسجيلات متاحة
                </CardContent>
              </Card>
            ) : (
              filteredRegistrations.map((reg: any) => (
                <CampRegistrationCard
                  key={reg.id}
                  registration={{
                    id: reg.id,
                    fullName: reg.fullName,
                    phone: reg.phone,
                    email: reg.email,
                    age: reg.age,
                    status: reg.status,
                    campName: reg.campName,
                    createdAt: reg.createdAt,
                  }}
                  onEdit={() => {
                    setSelectedRegistration(reg);
                    setNewStatus(reg.status);
                    setStatusDialogOpen(true);
                  }}
                />
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم الكامل</TableHead>
                  <TableHead className="text-right">رقم الهاتف</TableHead>
                  <TableHead className="text-right">البريد الإلكتروني</TableHead>
                  <TableHead className="text-right">العمر</TableHead>
                  <TableHead className="text-right">المخيم</TableHead>
                  <TableHead className="text-right">المصدر</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ التسجيل</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      لا توجد تسجيلات متاحة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((reg: any) => (
                    <TableRow key={reg.id}>
                      <TableCell className="font-medium">{reg.fullName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${reg.phone}`} className="hover:text-primary">
                            {reg.phone}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        {reg.email ? (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a href={`mailto:${reg.email}`} className="hover:text-primary text-sm">
                              {reg.email}
                            </a>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {reg.age ? (
                          <span className="text-sm">{reg.age} سنة</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tent className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{reg.campName || "غير محدد"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {reg.source === 'web' ? 'موقع' : reg.source === 'phone' ? 'هاتف' : reg.source === 'manual' ? 'يدوي' : reg.source || 'غير محدد'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[reg.status as keyof typeof statusColors]}>
                          {statusLabels[reg.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(reg.createdAt).toLocaleDateString("ar-SA")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRegistration(reg);
                              setNewStatus(reg.status);
                              setStatusDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 ml-2" />
                            عرض التفاصيل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => {
                              const message = `مرحباً ${reg.fullName}،\n\nشكراً لتسجيلك في المخيم الطبي الخيري. نود التواصل معك لتأكيد تسجيلك.\n\nالمستشفى السعودي الألماني - صنعاء`;
                              window.open(`https://wa.me/${reg.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                            }}
                          >
                            <MessageCircle className="h-4 w-4 ml-2" />
                            واتساب
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

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تحديث حالة التسجيل</DialogTitle>
            <DialogDescription>
              قم بتحديث حالة تسجيل المخيم لـ {selectedRegistration?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>معلومات المسجل</Label>
              <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedRegistration?.phone}</span>
                </div>
                {selectedRegistration?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRegistration.email}</span>
                  </div>
                )}
                {selectedRegistration?.age && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>العمر: {selectedRegistration.age} سنة</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Tent className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedRegistration?.campTitle || "غير محدد"}</span>
                </div>
                {selectedRegistration?.medicalCondition && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">الحالة الطبية:</p>
                    <p>{selectedRegistration.medicalCondition}</p>
                  </div>
                )}
                {selectedRegistration?.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">ملاحظات:</p>
                    <p>{selectedRegistration.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>الحالة الجديدة</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="confirmed">مؤكد</SelectItem>
                  <SelectItem value="attended">حضر</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusDialogOpen(false);
                  setSelectedRegistration(null);
                  setNewStatus("");
                }}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={!newStatus || updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري التحديث...
                  </>
                ) : (
                  "تحديث الحالة"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
