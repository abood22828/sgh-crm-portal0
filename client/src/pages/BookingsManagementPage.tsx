import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import OfferLeadsManagement from "@/components/OfferLeadsManagement";
import CampRegistrationsManagement from "@/components/CampRegistrationsManagement";
import ManualRegistrationForm from "@/components/ManualRegistrationForm";
import LeadCard from "@/components/LeadCard";
import AppointmentCard from "@/components/AppointmentCard";
import ActionButtons from "@/components/ActionButtons";
import EmptyState from "@/components/EmptyState";
import TableSkeleton from "@/components/TableSkeleton";
import QuickFilters from "@/components/QuickFilters";
import InlineStatusEditor from "@/components/InlineStatusEditor";
import CommentsSection from "@/components/CommentsSection";
import CommentCount from "@/components/CommentCount";
import TaskCount from "@/components/TaskCount";
import TasksSection from "@/components/TasksSection";
import { DateRangePicker } from "@/components/DateRangePicker";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Users, 
  UserCheck, 
  Calendar, 
  Search, 
  TrendingUp,
  Phone,
  Mail,
  Loader2,
  Download,
  ArrowRight,
  Plus,
  Settings,
  BarChart3,
  Printer,
  CalendarOff,
  CheckSquare,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel, formatLeadsForExport, formatAppointmentsForExport } from "@/lib/exportToExcel";
import { printReceipt } from "@/components/PrintReceipt";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";

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

// Sanitize lead data to prevent JSON parsing errors
const sanitizeLead = (lead: any) => {
  if (!lead) return null;
  const sanitized = { ...lead };
  // Remove NaN, undefined, or invalid values
  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key];
    if (value === undefined || value === null || (typeof value === 'number' && isNaN(value))) {
      delete sanitized[key];
    }
  });
  return sanitized;
};

