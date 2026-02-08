import { useState, useMemo } from "react";
import OfferLeadsManagement from "@/components/OfferLeadsManagement";
import CampRegistrationsManagement from "@/components/CampRegistrationsManagement";
import ManualRegistrationForm from "@/components/ManualRegistrationForm";
import GlobalSearch from "@/components/GlobalSearch";
import NotificationCenter from "@/components/NotificationCenter";
import SourceAnalytics from "@/components/SourceAnalytics";
import RecentActivity from "@/components/RecentActivity";
import QuickPatientSearch from "@/components/QuickPatientSearch";
import DetailedStatsCards from "@/components/DetailedStatsCards";
import DashboardSidebar from "@/components/DashboardSidebar";
import DoctorsManagement from "@/components/DoctorsManagement";
import LeadCard from "@/components/LeadCard";
import TableSkeleton from "@/components/TableSkeleton";
import AppointmentCard from "@/components/AppointmentCard";
import SourceBadge from "@/components/SourceBadge";
import { useAuth } from "@/_core/hooks/useAuth";
import Pagination from "@/components/Pagination";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Calendar, 
  Search, 
  LogOut,
  TrendingUp,
  Phone,
  Mail,
  MessageSquare,
  Loader2,
  Eye,
  WifiOff,
  Settings,
  Download,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel, formatLeadsForExport, formatAppointmentsForExport } from "@/lib/exportToExcel";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

const statusLabels = {
  new: "جديد",
  contacted: "تم التواصل",
  booked: "تم الحجز",
  not_interested: "غير مهتم",
  no_answer: "لم يرد",
};

const statusColors = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  booked: "bg-green-500",
  not_interested: "bg-red-500",
  no_answer: "bg-gray-500",
};

