import { useState, useMemo, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import AppointmentStatsCards from "@/components/AppointmentStatsCards";
import AppointmentCard from "@/components/AppointmentCard";
import AuditLogSection from "@/components/AuditLogSection";
import SavedFilters from "@/components/SavedFilters";
import ActionButtons from "@/components/ActionButtons";
import EmptyState from "@/components/EmptyState";
import MultiSelect from "@/components/MultiSelect";
import { ColumnVisibility, getColumnWidth, type ColumnConfig } from "@/components/ColumnVisibility";
import { ResizableTable, ResizableHeaderCell, FrozenTableCell } from "@/components/ResizableTable";
import { useTableFeatures } from "@/hooks/useTableFeatures";
import TableSkeleton from "@/components/TableSkeleton";
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, Loader2, Download, Settings, Printer, CalendarOff, CheckSquare, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useExportUtils } from "@/hooks/useExportUtils";
import { useFilterUtils } from "@/hooks/useFilterUtils";
import { printReceipt } from "@/components/PrintReceipt";
import { useAuth } from "@/_core/hooks/useAuth";
import { SOURCE_OPTIONS, SOURCE_LABELS, SOURCE_COLORS } from "@shared/sources";
import BulkUpdateDialog from "@/components/BulkUpdateDialog";
import Pagination, { type PageSizeValue } from "@/components/Pagination";

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  cancelled: "ملغي",
  completed: "مكتمل",
};

