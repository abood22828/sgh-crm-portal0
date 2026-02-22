import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Search, 
  Clock,
  Phone,
  Mail,
  Loader2,
  Eye,
  Tent,
  Calendar,
  MessageCircle,
  Download,
  Printer,
  Settings,
  TentTree,
} from "lucide-react";
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
import { toast } from "sonner";
import { exportToExcel, formatCampRegistrationsForExport } from "@/lib/exportToExcel";
import { exportData, printTable, type ExportMetadata } from "@/lib/advancedExport";
import { printReceipt } from "@/components/PrintReceipt";
import { useAuth } from "@/_core/hooks/useAuth";
import { SOURCE_OPTIONS, SOURCE_LABELS, SOURCE_COLORS } from "@shared/sources";
import { useState as useReactState } from "react";
import CampRegistrationCard from "@/components/CampRegistrationCard";
import CardSkeleton from "@/components/CardSkeleton";
import { Checkbox } from "@/components/ui/checkbox";
import BulkUpdateDialog from "@/components/BulkUpdateDialog";
import Pagination from "@/components/Pagination";

const statusLabels = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  attended: "حضر",
  cancelled: "ملغي",
};

const statusColors = {
  pending: "bg-yellow-500",
  confirmed: "bg-green-500",
  attended: "bg-blue-500",
  cancelled: "bg-red-500",
};

