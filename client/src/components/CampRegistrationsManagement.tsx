import { useState, useMemo, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useFilterUtils } from "@/hooks/useFilterUtils";
import { Button } from "@/components/ui/button";
import ActionButtons from "@/components/ActionButtons";
import EmptyState from "@/components/EmptyState";
import MultiSelect from "@/components/MultiSelect";
import { ColumnVisibility, getColumnWidth, type ColumnConfig } from "@/components/ColumnVisibility";
import { ResizableTable, ResizableHeaderCell, FrozenTableCell } from "@/components/ResizableTable";
import { useTableFeatures } from "@/hooks/useTableFeatures";
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
import { useExportUtils } from "@/hooks/useExportUtils";
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
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [editedName, setEditedName] = useState("");
  const [editedPhone, setEditedPhone] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  
  // === Unified filter state via useFilterUtils ===
  const campFilter = useFilterUtils<any>();
  
  // Aliases for backward compatibility
  const searchTerm = campFilter.filters.searchTerm;
  const setSearchTerm = campFilter.filters.setSearchTerm;
  const selectedCamp = campFilter.filters.categoryFilter;
  const setSelectedCamp = campFilter.filters.setCategoryFilter;
  const statusFilter = campFilter.filters.statusFilter;
  const setStatusFilter = campFilter.filters.setStatusFilter;
  const sourceFilter = campFilter.filters.sourceFilter;
  const setSourceFilter = campFilter.filters.setSourceFilter;
  const dateFilter = campFilter.filters.dateFilter;
  const setDateFilter = campFilter.filters.setDateFilter;
  const campRegistrationsSearchTerm = campFilter.filters.searchTerm;
  const setCampRegistrationsSearchTerm = campFilter.filters.setSearchTerm;
  
  // Sorting state
  // Sort state is now managed by campTable.sortState via useTableFeatures

  // Column visibility state for CampRegistrations - جميع الأعمدة من قاعدة البيانات
  const campRegColumns: ColumnConfig[] = [
    { key: 'checkbox', label: 'تحديد', defaultVisible: true, sortable: false },
    { key: 'receiptNumber', label: 'رقم السند', defaultVisible: true, sortType: 'string' },
    { key: 'name', label: 'الاسم الكامل', defaultVisible: true, sortType: 'string' },
    { key: 'phone', label: 'رقم الهاتف', defaultVisible: true, sortType: 'string' },
    { key: 'email', label: 'البريد الإلكتروني', defaultVisible: true, sortType: 'string' },
    { key: 'age', label: 'العمر', defaultVisible: true, sortType: 'number' },
    { key: 'gender', label: 'الجنس', defaultVisible: false, sortType: 'string' },
    { key: 'camp', label: 'المخيم', defaultVisible: true, sortType: 'string' },
    { key: 'procedures', label: 'الإجراءات المختارة', defaultVisible: false, sortable: false },
    { key: 'medicalCondition', label: 'الحالة الصحية', defaultVisible: false, sortable: false },
    { key: 'notes', label: 'ملاحظات المسجل', defaultVisible: false, sortable: false },
    { key: 'status', label: 'الحالة', defaultVisible: true, sortType: 'string' },
    { key: 'statusNotes', label: 'ملاحظات الحالة', defaultVisible: false, sortable: false },
    { key: 'attendanceDate', label: 'تاريخ الحضور', defaultVisible: false, sortType: 'date' },
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
    { key: 'date', label: 'تاريخ التسجيل', defaultVisible: true, sortType: 'date' },
    { key: 'comments', label: 'التعليقات', defaultVisible: true, sortable: false },
    { key: 'tasks', label: 'المهام', defaultVisible: true, sortable: false },
    { key: 'actions', label: 'الإجراءات', defaultVisible: true, sortable: false },
  ];

  // === استخدام useTableFeatures الموحد لإدارة جميع ميزات الجدول ===
  const campTable = useTableFeatures({
    tableKey: 'campRegistrations',
    columns: campRegColumns,
  });
  
  // Debounced search - now managed by useFilterUtils
  const debouncedSearch = campFilter.filters.debouncedSearch;

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
    
    // Apply sorting using useTableFeatures
    const sorted = campTable.sortData(filtered, (item: any, key: string) => {
      switch (key) {
        case 'date': return item.createdAt;
        case 'name': return item.fullName;
        case 'phone': return item.phone;
        case 'email': return item.email;
        case 'age': return item.age;
        case 'gender': return item.gender;
        case 'camp': return item.campName;
        case 'source': return item.source;
        case 'receiptNumber': return item.receiptNumber;
        case 'status': return item.status;
        case 'attendanceDate': return item.attendanceDate;
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
    if (!campTable.sortState.direction) {
      sorted.sort((a: any, b: any) => {
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        return bDate - aDate;
      });
    }
    
    return sorted;
  }, [registrations, selectedCamp, sourceFilter, statusFilter, campTable.sortState, campTable.sortData]);

  // useExportUtils hook لتسجيلات المخيمات
  const campExport = useExportUtils({
    tableName: 'تسجيلات المخيمات',
    filenamePrefix: 'تسجيلات_المخيمات',
    exportColumns: [
      { key: 'receiptNumber', label: 'رقم السند' },
      { key: 'name', label: 'الاسم الكامل' },
      { key: 'phone', label: 'رقم الهاتف' },
      { key: 'email', label: 'البريد الإلكتروني' },
      { key: 'age', label: 'العمر' },
      { key: 'camp', label: 'المخيم' },
      { key: 'source', label: 'المصدر' },
      { key: 'status', label: 'الحالة' },
      { key: 'date', label: 'تاريخ التسجيل' },
    ],
    printColumns: [
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
    ],
    mapToExportRow: (reg: any) => ({
      receiptNumber: reg.receiptNumber || '-',
      name: reg.fullName,
      phone: reg.phone,
      email: reg.email || '-',
      age: reg.age || '-',
      camp: reg.campTitle || '-',
      source: SOURCE_LABELS[reg.source] || reg.source || '-',
      status: statusLabels[reg.status as keyof typeof statusLabels] || reg.status,
      date: new Date(reg.createdAt).toLocaleDateString('ar-SA'),
    }),
    mapToPrintRow: (reg: any) => ({
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
    }),
  });

  const getCampExportOptions = useCallback(() => {
    const activeFilters = campExport.buildActiveFilters([
      { label: 'البحث', value: debouncedSearch || undefined },
      { label: 'الحالة', value: statusFilter.length > 0 ? statusFilter.map(s => statusLabels[s as keyof typeof statusLabels]).join(', ') : undefined },
      { label: 'المصدر', value: sourceFilter.length > 0 ? sourceFilter.map(s => SOURCE_LABELS[s] || s).join(', ') : undefined },
      { label: 'المخيم', value: selectedCamp.length > 0 ? selectedCamp.join(', ') : undefined },
    ]);
    return {
      data: filteredRegistrations,
      activeFilters,
      dateRangeStr: campExport.formatDateRange(dateRange.from, dateRange.to),
      visibleColumns: campTable.visibleColumns,
    };
  }, [filteredRegistrations, debouncedSearch, statusFilter, sourceFilter, selectedCamp, dateRange, campTable.visibleColumns, campExport]);

  const handleExportCampRegistrations = useCallback(async (format: 'excel' | 'csv' | 'pdf') => {
    await campExport.handleExport(format, getCampExportOptions());
  }, [campExport, getCampExportOptions]);

  const handlePrintCampRegistrations = useCallback(() => {
    campExport.handlePrint(getCampExportOptions());
  }, [campExport, getCampExportOptions]);

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
                 visibleColumns={campTable.visibleColumns}
                 columnOrder={campTable.columnOrder}
                 onVisibilityChange={campTable.handleColumnVisibilityChange}
                 onColumnOrderChange={campTable.handleColumnOrderChange}
                 onReset={campTable.handleResetAll}
                 templates={campTable.allTemplates}
                 activeTemplateId={campTable.activeTemplateId}
                 onApplyTemplate={campTable.handleApplyTemplate}
                 onSaveTemplate={campTable.handleSaveTemplate}
                 onDeleteTemplate={campTable.handleDeleteTemplate}
                 tableKey="campRegistrations"
                  columnWidths={campTable.columnWidths.columnWidths}
                  frozenColumns={campTable.frozenColumns.frozenColumns}
                  onToggleFrozen={campTable.frozenColumns.toggleFrozen}
                  isAdmin={user?.role === 'admin'}
                  sharedTemplates={campTable.sharedTemplates}
                  onSaveSharedTemplate={campTable.handleSaveSharedTemplate}
                  onDeleteSharedTemplate={campTable.handleDeleteSharedTemplate}
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
             <ResizableTable
               frozenColumns={campTable.frozenColumns.frozenColumns}
               columnWidths={campTable.columnWidths.columnWidths}
               visibleColumnOrder={campTable.columnOrder.filter(key => campTable.visibleColumns[key])}
             >
              <TableHeader>
                <TableRow>
                  {campTable.columnOrder.filter(key => campTable.visibleColumns[key]).map(colKey => {
                    const col = campRegColumns.find(c => c.key === colKey);
                    if (!col) return null;
                    if (colKey === 'checkbox') {
                      return (
                        <ResizableHeaderCell key={colKey} columnKey={colKey} width={40} minWidth={40} maxWidth={40} onResize={() => {}}>
                          <Checkbox
                            checked={selectedIds.length === filteredRegistrations.length && filteredRegistrations.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </ResizableHeaderCell>
                      );
                    }
                    const widthConfig = getColumnWidth(colKey, col);
                    return (
                      <ResizableHeaderCell
                        key={colKey}
                        columnKey={colKey}
                        width={campTable.columnWidths.getWidth(colKey)}
                        minWidth={widthConfig.min}
                        maxWidth={widthConfig.max}
                        onResize={campTable.columnWidths.handleResize}
                        {...campTable.getSortProps(colKey)}
                      >
                        {col.label}
                      </ResizableHeaderCell>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={campTable.columnOrder.filter(k => campTable.visibleColumns[k]).length || 1} className="p-0">
                      <TableSkeleton rows={5} columns={campTable.columnOrder.filter(k => campTable.visibleColumns[k]).length || 11} />
                    </TableCell>
                  </TableRow>
                ) : filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={campTable.columnOrder.filter(k => campTable.visibleColumns[k]).length || 1} className="py-12">
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
                      {campTable.columnOrder.filter(key => campTable.visibleColumns[key]).map(colKey => {
                        switch(colKey) {
                          case 'checkbox':
                            return (
                              <FrozenTableCell key={colKey} columnKey={colKey}>
                                <Checkbox checked={selectedIds.includes(reg.id)} onCheckedChange={() => handleSelectOne(reg.id)} />
                              </FrozenTableCell>
                            );
                          case 'receiptNumber':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-sm text-muted-foreground font-mono">{reg.receiptNumber || "-"}</FrozenTableCell>;
                          case 'name':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="font-medium">{reg.fullName}</FrozenTableCell>;
                          case 'phone':
                            return (
                              <FrozenTableCell key={colKey} columnKey={colKey}>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono">{reg.phone}</span>
                                  <ActionButtons phoneNumber={reg.phone} showWhatsApp={true}
                                    whatsAppMessage={`مرحباً ${reg.fullName}، شكراً لتسجيلك في مخيمنا الطبي. نتطلع لرؤيتك.`}
                                    size="sm" variant="ghost" />
                                </div>
                              </FrozenTableCell>
                            );
                          case 'email':
                            return (
                              <FrozenTableCell key={colKey} columnKey={colKey}>
                                {reg.email ? (
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <a href={`mailto:${reg.email}`} className="hover:text-primary text-sm">{reg.email}</a>
                                  </div>
                                ) : (<span className="text-muted-foreground">-</span>)}
                              </FrozenTableCell>
                            );
                          case 'age':
                            return <FrozenTableCell key={colKey} columnKey={colKey}>{reg.age ? <span className="text-sm">{reg.age} سنة</span> : <span className="text-muted-foreground">-</span>}</FrozenTableCell>;
                          case 'gender':
                            return <FrozenTableCell key={colKey} columnKey={colKey}>{reg.gender === 'male' ? 'ذكر' : reg.gender === 'female' ? 'أنثى' : '-'}</FrozenTableCell>;
                          case 'camp':
                            return (
                              <FrozenTableCell key={colKey} columnKey={colKey}>
                                <div className="flex items-center gap-2">
                                  <Tent className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{reg.campName || "غير محدد"}</span>
                                </div>
                              </FrozenTableCell>
                            );
                          case 'source':
                            return (
                              <FrozenTableCell key={colKey} columnKey={colKey}>
                                {reg.source ? (
                                  <Badge variant="outline" className="text-xs font-medium" style={{
                                    backgroundColor: SOURCE_COLORS[reg.source] ? `${SOURCE_COLORS[reg.source]}15` : undefined,
                                    borderColor: SOURCE_COLORS[reg.source] || undefined,
                                    color: SOURCE_COLORS[reg.source] || undefined,
                                  }}>
                                    {SOURCE_LABELS[reg.source] || reg.source}
                                  </Badge>
                                ) : (<Badge variant="outline" className="text-xs">غير محدد</Badge>)}
                              </FrozenTableCell>
                            );
                          case 'status':
                            return (
                              <FrozenTableCell key={colKey} columnKey={colKey}>
                                <InlineStatusEditor
                                  currentStatus={reg.status}
                                  statusOptions={[
                                    { value: 'pending', label: 'قيد الانتظار', color: 'bg-yellow-500' },
                                    { value: 'confirmed', label: 'مؤكد', color: 'bg-green-500' },
                                    { value: 'attended', label: 'حضر', color: 'bg-blue-500' },
                                    { value: 'cancelled', label: 'ملغي', color: 'bg-red-500' },
                                  ]}
                                  onSave={async (newStatus) => {
                                    await updateStatusMutation.mutateAsync({ id: reg.id, status: newStatus as any, notes: '' });
                                  }}
                                />
                              </FrozenTableCell>
                            );
                          case 'statusNotes':
                            return <FrozenTableCell key={colKey} columnKey={colKey} wrap title={reg.statusNotes}>{reg.statusNotes || '-'}</FrozenTableCell>;
                          case 'procedures':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-sm">{reg.procedures || '-'}</FrozenTableCell>;
                          case 'medicalCondition':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-sm">{reg.medicalCondition || '-'}</FrozenTableCell>;
                          case 'attendanceDate':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-sm">{reg.attendanceDate ? new Date(reg.attendanceDate).toLocaleDateString('ar-SA') : '-'}</FrozenTableCell>;
                          case 'date':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-sm text-muted-foreground">{new Date(reg.createdAt).toLocaleDateString("ar-SA")}</FrozenTableCell>;
                          case 'utmSource':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{reg.utmSource || '-'}</FrozenTableCell>;
                          case 'utmMedium':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{reg.utmMedium || '-'}</FrozenTableCell>;
                          case 'utmCampaign':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{reg.utmCampaign || '-'}</FrozenTableCell>;
                          case 'utmTerm':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{reg.utmTerm || '-'}</FrozenTableCell>;
                          case 'utmContent':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{reg.utmContent || '-'}</FrozenTableCell>;
                          case 'utmPlacement':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{reg.utmPlacement || '-'}</FrozenTableCell>;
                          case 'referrer':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{reg.referrer || '-'}</FrozenTableCell>;
                          case 'fbclid':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs font-mono">{reg.fbclid || '-'}</FrozenTableCell>;
                          case 'gclid':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs font-mono">{reg.gclid || '-'}</FrozenTableCell>;
                          case 'comments':
                            return <FrozenTableCell key={colKey} columnKey={colKey}><CommentCount entityType="campRegistration" entityId={reg.id} /></FrozenTableCell>;
                          case 'tasks':
                            return <FrozenTableCell key={colKey} columnKey={colKey}><TaskCount entityType="campRegistration" entityId={reg.id} /></FrozenTableCell>;
                          case 'actions':
                            return (
                              <FrozenTableCell key={colKey} columnKey={colKey}>
                                <div className="flex gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="outline" size="sm" onClick={() => {
                                        setSelectedRegistration(reg); setNewStatus(reg.status); setEditedName(reg.fullName); setEditedPhone(reg.phone);
                                        setAttendanceDate(reg.attendanceDate ? new Date(reg.attendanceDate).toISOString().slice(0, 16) : ""); setStatusDialogOpen(true);
                                      }}>
                                        <Settings className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>تحديث الحالة</p></TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={async () => {
                                          try {
                                            const result = await generateReceiptNumberMutation.mutateAsync({ id: reg.id });
                                            const campName = reg.campName || `مخيم #${reg.campId}`;
                                            printReceipt({
                                              fullName: reg.fullName, phone: reg.phone, age: reg.age ?? undefined,
                                              registrationDate: new Date(reg.createdAt), type: "camp", typeName: campName,
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
                                    <TooltipContent><p>طباعة السند</p></TooltipContent>
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
