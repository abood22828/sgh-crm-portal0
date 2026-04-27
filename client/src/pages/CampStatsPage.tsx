/**
 * CampStatsPage - صفحة تقارير إحصائية للمخيمات
 * Camp statistics and reports page
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp, Users, Calendar, Activity, PieChart as PieChartIcon, ArrowRight, RefreshCw, Download, Calendar as CalendarIcon, Clock, Mail, CalendarDays, Printer } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, ZAxis } from "recharts";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useAuth } from "@/_core/hooks/useAuth";

export default function CampStatsPage() {
  const [, setLocation] = useLocation();
  const [selectedCamp, setSelectedCamp] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleEmail, setScheduleEmail] = useState("");
  const [scheduleFrequency, setScheduleFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  
  const { data: camps, isLoading: campsLoading } = trpc.camps.getAll.useQuery();
  const { data: registrations, isLoading: registrationsLoading, refetch } = trpc.campRegistrations.list.useQuery(
    undefined,
    { refetchInterval: autoRefresh ? 60000 : false }
  );
  const scheduleReportMutation = trpc.campRegistrations.scheduleReport.useMutation();
  const { user } = useAuth();

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
  const completedCount = filteredRegistrations.filter((r: any) => r.status === "completed").length;
  const contactedCount = filteredRegistrations.filter((r: any) => r.status === "contacted").length;
  const noAnswerCount = filteredRegistrations.filter((r: any) => r.status === "no_answer").length;

  // Calculate rates
  const attendanceRate = confirmedCount > 0 ? Math.round((attendedCount / confirmedCount) * 100) : 0;
  const cancellationRate = totalRegistrations > 0 ? Math.round((cancelledCount / totalRegistrations) * 100) : 0;
  const completionRate = attendedCount > 0 ? Math.round((completedCount / attendedCount) * 100) : 0;

  const handleRefresh = async () => {
    await refetch();
    toast.success("تم تحديث البيانات");
  };

  const handleExport = () => {
    const data = {
      camp: selectedCamp === "all" ? "all" : camps?.find((c: any) => c.id.toString() === selectedCamp)?.name,
      statistics: {
        total: totalRegistrations,
        pending: pendingCount,
        confirmed: confirmedCount,
        attended: attendedCount,
        cancelled: cancelledCount,
      },
      statusDistribution: statusData,
      ageDistribution: ageData,
      sourceDistribution: sourceData,
      popularProcedures: procedureData,
      registrations: filteredRegistrations,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `camp-stats-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("تم تصدير البيانات بنجاح");
  };

  const handleScheduleReport = async () => {
    if (!scheduleEmail || !scheduleEmail.includes("@")) {
      toast.error("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }
    
    try {
      const campId = selectedCamp === "all" ? undefined : parseInt(selectedCamp);
      await scheduleReportMutation.mutateAsync({
        email: scheduleEmail,
        frequency: scheduleFrequency,
        campId,
      });
      toast.success(`تم جدولة التقرير للإرسال إلى ${scheduleEmail} (${scheduleFrequency === "daily" ? "يومياً" : scheduleFrequency === "weekly" ? "أسبوعياً" : "شهرياً"})`);
      setScheduleDialogOpen(false);
      setScheduleEmail("");
    } catch (error) {
      toast.error("حدث خطأ أثناء جدولة التقرير");
    }
  };

  const handlePrintReport = () => {
    const printWindow = window.open("", "_blank", "width=800,height=1200");
    
    if (!printWindow) {
      toast.error("تعذر فتح نافذة الطباعة. الرجاء السماح بالنوافذ المنبثقة.");
      return;
    }

    const campName = selectedCamp === "all" ? "جميع المخيمات" : camps?.find((c: any) => c.id.toString() === selectedCamp)?.name || "غير محدد";
    const printDate = new Date();
    const userName = user?.name || "غير محدد";

    const reportHTML = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير إحصائيات المخيمات</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
          }
          
          body {
            font-family: Arial, sans-serif;
            direction: rtl;
            margin: 0;
            padding: 20px;
            background-color: white;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 3px solid #00a651;
          }
          
          .header img {
            height: 50px;
            max-width: 150px;
            object-fit: contain;
          }
          
          .header .phone {
            font-size: 24px;
            font-weight: bold;
            color: #00a651;
          }
          
          .report-title {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
          }
          
          .report-subtitle {
            text-align: center;
            font-size: 16px;
            color: #666;
            margin-bottom: 25px;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 25px;
          }
          
          .stat-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
          }
          
          .stat-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }
          
          .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #333;
          }
          
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          
          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #333;
            border-bottom: 2px solid #00a651;
            padding-bottom: 8px;
          }
          
          .chart-placeholder {
            border: 1px dashed #ccc;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            background-color: #f9f9f9;
          }
          
          .chart-placeholder-text {
            font-size: 14px;
            color: #666;
          }
          
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          
          .data-table th,
          .data-table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: right;
          }
          
          .data-table th {
            background-color: #00a651;
            color: white;
            font-weight: bold;
          }
          
          .data-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #00a651;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .slogan {
            font-size: 18px;
            font-weight: bold;
            color: #0088cc;
          }
          
          .meta {
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/sgh-logo-full.png" alt="المستشفى السعودي الألماني">
          <div class="phone">8000018</div>
        </div>
        
        <div class="report-title">تقرير إحصائيات المخيمات</div>
        <div class="report-subtitle">${campName} - ${format(printDate, "dd/MM/yyyy HH:mm", { locale: ar })}</div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">إجمالي التسجيلات</div>
            <div class="stat-value">${totalRegistrations}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">قيد الانتظار</div>
            <div class="stat-value">${pendingCount}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">مؤكد</div>
            <div class="stat-value">${confirmedCount}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">حضر</div>
            <div class="stat-value">${attendedCount}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">مكتمل</div>
            <div class="stat-value">${completedCount}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">ملغي</div>
            <div class="stat-value">${cancelledCount}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">معدل الحضور</div>
            <div class="stat-value">${attendanceRate}%</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">معدل الإلغاء</div>
            <div class="stat-value">${cancellationRate}%</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">توزيع الحالات</div>
          <table class="data-table">
            <thead>
              <tr>
                <th>الحالة</th>
                <th>العدد</th>
                <th>النسبة</th>
              </tr>
            </thead>
            <tbody>
              ${statusData.map(item => {
                const percentage = totalRegistrations > 0 ? Math.round((item.value / totalRegistrations) * 100) : 0;
                return `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.value}</td>
                    <td>${percentage}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <div class="section-title">توزيع الأعمار</div>
          <table class="data-table">
            <thead>
              <tr>
                <th>الفئة العمرية</th>
                <th>العدد</th>
              </tr>
            </thead>
            <tbody>
              ${ageData.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.value}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <div class="section-title">توزيع الجنس</div>
          <table class="data-table">
            <thead>
              <tr>
                <th>الجنس</th>
                <th>العدد</th>
                <th>النسبة</th>
              </tr>
            </thead>
            <tbody>
              ${genderData.map(item => {
                const total = genderData.reduce((sum, g) => sum + g.value, 0);
                const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.value}</td>
                    <td>${percentage}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <div class="section-title">مقاييس الوقت</div>
          <table class="data-table">
            <thead>
              <tr>
                <th>المقياس</th>
                <th>القيمة</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>متوسط وقت التأكيد</td>
                <td>${timeMetrics.avgToConfirm} يوم</td>
              </tr>
              <tr>
                <td>متوسط وقت الحضور</td>
                <td>${timeMetrics.avgToAttend} يوم</td>
              </tr>
              <tr>
                <td>متوسط وقت الإلغاء</td>
                <td>${timeMetrics.avgToCancel} يوم</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <div class="slogan">نرعاكم كأهالينا</div>
          <div class="meta">
            <div>المستخدم: ${userName}</div>
            <div>${format(printDate, "dd/MM/yyyy HH:mm", { locale: ar })}</div>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 1000);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(reportHTML);
    printWindow.document.close();
  };

  // Status distribution for pie chart
  const statusData = [
    { name: "قيد الانتظار", value: pendingCount, color: "#F59E0B" },
    { name: "تم التواصل", value: contactedCount, color: "#8B5CF6" },
    { name: "لا رد", value: noAnswerCount, color: "#6B7280" },
    { name: "مؤكد", value: confirmedCount, color: "#10B981" },
    { name: "حضر", value: attendedCount, color: "#3B82F6" },
    { name: "مكتمل", value: completedCount, color: "#8B5CF6" },
    { name: "ملغي", value: cancelledCount, color: "#EF4444" },
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
    .map(([name, value]) => ({ name, value, color: "#10B981" }))
    .filter(item => item.value > 0);

  // Gender distribution
  const genderGroups = {
    male: 0,
    female: 0,
  };

  filteredRegistrations.forEach((r: any) => {
    if (r.gender && (r.gender === "male" || r.gender === "female")) {
      genderGroups[r.gender as "male" | "female"]++;
    }
  });

  const genderData = [
    { name: "ذكور", value: genderGroups.male, color: "#3B82F6" },
    { name: "إناث", value: genderGroups.female, color: "#EC4899" },
  ].filter(item => item.value > 0);

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
    .map(([name, value]) => ({ name, value, color: "#3B82F6" }))
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

  // Daily registrations over time
  const dailyRegistrations = useMemo(() => {
    const dateMap = new Map<string, number>();
    filteredRegistrations.forEach((r: any) => {
      if (r.createdAt) {
        const date = new Date(r.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
      }
    });
    return Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days
  }, [filteredRegistrations]);

  // UTM Analysis
  const utmSourceCounts = new Map<string, number>();
  const utmMediumCounts = new Map<string, number>();
  const utmCampaignCounts = new Map<string, number>();

  filteredRegistrations.forEach((r: any) => {
    if (r.utmSource) {
      utmSourceCounts.set(r.utmSource, (utmSourceCounts.get(r.utmSource) || 0) + 1);
    }
    if (r.utmMedium) {
      utmMediumCounts.set(r.utmMedium, (utmMediumCounts.get(r.utmMedium) || 0) + 1);
    }
    if (r.utmCampaign) {
      utmCampaignCounts.set(r.utmCampaign, (utmCampaignCounts.get(r.utmCampaign) || 0) + 1);
    }
  });

  const utmSourceData = Array.from(utmSourceCounts.entries())
    .map(([name, value]) => ({ name, value, color: "#8B5CF6" }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const utmMediumData = Array.from(utmMediumCounts.entries())
    .map(([name, value]) => ({ name, value, color: "#EC4899" }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const utmCampaignData = Array.from(utmCampaignCounts.entries())
    .map(([name, value]) => ({ name, value, color: "#F59E0B" }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Time Metrics
  const timeMetrics = useMemo(() => {
    const toConfirmTimes: number[] = [];
    const toAttendTimes: number[] = [];
    const toCancelTimes: number[] = [];

    filteredRegistrations.forEach((r: any) => {
      if (r.createdAt && r.confirmedAt) {
        toConfirmTimes.push(new Date(r.confirmedAt).getTime() - new Date(r.createdAt).getTime());
      }
      if (r.confirmedAt && r.attendedAt) {
        toAttendTimes.push(new Date(r.attendedAt).getTime() - new Date(r.confirmedAt).getTime());
      }
      if (r.createdAt && r.cancelledAt) {
        toCancelTimes.push(new Date(r.cancelledAt).getTime() - new Date(r.createdAt).getTime());
      }
    });

    const avgToConfirm = toConfirmTimes.length > 0 
      ? Math.round(toConfirmTimes.reduce((a, b) => a + b, 0) / toConfirmTimes.length / (1000 * 60 * 60 * 24)) 
      : 0;
    const avgToAttend = toAttendTimes.length > 0 
      ? Math.round(toAttendTimes.reduce((a, b) => a + b, 0) / toAttendTimes.length / (1000 * 60 * 60 * 24)) 
      : 0;
    const avgToCancel = toCancelTimes.length > 0 
      ? Math.round(toCancelTimes.reduce((a, b) => a + b, 0) / toCancelTimes.length / (1000 * 60 * 60 * 24)) 
      : 0;

    return { avgToConfirm, avgToAttend, avgToCancel };
  }, [filteredRegistrations]);

  // Campaign Performance (by campaignId)
  const campaignPerformance = useMemo(() => {
    const campaignMap = new Map<number, { total: number; confirmed: number; attended: number }>();
    
    filteredRegistrations.forEach((r: any) => {
      if (r.campaignId) {
        const current = campaignMap.get(r.campaignId) || { total: 0, confirmed: 0, attended: 0 };
        current.total++;
        if (r.status === "confirmed" || r.status === "attended" || r.status === "completed") {
          current.confirmed++;
        }
        if (r.status === "attended" || r.status === "completed") {
          current.attended++;
        }
        campaignMap.set(r.campaignId, current);
      }
    });

    return Array.from(campaignMap.entries())
      .map(([campaignId, stats]) => ({
        campaignId,
        total: stats.total,
        confirmed: stats.confirmed,
        attended: stats.attended,
        conversionRate: stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0,
        attendanceRate: stats.confirmed > 0 ? Math.round((stats.attended / stats.confirmed) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredRegistrations]);

  // Funnel Data - Registration Journey
  const funnelData = useMemo(() => {
    const stages = [
      { name: "إجمالي التسجيلات", value: totalRegistrations, color: "#3B82F6" },
      { name: "قيد الانتظار", value: pendingCount, color: "#F59E0B" },
      { name: "مؤكد", value: confirmedCount, color: "#10B981" },
      { name: "حضر", value: attendedCount, color: "#8B5CF6" },
      { name: "مكتمل", value: completedCount, color: "#EC4899" },
    ].filter(item => item.value > 0);

    // Calculate drop-off rates
    const withDropOff = stages.map((stage, index) => {
      const previousValue = index > 0 ? stages[index - 1].value : stage.value;
      const dropOff = previousValue > 0 ? Math.round(((previousValue - stage.value) / previousValue) * 100) : 0;
      return {
        ...stage,
        dropOff: index === 0 ? 0 : dropOff,
        conversionRate: index === 0 ? 100 : (previousValue > 0 ? Math.round((stage.value / previousValue) * 100) : 0),
      };
    });

    return withDropOff;
  }, [totalRegistrations, pendingCount, confirmedCount, attendedCount, completedCount]);

  // Stacked Bar Data - Status by Camp
  const statusByCamp = useMemo(() => {
    const campMap = new Map<number, { [key: string]: number }>();
    
    filteredRegistrations.forEach((r: any) => {
      if (r.campId) {
        const current = campMap.get(r.campId) || {};
        current[r.status] = (current[r.status] || 0) + 1;
        campMap.set(r.campId, current);
      }
    });

    return Array.from(campMap.entries())
      .map(([campId, statusCounts]) => {
        const camp = camps?.find((c: any) => c.id === campId);
        return {
          campName: camp?.name || `مخيم ${campId}`,
          pending: Number(statusCounts.pending) || 0,
          contacted: Number(statusCounts.contacted) || 0,
          no_answer: Number(statusCounts.no_answer) || 0,
          confirmed: Number(statusCounts.confirmed) || 0,
          attended: Number(statusCounts.attended) || 0,
          completed: Number(statusCounts.completed) || 0,
          cancelled: Number(statusCounts.cancelled) || 0,
        };
      })
      .sort((a, b) => {
        const totalA = Object.values(a).reduce((sum: number, val) => sum + (typeof val === "number" ? val : Number(val) || 0), 0);
        const totalB = Object.values(b).reduce((sum: number, val) => sum + (typeof val === "number" ? val : Number(val) || 0), 0);
        return totalB - totalA;
      })
      .slice(0, 10);
  }, [filteredRegistrations, camps]);

  // Scatter Plot Data - Age vs Procedures
  const ageVsProcedures = useMemo(() => {
    const data: { age: number; procedureCount: number; fullName: string }[] = [];
    
    filteredRegistrations.forEach((r: any) => {
      if (r.age && r.procedures) {
        let procedureCount = 0;
        try {
          const procs = JSON.parse(r.procedures);
          if (Array.isArray(procs)) {
            procedureCount = procs.length;
          } else if (typeof procs === "string") {
            procedureCount = 1;
          }
        } catch {
          procedureCount = 1;
        }
        data.push({
          age: r.age,
          procedureCount,
          fullName: r.fullName,
        });
      }
    });

    return data.slice(0, 100); // Limit to 100 points
  }, [filteredRegistrations]);

  // Heatmap Data - Registration activity by day and hour
  const heatmapData = useMemo(() => {
    const dayHourMap = new Map<string, number>();
    const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    
    filteredRegistrations.forEach((r: any) => {
      if (r.createdAt) {
        const date = new Date(r.createdAt);
        const day = dayNames[date.getDay()];
        const hour = date.getHours();
        const key = `${day}-${hour}`;
        dayHourMap.set(key, (dayHourMap.get(key) || 0) + 1);
      }
    });

    // Convert to array format for heatmap display
    const data: { day: string; hour: number; count: number }[] = [];
    dayHourMap.forEach((count, key) => {
      const [day, hour] = key.split("-");
      data.push({ day, hour: parseInt(hour), count });
    });

    return data.sort((a, b) => b.count - a.count).slice(0, 50); // Top 50 active slots
  }, [filteredRegistrations]);

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

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? "bg-green-50 border-green-200" : ""}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
                {autoRefresh ? "إيقاف التحديث" : "تحديث تلقائي"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                تحديث
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                تصدير
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrintReport}>
                <Printer className="w-4 h-4 mr-2" />
                طباعة
              </Button>
              <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Mail className="w-4 h-4 mr-2" />
                    جدولة التقرير
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5" />
                      جدولة تقرير إحصائيات المخيمات
                    </DialogTitle>
                    <DialogDescription>
                      قم بجدولة إرسال التقرير بريد إلكتروني بشكل دوري
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        value={scheduleEmail}
                        onChange={(e) => setScheduleEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="frequency">التكرار</Label>
                      <Select value={scheduleFrequency} onValueChange={(value: any) => setScheduleFrequency(value)}>
                        <SelectTrigger id="frequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">يومياً</SelectItem>
                          <SelectItem value="weekly">أسبوعياً</SelectItem>
                          <SelectItem value="monthly">شهرياً</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={handleScheduleReport}>
                      جدولة
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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

        {/* Additional KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" />
                مكتمل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{completedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                ملغي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{cancelledCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                معدل الحضور
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{attendanceRate}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                معدل الإلغاء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{cancellationRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Time Metrics KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                متوسط وقت التأكيد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{timeMetrics.avgToConfirm} يوم</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                متوسط وقت الحضور
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{timeMetrics.avgToAttend} يوم</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                متوسط وقت الإلغاء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{timeMetrics.avgToCancel} يوم</div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Registrations Chart */}
        {dailyRegistrations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                التسجيلات اليومية
              </CardTitle>
              <CardDescription>عدد التسجيلات خلال آخر 30 يوم</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#00A651" name="عدد التسجيلات" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

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

          {/* Gender Distribution */}
          {genderData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  توزيع الجنس
                </CardTitle>
                <CardDescription>توزيع المسجلين حسب الجنس</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value} (${Math.round((entry.value / (genderData[0].value + genderData[1].value)) * 100)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
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
        </div>

        {/* Charts Row 1.5 - Source Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* UTM Source Distribution */}
          {utmSourceData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  UTM Source
                </CardTitle>
                <CardDescription>توزيع التسجيلات حسب مصدر UTM</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={utmSourceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tick={{ fill: "#6B7280" }} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: "#6B7280" }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1F2937", border: "none", borderRadius: "8px" }}
                      itemStyle={{ color: "#F3F4F6" }}
                    />
                    <Legend />
                    <Bar dataKey="value" fill="#8B5CF6" name="عدد التسجيلات" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Charts Row 2 - UTM Medium & Campaign */}
        {(utmMediumData.length > 0 || utmCampaignData.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {utmMediumData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5" />
                    UTM Medium
                  </CardTitle>
                  <CardDescription>توزيع التسجيلات حسب وسيلة UTM</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={utmMediumData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis type="number" tick={{ fill: "#6B7280" }} />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fill: "#6B7280" }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#1F2937", border: "none", borderRadius: "8px" }}
                        itemStyle={{ color: "#F3F4F6" }}
                      />
                      <Legend />
                      <Bar dataKey="value" fill="#EC4899" name="عدد التسجيلات" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {utmCampaignData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5" />
                    UTM Campaign
                  </CardTitle>
                  <CardDescription>أفضل حملات UTM</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={utmCampaignData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis type="number" tick={{ fill: "#6B7280" }} />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fill: "#6B7280" }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#1F2937", border: "none", borderRadius: "8px" }}
                        itemStyle={{ color: "#F3F4F6" }}
                      />
                      <Legend />
                      <Bar dataKey="value" fill="#F59E0B" name="عدد التسجيلات" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Campaign Performance */}
        {campaignPerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                أداء الحملات الإعلانية
              </CardTitle>
              <CardDescription>مقارنة أداء الحملات حسب التسجيلات ومعدلات التحويل</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={campaignPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="campaignId" tick={{ fill: "#6B7280" }} label={{ value: "معرف الحملة", position: "insideBottom", offset: -5, fill: "#6B7280" }} />
                  <YAxis tick={{ fill: "#6B7280" }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1F2937", border: "none", borderRadius: "8px" }}
                    itemStyle={{ color: "#F3F4F6" }}
                  />
                  <Legend />
                  <Bar dataKey="total" fill="#3B82F6" name="إجمالي التسجيلات" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="confirmed" fill="#10B981" name="مؤكد" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="attended" fill="#8B5CF6" name="حضر" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Funnel Chart - Registration Journey */}
        {funnelData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                قمع رحلة التسجيل
              </CardTitle>
              <CardDescription>رحلة التسجيل من البداية إلى الإكمال مع نسب التسرب</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fill: "#6B7280" }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fill: "#6B7280" }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1F2937", border: "none", borderRadius: "8px" }}
                    itemStyle={{ color: "#F3F4F6" }}
                    formatter={(value: any, name: string, props: any) => {
                      if (name === "dropOff") {
                        return [`${value}%`, "نسبة التسرب"];
                      }
                      if (name === "conversionRate") {
                        return [`${value}%`, "معدل التحويل"];
                      }
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#3B82F6" name="العدد" radius={[0, 4, 4, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {funnelData.map((stage, index) => (
                  <div key={index} className="text-center p-3 rounded-lg" style={{ backgroundColor: `${stage.color}20` }}>
                    <div className="text-sm text-muted-foreground">{stage.name}</div>
                    <div className="text-xl font-bold" style={{ color: stage.color }}>{stage.value}</div>
                    {index > 0 && (
                      <div className="text-xs text-muted-foreground">
                        تسرب: {stage.dropOff}% | تحويل: {stage.conversionRate}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stacked Bar Chart - Status by Camp */}
        {statusByCamp.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                توزيع الحالات حسب المخيم
              </CardTitle>
              <CardDescription>مقارنة توزيع الحالات لكل مخيم</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={statusByCamp}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="campName" tick={{ fill: "#6B7280" }} angle={-45} textAnchor="end" height={100} />
                  <YAxis tick={{ fill: "#6B7280" }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1F2937", border: "none", borderRadius: "8px" }}
                    itemStyle={{ color: "#F3F4F6" }}
                  />
                  <Legend />
                  <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="قيد الانتظار" />
                  <Bar dataKey="contacted" stackId="a" fill="#8B5CF6" name="تم التواصل" />
                  <Bar dataKey="no_answer" stackId="a" fill="#6B7280" name="لا رد" />
                  <Bar dataKey="confirmed" stackId="a" fill="#10B981" name="مؤكد" />
                  <Bar dataKey="attended" stackId="a" fill="#3B82F6" name="حضر" />
                  <Bar dataKey="completed" stackId="a" fill="#EC4899" name="مكتمل" />
                  <Bar dataKey="cancelled" stackId="a" fill="#EF4444" name="ملغي" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Scatter Plot - Age vs Procedures */}
        {ageVsProcedures.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                العمر مقابل الإجراءات
              </CardTitle>
              <CardDescription>تحليل العلاقة بين العمر وعدد الإجراءات المطلوبة</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={ageVsProcedures}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="age" name="العمر" unit=" سنة" tick={{ fill: "#6B7280" }} />
                  <YAxis dataKey="procedureCount" name="عدد الإجراءات" tick={{ fill: "#6B7280" }} />
                  <ZAxis dataKey="procedureCount" range={[50, 400]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: "3 3" }}
                    contentStyle={{ backgroundColor: "#1F2937", border: "none", borderRadius: "8px" }}
                    itemStyle={{ color: "#F3F4F6" }}
                    formatter={(value: any, name: string) => [value, name === "fullName" ? "الاسم" : name]}
                  />
                  <Scatter fill="#3B82F6" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Heatmap - Registration Activity by Day and Hour */}
        {heatmapData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                نشاط التسجيلات حسب اليوم والساعة
              </CardTitle>
              <CardDescription>أوقات الذروة للتسجيلات (أعلى 50 فترة)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {heatmapData.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-24 text-sm font-medium text-muted-foreground">{item.day}</div>
                    <div className="w-16 text-sm text-muted-foreground">{item.hour}:00</div>
                    <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
                        style={{ width: `${(item.count / heatmapData[0].count) * 100}%` }}
                      />
                    </div>
                    <div className="w-16 text-sm font-bold text-foreground text-left">{item.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fill: "#6B7280" }} />
                    <YAxis tick={{ fill: "#6B7280" }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1F2937", border: "none", borderRadius: "8px" }}
                      itemStyle={{ color: "#F3F4F6" }}
                    />
                    <Legend />
                    <Bar dataKey="value" fill="#10B981" name="عدد المسجلين" radius={[4, 4, 0, 0]} />
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tick={{ fill: "#6B7280" }} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fill: "#6B7280" }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1F2937", border: "none", borderRadius: "8px" }}
                      itemStyle={{ color: "#F3F4F6" }}
                    />
                    <Legend />
                    <Bar dataKey="value" fill="#3B82F6" name="عدد الطلبات" radius={[0, 4, 4, 0]} />
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
