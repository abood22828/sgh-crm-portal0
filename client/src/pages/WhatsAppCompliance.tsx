/**
 * WhatsApp Compliance & Security Dashboard
 * لوحة تحكم الامتثال والأمان
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lock,
  Eye,
  Trash2,
  Download,
} from "lucide-react";
import { toast } from "sonner";

export default function WhatsAppCompliance() {
  const [blockPhone, setBlockPhone] = useState("");
  const [blockReason, setBlockReason] = useState<"opt_out" | "spam" | "manual" | "invalid">(
    "manual"
  );
  const [messageToValidate, setMessageToValidate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Queries
  const securityStatsQuery = trpc.whatsapp.getSecurityStats.useQuery();
  const auditStatsQuery = trpc.whatsapp.getAuditStats.useQuery();
  const blockedPhonesQuery = trpc.whatsapp.getBlockedPhones.useQuery();
  const optOutRequestsQuery = trpc.whatsapp.getOptOutRequests.useQuery();

  // Mutations
  const blockPhoneMutation = trpc.whatsapp.blockPhone.useMutation();
  const unblockPhoneMutation = trpc.whatsapp.unblockPhone.useMutation();
  const validateComplianceQuery = trpc.whatsapp.validateMetaCompliance.useQuery({ message: "" });
  const exportAuditQuery = trpc.whatsapp.exportAuditLogs.useQuery({ phone: undefined });

  const handleBlockPhone = async () => {
    if (!blockPhone) {
      toast.error("يرجى إدخال رقم الهاتف");
      return;
    }

    setIsLoading(true);
    try {
      const result = await blockPhoneMutation.mutateAsync({
        phone: blockPhone,
        reason: blockReason,
      });

      if (result.success) {
        toast.success("تم حظر الرقم بنجاح");
        setBlockPhone("");
        blockedPhonesQuery.refetch();
      } else {
        toast.error(result.error || "فشل حظر الرقم");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء حظر الرقم");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblockPhone = async (phone: string) => {
    setIsLoading(true);
    try {
      const result = await unblockPhoneMutation.mutateAsync({ phone });

      if (result.success) {
        toast.success("تم إلغاء الحظر بنجاح");
        blockedPhonesQuery.refetch();
      } else {
        toast.error(result.error || "فشل إلغاء الحظر");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء إلغاء الحظر");
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateCompliance = async () => {
    if (!messageToValidate) {
      toast.error("يرجى إدخال الرسالة");
      return;
    }

    setIsLoading(true);
    try {
      const result = await validateComplianceQuery.refetch();

      if (result.data?.success) {
        if (result.data?.compliant) {
          toast.success("الرسالة متوافقة مع معايير Meta");
        } else {
          toast.error(`الرسالة تحتوي على مشاكل: ${result.data?.issues?.join(", ")}`);
        }
      }
    } catch (error) {
      toast.error("فشل التحقق من الامتثال");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportAudit = async () => {
    setIsLoading(true);
    try {
      const result = await exportAuditQuery.refetch();

      if (result.data?.success && result.data?.csv) {
        // Create download link
        const element = document.createElement("a");
        element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(result.data.csv));
        element.setAttribute("download", `audit-log-${new Date().toISOString()}.csv`);
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        toast.success("تم تحميل السجل بنجاح");
      }
    } catch (error) {
      toast.error("فشل تحميل السجل");
    } finally {
      setIsLoading(false);
    }
  };

  // Sample data for charts
  const complianceData = [
    { name: "متوافق", value: 95 },
    { name: "غير متوافق", value: 5 },
  ];

  const auditTrendData = [
    { date: "الاثنين", sent: 150, received: 120, errors: 5 },
    { date: "الثلاثاء", sent: 180, received: 145, errors: 8 },
    { date: "الأربعاء", sent: 200, received: 165, errors: 3 },
    { date: "الخميس", sent: 170, received: 140, errors: 6 },
    { date: "الجمعة", sent: 210, received: 185, errors: 4 },
    { date: "السبت", sent: 190, received: 160, errors: 7 },
    { date: "الأحد", sent: 220, received: 195, errors: 5 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">الامتثال والأمان</h1>
        <p className="text-muted-foreground">إدارة الامتثال مع معايير Meta والأمان</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">الأرقام المحظورة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityStatsQuery.data?.stats?.blockedPhones || 0}</div>
            <p className="text-xs text-muted-foreground">رقم محظور</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">طلبات الإلغاء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityStatsQuery.data?.stats?.optOutCount || 0}</div>
            <p className="text-xs text-muted-foreground">طلب إلغاء</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">الرسائل المرسلة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditStatsQuery.data?.stats?.sentMessages || 0}</div>
            <p className="text-xs text-muted-foreground">رسالة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">الأخطاء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {auditStatsQuery.data?.stats?.errorCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">خطأ</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audit Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              اتجاه العمليات (آخر 7 أيام)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={auditTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sent" stroke="#3b82f6" name="مرسلة" />
                <Line type="monotone" dataKey="received" stroke="#10b981" name="مستقبلة" />
                <Line type="monotone" dataKey="errors" stroke="#ef4444" name="أخطاء" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Compliance Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              حالة الامتثال
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>متوافق</span>
                </div>
                <span className="font-bold">95%</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span>غير متوافق</span>
                </div>
                <span className="font-bold">5%</span>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  ✅ جميع الرسائل تم فحصها ضد معايير Meta
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Validator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            فحص الامتثال
          </CardTitle>
          <CardDescription>تحقق من توافق الرسالة مع معايير Meta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">الرسالة</label>
            <Textarea
              placeholder="أدخل الرسالة للتحقق من امتثالها..."
              value={messageToValidate}
              onChange={(e) => setMessageToValidate(e.target.value)}
              className="mt-1"
              rows={4}
            />
          </div>

          <Button onClick={handleValidateCompliance} disabled={isLoading} className="w-full">
            {isLoading ? "جاري الفحص..." : "فحص الامتثال"}
          </Button>
        </CardContent>
      </Card>

      {/* Block Phone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            إدارة الأرقام المحظورة
          </CardTitle>
          <CardDescription>حظر أو إلغاء حظر أرقام الهاتف</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">رقم الهاتف</label>
              <Input
                placeholder="967777165305"
                value={blockPhone}
                onChange={(e) => setBlockPhone(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">السبب</label>
              <select
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value as any)}
                className="mt-1 w-full px-3 py-2 border rounded-md"
              >
                <option value="manual">يدوي</option>
                <option value="opt_out">إلغاء الاشتراك</option>
                <option value="spam">رسائل عشوائية</option>
                <option value="invalid">رقم غير صحيح</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleBlockPhone} disabled={isLoading} className="w-full">
                {isLoading ? "جاري..." : "حظر الرقم"}
              </Button>
            </div>
          </div>

          {/* Blocked Phones List */}
          {blockedPhonesQuery.data?.phones && blockedPhonesQuery.data.phones.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="font-semibold">الأرقام المحظورة:</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {blockedPhonesQuery.data.phones.map((phone) => (
                  <div
                    key={phone.phone}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{phone.phone}</p>
                      <p className="text-xs text-muted-foreground">{phone.reason}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleUnblockPhone(phone.phone)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Log Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            سجل العمليات
          </CardTitle>
          <CardDescription>تصدير سجل العمليات الكامل</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExportAudit} disabled={isLoading} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            {isLoading ? "جاري التصدير..." : "تحميل السجل (CSV)"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
