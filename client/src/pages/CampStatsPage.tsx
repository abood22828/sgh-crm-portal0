/**
 * CampStatsPage - صفحة تقارير إحصائية للمخيمات
 * Camp statistics and reports page
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Users, Calendar, Activity, PieChart as PieChartIcon, ArrowRight } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";

export default function CampStatsPage() {
  const [, setLocation] = useLocation();
  const [selectedCamp, setSelectedCamp] = useState<string>("all");
  
  const { data: camps, isLoading: campsLoading } = trpc.camps.getAll.useQuery();
  const { data: registrations, isLoading: registrationsLoading } = trpc.campRegistrations.list.useQuery();

  if (campsLoading || registrationsLoading) {
    return (
      <DashboardLayout
      pageTitle="إحصائيات المخيمات"
      pageDescription="تقارير وإحصائيات شاملة للمخيمات">
        <div className="flex items-center justify-center min-h-screen" dir="rtl">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Filter registrations by selected camp
  const filteredRegistrations = selectedCamp === "all" 
    ? registrations || []
    : (registrations || []).filter((r: any) => r.campId.toString() === selectedCamp);

  // Calculate statistics
  const totalRegistrations = filteredRegistrations.length;
  const pendingCount = filteredRegistrations.filter((r: any) => r.status === "pending").length;
  const confirmedCount = filteredRegistrations.filter((r: any) => r.status === "confirmed").length;
  const attendedCount = filteredRegistrations.filter((r: any) => r.status === "attended").length;
  const cancelledCount = filteredRegistrations.filter((r: any) => r.status === "cancelled").length;

  // Status distribution for pie chart
  const statusData = [
    { name: "قيد الانتظار", value: pendingCount, color: "#FFA500" },
    { name: "مؤكد", value: confirmedCount, color: "#00A651" },
    { name: "حضر", value: attendedCount, color: "#0066CC" },
    { name: "ملغي", value: cancelledCount, color: "#DC3545" },
  ].filter(item => item.value > 0);

  // Age distribution
  const ageGroups = {
    "0-18": 0,
    "19-35": 0,
    "36-50": 0,
    "51-65": 0,
    "65+": 0,
  };

  filteredRegistrations.forEach((r: any) => {
    if (r.age) {
      if (r.age <= 18) ageGroups["0-18"]++;
      else if (r.age <= 35) ageGroups["19-35"]++;
      else if (r.age <= 50) ageGroups["36-50"]++;
      else if (r.age <= 65) ageGroups["51-65"]++;
      else ageGroups["65+"]++;
    }
  });

  const ageData = Object.entries(ageGroups)
    .map(([name, value]) => ({ name, value }))
    .filter(item => item.value > 0);

  // Popular procedures
  const procedureCounts: Record<string, number> = {};
  filteredRegistrations.forEach((r: any) => {
    if (r.procedures) {
      try {
        const procs = JSON.parse(r.procedures);
        if (Array.isArray(procs)) {
          procs.forEach(proc => {
            procedureCounts[proc] = (procedureCounts[proc] || 0) + 1;
          });
        } else if (typeof procs === "string") {
          procedureCounts[procs] = (procedureCounts[procs] || 0) + 1;
        }
      } catch {
        // If not JSON, treat as single procedure
        procedureCounts[r.procedures] = (procedureCounts[r.procedures] || 0) + 1;
      }
    }
  });

  const procedureData = Object.entries(procedureCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 procedures

  // Registrations by source - Dynamic detection
  const sourceCountsMap = new Map<string, number>();
  filteredRegistrations.forEach((r: any) => {
    const source = r.source || "direct";
    sourceCountsMap.set(source, (sourceCountsMap.get(source) || 0) + 1);
  });

  // Map sources to Arabic names and colors
  const sourceDisplayMap: Record<string, { name: string; color: string }> = {
    facebook: { name: "فيسبوك", color: "#1877F2" },
    instagram: { name: "إنستغرام", color: "#E4405F" },
    telegram: { name: "تيليجرام", color: "#0088CC" },
    manual: { name: "يدوي", color: "#FFA500" },
    direct: { name: "مباشر", color: "#6B7280" },
    // للتوافق مع التسجيلات القديمة
    web: { name: "موقع الويب", color: "#0066CC" },
    website: { name: "موقع الويب", color: "#0066CC" },
    phone: { name: "هاتف", color: "#00A651" },
  };

  const sourceData = Array.from(sourceCountsMap.entries())
    .map(([source, value]) => ({
      name: sourceDisplayMap[source]?.name || source,
      value,
      color: sourceDisplayMap[source]?.color || "#9CA3AF",
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <DashboardLayout
      pageTitle="إحصائيات المخيمات"
      pageDescription="تقارير وإحصائيات شاملة للمخيمات">
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-3 sm:p-4 md:p-6 lg:p-8" dir="rtl">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5 md:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <Button
                variant="ghost"
                onClick={() => setLocation('/dashboard')}
                className="mb-4 hover:bg-green-100"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                عودة إلى لوحة التحكم
              </Button>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                تقارير إحصائية للمخيمات
              </h1>
              <p className="text-muted-foreground mt-1">
                تحليل شامل لتسجيلات المخيمات الطبية
              </p>
            </div>

          {/* Camp Filter */}
          <div className="w-full sm:w-56 md:w-64">
            <Select value={selectedCamp} onValueChange={setSelectedCamp}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المخيم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المخيمات</SelectItem>
                {camps?.map((camp: any) => (
                  <SelectItem key={camp.id} value={camp.id.toString()}>
                    {camp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                إجمالي التسجيلات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalRegistrations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                قيد الانتظار
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" />
                مؤكد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{confirmedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                حضر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{attendedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Distribution */}
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

          {/* Source Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                مصدر التسجيل
              </CardTitle>
              <CardDescription>توزيع التسجيلات حسب المصدر</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Age Distribution */}
          {ageData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  توزيع الأعمار
                </CardTitle>
                <CardDescription>توزيع المسجلين حسب الفئة العمرية</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#00A651" name="عدد المسجلين" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Popular Procedures */}
          {procedureData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  الإجراءات الأكثر طلباً
                </CardTitle>
                <CardDescription>أكثر 10 إجراءات طلباً</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={procedureData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#0066CC" name="عدد الطلبات" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Empty State */}
        {totalRegistrations === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                لا توجد تسجيلات
              </h3>
              <p className="text-muted-foreground">
                لا توجد تسجيلات للمخيم المحدد حالياً
              </p>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </DashboardLayout>
  );
}
