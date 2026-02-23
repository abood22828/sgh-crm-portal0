/**
 * Patient Dashboard - لوحة تحكم المريض
 * 
 * يعرض حجوزات المريض ومواعيده ونتائجه وتقاريره
 */
import { useFormatDate } from "@/hooks/useFormatDate";
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Calendar, FileText, Heart, User, LogOut, ClipboardList,
  Stethoscope, Gift, Tent, ChevronLeft, Phone, Clock, MapPin,
  AlertCircle, CheckCircle2, Settings, Home, FlaskConical, ScanLine
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePhoneFormat } from "@/hooks/usePhoneFormat";

export default function PatientDashboard() {
  const { formatPhoneDisplay, getWhatsAppLink, getCallLink } = usePhoneFormat();
  const { formatDate, formatDateTime } = useFormatDate();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Check auth
  const { data: patient, isLoading: authLoading } = trpc.patientPortal.me.useQuery();

  // Fetch data
  const { data: appointments, isLoading: appointmentsLoading } = trpc.patientPortal.myAppointments.useQuery(
    undefined,
    { enabled: !!patient }
  );
  const { data: offerBookings, isLoading: offersLoading } = trpc.patientPortal.myOfferBookings.useQuery(
    undefined,
    { enabled: !!patient }
  );
  const { data: campRegistrations, isLoading: campsLoading } = trpc.patientPortal.myCampRegistrations.useQuery(
    undefined,
    { enabled: !!patient }
  );
  const { data: results, isLoading: resultsLoading } = trpc.patientPortal.myResults.useQuery(
    undefined,
    { enabled: !!patient }
  );

  const logoutMutation = trpc.patientPortal.logout.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل الخروج");
      navigate("/patient-portal");
    },
  });

  useEffect(() => {
    if (!authLoading && !patient) {
      navigate("/patient-portal");
    }
  }, [patient, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!patient) return null;

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      new: { label: "جديد", variant: "default" },
      confirmed: { label: "مؤكد", variant: "default" },
      completed: { label: "مكتمل", variant: "secondary" },
      cancelled: { label: "ملغي", variant: "destructive" },
      pending: { label: "قيد الانتظار", variant: "outline" },
      ready: { label: "جاهز", variant: "default" },
      delivered: { label: "تم التسليم", variant: "secondary" },
      contacted: { label: "تم التواصل", variant: "secondary" },
      registered: { label: "مسجل", variant: "default" },
      attended: { label: "حضر", variant: "default" },
    };
    const info = map[status] || { label: status, variant: "outline" as const };
    return <Badge variant={info.variant} className="text-[10px] sm:text-xs">{info.label}</Badge>;
  };

  // formatDate is provided by useFormatDate hook above

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/50 via-white to-green-50/30 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900" dir="rtl">
      <Navbar />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-4xl">
        {/* Patient Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-green-100 dark:border-gray-700 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 sm:h-7 sm:w-7 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-foreground">مرحباً، {patient.fullName}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3" />
                  <span dir="ltr">{formatPhoneDisplay(patient.phone)}</span>
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs sm:text-sm"
            >
              <LogOut className="h-4 w-4 ml-1" />
              <span className="hidden sm:inline">خروج</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Card className="border-green-100 dark:border-gray-700">
            <CardContent className="p-3 sm:p-4 text-center">
              <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400 mx-auto mb-1" />
              <p className="text-lg sm:text-xl font-bold text-foreground">{appointments?.length || 0}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">مواعيد</p>
            </CardContent>
          </Card>
          <Card className="border-green-100 dark:border-gray-700">
            <CardContent className="p-3 sm:p-4 text-center">
              <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
              <p className="text-lg sm:text-xl font-bold text-foreground">{offerBookings?.length || 0}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">حجوزات عروض</p>
            </CardContent>
          </Card>
          <Card className="border-green-100 dark:border-gray-700">
            <CardContent className="p-3 sm:p-4 text-center">
              <Tent className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
              <p className="text-lg sm:text-xl font-bold text-foreground">{campRegistrations?.length || 0}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">مخيمات</p>
            </CardContent>
          </Card>
          <Card className="border-green-100 dark:border-gray-700">
            <CardContent className="p-3 sm:p-4 text-center">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
              <p className="text-lg sm:text-xl font-bold text-foreground">{results?.length || 0}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">نتائج وتقارير</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-auto p-1 bg-green-50 dark:bg-gray-800 rounded-xl">
            <TabsTrigger value="overview" className="text-[10px] sm:text-xs md:text-sm py-2 sm:py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 rounded-lg">
              <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-0.5 sm:ml-1" />
              <span className="hidden sm:inline">نظرة عامة</span>
              <span className="sm:hidden">عام</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="text-[10px] sm:text-xs md:text-sm py-2 sm:py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 rounded-lg">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-0.5 sm:ml-1" />
              <span className="hidden sm:inline">المواعيد</span>
              <span className="sm:hidden">مواعيد</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="text-[10px] sm:text-xs md:text-sm py-2 sm:py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 rounded-lg">
              <FlaskConical className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-0.5 sm:ml-1" />
              <span className="hidden sm:inline">النتائج</span>
              <span className="sm:hidden">نتائج</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-[10px] sm:text-xs md:text-sm py-2 sm:py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 rounded-lg">
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-0.5 sm:ml-1" />
              <span className="hidden sm:inline">حسابي</span>
              <span className="sm:hidden">حسابي</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Recent Appointments */}
            <Card className="border-green-100 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-green-600" />
                  آخر المواعيد
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appointmentsLoading ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-green-600" /></div>
                ) : !appointments?.length ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">لا توجد مواعيد حالياً</p>
                    <Link href="/doctors">
                      <Button variant="outline" size="sm" className="mt-3 text-green-600 border-green-200">
                        احجز موعدك الآن
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {appointments.slice(0, 3).map((apt: any) => (
                      <div key={apt.id} className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">{apt.doctorName || "موعد طبي"}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {formatDate(apt.appointmentDate || apt.createdAt)}
                          </p>
                        </div>
                        {statusBadge(apt.status)}
                      </div>
                    ))}
                    {appointments.length > 3 && (
                      <Button variant="ghost" size="sm" className="w-full text-green-600" onClick={() => setActiveTab("appointments")}>
                        عرض الكل ({appointments.length})
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Results */}
            <Card className="border-green-100 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-600" />
                  آخر النتائج والتقارير
                </CardTitle>
              </CardHeader>
              <CardContent>
                {resultsLoading ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-green-600" /></div>
                ) : !results?.length ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">لا توجد نتائج حالياً</p>
                    <p className="text-xs mt-1">ستظهر هنا نتائج التحاليل والأشعة والتقارير</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {results.slice(0, 3).map((res: any) => (
                      <div key={res.id} className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {res.resultType === "lab" && <FlaskConical className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                          {res.resultType === "radiology" && <ScanLine className="h-4 w-4 text-purple-500 flex-shrink-0" />}
                          {res.resultType === "report" && <ClipboardList className="h-4 w-4 text-amber-500 flex-shrink-0" />}
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-medium truncate">{res.title}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">{formatDate(res.resultDate || res.createdAt)}</p>
                          </div>
                        </div>
                        {statusBadge(res.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Coming Soon Features */}
            <Card className="border-dashed border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
              <CardContent className="p-4 sm:p-6 text-center">
                <Heart className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <h3 className="text-sm sm:text-base font-semibold text-green-800 dark:text-green-400">ميزات قادمة قريباً</h3>
                <p className="text-xs sm:text-sm text-green-600 dark:text-green-500 mt-1">
                  ربط الملف الطبي بنظام المستشفى - الوصفات الطبية - التقارير الطبية المفصلة
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="mt-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm sm:text-base font-semibold">جميع المواعيد والحجوزات</h2>
              <Link href="/doctors">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm h-8 sm:h-9">
                  حجز جديد
                </Button>
              </Link>
            </div>

            {/* Doctor Appointments */}
            {appointmentsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></div>
            ) : (
              <>
                {appointments && appointments.length > 0 && (
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Stethoscope className="h-3.5 w-3.5" /> مواعيد الأطباء
                    </h3>
                    <div className="space-y-2">
                      {appointments.map((apt: any) => (
                        <Card key={apt.id} className="border-green-50 dark:border-gray-700">
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{apt.doctorName || apt.name || "موعد طبي"}</p>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[10px] sm:text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(apt.appointmentDate || apt.createdAt)}</span>
                                  {apt.specialty && <span className="flex items-center gap-1"><Stethoscope className="h-3 w-3" />{apt.specialty}</span>}
                                </div>
                              </div>
                              {statusBadge(apt.status)}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Offer Bookings */}
                {offerBookings && offerBookings.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Gift className="h-3.5 w-3.5" /> حجوزات العروض
                    </h3>
                    <div className="space-y-2">
                      {offerBookings.map((booking: any) => (
                        <Card key={booking.id} className="border-blue-50 dark:border-gray-700">
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{booking.name || "حجز عرض"}</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{formatDate(booking.createdAt)}</p>
                              </div>
                              {statusBadge(booking.status)}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Camp Registrations */}
                {campRegistrations && campRegistrations.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Tent className="h-3.5 w-3.5" /> تسجيلات المخيمات
                    </h3>
                    <div className="space-y-2">
                      {campRegistrations.map((reg: any) => (
                        <Card key={reg.id} className="border-purple-50 dark:border-gray-700">
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{reg.name || "تسجيل مخيم"}</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{formatDate(reg.createdAt)}</p>
                              </div>
                              {statusBadge(reg.status)}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {(!appointments?.length && !offerBookings?.length && !campRegistrations?.length) && (
                  <div className="text-center py-10 text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">لا توجد حجوزات أو مواعيد</p>
                    <p className="text-xs mt-1">يمكنك حجز موعد من صفحة الأطباء أو العروض</p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="mt-4">
            {resultsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></div>
            ) : !results?.length ? (
              <div className="text-center py-10 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">لا توجد نتائج أو تقارير</p>
                <p className="text-xs mt-1">ستظهر هنا نتائج التحاليل والأشعة والتقارير الطبية</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Lab Results */}
                {results.filter((r: any) => r.resultType === "lab").length > 0 && (
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <FlaskConical className="h-3.5 w-3.5 text-blue-500" /> نتائج التحاليل
                    </h3>
                    <div className="space-y-2">
                      {results.filter((r: any) => r.resultType === "lab").map((res: any) => (
                        <Card key={res.id} className="border-blue-50 dark:border-gray-700">
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{res.title}</p>
                                {res.doctorName && <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">د. {res.doctorName}</p>}
                                <p className="text-[10px] sm:text-xs text-muted-foreground">{formatDate(res.resultDate || res.createdAt)}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {statusBadge(res.status)}
                                {res.fileUrl && (
                                  <a href={res.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                      <FileText className="h-3.5 w-3.5 text-blue-500" />
                                    </Button>
                                  </a>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Radiology */}
                {results.filter((r: any) => r.resultType === "radiology").length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <ScanLine className="h-3.5 w-3.5 text-purple-500" /> نتائج الأشعة
                    </h3>
                    <div className="space-y-2">
                      {results.filter((r: any) => r.resultType === "radiology").map((res: any) => (
                        <Card key={res.id} className="border-purple-50 dark:border-gray-700">
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{res.title}</p>
                                {res.doctorName && <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">د. {res.doctorName}</p>}
                                <p className="text-[10px] sm:text-xs text-muted-foreground">{formatDate(res.resultDate || res.createdAt)}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {statusBadge(res.status)}
                                {res.fileUrl && (
                                  <a href={res.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                      <FileText className="h-3.5 w-3.5 text-purple-500" />
                                    </Button>
                                  </a>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reports */}
                {results.filter((r: any) => r.resultType === "report").length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <ClipboardList className="h-3.5 w-3.5 text-amber-500" /> التقارير الطبية
                    </h3>
                    <div className="space-y-2">
                      {results.filter((r: any) => r.resultType === "report").map((res: any) => (
                        <Card key={res.id} className="border-amber-50 dark:border-gray-700">
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{res.title}</p>
                                {res.doctorName && <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">د. {res.doctorName}</p>}
                                <p className="text-[10px] sm:text-xs text-muted-foreground">{formatDate(res.resultDate || res.createdAt)}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {statusBadge(res.status)}
                                {res.fileUrl && (
                                  <a href={res.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                      <FileText className="h-3.5 w-3.5 text-amber-500" />
                                    </Button>
                                  </a>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-4">
            <Card className="border-green-100 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-green-600" />
                  بيانات الحساب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">الاسم الكامل</p>
                    <p className="text-sm font-medium mt-0.5">{patient.fullName}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">رقم الهاتف</p>
                    <p className="text-sm font-medium mt-0.5" dir="ltr">{formatPhoneDisplay(patient.phone)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">الجنس</p>
                    <p className="text-sm font-medium mt-0.5">{patient.gender === "male" ? "ذكر" : "أنثى"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">العمر</p>
                    <p className="text-sm font-medium mt-0.5">{patient.age || "—"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">العنوان</p>
                    <p className="text-sm font-medium mt-0.5">{patient.address || "—"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">البريد الإلكتروني</p>
                    <p className="text-sm font-medium mt-0.5" dir="ltr">{patient.email || "—"}</p>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">تاريخ التسجيل</p>
                  <p className="text-sm">{formatDate(patient.createdAt)}</p>
                </div>

                {/* Coming Soon */}
                <div className="mt-4 p-4 rounded-lg border-dashed border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 text-center">
                  <Heart className="h-6 w-6 text-green-400 mx-auto mb-1" />
                  <p className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-400">ربط الملف الطبي</p>
                  <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-500 mt-1">
                    قريباً سيتم ربط حسابك بملفك الطبي في نظام المستشفى
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
