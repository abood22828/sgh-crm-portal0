import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Settings, Construction } from "lucide-react";

export default function SettingsPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/assets/new-logo.png" 
                alt="المستشفى السعودي الألماني" 
                className="h-12"
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">الإعدادات</h1>
                <p className="text-sm text-muted-foreground">إدارة إعدادات النظام</p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setLocation("/dashboard")}
            >
              <ArrowRight className="ml-2 h-4 w-4" />
              العودة للوحة التحكم
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-dashed">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Settings className="h-24 w-24 text-muted-foreground animate-spin-slow" />
                  <Construction className="h-12 w-12 text-orange-500 absolute -bottom-2 -right-2" />
                </div>
              </div>
              <CardTitle className="text-3xl mb-2">صفحة الإعدادات قيد التطوير</CardTitle>
              <CardDescription className="text-lg">
                نعمل حالياً على تطوير صفحة الإعدادات لتوفير تجربة أفضل لك
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">الميزات القادمة:</h3>
                <ul className="text-right text-blue-800 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">•</span>
                    إدارة الحساب الشخصي
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">•</span>
                    تخصيص إعدادات الإشعارات
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">•</span>
                    إدارة الصلاحيات والمستخدمين
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">•</span>
                    تكامل مع الأنظمة الخارجية
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">•</span>
                    إعدادات النسخ الاحتياطي والأمان
                  </li>
                </ul>
              </div>
              
              <Button 
                size="lg"
                onClick={() => setLocation("/dashboard")}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                <ArrowRight className="ml-2 h-5 w-5" />
                العودة للوحة التحكم
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
