import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, RefreshCw, Cloud, Phone, Shield, MessageCircle, Zap, Info } from "lucide-react";
import { Link } from "wouter";

export default function WhatsAppConnectionPage() {
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = 
    trpc.whatsapp.connection.status.useQuery(undefined, {
      refetchInterval: 30000,
    });

  const handleRefresh = () => {
    refetchStatus();
  };

  const getStatusBadge = () => {
    if (statusLoading) {
      return <Badge variant="secondary" className="text-xs sm:text-sm">جاري التحقق...</Badge>;
    }
    if (statusData?.isReady) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-xs sm:text-sm">
          <CheckCircle2 className="h-3 w-3 ml-1" />
          متصل - Cloud API
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="text-xs sm:text-sm">
        <XCircle className="h-3 w-3 ml-1" />
        غير مُعد
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" dir="rtl">
      <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-4xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 sm:p-3 rounded-xl shadow-lg flex-shrink-0">
                <Cloud className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground truncate">اتصال WhatsApp Cloud API</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">حالة الاتصال بـ WhatsApp Business Cloud API</p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Status Card */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg p-3 sm:p-6">
              <CardTitle className="text-base sm:text-xl">حالة الاتصال</CardTitle>
              <CardDescription className="text-white/80 text-xs sm:text-sm">
                معلومات الاتصال بـ WhatsApp Business Cloud API
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex flex-col items-center gap-1.5 p-2.5 sm:p-4 bg-muted/50 rounded-lg text-center">
                  <div className={`p-1.5 sm:p-2 rounded-full flex-shrink-0 ${statusData?.apiConfigured ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Shield className={`h-4 w-4 sm:h-5 sm:w-5 ${statusData?.apiConfigured ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-sm text-muted-foreground">API</p>
                    <p className="font-semibold text-xs sm:text-base">{statusData?.apiConfigured ? "مُعد" : "غير مُعد"}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2.5 sm:p-4 bg-muted/50 rounded-lg text-center">
                  <div className={`p-1.5 sm:p-2 rounded-full flex-shrink-0 ${statusData?.isReady ? 'bg-green-100' : 'bg-muted'}`}>
                    <Cloud className={`h-4 w-4 sm:h-5 sm:w-5 ${statusData?.isReady ? 'text-green-600' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-sm text-muted-foreground">الحالة</p>
                    <p className="font-semibold text-xs sm:text-base">{statusData?.isReady ? "جاهز" : "غير جاهز"}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2.5 sm:p-4 bg-muted/50 rounded-lg text-center">
                  <div className="p-1.5 sm:p-2 rounded-full flex-shrink-0 bg-blue-100">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-sm text-muted-foreground">الإصدار</p>
                    <p className="font-semibold text-xs sm:text-base">{statusData?.apiVersion || "v21.0"}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2.5 sm:p-4 bg-muted/50 rounded-lg text-center">
                  <div className="p-1.5 sm:p-2 rounded-full flex-shrink-0 bg-purple-100">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-sm text-muted-foreground">الوضع</p>
                    <p className="font-semibold text-xs sm:text-base">Cloud API</p>
                  </div>
                </div>
              </div>

              {statusData?.phoneNumberId && (
                <div className="bg-muted/30 rounded-lg p-3 sm:p-4 mb-4">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">معرف رقم الهاتف (Phone Number ID)</p>
                  <p className="font-mono text-sm sm:text-base font-semibold" dir="ltr">{statusData.phoneNumberId}</p>
                </div>
              )}

              <div className="flex gap-2 sm:gap-3">
                <Button onClick={handleRefresh} variant="outline" className="gap-2 text-xs sm:text-sm h-9 sm:h-10">
                  <RefreshCw className="h-4 w-4" />
                  تحديث الحالة
                </Button>
                <Link href="/dashboard/whatsapp">
                  <Button className="gap-2 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-xs sm:text-sm h-9 sm:h-10">
                    <MessageCircle className="h-4 w-4" />
                    فتح المحادثات
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Connected Success Card */}
          {statusData?.isReady && (
            <Alert className="bg-green-50 border-green-200 shadow-lg">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              <AlertTitle className="text-green-900 text-sm sm:text-lg">WhatsApp Cloud API جاهز!</AlertTitle>
              <AlertDescription className="text-green-800 text-xs sm:text-sm">
                تم تكوين WhatsApp Business Cloud API بنجاح. يمكنك الآن إرسال واستقبال الرسائل عبر المنصة.
              </AlertDescription>
            </Alert>
          )}

          {/* Not Configured Warning */}
          {!statusData?.isReady && !statusLoading && (
            <Alert className="bg-amber-50 border-amber-200 shadow-lg">
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
              <AlertTitle className="text-amber-900 text-sm sm:text-lg">Cloud API غير مُعد</AlertTitle>
              <AlertDescription className="text-amber-800 text-xs sm:text-sm">
                يرجى التأكد من تعيين المتغيرات البيئية التالية:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><code className="bg-amber-100 px-1 rounded">WHATSAPP_PHONE_NUMBER_ID</code> - معرف رقم الهاتف</li>
                  <li><code className="bg-amber-100 px-1 rounded">META_ACCESS_TOKEN</code> - رمز الوصول من Meta</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Info Card */}
          <Card className="shadow-lg border-0">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-base sm:text-xl flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-500" />
                مميزات Cloud API
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                WhatsApp Business Cloud API يوفر ميزات متقدمة
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">إرسال رسائل نصية</p>
                    <p className="text-xs text-muted-foreground">إرسال رسائل مباشرة للعملاء</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">قوالب معتمدة</p>
                    <p className="text-xs text-muted-foreground">إرسال قوالب رسائل معتمدة من Meta</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Webhook تلقائي</p>
                    <p className="text-xs text-muted-foreground">استقبال الرسائل الواردة تلقائياً</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">تتبع حالة الرسائل</p>
                    <p className="text-xs text-muted-foreground">معرفة حالة كل رسالة (مرسلة، مستلمة، مقروءة)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
