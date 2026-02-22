import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Settings, Construction } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function SettingsPage() {
  const [, setLocation] = useLocation();

  return (
    <DashboardLayout
      pageTitle="الإعدادات"
      pageDescription="إدارة إعدادات النظام"
    >
      <main className="container py-6 sm:py-8 md:py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-dashed">
            <CardHeader className="text-center pb-6 sm:pb-8 px-4 sm:px-6">
              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="relative">
                  <Settings className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-muted-foreground" />
                  <Construction className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-orange-500 absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2" />
                </div>
              </div>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl mb-2">صفحة الإعدادات قيد التطوير</CardTitle>
              <CardDescription className="text-sm sm:text-base md:text-lg">
                نعمل حالياً على تطوير صفحة الإعدادات لتوفير تجربة أفضل لك
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center px-4 sm:px-6">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 sm:p-6 mb-6">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 text-sm sm:text-base">الميزات القادمة:</h3>
                <ul className="text-right text-blue-800 dark:text-blue-400 space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500 flex-shrink-0">•</span>
                    إدارة الحساب الشخصي
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500 flex-shrink-0">•</span>
                    تخصيص إعدادات الإشعارات
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500 flex-shrink-0">•</span>
                    إدارة الصلاحيات والمستخدمين
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500 flex-shrink-0">•</span>
                    تكامل مع الأنظمة الخارجية
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500 flex-shrink-0">•</span>
                    إعدادات النسخ الاحتياطي والأمان
                  </li>
                </ul>
              </div>
              <Button 
                size="lg"
                onClick={() => setLocation("/dashboard")}
                className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                <ArrowRight className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                العودة للوحة التحكم
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </DashboardLayout>
  );
}
