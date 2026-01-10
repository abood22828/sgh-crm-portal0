import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction, LogOut, Settings } from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function ContentManagementPage() {
  const { user, loading, logout } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      const loginUrl = getLoginUrl();
      window.location.href = loginUrl;
    }
  }, [user, loading]);

  const handleLogout = async () => {
    await logout();
    toast.success("تم تسجيل الخروج بنجاح");
    setLocation("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar currentPath={location} />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  إدارة المحتوى
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  إدارة محتوى واجهة المنصة بالكامل
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Settings Button */}
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setLocation("/dashboard/settings")}
                  className="h-9 w-9"
                  title="الإعدادات"
                >
                  <Settings className="w-4 h-4" />
                </Button>

                {/* Logout Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout} 
                  className="hidden sm:flex"
                >
                  <LogOut className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">تسجيل الخروج</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleLogout} 
                  className="sm:hidden h-9 w-9"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container py-8 flex-1">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Construction className="w-8 h-8 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl">قيد التطوير</CardTitle>
              <CardDescription className="text-base">
                هذه الصفحة قيد التطوير حالياً
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                سيتم إضافة ميزات إدارة المحتوى قريباً، والتي ستتيح لك:
              </p>
              <ul className="text-right space-y-2 max-w-md mx-auto">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>تحرير محتوى الصفحة الرئيسية</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>إدارة الصور والوسائط</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>تعديل النصوص والعناوين</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>إدارة الأقسام والمحتوى الديناميكي</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>تخصيص الألوان والتصميم</span>
                </li>
              </ul>
              <Button
                onClick={() => setLocation("/dashboard")}
                className="mt-6"
              >
                العودة إلى لوحة التحكم
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
