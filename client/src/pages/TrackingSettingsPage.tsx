import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  Copy,
  ExternalLink,
  Zap,
  Eye,
  BarChart3,
  Shield,
  Code2,
  Play,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("تم النسخ!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 rounded hover:bg-muted transition-colors"
      title="نسخ"
    >
      {copied ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
}

interface EnvVarRowProps {
  name: string;
  description: string;
  example?: string;
  required?: boolean;
  side?: "frontend" | "backend" | "both";
}

function EnvVarRow({ name, description, example, required = false, side = "backend" }: EnvVarRowProps) {
  const sideLabel: Record<string, string> = {
    frontend: "Frontend",
    backend: "Backend",
    both: "Frontend + Backend",
  };
  const sideColor: Record<string, string> = {
    frontend: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    backend: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    both: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 py-3 border-b last:border-0">
      <div className="flex items-center gap-2 min-w-0 sm:w-64 flex-shrink-0">
        <code className="text-xs font-mono bg-muted px-2 py-1 rounded break-all">{name}</code>
        <CopyButton value={name} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{description}</p>
        {example && (
          <p className="text-xs text-muted-foreground mt-1 font-mono">مثال: {example}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sideColor[side]}`}>
          {sideLabel[side]}
        </span>
        {required ? (
          <Badge variant="destructive" className="text-xs">مطلوب</Badge>
        ) : (
          <Badge variant="outline" className="text-xs">اختياري</Badge>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrackingSettingsPage() {
  // Detect which env vars are configured (frontend-accessible ones only)
  const pixelId = import.meta.env.VITE_META_PIXEL_ID;
  const isPixelConfigured = !!pixelId && pixelId !== "YOUR_PIXEL_ID";
  const [isTesting, setIsTesting] = useState(false);

  const handleTestPixel = async () => {
    if (!isPixelConfigured) {
      toast.error("Meta Pixel غير مُهيَّأ. يرجى إضافة VITE_META_PIXEL_ID");
      return;
    }

    setIsTesting(true);
    try {
      // Send a test event to Meta Pixel
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'TestEvent', {
          test_event_code: import.meta.env.VITE_META_TEST_EVENT_CODE || 'TEST12345'
        });
        toast.success("تم إرسال حدث اختبار إلى Meta Pixel");
      } else {
        toast.error("Meta Pixel غير محمّل. يرجى التحقق من التكوين");
      }
    } catch (error) {
      toast.error("فشل إرسال حدث الاختبار");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <DashboardLayout
      pageTitle="إعدادات التتبع والتحويل"
      pageDescription="إدارة Meta Pixel وFacebook Conversions API وأدوات التتبع"
    >
      <div className="container py-6 space-y-6">

        {/* ── Status Overview ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isPixelConfigured ? "bg-green-100 dark:bg-green-900/30" : "bg-yellow-100 dark:bg-yellow-900/30"}`}>
                  <Eye className={`h-5 w-5 ${isPixelConfigured ? "text-green-600" : "text-yellow-600"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">Meta Pixel</p>
                  <p className={`text-xs ${isPixelConfigured ? "text-green-600" : "text-yellow-600"}`}>
                    {isPixelConfigured ? `مُفعَّل (${pixelId})` : "غير مُهيَّأ"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Conversions API</p>
                  <p className="text-xs text-muted-foreground">يتطلب إعداد Backend</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">BI Analytics</p>
                  <p className="text-xs text-green-600">مُفعَّل</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Event Statistics ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              إحصائيات الأحداث المُرسَلة
            </CardTitle>
            <CardDescription>
              ملخص الأحداث التي تم إرسالها إلى Meta Pixel و Conversions API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">PageView</span>
                </div>
                <p className="text-2xl font-bold">—</p>
                <p className="text-xs text-muted-foreground">عرض الصفحة</p>
              </div>
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">ViewContent</span>
                </div>
                <p className="text-2xl font-bold">—</p>
                <p className="text-xs text-muted-foreground">مشاهدة المحتوى</p>
              </div>
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Lead</span>
                </div>
                <p className="text-2xl font-bold">—</p>
                <p className="text-xs text-muted-foreground">نماذج الحجز</p>
              </div>
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">CompleteRegistration</span>
                </div>
                <p className="text-2xl font-bold">—</p>
                <p className="text-xs text-muted-foreground">التسجيل في المخيمات</p>
              </div>
            </div>

            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>ملاحظة:</strong> إحصائيات الأحداث التفصيلية متاحة في <a href="/dashboard/bi" className="text-blue-600 hover:underline">صفحة تحليلات الأعمال (BI)</a> و <a href="https://www.facebook.com/events_manager2" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Meta Events Manager</a>.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* ── Meta Pixel Setup ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              إعداد Meta Pixel (Client-Side)
            </CardTitle>
            <CardDescription>
              يُرسل أحداث التتبع من المتصفح مباشرةً إلى Meta عند تفاعل المستخدم مع الصفحة.
              يعمل فقط عند موافقة المستخدم على ملفات تعريف الارتباط التسويقية.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>الأحداث المُرسَلة تلقائياً</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                  <li><strong>PageView</strong> — عند كل تحميل صفحة</li>
                  <li><strong>ViewContent</strong> — عند مشاهدة صفحة طبيب أو عرض أو مخيم</li>
                  <li><strong>Lead</strong> — عند إرسال نموذج حجز بنجاح</li>
                  <li><strong>InitiateCheckout</strong> — عند بدء ملء نموذج الحجز</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-1">
              <h4 className="text-sm font-semibold">المتغيرات البيئية المطلوبة:</h4>
              <div className="border rounded-lg divide-y">
                <EnvVarRow
                  name="VITE_META_PIXEL_ID"
                  description="معرّف Meta Pixel الخاص بحسابك الإعلاني"
                  example="1234567890123456"
                  required
                  side="frontend"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleTestPixel} disabled={isTesting || !isPixelConfigured}>
                <Play className="h-4 w-4 mr-2" />
                {isTesting ? "جاري الاختبار..." : "اختبار Pixel"}
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://www.facebook.com/events_manager2/list/pixel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  فتح Meta Events Manager
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── CAPI Setup ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              إعداد Facebook Conversions API (Server-Side)
            </CardTitle>
            <CardDescription>
              يُرسل أحداث التحويل من الخادم مباشرةً إلى Meta، مما يضمن دقة التتبع حتى عند استخدام
              Ad Blockers أو رفض ملفات تعريف الارتباط. يعمل بالتوازي مع Pixel لتقليل التكرار.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle>الأحداث المُرسَلة تلقائياً</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                  <li><strong>Lead</strong> — عند إرسال نموذج حجز موعد طبيب</li>
                  <li><strong>Lead</strong> — عند إرسال نموذج طلب عرض طبي</li>
                  <li><strong>CompleteRegistration</strong> — عند التسجيل في مخيم طبي</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>تنبيه: البيانات الحساسة</AlertTitle>
              <AlertDescription>
                يقوم الخادم بتشفير (Hash) بيانات المريض (الاسم، الهاتف، البريد) باستخدام SHA-256
                قبل إرسالها إلى Meta. لا تُرسَل البيانات الخام أبداً.
              </AlertDescription>
            </Alert>

            <div className="space-y-1">
              <h4 className="text-sm font-semibold">المتغيرات البيئية المطلوبة:</h4>
              <div className="border rounded-lg divide-y">
                <EnvVarRow
                  name="META_ACCESS_TOKEN"
                  description="رمز الوصول للـ Conversions API من Meta Business Manager"
                  example="EAABsbCS...ZAAA"
                  required
                  side="backend"
                />
                <EnvVarRow
                  name="META_PIXEL_ID"
                  description="معرّف Meta Pixel (نفس قيمة VITE_META_PIXEL_ID)"
                  example="1234567890123456"
                  required
                  side="backend"
                />
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                كيفية الحصول على Access Token
              </h4>
              <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                <li>افتح <strong>Meta Business Manager</strong> → Events Manager</li>
                <li>اختر الـ Pixel الخاص بك → Settings</li>
                <li>انتقل إلى <strong>Conversions API</strong> → Generate Access Token</li>
                <li>انسخ الرمز وأضفه كـ <code className="bg-background px-1 rounded">META_ACCESS_TOKEN</code> في إعدادات المشروع</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://www.facebook.com/events_manager2/list/pixel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  فتح Events Manager
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://developers.facebook.com/docs/marketing-api/conversions-api/get-started"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  توثيق CAPI
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Cookie Consent ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              إعدادات موافقة ملفات تعريف الارتباط
            </CardTitle>
            <CardDescription>
              يتحكم شريط الموافقة في تفعيل أدوات التتبع بناءً على اختيار المستخدم.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">أساسية (Essential)</span>
                </div>
                <p className="text-xs text-muted-foreground">دائماً مُفعَّلة — تشغيل الموقع</p>
              </div>
              <div className="border rounded-lg p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">تحليلية (Analytics)</span>
                </div>
                <p className="text-xs text-muted-foreground">تتبع الزيارات والمصادر في BI</p>
              </div>
              <div className="border rounded-lg p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">تسويقية (Marketing)</span>
                </div>
                <p className="text-xs text-muted-foreground">Meta Pixel وإعادة الاستهداف</p>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>ملاحظة:</strong> Facebook Conversions API (Server-Side) يعمل بغض النظر عن موافقة
                ملفات تعريف الارتباط لأنه يعمل من الخادم. لكن يجب الإشارة إلى ذلك في سياسة الخصوصية
                (المتوفرة على <code className="bg-muted px-1 rounded">/privacy-policy</code>).
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* ── All Env Vars Summary ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-orange-600" />
              ملخص جميع المتغيرات البيئية للتتبع
            </CardTitle>
            <CardDescription>
              أضف هذه المتغيرات في إعدادات Secrets في لوحة التحكم أو ملف <code>.env</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg divide-y">
              <EnvVarRow
                name="VITE_META_PIXEL_ID"
                description="معرّف Meta Pixel — يُستخدم في Frontend لتحميل سكريبت الـ Pixel"
                example="1234567890123456"
                required
                side="frontend"
              />
              <EnvVarRow
                name="META_PIXEL_ID"
                description="معرّف Meta Pixel — يُستخدم في Backend لإرسال أحداث CAPI"
                example="1234567890123456"
                required
                side="backend"
              />
              <EnvVarRow
                name="META_ACCESS_TOKEN"
                description="رمز وصول Conversions API من Meta Business Manager"
                example="EAABsbCS...ZAAA"
                required
                side="backend"
              />
              <EnvVarRow
                name="META_TEST_EVENT_CODE"
                description="كود الاختبار من Events Manager لاختبار الأحداث قبل الإطلاق"
                example="TEST12345"
                side="backend"
              />
              <EnvVarRow
                name="FACEBOOK_PAGE_ID"
                description="معرّف صفحة Facebook لجلب إحصائيات الصفحة في لوحة التحكم"
                example="123456789012345"
                side="backend"
              />
              <EnvVarRow
                name="INSTAGRAM_BUSINESS_ACCOUNT_ID"
                description="معرّف حساب Instagram Business لجلب إحصائيات المتابعين"
                example="17841400000000000"
                side="backend"
              />
            </div>

            <Separator className="my-4" />

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold mb-2">نموذج ملف .env</h4>
              <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">
{`# Meta Pixel (Frontend)
VITE_META_PIXEL_ID=1234567890123456

# Facebook Conversions API (Backend)
META_PIXEL_ID=1234567890123456
META_ACCESS_TOKEN=EAABsbCS...ZAAA
META_TEST_EVENT_CODE=TEST12345

# Meta Graph API (Social Stats)
FACEBOOK_PAGE_ID=123456789012345
INSTAGRAM_BUSINESS_ACCOUNT_ID=17841400000000000`}
              </pre>
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
