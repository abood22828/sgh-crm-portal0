import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, User, Mail, Shield, Calendar } from "lucide-react";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: (updatedUser) => {
      toast.success("تم تحديث الملف الشخصي بنجاح");
      setIsEditing(false);
      // Update local state
      setName(updatedUser.name || "");
      setEmail(updatedUser.email || "");
      // Reload page to update auth context
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message || "فشل تحديث الملف الشخصي");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("الاسم مطلوب");
      return;
    }

    updateProfileMutation.mutate({
      name: name.trim(),
      email: email.trim() || undefined,
    });
  };

  const handleCancel = () => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setIsEditing(false);
  };

  if (authLoading) {
    return (
      <DashboardLayout pageTitle="الملف الشخصي" pageDescription="معلومات حسابك الشخصي">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout pageTitle="الملف الشخصي" pageDescription="معلومات حسابك الشخصي">
        <div className="text-center py-12">
          <p className="text-muted-foreground">لم يتم العثور على معلومات المستخدم</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="الملف الشخصي" pageDescription="معلومات حسابك الشخصي">
      <div className="container max-w-4xl py-4 sm:py-6 px-3 sm:px-4 md:px-6 space-y-4 sm:space-y-6">
        {/* Profile Header Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
                  {user.name?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
            <CardTitle className="text-lg sm:text-xl md:text-2xl">{user.name}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-2">
              <Shield className="h-4 w-4" />
              {user.role === 'admin' ? 'مدير النظام' : 'مستخدم'}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>المعلومات الشخصية</CardTitle>
                <CardDescription>معلومات حسابك وبياناتك الشخصية</CardDescription>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)}>
                  تعديل المعلومات
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم الكامل</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="أدخل اسمك الكامل"
                      className="pr-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="pr-10"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex-1"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      'حفظ التغييرات'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateProfileMutation.isPending}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">الاسم الكامل</p>
                    <p className="font-medium">{user.name || 'غير محدد'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                    <p className="font-medium">{user.email || 'غير محدد'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">الدور</p>
                    <p className="font-medium">{user.role === 'admin' ? 'مدير النظام' : 'مستخدم'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">تاريخ التسجيل</p>
                    <p className="font-medium">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-YE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'غير محدد'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Security Card */}
        <Card>
          <CardHeader>
            <CardTitle>الأمان والخصوصية</CardTitle>
            <CardDescription>إدارة إعدادات الأمان لحسابك</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm sm:text-base">تغيير كلمة المرور</p>
                  <p className="text-sm text-muted-foreground">قم بتحديث كلمة المرور الخاصة بك</p>
                </div>
                <Button variant="outline" disabled>
                  قريباً
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm sm:text-base">المصادقة الثنائية</p>
                  <p className="text-sm text-muted-foreground">أضف طبقة أمان إضافية لحسابك</p>
                </div>
                <Button variant="outline" disabled>
                  قريباً
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
