import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import CampRegistrationsManagement from "@/components/CampRegistrationsManagement";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Users, CheckCircle2, Clock, XCircle, PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

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

  // Status distribution for pie chart
  const statusData = useMemo(() => {
    if (!registrations) return [];
    
    const statusCounts = {
      pending: registrations.filter((r: any) => r.status === "pending").length,
      contacted: registrations.filter((r: any) => r.status === "contacted").length,
      no_answer: registrations.filter((r: any) => r.status === "no_answer").length,
      confirmed: registrations.filter((r: any) => r.status === "confirmed").length,
      attended: registrations.filter((r: any) => r.status === "attended").length,
      completed: registrations.filter((r: any) => r.status === "completed").length,
      cancelled: registrations.filter((r: any) => r.status === "cancelled").length,
    };

    return [
      { name: "قيد الانتظار", value: statusCounts.pending, color: "#F59E0B" },
      { name: "تم التواصل", value: statusCounts.contacted, color: "#8B5CF6" },
      { name: "لا رد", value: statusCounts.no_answer, color: "#6B7280" },
      { name: "مؤكد", value: statusCounts.confirmed, color: "#10B981" },
      { name: "حضر", value: statusCounts.attended, color: "#3B82F6" },
      { name: "مكتمل", value: statusCounts.completed, color: "#EC4899" },
      { name: "ملغي", value: statusCounts.cancelled, color: "#EF4444" },
    ].filter(item => item.value > 0);
  }, [registrations]);

  // Daily registrations
  const dailyRegistrations = useMemo(() => {
    if (!registrations) return [];
    
    const dateMap = new Map<string, number>();
    registrations.forEach((r: any) => {
      if (r.createdAt) {
        const date = new Date(r.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
      }
    });

    return Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days
  }, [registrations]);

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

        {/* Summary Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Distribution Pie Chart */}
          {statusData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  توزيع الحالات
                </CardTitle>
                <CardDescription>توزيع التسجيلات حسب الحالة</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Daily Registrations Bar Chart */}
          {dailyRegistrations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  التسجيلات اليومية
                </CardTitle>
                <CardDescription>عدد التسجيلات خلال آخر 30 يوم</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyRegistrations}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{ fill: "#6B7280" }} />
                    <YAxis tick={{ fill: "#6B7280" }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1F2937", border: "none", borderRadius: "8px" }}
                      itemStyle={{ color: "#F3F4F6" }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#3B82F6" name="عدد التسجيلات" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
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
