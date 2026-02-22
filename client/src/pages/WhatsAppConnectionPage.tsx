import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { QrCode, Smartphone, CheckCircle2, XCircle, Loader2, RefreshCw, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";

export default function WhatsAppConnectionPage() {
  const [isInitializing, setIsInitializing] = useState(false);

  // Queries
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = 
    trpc.whatsapp.connection.status.useQuery(undefined, {
      refetchInterval: 3000, // Poll every 3 seconds
    });

  const { data: qrData, refetch: refetchQR } = 
    trpc.whatsapp.connection.getQR.useQuery(undefined, {
      enabled: statusData?.hasQRCode || false,
      refetchInterval: statusData?.hasQRCode ? 2000 : false, // Poll QR every 2 seconds if available
    });

  // Mutations
  const initializeMutation = trpc.whatsapp.connection.initialize.useMutation({
    onSuccess: () => {
      toast.success("جاري تهيئة WhatsApp...");
      setIsInitializing(true);
      refetchStatus();
      refetchQR();
    },
    onError: (error) => {
      toast.error(`فشل تهيئة WhatsApp: ${error.message}`);
      setIsInitializing(false);
    },
  });

  const disconnectMutation = trpc.whatsapp.connection.disconnect.useMutation({
    onSuccess: () => {
      toast.success("تم قطع الاتصال بنجاح");
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`فشل قطع الاتصال: ${error.message}`);
    },
  });

  // Stop initializing state when ready or has QR
  useEffect(() => {
    if (statusData?.isReady || statusData?.hasQRCode) {
      setIsInitializing(false);
    }
  }, [statusData]);

  const handleInitialize = () => {
    initializeMutation.mutate();
  };

  const handleDisconnect = () => {
    if (confirm("هل أنت متأكد من قطع اتصال WhatsApp؟")) {
      disconnectMutation.mutate();
    }
  };

  const handleRefresh = () => {
    refetchStatus();
    refetchQR();
  };

  const getStatusBadge = () => {
    if (statusLoading) {
      return <Badge variant="secondary">جاري التحقق...</Badge>;
    }
    if (statusData?.isReady) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          <CheckCircle2 className="h-3 w-3 ml-1" />
          متصل
        </Badge>
      );
    }
    if (statusData?.isConnecting) {
      return (
        <Badge variant="secondary">
          <Loader2 className="h-3 w-3 ml-1 animate-spin" />
          جاري الاتصال...
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 ml-1" />
        غير متصل
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50" dir="rtl">
      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">اتصال WhatsApp Web</h1>
                <p className="text-muted-foreground">امسح رمز QR للاتصال بحسابك</p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
              <CardTitle className="text-xl">حالة الاتصال</CardTitle>
              <CardDescription className="text-white/80">
                معلومات الاتصال الحالي بـ WhatsApp Web
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <div className={`p-2 rounded-full ${statusData?.isReady ? 'bg-green-100' : 'bg-muted'}`}>
                    <Power className={`h-5 w-5 ${statusData?.isReady ? 'text-green-600' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الحالة</p>
                    <p className="font-semibold">{statusData?.isReady ? "متصل" : "غير متصل"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <div className={`p-2 rounded-full ${statusData?.isConnecting ? 'bg-blue-100' : 'bg-muted'}`}>
                    <Loader2 className={`h-5 w-5 ${statusData?.isConnecting ? 'text-blue-600 animate-spin' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الاتصال</p>
                    <p className="font-semibold">{statusData?.isConnecting ? "جاري..." : "غير نشط"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <div className={`p-2 rounded-full ${statusData?.hasQRCode ? 'bg-purple-100' : 'bg-muted'}`}>
                    <QrCode className={`h-5 w-5 ${statusData?.hasQRCode ? 'text-purple-600' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">QR Code</p>
                    <p className="font-semibold">{statusData?.hasQRCode ? "متوفر" : "غير متوفر"}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {!statusData?.isReady && !statusData?.isConnecting && (
                  <Button
                    onClick={handleInitialize}
                    disabled={initializeMutation.isPending || isInitializing}
                    className="flex-1 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    {initializeMutation.isPending || isInitializing ? (
                      <>
                        <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                        جاري التهيئة...
                      </>
                    ) : (
                      <>
                        <Power className="h-5 w-5 ml-2" />
                        بدء الاتصال
                      </>
                    )}
                  </Button>
                )}
                {statusData?.isReady && (
                  <Button
                    onClick={handleDisconnect}
                    disabled={disconnectMutation.isPending}
                    variant="destructive"
                    className="flex-1"
                  >
                    {disconnectMutation.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                        جاري قطع الاتصال...
                      </>
                    ) : (
                      <>
                        <PowerOff className="h-5 w-5 ml-2" />
                        قطع الاتصال
                      </>
                    )}
                  </Button>
                )}
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Card */}
          {statusData?.hasQRCode && qrData?.qrCode && (
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="text-xl">امسح رمز QR</CardTitle>
                <CardDescription className="text-white/80">
                  استخدم تطبيق WhatsApp على هاتفك لمسح الرمز
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <div className="bg-white dark:bg-card p-4 rounded-lg shadow-md mb-4">
                    <img
                      src={qrData.qrCode}
                      alt="WhatsApp QR Code"
                      className="w-64 h-64"
                    />
                  </div>
                  <Alert className="bg-blue-50 border-blue-200">
                    <QrCode className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-900">كيفية المسح</AlertTitle>
                    <AlertDescription className="text-blue-800">
                      <ol className="list-decimal list-inside space-y-1 mt-2">
                        <li>افتح تطبيق WhatsApp على هاتفك</li>
                        <li>اضغط على القائمة (⋮) أو الإعدادات</li>
                        <li>اختر "الأجهزة المرتبطة"</li>
                        <li>اضغط على "ربط جهاز"</li>
                        <li>وجّه كاميرا هاتفك نحو هذا الرمز</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Connected Success Card */}
          {statusData?.isReady && (
            <Alert className="bg-green-50 border-green-200 shadow-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-green-900 text-lg">تم الاتصال بنجاح!</AlertTitle>
              <AlertDescription className="text-green-800">
                حسابك على WhatsApp متصل الآن. يمكنك البدء في إرسال واستقبال الرسائل من خلال المنصة.
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions Card */}
          {!statusData?.isReady && !statusData?.isConnecting && !statusData?.hasQRCode && (
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>تعليمات الاتصال</CardTitle>
                <CardDescription>اتبع الخطوات التالية للاتصال بـ WhatsApp Web</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 text-green-700 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">اضغط على "بدء الاتصال"</h3>
                      <p className="text-sm text-muted-foreground">سيتم تهيئة الاتصال وإنشاء رمز QR</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 text-green-700 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">امسح رمز QR</h3>
                      <p className="text-sm text-muted-foreground">استخدم تطبيق WhatsApp على هاتفك لمسح الرمز</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 text-green-700 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">ابدأ المراسلة</h3>
                      <p className="text-sm text-muted-foreground">بعد الاتصال، يمكنك إرسال واستقبال الرسائل مباشرة</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