export default function AppointmentsManagementPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [appointmentStatusDialogOpen, setAppointmentStatusDialogOpen] = useState(false);
  const [newAppointmentStatus, setNewAppointmentStatus] = useState("");
  const [appointmentStatusNotes, setAppointmentStatusNotes] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [selectedAppointmentIds, setSelectedAppointmentIds] = useState<number[]>([]);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);

  // Pagination state
  const [appointmentPage, setAppointmentPage] = useState(1);
  const [appointmentPageSize, setAppointmentPageSize] = useState<PageSizeValue>("100");

  // Filter state
  const appointmentFilter = useFilterUtils<any>();
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
  const debouncedAppointmentSearch = appointmentFilter.filters.debouncedSearch;

  // Column visibility state
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

  const appointmentTable = useTableFeatures({
    tableKey: 'appointments',
    columns: appointmentColumns,
  });

  // Reset page when filters change
  useEffect(() => {
    setAppointmentPage(1);
  }, [debouncedAppointmentSearch, dateRange.from, dateRange.to, appointmentStatusFilter, appointmentSourceFilter, selectedDoctor, dateFilter]);

  const appointmentLimit = appointmentPageSize === "all" ? 100000 : parseInt(appointmentPageSize);
  const { data: appointmentsData, isLoading: appointmentsLoading } = trpc.appointments.listPaginated.useQuery({
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

  const updateAppointmentStatusMutation = trpc.appointments.updateStatus.useMutation({
    onMutate: async (variables) => {
      await utils.appointments.listPaginated.cancel();
      const previousData = utils.appointments.listPaginated.getData();
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
              apt.id === variables.id ? { ...apt, status: variables.status } : apt
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

  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];
    let filtered = [...appointments];
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
        default: return item[key];
      }
    });
    if (!appointmentTable.sortState.direction) {
      sorted.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

  const handleAppointmentStatusUpdate = () => {
    if (!selectedAppointment || !newAppointmentStatus) return;
    updateAppointmentStatusMutation.mutate({
      id: selectedAppointment.id,
      status: newAppointmentStatus,
      staffNotes: appointmentStatusNotes,
    });
  };

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
    ],
    mapToExportRow: (appointment: any) => ({
      date: new Date(appointment.appointmentDate).toLocaleDateString('ar-SA'),
      name: appointment.name,
      phone: appointment.phone,
      doctor: appointment.doctorName || '-',
      specialty: appointment.specialty || '-',
      source: SOURCE_LABELS[appointment.source] || appointment.source || '-',
      receiptNumber: appointment.receiptNumber || '-',
      status: statusLabels[appointment.status] || appointment.status,
    }),
    mapToPrintRow: (appointment: any) => ({
      date: new Date(appointment.appointmentDate).toLocaleDateString('ar-SA'),
      name: appointment.name,
      phone: appointment.phone,
      doctor: appointment.doctorName || '-',
      specialty: appointment.specialty || '-',
      source: SOURCE_LABELS[appointment.source] || appointment.source || '-',
      receiptNumber: appointment.receiptNumber || '-',
      status: statusLabels[appointment.status] || appointment.status,
    }),
  });

  const getAppointmentExportOptions = useCallback(() => {
    const activeFilters = appointmentExport.buildActiveFilters([
      { label: 'البحث', value: debouncedAppointmentSearch || undefined },
      { label: 'الحالة', value: appointmentStatusFilter.length > 0 ? appointmentStatusFilter.map(s => statusLabels[s] || s).join(', ') : undefined },
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
      pageTitle="مواعيد الأطباء"
      pageDescription="إدارة ومتابعة مواعيد الأطباء"
    >
      <div className="container mx-auto py-6 space-y-6" dir="rtl">
        <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />

        <AppointmentStatsCards stats={appointmentStats} />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>مواعيد الأطباء</CardTitle>
                <CardDescription>إدارة ومتابعة مواعيد الأطباء</CardDescription>
              </div>
              <div className="flex gap-2">
                {selectedAppointmentIds.length > 0 && (
                  <Button variant="default" onClick={() => setBulkUpdateDialogOpen(true)}>
                    <CheckSquare className="h-4 w-4 ml-2" />
                    تحديث الحالة ({selectedAppointmentIds.length})
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <Button variant="outline" size="sm" onClick={handlePrintAppointments} className="gap-2 h-9">
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">طباعة</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-9">
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">تصدير</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExportAppointments('excel')}>تصدير Excel</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportAppointments('csv')}>تصدير CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportAppointments('pdf')}>تصدير PDF</DropdownMenuItem>
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
                <SavedFilters
                  pageKey="appointments"
                  currentFilters={{
                    statusFilter: appointmentFilter.filters.statusFilter,
                    sourceFilter: appointmentFilter.filters.sourceFilter,
                    categoryFilter: appointmentFilter.filters.categoryFilter,
                    dateFilter: appointmentFilter.filters.dateFilter,
                    searchTerm: appointmentFilter.filters.searchTerm,
                  }}
                  onApplyFilter={(filters) => {
                    if (filters.statusFilter) appointmentFilter.filters.setStatusFilter(filters.statusFilter);
                    else appointmentFilter.filters.setStatusFilter([]);
                    if (filters.sourceFilter) appointmentFilter.filters.setSourceFilter(filters.sourceFilter);
                    else appointmentFilter.filters.setSourceFilter([]);
                    if (filters.categoryFilter) appointmentFilter.filters.setCategoryFilter(filters.categoryFilter);
                    else appointmentFilter.filters.setCategoryFilter([]);
                    if (filters.dateFilter) appointmentFilter.filters.setDateFilter(filters.dateFilter);
                    else appointmentFilter.filters.setDateFilter('all');
                    if (filters.searchTerm) appointmentFilter.filters.setSearchTerm(filters.searchTerm);
                    else appointmentFilter.filters.setSearchTerm('');
                  }}
                />
              </div>
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
                  description="لم يتم العثور على أي مواعيد في الفترة المحددة."
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
                                if (e.target.checked) setSelectedAppointmentIds(filteredAppointments.map((a: any) => a.id));
                                else setSelectedAppointmentIds([]);
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
                          width={appointmentTable.columnWidths.columnWidths[colKey] || widthConfig.width}
                          minWidth={widthConfig.min}
                          maxWidth={widthConfig.max}
                          onResize={appointmentTable.columnWidths.handleResize}
                          sortDirection={appointmentTable.sortState.columnKey === colKey ? appointmentTable.sortState.direction : undefined}
                          onSort={col.sortable !== false ? () => appointmentTable.handleSort(colKey) : undefined}
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
                      <TableCell colSpan={appointmentTable.columnOrder.filter(key => appointmentTable.visibleColumns[key]).length} className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredAppointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={appointmentTable.columnOrder.filter(key => appointmentTable.visibleColumns[key]).length} className="text-center py-8 text-muted-foreground">
                        لا توجد مواعيد
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAppointments.map((appointment: any) => (
                      <TableRow
                        key={`appointment-${appointment.id}`}
                        className={`${appointment.status === 'pending' ? 'bg-yellow-50 hover:bg-yellow-100' : ''} ${selectedAppointmentIds.includes(appointment.id) ? 'bg-blue-50' : ''}`}
                      >
                        {appointmentTable.columnOrder.filter(key => appointmentTable.visibleColumns[key]).map(colKey => {
                          switch (colKey) {
                            case 'checkbox':
                              return (
                                <FrozenTableCell key={colKey} columnKey={colKey}>
                                  <input
                                    type="checkbox"
                                    checked={selectedAppointmentIds.includes(appointment.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) setSelectedAppointmentIds(prev => [...prev, appointment.id]);
                                      else setSelectedAppointmentIds(prev => prev.filter(id => id !== appointment.id));
                                    }}
                                    className="rounded border-gray-300"
                                  />
                                </FrozenTableCell>
                              );
                            case 'receiptNumber':
                              return <FrozenTableCell key={colKey} columnKey={colKey} className="font-mono text-xs">{appointment.receiptNumber || '-'}</FrozenTableCell>;
                            case 'date':
                              return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs whitespace-nowrap">{new Date(appointment.createdAt).toLocaleDateString("ar-EG")}</FrozenTableCell>;
                            case 'name':
                              return <FrozenTableCell key={colKey} columnKey={colKey} className="font-medium">{appointment.fullName || appointment.patientName}</FrozenTableCell>;
                            case 'phone':
                              return (
                                <FrozenTableCell key={colKey} columnKey={colKey}>
                                  <ActionButtons phoneNumber={appointment.phone} size="sm" />
                                </FrozenTableCell>
                              );
                            case 'email':
                              return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{appointment.email || '-'}</FrozenTableCell>;
                            case 'age':
                              return <FrozenTableCell key={colKey} columnKey={colKey}>{appointment.age || '-'}</FrozenTableCell>;
                            case 'doctor':
                              return <FrozenTableCell key={colKey} columnKey={colKey}>{appointment.doctorName || '-'}</FrozenTableCell>;
                            case 'specialty':
                              return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{appointment.doctorSpecialty || '-'}</FrozenTableCell>;
                            case 'procedure':
                              return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{appointment.procedure || '-'}</FrozenTableCell>;
                            case 'preferredDate':
                              return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{appointment.preferredDate ? new Date(appointment.preferredDate).toLocaleDateString("ar-EG") : '-'}</FrozenTableCell>;
                            case 'preferredTime':
                              return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{appointment.preferredTime || '-'}</FrozenTableCell>;
                            case 'appointmentDate':
                              return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString("ar-EG") : '-'}</FrozenTableCell>;
                            case 'notes':
                              return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs max-w-[200px] truncate">{appointment.patientNotes || '-'}</FrozenTableCell>;
                            case 'additionalNotes':
                              return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs max-w-[200px] truncate">{appointment.additionalNotes || '-'}</FrozenTableCell>;
                            case 'staffNotes':
                              return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs max-w-[200px] truncate">{appointment.staffNotes || '-'}</FrozenTableCell>;
                            case 'source':
                              return (
                                <FrozenTableCell key={colKey} columnKey={colKey}>
                                  {appointment.source ? (
                                    <Badge variant="outline" className="text-xs font-medium"
                                      style={{
                                        backgroundColor: SOURCE_COLORS[appointment.source] ? `${SOURCE_COLORS[appointment.source]}15` : undefined,
                                        borderColor: SOURCE_COLORS[appointment.source] || undefined,
                                        color: SOURCE_COLORS[appointment.source] || undefined,
                                      }}
                                    >
                                      {SOURCE_LABELS[appointment.source] || appointment.source}
                                    </Badge>
                                  ) : '-'}
                                </FrozenTableCell>
                              );
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
                            case 'utmSource': return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{appointment.utmSource || '-'}</FrozenTableCell>;
                            case 'utmMedium': return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{appointment.utmMedium || '-'}</FrozenTableCell>;
                            case 'utmCampaign': return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{appointment.utmCampaign || '-'}</FrozenTableCell>;
                            case 'utmTerm': return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{appointment.utmTerm || '-'}</FrozenTableCell>;
                            case 'utmContent': return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{appointment.utmContent || '-'}</FrozenTableCell>;
                            case 'utmPlacement': return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{appointment.utmPlacement || '-'}</FrozenTableCell>;
                            case 'referrer': return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{appointment.referrer || '-'}</FrozenTableCell>;
                            case 'fbclid': return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs font-mono">{appointment.fbclid || '-'}</FrozenTableCell>;
                            case 'gclid': return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs font-mono">{appointment.gclid || '-'}</FrozenTableCell>;
                            case 'comments': return <FrozenTableCell key={colKey} columnKey={colKey}><CommentCount entityType="appointment" entityId={appointment.id} /></FrozenTableCell>;
                            case 'tasks': return <FrozenTableCell key={colKey} columnKey={colKey}><TaskCount entityType="appointment" entityId={appointment.id} /></FrozenTableCell>;
                            case 'actions':
                              return (
                                <FrozenTableCell key={colKey} columnKey={colKey}>
                                  <div className="flex gap-1">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="outline" size="sm" onClick={() => {
                                          setSelectedAppointment(appointment);
                                          setNewAppointmentStatus(appointment.status);
                                          setAppointmentDate(appointment.appointmentDate);
                                          setAppointmentStatusDialogOpen(true);
                                        }}>
                                          <Settings className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent><p>تحديث الحالة</p></TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => {
                                          const doctorName = appointment.doctorName || `طبيب #${appointment.doctorId}`;
                                          printReceipt({
                                            fullName: appointment.fullName || appointment.patientName,
                                            phone: appointment.phone,
                                            age: appointment.age ?? undefined,
                                            registrationDate: new Date(appointment.createdAt || appointment.appointmentDate),
                                            type: "appointment",
                                            typeName: doctorName
                                          }, user?.name || "مستخدم");
                                        }}>
                                          <Printer className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent><p>طباعة السند</p></TooltipContent>
                                    </Tooltip>
                                  </div>
                                </FrozenTableCell>
                              );
                            default: return <FrozenTableCell key={colKey} columnKey={colKey}>-</FrozenTableCell>;
                          }
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </ResizableTable>
            </div>

            <Pagination
              currentPage={appointmentPage}
              totalPages={appointmentsData?.totalPages || 1}
              onPageChange={(page) => { setAppointmentPage(page); setSelectedAppointmentIds([]); }}
              totalItems={appointmentsData?.total || 0}
              itemsPerPage={appointmentLimit}
              pageSize={appointmentPageSize}
              onPageSizeChange={(size) => { setAppointmentPageSize(size); setAppointmentPage(1); setSelectedAppointmentIds([]); }}
            />
          </CardContent>
        </Card>

        {/* Update Appointment Status Dialog */}
        <Dialog open={appointmentStatusDialogOpen} onOpenChange={setAppointmentStatusDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>تحديث حالة الموعد</DialogTitle>
              <DialogDescription>قم بتحديث حالة الموعد وإضافة ملاحظات إذا لزم الأمر</DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="info">معلومات الموعد</TabsTrigger>
                    <TabsTrigger value="comments">التعليقات</TabsTrigger>
                    <TabsTrigger value="tasks">المهام</TabsTrigger>
                    <TabsTrigger value="history">سجل التغييرات</TabsTrigger>
                  </TabsList>
                  <div className="flex-1 overflow-y-auto mt-4">
                    <TabsContent value="info" className="space-y-4 mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-sm"><span className="font-medium">المريض:</span> {selectedAppointment.patientName}</p>
                          <p className="text-sm"><span className="font-medium">الهاتف:</span> {selectedAppointment.phone}</p>
                          {selectedAppointment.email && <p className="text-sm"><span className="font-medium">البريد:</span> {selectedAppointment.email}</p>}
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm"><span className="font-medium">الطبيب:</span> {selectedAppointment.doctorName}</p>
                          <p className="text-sm"><span className="font-medium">التخصص:</span> {selectedAppointment.doctorSpecialty}</p>
                          {selectedAppointment.procedure && <p className="text-sm"><span className="font-medium">الإجراء:</span> {selectedAppointment.procedure}</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">المصدر:</span>{' '}
                          {(selectedAppointment as any).source ? SOURCE_LABELS[(selectedAppointment as any).source] || (selectedAppointment as any).source : '-'}
                        </p>
                        {selectedAppointment.patientNotes && <p className="text-sm"><span className="font-medium">ملاحظات المريض:</span> {selectedAppointment.patientNotes}</p>}
                        <p className="text-sm"><span className="font-medium">تاريخ التسجيل:</span> {new Date(selectedAppointment.createdAt).toLocaleString("ar-EG")}</p>
                      </div>
                      <div className="space-y-2">
                        <Label>الحالة الجديدة</Label>
                        <Select value={newAppointmentStatus} onValueChange={setNewAppointmentStatus}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
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
                        <Input type="date" value={appointmentDate ? new Date(appointmentDate).toISOString().split('T')[0] : ''} onChange={(e) => setAppointmentDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>ملاحظات (اختياري)</Label>
                        <Textarea placeholder="أضف ملاحظات..." value={appointmentStatusNotes} onChange={(e) => setAppointmentStatusNotes(e.target.value)} rows={3} />
                      </div>
                    </TabsContent>
                    <TabsContent value="comments" className="mt-0">
                      <CommentsSection entityType="appointment" entityId={selectedAppointment.id} />
                    </TabsContent>
                    <TabsContent value="tasks" className="mt-0">
                      <TasksSection entityType="appointment" entityId={selectedAppointment.id} />
                    </TabsContent>
                    <TabsContent value="history" className="mt-0">
                      <AuditLogSection entityType="appointment" entityId={selectedAppointment.id} />
                    </TabsContent>
                  </div>
                </Tabs>
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                  <Button variant="outline" onClick={() => {
                    setAppointmentStatusDialogOpen(false);
                    setSelectedAppointment(null);
                    setNewAppointmentStatus("");
                    setAppointmentStatusNotes("");
                    setAppointmentDate("");
                  }}>إلغاء</Button>
                  <Button onClick={handleAppointmentStatusUpdate} disabled={!newAppointmentStatus}>تحديث</Button>
                </div>
              </div>
            )}
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
