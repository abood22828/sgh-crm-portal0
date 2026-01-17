import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, Edit, Trash2, Power, Search, ArrowRight, UserCheck, UserX, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { useLocation } from "wouter";
import RecentActivity from "@/components/RecentActivity";

const roleLabels: Record<string, string> = {
  admin: "مسؤول",
  manager: "مدير",
  staff: "موظف",
  viewer: "مشاهد",
  user: "مستخدم",
};

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  manager: "bg-blue-100 text-blue-800",
  staff: "bg-green-100 text-green-800",
  viewer: "bg-gray-100 text-gray-800",
  user: "bg-purple-100 text-purple-800",
};

export default function UsersManagementPage() {
  const [, setLocation] = useLocation();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeSection, setActiveSection] = useState<"users" | "requests" | "activity">("users");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "user" as "user" | "admin" | "manager" | "staff" | "viewer",
    isActive: "yes" as "yes" | "no",
  });

  const { data: users, isLoading, refetch } = trpc.users.getAll.useQuery();
  const { data: accessRequests, refetch: refetchRequests } = trpc.accessRequests.pending.useQuery();

  const approveMutation = trpc.accessRequests.approve.useMutation({
    onSuccess: () => {
      toast.success("تمت الموافقة على الطلب بنجاح");
      refetchRequests();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء معالجة الطلب");
    },
  });

  const rejectMutation = trpc.accessRequests.reject.useMutation({
    onSuccess: () => {
      toast.success("تم رفض الطلب");
      refetchRequests();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء معالجة الطلب");
    },
  });

  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء المستخدم بنجاح");
      refetch();
      resetForm();
      setShowAddDialog(false);
    },
    onError: (error) => {
      toast.error(error.message || "فشل إنشاء المستخدم");
    },
  });

  const updateMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث المستخدم بنجاح");
      refetch();
      resetForm();
      setShowAddDialog(false);
    },
    onError: (error) => {
      toast.error(error.message || "فشل تحديث المستخدم");
    },
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المستخدم بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "فشل حذف المستخدم");
    },
  });

  const toggleActiveMutation = trpc.users.toggleActive.useMutation({
    onSuccess: (data) => {
      toast.success(data.newStatus === "yes" ? "تم تفعيل المستخدم" : "تم تعطيل المستخدم");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "فشل تغيير حالة المستخدم");
    },
  });

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      name: "",
      email: "",
      role: "user",
      isActive: "yes",
    });
    setEditingUser(null);
  };

  const handleSubmit = () => {
    if (editingUser) {
      const updateData: any = {
        id: editingUser.id,
        ...formData,
      };
      // Don't send password if empty
      if (!formData.password) {
        delete updateData.password;
      }
      updateMutation.mutate(updateData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "",
      name: user.name || "",
      email: user.email || "",
      role: user.role,
      isActive: user.isActive,
    });
    setShowAddDialog(true);
  };

  const handleDelete = (userId: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      deleteMutation.mutate({ id: userId });
    }
  };

  const handleToggleActive = (userId: number) => {
    toggleActiveMutation.mutate({ id: userId });
  };

  const filteredUsers = users?.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">جاري التحميل...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/dashboard")}
          className="mb-4 gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          عودة إلى لوحة التحكم
        </Button>

        {/* Section Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            variant={activeSection === "users" ? "default" : "outline"}
            onClick={() => setActiveSection("users")}
            className="flex-1 sm:flex-none whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            إدارة المستخدمين
          </Button>
          <Button
            variant={activeSection === "requests" ? "default" : "outline"}
            onClick={() => setActiveSection("requests")}
            className="flex-1 sm:flex-none relative whitespace-nowrap"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            طلبات التصريح
            {accessRequests && accessRequests.length > 0 && (
              <Badge className="mr-2 bg-red-500">
                {accessRequests.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeSection === "activity" ? "default" : "outline"}
            onClick={() => setActiveSection("activity")}
            className="flex-1 sm:flex-none whitespace-nowrap"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            تتبع النشاط
          </Button>
        </div>

        {/* Users Section */}
        {activeSection === "users" && (
        <>
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">إدارة المستخدمين</h1>
              <p className="text-gray-600 mt-1">إدارة المستخدمين والأدوار والصلاحيات</p>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  إضافة مستخدم جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="text-right">
                    {editingUser ? "تعديل مستخدم" : "إضافة مستخدم جديد"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-right block">اسم المستخدم *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="أدخل اسم المستخدم"
                      className="text-right"
                      disabled={!!editingUser}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-right block">
                      كلمة المرور {editingUser ? "(اتركها فارغة لعدم التغيير)" : "*"}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="أدخل كلمة المرور"
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-right block">الاسم الكامل</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="أدخل الاسم الكامل"
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-right block">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="أدخل البريد الإلكتروني"
                      className="text-right"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-right block">الدور *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger className="text-right">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">مستخدم</SelectItem>
                        <SelectItem value="viewer">مشاهد</SelectItem>
                        <SelectItem value="staff">موظف</SelectItem>
                        <SelectItem value="manager">مدير</SelectItem>
                        <SelectItem value="admin">مسؤول</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="isActive" className="text-right block">الحالة *</Label>
                    <Select
                      value={formData.isActive}
                      onValueChange={(value: any) => setFormData({ ...formData, isActive: value })}
                    >
                      <SelectTrigger className="text-right">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">نشط</SelectItem>
                        <SelectItem value="no">معطل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSubmit} className="flex-1">
                      {editingUser ? "تحديث" : "إضافة"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        resetForm();
                        setShowAddDialog(false);
                      }}
                      className="flex-1"
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="بحث عن مستخدم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 text-right"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">اسم المستخدم</TableHead>
                <TableHead className="text-right">الاسم الكامل</TableHead>
                <TableHead className="text-right">البريد الإلكتروني</TableHead>
                <TableHead className="text-right">الدور</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">آخر تسجيل دخول</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="text-right font-medium">{user.username}</TableCell>
                  <TableCell className="text-right">{user.name || "-"}</TableCell>
                  <TableCell className="text-right" dir="ltr">{user.email || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Badge className={roleColors[user.role]}>
                      {roleLabels[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={user.isActive === "yes" ? "default" : "secondary"}>
                      {user.isActive === "yes" ? "نشط" : "معطل"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {user.lastSignedIn
                      ? new Date(user.lastSignedIn).toLocaleDateString("ar-EG")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(user)}
                        className="gap-1"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(user.id)}
                        className="gap-1"
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                        className="gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredUsers?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">لا توجد مستخدمين</p>
            </div>
          )}
        </div>

        {/* Role Descriptions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">وصف الأدوار</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <Badge className={roleColors.admin + " mb-2"}>مسؤول</Badge>
              <p className="text-sm text-gray-600">
                صلاحيات كاملة لإدارة النظام، المستخدمين، والإعدادات
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <Badge className={roleColors.manager + " mb-2"}>مدير</Badge>
              <p className="text-sm text-gray-600">
                إدارة المحتوى والحجوزات والتقارير
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <Badge className={roleColors.staff + " mb-2"}>موظف</Badge>
              <p className="text-sm text-gray-600">
                معالجة الحجوزات وتحديث البيانات
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <Badge className={roleColors.viewer + " mb-2"}>مشاهد</Badge>
              <p className="text-sm text-gray-600">
                عرض البيانات والتقارير فقط دون تعديل
              </p>
            </div>
          </div>
        </div>
        </>
        )}

        {/* Access Requests Section */}
        {activeSection === "requests" && (
        <Card>
          <CardHeader>
            <CardTitle>طلبات التصريح المعلقة</CardTitle>
            <CardDescription>مراجعة والموافقة على طلبات الوصول الجديدة</CardDescription>
          </CardHeader>
          <CardContent>
            {!accessRequests || accessRequests.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold text-muted-foreground">
                  لا توجد طلبات معلقة
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-right">البريد الإلكتروني</TableHead>
                      <TableHead className="text-right">الهاتف</TableHead>
                      <TableHead className="text-right">السبب</TableHead>
                      <TableHead className="text-right">تاريخ الطلب</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm" dir="ltr">{request.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {request.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span dir="ltr">{request.phone}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">غير متوفر</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {request.reason || "غير محدد"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(request.requestedAt).toLocaleDateString('ar-YE')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => approveMutation.mutate({ requestId: request.id })}
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              موافقة
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectMutation.mutate({ requestId: request.id })}
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                            >
                              <UserX className="w-4 h-4 mr-1" />
                              رفض
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Activity Section */}
        {activeSection === "activity" && (
        <Card>
          <CardHeader>
            <CardTitle>تتبع النشاط الحي</CardTitle>
            <CardDescription>عرض آخر الأنشطة في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivity />
          </CardContent>
        </Card>
        )}

      </div>
    </div>
    </DashboardLayout>
  );
}
