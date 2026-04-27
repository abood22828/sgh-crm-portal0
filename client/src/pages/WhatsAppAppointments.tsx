/**
 * WhatsApp Appointments & Notifications Page
 * صفحة إدارة إشعارات WhatsApp للمواعيد والتسجيلات والعروض
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Send,
  RefreshCw,
  CheckCircle,
  XCircle,
  Phone,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Loader2,
  Download,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

const entityTypeLabels: Record<string, string> = {
  appointment: "موعد طبي",
  camp_registration: "تسجيل مخيم",
  offer_lead: "حجز عرض",
};

const notificationTypeLabels: Record<string, string> = {
  booking_confirmation: "تأكيد الحجز",
  reminder_24h: "تذكير 24 ساعة",
  reminder_1h: "تذكير ساعة",
  post_visit_followup: "متابعة بعد الزيارة",
  cancellation: "إلغاء",
  status_update: "تحديث الحالة",
  custom: "مخصص",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  sent: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  read: "bg-purple-100 text-purple-800",
  failed: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  sent: "مرسلة",
  delivered: "تم التسليم",
  read: "مقروءة",
  failed: "فشل",
};

export default function WhatsAppAppointments() {
  const [filterEntityType, setFilterEntityType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const sendConfirmationMutation = trpc.whatsapp.sendAppointmentConfirmation.useMutation();

  // جلب إحصائيات الإشعارات
  const notificationStatsQuery = trpc.whatsapp.getNotificationStats.useQuery();

  // جلب سجلات الإشعارات مع فلترة
  const logsQuery = trpc.whatsapp.getNotificationLogs.useQuery({
    entityType: filterEntityType !== "all" ? (filterEntityType as any) : undefined,
    status: filterStatus !== "all" ? (filterStatus as any) : undefined,
    limit,
    offset,
  });

  const stats = notificationStatsQuery.data?.stats;
  const logs = logsQuery.data?.logs || [];
  const total = logsQuery.data?.total || 0;

  const handleRefresh = () => {
    logsQuery.refetch();
    notificationStatsQuery.refetch();
  };

  const handleExport = () => {
    const data = {
      stats: notificationStatsQuery.data?.stats,
      logs: logsQuery.data?.logs,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whatsapp-notifications-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("تم تصدير البيانات بنجاح");
  };

  const formatDate = (dateStr: string | Date | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" });
  };

  return (
    <DashboardLayout pageTitle="سجل إشعارات WhatsApp" pageDescription="تتبع جميع الإشعارات المرسلة للمواعيد والتسجيلات والعروض">
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">سجل إشعارات WhatsApp</h1>
            <p className="text-muted-foreground text-sm">تتبع جميع الإشعارات المرسلة للمواعيد والتسجيلات والعروض</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={logsQuery.isFetching}>
              <RefreshCw className={`w-4 h-4 ml-2 ${logsQuery.isFetching ? "animate-spin" : ""}`} />
              تحديث
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 ml-2" />
              تصدير
            </Button>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              إجمالي الإشعارات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notificationStatsQuery.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (stats?.total || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              مرسلة بنجاح
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {notificationStatsQuery.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (stats?.sent || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              قيد الانتظار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {notificationStatsQuery.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (stats?.pending || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              فشل الإرسال
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {notificationStatsQuery.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (stats?.failed || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* توزيع حسب النوع */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                توزيع حسب نوع الكيان
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.byEntity || {}).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm">{entityTypeLabels[type] || type}</span>
                    <Badge variant="outline">{count as number}</Badge>
                  </div>
                ))}
                {Object.keys(stats.byEntity || {}).length === 0 && (
                  <p className="text-sm text-muted-foreground">لا توجد بيانات بعد</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Send className="w-4 h-4" />
                توزيع حسب نوع الإشعار
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.byType || {}).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm">{notificationTypeLabels[type] || type}</span>
                    <Badge variant="outline">{count as number}</Badge>
                  </div>
                ))}
                {Object.keys(stats.byType || {}).length === 0 && (
                  <p className="text-sm text-muted-foreground">لا توجد بيانات بعد</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            سجل الإشعارات المرسلة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-3">
            <Select value={filterEntityType} onValueChange={(v) => { setFilterEntityType(v); setOffset(0); }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="نوع الكيان" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="appointment">مواعيد طبية</SelectItem>
                <SelectItem value="camp_registration">تسجيلات مخيمات</SelectItem>
                <SelectItem value="offer_lead">حجوزات عروض</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setOffset(0); }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="sent">مرسلة</SelectItem>
                <SelectItem value="delivered">تم التسليم</SelectItem>
                <SelectItem value="read">مقروءة</SelectItem>
                <SelectItem value="failed">فشل</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logs Table */}
          {logsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد سجلات إشعارات بعد</p>
              <p className="text-sm mt-1">ستظهر هنا الإشعارات المرسلة تلقائياً عند إنشاء المواعيد والتسجيلات</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log: any) => (
                <div key={log.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{log.recipientName || "—"}</span>
                        <Badge variant="outline" className="text-xs">
                          {entityTypeLabels[log.entityType] || log.entityType}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {notificationTypeLabels[log.notificationType] || log.notificationType}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span dir="ltr">{log.phone}</span>
                        {log.templateName && (
                          <>
                            <span>•</span>
                            <span>قالب: {log.templateName}</span>
                          </>
                        )}
                      </div>
                      {log.errorMessage && (
                        <p className="text-xs text-red-500 mt-1">{log.errorMessage}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[log.status] || "bg-gray-100 text-gray-800"}`}>
                        {statusLabels[log.status] || log.status}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDate(log.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-muted-foreground">
                عرض {offset + 1} - {Math.min(offset + limit, total)} من {total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                >
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset + limit >= total}
                  onClick={() => setOffset(offset + limit)}
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  );
}
