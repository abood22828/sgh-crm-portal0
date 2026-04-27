import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp, TrendingDown, Users, Target, Phone, CheckCircle2,
  AlertCircle, Clock, BarChart3, Globe, Smartphone,
  Facebook, MessageCircle, Search, RefreshCw, PhoneCall,
  ArrowUpRight, ArrowDownRight, Minus, Filter, Download, Calendar,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

// ألوان موحدة
const COLORS = {
  primary: "#2563eb",
  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  info: "#0891b2",
  purple: "#7c3aed",
  pink: "#db2777",
  orange: "#ea580c",
};

const SOURCE_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#E1306C",
  whatsapp: "#25D366",
  google: "#4285F4",
  direct: "#6B7280",
  twitter: "#1DA1F2",
  telegram: "#2CA5E0",
  "غير محدد": "#9CA3AF",
};

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  facebook: <Facebook className="h-4 w-4" />,
  instagram: <Smartphone className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
  google: <Search className="h-4 w-4" />,
  direct: <Globe className="h-4 w-4" />,
};

type DateRange = "7d" | "30d" | "90d" | "custom";

function getDateRange(range: DateRange): { start: string; end: string } {
  const end = new Date();
  let start: Date;
  switch (range) {
    case "7d": start = subDays(end, 7); break;
    case "30d": start = subDays(end, 30); break;
    case "90d": start = subDays(end, 90); break;
    default: start = subDays(end, 30);
  }
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

// ===== Metric Card =====
function MetricCard({
  title, value, subtitle, icon, trend, color = "primary",
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  color?: keyof typeof COLORS;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend !== undefined && (
              <div className={`flex items-center gap-1 text-xs font-medium ${trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-500"}`}>
                {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : trend < 0 ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                {Math.abs(trend)}% مقارنة بالفترة السابقة
              </div>
            )}
          </div>
          <div className="p-3 rounded-xl" style={{ backgroundColor: `${COLORS[color]}15` }}>
            <div style={{ color: COLORS[color] }}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== Funnel Visualization =====
function ConversionFunnelChart({ data }: {
  data: { totalSessions: number; formOpens: number; formStarts: number; abandoned: number; converted: number };
}) {
  const funnelData = [
    { name: "إجمالي الزوار", value: data.totalSessions, fill: "#2563eb" },
    { name: "فتحوا نموذجاً", value: data.formOpens, fill: "#7c3aed" },
    { name: "بدأوا الملء", value: data.formStarts, fill: "#0891b2" },
    { name: "أكملوا الحجز", value: data.converted, fill: "#16a34a" },
  ];

  const maxVal = data.totalSessions || 1;

  return (
    <div className="space-y-3">
      {funnelData.map((step, idx) => {
        const pct = Math.round((step.value / maxVal) * 100);
        const dropFromPrev = idx > 0
          ? Math.round(((funnelData[idx - 1].value - step.value) / (funnelData[idx - 1].value || 1)) * 100)
          : 0;
        return (
          <div key={step.name} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{step.name}</span>
              <div className="flex items-center gap-3">
                <span className="font-bold">{step.value.toLocaleString()}</span>
                <span className="text-muted-foreground">{pct}%</span>
                {idx > 0 && dropFromPrev > 0 && (
                  <span className="text-red-500 text-xs">-{dropFromPrev}%</span>
                )}
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-8 overflow-hidden">
              <div
                className="h-full rounded-full flex items-center justify-end pr-3 transition-all duration-700"
                style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: step.fill }}
              >
                {pct > 10 && <span className="text-white text-xs font-bold">{pct}%</span>}
              </div>
            </div>
          </div>
        );
      })}
      <div className="pt-2 border-t">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">معدل التحويل الإجمالي</span>
          <span className="font-bold text-green-600">
            {data.totalSessions > 0 ? Math.round((data.converted / data.totalSessions) * 100) : 0}%
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-muted-foreground">الفرص الضائعة</span>
          <span className="font-bold text-red-500">{data.abandoned.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// ===== Abandoned Forms Table =====
function AbandonedFormsTable() {
  const [page, setPage] = useState(1);
  const [contacted, setContacted] = useState<boolean | undefined>(undefined);
  const [formType, setFormType] = useState<"appointment" | "offer" | "camp" | "general" | undefined>(undefined);

  const { data, isLoading, refetch } = trpc.tracking.abandonedFormsList.useQuery({
    page,
    limit: 20,
    contacted,
    formType,
  });

  const markContactedMutation = trpc.tracking.markAbandonedContacted.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة التواصل");
      refetch();
    },
  });

  const formTypeLabels: Record<string, string> = {
    appointment: "موعد طبيب",
    offer: "عرض",
    camp: "مخيم",
    general: "عام",
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select
          value={contacted === undefined ? "all" : contacted ? "contacted" : "not-contacted"}
          onValueChange={(v) => setContacted(v === "all" ? undefined : v === "contacted")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="حالة التواصل" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="not-contacted">لم يتم التواصل</SelectItem>
            <SelectItem value="contacted">تم التواصل</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={formType ?? "all"}
          onValueChange={(v) => setFormType(v === "all" ? undefined : v as typeof formType)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="نوع النموذج" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="appointment">موعد طبيب</SelectItem>
            <SelectItem value="offer">عرض</SelectItem>
            <SelectItem value="camp">مخيم</SelectItem>
            <SelectItem value="general">عام</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground mr-auto">
          {data?.total ?? 0} فرصة ضائعة
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-right p-3 font-medium">الاسم</th>
              <th className="text-right p-3 font-medium">الهاتف</th>
              <th className="text-right p-3 font-medium">نوع النموذج</th>
              <th className="text-right p-3 font-medium">المصدر</th>
              <th className="text-right p-3 font-medium">التاريخ</th>
              <th className="text-right p-3 font-medium">الحالة</th>
              <th className="text-right p-3 font-medium">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  لا توجد فرص ضائعة في هذه الفترة
                </td>
              </tr>
            )}
            {data?.items.map((item) => (
              <tr key={item.id} className="border-t hover:bg-muted/30 transition-colors">
                <td className="p-3 font-medium">{item.name ?? "—"}</td>
                <td className="p-3">
                  {item.phone ? (
                    <a href={`tel:${item.phone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                      <Phone className="h-3 w-3" />
                      {item.phone}
                    </a>
                  ) : "—"}
                </td>
                <td className="p-3">
                  <Badge variant="outline">{formTypeLabels[item.formType] ?? item.formType}</Badge>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    {SOURCE_ICONS[item.source ?? ""] ?? <Globe className="h-3 w-3" />}
                    <span className="capitalize">{item.source ?? "مباشر"}</span>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground text-xs">
                  {item.createdAt ? format(new Date(item.createdAt), "h:mm a, dd-MM-yyyy") : "—"}
                </td>
                <td className="p-3">
                  {item.contacted ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      تم التواصل
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      <Clock className="h-3 w-3 mr-1" />
                      لم يتم التواصل
                    </Badge>
                  )}
                </td>
                <td className="p-3">
                  {!item.contacted && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => markContactedMutation.mutate({ id: item.id })}
                      disabled={markContactedMutation.isPending}
                    >
                      <PhoneCall className="h-3 w-3 mr-1" />
                      تم التواصل
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>السابق</Button>
          <span className="flex items-center text-sm text-muted-foreground">
            صفحة {page} من {Math.ceil(data.total / 20)}
          </span>
          <Button variant="outline" size="sm" disabled={page >= Math.ceil(data.total / 20)} onClick={() => setPage(p => p + 1)}>التالي</Button>
        </div>
      )}
    </div>
  );
}

// ===== Main BI Page =====
export default function BIPage() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { start, end } = useMemo(() => getDateRange(dateRange), [dateRange]);

  // Calculate previous period for comparison
  const { start: prevStart, end: prevEnd } = useMemo(() => {
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    const currentEnd = new Date(end);
    const currentStart = new Date(start);
    const duration = currentEnd.getTime() - currentStart.getTime();
    
    const previousEnd = new Date(currentStart.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - duration);
    
    return {
      start: previousStart.toISOString(),
      end: previousEnd.toISOString(),
    };
  }, [dateRange, start, end]);

  const { data: funnelData, isLoading: funnelLoading, refetch: refetchFunnel } = trpc.tracking.conversionFunnel.useQuery(
    { startDate: start, endDate: end },
    { refetchInterval: autoRefresh ? 60000 : false }
  );
  const { data: prevFunnelData, isLoading: prevFunnelLoading } = trpc.tracking.conversionFunnel.useQuery(
    { startDate: prevStart, endDate: prevEnd },
    { enabled: !!start && !!end }
  );
  const { data: sourceData, isLoading: sourceLoading, refetch: refetchSource } = trpc.tracking.sourceBreakdown.useQuery(
    { startDate: start, endDate: end },
    { refetchInterval: autoRefresh ? 60000 : false }
  );
  const { data: campaignData, isLoading: campaignLoading, refetch: refetchCampaign } = trpc.tracking.campaignPerformance.useQuery(
    { startDate: start, endDate: end },
    { refetchInterval: autoRefresh ? 60000 : false }
  );
  const { data: dailyStats, isLoading: dailyStatsLoading } = trpc.tracking.dailyStats.useQuery(
    { startDate: start, endDate: end },
    { refetchInterval: autoRefresh ? 60000 : false }
  );

  // Calculate trends
  const trends = useMemo(() => {
    if (!funnelData || !prevFunnelData) return null;
    
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      totalSessions: calculateTrend(funnelData.totalSessions, prevFunnelData.totalSessions),
      converted: calculateTrend(funnelData.converted, prevFunnelData.converted),
      abandoned: calculateTrend(funnelData.abandoned, prevFunnelData.abandoned),
      conversionRate: calculateTrend(
        funnelData.totalSessions > 0 ? (funnelData.converted / funnelData.totalSessions) * 100 : 0,
        prevFunnelData.totalSessions > 0 ? (prevFunnelData.converted / prevFunnelData.totalSessions) * 100 : 0
      ),
    };
  }, [funnelData, prevFunnelData]);

  const handleRefresh = async () => {
    await Promise.all([refetchFunnel(), refetchSource(), refetchCampaign()]);
    toast.success("تم تحديث البيانات");
  };

  // Format daily stats for chart
  const dailyChartData = useMemo(() => {
    if (!dailyStats) return [];
    return dailyStats.map(stat => ({
      date: new Date(stat.date).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }),
      sessions: stat.sessions,
      conversions: stat.conversions,
      conversionRate: stat.conversionRate,
    }));
  }, [dailyStats]);

  const handleExport = () => {
    const data = {
      dateRange: { start, end },
      funnel: funnelData,
      sources: sourceData,
      campaigns: campaignData,
      trends,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bi-report-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("تم تصدير البيانات بنجاح");
  };

  const handleExportCSV = () => {
    if (!sourceData || !campaignData) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }

    // Sources CSV
    const sourcesCSV = [
      ["المصدر", "الزيارات", "التحويلات", "معدل التحويل"],
      ...sourceData.map(s => [s.source, s.total, s.conversions, s.rate + "%"])
    ].map(row => row.join(",")).join("\n");

    // Campaigns CSV
    const campaignsCSV = [
      ["الحملة", "المصدر", "الزيارات", "التحويلات", "معدل التحويل"],
      ...campaignData.map(c => [c.campaign, c.source, c.sessions, c.conversions, c.conversionRate + "%"])
    ].map(row => row.join(",")).join("\n");

    const combinedCSV = `=== المصادر ===\n${sourcesCSV}\n\n=== الحملات ===\n${campaignsCSV}`;
    
    const blob = new Blob([combinedCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bi-data-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("تم تصدير البيانات CSV بنجاح");
  };

  const totalSessions = funnelData?.totalSessions ?? 0;
  const converted = funnelData?.converted ?? 0;
  const abandoned = funnelData?.abandoned ?? 0;
  const conversionRate = totalSessions > 0 ? Math.round((converted / totalSessions) * 100) : 0;
  const abandonedRate = totalSessions > 0 ? Math.round((abandoned / totalSessions) * 100) : 0;

  return (
    <DashboardLayout pageTitle="ذكاء الأعمال (BI)" pageDescription="تحليلات شاملة لمصادر الزيارات والتحويلات والفرص الضائعة">
      <div className="p-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              ذكاء الأعمال (Business Intelligence)
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              تحليل مصادر الزيارات، قمع التحويل، وقائمة الفرص الضائعة
            </p>
          </div>
          <div className="flex items-center gap-2">
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
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              JSON
            </Button>
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">آخر 7 أيام</SelectItem>
                <SelectItem value="30d">آخر 30 يوم</SelectItem>
                <SelectItem value="90d">آخر 90 يوم</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="إجمالي الزوار"
            value={totalSessions.toLocaleString()}
            subtitle="جلسات مسجّلة"
            icon={<Users className="h-5 w-5" />}
            color="primary"
            trend={trends?.totalSessions}
          />
          <MetricCard
            title="حجوزات مكتملة"
            value={converted.toLocaleString()}
            subtitle={`معدل التحويل: ${conversionRate}%`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            color="success"
            trend={trends?.converted}
          />
          <MetricCard
            title="فرص ضائعة"
            value={abandoned.toLocaleString()}
            subtitle={`${abandonedRate}% من الزوار`}
            icon={<AlertCircle className="h-5 w-5" />}
            color="danger"
            trend={trends?.abandoned}
          />
          <MetricCard
            title="معدل التحويل"
            value={`${conversionRate}%`}
            subtitle="من الزيارة إلى الحجز"
            icon={<Target className="h-5 w-5" />}
            color="purple"
            trend={trends?.conversionRate}
          />
        </div>

        {/* Smart Alerts */}
        {trends && (
          <div className="space-y-2">
            {trends.conversionRate < -10 && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <div className="text-sm text-red-700 dark:text-red-300">
                      <span className="font-medium">تنبيه:</span> معدل التحويل انخفض بنسبة {Math.abs(trends.conversionRate).toFixed(1)}% مقارنة بالفترة السابقة
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {trends.abandoned > 20 && (
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                    <div className="text-sm text-orange-700 dark:text-orange-300">
                      <span className="font-medium">تنبيه:</span> الفرص الضائعة زادت بنسبة {trends.abandoned.toFixed(1)}% مقارنة بالفترة السابقة
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {trends.converted > 10 && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <div className="text-sm text-green-700 dark:text-green-300">
                      <span className="font-medium">ممتاز:</span> الحجوزات المكتملة زادت بنسبة {trends.converted.toFixed(1)}% مقارنة بالفترة السابقة
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="funnel" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="funnel">قمع التحويل</TabsTrigger>
            <TabsTrigger value="sources">المصادر</TabsTrigger>
            <TabsTrigger value="campaigns">الحملات</TabsTrigger>
            <TabsTrigger value="daily">الإحصائيات اليومية</TabsTrigger>
            <TabsTrigger value="abandoned">الفرص الضائعة</TabsTrigger>
          </TabsList>

          {/* Conversion Funnel Tab */}
          <TabsContent value="funnel">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    قمع التحويل
                  </CardTitle>
                  <CardDescription>مسار الزائر من الوصول إلى الحجز</CardDescription>
                </CardHeader>
                <CardContent>
                  {funnelLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : funnelData ? (
                    <ConversionFunnelChart data={funnelData} />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">لا توجد بيانات</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ملخص الأداء</CardTitle>
                  <CardDescription>مقاييس رئيسية للفترة المحددة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "معدل فتح النماذج", value: totalSessions > 0 ? Math.round(((funnelData?.formOpens ?? 0) / totalSessions) * 100) : 0, color: COLORS.primary },
                    { label: "معدل البدء في الملء", value: totalSessions > 0 ? Math.round(((funnelData?.formStarts ?? 0) / totalSessions) * 100) : 0, color: COLORS.info },
                    { label: "معدل الإكمال", value: conversionRate, color: COLORS.success },
                    { label: "معدل الهجر", value: abandonedRate, color: COLORS.danger },
                  ].map((metric) => (
                    <div key={metric.label} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{metric.label}</span>
                        <span className="font-bold">{metric.value}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ width: `${metric.value}%`, backgroundColor: metric.color }}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">نماذج مفتوحة</span>
                      <span className="font-medium">{(funnelData?.formOpens ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">نماذج بدأت</span>
                      <span className="font-medium">{(funnelData?.formStarts ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">نماذج مهجورة</span>
                      <span className="font-medium text-red-500">{abandoned.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">حجوزات مكتملة</span>
                      <span className="font-medium text-green-600">{converted.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sources Tab */}
          <TabsContent value="sources">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    توزيع مصادر الزيارات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sourceLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : sourceData && sourceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={sourceData}
                          dataKey="total"
                          nameKey="source"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ source, percent }) => `${source} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {sourceData.map((entry, index) => (
                            <Cell
                              key={entry.source}
                              fill={SOURCE_COLORS[entry.source] ?? `hsl(${index * 45}, 70%, 50%)`}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, "الزيارات"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">لا توجد بيانات مصادر بعد</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>أداء المصادر</CardTitle>
                  <CardDescription>مقارنة الزيارات والتحويلات لكل مصدر</CardDescription>
                </CardHeader>
                <CardContent>
                  {sourceLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : sourceData && sourceData.length > 0 ? (
                    <div className="space-y-3">
                      {sourceData.map((source) => (
                        <div key={source.source} className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                            style={{ backgroundColor: SOURCE_COLORS[source.source] ?? "#6B7280" }}
                          >
                            {SOURCE_ICONS[source.source] ?? <Globe className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium capitalize">{source.source}</span>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{source.total} زيارة</span>
                                <span className="text-green-600 font-medium">{source.conversions} حجز</span>
                                <Badge variant="outline" className="text-xs">{source.rate}%</Badge>
                              </div>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${Math.round((source.total / (sourceData[0]?.total || 1)) * 100)}%`,
                                  backgroundColor: SOURCE_COLORS[source.source] ?? "#6B7280",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">لا توجد بيانات مصادر بعد</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  أداء الحملات الإعلانية
                </CardTitle>
                <CardDescription>تحليل عائد الاستثمار (ROI) لكل حملة بناءً على معاملات UTM</CardDescription>
              </CardHeader>
              <CardContent>
                {campaignLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : campaignData && campaignData.length > 0 ? (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={campaignData.slice(0, 10)} layout="vertical" margin={{ right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="campaign" width={120} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="sessions" name="الزيارات" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                        <Bar dataKey="conversions" name="التحويلات" fill={COLORS.success} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-right p-3 font-medium">الحملة</th>
                            <th className="text-right p-3 font-medium">المصدر</th>
                            <th className="text-right p-3 font-medium">الزيارات</th>
                            <th className="text-right p-3 font-medium">التحويلات</th>
                            <th className="text-right p-3 font-medium">معدل التحويل</th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaignData.map((campaign, idx) => (
                            <tr key={idx} className="border-t hover:bg-muted/30">
                              <td className="p-3 font-medium">{campaign.campaign}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-1">
                                  {SOURCE_ICONS[campaign.source] ?? <Globe className="h-3 w-3" />}
                                  <span className="capitalize">{campaign.source}</span>
                                </div>
                              </td>
                              <td className="p-3">{campaign.sessions.toLocaleString()}</td>
                              <td className="p-3 text-green-600 font-medium">{campaign.conversions.toLocaleString()}</td>
                              <td className="p-3">
                                <Badge
                                  className={campaign.conversionRate >= 10 ? "bg-green-100 text-green-700" : campaign.conversionRate >= 5 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}
                                >
                                  {campaign.conversionRate}%
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <Target className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                    <p className="text-muted-foreground">لا توجد بيانات حملات بعد</p>
                    <p className="text-xs text-muted-foreground">ستظهر البيانات عند وصول زوار من روابط تحتوي على معاملات UTM</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Daily Stats Tab */}
          <TabsContent value="daily">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  الإحصائيات اليومية
                </CardTitle>
                <CardDescription>تتبع الزيارات والتحويلات يومياً خلال الفترة المحددة</CardDescription>
              </CardHeader>
              <CardContent>
                {dailyStatsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : dailyChartData && dailyChartData.length > 0 ? (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={dailyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="sessions" stroke={COLORS.primary} name="الزيارات" strokeWidth={2} />
                        <Line type="monotone" dataKey="conversions" stroke={COLORS.success} name="التحويلات" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>

                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-right p-3 font-medium">التاريخ</th>
                            <th className="text-right p-3 font-medium">الزيارات</th>
                            <th className="text-right p-3 font-medium">التحويلات</th>
                            <th className="text-right p-3 font-medium">معدل التحويل</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyChartData.map((stat, idx) => (
                            <tr key={idx} className="border-t hover:bg-muted/30">
                              <td className="p-3 font-medium">{stat.date}</td>
                              <td className="p-3">{stat.sessions.toLocaleString()}</td>
                              <td className="p-3 text-green-600 font-medium">{stat.conversions.toLocaleString()}</td>
                              <td className="p-3">
                                <Badge
                                  className={stat.conversionRate >= 10 ? "bg-green-100 text-green-700" : stat.conversionRate >= 5 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}
                                >
                                  {stat.conversionRate}%
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                    <p className="text-muted-foreground">لا توجد بيانات يومية بعد</p>
                    <p className="text-xs text-muted-foreground">ستظهر البيانات عند وجود زيارات وتحويلات</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Abandoned Forms Tab */}
          <TabsContent value="abandoned">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  قائمة الفرص الضائعة
                </CardTitle>
                <CardDescription>
                  أرقام الهواتف التي بدأت الحجز ولم تكمله — للمتابعة وإعادة التواصل
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AbandonedFormsTable />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Banner */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <p className="font-medium">كيف يعمل نظام التتبع؟</p>
                <p>يتم تسجيل الزيارات والأحداث تلقائياً بناءً على موافقة المستخدم على ملفات تعريف الارتباط (Cookie Consent). البيانات تشمل مصدر الزيارة (UTM، Facebook Click ID، Google Click ID) ومسار التنقل داخل الموقع.</p>
                <p>النماذج المهجورة تُسجَّل عند إدخال رقم الهاتف ثم مغادرة الصفحة دون إكمال الحجز.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
