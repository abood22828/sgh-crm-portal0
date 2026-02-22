import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";

export default function ContentManagementPage() {
  const [, setLocation] = useLocation();

  return (
    <DashboardLayout
      pageTitle="إدارة المحتوى"
      pageDescription="إدارة محتوى واجهة المنصة بالكامل"
    >
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
            <p className="text-muted-foreground">
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
    </DashboardLayout>
  );
}
