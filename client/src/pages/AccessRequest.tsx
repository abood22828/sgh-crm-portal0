import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, Home } from "lucide-react";

export default function AccessRequest() {
  const [, setLocation] = useLocation();
  
  // Get email from URL params
  const params = new URLSearchParams(window.location.search);
  const email = params.get('email');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">
              تم إرسال طلب التصريح
            </CardTitle>
            <CardDescription className="text-base mt-2">
              تم تسجيل طلبك بنجاح
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-foreground">
                <p className="font-semibold mb-1">طلبك قيد المراجعة</p>
                <p>سيتم مراجعة طلبك من قبل فريق الإدارة وسنقوم بإشعارك عبر البريد الإلكتروني فور الموافقة على الطلب.</p>
              </div>
            </div>
          </div>

          {email && (
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-sm text-muted-foreground">البريد الإلكتروني المسجل:</p>
              <p className="text-sm font-medium text-foreground mt-1" dir="ltr">{email}</p>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-foreground text-center">
              عادة ما تستغرق عملية المراجعة من 24 إلى 48 ساعة. شكراً لصبرك.
            </p>
          </div>

          <Button
            onClick={() => setLocation("/")}
            className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#10B981] hover:from-[#0284C7] hover:to-[#059669]"
          >
            <Home className="mr-2 h-4 w-4" />
            العودة إلى الصفحة الرئيسية
          </Button>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>المستشفى السعودي الألماني - صنعاء</p>
            <p className="mt-1">نرعاكم كأهالينا</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
