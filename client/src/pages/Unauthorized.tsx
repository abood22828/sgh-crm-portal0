import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";

export default function Unauthorized() {
  const [, setLocation] = useLocation();
  
  // Get reason from URL params
  const params = new URLSearchParams(window.location.search);
  const reason = params.get('reason');
  
  let message = "عذراً، ليس لديك صلاحية للوصول إلى لوحة التحكم.";
  
  if (reason === 'no_email') {
    message = "لم يتم العثور على بريد إلكتروني في حسابك.";
  } else if (reason === 'not_allowed') {
    message = "حسابك غير مصرح له بالوصول إلى هذا النظام.";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 p-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">
              غير مصرح بالدخول
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {message}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-foreground text-center">
              إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع مدير النظام للحصول على الصلاحيات المطلوبة.
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