export default function BookingsManagementPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [leadsDateFilter, setLeadsDateFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"leads" | "appointments" | "offerLeads" | "campRegistrations" | "tasks">("leads");
  
  // Date Range State - Default to last 7 days
  const [dateRange, setDateRange] = useState(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 7);
    return { from, to };
  });
  
  // Handle query parameters for direct navigation from notifications
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const type = params.get('type');
    const tab = params.get('tab');
    
    if (id && type) {
      // Switch to appropriate tab
      if (type === 'appointment') {
        setActiveTab('appointments');
      } else if (type === 'offer') {
        setActiveTab('offerLeads');
      } else if (type === 'camp') {
        setActiveTab('campRegistrations');
      }
      
      // Clear query parameters after handling
      window.history.replaceState({}, '', '/dashboard/bookings');
    } else if (tab) {
      // Handle tab parameter from NotificationCenter
      if (tab === 'appointments' || tab === 'offerLeads' || tab === 'campRegistrations' || tab === 'leads') {
        setActiveTab(tab as any);
      }
      
      // Clear query parameters after handling
      window.history.replaceState({}, '', '/dashboard/bookings');
    }
  }, [location]);
  const [manualRegistrationOpen, setManualRegistrationOpen] = useState(false);

  // State variables - define first
  // Removed pagination - using date range instead
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
  const [offerLeadsPendingCount, setOfferLeadsPendingCount] = useState(0);
  const [campRegistrationsPendingCount, setCampRegistrationsPendingCount] = useState(0);
  
  // Sorting state
  const [appointmentSortField, setAppointmentSortField] = useState<'date' | 'name' | 'status' | null>(null);
  const [appointmentSortDirection, setAppointmentSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Debounced search terms for better performance
  const debouncedAppointmentSearch = useDebounce(appointmentSearchTerm, 500);
  const debouncedLeadsSearch = useDebounce(searchTerm, 500);

  // Data queries
  const { data: unifiedLeads, isLoading: leadsLoading, refetch: refetchLeads } = trpc.leads.list.useQuery();
  const { data: stats } = trpc.leads.stats.useQuery();
  const { data: appointmentsData, isLoading: appointmentsLoading, refetch: refetchAppointments } = trpc.appointments.listPaginated.useQuery({
    page: 1,
    limit: 10000, // Get all records within date range
    searchTerm: debouncedAppointmentSearch,
    doctorId: selectedDoctor !== "all" ? parseInt(selectedDoctor) : undefined,
    source: appointmentSourceFilter !== "all" ? appointmentSourceFilter : undefined,
    status: appointmentStatusFilter !== "all" ? appointmentStatusFilter : undefined,
    dateFrom: dateRange.from.toISOString(),
    dateTo: dateRange.to.toISOString(),
  });
  const appointments = appointmentsData?.data || [];
  const { data: doctors = [] } = trpc.doctors.list.useQuery();
  
  // Load offerLeads and campRegistrations data directly to show badges immediately
  const { data: offerLeadsData } = trpc.offerLeads.list.useQuery();
  const { data: campRegistrationsData } = trpc.campRegistrations.list.useQuery();
  
  const pendingCounts = useMemo(() => {
    const leadsPending = unifiedLeads?.filter(l => l.status === 'new').length || 0;
    const appointmentsPending = appointments?.filter(a => a.status === 'pending').length || 0;
    // Use direct data if available, otherwise use state from child components
    const offerLeadsPending = offerLeadsData?.filter((o: any) => o.status === 'pending').length || offerLeadsPendingCount;
    const campRegistrationsPending = campRegistrationsData?.filter((c: any) => c.status === 'pending').length || campRegistrationsPendingCount;
    return {
      leads: leadsPending,
      appointments: appointmentsPending,
      offerLeads: offerLeadsPending,
      campRegistrations: campRegistrationsPending,
    };
  }, [unifiedLeads, appointments, offerLeadsData, campRegistrationsData, offerLeadsPendingCount, campRegistrationsPendingCount]);

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

  const utils = trpc.useUtils();
  
  const updateAppointmentStatusMutation = trpc.appointments.updateStatus.useMutation({
    onMutate: async (variables) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await utils.appointments.listPaginated.cancel();
      
      // Snapshot previous value
      const previousData = utils.appointments.listPaginated.getData();
      
      // Optimistically update the cache
      utils.appointments.listPaginated.setData(
        {
          page: 1,
          limit: 10000,
          searchTerm: debouncedAppointmentSearch,
          doctorId: selectedDoctor !== "all" ? parseInt(selectedDoctor) : undefined,
          source: appointmentSourceFilter !== "all" ? appointmentSourceFilter : undefined,
          status: appointmentStatusFilter !== "all" ? appointmentStatusFilter : undefined,
          dateFrom: dateRange.from.toISOString(),
          dateTo: dateRange.to.toISOString(),
        },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((apt: any) =>
              apt.id === variables.id
                ? { ...apt, status: variables.status }
                : apt
            ),
          };
        }
      );
      
      return { previousData };
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة الموعد بنجاح");
      setAppointmentStatusDialogOpen(false);
      setSelectedAppointment(null);
      setNewAppointmentStatus("");
      setAppointmentStatusNotes("");
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        utils.appointments.listPaginated.setData(
          {
            page: 1,
            limit: 10000,
            searchTerm: debouncedAppointmentSearch,
            doctorId: selectedDoctor !== "all" ? parseInt(selectedDoctor) : undefined,
            source: appointmentSourceFilter !== "all" ? appointmentSourceFilter : undefined,
            status: appointmentStatusFilter !== "all" ? appointmentStatusFilter : undefined,
            dateFrom: dateRange.from.toISOString(),
            dateTo: dateRange.to.toISOString(),
          },
          context.previousData
        );
      }
      toast.error("حدث خطأ أثناء تحديث الحالة");
    },
    onSettled: () => {
      // Always refetch after error or success to ensure sync
      utils.appointments.listPaginated.invalidate();
    },
  });

  const filteredLeads = useMemo(() => {
    if (!unifiedLeads) return [];
    
    let filtered = unifiedLeads;
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lead: any) =>
          lead.fullName.toLowerCase().includes(term) ||
          lead.phone.includes(term) ||
          (lead.email && lead.email.toLowerCase().includes(term))
      );
    }
    
    // Filter by date
    if (leadsDateFilter && leadsDateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter((lead: any) => {
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
      filtered = filtered.filter((lead: any) => lead.status === leadsStatusFilter);
    }
    
    // Filter by source
    if (leadsSourceFilter && leadsSourceFilter !== "all") {
      filtered = filtered.filter((lead: any) => lead.source === leadsSourceFilter);
    }
    
    return filtered;
  }, [unifiedLeads, searchTerm, leadsDateFilter, leadsStatusFilter, leadsSourceFilter]);

  // Apply sorting to appointments
  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];
    
    let sorted = [...appointments];
    
    if (appointmentSortField) {
      sorted.sort((a: any, b: any) => {
        let aValue, bValue;
        
        switch (appointmentSortField) {
          case 'date':
            aValue = new Date(a.appointmentDate).getTime();
            bValue = new Date(b.appointmentDate).getTime();
            break;
          case 'name':
            aValue = a.patientName.toLowerCase();
            bValue = b.patientName.toLowerCase();
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          default:
            return 0;
        }
        
        if (aValue < bValue) return appointmentSortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return appointmentSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return sorted;
  }, [appointments, appointmentSortField, appointmentSortDirection]);

  const appointmentStats = useMemo(() => {
    if (!appointments) return { total: 0, pending: 0, confirmed: 0, cancelled: 0 };
    return {
      total: appointments.length,
      pending: appointments.filter((a: any) => a.status === "pending").length,
      confirmed: appointments.filter((a: any) => a.status === "confirmed").length,
      cancelled: appointments.filter((a: any) => a.status === "cancelled").length,
    };
  }, [appointments]);

  const handleStatusUpdate = () => {
    if (!selectedLead || !newStatus) return;
    
    updateStatusMutation.mutate({
      id: selectedLead.id,
      status: newStatus as "new" | "contacted" | "booked" | "not_interested" | "no_answer",
      notes: statusNotes,
    });
  };

  const handleAppointmentStatusUpdate = () => {
    if (!selectedAppointment || !newAppointmentStatus) return;
    
    updateAppointmentStatusMutation.mutate({
      id: selectedAppointment.id,
      status: newAppointmentStatus,
      staffNotes: appointmentStatusNotes,
    });
  };

  const handleExportLeads = () => {
    if (!filteredLeads || filteredLeads.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }
    
    const formattedData = formatLeadsForExport(filteredLeads);
    exportToExcel(formattedData, "تسجيلات_العملاء");
    toast.success("تم تصدير البيانات بنجاح");
  };

  const handleExportAppointments = () => {
    if (!filteredAppointments || filteredAppointments.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }
    
    const formattedData = formatAppointmentsForExport(filteredAppointments);
    exportToExcel(formattedData, "مواعيد_الأطباء");
    toast.success("تم تصدير البيانات بنجاح");
  };

  return (
    <DashboardLayout
      pageTitle="إدارة الحجوزات"
      pageDescription="إدارة ومتابعة جميع الحجوزات والمواعيد"
    >
      <div className="container mx-auto py-6 space-y-6" dir="rtl">
        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => setLocation('/dashboard/camp-stats')}
              variant="outline"
              className="gap-2"
              size="sm"
            >
              <BarChart3 className="h-4 w-4" />
              إحصائيات المخيمات
            </Button>
          <Button
            onClick={() => setManualRegistrationOpen(true)}
            className="gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            تسجيل يدوي
          </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pt-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <Button
            variant={activeTab === "leads" ? "default" : "outline"}
            onClick={() => setActiveTab("leads")}
            className="flex-shrink-0 gap-2 relative"
          >
            <Users className="h-4 w-4" />
            تسجيلات العملاء
            {pendingCounts.leads > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -left-2 h-6 w-6 flex items-center justify-center p-0 text-xs font-bold rounded-full shadow-lg">
                {pendingCounts.leads}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === "appointments" ? "default" : "outline"}
            onClick={() => setActiveTab("appointments")}
            className="flex-shrink-0 gap-2 relative"
          >
            <Calendar className="h-4 w-4" />
            مواعيد الأطباء
            {pendingCounts.appointments > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -left-2 h-6 w-6 flex items-center justify-center p-0 text-xs font-bold rounded-full shadow-lg">
                {pendingCounts.appointments}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === "offerLeads" ? "default" : "outline"}
            onClick={() => setActiveTab("offerLeads")}
            className="flex-shrink-0 gap-2 relative"
          >
            <TrendingUp className="h-4 w-4" />
            حجوزات العروض
            {pendingCounts.offerLeads > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -left-2 h-6 w-6 flex items-center justify-center p-0 text-xs font-bold rounded-full shadow-lg">
                {pendingCounts.offerLeads}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === "campRegistrations" ? "default" : "outline"}
            onClick={() => setActiveTab("campRegistrations")}
            className="flex-shrink-0 gap-2 relative"
          >
            <UserCheck className="h-4 w-4" />
            تسجيلات المخيمات
            {pendingCounts.campRegistrations > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -left-2 h-6 w-6 flex items-center justify-center p-0 text-xs font-bold rounded-full shadow-lg">
                {pendingCounts.campRegistrations}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === "tasks" ? "default" : "outline"}
            onClick={() => setActiveTab("tasks")}
            className="flex-shrink-0 gap-2"
          >
            <CheckSquare className="h-4 w-4" />
            المهام
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === "leads" && (
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">إجمالي العملاء</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold">{stats?.total || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">جديد</CardTitle>
                  <UserCheck className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold">{stats?.new || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">تم التواصل</CardTitle>
                  <Phone className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold">{stats?.contacted || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">تم الحجز</CardTitle>
                  <Calendar className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold">{stats?.booked || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>تسجيلات العملاء</CardTitle>
                <CardDescription>إدارة ومتابعة تسجيلات العملاء</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters - Responsive Grid */}
                <div className="flex flex-col gap-3">
                  {/* Quick Filter Button */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant={leadsStatusFilter === "new" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLeadsStatusFilter(leadsStatusFilter === "new" ? "all" : "new")}
                      className="gap-2 h-9 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
                    >
                      <TrendingUp className="h-4 w-4" />
                      {leadsStatusFilter === "new" ? "عرض الكل" : "المعلقة فقط"}
                      {leadsStatusFilter !== "new" && pendingCounts.leads > 0 && (
                        <Badge variant="secondary" className="mr-1 bg-white text-orange-600">
                          {pendingCounts.leads}
                        </Badge>
                      )}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                    <div className="relative sm:col-span-2 lg:col-span-1">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="ابحث..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10 h-9"
                      />
                    </div>
                    <Select value={leadsDateFilter} onValueChange={setLeadsDateFilter}>
                      <SelectTrigger className="h-9">
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
                      <SelectTrigger className="h-9">
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
                      <SelectTrigger className="h-9">
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
                      onClick={handleExportLeads}
                      className="gap-2 h-9"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">تصدير</span>
                    </Button>
                  </div>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden space-y-4">
                  {leadsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredLeads.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد تسجيلات
                    </div>
                  ) : (
                    filteredLeads.map((lead: any) => (
                      <LeadCard
                        key={`lead-${lead.id}`}
                        lead={lead}
                        onUpdateStatus={(lead) => {
                          setSelectedLead(sanitizeLead(lead));
                          setNewStatus(lead.status);
                          setStatusDialogOpen(true);
                        }}
                        onWhatsApp={(phone) => {
                          window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
                        }}
                      />
                    ))
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="table-responsive">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>الهاتف</TableHead>
                        <TableHead>البريد الإلكتروني</TableHead>
                        <TableHead>المصدر</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leadsLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : filteredLeads.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            لا توجد تسجيلات
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLeads.map((lead: any) => (
                          <TableRow 
                            key={`lead-${lead.id}`}
                            className={lead.status === 'pending' ? 'bg-red-50 hover:bg-red-100' : ''}
                          >
                            <TableCell className="font-medium">{lead.fullName}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{lead.phone}</span>
                                <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
                                  <Phone className="h-4 w-4" />
                                </a>
                              </div>
                            </TableCell>
                            <TableCell>
                              {lead.email ? (
                                <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                                  {lead.email}
                                </a>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {lead.source === 'website' && 'موقع'}
                              {lead.source === 'phone' && 'هاتف'}
                              {lead.source === 'manual' && 'يدوي'}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusColors[lead.status as keyof typeof statusColors]}>
                                {statusLabels[lead.status as keyof typeof statusLabels]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(lead.createdAt).toLocaleDateString("ar-EG")}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedLead(sanitizeLead(lead));
                                  setNewStatus(lead.status);
                                  setStatusDialogOpen(true);
                                }}
                              >
                                تحديث الحالة
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "appointments" && (
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">إجمالي المواعيد</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold">{appointmentStats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">قيد الانتظار</CardTitle>
                  <Calendar className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold">{appointmentStats.pending}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">مؤكد</CardTitle>
                  <Calendar className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold">{appointmentStats.confirmed}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">ملغي</CardTitle>
                  <Calendar className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold">{appointmentStats.cancelled}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>مواعيد الأطباء</CardTitle>
                <CardDescription>إدارة ومتابعة مواعيد الأطباء</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters - Responsive Grid */}
                <div className="flex flex-col gap-3">
                  {/* Quick Filters */}
                  <QuickFilters
                    filters={[
                      { label: 'الكل', value: 'all', count: appointmentStats.total },
                      { label: 'قيد الانتظار', value: 'pending', count: appointmentStats.pending, color: 'text-yellow-600 hover:bg-yellow-50' },
                      { label: 'مؤكد', value: 'confirmed', count: appointmentStats.confirmed, color: 'text-green-600 hover:bg-green-50' },
                      { label: 'ملغي', value: 'cancelled', count: appointmentStats.cancelled, color: 'text-red-600 hover:bg-red-50' },
                    ]}
                    activeFilter={appointmentStatusFilter}
                    onFilterChange={setAppointmentStatusFilter}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
                    <div className="relative sm:col-span-2 lg:col-span-1">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="ابحث..."
                        value={appointmentSearchTerm}
                        onChange={(e) => setAppointmentSearchTerm(e.target.value)}
                        className="pr-10 h-9"
                      />
                    </div>
                    <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="كل الأطباء" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">كل الأطباء</SelectItem>
                        {doctors.map((doctor: any) => (
                          <SelectItem key={doctor.id} value={doctor.id.toString()}>
                            {doctor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="h-9">
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
                      <SelectTrigger className="h-9">
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
                      <SelectTrigger className="h-9">
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
                      onClick={handleExportAppointments}
                      className="gap-2 h-9"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">تصدير</span>
                    </Button>
                  </div>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden space-y-4">
                  {appointmentsLoading ? (
                    <TableSkeleton rows={3} columns={4} />
                  ) : filteredAppointments.length === 0 ? (
                    <EmptyState
                      icon={CalendarOff}
                      title="لا توجد مواعيد"
                      description="لم يتم العثور على أي مواعيد في الفترة المحددة. جرب تغيير الفلاتر أو إضافة موعد جديد."
                    />
                  ) : (
                    filteredAppointments.map((appointment: any) => (
                      <AppointmentCard
                        key={`appointment-${appointment.id}`}
                        appointment={appointment}
                        onViewDetails={(appointment: any) => {
                          setSelectedAppointment(appointment);
                          setNewAppointmentStatus(appointment.status);
                          setAppointmentDate(appointment.appointmentDate);
                          setAppointmentStatusDialogOpen(true);
                        }}
                        onPrint={() => {
                          const doctorName = appointment.doctorName || `طبيب #${appointment.doctorId}`;
                          printReceipt({
                            fullName: appointment.fullName,
                            phone: appointment.phone,
                            age: appointment.age ?? undefined,
                            registrationDate: new Date(appointment.createdAt),
                            type: "appointment",
                            typeName: doctorName
                          }, user?.name || "مستخدم");
                        }}
                      />
                    ))
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="table-responsive">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم السند</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50 select-none"
                          onClick={() => {
                            if (appointmentSortField === 'name') {
                              setAppointmentSortDirection(appointmentSortDirection === 'asc' ? 'desc' : 'asc');
                            } else {
                              setAppointmentSortField('name');
                              setAppointmentSortDirection('asc');
                            }
                          }}
                        >
                          <div className="flex items-center gap-1">
                            اسم المريض
                            {appointmentSortField === 'name' && (
                              <span className="text-xs">{appointmentSortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead>الهاتف</TableHead>
                        <TableHead>الطبيب</TableHead>
                        <TableHead>التخصص</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50 select-none"
                          onClick={() => {
                            if (appointmentSortField === 'date') {
                              setAppointmentSortDirection(appointmentSortDirection === 'asc' ? 'desc' : 'asc');
                            } else {
                              setAppointmentSortField('date');
                              setAppointmentSortDirection('desc'); // Default to newest first
                            }
                          }}
                        >
                          <div className="flex items-center gap-1">
                            موعد الحجز
                            {appointmentSortField === 'date' && (
                              <span className="text-xs">{appointmentSortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead>المصدر</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50 select-none"
                          onClick={() => {
                            if (appointmentSortField === 'status') {
                              setAppointmentSortDirection(appointmentSortDirection === 'asc' ? 'desc' : 'asc');
                            } else {
                              setAppointmentSortField('status');
                              setAppointmentSortDirection('asc');
                            }
                          }}
                        >
                          <div className="flex items-center gap-1">
                            الحالة
                            {appointmentSortField === 'status' && (
                              <span className="text-xs">{appointmentSortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead>التعليقات</TableHead>
                        <TableHead>المهام</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointmentsLoading ? (
                        <TableRow>
                          <TableCell colSpan={9} className="p-0">
                            <TableSkeleton rows={5} columns={9} />
                          </TableCell>
                        </TableRow>
                      ) : filteredAppointments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="py-12">
                            <EmptyState
                              icon={CalendarOff}
                              title="لا توجد مواعيد"
                              description="لم يتم العثور على أي مواعيد في الفترة المحددة. جرب تغيير الفلاتر أو إضافة موعد جديد."
                            />
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAppointments.map((appointment: any) => (
                          <TableRow 
                            key={`appointment-${appointment.id}`}
                            className={appointment.status === 'pending' ? 'bg-red-50 hover:bg-red-100' : ''}
                          >
                            <TableCell className="text-sm text-muted-foreground font-mono">
                              {appointment.receiptNumber || "-"}
                            </TableCell>
                            <TableCell className="font-medium">{appointment.patientName}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{appointment.phone}</span>
                                <ActionButtons
                                  phoneNumber={appointment.phone}
                                  showWhatsApp={true}
                                  whatsAppMessage={`مرحباً ${appointment.patientName}، هذه رسالة من المستشفى السعودي الألماني - صنعاء بخصوص موعدك مع ${appointment.doctorName}.`}
                                  size="sm"
                                  variant="ghost"
                                />
                              </div>
                            </TableCell>
                            <TableCell>{appointment.doctorName}</TableCell>
                            <TableCell>{appointment.doctorSpecialty}</TableCell>
                            <TableCell>
                              {new Date(appointment.appointmentDate).toLocaleDateString("ar-EG")}
                            </TableCell>
                            <TableCell>
                              {(appointment as any).source === 'website' && 'موقع'}
                              {(appointment as any).source === 'phone' && 'هاتف'}
                              {(appointment as any).source === 'manual' && 'يدوي'}
                              {!(appointment as any).source && '-'}
                            </TableCell>
                            <TableCell>
                              <InlineStatusEditor
                                currentStatus={appointment.status}
                                statusOptions={[
                                  { value: 'pending', label: 'قيد الانتظار', color: 'bg-yellow-500' },
                                  { value: 'confirmed', label: 'مؤكد', color: 'bg-green-500' },
                                  { value: 'completed', label: 'مكتمل', color: 'bg-blue-500' },
                                  { value: 'cancelled', label: 'ملغي', color: 'bg-red-500' },
                                ]}
                                onSave={async (newStatus) => {
                                  await updateAppointmentStatusMutation.mutateAsync({
                                    id: appointment.id,
                                    status: newStatus,
                                    staffNotes: '',
                                  });
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <CommentCount
                                entityType="appointment"
                                entityId={appointment.id}
                              />
                            </TableCell>
                            <TableCell>
                              <TaskCount
                                entityType="appointment"
                                entityId={appointment.id}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedAppointment(appointment);
                                        setNewAppointmentStatus(appointment.status);
                                        setAppointmentDate(appointment.appointmentDate);
                                        setAppointmentStatusDialogOpen(true);
                                      }}
                                    >
                                      <Settings className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>تحديث الحالة</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      onClick={() => {
                                        const doctorName = appointment.doctorName || `طبيب #${appointment.doctorId}`;
                                        printReceipt({
                                          fullName: appointment.fullName || appointment.patientName,
                                          phone: appointment.phone,
                                          age: appointment.age ?? undefined,
                                          registrationDate: new Date(appointment.createdAt || appointment.appointmentDate),
                                          type: "appointment",
                                          typeName: doctorName
                                        }, user?.name || "مستخدم");
                                      }}
                                    >
                                      <Printer className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>طباعة السند</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "offerLeads" && (
          <OfferLeadsManagement 
            onPendingCountChange={setOfferLeadsPendingCount} 
            dateRange={dateRange}
          />
        )}

        {activeTab === "campRegistrations" && (
          <CampRegistrationsManagement 
            onPendingCountChange={setCampRegistrationsPendingCount}
            dateRange={dateRange}
          />
        )}

        {activeTab === "tasks" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  جميع المهام
                </CardTitle>
                <CardDescription>
                  عرض وإدارة جميع المهام من كل الأقسام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TasksSection 
                  entityType="all"
                  entityId={0}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Update Lead Status Dialog */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تحديث حالة العميل</DialogTitle>
              <DialogDescription>
                قم بتحديث حالة العميل وإضافة ملاحظات إذا لزم الأمر
              </DialogDescription>
            </DialogHeader>
            {selectedLead && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-medium">الاسم:</span> {selectedLead.fullName}</p>
                  <p className="text-sm"><span className="font-medium">الهاتف:</span> {selectedLead.phone}</p>
                  {selectedLead.email && (
                    <p className="text-sm"><span className="font-medium">البريد:</span> {selectedLead.email}</p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">النوع:</span> {selectedLead.type === 'general' ? 'عام' : selectedLead.type === 'offer' ? 'عرض' : 'مخيم'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">المصدر:</span>{' '}
                    {selectedLead.source === 'website' && 'موقع'}
                    {selectedLead.source === 'phone' && 'هاتف'}
                    {selectedLead.source === 'manual' && 'يدوي'}
                  </p>
                  {selectedLead.notes && (
                    <p className="text-sm"><span className="font-medium">الملاحظات:</span> {selectedLead.notes}</p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">تاريخ التسجيل:</span>{' '}
                    {(() => {
                      try {
                        const date = selectedLead.createdAt ? new Date(selectedLead.createdAt) : null;
                        return date && !isNaN(date.getTime()) ? date.toLocaleString("ar-EG") : 'غير متوفر';
                      } catch (e) {
                        return 'غير متوفر';
                      }
                    })()}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>الحالة الجديدة</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">قيد الانتظار</SelectItem>
                      <SelectItem value="contacted">تم التواصل</SelectItem>
                      <SelectItem value="booked">تم الحجز</SelectItem>
                      <SelectItem value="not_interested">غير مهتم</SelectItem>
                      <SelectItem value="no_answer">لم يرد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ملاحظات (اختياري)</Label>
                  <Textarea
                    placeholder="أضف ملاحظات..."
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
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
                  <Button onClick={handleStatusUpdate} disabled={!newStatus}>
                    تحديث
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Update Appointment Status Dialog */}
        <Dialog open={appointmentStatusDialogOpen} onOpenChange={setAppointmentStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تحديث حالة الموعد</DialogTitle>
              <DialogDescription>
                قم بتحديث حالة الموعد وإضافة ملاحظات إذا لزم الأمر
              </DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-medium">المريض:</span> {selectedAppointment.patientName}</p>
                  <p className="text-sm"><span className="font-medium">الهاتف:</span> {selectedAppointment.phone}</p>
                  {selectedAppointment.email && (
                    <p className="text-sm"><span className="font-medium">البريد:</span> {selectedAppointment.email}</p>
                  )}
                  <p className="text-sm"><span className="font-medium">الطبيب:</span> {selectedAppointment.doctorName}</p>
                  <p className="text-sm"><span className="font-medium">التخصص:</span> {selectedAppointment.doctorSpecialty}</p>
                  {selectedAppointment.procedure && (
                    <p className="text-sm"><span className="font-medium">الإجراء:</span> {selectedAppointment.procedure}</p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">المصدر:</span>{' '}
                    {(selectedAppointment as any).source === 'website' && 'موقع'}
                    {(selectedAppointment as any).source === 'phone' && 'هاتف'}
                    {(selectedAppointment as any).source === 'manual' && 'يدوي'}
                    {!(selectedAppointment as any).source && '-'}
                  </p>
                  {selectedAppointment.patientNotes && (
                    <p className="text-sm"><span className="font-medium">ملاحظات المريض:</span> {selectedAppointment.patientNotes}</p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">تاريخ التسجيل:</span>{' '}
                    {new Date(selectedAppointment.createdAt).toLocaleString("ar-EG")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>الحالة الجديدة</Label>
                  <Select value={newAppointmentStatus} onValueChange={setNewAppointmentStatus}>
                    <SelectTrigger>
                      <SelectValue />
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
                  <Label>تاريخ الموعد</Label>
                  <Input
                    type="date"
                    value={appointmentDate ? new Date(appointmentDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ملاحظات (اختياري)</Label>
                  <Textarea
                    placeholder="أضف ملاحظات..."
                    value={appointmentStatusNotes}
                    onChange={(e) => setAppointmentStatusNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                
                {/* Comments Section */}
                <div className="border-t pt-4">
                  <CommentsSection
                    entityType="appointment"
                    entityId={selectedAppointment.id}
                  />
                </div>
                
                {/* Tasks Section */}
                <div className="space-y-4">
                  <TasksSection
                    entityType="appointment"
                    entityId={selectedAppointment.id}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAppointmentStatusDialogOpen(false);
                      setSelectedAppointment(null);
                      setNewAppointmentStatus("");
                      setAppointmentStatusNotes("");
                      setAppointmentDate("");
                    }}
                  >
                    إلغاء
                  </Button>
                  <Button onClick={handleAppointmentStatusUpdate} disabled={!newAppointmentStatus}>
                    تحديث
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Manual Registration Dialog */}
        <Dialog open={manualRegistrationOpen} onOpenChange={setManualRegistrationOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تسجيل يدوي</DialogTitle>
              <DialogDescription>
                قم بإضافة تسجيل جديد يدوياً
              </DialogDescription>
            </DialogHeader>
            <ManualRegistrationForm />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
