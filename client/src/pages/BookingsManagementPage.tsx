import { useState, useMemo, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import OfferLeadsManagement from "@/components/OfferLeadsManagement";
import CampRegistrationsManagement from "@/components/CampRegistrationsManagement";
import ManualRegistrationForm from "@/components/ManualRegistrationForm";
import LeadCard from "@/components/LeadCard";
import AppointmentCard from "@/components/AppointmentCard";
import ActionButtons from "@/components/ActionButtons";
import EmptyState from "@/components/EmptyState";
import MultiSelect from "@/components/MultiSelect";
import { ColumnVisibility, getColumnWidth, type ColumnConfig, type ColumnTemplate } from "@/components/ColumnVisibility";
import { ResizableTable, ResizableHeaderCell, FrozenTableCell } from "@/components/ResizableTable";
import { useTableFeatures } from "@/hooks/useTableFeatures";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel, formatLeadsForExport } from "@/lib/exportToExcel";
import { useExportUtils } from "@/hooks/useExportUtils";
import { useFilterUtils, applyDefaultSort, DATE_FILTER_OPTIONS } from "@/hooks/useFilterUtils";
import { printReceipt } from "@/components/PrintReceipt";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { SOURCE_OPTIONS, SOURCE_LABELS, SOURCE_COLORS } from "@shared/sources";
import BulkUpdateDialog from "@/components/BulkUpdateDialog";
import Pagination, { type PageSizeValue } from "@/components/Pagination";

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
  const utils = trpc.useUtils();
  const [location, setLocation] = useLocation();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [activeTab, setActiveTab] = useState<"leads" | "appointments" | "offerLeads" | "campRegistrations" | "tasks">("leads");
  
  // === Unified filter state for Leads tab ===
  const leadsFilter = useFilterUtils<any>({
    data: undefined, // will be configured below after data loads
    searchFields: [],
  });
  
  // Date Range State - managed by appointmentFilter
  const appointmentFilter = useFilterUtils<any>();
  
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
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [appointmentStatusDialogOpen, setAppointmentStatusDialogOpen] = useState(false);
  const [newAppointmentStatus, setNewAppointmentStatus] = useState("");
  const [appointmentStatusNotes, setAppointmentStatusNotes] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [offerLeadsPendingCount, setOfferLeadsPendingCount] = useState(0);
  const [campRegistrationsPendingCount, setCampRegistrationsPendingCount] = useState(0);
  const [selectedAppointmentIds, setSelectedAppointmentIds] = useState<number[]>([]);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  
  // Pagination state
  const [appointmentPage, setAppointmentPage] = useState(1);
  const [appointmentPageSize, setAppointmentPageSize] = useState<PageSizeValue>("100");
  
  // Aliases for backward compatibility
  const dateRange = appointmentFilter.filters.dateRange;
  const setDateRange = appointmentFilter.filters.setDateRange;
  const appointmentSearchTerm = appointmentFilter.filters.searchTerm;
  const setAppointmentSearchTerm = appointmentFilter.filters.setSearchTerm;
  const selectedDoctor = appointmentFilter.filters.categoryFilter;
  const setSelectedDoctor = appointmentFilter.filters.setCategoryFilter;
  const appointmentStatusFilter = appointmentFilter.filters.statusFilter;
  const setAppointmentStatusFilter = appointmentFilter.filters.setStatusFilter;
  const appointmentSourceFilter = appointmentFilter.filters.sourceFilter;
  const setAppointmentSourceFilter = appointmentFilter.filters.setSourceFilter;
  const dateFilter = appointmentFilter.filters.dateFilter;
  const setDateFilter = appointmentFilter.filters.setDateFilter;
  const searchTerm = leadsFilter.filters.searchTerm;
  const setSearchTerm = leadsFilter.filters.setSearchTerm;
  const leadsDateFilter = leadsFilter.filters.dateFilter;
  const setLeadsDateFilter = leadsFilter.filters.setDateFilter;
  const leadsStatusFilter = leadsFilter.filters.statusFilter;
  const setLeadsStatusFilter = leadsFilter.filters.setStatusFilter;
  const leadsSourceFilter = leadsFilter.filters.sourceFilter;
  const setLeadsSourceFilter = leadsFilter.filters.setSourceFilter;
  
  // Sorting state
  // Sort state is now managed by appointmentTable.sortState via useTableFeatures

  // Column visibility state for Appointments - جميع الأعمدة من قاعدة البيانات
  const appointmentColumns: ColumnConfig[] = [
    { key: 'checkbox', label: 'تحديد', defaultVisible: true, sortable: false },
    { key: 'receiptNumber', label: 'رقم السند', defaultVisible: true, sortType: 'string' },
    { key: 'date', label: 'تاريخ الحجز', defaultVisible: true, sortType: 'date' },
    { key: 'name', label: 'اسم المريض', defaultVisible: true, sortType: 'string' },
    { key: 'phone', label: 'رقم الهاتف', defaultVisible: true, sortType: 'string' },
    { key: 'email', label: 'البريد الإلكتروني', defaultVisible: false, sortType: 'string' },
    { key: 'age', label: 'العمر', defaultVisible: false, sortType: 'number' },
    { key: 'doctor', label: 'الطبيب', defaultVisible: true, sortType: 'string' },
    { key: 'specialty', label: 'التخصص', defaultVisible: true, sortType: 'string' },
    { key: 'procedure', label: 'الإجراء الطبي', defaultVisible: false, sortType: 'string' },
    { key: 'preferredDate', label: 'التاريخ المفضل', defaultVisible: false, sortType: 'date' },
    { key: 'preferredTime', label: 'الوقت المفضل', defaultVisible: false, sortType: 'string' },
    { key: 'appointmentDate', label: 'موعد المقابلة', defaultVisible: false, sortType: 'date' },
    { key: 'notes', label: 'ملاحظات المريض', defaultVisible: false, sortable: false },
    { key: 'additionalNotes', label: 'ملاحظات إضافية', defaultVisible: false, sortable: false },
    { key: 'staffNotes', label: 'ملاحظات الموظفين', defaultVisible: false, sortable: false },
    { key: 'status', label: 'الحالة', defaultVisible: true, sortType: 'string' },
    { key: 'source', label: 'المصدر', defaultVisible: true, sortType: 'string' },
    { key: 'utmSource', label: 'UTM Source', defaultVisible: false, sortType: 'string' },
    { key: 'utmMedium', label: 'UTM Medium', defaultVisible: false, sortType: 'string' },
    { key: 'utmCampaign', label: 'UTM Campaign', defaultVisible: false, sortType: 'string' },
    { key: 'utmTerm', label: 'UTM Term', defaultVisible: false, sortType: 'string' },
    { key: 'utmContent', label: 'UTM Content', defaultVisible: false, sortType: 'string' },
    { key: 'utmPlacement', label: 'UTM Placement', defaultVisible: false, sortType: 'string' },
    { key: 'referrer', label: 'المحيل', defaultVisible: false, sortType: 'string' },
    { key: 'fbclid', label: 'Facebook Click ID', defaultVisible: false, sortType: 'string' },
    { key: 'gclid', label: 'Google Click ID', defaultVisible: false, sortType: 'string' },
    { key: 'comments', label: 'التعليقات', defaultVisible: true, sortable: false },
    { key: 'tasks', label: 'المهام', defaultVisible: true, sortable: false },
    { key: 'actions', label: 'الإجراءات', defaultVisible: true, sortable: false },
  ];

  // === استخدام useTableFeatures الموحد لإدارة جميع ميزات الجدول ===
  const appointmentTable = useTableFeatures({
    tableKey: 'appointments',
    columns: appointmentColumns,
  });
  
  // Debounced search terms - now managed by useFilterUtils
  const debouncedAppointmentSearch = appointmentFilter.filters.debouncedSearch;
  const debouncedLeadsSearch = leadsFilter.filters.debouncedSearch;

  // Data queries
  const { data: unifiedLeads, isLoading: leadsLoading, refetch: refetchLeads } = trpc.leads.list.useQuery();
  const { data: stats } = trpc.leads.stats.useQuery();
  // Reset page when filters change
  useEffect(() => {
    setAppointmentPage(1);
  }, [debouncedAppointmentSearch, dateRange.from, dateRange.to, appointmentStatusFilter, appointmentSourceFilter, selectedDoctor, dateFilter]);
  
  const appointmentLimit = appointmentPageSize === "all" ? 100000 : parseInt(appointmentPageSize);
  const { data: appointmentsData, isLoading: appointmentsLoading, refetch: refetchAppointments } = trpc.appointments.listPaginated.useQuery({
    page: appointmentPageSize === "all" ? 1 : appointmentPage,
    limit: appointmentLimit,
    searchTerm: debouncedAppointmentSearch,
    dateFrom: dateRange.from.toISOString(),
    dateTo: dateRange.to.toISOString(),
    dateFilter: dateFilter !== 'all' ? dateFilter as "today" | "week" | "month" : undefined,
    doctorIds: selectedDoctor && selectedDoctor.length > 0 ? selectedDoctor.map(Number) : undefined,
    sources: appointmentSourceFilter && appointmentSourceFilter.length > 0 ? appointmentSourceFilter : undefined,
    statuses: appointmentStatusFilter && appointmentStatusFilter.length > 0 ? appointmentStatusFilter : undefined,
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

  const updateAppointmentStatusMutation = trpc.appointments.updateStatus.useMutation({
    onMutate: async (variables) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await utils.appointments.listPaginated.cancel();
      
      // Snapshot previous value
      const previousData = utils.appointments.listPaginated.getData();
      
      // Optimistically update the cache
      utils.appointments.listPaginated.setData(
        {
          page: appointmentPageSize === "all" ? 1 : appointmentPage,
          limit: appointmentLimit,
          searchTerm: debouncedAppointmentSearch,
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
            page: appointmentPageSize === "all" ? 1 : appointmentPage,
            limit: appointmentLimit,
            searchTerm: debouncedAppointmentSearch,
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

  const bulkUpdateAppointmentsMutation = trpc.appointments.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`تم تحديث ${data.count} موعد بنجاح`);
      utils.appointments.listPaginated.invalidate();
      setBulkUpdateDialogOpen(false);
      setSelectedAppointmentIds([]);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الحالة");
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
    
    // Filter by status (multiple selection)
    if (leadsStatusFilter && leadsStatusFilter.length > 0) {
      filtered = filtered.filter((lead: any) => leadsStatusFilter.includes(lead.status));
    }
    
    // Filter by source (multiple selection)
    if (leadsSourceFilter && leadsSourceFilter.length > 0) {
      filtered = filtered.filter((lead: any) => leadsSourceFilter.includes(lead.source));
    }
    
    return filtered;
  }, [unifiedLeads, searchTerm, leadsDateFilter, leadsStatusFilter, leadsSourceFilter]);

  // Apply sorting to appointments (filtering is now done server-side)
  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];
    
    let filtered = [...appointments];
    
    // Apply sorting using useTableFeatures
    const sorted = appointmentTable.sortData(filtered, (item: any, key: string) => {
      switch (key) {
        case 'date': return item.createdAt;
        case 'name': return item.fullName || item.patientName || '';
        case 'phone': return item.phone;
        case 'email': return item.email;
        case 'age': return item.age;
        case 'doctor': return item.doctorName;
        case 'specialty': return item.doctorSpecialty;
        case 'procedure': return item.procedure;
        case 'preferredDate': return item.preferredDate;
        case 'preferredTime': return item.preferredTime;
        case 'appointmentDate': return item.appointmentDate;
        case 'status': return item.status;
        case 'source': return item.source;
        case 'receiptNumber': return item.receiptNumber;
        case 'utmSource': return item.utmSource;
        case 'utmMedium': return item.utmMedium;
        case 'utmCampaign': return item.utmCampaign;
        case 'utmTerm': return item.utmTerm;
        case 'utmContent': return item.utmContent;
        case 'utmPlacement': return item.utmPlacement;
        case 'referrer': return item.referrer;
        case 'fbclid': return item.fbclid;
        case 'gclid': return item.gclid;
        default: return item[key];
      }
    });
    
    // Default sort: newest first if no sort is active
    if (!appointmentTable.sortState.direction) {
      sorted.sort((a: any, b: any) => {
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        return bDate - aDate;
      });
    }
    
    return sorted;
  }, [appointments, appointmentTable.sortState, appointmentTable.sortData]);

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

  // useExportUtils hook للمواعيد
  const appointmentExport = useExportUtils({
    tableName: 'مواعيد الأطباء',
    filenamePrefix: 'مواعيد_الأطباء',
    exportColumns: [
      { key: 'date', label: 'التاريخ' },
      { key: 'name', label: 'اسم المريض' },
      { key: 'phone', label: 'الهاتف' },
      { key: 'doctor', label: 'الطبيب' },
      { key: 'specialty', label: 'التخصص' },
      { key: 'source', label: 'المصدر' },
      { key: 'receiptNumber', label: 'رقم السند' },
      { key: 'status', label: 'الحالة' },
    ],
    printColumns: [
      { key: 'date', label: 'التاريخ' },
      { key: 'name', label: 'اسم المريض' },
      { key: 'phone', label: 'الهاتف' },
      { key: 'doctor', label: 'الطبيب' },
      { key: 'specialty', label: 'التخصص' },
      { key: 'source', label: 'المصدر' },
      { key: 'receiptNumber', label: 'رقم السند' },
      { key: 'status', label: 'الحالة' },
      { key: 'comments', label: 'التعليقات' },
      { key: 'tasks', label: 'المهام' },
      { key: 'actions', label: 'الإجراءات' },
    ],
    mapToExportRow: (appointment: any) => ({
      date: new Date(appointment.appointmentDate).toLocaleDateString('ar-SA'),
      name: appointment.name,
      phone: appointment.phone,
      doctor: appointment.doctorName || '-',
      specialty: appointment.specialty || '-',
      source: SOURCE_LABELS[appointment.source] || appointment.source || '-',
      receiptNumber: appointment.receiptNumber || '-',
      status: statusLabels[appointment.status as keyof typeof statusLabels] || appointment.status,
    }),
    mapToPrintRow: (appointment: any) => ({
      date: new Date(appointment.appointmentDate).toLocaleDateString('ar-SA'),
      name: appointment.name,
      phone: appointment.phone,
      doctor: appointment.doctorName || '-',
      specialty: appointment.specialty || '-',
      source: SOURCE_LABELS[appointment.source] || appointment.source || '-',
      receiptNumber: appointment.receiptNumber || '-',
      status: statusLabels[appointment.status as keyof typeof statusLabels] || appointment.status,
      comments: appointment.commentCount > 0 ? `${appointment.commentCount} تعليق` : '-',
      tasks: appointment.taskCount > 0 ? `${appointment.taskCount} مهمة` : '-',
      actions: '-',
    }),
  });

  const getAppointmentExportOptions = useCallback(() => {
    const activeFilters = appointmentExport.buildActiveFilters([
      { label: 'البحث', value: debouncedAppointmentSearch || undefined },
      { label: 'الحالة', value: appointmentStatusFilter.length > 0 ? appointmentStatusFilter.map(s => statusLabels[s as keyof typeof statusLabels]).join(', ') : undefined },
      { label: 'المصدر', value: appointmentSourceFilter.length > 0 ? appointmentSourceFilter.map(s => SOURCE_LABELS[s] || s).join(', ') : undefined },
      { label: 'الطبيب', value: selectedDoctor.length > 0 ? selectedDoctor.map(id => {
        const doctor = doctors.find((d: any) => d.id.toString() === id);
        return doctor ? doctor.name : id;
      }).join(', ') : undefined },
    ]);
    return {
      data: filteredAppointments,
      activeFilters,
      dateRangeStr: appointmentExport.formatDateRange(dateRange.from, dateRange.to),
      visibleColumns: appointmentTable.visibleColumns,
    };
  }, [filteredAppointments, debouncedAppointmentSearch, appointmentStatusFilter, appointmentSourceFilter, selectedDoctor, doctors, dateRange, appointmentTable.visibleColumns, appointmentExport]);

  const handleExportAppointments = useCallback(async (format: 'excel' | 'csv' | 'pdf') => {
    await appointmentExport.handleExport(format, getAppointmentExportOptions());
  }, [appointmentExport, getAppointmentExportOptions]);

  const handlePrintAppointments = useCallback(() => {
    appointmentExport.handlePrint(getAppointmentExportOptions());
  }, [appointmentExport, getAppointmentExportOptions]);

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
                      variant={leadsStatusFilter.includes("new") && leadsStatusFilter.length === 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLeadsStatusFilter(leadsStatusFilter.includes("new") && leadsStatusFilter.length === 1 ? [] : ["new"])}
                      className="gap-2 h-9 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
                    >
                      <TrendingUp className="h-4 w-4" />
                      {leadsStatusFilter.includes("new") && leadsStatusFilter.length === 1 ? "عرض الكل" : "المعلقة فقط"}
                      {!(leadsStatusFilter.includes("new") && leadsStatusFilter.length === 1) && pendingCounts.leads > 0 && (
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
                    <MultiSelect
                      options={[
                        { value: 'new', label: 'جديد' },
                        { value: 'contacted', label: 'تم التواصل' },
                        { value: 'booked', label: 'تم الحجز' },
                        { value: 'not_interested', label: 'غير مهتم' },
                        { value: 'no_answer', label: 'لم يرد' },
                      ]}
                      selected={leadsStatusFilter}
                      onChange={setLeadsStatusFilter}
                      placeholder="كل الحالات"
                      className="h-9"
                    />
                    <MultiSelect
                      options={SOURCE_OPTIONS}
                      selected={leadsSourceFilter}
                      onChange={setLeadsSourceFilter}
                      placeholder="كل المصادر"
                      className="h-9"
                    />
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
                              {lead.source ? (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs font-medium"
                                  style={{
                                    backgroundColor: SOURCE_COLORS[lead.source] ? `${SOURCE_COLORS[lead.source]}15` : undefined,
                                    borderColor: SOURCE_COLORS[lead.source] || undefined,
                                    color: SOURCE_COLORS[lead.source] || undefined,
                                  }}
                                >
                                  {SOURCE_LABELS[lead.source] || lead.source}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>مواعيد الأطباء</CardTitle>
                    <CardDescription>إدارة ومتابعة مواعيد الأطباء</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {selectedAppointmentIds.length > 0 && (
                      <Button
                        variant="default"
                        onClick={() => setBulkUpdateDialogOpen(true)}
                      >
                        <CheckSquare className="h-4 w-4 ml-2" />
                        تحديث الحالة ({selectedAppointmentIds.length})
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters - Responsive Grid */}
                <div className="flex flex-col gap-3">
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
                    <MultiSelect
                      options={doctors.map((doctor: any) => ({ value: doctor.id.toString(), label: doctor.name }))}
                      selected={selectedDoctor}
                      onChange={setSelectedDoctor}
                      placeholder="كل الأطباء"
                      className="h-9"
                    />
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
                    <MultiSelect
                      options={[
                        { value: 'pending', label: 'قيد الانتظار' },
                        { value: 'confirmed', label: 'مؤكد' },
                        { value: 'cancelled', label: 'ملغي' },
                        { value: 'completed', label: 'مكتمل' },
                      ]}
                      selected={appointmentStatusFilter}
                      onChange={setAppointmentStatusFilter}
                      placeholder="كل الحالات"
                      className="h-9"
                    />
                    <MultiSelect
                      options={SOURCE_OPTIONS}
                      selected={appointmentSourceFilter}
                      onChange={setAppointmentSourceFilter}
                      placeholder="كل المصادر"
                      className="h-9"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrintAppointments}
                      className="gap-2 h-9"
                    >
                      <Printer className="h-4 w-4" />
                      <span className="hidden sm:inline">طباعة</span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 h-9"
                        >
                          <Download className="h-4 w-4" />
                          <span className="hidden sm:inline">تصدير</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExportAppointments('excel')}>
                          تصدير Excel
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportAppointments('csv')}>
                          تصدير CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportAppointments('pdf')}>
                          تصدير PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <ColumnVisibility
                       columns={appointmentColumns}
                       visibleColumns={appointmentTable.visibleColumns}
                       columnOrder={appointmentTable.columnOrder}
                       onVisibilityChange={appointmentTable.handleColumnVisibilityChange}
                       onColumnOrderChange={appointmentTable.handleColumnOrderChange}
                       onReset={appointmentTable.handleResetAll}
                       templates={appointmentTable.allTemplates}
                       activeTemplateId={appointmentTable.activeTemplateId}
                       onApplyTemplate={appointmentTable.handleApplyTemplate}
                       onSaveTemplate={appointmentTable.handleSaveTemplate}
                       onDeleteTemplate={appointmentTable.handleDeleteTemplate}
                       tableKey="appointments"
                        columnWidths={appointmentTable.columnWidths.columnWidths}
                        frozenColumns={appointmentTable.frozenColumns.frozenColumns}
                        onToggleFrozen={appointmentTable.frozenColumns.toggleFrozen}
                        isAdmin={user?.role === 'admin'}
                        sharedTemplates={appointmentTable.sharedTemplates}
                        onSaveSharedTemplate={appointmentTable.handleSaveSharedTemplate}
                        onDeleteSharedTemplate={appointmentTable.handleDeleteSharedTemplate}
                      />
                  </div>
                  {/* Reset Filters Button */}
                  {appointmentFilter.filters.activeFilterCount > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          appointmentFilter.filters.resetAll();
                          setAppointmentPage(1);
                          setSelectedAppointmentIds([]);
                        }}
                        className="gap-1 text-muted-foreground hover:text-foreground h-8"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        إعادة تعيين الفلاتر ({appointmentFilter.filters.activeFilterCount})
                      </Button>
                    </div>
                  )}
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
                   <ResizableTable
                     frozenColumns={appointmentTable.frozenColumns.frozenColumns}
                     columnWidths={appointmentTable.columnWidths.columnWidths}
                     visibleColumnOrder={appointmentTable.columnOrder.filter(key => appointmentTable.visibleColumns[key])}
                   >
                    <TableHeader>
                      <TableRow>
                        {appointmentTable.columnOrder.filter(key => appointmentTable.visibleColumns[key]).map(colKey => {
                          const col = appointmentColumns.find(c => c.key === colKey);
                          if (!col) return null;
                          if (colKey === 'checkbox') {
                            return (
                              <ResizableHeaderCell key={colKey} columnKey={colKey} width={40} minWidth={40} maxWidth={40} onResize={() => {}}>
                                <input
                                  type="checkbox"
                                  checked={selectedAppointmentIds.length === filteredAppointments.length && filteredAppointments.length > 0}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedAppointmentIds(filteredAppointments.map((a: any) => a.id));
                                    } else {
                                      setSelectedAppointmentIds([]);
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                              </ResizableHeaderCell>
                            );
                          }
                          const widthConfig = getColumnWidth(colKey, col);
                          return (
                            <ResizableHeaderCell
                              key={colKey}
                              columnKey={colKey}
                              width={appointmentTable.columnWidths.getWidth(colKey)}
                              minWidth={widthConfig.min}
                              maxWidth={widthConfig.max}
                              onResize={appointmentTable.columnWidths.handleResize}
                              {...appointmentTable.getSortProps(colKey)}
                            >
                              {col.label}
                            </ResizableHeaderCell>
                          );
                        })}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointmentsLoading ? (
                        <TableRow>
                          <TableCell colSpan={appointmentTable.columnOrder.filter(k => appointmentTable.visibleColumns[k]).length || 1} className="p-0">
                            <TableSkeleton rows={5} columns={appointmentTable.columnOrder.filter(k => appointmentTable.visibleColumns[k]).length || 11} />
                          </TableCell>
                        </TableRow>
                      ) : filteredAppointments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={appointmentTable.columnOrder.filter(k => appointmentTable.visibleColumns[k]).length || 1} className="py-12">
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
                            {appointmentTable.columnOrder.filter(key => appointmentTable.visibleColumns[key]).map(colKey => {
                              switch(colKey) {
                                case 'checkbox':
                                  return (
                                    <FrozenTableCell key={colKey} columnKey={colKey}>
                                      <input
                                        type="checkbox"
                                        checked={selectedAppointmentIds.includes(appointment.id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedAppointmentIds([...selectedAppointmentIds, appointment.id]);
                                          } else {
                                            setSelectedAppointmentIds(selectedAppointmentIds.filter((id: number) => id !== appointment.id));
                                          }
                                        }}
                                        className="rounded border-gray-300"
                                      />
                                    </FrozenTableCell>
                                  );
                                case 'date':
                                  return <FrozenTableCell key={colKey} columnKey={colKey} className="font-medium">{new Date(appointment.createdAt).toLocaleDateString("ar-EG")}</FrozenTableCell>;
                                case 'name':
                                  return <FrozenTableCell key={colKey} columnKey={colKey} className="font-medium">{appointment.fullName || appointment.patientName || '-'}</FrozenTableCell>;
                                case 'phone':
                                  return (
                                    <FrozenTableCell key={colKey} columnKey={colKey}>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono">{appointment.phone}</span>
                                        <ActionButtons
                                          phoneNumber={appointment.phone}
                                          showWhatsApp={true}
                                          whatsAppMessage={`مرحباً ${appointment.fullName || appointment.patientName}، هذه رسالة من المستشفى السعودي الألماني - صنعاء بخصوص موعدك مع ${appointment.doctorName}.`}
                                          size="sm"
                                          variant="ghost"
                                        />
                                      </div>
                                    </FrozenTableCell>
                                  );
                                case 'email':
                                  return <FrozenTableCell key={colKey} columnKey={colKey}>{appointment.email || '-'}</FrozenTableCell>;
                                case 'age':
                                  return <FrozenTableCell key={colKey} columnKey={colKey}>{appointment.age ? `${appointment.age} سنة` : '-'}</FrozenTableCell>;
                                case 'doctor':
                                  return <FrozenTableCell key={colKey} columnKey={colKey}>{appointment.doctorName || '-'}</FrozenTableCell>;
                                case 'specialty':
                                  return <FrozenTableCell key={colKey} columnKey={colKey}>{appointment.doctorSpecialty || '-'}</FrozenTableCell>;
                                case 'procedure':
                                  return <FrozenTableCell key={colKey} columnKey={colKey}>{appointment.procedure || '-'}</FrozenTableCell>;
                                case 'preferredDate':
                                  return <FrozenTableCell key={colKey} columnKey={colKey}>{appointment.preferredDate ? new Date(appointment.preferredDate).toLocaleDateString('ar-EG') : '-'}</FrozenTableCell>;
                                case 'preferredTime':
                                  return <FrozenTableCell key={colKey} columnKey={colKey}>{appointment.preferredTime || '-'}</FrozenTableCell>;
                                case 'appointmentDate':
                                  return <FrozenTableCell key={colKey} columnKey={colKey}>{appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString('ar-EG') : '-'}</FrozenTableCell>;
                                case 'notes':
                                  return <FrozenTableCell key={colKey} columnKey={colKey} wrap title={appointment.notes}>{appointment.notes || '-'}</FrozenTableCell>;
                                case 'additionalNotes':
                                  return <FrozenTableCell key={colKey} columnKey={colKey} wrap title={appointment.additionalNotes}>{appointment.additionalNotes || '-'}</FrozenTableCell>;
                                case 'staffNotes':
                                  return <FrozenTableCell key={colKey} columnKey={colKey} wrap title={appointment.staffNotes}>{appointment.staffNotes || '-'}</FrozenTableCell>;
                                case 'source':
                                  return (
                                    <FrozenTableCell key={colKey} columnKey={colKey}>
                                      {appointment.source ? (
                                        <Badge 
                                          variant="outline" 
                                          className="text-xs font-medium"
                                          style={{
                                            backgroundColor: SOURCE_COLORS[appointment.source] ? `${SOURCE_COLORS[appointment.source]}15` : undefined,
                                            borderColor: SOURCE_COLORS[appointment.source] || undefined,
                                            color: SOURCE_COLORS[appointment.source] || undefined,
                                          }}
                                        >
                                          {SOURCE_LABELS[appointment.source] || appointment.source}
                                        </Badge>
                                      ) : (
                                        <span className="text-muted-foreground">-</span>
                                      )}
                                    </FrozenTableCell>
                                  );
                                case 'receiptNumber':
                                  return <FrozenTableCell key={colKey} columnKey={colKey} className="text-sm text-muted-foreground font-mono">{appointment.receiptNumber || "-"}</FrozenTableCell>;
                                case 'status':
                                  return (
                                    <FrozenTableCell key={colKey} columnKey={colKey}>
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
                                    </FrozenTableCell>
                                  );
                                case 'utmSource':
                                  return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{appointment.utmSource || '-'}</FrozenTableCell>;
                                case 'utmMedium':
                                  return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{appointment.utmMedium || '-'}</FrozenTableCell>;
                                case 'utmCampaign':
                                  return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{appointment.utmCampaign || '-'}</FrozenTableCell>;
                                case 'utmTerm':
                                  return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{appointment.utmTerm || '-'}</FrozenTableCell>;
                                case 'utmContent':
                                  return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{appointment.utmContent || '-'}</FrozenTableCell>;
                                case 'utmPlacement':
                                  return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{appointment.utmPlacement || '-'}</FrozenTableCell>;
                                case 'referrer':
                                  return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{appointment.referrer || '-'}</FrozenTableCell>;
                                case 'fbclid':
                                  return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs font-mono">{appointment.fbclid || '-'}</FrozenTableCell>;
                                case 'gclid':
                                  return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs font-mono">{appointment.gclid || '-'}</FrozenTableCell>;
                                case 'comments':
                                  return <FrozenTableCell key={colKey} columnKey={colKey}><CommentCount entityType="appointment" entityId={appointment.id} /></FrozenTableCell>;
                                case 'tasks':
                                  return <FrozenTableCell key={colKey} columnKey={colKey}><TaskCount entityType="appointment" entityId={appointment.id} /></FrozenTableCell>;
                                case 'actions':
                                  return (
                                    <FrozenTableCell key={colKey} columnKey={colKey}>
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
                                    </FrozenTableCell>
                                  );
                                default:
                                  return <FrozenTableCell key={colKey} columnKey={colKey}>-</FrozenTableCell>;
                              }
                            })}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </ResizableTable>
                </div>
                
                {/* Pagination */}
                <Pagination
                  currentPage={appointmentPage}
                  totalPages={appointmentsData?.totalPages || 1}
                  onPageChange={(page) => {
                    setAppointmentPage(page);
                    setSelectedAppointmentIds([]);
                  }}
                  totalItems={appointmentsData?.total || 0}
                  itemsPerPage={appointmentLimit}
                  pageSize={appointmentPageSize}
                  onPageSizeChange={(size) => {
                    setAppointmentPageSize(size);
                    setAppointmentPage(1);
                    setSelectedAppointmentIds([]);
                  }}
                />
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
                    {selectedLead.source ? SOURCE_LABELS[selectedLead.source] || selectedLead.source : '-'}
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>تحديث حالة الموعد</DialogTitle>
              <DialogDescription>
                قم بتحديث حالة الموعد وإضافة ملاحظات إذا لزم الأمر
              </DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="info">معلومات الموعد</TabsTrigger>
                    <TabsTrigger value="comments">التعليقات</TabsTrigger>
                    <TabsTrigger value="tasks">المهام</TabsTrigger>
                  </TabsList>
                
                <div className="flex-1 overflow-y-auto mt-4">
                  <TabsContent value="info" className="space-y-4 mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm"><span className="font-medium">المريض:</span> {selectedAppointment.patientName}</p>
                        <p className="text-sm"><span className="font-medium">الهاتف:</span> {selectedAppointment.phone}</p>
                        {selectedAppointment.email && (
                          <p className="text-sm"><span className="font-medium">البريد:</span> {selectedAppointment.email}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm"><span className="font-medium">الطبيب:</span> {selectedAppointment.doctorName}</p>
                        <p className="text-sm"><span className="font-medium">التخصص:</span> {selectedAppointment.doctorSpecialty}</p>
                        {selectedAppointment.procedure && (
                          <p className="text-sm"><span className="font-medium">الإجراء:</span> {selectedAppointment.procedure}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">المصدر:</span>{' '}
                        {(selectedAppointment as any).source ? SOURCE_LABELS[(selectedAppointment as any).source] || (selectedAppointment as any).source : '-'}
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
                  </TabsContent>
                  
                  <TabsContent value="comments" className="mt-0">
                    <CommentsSection
                      entityType="appointment"
                      entityId={selectedAppointment.id}
                    />
                  </TabsContent>
                  
                  <TabsContent value="tasks" className="mt-0">
                    <TasksSection
                      entityType="appointment"
                      entityId={selectedAppointment.id}
                    />
                  </TabsContent>
                  </div>
                  </Tabs>
                  
                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
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

        {/* Bulk Update Appointments Dialog */}
        <BulkUpdateDialog
          open={bulkUpdateDialogOpen}
          onOpenChange={setBulkUpdateDialogOpen}
          selectedCount={selectedAppointmentIds.length}
          statusOptions={[
            { value: "pending", label: "قيد الانتظار" },
            { value: "confirmed", label: "مؤكد" },
            { value: "cancelled", label: "ملغي" },
            { value: "completed", label: "مكتمل" },
          ]}
          onConfirm={(newStatus) => {
            bulkUpdateAppointmentsMutation.mutate({ ids: selectedAppointmentIds, status: newStatus as "pending" | "confirmed" | "cancelled" | "completed" });
          }}
          isLoading={bulkUpdateAppointmentsMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
