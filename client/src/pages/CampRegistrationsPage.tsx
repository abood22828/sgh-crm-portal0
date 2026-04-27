import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import CampRegistrationsManagement from "@/components/CampRegistrationsManagement";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Users, CheckCircle2, Clock, XCircle } from "lucide-react";

export default function CampRegistrationsPage() {
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { from, to };
  });

  const { data: registrations } = trpc.campRegistrations.list.useQuery();

  // Calculate statistics
  const stats = registrations ? {
    total: registrations.length,
    pending: registrations.filter((r: any) => r.status === "pending").length,
    confirmed: registrations.filter((r: any) => r.status === "confirmed" || r.status === "attended" || r.status === "completed").length,
    attended: registrations.filter((r: any) => r.status === "attended" || r.status === "completed").length,
    cancelled: registrations.filter((r: any) => r.status === "cancelled").length,
  } : { total: 0, pending: 0, confirmed: 0, attended: 0, cancelled: 0 };

  return (
    <DashboardLayout
      pageTitle="تسجيلات المخيمات"
      pageDescription="إدارة ومتابعة تسجيلات المخيمات الطبية"
    >
      <div className="space-y-4" dir="rtl">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                إجمالي التسجيلات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                قيد الانتظار
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                مؤكد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                ملغي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            </CardContent>
          </Card>
        </div>

        <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
        <CampRegistrationsManagement 
          onPendingCountChange={() => {}} 
          dateRange={dateRange}
        />
      </div>
    </DashboardLayout>
  );
}
