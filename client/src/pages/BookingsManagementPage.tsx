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
import MultiSelect from "@/components/MultiSelect";
import { ColumnVisibility, getDefaultTemplates, type ColumnConfig, type ColumnTemplate } from "@/components/ColumnVisibility";
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
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel, formatLeadsForExport, formatAppointmentsForExport } from "@/lib/exportToExcel";
import { exportData, printTable, type ExportMetadata } from "@/lib/advancedExport";
import { printReceipt } from "@/components/PrintReceipt";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { SOURCE_OPTIONS, SOURCE_LABELS, SOURCE_COLORS } from "@shared/sources";

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
  const [selectedDoctor, setSelectedDoctor] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState("all");
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState<string[]>([]);
  const [appointmentSourceFilter, setAppointmentSourceFilter] = useState<string[]>([]);
  const [leadsStatusFilter, setLeadsStatusFilter] = useState<string[]>([]);
  const [leadsSourceFilter, setLeadsSourceFilter] = useState<string[]>([]);
  const [offerLeadsPendingCount, setOfferLeadsPendingCount] = useState(0);
  const [campRegistrationsPendingCount, setCampRegistrationsPendingCount] = useState(0);
  
  // Sorting state
  const [appointmentSortField, setAppointmentSortField] = useState<'date' | 'name' | 'phone' | 'doctor' | 'specialty' | 'source' | 'receiptNumber' | 'status' | null>(null);
  const [appointmentSortDirection, setAppointmentSortDirection] = useState<'asc' | 'desc'>('asc');

  // Column visibility state for Appointments - جميع الأعمدة من قاعدة البيانات
  const appointmentColumns: ColumnConfig[] = [
    { key: 'receiptNumber', label: 'رقم السند', defaultVisible: true },
    { key: 'date', label: 'تاريخ الحجز', defaultVisible: true },
    { key: 'name', label: 'اسم المريض', defaultVisible: true },
    { key: 'phone', label: 'رقم الهاتف', defaultVisible: true },
    { key: 'email', label: 'البريد الإلكتروني', defaultVisible: false },
    { key: 'age', label: 'العمر', defaultVisible: false },
    { key: 'doctor', label: 'الطبيب', defaultVisible: true },
    { key: 'specialty', label: 'التخصص', defaultVisible: true },
    { key: 'procedure', label: 'الإجراء الطبي', defaultVisible: false },
    { key: 'preferredDate', label: 'التاريخ المفضل', defaultVisible: false },
    { key: 'preferredTime', label: 'الوقت المفضل', defaultVisible: false },
    { key: 'appointmentDate', label: 'موعد المقابلة', defaultVisible: false },
    { key: 'notes', label: 'ملاحظات المريض', defaultVisible: false },
    { key: 'additionalNotes', label: 'ملاحظات إضافية', defaultVisible: false },
    { key: 'staffNotes', label: 'ملاحظات الموظفين', defaultVisible: false },
    { key: 'status', label: 'الحالة', defaultVisible: true },
    { key: 'source', label: 'المصدر', defaultVisible: true },
    { key: 'utmSource', label: 'UTM Source', defaultVisible: false },
    { key: 'utmMedium', label: 'UTM Medium', defaultVisible: false },
    { key: 'utmCampaign', label: 'UTM Campaign', defaultVisible: false },
    { key: 'utmTerm', label: 'UTM Term', defaultVisible: false },
    { key: 'utmContent', label: 'UTM Content', defaultVisible: false },
    { key: 'utmPlacement', label: 'UTM Placement', defaultVisible: false },
    { key: 'referrer', label: 'المحيل', defaultVisible: false },
    { key: 'fbclid', label: 'Facebook Click ID', defaultVisible: false },
    { key: 'gclid', label: 'Google Click ID', defaultVisible: false },
    { key: 'comments', label: 'التعليقات', defaultVisible: true },
    { key: 'tasks', label: 'المهام', defaultVisible: true },
    { key: 'actions', label: 'الإجراءات', defaultVisible: true },
  ];

  // Load preferences from database
  const { data: savedPreferences } = trpc.preferences.get.useQuery(
    { key: 'appointmentVisibleColumns' },
    { retry: false }
  );
  
  const savePreferencesMutation = trpc.preferences.set.useMutation();
  
  const [appointmentVisibleColumns, setAppointmentVisibleColumns] = useState<Record<string, boolean>>(() => {
    // Try localStorage first for immediate load
    const saved = localStorage.getItem('appointmentVisibleColumns');
    if (saved) {
      return JSON.parse(saved);
    }
    const defaultVisible: Record<string, boolean> = {};
    appointmentColumns.forEach(col => {
      defaultVisible[col.key] = col.defaultVisible;
    });
    return defaultVisible;
  });

  // Sync database preferences to state when loaded
  useEffect(() => {
    if (savedPreferences) {
      setAppointmentVisibleColumns(savedPreferences);
      // Also update localStorage for faster future loads
      localStorage.setItem('appointmentVisibleColumns', JSON.stringify(savedPreferences));
    }
  }, [savedPreferences]);
  
  const handleAppointmentColumnVisibilityChange = (columnKey: string, visible: boolean) => {
    const updated = { ...appointmentVisibleColumns, [columnKey]: visible };
    setAppointmentVisibleColumns(updated);
    // Save to both localStorage (immediate) and database (synced)
    localStorage.setItem('appointmentVisibleColumns', JSON.stringify(updated));
    savePreferencesMutation.mutate({
      key: 'appointmentVisibleColumns',
      value: updated,
    });
  };

  const handleAppointmentColumnsReset = () => {
    const defaultVisible: Record<string, boolean> = {};
    appointmentColumns.forEach(col => {
      defaultVisible[col.key] = col.defaultVisible;
    });
    setAppointmentVisibleColumns(defaultVisible);
    setActiveAppointmentTemplateId(null);
    // Save to both localStorage and database
    localStorage.setItem('appointmentVisibleColumns', JSON.stringify(defaultVisible));
    localStorage.removeItem('activeAppointmentTemplateId');
    savePreferencesMutation.mutate({
      key: 'appointmentVisibleColumns',
      value: defaultVisible,
    });
    savePreferencesMutation.mutate({
      key: 'activeAppointmentTemplateId',
      value: null,
    });
  };

  // === Column Templates ===
  const defaultAppointmentTemplates = getDefaultTemplates(appointmentColumns, 'appointments');
  
  const { data: savedTemplates } = trpc.preferences.get.useQuery(
    { key: 'appointmentColumnTemplates' },
    { retry: false }
  );
  
  const { data: savedActiveTemplateId } = trpc.preferences.get.useQuery(
    { key: 'activeAppointmentTemplateId' },
    { retry: false }
  );

  const [customTemplates, setCustomTemplates] = useState<ColumnTemplate[]>(() => {
    const saved = localStorage.getItem('appointmentColumnTemplates');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeAppointmentTemplateId, setActiveAppointmentTemplateId] = useState<string | null>(() => {
    return localStorage.getItem('activeAppointmentTemplateId') || null;
  });

  useEffect(() => {
    if (savedTemplates && Array.isArray(savedTemplates)) {
      setCustomTemplates(savedTemplates);
      localStorage.setItem('appointmentColumnTemplates', JSON.stringify(savedTemplates));
    }
  }, [savedTemplates]);

  useEffect(() => {
    if (savedActiveTemplateId !== undefined) {
      setActiveAppointmentTemplateId(savedActiveTemplateId);
      if (savedActiveTemplateId) {
        localStorage.setItem('activeAppointmentTemplateId', savedActiveTemplateId);
      } else {
        localStorage.removeItem('activeAppointmentTemplateId');
      }
    }
  }, [savedActiveTemplateId]);

  const allAppointmentTemplates = [...defaultAppointmentTemplates, ...customTemplates];

  const handleApplyAppointmentTemplate = (template: ColumnTemplate) => {
    setAppointmentVisibleColumns(template.columns);
    setActiveAppointmentTemplateId(template.id);
    localStorage.setItem('appointmentVisibleColumns', JSON.stringify(template.columns));
    localStorage.setItem('activeAppointmentTemplateId', template.id);
    savePreferencesMutation.mutate({ key: 'appointmentVisibleColumns', value: template.columns });
    savePreferencesMutation.mutate({ key: 'activeAppointmentTemplateId', value: template.id });
  };

  const handleSaveAppointmentTemplate = (name: string, columns: Record<string, boolean>) => {
    const newTemplate: ColumnTemplate = {
      id: `appointments_custom_${Date.now()}`,
      name,
      columns,
      isDefault: false,
    };
    const updated = [...customTemplates, newTemplate];
    setCustomTemplates(updated);
    setActiveAppointmentTemplateId(newTemplate.id);
    localStorage.setItem('appointmentColumnTemplates', JSON.stringify(updated));
    localStorage.setItem('activeAppointmentTemplateId', newTemplate.id);
    savePreferencesMutation.mutate({ key: 'appointmentColumnTemplates', value: updated });
    savePreferencesMutation.mutate({ key: 'activeAppointmentTemplateId', value: newTemplate.id });
  };

  const handleDeleteAppointmentTemplate = (templateId: string) => {
    const updated = customTemplates.filter(t => t.id !== templateId);
    setCustomTemplates(updated);
    if (activeAppointmentTemplateId === templateId) {
      setActiveAppointmentTemplateId(null);
      localStorage.removeItem('activeAppointmentTemplateId');
      savePreferencesMutation.mutate({ key: 'activeAppointmentTemplateId', value: null });
    }
    localStorage.setItem('appointmentColumnTemplates', JSON.stringify(updated));
    savePreferencesMutation.mutate({ key: 'appointmentColumnTemplates', value: updated });
  };
  
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

  // Apply filtering and sorting to appointments
  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];
    
    let filtered = [...appointments];
    
    // Filter by doctor (multiple selection)
    if (selectedDoctor && selectedDoctor.length > 0) {
      filtered = filtered.filter((appointment: any) => selectedDoctor.includes(appointment.doctorId?.toString()));
    }
    
    // Filter by source (multiple selection)
    if (appointmentSourceFilter && appointmentSourceFilter.length > 0) {
      filtered = filtered.filter((appointment: any) => appointmentSourceFilter.includes(appointment.source));
    }
    
    // Filter by status (multiple selection)
    if (appointmentStatusFilter && appointmentStatusFilter.length > 0) {
      filtered = filtered.filter((appointment: any) => appointmentStatusFilter.includes(appointment.status));
    }
    
    let sorted = filtered;
    
    // Default sorting: newest first (by date desc)
    if (!appointmentSortField) {
      sorted.sort((a: any, b: any) => {
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        return bDate - aDate; // Newest first
      });
    } else {
      sorted.sort((a: any, b: any) => {
        let aValue, bValue;
        
        switch (appointmentSortField) {
          case 'date':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'name':
            aValue = (a.fullName || a.patientName || '').toLowerCase();
            bValue = (b.fullName || b.patientName || '').toLowerCase();
            break;
          case 'phone':
            aValue = (a.phone || '').toLowerCase();
            bValue = (b.phone || '').toLowerCase();
            break;
          case 'doctor':
            aValue = (a.doctorName || '').toLowerCase();
            bValue = (b.doctorName || '').toLowerCase();
            break;
          case 'specialty':
            aValue = (a.doctorSpecialty || '').toLowerCase();
            bValue = (b.doctorSpecialty || '').toLowerCase();
            break;
          case 'source':
            aValue = (a.source || '').toLowerCase();
            bValue = (b.source || '').toLowerCase();
            break;
          case 'receiptNumber':
            aValue = (a.receiptNumber || '').toLowerCase();
            bValue = (b.receiptNumber || '').toLowerCase();
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
  }, [appointments, selectedDoctor, appointmentSourceFilter, appointmentStatusFilter, appointmentSortField, appointmentSortDirection]);

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

  const handleExportAppointments = async (format: 'excel' | 'csv' | 'pdf') => {
    if (!filteredAppointments || filteredAppointments.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }

    try {
      // تحضير الفلاتر المستخدمة
      const activeFilters: Record<string, string> = {};
      if (debouncedAppointmentSearch) {
        activeFilters['البحث'] = debouncedAppointmentSearch;
      }
      if (appointmentStatusFilter.length > 0) {
        activeFilters['الحالة'] = appointmentStatusFilter.map(s => statusLabels[s as keyof typeof statusLabels]).join(', ');
      }
      if (appointmentSourceFilter.length > 0) {
        activeFilters['المصدر'] = appointmentSourceFilter.map(s => SOURCE_LABELS[s] || s).join(', ');
      }
      if (selectedDoctor.length > 0) {
        const doctorNames = selectedDoctor.map(id => {
          const doctor = doctors.find(d => d.id.toString() === id);
          return doctor ? doctor.name : id;
        }).join(', ');
        activeFilters['الطبيب'] = doctorNames;
      }

      // تحضير نطاق التاريخ
      const dateRangeStr = `${dateRange.from.toLocaleDateString('ar-SA')} - ${dateRange.to.toLocaleDateString('ar-SA')}`;

      // تحضير تعريفات الأعمدة
      const columnDefinitions = [
        { key: 'date', label: 'التاريخ' },
        { key: 'name', label: 'اسم المريض' },
        { key: 'phone', label: 'الهاتف' },
        { key: 'doctor', label: 'الطبيب' },
        { key: 'specialty', label: 'التخصص' },
        { key: 'source', label: 'المصدر' },
        { key: 'receiptNumber', label: 'رقم السند' },
        { key: 'status', label: 'الحالة' },
      ];

      // تحويل البيانات للتصدير
      const dataToExport = filteredAppointments.map((appointment: any) => ({
        date: new Date(appointment.appointmentDate).toLocaleDateString('ar-SA'),
        name: appointment.name,
        phone: appointment.phone,
        doctor: appointment.doctorName || '-',
        specialty: appointment.specialty || '-',
        source: SOURCE_LABELS[appointment.source] || appointment.source || '-',
        receiptNumber: appointment.receiptNumber || '-',
        status: statusLabels[appointment.status as keyof typeof statusLabels] || appointment.status,
      }));

      // تحضير metadata
      const metadata: ExportMetadata = {
        tableName: 'مواعيد الأطباء',
        dateRange: dateRangeStr,
        filters: Object.keys(activeFilters).length > 0 ? activeFilters : undefined,
        totalRecords: dataToExport.length,
        exportedRecords: dataToExport.length,
        exportDate: new Date().toLocaleString('ar-SA'),
        exportedBy: user?.name || 'مستخدم',
      };

      // تحضير الأعمدة المرئية
      const visibleCols = Object.entries(appointmentVisibleColumns)
        .filter(([_, visible]) => visible)
        .map(([key]) => {
          const col = columnDefinitions.find(c => c.key === key);
          return { key, label: col?.label || key };
        });

      // تصدير بالتنسيق المحدد
      await exportData({
        format,
        metadata,
        columns: visibleCols,
        data: dataToExport,
        filename: `مواعيد_الأطباء_${Date.now()}.${format === 'excel' ? 'xlsx' : format}`,
      });

      toast.success(`تم تصدير البيانات بنجاح بتنسيق ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('حدث خطأ أثناء التصدير');
    }
  };

  const handlePrintAppointments = () => {
    if (!filteredAppointments || filteredAppointments.length === 0) {
      toast.error("لا توجد بيانات للطباعة");
      return;
    }

    try {
      // تحضير الفلاتر المستخدمة
      const activeFilters: Record<string, string> = {};
      if (debouncedAppointmentSearch) {
        activeFilters['البحث'] = debouncedAppointmentSearch;
      }
      if (appointmentStatusFilter.length > 0) {
        activeFilters['الحالة'] = appointmentStatusFilter.map(s => statusLabels[s as keyof typeof statusLabels]).join(', ');
      }
      if (appointmentSourceFilter.length > 0) {
        activeFilters['المصدر'] = appointmentSourceFilter.map(s => SOURCE_LABELS[s] || s).join(', ');
      }
      if (selectedDoctor.length > 0) {
        const doctorNames = selectedDoctor.map(id => {
          const doctor = doctors.find(d => d.id.toString() === id);
          return doctor ? doctor.name : id;
        }).join(', ');
        activeFilters['الطبيب'] = doctorNames;
      }

      // تحضير نطاق التاريخ
      const dateRangeStr = `${dateRange.from.toLocaleDateString('ar-SA')} - ${dateRange.to.toLocaleDateString('ar-SA')}`;

      // تحضير تعريفات جميع الأعمدة الـ 11
      const columnDefinitions = [
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
      ];

      // تحويل البيانات للطباعة مع جميع الأعمدة
      const dataToExport = filteredAppointments.map((appointment: any) => ({
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
      }));

      // تحضير metadata
      const metadata: ExportMetadata = {
        tableName: 'مواعيد الأطباء',
        dateRange: dateRangeStr,
        filters: Object.keys(activeFilters).length > 0 ? activeFilters : undefined,
        totalRecords: dataToExport.length,
        exportedRecords: dataToExport.length,
        exportDate: new Date().toLocaleString('ar-SA'),
        exportedBy: user?.name || 'مستخدم',
      };

      // تحضير الأعمدة المرئية
      const visibleCols = Object.entries(appointmentVisibleColumns)
        .filter(([_, visible]) => visible)
        .map(([key]) => {
          const col = columnDefinitions.find(c => c.key === key);
          return { key, label: col?.label || key };
        });

      // استدعاء دالة الطباعة
      printTable({
        format: 'pdf', // لا يستخدم في الطباعة
        metadata,
        columns: visibleCols,
        data: dataToExport,
      });
    } catch (error) {
      console.error('Print error:', error);
      toast.error('حدث خطأ أثناء الطباعة');
    }
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
                <CardTitle>مواعيد الأطباء</CardTitle>
                <CardDescription>إدارة ومتابعة مواعيد الأطباء</CardDescription>
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
                      visibleColumns={appointmentVisibleColumns}
                      onVisibilityChange={handleAppointmentColumnVisibilityChange}
                      onReset={handleAppointmentColumnsReset}
                      templates={allAppointmentTemplates}
                      activeTemplateId={activeAppointmentTemplateId}
                      onApplyTemplate={handleApplyAppointmentTemplate}
                      onSaveTemplate={handleSaveAppointmentTemplate}
                      onDeleteTemplate={handleDeleteAppointmentTemplate}
                      tableKey="appointments"
                    />
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
                        {appointmentVisibleColumns['date'] && (
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => {
                              if (appointmentSortField === 'date') {
                                setAppointmentSortDirection(appointmentSortDirection === 'asc' ? 'desc' : 'asc');
                              } else {
                                setAppointmentSortField('date');
                                setAppointmentSortDirection('desc');
                              }
                            }}
                          >
                            <div className="flex items-center gap-1">
                              التاريخ
                              {appointmentSortField === 'date' && (
                                <span className="text-xs">{appointmentSortDirection === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </TableHead>
                        )}
                        {appointmentVisibleColumns['name'] && (
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
                        )}
                        {appointmentVisibleColumns['phone'] && (
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => {
                              if (appointmentSortField === 'phone') {
                                setAppointmentSortDirection(appointmentSortDirection === 'asc' ? 'desc' : 'asc');
                              } else {
                                setAppointmentSortField('phone');
                                setAppointmentSortDirection('asc');
                              }
                            }}
                          >
                            <div className="flex items-center gap-1">
                              الهاتف
                              {appointmentSortField === 'phone' && (
                                <span className="text-xs">{appointmentSortDirection === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </TableHead>
                        )}
                        {appointmentVisibleColumns['doctor'] && (
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => {
                              if (appointmentSortField === 'doctor') {
                                setAppointmentSortDirection(appointmentSortDirection === 'asc' ? 'desc' : 'asc');
                              } else {
                                setAppointmentSortField('doctor');
                                setAppointmentSortDirection('asc');
                              }
                            }}
                          >
                            <div className="flex items-center gap-1">
                              الطبيب
                              {appointmentSortField === 'doctor' && (
                                <span className="text-xs">{appointmentSortDirection === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </TableHead>
                        )}
                        {appointmentVisibleColumns['specialty'] && (
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => {
                              if (appointmentSortField === 'specialty') {
                                setAppointmentSortDirection(appointmentSortDirection === 'asc' ? 'desc' : 'asc');
                              } else {
                                setAppointmentSortField('specialty');
                                setAppointmentSortDirection('asc');
                              }
                            }}
                          >
                            <div className="flex items-center gap-1">
                              التخصص
                              {appointmentSortField === 'specialty' && (
                                <span className="text-xs">{appointmentSortDirection === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </TableHead>
                        )}
                        {appointmentVisibleColumns['source'] && (
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => {
                              if (appointmentSortField === 'source') {
                                setAppointmentSortDirection(appointmentSortDirection === 'asc' ? 'desc' : 'asc');
                              } else {
                                setAppointmentSortField('source');
                                setAppointmentSortDirection('asc');
                              }
                            }}
                          >
                            <div className="flex items-center gap-1">
                              المصدر
                              {appointmentSortField === 'source' && (
                                <span className="text-xs">{appointmentSortDirection === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </TableHead>
                        )}
                        {appointmentVisibleColumns['receiptNumber'] && (
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => {
                              if (appointmentSortField === 'receiptNumber') {
                                setAppointmentSortDirection(appointmentSortDirection === 'asc' ? 'desc' : 'asc');
                              } else {
                                setAppointmentSortField('receiptNumber');
                                setAppointmentSortDirection('asc');
                              }
                            }}
                          >
                            <div className="flex items-center gap-1">
                              رقم السند
                              {appointmentSortField === 'receiptNumber' && (
                                <span className="text-xs">{appointmentSortDirection === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </TableHead>
                        )}
                        {appointmentVisibleColumns['status'] && (
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
                        )}
                        {appointmentVisibleColumns['comments'] && <TableHead>التعليقات</TableHead>}
                        {appointmentVisibleColumns['tasks'] && <TableHead>المهام</TableHead>}
                        {appointmentVisibleColumns['actions'] && <TableHead>الإجراءات</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointmentsLoading ? (
                        <TableRow>
                          <TableCell colSpan={11} className="p-0">
                            <TableSkeleton rows={5} columns={11} />
                          </TableCell>
                        </TableRow>
                      ) : filteredAppointments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={11} className="py-12">
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
                            {/* التاريخ - تاريخ التسجيل */}
                            {appointmentVisibleColumns['date'] && (
                              <TableCell className="font-medium">
                                {new Date(appointment.createdAt).toLocaleDateString("ar-EG")}
                              </TableCell>
                            )}
                            {/* اسم المريض */}
                            {appointmentVisibleColumns['name'] && (
                              <TableCell className="font-medium">{appointment.fullName || appointment.patientName || '-'}</TableCell>
                            )}
                            {/* الهاتف */}
                            {appointmentVisibleColumns['phone'] && (
                              <TableCell>
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
                              </TableCell>
                            )}
                            {/* الطبيب */}
                            {appointmentVisibleColumns['doctor'] && (
                              <TableCell>{appointment.doctorName || '-'}</TableCell>
                            )}
                            {/* التخصص */}
                            {appointmentVisibleColumns['specialty'] && (
                              <TableCell>{appointment.doctorSpecialty || '-'}</TableCell>
                            )}
                            {/* المصدر */}
                            {appointmentVisibleColumns['source'] && (
                              <TableCell>
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
                              </TableCell>
                            )}
                            {/* رقم السند */}
                            {appointmentVisibleColumns['receiptNumber'] && (
                              <TableCell className="text-sm text-muted-foreground font-mono">
                                {appointment.receiptNumber || "-"}
                              </TableCell>
                            )}
                            {/* الحالة */}
                            {appointmentVisibleColumns['status'] && (
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
                            )}
                            {appointmentVisibleColumns['comments'] && (
                              <TableCell>
                                <CommentCount
                                  entityType="appointment"
                                  entityId={appointment.id}
                                />
                              </TableCell>
                            )}
                            {appointmentVisibleColumns['tasks'] && (
                              <TableCell>
                                <TaskCount
                                  entityType="appointment"
                                  entityId={appointment.id}
                                />
                              </TableCell>
                            )}
                            {appointmentVisibleColumns['actions'] && (
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
                            )}
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
      </div>
    </DashboardLayout>
  );
}