export default function AdminDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [leadsDateFilter, setLeadsDateFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"leads" | "appointments" | "offerLeads" | "campRegistrations">("leads");

  // Pagination states
  const [appointmentsPage, setAppointmentsPage] = useState(1);
  const appointmentsLimit = 20;

  const { data: unifiedLeads, isLoading: leadsLoading, refetch: refetchLeads } = trpc.leads.unifiedList.useQuery();
  const { data: stats } = trpc.leads.stats.useQuery();
  const { data: appointmentsData, isLoading: appointmentsLoading, refetch: refetchAppointments } = trpc.appointments.listPaginated.useQuery({
    page: appointmentsPage,
    limit: appointmentsLimit,
  });
  const appointments = appointmentsData?.data || [];
  const { data: doctors = [] } = trpc.doctors.list.useQuery();
  
  // Count pending (not updated) bookings
  const [offerLeadsPendingCount, setOfferLeadsPendingCount] = useState(0);
  const [campRegistrationsPendingCount, setCampRegistrationsPendingCount] = useState(0);
  
  const pendingCounts = useMemo(() => {
    const leadsPending = unifiedLeads?.filter(l => l.status === 'pending').length || 0;
    const appointmentsPending = appointments?.filter(a => a.status === 'pending').length || 0;
    return {
      leads: leadsPending,
      appointments: appointmentsPending,
      offerLeads: offerLeadsPendingCount,
      campRegistrations: campRegistrationsPendingCount,
    };
  }, [unifiedLeads, appointments, offerLeadsPendingCount, campRegistrationsPendingCount]);
  
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [appointmentStatusDialogOpen, setAppointmentStatusDialogOpen] = useState(false);
  const [newAppointmentStatus, setNewAppointmentStatus] = useState("");
  const [appointmentStatusNotes, setAppointmentStatusNotes] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState("all");
  const [appointmentSourceFilter, setAppointmentSourceFilter] = useState("all");
  const [leadsStatusFilter, setLeadsStatusFilter] = useState("all");
  const [leadsSourceFilter, setLeadsSourceFilter] = useState("all");
  const [offerLeadsStatusFilter, setOfferLeadsStatusFilter] = useState("all");
  const [campRegistrationsStatusFilter, setCampRegistrationsStatusFilter] = useState("all");

  const updateStatusMutation = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة العميل بنجاح");
      refetchLeads();
      setStatusDialogOpen(false);
      setSelectedLead(null);
      setNewStatus("");
      setStatusNotes("");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الحالة");
    },
  });

  const updateAppointmentStatusMutation = trpc.appointments.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة الموعد بنجاح");
      refetchAppointments();
      setAppointmentStatusDialogOpen(false);
      setSelectedAppointment(null);
      setNewAppointmentStatus("");
      setAppointmentStatusNotes("");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الحالة");
    },
  });

  const updateAppointmentMutation = trpc.appointments.updateAppointment.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الموعد بنجاح");
      refetchAppointments();
      setAppointmentStatusDialogOpen(false);
      setSelectedAppointment(null);
      setNewAppointmentStatus("");
      setAppointmentStatusNotes("");
      setAppointmentDate("");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الموعد");
    },
  });

  const filteredLeads = useMemo(() => {
    if (!unifiedLeads) return [];
    
    let filtered = unifiedLeads;
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.fullName.toLowerCase().includes(term) ||
          lead.phone.includes(term) ||
          (lead.email && lead.email.toLowerCase().includes(term))
      );
    }
    
    // Filter by date
    if (leadsDateFilter && leadsDateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(lead => {
        const leadDate = new Date(lead.createdAt);
        
        if (leadsDateFilter === "today") {
          return leadDate >= today;
        } else if (leadsDateFilter === "week") {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return leadDate >= weekAgo;
        } else if (leadsDateFilter === "month") {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return leadDate >= monthAgo;
        }
        return true;
      });
    }
    
    // Filter by status
    if (leadsStatusFilter && leadsStatusFilter !== "all") {
      filtered = filtered.filter(lead => lead.status === leadsStatusFilter);
    }
    
    // Filter by source
    if (leadsSourceFilter && leadsSourceFilter !== "all") {
      filtered = filtered.filter(lead => lead.source === leadsSourceFilter);
    }
    
    return filtered;
  }, [unifiedLeads, searchTerm, leadsDateFilter, leadsStatusFilter, leadsSourceFilter]);

  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];
    
    let filtered = appointments;
    
    // Filter by search term
    if (appointmentSearchTerm) {
      const term = appointmentSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.fullName.toLowerCase().includes(term) ||
          apt.phone.includes(term) ||
          (apt.email && apt.email.toLowerCase().includes(term))
      );
    }
    
    // Filter by doctor
    if (selectedDoctor && selectedDoctor !== "all") {
      filtered = filtered.filter(apt => apt.doctorId === parseInt(selectedDoctor));
    }
    
    // Filter by date
    if (dateFilter && dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.createdAt);
        
        if (dateFilter === "today") {
          return aptDate >= today;
        } else if (dateFilter === "week") {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return aptDate >= weekAgo;
        } else if (dateFilter === "month") {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return aptDate >= monthAgo;
        }
        return true;
      });
    }
    
    // Filter by status
    if (appointmentStatusFilter && appointmentStatusFilter !== "all") {
      filtered = filtered.filter(appointment => appointment.status === appointmentStatusFilter);
    }
    
    // Filter by source
    if (appointmentSourceFilter && appointmentSourceFilter !== "all") {
      filtered = filtered.filter(appointment => (appointment as any).source === appointmentSourceFilter);
    }
    
    return filtered;
  }, [appointments, appointmentSearchTerm, selectedDoctor, dateFilter, appointmentStatusFilter, appointmentSourceFilter]);

  const appointmentStats = useMemo(() => {
    if (!appointments) return { total: 0, pending: 0, confirmed: 0, cancelled: 0 };
    return {
      total: appointments.length,
      pending: appointments.filter(a => a.status === 'pending').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
    };
  }, [appointments]);

  const handleStatusUpdate = () => {
    if (!selectedLead || !newStatus) return;
    
    updateStatusMutation.mutate({
      id: selectedLead.id,
      status: newStatus as any,
      notes: statusNotes || undefined,
    });
  };

  const handleAppointmentStatusUpdate = () => {
    if (!selectedAppointment || !newAppointmentStatus) return;
    
    // إرسال WhatsApp إذا كانت الحالة "confirmed" ويوجد موعد محدد
    const shouldSendWhatsApp = newAppointmentStatus === 'confirmed' && appointmentDate;
    
    updateAppointmentMutation.mutate({
      id: selectedAppointment.id,
      status: newAppointmentStatus as any,
      appointmentDate: appointmentDate || undefined,
      staffNotes: appointmentStatusNotes || undefined,
    }, {
      onSuccess: () => {
        if (shouldSendWhatsApp) {
          // إرسال رسالة WhatsApp
          const formattedDate = new Date(appointmentDate).toLocaleDateString('ar-YE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          const message = `مرحباً ${selectedAppointment.fullName}،\n\nتم تأكيد موعدك في المستشفى السعودي الألماني - صنعاء\n\nالطبيب: ${selectedAppointment.doctorName || 'غير محدد'}\nالتاريخ والوقت: ${formattedDate}\n${selectedAppointment.procedure ? `الإجراء: ${selectedAppointment.procedure}\n` : ''}\nيرجى الحضور قبل الموعد بـ 15 دقيقة.\n\nللاستفسار: 8000018`;
          
          window.open(`https://wa.me/${selectedAppointment.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
        }
      }
    });
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <img 
              src="/assets/new-logo.png" 
              alt="المستشفى السعودي الألماني" 
              className="h-20 mx-auto mb-4"
            />
            <CardTitle className="text-2xl">لوحة التحكم الإدارية</CardTitle>
            <CardDescription>يرجى تسجيل الدخول للوصول إلى لوحة التحكم</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => window.location.href = getLoginUrl()}
            >
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex" dir="rtl">
      {/* Sidebar */}
      <DashboardSidebar currentPath="/dashboard" />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pb-0 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Logo and Title */}
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
              <img 
                src="/assets/new-logo.png" 
                alt="المستشفى السعودي الألماني" 
                className="h-10 md:h-12 flex-shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-base md:text-xl font-bold text-foreground truncate">لوحة التحكم الإدارية</h1>
                <p className="text-xs md:text-sm text-muted-foreground hidden sm:block truncate">إدارة حملات التسويق والعملاء</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              {/* User Info - Desktop Only */}
              <div className="text-left hidden lg:block">
                <p className="text-sm font-semibold truncate max-w-[150px]">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</p>
              </div>
              
              {/* Settings Button */}
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setLocation("/settings")}
                className="h-9 w-9"
                title="الإعدادات"
              >
                <Settings className="w-4 h-4" />
              </Button>
              
              {/* Access Requests Button */}
              {/* Offline Page Button */}
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setLocation("/offline")}
                className="h-9 w-9"
                title="صفحة Offline"
              >
                <WifiOff className="w-4 h-4" />
              </Button>
              
              {/* Logout Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout} 
                className="hidden sm:flex"
              >
                <LogOut className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">تسجيل الخروج</span>
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleLogout} 
                className="sm:hidden h-9 w-9"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-4 md:py-8">
        {/* Detailed Stats Cards */}
        <DetailedStatsCards />

        {/* Quick Patient Search & Manual Registration */}
        <div className="flex flex-col md:flex-row gap-3 mb-6 md:mb-8">
          <div className="flex-1">
            <QuickPatientSearch />
          </div>
          <div className="flex-shrink-0">
            <ManualRegistrationForm />
          </div>
        </div>

        {/* Notification Center */}
        <div className="mb-6 md:mb-8">
          <NotificationCenter />
        </div>

        {/* Analytics */}
        <div className="mb-6 md:mb-8">
          <SourceAnalytics />
        </div>

        {/* Tabs removed - moved to Bookings Management Page */}

        {/* Leads Table removed */}
        {false && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>قائمة العملاء المسجلين</CardTitle>
                <CardDescription>إدارة ومتابعة جميع العملاء المسجلين في الحملات</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-4 sm:mt-0">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10 h-9 md:h-10"
                    />
                  </div>
                </div>
                <Select value={leadsDateFilter} onValueChange={setLeadsDateFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] h-9 md:h-10">
                    <SelectValue placeholder="كل الفترات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الفترات</SelectItem>
                    <SelectItem value="today">اليوم</SelectItem>
                    <SelectItem value="week">هذا الأسبوع</SelectItem>
                    <SelectItem value="month">هذا الشهر</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={leadsStatusFilter} onValueChange={setLeadsStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] h-9 md:h-10">
                    <SelectValue placeholder="كل الحالات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الحالات</SelectItem>
                    <SelectItem value="new">جديد</SelectItem>
                    <SelectItem value="contacted">تم التواصل</SelectItem>
                    <SelectItem value="booked">تم الحجز</SelectItem>
                    <SelectItem value="not_interested">غير مهتم</SelectItem>
                    <SelectItem value="no_answer">لم يرد</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={leadsSourceFilter} onValueChange={setLeadsSourceFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] h-9 md:h-10">
                    <SelectValue placeholder="كل المصادر" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المصادر</SelectItem>
                    <SelectItem value="website">موقع</SelectItem>
                    <SelectItem value="phone">هاتف</SelectItem>
                    <SelectItem value="manual">يدوي</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!filteredLeads || filteredLeads.length === 0) {
                      toast.error("لا توجد بيانات لتصديرها");
                      return;
                    }
                    const formattedData = formatLeadsForExport(filteredLeads);
                    exportToExcel(formattedData, `leads-${new Date().toISOString().split('T')[0]}`, 'العملاء');
                    toast.success("تم تصدير البيانات بنجاح");
                  }}
                  className="w-full sm:w-auto"
                >
                  <Download className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">تصدير Excel</span>
                  <span className="sm:hidden">تصدير</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {leadsLoading ? (
              <TableSkeleton rows={5} columns={7} />
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-5 h-5 md:w-8 md:h-8 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold text-muted-foreground">
                  {searchTerm ? "لا توجد نتائج للبحث" : "لا يوجد عملاء مسجلين بعد"}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-3 px-1">
                  {filteredLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onUpdateStatus={(lead) => {
                        setSelectedLead(lead);
                        setNewStatus(lead.status);
                        setStatusDialogOpen(true);
                      }}
                      onWhatsApp={(lead) => {
                        const message = `مرحباً ${lead.fullName}،\n\nشكراً لتسجيلك في منصتنا. نود التواصل معك.\n\nالمستشفى السعودي الألماني - صنعاء`;
                        window.open(`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                      }}
                    />
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="table-responsive">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الاسم</TableHead>
                        <TableHead className="text-right">الهاتف</TableHead>
                        <TableHead className="text-right">البريد الإلكتروني</TableHead>
                        <TableHead className="text-right">نوع التسجيل</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">تاريخ التسجيل</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map((lead) => (
                        <TableRow key={lead.id} className={lead.status === 'pending' ? 'bg-red-50 hover:bg-red-100' : ''}>
                          <TableCell className="font-medium">{lead.fullName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span dir="ltr">{lead.phone}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {lead.email ? (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{lead.email}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">غير متوفر</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              (lead as any).type === 'appointment' ? 'bg-blue-500 text-white' :
                              (lead as any).type === 'offer' ? 'bg-purple-500 text-white' :
                              (lead as any).type === 'camp' ? 'bg-green-500 text-white' :
                              'bg-gray-500 text-white'
                            }>
                              {(lead as any).typeLabel || 'غير محدد'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusColors[lead.status as keyof typeof statusColors]} text-white`}>
                              {statusLabels[lead.status as keyof typeof statusLabels]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {new Date(lead.createdAt).toLocaleDateString("ar-YE", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setNewStatus(lead.status);
                                  setStatusDialogOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                تحديث الحالة
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => {
                                  const message = `مرحباً ${lead.fullName}،\n\nشكراً لتسجيلك في منصتنا. نود التواصل معك.\n\nالمستشفى السعودي الألماني - صنعاء`;
                                  window.open(`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                                }}
                              >
                                <MessageSquare className="w-4 h-4 mr-1" />
                                واتساب
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        )}

        {/* Appointments Table removed */}
        {false && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>مواعيد الأطباء</CardTitle>
                <CardDescription>إدارة ومتابعة جميع مواعيد حجز الأطباء</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-4 sm:mt-0">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="بحث بالاسم، الهاتف، أو البريد..."
                    value={appointmentSearchTerm}
                    onChange={(e) => setAppointmentSearchTerm(e.target.value)}
                    className="pr-10 h-9 md:h-10"
                  />
                </div>
                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                  <SelectTrigger className="w-full sm:w-[180px] h-9 md:h-10">
                    <SelectValue placeholder="كل الأطباء" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأطباء</SelectItem>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] h-9 md:h-10">
                    <SelectValue placeholder="كل الفترات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الفترات</SelectItem>
                    <SelectItem value="today">اليوم</SelectItem>
                    <SelectItem value="week">هذا الأسبوع</SelectItem>
                    <SelectItem value="month">هذا الشهر</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={appointmentStatusFilter} onValueChange={setAppointmentStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] h-9 md:h-10">
                    <SelectValue placeholder="كل الحالات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الحالات</SelectItem>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="confirmed">مؤكد</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={appointmentSourceFilter} onValueChange={setAppointmentSourceFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] h-9 md:h-10">
                    <SelectValue placeholder="كل المصادر" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المصادر</SelectItem>
                    <SelectItem value="website">موقع</SelectItem>
                    <SelectItem value="phone">هاتف</SelectItem>
                    <SelectItem value="manual">يدوي</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!filteredAppointments || filteredAppointments.length === 0) {
                      toast.error("لا توجد بيانات لتصديرها");
                      return;
                    }
                    const formattedData = formatAppointmentsForExport(filteredAppointments);
                    exportToExcel(formattedData, `appointments-${new Date().toISOString().split('T')[0]}`, 'مواعيد الأطباء');
                    toast.success("تم تصدير البيانات بنجاح");
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  تصدير Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">إجمالي المواعيد</p>
                      <p className="text-lg md:text-xl font-bold text-primary">{appointmentStats.total}</p>
                    </div>
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">قيد الانتظار</p>
                      <p className="text-lg md:text-xl font-bold text-yellow-600">{appointmentStats.pending}</p>
                    </div>
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">مؤكد</p>
                      <p className="text-lg md:text-xl font-bold text-green-600">{appointmentStats.confirmed}</p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">ملغي</p>
                      <p className="text-lg md:text-xl font-bold text-red-600">{appointmentStats.cancelled}</p>
                    </div>
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {appointmentsLoading ? (
              <TableSkeleton rows={5} columns={9} />
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold text-muted-foreground">
                  {appointmentSearchTerm ? "لا توجد نتائج للبحث" : "لا توجد مواعيد بعد"}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-3 px-1">
                  {filteredAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onViewDetails={(appointment) => {
                        setSelectedAppointment(appointment);
                        setNewAppointmentStatus(appointment.status);
                        setAppointmentStatusDialogOpen(true);
                      }}
                    />
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="table-responsive">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">اسم المريض</TableHead>
                        <TableHead className="text-right">الهاتف</TableHead>
                        <TableHead className="text-right">العمر</TableHead>
                        <TableHead className="text-right">الطبيب</TableHead>
                        <TableHead className="text-right">الإجراء</TableHead>
                        <TableHead className="text-right">التاريخ المفضل</TableHead>
                        <TableHead className="text-right">المصدر</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAppointments.map((appointment) => (
                        <TableRow key={appointment.id} className={appointment.status === 'pending' ? 'bg-red-50 hover:bg-red-100' : ''}>
                          <TableCell className="font-medium">{appointment.fullName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span dir="ltr">{appointment.phone}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {appointment.age ? (
                              <span className="font-medium">{appointment.age} سنة</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">غير محدد</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{appointment.doctorName || `طبيب #${appointment.doctorId}`}</p>
                              {appointment.doctorSpecialty && (
                                <p className="text-xs text-muted-foreground">{appointment.doctorSpecialty}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {appointment.procedure ? (
                              <span className="text-sm">{appointment.procedure}</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">غير محدد</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {appointment.preferredDate || <span className="text-muted-foreground text-sm">غير محدد</span>}
                          </TableCell>
                          <TableCell>
                            <SourceBadge
                              source={(appointment as any).source || 'direct'}
                              utmSource={(appointment as any).utmSource}
                              utmMedium={(appointment as any).utmMedium}
                              utmCampaign={(appointment as any).utmCampaign}
                              referrer={(appointment as any).referrer}
                              fbclid={(appointment as any).fbclid}
                              gclid={(appointment as any).gclid}
                              size="sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                appointment.status === "pending"
                                  ? "bg-yellow-500"
                                  : appointment.status === "confirmed"
                                  ? "bg-green-500"
                                  : appointment.status === "cancelled"
                                  ? "bg-red-500"
                                  : "bg-gray-500"
                              }
                            >
                              {appointment.status === "pending" && "قيد الانتظار"}
                              {appointment.status === "confirmed" && "مؤكد"}
                              {appointment.status === "cancelled" && "ملغي"}
                              {appointment.status === "completed" && "مكتمل"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedAppointment(appointment);
                                  setNewAppointmentStatus(appointment.status);
                                  setAppointmentStatusDialogOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                تحديث الحالة
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => {
                                  const doctorName = appointment.doctorName || `طبيب #${appointment.doctorId}`;
                                  const message = `مرحباً ${appointment.fullName}،\n\nشكراً لحجز موعدك مع ${doctorName}. نود التواصل معك لتأكيد الموعد.\n\nالمستشفى السعودي الألماني - صنعاء`;
                                  window.open(`https://wa.me/${appointment.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                                }}
                              >
                                <MessageSquare className="w-4 h-4 mr-1" />
                                واتساب
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {(appointmentsData?.totalPages ?? 0) > 1 ? (
                  <Pagination
                    currentPage={appointmentsPage}
                    totalPages={appointmentsData?.totalPages ?? 1}
                    totalItems={appointmentsData?.total ?? 0}
                    itemsPerPage={appointmentsLimit}
                    onPageChange={(page) => setAppointmentsPage(page)}
                  />
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
        )}

        {/* Offer Leads Management removed */}
        {/* Camp Registrations Management removed */}


      </main>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تحديث حالة العميل</DialogTitle>
            <DialogDescription>
              قم بتحديث حالة العميل وإضافة ملاحظات إذا لزم الأمر
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="font-semibold">معلومات التسجيل الكاملة:</h4>
                <div className="bg-muted rounded-lg p-3 space-y-1.5">
                  <p className="text-sm"><span className="font-semibold">الاسم:</span> {selectedLead.fullName}</p>
                  <p className="text-sm"><span className="font-semibold">الهاتف:</span> <span dir="ltr">{selectedLead.phone}</span></p>
                  {selectedLead.email && (
                    <p className="text-sm"><span className="font-semibold">البريد الإلكتروني:</span> {selectedLead.email}</p>
                  )}
                  <p className="text-sm"><span className="font-semibold">نوع التسجيل:</span> {selectedLead.registrationType || 'غير محدد'}</p>
                  {selectedLead.source && (
                    <div className="text-sm">
                      <span className="font-semibold">المصدر:</span>
                      <div className="mt-1">
                        <SourceBadge
                          source={selectedLead.source || 'direct'}
                          utmSource={selectedLead.utmSource}
                          utmMedium={selectedLead.utmMedium}
                          utmCampaign={selectedLead.utmCampaign}
                          referrer={selectedLead.referrer}
                          fbclid={selectedLead.fbclid}
                          gclid={selectedLead.gclid}
                          showDetails={true}
                          size="md"
                        />
                      </div>
                    </div>
                  )}
                  {selectedLead.notes && (
                    <p className="text-sm"><span className="font-semibold">ملاحظات:</span> {selectedLead.notes}</p>
                  )}
                  <p className="text-sm"><span className="font-semibold">تاريخ التسجيل:</span> {new Date(selectedLead.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">الحالة الجديدة</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">جديد</SelectItem>
                    <SelectItem value="contacted">تم التواصل</SelectItem>
                    <SelectItem value="booked">تم الحجز</SelectItem>
                    <SelectItem value="not_interested">غير مهتم</SelectItem>
                    <SelectItem value="no_answer">لم يرد</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                <Textarea
                  id="notes"
                  placeholder="أضف أي ملاحظات حول هذا التحديث..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusDialogOpen(false);
                    setSelectedLead(null);
                    setNewStatus("");
                    setStatusNotes("");
                  }}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleStatusUpdate}
                  disabled={!newStatus || updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    "حفظ التغييرات"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Appointment Status Update Dialog */}
      <Dialog open={appointmentStatusDialogOpen} onOpenChange={setAppointmentStatusDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تحديث حالة الموعد</DialogTitle>
            <DialogDescription>
              قم بتحديث حالة الموعد
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="font-semibold">معلومات الموعد:</h4>
                <div className="bg-muted rounded-lg p-3 space-y-1">
                  <p className="text-sm"><span className="font-semibold">المريض:</span> {selectedAppointment.fullName}</p>
                  <p className="text-sm"><span className="font-semibold">الهاتف:</span> {selectedAppointment.phone}</p>
                  {selectedAppointment.email && (
                    <p className="text-sm"><span className="font-semibold">البريد:</span> {selectedAppointment.email}</p>
                  )}
                  {selectedAppointment.age && (
                    <p className="text-sm"><span className="font-semibold">العمر:</span> {selectedAppointment.age} سنة</p>
                  )}
                  <p className="text-sm"><span className="font-semibold">الطبيب:</span> {selectedAppointment.doctorName || `طبيب #${selectedAppointment.doctorId}`}</p>
                  {selectedAppointment.doctorSpecialty && (
                    <p className="text-sm"><span className="font-semibold">التخصص:</span> {selectedAppointment.doctorSpecialty}</p>
                  )}
                  {selectedAppointment.procedure && (
                    <p className="text-sm"><span className="font-semibold">الإجراء المطلوب:</span> {selectedAppointment.procedure}</p>
                  )}
                  {selectedAppointment.preferredDate && (
                    <p className="text-sm"><span className="font-semibold">التاريخ المفضل:</span> {selectedAppointment.preferredDate}</p>
                  )}
                  {selectedAppointment.preferredTime && (
                    <p className="text-sm"><span className="font-semibold">الوقت المفضل:</span> {selectedAppointment.preferredTime}</p>
                  )}
                  {selectedAppointment.additionalNotes && (
                    <p className="text-sm"><span className="font-semibold">ملاحظات المريض:</span> {selectedAppointment.additionalNotes}</p>
                  )}
                  {selectedAppointment.staffNotes && (
                    <p className="text-sm"><span className="font-semibold">ملاحظات الموظف:</span> {selectedAppointment.staffNotes}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointment-date">تاريخ ووقت الموعد المحدد (اختياري)</Label>
                <Input
                  id="appointment-date"
                  type="datetime-local"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="text-right"
                />
                <p className="text-xs text-muted-foreground">سيتم إرسال رسالة WhatsApp للعميل عند تأكيد الموعد</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointment-status">الحالة الجديدة</Label>
                <Select value={newAppointmentStatus} onValueChange={setNewAppointmentStatus}>
                  <SelectTrigger id="appointment-status">
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="confirmed">مؤكد</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointment-staff-notes">ملاحظات الموظف (اختياري)</Label>
                <Textarea
                  id="appointment-staff-notes"
                  placeholder="أضف أي ملاحظات حول هذا الموعد..."
                  value={appointmentStatusNotes}
                  onChange={(e) => setAppointmentStatusNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAppointmentStatusDialogOpen(false);
                    setSelectedAppointment(null);
                    setNewAppointmentStatus("");
                  }}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleAppointmentStatusUpdate}
                  disabled={!newAppointmentStatus || updateAppointmentStatusMutation.isPending}
                >
                  {updateAppointmentStatusMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    "حفظ التغييرات"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

// Offers Management Component
function OffersManagement() {
  const utils = trpc.useUtils();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    imageUrl: "",
    isActive: true,
    startDate: "",
    endDate: "",
  });

  const { data: offers, isLoading, refetch } = trpc.offers.getAll.useQuery();
  
  const createMutation = trpc.offers.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء العرض بنجاح");
      refetch();
      setShowAddDialog(false);
      resetForm();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إنشاء العرض");
    },
  });

  const updateMutation = trpc.offers.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث العرض بنجاح");
      refetch();
      setEditingOffer(null);
      resetForm();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث العرض");
    },
  });

  const deleteMutation = trpc.offers.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف العرض بنجاح");
      refetch();
      // Invalidate all related queries to update stats
      utils.offerLeads.list.invalidate();
      utils.leads.unifiedList.invalidate();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف العرض");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      description: "",
      imageUrl: "",
      isActive: true,
      startDate: "",
      endDate: "",
    });
  };

  const handleSubmit = () => {
    if (editingOffer) {
      updateMutation.mutate({
        id: editingOffer.id,
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      });
    } else {
      createMutation.mutate({
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      });
    }
  };

  const handleEdit = (offer: any) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      slug: offer.slug,
      description: offer.description || "",
      imageUrl: offer.imageUrl || "",
      isActive: offer.isActive,
      startDate: offer.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : "",
      endDate: offer.endDate ? new Date(offer.endDate).toISOString().split('T')[0] : "",
    });
    setShowAddDialog(true);
  };

  // Calculate stats
  const totalOffers = offers?.length || 0;
  const activeOffers = offers?.filter(o => o.isActive === true).length || 0;
  const inactiveOffers = offers?.filter(o => o.isActive === false).length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle>إدارة العروض الطبية</CardTitle>
            <CardDescription>إضافة وتعديل وحذف العروض الطبية</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setEditingOffer(null); setShowAddDialog(true); }} className="w-full sm:w-auto">
            إضافة عرض جديد
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-3 md:p-4">
              <div className="text-xs md:text-sm text-blue-700 mb-1">إجمالي العروض</div>
              <div className="text-xl md:text-2xl font-bold text-blue-900">{totalOffers}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-3 md:p-4">
              <div className="text-xs md:text-sm text-green-700 mb-1">عروض نشطة</div>
              <div className="text-xl md:text-2xl font-bold text-green-900">{activeOffers}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardContent className="p-3 md:p-4">
              <div className="text-xs md:text-sm text-gray-700 mb-1">عروض غير نشطة</div>
              <div className="text-xl md:text-2xl font-bold text-gray-900">{inactiveOffers}</div>
            </CardContent>
          </Card>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton rows={3} columns={6} />
        ) : offers && offers.length > 0 ? (
          <div className="table-responsive">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right table-sticky-col">العنوان</TableHead>
                  <TableHead className="text-right">الرابط</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ البداية</TableHead>
                  <TableHead className="text-right">تاريخ النهاية</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell className="font-medium table-sticky-col">{offer.title}</TableCell>
                    <TableCell>
                      <a href={`/offers?id=${offer.slug}`} target="_blank" className="text-blue-600 hover:underline">
                        {offer.slug}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge className={offer.isActive ? "bg-green-500" : "bg-gray-500"}>
                        {offer.isActive ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {offer.startDate ? new Date(offer.startDate).toLocaleDateString('ar-YE') : "-"}
                    </TableCell>
                    <TableCell>
                      {offer.endDate ? new Date(offer.endDate).toLocaleDateString('ar-YE') : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(offer)}>
                          تعديل
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => {
                            if (confirm("هل أنت متأكد من حذف هذا العرض؟")) {
                              deleteMutation.mutate({ id: offer.id });
                            }
                          }}
                        >
                          حذف
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد عروض حالياً. قم بإضافة عرض جديد.
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingOffer ? "تعديل العرض" : "إضافة عرض جديد"}</DialogTitle>
            <DialogDescription>
              {editingOffer ? "قم بتعديل بيانات العرض" : "أدخل بيانات العرض الجديد"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان العرض *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="مثال: عرض الولادة الخاص"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">الرابط (slug) *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="مثال: birth-offer"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف تفصيلي للعرض..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">رابط الصورة</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                dir="ltr"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">تاريخ البداية</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">تاريخ النهاية</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isActive">العرض نشط</Label>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); setEditingOffer(null); }}>
                إلغاء
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!formData.title || !formData.slug || createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : editingOffer ? "حفظ التغييرات" : "إضافة العرض"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}


// Camps Management Component
function CampsManagement() {
  const utils = trpc.useUtils();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCamp, setEditingCamp] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    isActive: true,
    startDate: "",
    endDate: "",
  });

  const { data: camps, isLoading, refetch } = trpc.camps.getAll.useQuery();
  
  const createMutation = trpc.camps.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء المخيم بنجاح");
      refetch();
      setShowAddDialog(false);
      resetForm();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إنشاء المخيم");
    },
  });

  const updateMutation = trpc.camps.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث المخيم بنجاح");
      refetch();
      setEditingCamp(null);
      resetForm();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث المخيم");
    },
  });

  const deleteMutation = trpc.camps.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المخيم بنجاح");
      refetch();
      // Invalidate all related queries to update stats
      utils.campRegistrations.list.invalidate();
      utils.leads.unifiedList.invalidate();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف المخيم");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      imageUrl: "",
      isActive: true,
      startDate: "",
      endDate: "",
    });
  };

  const handleSubmit = () => {
    if (editingCamp) {
      updateMutation.mutate({
        id: editingCamp.id,
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      });
    } else {
      createMutation.mutate({
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      });
    }
  };

  const handleEdit = (camp: any) => {
    setEditingCamp(camp);
    setFormData({
      name: camp.name,
      slug: camp.slug,
      description: camp.description || "",
      imageUrl: camp.imageUrl || "",
      isActive: camp.isActive,
      startDate: camp.startDate ? new Date(camp.startDate).toISOString().split('T')[0] : "",
      endDate: camp.endDate ? new Date(camp.endDate).toISOString().split('T')[0] : "",
    });
    setShowAddDialog(true);
  };

  // Calculate stats
  const totalCamps = camps?.length || 0;
  const activeCamps = camps?.filter(c => c.isActive === true).length || 0;
  const inactiveCamps = camps?.filter(c => c.isActive === false).length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle>إدارة المخيمات الطبية</CardTitle>
            <CardDescription>إضافة وتعديل وحذف المخيمات الطبية</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setEditingCamp(null); setShowAddDialog(true); }} className="w-full sm:w-auto">
            إضافة مخيم جديد
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-3 md:p-4">
              <div className="text-xs md:text-sm text-purple-700 mb-1">إجمالي المخيمات</div>
              <div className="text-xl md:text-2xl font-bold text-purple-900">{totalCamps}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-3 md:p-4">
              <div className="text-xs md:text-sm text-green-700 mb-1">مخيمات نشطة</div>
              <div className="text-xl md:text-2xl font-bold text-green-900">{activeCamps}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardContent className="p-3 md:p-4">
              <div className="text-xs md:text-sm text-gray-700 mb-1">مخيمات غير نشطة</div>
              <div className="text-xl md:text-2xl font-bold text-gray-900">{inactiveCamps}</div>
            </CardContent>
          </Card>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : camps && camps.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الرابط</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ البداية</TableHead>
                  <TableHead className="text-right">تاريخ النهاية</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {camps.map((camp) => (
                  <TableRow key={camp.id}>
                    <TableCell className="font-medium">{camp.name}</TableCell>
                    <TableCell>
                      <a href={`/camps?id=${camp.slug}`} target="_blank" className="text-green-600 hover:underline">
                        {camp.slug}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge className={camp.isActive ? "bg-green-500" : "bg-gray-500"}>
                        {camp.isActive ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {camp.startDate ? new Date(camp.startDate).toLocaleDateString('ar-YE') : "-"}
                    </TableCell>
                    <TableCell>
                      {camp.endDate ? new Date(camp.endDate).toLocaleDateString('ar-YE') : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(camp)}>
                          تعديل
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => {
                            if (confirm("هل أنت متأكد من حذف هذا المخيم؟")) {
                              deleteMutation.mutate({ id: camp.id });
                            }
                          }}
                        >
                          حذف
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد مخيمات حالياً. قم بإضافة مخيم جديد.
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingCamp ? "تعديل المخيم" : "إضافة مخيم جديد"}</DialogTitle>
            <DialogDescription>
              {editingCamp ? "قم بتعديل بيانات المخيم" : "أدخل بيانات المخيم الجديد"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم المخيم *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: مخيم الجراحة العامة"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">الرابط (slug) *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="مثال: surgery-camp"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف تفصيلي للمخيم..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">رابط الصورة</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                dir="ltr"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">تاريخ البداية</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">تاريخ النهاية</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isActive">المخيم نشط</Label>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); setEditingCamp(null); }}>
                إلغاء
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!formData.name || !formData.slug || createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : editingCamp ? "حفظ التغييرات" : "إضافة المخيم"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
