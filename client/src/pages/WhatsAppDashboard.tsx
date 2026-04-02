/**
 * WhatsApp Dashboard
 * لوحة تحكم WhatsApp - عرض الإحصائيات والحالة
 */

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Clock, Send, Zap } from "lucide-react";
import { toast } from "sonner";

export default function WhatsAppDashboard() {
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Queries
  const healthQuery = trpc.whatsapp.health.useQuery();
  const normalizePhoneQuery = trpc.whatsapp.normalizePhone.useQuery(
    { phone: testPhone },
    { enabled: testPhone.length > 0 }
  );

  // Mutations
  const sendTextMutation = trpc.whatsapp.sendSimpleText.useMutation();
  const testConnectionMutation = trpc.whatsapp.testConnection.useMutation();

  const handleSendTest = async () => {
    if (!testPhone || !testMessage) {
      toast.error("يرجى إدخال رقم الهاتف والرسالة");
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendTextMutation.mutateAsync({
        phone: testPhone,
        message: testMessage,
        priority: "high",
      });

      if (result.success) {
        toast.success("تم إرسال الرسالة بنجاح!");
        setTestMessage("");
      } else {
        toast.error(result.error || "فشل إرسال الرسالة");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء إرسال الرسالة");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!testPhone) {
      toast.error("يرجى إدخال رقم الهاتف");
      return;
    }

    setIsLoading(true);
    try {
      const result = await testConnectionMutation.mutateAsync({
        phone: testPhone,
      });

      if (result.success) {
        toast.success(result.message || "تم اختبار الاتصال بنجاح!");
      } else {
        toast.error(result.error || "فشل اختبار الاتصال");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء اختبار الاتصال");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">لوحة تحكم WhatsApp</h1>
        <p className="text-muted-foreground">إدارة وإرسال الرسائل عبر WhatsApp</p>
      </div>

      {/* Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            حالة الخدمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthQuery.isLoading ? (
            <div className="text-muted-foreground">جاري التحميل...</div>
          ) : healthQuery.data ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Bot مهيأ:</span>
                <span className="flex items-center gap-2">
                  {healthQuery.data.botReady ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-green-600">نعم</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-red-600">لا</span>
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Queue مهيأ:</span>
                <span className="flex items-center gap-2">
                  {healthQuery.data.queueReady ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-green-600">نعم</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <span className="text-yellow-600">غير متاح</span>
                    </>
                  )}
                </span>
              </div>
              {healthQuery.data.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm font-semibold text-red-800">الأخطاء:</p>
                  <ul className="text-sm text-red-700 mt-2">
                    {healthQuery.data.errors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-red-600">فشل تحميل حالة الخدمة</div>
          )}
        </CardContent>
      </Card>

      {/* Send Test Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            إرسال رسالة اختبار
          </CardTitle>
          <CardDescription>اختبر إرسال الرسائل عبر WhatsApp</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">رقم الهاتف</label>
            <Input
              placeholder="مثال: 967777165305"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="mt-1"
            />
            {normalizePhoneQuery.data && (
              <div className="mt-2 text-sm">
                <span className="text-muted-foreground">الرقم المعياري: </span>
                <span className="font-mono">{normalizePhoneQuery.data.normalized}</span>
                {normalizePhoneQuery.data.isValid ? (
                  <span className="text-green-600 ml-2">✓ صحيح</span>
                ) : (
                  <span className="text-red-600 ml-2">✗ غير صحيح</span>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">الرسالة</label>
            <Textarea
              placeholder="أدخل الرسالة التي تريد إرسالها..."
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="mt-1"
              rows={4}
            />
            <div className="text-xs text-muted-foreground mt-1">
              الأحرف المتبقية: {4096 - testMessage.length}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSendTest}
              disabled={isLoading || !testPhone || !testMessage}
              className="flex-1"
            >
              {isLoading ? "جاري الإرسال..." : "إرسال الرسالة"}
            </Button>
            <Button
              onClick={handleTestConnection}
              disabled={isLoading || !testPhone}
              variant="outline"
            >
              {isLoading ? "جاري الاختبار..." : "اختبار الاتصال"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            إجراءات سريعة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            عرض الرسائل المرسلة
          </Button>
          <Button variant="outline" className="w-full justify-start">
            عرض الرسائل الواردة
          </Button>
          <Button variant="outline" className="w-full justify-start">
            إحصائيات الرسائل
          </Button>
          <Button variant="outline" className="w-full justify-start">
            إدارة القوالب
          </Button>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">معلومات</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>• تم تثبيت مكتبات WhatsApp Cloud API بنجاح</p>
          <p>• نظام Queue مع Bull و Redis متاح</p>
          <p>• معالج Webhook جاهز للاستقبال</p>
          <p>• دعم الرسائل النصية والقوالب والوسائط</p>
        </CardContent>
      </Card>
    </div>
  );
}