export default function CampRegistrationsManagement({ 
  onPendingCountChange,
  dateRange
}: { 
  onPendingCountChange?: (count: number) => void,
  dateRange: { from: Date, to: Date }
}) {
  const { user } = useAuth();
  const generateReceiptNumberMutation = trpc.campRegistrations.generateReceiptNumber.useMutation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCamp, setSelectedCamp] = useState<string[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [editedName, setEditedName] = useState("");
  const [editedPhone, setEditedPhone] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  // Removed pagination - using date range instead
  const [campRegistrationsSearchTerm, setCampRegistrationsSearchTerm] = useState("");
  
  // Sorting state
  const [sortField, setSortField] = useState<'date' | 'name' | 'phone' | 'email' | 'age' | 'camp' | 'source' | 'receiptNumber' | 'status' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Column visibility state for CampRegistrations - جميع الأعمدة من قاعدة البيانات
  const campRegColumns: ColumnConfig[] = [
    { key: 'checkbox', label: 'تحديد', defaultVisible: true },
    { key: 'receiptNumber', label: 'رقم السند', defaultVisible: true },
    { key: 'name', label: 'الاسم الكامل', defaultVisible: true },
    { key: 'phone', label: 'رقم الهاتف', defaultVisible: true },
    { key: 'email', label: 'البريد الإلكتروني', defaultVisible: true },
    { key: 'age', label: 'العمر', defaultVisible: true },
    { key: 'gender', label: 'الجنس', defaultVisible: false },
    { key: 'camp', label: 'المخيم', defaultVisible: true },
    { key: 'procedures', label: 'الإجراءات المختارة', defaultVisible: false },
    { key: 'medicalCondition', label: 'الحالة الصحية', defaultVisible: false },
    { key: 'notes', label: 'ملاحظات المسجل', defaultVisible: false },
    { key: 'status', label: 'الحالة', defaultVisible: true },
    { key: 'statusNotes', label: 'ملاحظات الحالة', defaultVisible: false },
    { key: 'attendanceDate', label: 'تاريخ الحضور', defaultVisible: false },
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
    { key: 'date', label: 'تاريخ التسجيل', defaultVisible: true },
    { key: 'comments', label: 'التعليقات', defaultVisible: true },
    { key: 'tasks', label: 'المهام', defaultVisible: true },
    { key: 'actions', label: 'الإجراءات', defaultVisible: true },
  ];

  // Load preferences from database
  const { data: savedCampPreferences } = trpc.preferences.get.useQuery(
    { key: 'campRegVisibleColumns' },
    { retry: false }
  );
  
  const saveCampPreferencesMutation = trpc.preferences.set.useMutation();
  
  const [campRegVisibleColumns, setCampRegVisibleColumns] = useState<Record<string, boolean>>(() => {
    // Try localStorage first for immediate load
    const saved = localStorage.getItem('campRegVisibleColumns');
    if (saved) {
      return JSON.parse(saved);
    }
    const defaultVisible: Record<string, boolean> = {};
    campRegColumns.forEach(col => {
      defaultVisible[col.key] = col.defaultVisible;
    });
    return defaultVisible;
  });

  // Sync database preferences to state when loaded
  useEffect(() => {
    if (savedCampPreferences) {
      setCampRegVisibleColumns(savedCampPreferences);
      localStorage.setItem('campRegVisibleColumns', JSON.stringify(savedCampPreferences));
    }
  }, [savedCampPreferences]);
  
  const handleCampRegColumnVisibilityChange = (columnKey: string, visible: boolean) => {
    const updated = { ...campRegVisibleColumns, [columnKey]: visible };
    setCampRegVisibleColumns(updated);
    localStorage.setItem('campRegVisibleColumns', JSON.stringify(updated));
    saveCampPreferencesMutation.mutate({
      key: 'campRegVisibleColumns',
      value: updated,
    });
  };

  const handleCampRegColumnsReset = () => {
    const defaultVisible: Record<string, boolean> = {};
    campRegColumns.forEach(col => {
      defaultVisible[col.key] = col.defaultVisible;
    });
    setCampRegVisibleColumns(defaultVisible);
    setActiveCampTemplateId(null);
    localStorage.setItem('campRegVisibleColumns', JSON.stringify(defaultVisible));
    localStorage.removeItem('activeCampTemplateId');
    saveCampPreferencesMutation.mutate({ key: 'campRegVisibleColumns', value: defaultVisible });
    saveCampPreferencesMutation.mutate({ key: 'activeCampTemplateId', value: null });
  };

  // === Column Templates ===
  const defaultCampTemplates = getDefaultTemplates(campRegColumns, 'campRegistrations');
  
  const { data: savedCampTemplates } = trpc.preferences.get.useQuery(
    { key: 'campRegColumnTemplates' },
    { retry: false }
  );
  
  const { data: savedCampActiveTemplateId } = trpc.preferences.get.useQuery(
    { key: 'activeCampTemplateId' },
    { retry: false }
  );

  const [customCampTemplates, setCustomCampTemplates] = useState<ColumnTemplate[]>(() => {
    const saved = localStorage.getItem('campRegColumnTemplates');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeCampTemplateId, setActiveCampTemplateId] = useState<string | null>(() => {
    return localStorage.getItem('activeCampTemplateId') || null;
  });

  useEffect(() => {
    if (savedCampTemplates && Array.isArray(savedCampTemplates)) {
      setCustomCampTemplates(savedCampTemplates);
      localStorage.setItem('campRegColumnTemplates', JSON.stringify(savedCampTemplates));
    }
  }, [savedCampTemplates]);

  useEffect(() => {
    if (savedCampActiveTemplateId !== undefined) {
      setActiveCampTemplateId(savedCampActiveTemplateId);
      if (savedCampActiveTemplateId) {
        localStorage.setItem('activeCampTemplateId', savedCampActiveTemplateId);
      } else {
        localStorage.removeItem('activeCampTemplateId');
      }
    }
  }, [savedCampActiveTemplateId]);

  const allCampTemplates = [...defaultCampTemplates, ...customCampTemplates];

  const handleApplyCampTemplate = (template: ColumnTemplate) => {
    setCampRegVisibleColumns(template.columns);
    setActiveCampTemplateId(template.id);
    localStorage.setItem('campRegVisibleColumns', JSON.stringify(template.columns));
    localStorage.setItem('activeCampTemplateId', template.id);
    saveCampPreferencesMutation.mutate({ key: 'campRegVisibleColumns', value: template.columns });
    saveCampPreferencesMutation.mutate({ key: 'activeCampTemplateId', value: template.id });
  };

  const handleSaveCampTemplate = (name: string, columns: Record<string, boolean>) => {
    const newTemplate: ColumnTemplate = {
      id: `campRegistrations_custom_${Date.now()}`,
      name,
      columns,
      isDefault: false,
    };
    const updated = [...customCampTemplates, newTemplate];
    setCustomCampTemplates(updated);
    setActiveCampTemplateId(newTemplate.id);
    localStorage.setItem('campRegColumnTemplates', JSON.stringify(updated));
    localStorage.setItem('activeCampTemplateId', newTemplate.id);
    saveCampPreferencesMutation.mutate({ key: 'campRegColumnTemplates', value: updated });
    saveCampPreferencesMutation.mutate({ key: 'activeCampTemplateId', value: newTemplate.id });
  };

  const handleDeleteCampTemplate = (templateId: string) => {
    const updated = customCampTemplates.filter(t => t.id !== templateId);
    setCustomCampTemplates(updated);
    if (activeCampTemplateId === templateId) {
      setActiveCampTemplateId(null);
      localStorage.removeItem('activeCampTemplateId');
      saveCampPreferencesMutation.mutate({ key: 'activeCampTemplateId', value: null });
    }
    localStorage.setItem('campRegColumnTemplates', JSON.stringify(updated));
    saveCampPreferencesMutation.mutate({ key: 'campRegColumnTemplates', value: updated });
  };
  
  // Debounced search for better performance
  const debouncedSearch = useDebounce(campRegistrationsSearchTerm, 500);

  const { data: registrationsData, isLoading, refetch } = trpc.campRegistrations.listPaginated.useQuery({
    page: 1,
    limit: 10000, // Get all records within date range
    searchTerm: debouncedSearch,
    dateFrom: dateRange.from.toISOString(),
    dateTo: dateRange.to.toISOString(),
  });
  const registrations = registrationsData?.data || [];
  const { data: stats } = trpc.campRegistrations.stats.useQuery();
  
  // Removed pagination reset effect
  
  // Count pending registrations (status = 'pending')
  const pendingCount = useMemo(() => {
    return registrations?.filter(r => r.status === 'pending').length || 0;
  }, [registrations]);
  
  // Notify parent of pending count changes
  useEffect(() => {
    if (onPendingCountChange) {
      onPendingCountChange(pendingCount);
    }
  }, [pendingCount, onPendingCountChange]);

  // دالة التصدير المتقدمة
  const handleExportCampRegistrations = async (format: 'excel' | 'csv' | 'pdf') => {
    if (!filteredRegistrations || filteredRegistrations.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }

    try {
      // تحضير الفلاتر المستخدمة
      const activeFilters: Record<string, string> = {};
      if (debouncedSearch) {
        activeFilters['البحث'] = debouncedSearch;
      }
      if (statusFilter.length > 0) {
        activeFilters['الحالة'] = statusFilter.map(s => statusLabels[s as keyof typeof statusLabels]).join(', ');
      }
      if (sourceFilter.length > 0) {
        activeFilters['المصدر'] = sourceFilter.map(s => SOURCE_LABELS[s] || s).join(', ');
      }
      if (selectedCamp.length > 0) {
        activeFilters['المخيم'] = selectedCamp.join(', ');
      }

      // تحضير نطاق التاريخ
      const dateRangeStr = `${dateRange.from.toLocaleDateString('ar-SA')} - ${dateRange.to.toLocaleDateString('ar-SA')}`;

      // تحضير تعريفات الأعمدة
      const columnDefinitions = [
        { key: 'receiptNumber', label: 'رقم السند' },
        { key: 'name', label: 'الاسم الكامل' },
        { key: 'phone', label: 'رقم الهاتف' },
        { key: 'email', label: 'البريد الإلكتروني' },
        { key: 'age', label: 'العمر' },
        { key: 'camp', label: 'المخيم' },
        { key: 'source', label: 'المصدر' },
        { key: 'status', label: 'الحالة' },
        { key: 'date', label: 'تاريخ التسجيل' },
      ];

      // تحويل البيانات للتصدير
      const dataToExport = filteredRegistrations.map((reg: any) => ({
        receiptNumber: reg.receiptNumber || '-',
        name: reg.fullName,
        phone: reg.phone,
        email: reg.email || '-',
        age: reg.age || '-',
        camp: reg.campTitle || '-',
        source: SOURCE_LABELS[reg.source] || reg.source || '-',
        status: statusLabels[reg.status as keyof typeof statusLabels] || reg.status,
        date: new Date(reg.createdAt).toLocaleDateString('ar-SA'),
      }));

      // تحضير metadata
      const metadata: ExportMetadata = {
        tableName: 'تسجيلات المخيمات',
        dateRange: dateRangeStr,
        filters: Object.keys(activeFilters).length > 0 ? activeFilters : undefined,
        totalRecords: dataToExport.length,
        exportedRecords: dataToExport.length,
        exportDate: new Date().toLocaleString('ar-SA'),
        exportedBy: user?.name || 'مستخدم',
      };

      // تحضير الأعمدة المرئية
      const visibleCols = Object.entries(campRegVisibleColumns)
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
        filename: `تسجيلات_المخيمات_${Date.now()}.${format === 'excel' ? 'xlsx' : format}`,
      });

      toast.success(`تم تصدير البيانات بنجاح بتنسيق ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('حدث خطأ أثناء التصدير');
    }
  };

  // دالة الطباعة
  const handlePrintCampRegistrations = () => {
    if (!filteredRegistrations || filteredRegistrations.length === 0) {
      toast.error("لا توجد بيانات للطباعة");
      return;
    }

    try {
      // تحضير الفلاتر المستخدمة
      const activeFilters: Record<string, string> = {};
      if (debouncedSearch) {
        activeFilters['البحث'] = debouncedSearch;
      }
      if (statusFilter.length > 0) {
        activeFilters['الحالة'] = statusFilter.map(s => statusLabels[s as keyof typeof statusLabels]).join(', ');
      }
      if (sourceFilter.length > 0) {
        activeFilters['المصدر'] = sourceFilter.map(s => SOURCE_LABELS[s] || s).join(', ');
      }
      if (selectedCamp.length > 0) {
        activeFilters['المخيم'] = selectedCamp.join(', ');
      }

      // تحضير نطاق التاريخ
      const dateRangeStr = `${dateRange.from.toLocaleDateString('ar-SA')} - ${dateRange.to.toLocaleDateString('ar-SA')}`;

      // تحضير تعريفات جميع الأعمدة الـ 13
      const columnDefinitions = [
        { key: 'checkbox', label: 'تحديد' },
        { key: 'receiptNumber', label: 'رقم السند' },
        { key: 'name', label: 'الاسم الكامل' },
        { key: 'phone', label: 'رقم الهاتف' },
        { key: 'email', label: 'البريد الإلكتروني' },
        { key: 'age', label: 'العمر' },
        { key: 'camp', label: 'المخيم' },
        { key: 'source', label: 'المصدر' },
        { key: 'status', label: 'الحالة' },
        { key: 'date', label: 'تاريخ التسجيل' },
        { key: 'comments', label: 'التعليقات' },
        { key: 'tasks', label: 'المهام' },
        { key: 'actions', label: 'الإجراءات' },
      ];

      // تحويل البيانات للطباعة مع جميع الأعمدة
      const dataToExport = filteredRegistrations.map((reg: any) => ({
        checkbox: '-',
        receiptNumber: reg.receiptNumber || '-',
        name: reg.fullName,
        phone: reg.phone,
        email: reg.email || '-',
        age: reg.age || '-',
        camp: reg.campTitle || '-',
        source: SOURCE_LABELS[reg.source] || reg.source || '-',
        status: statusLabels[reg.status as keyof typeof statusLabels] || reg.status,
        date: new Date(reg.createdAt).toLocaleDateString('ar-SA'),
        comments: reg.commentCount > 0 ? `${reg.commentCount} تعليق` : '-',
        tasks: reg.taskCount > 0 ? `${reg.taskCount} مهمة` : '-',
        actions: '-',
      }));

      // تحضير metadata
      const metadata: ExportMetadata = {
        tableName: 'تسجيلات المخيمات',
        dateRange: dateRangeStr,
        filters: Object.keys(activeFilters).length > 0 ? activeFilters : undefined,
        totalRecords: dataToExport.length,
        exportedRecords: dataToExport.length,
        exportDate: new Date().toLocaleString('ar-SA'),
        exportedBy: user?.name || 'مستخدم',
      };

      // تحضير الأعمدة المرئية
      const visibleCols = Object.entries(campRegVisibleColumns)
        .filter(([_, visible]) => visible)
        .map(([key]) => {
          const col = columnDefinitions.find(c => c.key === key);
          return { key, label: col?.label || key };
        });

      // استدعاء دالة الطباعة
      printTable({
        format: 'pdf',
        metadata,
        columns: visibleCols,
        data: dataToExport,
      });
    } catch (error) {
      console.error('Print error:', error);
      toast.error('حدث خطأ أثناء الطباعة');
    }
  };

  const bulkUpdateMutation = trpc.campRegistrations.bulkUpdateStatus.useMutation({
    onSuccess: () => {
      toast.success(`تم تحديث حالة ${selectedIds.length} تسجيل بنجاح`);
      refetch();
      setSelectedIds([]);
      setBulkUpdateDialogOpen(false);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الحالات");
    },
  });

  const utils = trpc.useUtils();
  
  const updateStatusMutation = trpc.campRegistrations.updateStatus.useMutation({
    onMutate: async (variables) => {
      await utils.campRegistrations.listPaginated.cancel();
      const previousData = utils.campRegistrations.listPaginated.getData();
      
      utils.campRegistrations.listPaginated.setData(
        {
          page: 1,
          limit: 10000,
          searchTerm: debouncedSearch,
          dateFrom: dateRange.from.toISOString(),
          dateTo: dateRange.to.toISOString(),
        },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((reg: any) =>
              reg.id === variables.id
                ? { ...reg, status: variables.status }
                : reg
            ),
          };
        }
      );
      
      return { previousData };
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة التسجيل بنجاح");
      setStatusDialogOpen(false);
      setSelectedRegistration(null);
      setNewStatus("");
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        utils.campRegistrations.listPaginated.setData(
          {
            page: 1,
            limit: 10000,
            searchTerm: debouncedSearch,
            dateFrom: dateRange.from.toISOString(),
            dateTo: dateRange.to.toISOString(),
          },
          context.previousData
        );
      }
      toast.error("حدث خطأ أثناء تحديث الحالة");
    },
    onSettled: () => {
      utils.campRegistrations.listPaginated.invalidate();
    },
  });

  // Get all camps for filter from database
  const { data: allCamps } = trpc.camps.getAll.useQuery();

  // Apply filtering and sorting to camp registrations
  const filteredRegistrations = useMemo(() => {
    if (!registrations) return [];
    
    let filtered = [...registrations];
    
    // Filter by camp (multiple selection)
    if (selectedCamp && selectedCamp.length > 0) {
      filtered = filtered.filter((registration: any) => selectedCamp.includes(registration.campId?.toString()));
    }
    
    // Filter by source (multiple selection)
    if (sourceFilter && sourceFilter.length > 0) {
      filtered = filtered.filter((registration: any) => sourceFilter.includes(registration.source));
    }
    
    // Filter by status (multiple selection)
    if (statusFilter && statusFilter.length > 0) {
      filtered = filtered.filter((registration: any) => statusFilter.includes(registration.status));
    }
    
    let sorted = filtered;
    
    if (sortField) {
      sorted.sort((a: any, b: any) => {
        let aValue, bValue;
        
        switch (sortField) {
          case 'date':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'name':
            aValue = a.fullName.toLowerCase();
            bValue = b.fullName.toLowerCase();
            break;
          case 'phone':
            aValue = (a.phone || '').toLowerCase();
            bValue = (b.phone || '').toLowerCase();
            break;
          case 'email':
            aValue = (a.email || '').toLowerCase();
            bValue = (b.email || '').toLowerCase();
            break;
          case 'age':
            aValue = a.age || 0;
            bValue = b.age || 0;
            break;
          case 'camp':
            aValue = (a.campName || '').toLowerCase();
            bValue = (b.campName || '').toLowerCase();
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
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return sorted;
  }, [registrations, selectedCamp, sourceFilter, statusFilter, sortField, sortDirection]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredRegistrations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRegistrations.map((reg: any) => reg.id));
    }
  };

  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleStatusUpdate = () => {
    if (!selectedRegistration || !newStatus) return;
    
    const updateData: any = {
      id: selectedRegistration.id,
      status: newStatus as any,
    };

    // إضافة البيانات المعدلة إذا كانت الحالة مؤكد أو حضر
    if (newStatus === 'confirmed' || newStatus === 'attended') {
      if (editedName) updateData.fullName = editedName;
      if (editedPhone) updateData.phone = editedPhone;
      if (attendanceDate) updateData.attendanceDate = new Date(attendanceDate);
    }
    
    updateStatusMutation.mutate(updateData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التسجيلات</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">تسجيلات المخيمات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيد الانتظار</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">بانتظار التأكيد</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مؤكد</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.confirmed || 0}</div>
            <p className="text-xs text-muted-foreground">تسجيلات مؤكدة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حضر</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.attended || 0}</div>
            <p className="text-xs text-muted-foreground">حضروا المخيم</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>تسجيلات المخيمات</CardTitle>
              <CardDescription>إدارة ومتابعة جميع تسجيلات المخيمات الطبية</CardDescription>
            </div>
            <div className="flex gap-2">
              <ColumnVisibility
                columns={campRegColumns}
                visibleColumns={campRegVisibleColumns}
                onVisibilityChange={handleCampRegColumnVisibilityChange}
                onReset={handleCampRegColumnsReset}
                templates={allCampTemplates}
                activeTemplateId={activeCampTemplateId}
                onApplyTemplate={handleApplyCampTemplate}
                onSaveTemplate={handleSaveCampTemplate}
                onDeleteTemplate={handleDeleteCampTemplate}
                tableKey="campRegistrations"
              />
              <Button
                variant="outline"
                onClick={handlePrintCampRegistrations}
              >
                <Printer className="h-4 w-4 ml-2" />
                طباعة
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="h-4 w-4 ml-2" />
                    تصدير
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExportCampRegistrations('excel')}>
                    تصدير Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportCampRegistrations('csv')}>
                    تصدير CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportCampRegistrations('pdf')}>
                    تصدير PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث بالاسم، الهاتف، أو البريد الإلكتروني..."
                value={campRegistrationsSearchTerm}
                onChange={(e) => setCampRegistrationsSearchTerm(e.target.value)}
                className="pr-10 h-9 md:h-10"
              />
            </div>

            <MultiSelect
              options={(allCamps || []).map((camp: any) => ({ value: camp.id.toString(), label: camp.name }))}
              selected={selectedCamp}
              onChange={setSelectedCamp}
              placeholder="جميع المخيمات"
              className="w-full sm:w-[180px] h-9 md:h-10"
            />
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
            <MultiSelect
              options={[
                { value: 'pending', label: 'قيد الانتظار' },
                { value: 'confirmed', label: 'مؤكد' },
                { value: 'attended', label: 'حضر' },
                { value: 'cancelled', label: 'ملغي' },
              ]}
              selected={statusFilter}
              onChange={setStatusFilter}
              placeholder="كل الحالات"
              className="w-full sm:w-[160px] h-9 md:h-10"
            />
            <MultiSelect
              options={SOURCE_OPTIONS}
              selected={sourceFilter}
              onChange={setSourceFilter}
              placeholder="كل المصادر"
              className="w-full sm:w-[180px] h-9 md:h-10"
            />
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden">
            {isLoading ? (
              <TableSkeleton rows={3} columns={4} />
            ) : filteredRegistrations.length === 0 ? (
              <EmptyState
                icon={TentTree}
                title="لا توجد تسجيلات"
                description="لم يتم العثور على أي تسجيلات للمخيمات في الفترة المحددة. جرب تغيير الفلاتر."
              />
            ) : (
              filteredRegistrations.map((reg: any) => (
                <CampRegistrationCard
                  key={reg.id}
                  registration={{
                    id: reg.id,
                    fullName: reg.fullName,
                    phone: reg.phone,
                    email: reg.email,
                    age: reg.age,
                    status: reg.status,
                    campName: reg.campName,
                    createdAt: reg.createdAt,
                  }}
                  onEdit={() => {
                    setSelectedRegistration(reg);
                    setNewStatus(reg.status);
                    setEditedName(reg.fullName);
                    setEditedPhone(reg.phone);
                    setAttendanceDate(reg.attendanceDate ? new Date(reg.attendanceDate).toISOString().slice(0, 16) : "");
                    setStatusDialogOpen(true);
                  }}
                  onViewDetails={() => {
                    setSelectedRegistration(reg);
                    setDetailsDialogOpen(true);
                  }}
                  onPrint={async () => {
                    try {
                      const result = await generateReceiptNumberMutation.mutateAsync({ id: reg.id });
                      printReceipt({
                        fullName: reg.fullName,
                        phone: reg.phone,
                        age: reg.age,
                        registrationDate: reg.createdAt ? new Date(reg.createdAt) : new Date(),
                        type: "camp",
                        typeName: reg.campName || 'غير محدد',
                        receiptNumber: result.receiptNumber,
                      }, user?.name || 'غير معروف');
                    } catch (error) {
                      console.error('Error generating receipt number:', error);
                      toast.error('فشل في توليد رقم السند');
                    }
                  }}
                />
              ))
            )}
          </div>

          {/* Bulk Update Button */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIds.length === filteredRegistrations.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">
                  تم تحديد {selectedIds.length} من {filteredRegistrations.length}
                </span>
              </div>
              <Button
                onClick={() => setBulkUpdateDialogOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                تحديث الحالة المحددة ({selectedIds.length})
              </Button>
            </div>
          )}

          {/* Desktop Table View */}
          <div className="hidden md:block border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  {campRegVisibleColumns['checkbox'] && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length === filteredRegistrations.length && filteredRegistrations.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                  )}
                  {campRegVisibleColumns['receiptNumber'] && (
                    <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => {
                      if (sortField === 'receiptNumber') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('receiptNumber');
                        setSortDirection('asc');
                      }
                    }}
                  >
                      <div className="flex items-center gap-1 justify-end">
                        رقم السند
                        {sortField === 'receiptNumber' && (
                          <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                  )}
                  {campRegVisibleColumns['name'] && (
                    <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => {
                      if (sortField === 'name') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('name');
                        setSortDirection('asc');
                      }
                    }}
                  >
                      <div className="flex items-center gap-1 justify-end">
                        الاسم الكامل
                        {sortField === 'name' && (
                          <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                  )}
                  {campRegVisibleColumns['phone'] && (
                    <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => {
                      if (sortField === 'phone') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('phone');
                        setSortDirection('asc');
                      }
                    }}
                  >
                      <div className="flex items-center gap-1 justify-end">
                        رقم الهاتف
                        {sortField === 'phone' && (
                          <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                  )}
                  {campRegVisibleColumns['email'] && (
                    <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => {
                      if (sortField === 'email') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('email');
                        setSortDirection('asc');
                      }
                    }}
                  >
                      <div className="flex items-center gap-1 justify-end">
                        البريد الإلكتروني
                        {sortField === 'email' && (
                          <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                  )}
                  {campRegVisibleColumns['age'] && (
                    <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => {
                      if (sortField === 'age') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('age');
                        setSortDirection('asc');
                      }
                    }}
                  >
                      <div className="flex items-center gap-1 justify-end">
                        العمر
                        {sortField === 'age' && (
                          <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                  )}
                  {campRegVisibleColumns['camp'] && (
                    <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => {
                      if (sortField === 'camp') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('camp');
                        setSortDirection('asc');
                      }
                    }}
                  >
                      <div className="flex items-center gap-1 justify-end">
                        المخيم
                        {sortField === 'camp' && (
                          <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                  )}
                  {campRegVisibleColumns['source'] && (
                    <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => {
                      if (sortField === 'source') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('source');
                        setSortDirection('asc');
                      }
                    }}
                  >
                      <div className="flex items-center gap-1 justify-end">
                        المصدر
                        {sortField === 'source' && (
                          <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                  )}
                  {campRegVisibleColumns['status'] && (
                    <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => {
                      if (sortField === 'status') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('status');
                        setSortDirection('asc');
                      }
                    }}
                  >
                      <div className="flex items-center gap-1 justify-end">
                        الحالة
                        {sortField === 'status' && (
                          <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                  )}
                  {campRegVisibleColumns['date'] && (
                    <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => {
                      if (sortField === 'date') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('date');
                        setSortDirection('desc'); // Default to newest first
                      }
                    }}
                  >
                      <div className="flex items-center gap-1 justify-end">
                        تاريخ التسجيل
                        {sortField === 'date' && (
                          <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                  )}
                  {campRegVisibleColumns['comments'] && (
                    <TableHead className="text-right">التعليقات</TableHead>
                  )}
                  {campRegVisibleColumns['tasks'] && (
                    <TableHead className="text-right">المهام</TableHead>
                  )}
                  {campRegVisibleColumns['actions'] && (
                    <TableHead className="text-right">الإجراءات</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="p-0">
                      <TableSkeleton rows={5} columns={11} />
                    </TableCell>
                  </TableRow>
                ) : filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="py-12">
                      <EmptyState
                        icon={TentTree}
                        title="لا توجد تسجيلات"
                        description="لم يتم العثور على أي تسجيلات للمخيمات في الفترة المحددة. جرب تغيير الفلاتر."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((reg: any) => (
                    <TableRow key={reg.id} className={reg.status === 'pending' ? 'bg-red-50 hover:bg-red-100' : ''}>
                      {campRegVisibleColumns['checkbox'] && (
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(reg.id)}
                            onCheckedChange={() => handleSelectOne(reg.id)}
                          />
                        </TableCell>
                      )}
                      {campRegVisibleColumns['receiptNumber'] && (
                        <TableCell className="text-sm text-muted-foreground font-mono">
                          {reg.receiptNumber || "-"}
                        </TableCell>
                      )}
                      {campRegVisibleColumns['name'] && (
                        <TableCell className="font-medium">{reg.fullName}</TableCell>
                      )}
                      {campRegVisibleColumns['phone'] && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{reg.phone}</span>
                            <ActionButtons
                              phoneNumber={reg.phone}
                              showWhatsApp={true}
                              whatsAppMessage={`مرحباً ${reg.fullName}، شكراً لتسجيلك في مخيمنا الطبي. نتطلع لرؤيتك.`}
                              size="sm"
                              variant="ghost"
                            />
                          </div>
                        </TableCell>
                      )}
                      {campRegVisibleColumns['email'] && (
                        <TableCell>
                          {reg.email ? (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <a href={`mailto:${reg.email}`} className="hover:text-primary text-sm">
                                {reg.email}
                              </a>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      )}
                      {campRegVisibleColumns['age'] && (
                        <TableCell>
                          {reg.age ? (
                            <span className="text-sm">{reg.age} سنة</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      )}
                      {campRegVisibleColumns['camp'] && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Tent className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{reg.campName || "غير محدد"}</span>
                          </div>
                        </TableCell>
                      )}
                      {campRegVisibleColumns['source'] && (
                        <TableCell>
                          {reg.source ? (
                            <Badge 
                              variant="outline" 
                              className="text-xs font-medium"
                              style={{
                                backgroundColor: SOURCE_COLORS[reg.source] ? `${SOURCE_COLORS[reg.source]}15` : undefined,
                                borderColor: SOURCE_COLORS[reg.source] || undefined,
                                color: SOURCE_COLORS[reg.source] || undefined,
                              }}
                            >
                              {SOURCE_LABELS[reg.source] || reg.source}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">غير محدد</Badge>
                          )}
                        </TableCell>
                      )}
                      {campRegVisibleColumns['status'] && (
                        <TableCell>
                          <InlineStatusEditor
                            currentStatus={reg.status}
                            statusOptions={[
                              { value: 'pending', label: 'قيد الانتظار', color: 'bg-yellow-500' },
                              { value: 'confirmed', label: 'مؤكد', color: 'bg-green-500' },
                              { value: 'attended', label: 'حضر', color: 'bg-blue-500' },
                              { value: 'cancelled', label: 'ملغي', color: 'bg-red-500' },
                            ]}
                            onSave={async (newStatus) => {
                              await updateStatusMutation.mutateAsync({
                                id: reg.id,
                                status: newStatus as any,
                                notes: '',
                              });
                            }}
                          />
                        </TableCell>
                      )}
                      {campRegVisibleColumns['date'] && (
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(reg.createdAt).toLocaleDateString("ar-SA")}
                        </TableCell>
                      )}
                      {campRegVisibleColumns['comments'] && (
                        <TableCell>
                          <CommentCount
                            entityType="campRegistration"
                            entityId={reg.id}
                          />
                        </TableCell>
                      )}
                      {campRegVisibleColumns['tasks'] && (
                        <TableCell>
                          <TaskCount
                            entityType="campRegistration"
                            entityId={reg.id}
                          />
                        </TableCell>
                      )}
                      {campRegVisibleColumns['actions'] && (
                        <TableCell>
                        <div className="flex gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRegistration(reg);
                                  setNewStatus(reg.status);
                                  setEditedName(reg.fullName);
                                  setEditedPhone(reg.phone);
                                  setAttendanceDate(reg.attendanceDate ? new Date(reg.attendanceDate).toISOString().slice(0, 16) : "");
                                  setStatusDialogOpen(true);
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
                                onClick={async () => {
                                  try {
                                    const result = await generateReceiptNumberMutation.mutateAsync({ id: reg.id });
                                    const campName = reg.campName || `مخيم #${reg.campId}`;
                                    printReceipt({
                                      fullName: reg.fullName,
                                      phone: reg.phone,
                                      age: reg.age ?? undefined,
                                      registrationDate: new Date(reg.createdAt),
                                      type: "camp",
                                      typeName: campName,
                                      receiptNumber: result.receiptNumber,
                                    }, user?.name || "مستخدم");
                                  } catch (error) {
                                    console.error('Error generating receipt number:', error);
                                    toast.error('فشل في توليد رقم السند');
                                  }
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

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
          <DialogHeader>
            <DialogTitle>تحديث حالة التسجيل</DialogTitle>
            <DialogDescription>
              قم بتحديث حالة تسجيل المخيم لـ {selectedRegistration?.fullName}
            </DialogDescription>
          </DialogHeader>
          {selectedRegistration && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">معلومات التسجيل</TabsTrigger>
                  <TabsTrigger value="comments">التعليقات</TabsTrigger>
                  <TabsTrigger value="tasks">المهام</TabsTrigger>
                </TabsList>
                
                <div className="flex-1 overflow-y-auto mt-4">
                  <TabsContent value="info" className="space-y-4 mt-0">
                    <div className="space-y-2">
                      <Label>معلومات المسجل</Label>
                      <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedRegistration.phone}</span>
                        </div>
                        {selectedRegistration.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedRegistration.email}</span>
                          </div>
                        )}
                        {selectedRegistration.age && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>العمر: {selectedRegistration.age} سنة</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Tent className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedRegistration.campTitle || "غير محدد"}</span>
                        </div>
                        {selectedRegistration.medicalCondition && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-1">الحالة الطبية:</p>
                            <p>{selectedRegistration.medicalCondition}</p>
                          </div>
                        )}
                        {selectedRegistration.notes && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-1">ملاحظات:</p>
                            <p>{selectedRegistration.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>الحالة الجديدة</Label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">قيد الانتظار</SelectItem>
                          <SelectItem value="confirmed">مؤكد</SelectItem>
                          <SelectItem value="attended">حضر</SelectItem>
                          <SelectItem value="cancelled">ملغي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(newStatus === 'confirmed' || newStatus === 'attended') && (
                      <>
                        <div className="space-y-2">
                          <Label>الاسم الكامل</Label>
                          <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            placeholder="الاسم الكامل"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>رقم الهاتف</Label>
                          <Input
                            value={editedPhone}
                            onChange={(e) => setEditedPhone(e.target.value)}
                            placeholder="رقم الهاتف"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>موعد الحضور</Label>
                          <Input
                            type="datetime-local"
                            value={attendanceDate}
                            onChange={(e) => setAttendanceDate(e.target.value)}
                          />
                        </div>
                      </>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="comments" className="mt-0">
                    <CommentsSection
                      entityType="campRegistration"
                      entityId={selectedRegistration.id}
                    />
                  </TabsContent>
                  
                  <TabsContent value="tasks" className="mt-0">
                    <TasksSection
                      entityType="campRegistration"
                      entityId={selectedRegistration.id}
                    />
                  </TabsContent>
                </div>
              </Tabs>

              <div className="flex gap-2 justify-end mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusDialogOpen(false);
                    setSelectedRegistration(null);
                    setNewStatus("");
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
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري التحديث...
                    </>
                  ) : (
                    "تحديث الحالة"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل التسجيل</DialogTitle>
          </DialogHeader>
          {selectedRegistration && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">الاسم الكامل</p>
                  <p className="text-base font-semibold">{selectedRegistration.fullName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">رقم الهاتف</p>
                  <p className="text-base font-semibold" dir="ltr">{selectedRegistration.phone}</p>
                </div>
                {selectedRegistration.email && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</p>
                    <p className="text-base">{selectedRegistration.email}</p>
                  </div>
                )}
                {selectedRegistration.age && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">العمر</p>
                    <p className="text-base">{selectedRegistration.age} سنة</p>
                  </div>
                )}
                {selectedRegistration.gender && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">الجنس</p>
                    <p className="text-base">{selectedRegistration.gender === 'male' ? 'ذكر' : 'أنثى'}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">المخيم</p>
                  <p className="text-base font-semibold">{selectedRegistration.campName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">الحالة</p>
                  <Badge className={`${statusColors[selectedRegistration.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                    {statusLabels[selectedRegistration.status as keyof typeof statusLabels] || selectedRegistration.status}
                  </Badge>
                </div>
                {selectedRegistration.source && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">المصدر</p>
                    <Badge 
                      variant="outline" 
                      className="text-xs font-medium mt-1"
                      style={{
                        backgroundColor: SOURCE_COLORS[selectedRegistration.source] ? `${SOURCE_COLORS[selectedRegistration.source]}15` : undefined,
                        borderColor: SOURCE_COLORS[selectedRegistration.source] || undefined,
                        color: SOURCE_COLORS[selectedRegistration.source] || undefined,
                      }}
                    >
                      {SOURCE_LABELS[selectedRegistration.source] || selectedRegistration.source}
                    </Badge>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">تاريخ التسجيل</p>
                  <p className="text-base">
                    {new Date(selectedRegistration.createdAt).toLocaleDateString('ar-YE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              {selectedRegistration.procedures && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">الإجراءات المختارة</p>
                  <div className="flex flex-wrap gap-2">
                    {(typeof selectedRegistration.procedures === 'string' && selectedRegistration.procedures.trim() !== ''
                      ? (() => {
                          try {
                            return JSON.parse(selectedRegistration.procedures);
                          } catch (e) {
                            return [];
                          }
                        })()
                      : Array.isArray(selectedRegistration.procedures) ? selectedRegistration.procedures : []
                    ).map((proc: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-sm">
                        {proc}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedRegistration.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">ملاحظات</p>
                  <p className="text-base bg-muted p-3 rounded-md">{selectedRegistration.notes}</p>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDetailsDialogOpen(false)}
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Dialog */}
      <BulkUpdateDialog
        open={bulkUpdateDialogOpen}
        onOpenChange={setBulkUpdateDialogOpen}
        selectedCount={selectedIds.length}
        statusOptions={[
          { value: "pending", label: "قيد الانتظار" },
          { value: "confirmed", label: "مؤكد" },
          { value: "attended", label: "حضر" },
          { value: "cancelled", label: "ملغي" },
        ]}
        onConfirm={(newStatus) => {
          bulkUpdateMutation.mutate({ ids: selectedIds, status: newStatus as "pending" | "confirmed" | "attended" | "cancelled" });
        }}
        isLoading={bulkUpdateMutation.isPending}
      />
    </div>
  );
}
