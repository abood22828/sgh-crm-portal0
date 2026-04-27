/**
 * WhatsApp Compliance & Security Dashboard
 * لوحة تحكم الامتثال والأمان
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  RefreshCw,
  Search,
  Ban,
  Users,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

export default function WhatsAppCompliance() {
  const [blockPhone, setBlockPhone] = useState("");
  const [blockReason, setBlockReason] = useState<"opt_out" | "spam" | "manual" | "invalid">(
    "manual"
  );
  const [messageToValidate, setMessageToValidate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterReason, setFilterReason] = useState<string>("all");

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

  const handleRefresh = () => {
    securityStatsQuery.refetch();
    auditStatsQuery.refetch();
    blockedPhonesQuery.refetch();
  };

  const handleExportData = () => {
    const data = {
      securityStats: securityStatsQuery.data?.stats,
      auditStats: auditStatsQuery.data?.stats,
      blockedPhones: blockedPhonesQuery.data?.phones,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whatsapp-compliance-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("تم تصدير البيانات بنجاح");
  };

  // Filter blocked phones
  const filteredPhones = blockedPhonesQuery.data?.phones?.filter((phone: any) => {
    const matchesSearch = searchQuery === "" || phone.phone.includes(searchQuery);
    const matchesFilter = filterReason === "all" || phone.reason?.includes(filterReason);
    return matchesSearch && matchesFilter;
  }) || [];

  // Calculate compliance percentage from real data
  const auditStats = auditStatsQuery.data?.stats;
  const totalMessages = auditStats?.totalMessages || 0;
  const errorCount = auditStats?.errorCount || 0;
  const compliantPercentage = totalMessages > 0 
    ? Math.round(((totalMessages - errorCount) / totalMessages) * 100) 
    : 100;
  const nonCompliantPercentage = totalMessages > 0 
    ? Math.round((errorCount / totalMessages) * 100) 
    : 0;

  const complianceData = [
    { name: "متوافق", value: compliantPercentage },
    { name: "غير متوافق", value: nonCompliantPercentage },
  ];

  // Sample data for trend chart (audit logs are in-memory, so using sample data)
  const auditTrendData = [
    { date: "الاثنين", sent: auditStats?.sentMessages || 0, received: auditStats?.receivedMessages || 0, errors: auditStats?.errorCount || 0 },
    { date: "الثلاثاء", sent: auditStats?.sentMessages || 0, received: auditStats?.receivedMessages || 0, errors: auditStats?.errorCount || 0 },
    { date: "الأربعاء", sent: auditStats?.sentMessages || 0, received: auditStats?.receivedMessages || 0, errors: auditStats?.errorCount || 0 },
    { date: "الخميس", sent: auditStats?.sentMessages || 0, received: auditStats?.receivedMessages || 0, errors: auditStats?.errorCount || 0 },
    { date: "الجمعة", sent: auditStats?.sentMessages || 0, received: auditStats?.receivedMessages || 0, errors: auditStats?.errorCount || 0 },
    { date: "السبت", sent: auditStats?.sentMessages || 0, received: auditStats?.receivedMessages || 0, errors: auditStats?.errorCount || 0 },
    { date: "الأحد", sent: auditStats?.sentMessages || 0, received: auditStats?.receivedMessages || 0, errors: auditStats?.errorCount || 0 },
  ];

  return (
    <DashboardLayout pageTitle="الامتثال والأمان" pageDescription="إدارة الامتثال مع معايير Meta والأمان">
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">الامتثال والأمان</h1>
            <p className="text-muted-foreground text-sm">إدارة الامتثال مع معايير Meta والأمان</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? "animate-spin" : ""}`} />
              تحديث
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="w-4 h-4 ml-2" />
              تصدير
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-500" />
                الأرقام المحظورة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securityStatsQuery.data?.stats?.blockedPhones || 0}</div>
              <p className="text-xs text-muted-foreground">رقم محظور</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" />
                طلبات الإلغاء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securityStatsQuery.data?.stats?.optOutCount || 0}</div>
              <p className="text-xs text-muted-foreground">طلب إلغاء</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                الرسائل المرسلة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditStatsQuery.data?.stats?.sentMessages || 0}</div>
              <p className="text-xs text-muted-foreground">رسالة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                الأخطاء
              </CardTitle>
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
                <span className="font-bold">{compliantPercentage}%</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span>غير متوافق</span>
                </div>
                <span className="font-bold">{nonCompliantPercentage}%</span>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  ✅ تم فحص {totalMessages} رسالة ضد معايير Meta
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
              <Select value={blockReason} onValueChange={(value: any) => setBlockReason(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">يدوي</SelectItem>
                  <SelectItem value="opt_out">إلغاء الاشتراك</SelectItem>
                  <SelectItem value="spam">رسائل عشوائية</SelectItem>
                  <SelectItem value="invalid">رقم غير صحيح</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleBlockPhone} disabled={isLoading} className="w-full">
                {isLoading ? "جاري..." : "حظر الرقم"}
              </Button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="بحث برقم الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterReason} onValueChange={setFilterReason}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="فلترة حسب السبب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="manual">يدوي</SelectItem>
                <SelectItem value="opt_out">إلغاء الاشتراك</SelectItem>
                <SelectItem value="spam">رسائل عشوائية</SelectItem>
                <SelectItem value="invalid">رقم غير صحيح</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Blocked Phones List */}
          {filteredPhones.length > 0 ? (
            <div className="mt-6 space-y-2">
              <h3 className="font-semibold">الأرقام المحظورة ({filteredPhones.length}):</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredPhones.map((phone: any) => (
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
          ) : (
            <div className="mt-6 text-center py-8 text-muted-foreground">
              <Ban className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد أرقام محظورة</p>
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
    </DashboardLayout>
  );
}
