import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, FileText, Loader2, RefreshCw, Phone, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

/**
 * Reports Page - Mobile Optimized
 * Comprehensive reports for bookings, leads, conversion rates, and revenue
 */

const COLORS = {
  primary: "#10b981",
  secondary: "#3b82f6",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  purple: "#8b5cf6",
};

const STATUS_COLORS: Record<string, string> = {
  pending: COLORS.warning,
  confirmed: COLORS.info,
  completed: COLORS.primary,
  cancelled: COLORS.danger,
  attended: COLORS.primary,
  new: COLORS.warning,
  contacted: COLORS.info,
  booked: COLORS.primary,
  not_interested: COLORS.danger,
  no_answer: "#94a3b8",
};

// Booking Card Component for Mobile
function BookingCard({ booking }: { booking: any }) {
  const handleCall = () => {
    window.location.href = `tel:${booking.phone}`;
  };

  const handleWhatsApp = () => {
    const phone = booking.phone.replace(/\D/g, "");
    const message = encodeURIComponent(`مرحباً ${booking.fullName}`);
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Type Badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">{booking.type}</span>
            <span
              className="px-2 py-1 rounded text-xs text-white font-medium"
              style={{ backgroundColor: STATUS_COLORS[booking.status] || COLORS.info }}
            >
              {getStatusLabel(booking.status)}
            </span>
          </div>

          {/* Name */}
          <div>
            <h3 className="font-semibold text-gray-900">{booking.fullName}</h3>
            <p className="text-sm text-gray-600 mt-1">{booking.service || "غير محدد"}</p>
          </div>

          {/* Contact Info */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-mono text-gray-700">{booking.phone}</span>
          </div>

          {/* Source and Date */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>المصدر: {getSourceLabel(booking.source || "direct")}</span>
            <span>{format(new Date(booking.createdAt), "dd/MM/yyyy", { locale: ar })}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={handleCall}>
              <Phone className="h-4 w-4 ml-2" />
              اتصال
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={handleWhatsApp}>
              <MessageCircle className="h-4 w-4 ml-2" />
              واتساب
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  // Format dates for API
  const startDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
  const endDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;

  // Fetch reports data
  const { data: bookingsReport, isLoading: loadingBookings, refetch: refetchBookings } = trpc.reports.getBookingsReport.useQuery(
    { startDate, endDate },
    { refetchOnWindowFocus: false }
  );

  const { data: leadsReport, isLoading: loadingLeads, refetch: refetchLeads } = trpc.reports.getNewLeadsReport.useQuery(
    { startDate, endDate },
    { refetchOnWindowFocus: false }
  );

  const { data: conversionReport, isLoading: loadingConversion, refetch: refetchConversion } = trpc.reports.getConversionRatesReport.useQuery(
    { startDate, endDate },
    { refetchOnWindowFocus: false }
  );

  const { data: revenueReport, isLoading: loadingRevenue, refetch: refetchRevenue } = trpc.reports.getRevenueReport.useQuery(
    { startDate, endDate },
    { refetchOnWindowFocus: false }
  );

  const { data: detailedBookings, isLoading: loadingDetailed } = trpc.reports.getDetailedBookingsList.useQuery(
    { startDate, endDate },
    { refetchOnWindowFocus: false }
  );

  const isLoading = loadingBookings || loadingLeads || loadingConversion || loadingRevenue;

  const handleRefresh = () => {
    refetchBookings();
    refetchLeads();
    refetchConversion();
    refetchRevenue();
  };

  const handleExportPDF = () => {
    alert("سيتم إضافة ميزة التصدير إلى PDF قريباً");
  };

  const handleExportExcel = () => {
    alert("سيتم إضافة ميزة التصدير إلى Excel قريباً");
  };

  // Prepare chart data for bookings
  const bookingsChartData = bookingsReport
    ? [
        { name: "مواعيد الأطباء", value: bookingsReport.appointments.total },
        { name: "تسجيلات المخيمات", value: bookingsReport.campRegistrations.total },
        { name: "طلبات العروض", value: bookingsReport.offerLeads.total },
      ]
    : [];

  // Prepare chart data for appointments by status
  const appointmentsStatusData = bookingsReport?.appointments.byStatus.map((stat) => ({
    name: getStatusLabel(stat.status),
    value: stat.total,
    color: STATUS_COLORS[stat.status] || COLORS.info,
  })) || [];

  // Prepare chart data for leads by source
  const leadsSourceData = leadsReport?.bySource.map((stat) => ({
    name: getSourceLabel(stat.source),
    value: stat.total,
  })) || [];

  // Prepare chart data for conversion rates
  const conversionChartData = conversionReport
    ? [
        { name: "العملاء المحتملين", rate: conversionReport.leads.conversionRate },
        { name: "مواعيد الأطباء", rate: conversionReport.appointments.conversionRate },
        { name: "طلبات العروض", rate: conversionReport.offerLeads.conversionRate },
        { name: "تسجيلات المخيمات", rate: conversionReport.campRegistrations.conversionRate },
      ]
    : [];

  return (
    <DashboardLayout
      pageTitle="التقارير"
      pageDescription="تقارير مفصلة عن أداء المنصة"
    >
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3">

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:flex-1 justify-start text-right font-normal text-sm">
                  <CalendarIcon className="ml-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM", { locale: ar })} - {format(dateRange.to, "dd/MM", { locale: ar })}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy", { locale: ar })
                      )
                    ) : (
                      "اختر الفترة"
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={1}
                  locale={ar}
                />
              </PopoverContent>
            </Popover>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading} className="flex-shrink-0">
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
              <Button variant="outline" onClick={handleExportPDF} className="flex-1 sm:flex-initial text-sm">
                <FileText className="ml-2 h-4 w-4" />
                <span className="hidden sm:inline">تصدير PDF</span>
                <span className="sm:hidden">PDF</span>
              </Button>
              <Button variant="outline" onClick={handleExportExcel} className="flex-1 sm:flex-initial text-sm">
                <Download className="ml-2 h-4 w-4" />
                <span className="hidden sm:inline">تصدير Excel</span>
                <span className="sm:hidden">Excel</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Reports Content */}
        {!isLoading && (
          <div className="space-y-4 md:space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <Card>
                <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
                  <CardTitle className="text-xs md:text-sm font-medium text-gray-600">إجمالي الحجوزات</CardTitle>
                </CardHeader>
                <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
                  <div className="text-2xl md:text-3xl font-bold text-primary">{bookingsReport?.grandTotal || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">جميع الأنواع</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
                  <CardTitle className="text-xs md:text-sm font-medium text-gray-600">العملاء الجدد</CardTitle>
                </CardHeader>
                <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
                  <div className="text-2xl md:text-3xl font-bold text-secondary">{leadsReport?.totalLeads || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">عملاء محتملين</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
                  <CardTitle className="text-xs md:text-sm font-medium text-gray-600">معدل التحويل</CardTitle>
                </CardHeader>
                <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
                  <div className="text-2xl md:text-3xl font-bold text-purple">
                    {conversionReport?.overall.conversionRate.toFixed(1) || 0}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">نسبة التحويل</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
                  <CardTitle className="text-xs md:text-sm font-medium text-gray-600">الإيرادات</CardTitle>
                </CardHeader>
                <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
                  <div className="text-2xl md:text-3xl font-bold text-warning">{revenueReport?.totalRevenue || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">قريباً</p>
                </CardContent>
              </Card>
            </div>

            {/* Bookings Report */}
            <Card>
              <CardHeader className="px-3 md:px-6">
                <CardTitle className="text-base md:text-lg">تقارير الحجوزات والمواعيد</CardTitle>
                <CardDescription className="text-xs md:text-sm">إحصائيات شاملة لجميع أنواع الحجوزات</CardDescription>
              </CardHeader>
              <CardContent className="px-3 md:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  {/* Pie Chart - Bookings by Type */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3 md:mb-4">توزيع الحجوزات حسب النوع</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={bookingsChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {bookingsChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={[COLORS.primary, COLORS.secondary, COLORS.warning][index]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Bar Chart - Appointments by Status */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3 md:mb-4">مواعيد الأطباء حسب الحالة</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={appointmentsStatusData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill={COLORS.primary}>
                          {appointmentsStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Detailed Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-4 md:mt-6">
                  <div className="bg-green-50 p-3 md:p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">مواعيد الأطباء</h4>
                    <div className="text-xl md:text-2xl font-bold text-green-600">{bookingsReport?.appointments.total || 0}</div>
                    <div className="mt-2 space-y-1">
                      {bookingsReport?.appointments.byStatus.map((stat) => (
                        <div key={stat.status} className="flex justify-between text-xs">
                          <span className="text-gray-600">{getStatusLabel(stat.status)}</span>
                          <span className="font-medium">{stat.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">تسجيلات المخيمات</h4>
                    <div className="text-xl md:text-2xl font-bold text-blue-600">{bookingsReport?.campRegistrations.total || 0}</div>
                    <div className="mt-2 space-y-1">
                      {bookingsReport?.campRegistrations.byStatus.map((stat) => (
                        <div key={stat.status} className="flex justify-between text-xs">
                          <span className="text-gray-600">{getStatusLabel(stat.status)}</span>
                          <span className="font-medium">{stat.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-orange-50 p-3 md:p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">طلبات العروض</h4>
                    <div className="text-xl md:text-2xl font-bold text-orange-600">{bookingsReport?.offerLeads.total || 0}</div>
                    <div className="mt-2 space-y-1">
                      {bookingsReport?.offerLeads.byStatus.map((stat) => (
                        <div key={stat.status} className="flex justify-between text-xs">
                          <span className="text-gray-600">{getStatusLabel(stat.status)}</span>
                          <span className="font-medium">{stat.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leads Report */}
            <Card>
              <CardHeader className="px-3 md:px-6">
                <CardTitle className="text-base md:text-lg">تقارير العملاء الجدد</CardTitle>
                <CardDescription className="text-xs md:text-sm">تحليل مصادر العملاء الجدد</CardDescription>
              </CardHeader>
              <CardContent className="px-3 md:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  {/* Bar Chart - Leads by Source */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3 md:mb-4">العملاء حسب المصدر</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={leadsSourceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill={COLORS.secondary} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pie Chart - Leads by Status */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3 md:mb-4">العملاء حسب الحالة</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={leadsReport?.byStatus.map((stat) => ({
                            name: getStatusLabel(stat.status),
                            value: stat.total,
                          })) || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {leadsReport?.byStatus.map((stat, index) => (
                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[stat.status] || COLORS.info} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conversion Rates Report */}
            <Card>
              <CardHeader className="px-3 md:px-6">
                <CardTitle className="text-base md:text-lg">تقارير معدلات التحويل</CardTitle>
                <CardDescription className="text-xs md:text-sm">نسبة التحويل من طلب إلى حجز مؤكد</CardDescription>
              </CardHeader>
              <CardContent className="px-3 md:px-6">
                <div className="mb-4 md:mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 md:mb-4">معدلات التحويل حسب النوع</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={conversionChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                      <Bar dataKey="rate" fill={COLORS.purple} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Detailed Conversion Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  <div className="bg-purple-50 p-3 md:p-4 rounded-lg">
                    <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">العملاء المحتملين</h4>
                    <div className="text-xl md:text-2xl font-bold text-purple-600">
                      {conversionReport?.leads.conversionRate.toFixed(1) || 0}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {conversionReport?.leads.converted || 0} من {conversionReport?.leads.total || 0}
                    </p>
                  </div>

                  <div className="bg-green-50 p-3 md:p-4 rounded-lg">
                    <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">مواعيد الأطباء</h4>
                    <div className="text-xl md:text-2xl font-bold text-green-600">
                      {conversionReport?.appointments.conversionRate.toFixed(1) || 0}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {conversionReport?.appointments.converted || 0} من {conversionReport?.appointments.total || 0}
                    </p>
                  </div>

                  <div className="bg-orange-50 p-3 md:p-4 rounded-lg">
                    <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">طلبات العروض</h4>
                    <div className="text-xl md:text-2xl font-bold text-orange-600">
                      {conversionReport?.offerLeads.conversionRate.toFixed(1) || 0}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {conversionReport?.offerLeads.converted || 0} من {conversionReport?.offerLeads.total || 0}
                    </p>
                  </div>

                  <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
                    <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">تسجيلات المخيمات</h4>
                    <div className="text-xl md:text-2xl font-bold text-blue-600">
                      {conversionReport?.campRegistrations.conversionRate.toFixed(1) || 0}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {conversionReport?.campRegistrations.converted || 0} من {conversionReport?.campRegistrations.total || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Report (Placeholder) */}
            <Card>
              <CardHeader className="px-3 md:px-6">
                <CardTitle className="text-base md:text-lg">تقارير الإيرادات والأرباح</CardTitle>
                <CardDescription className="text-xs md:text-sm">سيتم تفعيلها بعد تكامل نظام الدفع</CardDescription>
              </CardHeader>
              <CardContent className="px-3 md:px-6">
                <div className="bg-gray-50 p-6 md:p-8 rounded-lg text-center">
                  <FileText className="h-10 md:h-12 w-10 md:w-12 text-gray-400 mx-auto mb-3 md:mb-4" />
                  <p className="text-sm md:text-base text-gray-600">{revenueReport?.note}</p>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Bookings List */}
            {detailedBookings && detailedBookings.length > 0 && (
              <Card>
                <CardHeader className="px-3 md:px-6">
                  <CardTitle className="text-base md:text-lg">قائمة الحجوزات التفصيلية</CardTitle>
                  <CardDescription className="text-xs md:text-sm">جميع الحجوزات في الفترة المحددة</CardDescription>
                </CardHeader>
                <CardContent className="px-3 md:px-6">
                  {/* Mobile View - Cards */}
                  <div className="block md:hidden">
                    {detailedBookings.slice(0, 20).map((booking) => (
                      <BookingCard key={`${booking.type}-${booking.id}`} booking={booking} />
                    ))}
                    {detailedBookings.length > 20 && (
                      <p className="text-xs text-gray-500 mt-3 text-center">
                        عرض أول 20 حجز من أصل {detailedBookings.length} حجز
                      </p>
                    )}
                  </div>

                  {/* Desktop View - Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right p-2">النوع</th>
                          <th className="text-right p-2">الاسم</th>
                          <th className="text-right p-2">الهاتف</th>
                          <th className="text-right p-2">الخدمة</th>
                          <th className="text-right p-2">الحالة</th>
                          <th className="text-right p-2">المصدر</th>
                          <th className="text-right p-2">التاريخ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailedBookings.slice(0, 50).map((booking) => (
                          <tr key={`${booking.type}-${booking.id}`} className="border-b hover:bg-gray-50">
                            <td className="p-2">{booking.type}</td>
                            <td className="p-2">{booking.fullName}</td>
                            <td className="p-2 font-mono">{booking.phone}</td>
                            <td className="p-2">{booking.service || "غير محدد"}</td>
                            <td className="p-2">
                              <span
                                className="px-2 py-1 rounded text-xs text-white"
                                style={{ backgroundColor: STATUS_COLORS[booking.status] || COLORS.info }}
                              >
                                {getStatusLabel(booking.status)}
                              </span>
                            </td>
                            <td className="p-2">{getSourceLabel(booking.source || "direct")}</td>
                            <td className="p-2 text-xs">{format(new Date(booking.createdAt), "PPP", { locale: ar })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {detailedBookings.length > 50 && (
                      <p className="text-sm text-gray-500 mt-4 text-center">
                        عرض أول 50 حجز من أصل {detailedBookings.length} حجز. استخدم التصدير لعرض القائمة الكاملة.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Helper functions
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "قيد الانتظار",
    confirmed: "مؤكد",
    completed: "مكتمل",
    cancelled: "ملغي",
    attended: "حضر",
    new: "جديد",
    contacted: "تم التواصل",
    booked: "محجوز",
    not_interested: "غير مهتم",
    no_answer: "لا يرد",
  };
  return labels[status] || status;
}

function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    facebook: "فيسبوك",
    instagram: "إنستغرام",
    telegram: "تيليجرام",
    manual: "يدوي",
    direct: "مباشر",
    web: "موقع",
    website: "موقع",
    phone: "هاتف",
    fb: "فيسبوك",
    ig: "إنستغرام",
  };
  return labels[source] || source;
}
