import { useState, useMemo, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useFormatDate } from "@/hooks/useFormatDate";
import { leadStatusLabels as statusLabels } from "@/hooks/useStatusLabels";
import AppointmentCard from "@/components/AppointmentCard";
import AppointmentStatsCards from "@/components/AppointmentStatsCards";
import AppointmentFilters from "@/components/AppointmentFilters";
import AppointmentTableDesktop from "@/components/AppointmentTableDesktop";
import { type ColumnConfig } from "@/components/ColumnVisibility";
import { useTableFeatures } from "@/hooks/useTableFeatures";
import TableSkeleton from "@/components/TableSkeleton";
import EmptyState from "@/components/EmptyState";
import Pagination, { type PageSizeValue } from "@/components/Pagination";
import { useExportUtils } from "@/hooks/useExportUtils";
import { printReceipt } from "@/components/PrintReceipt";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarOff, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { SOURCE_LABELS, SOURCE_COLORS } from "@shared/sources";
import BulkUpdateDialog from "@/components/BulkUpdateDialog";
import { usePhoneFormat } from "@/hooks/usePhoneFormat";

interface AppointmentsTabProps {
  appointmentFilter: any;
  dateRange: { from: Date; to: Date };
  onOpenAppointmentDialog: (appointment: any) => void;
}

export default function AppointmentsTab({ appointmentFilter, dateRange, onOpenAppointmentDialog }: AppointmentsTabProps) {
  const { formatPhoneDisplay, getWhatsAppLink, getCallLink } = usePhoneFormat();
  const { formatDate } = useFormatDate();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // Pagination state
  const [appointmentPage, setAppointmentPage] = useState(1);
  const [appointmentPageSize, setAppointmentPageSize] = useState<PageSizeValue>("100");
  const [selectedAppointmentIds, setSelectedAppointmentIds] = useState<number[]>([]);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);

  // Filter aliases
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
    },
    onError: (_error, _variables, context) => {
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

  // Export utils
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
      date: formatDate(appointment.appointmentDate),
      name: appointment.name,
      phone: appointment.phone,
      doctor: appointment.doctorName || '-',
      specialty: appointment.specialty || '-',
      source: SOURCE_LABELS[appointment.source] || appointment.source || '-',
      receiptNumber: appointment.receiptNumber || '-',
      status: statusLabels[appointment.status as keyof typeof statusLabels] || appointment.status,
    }),
    mapToPrintRow: (appointment: any) => ({
      date: formatDate(appointment.appointmentDate),
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
      { label: 'الحالة', value: appointmentStatusFilter.length > 0 ? appointmentStatusFilter.map((s: string) => statusLabels[s as keyof typeof statusLabels]).join(', ') : undefined },
      { label: 'المصدر', value: appointmentSourceFilter.length > 0 ? appointmentSourceFilter.map((s: string) => SOURCE_LABELS[s] || s).join(', ') : undefined },
      { label: 'الطبيب', value: selectedDoctor.length > 0 ? selectedDoctor.map((id: string) => {
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

  const handleUpdateStatus = useCallback(async (id: number, status: string) => {
    await updateAppointmentStatusMutation.mutateAsync({
      id,
      status: status as any,
      staffNotes: '',
    });
  }, [updateAppointmentStatusMutation]);

  return (
    <div className="space-y-4">
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
          {/* Filters */}
          <AppointmentFilters
            searchTerm={appointmentSearchTerm}
            onSearchChange={setAppointmentSearchTerm}
            doctors={doctors}
            selectedDoctor={selectedDoctor}
            onDoctorChange={setSelectedDoctor}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            statusFilter={appointmentStatusFilter}
            onStatusFilterChange={setAppointmentStatusFilter}
            sourceFilter={appointmentSourceFilter}
            onSourceFilterChange={setAppointmentSourceFilter}
            activeFilterCount={appointmentFilter.filters.activeFilterCount}
            onResetAll={() => {
              appointmentFilter.filters.resetAll();
              setAppointmentPage(1);
              setSelectedAppointmentIds([]);
            }}
            columns={appointmentColumns}
            visibleColumns={appointmentTable.visibleColumns}
            columnOrder={appointmentTable.columnOrder}
            onVisibilityChange={appointmentTable.handleColumnVisibilityChange}
            onColumnOrderChange={appointmentTable.handleColumnOrderChange}
            onResetColumns={appointmentTable.handleResetAll}
            allTemplates={appointmentTable.allTemplates}
            activeTemplateId={appointmentTable.activeTemplateId}
            onApplyTemplate={appointmentTable.handleApplyTemplate}
            onSaveTemplate={appointmentTable.handleSaveTemplate}
            onDeleteTemplate={appointmentTable.handleDeleteTemplate}
            columnWidths={appointmentTable.columnWidths.columnWidths}
            frozenColumns={appointmentTable.frozenColumns.frozenColumns}
            onToggleFrozen={appointmentTable.frozenColumns.toggleFrozen}
            isAdmin={user?.role === 'admin'}
            sharedTemplates={appointmentTable.sharedTemplates}
            onSaveSharedTemplate={appointmentTable.handleSaveSharedTemplate}
            onDeleteSharedTemplate={appointmentTable.handleDeleteSharedTemplate}
            currentFilters={{
              statusFilter: appointmentFilter.filters.statusFilter,
              sourceFilter: appointmentFilter.filters.sourceFilter,
              categoryFilter: appointmentFilter.filters.categoryFilter,
              dateFilter: appointmentFilter.filters.dateFilter,
              searchTerm: appointmentFilter.filters.searchTerm,
            }}
            onApplyFilter={(filters: any) => {
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
            onExport={handleExportAppointments}
            onPrint={handlePrintAppointments}
          />

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
                  onViewDetails={(apt: any) => onOpenAppointmentDialog(apt)}
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
          <AppointmentTableDesktop
            appointments={filteredAppointments}
            isLoading={appointmentsLoading}
            columns={appointmentColumns}
            visibleColumns={appointmentTable.visibleColumns}
            columnOrder={appointmentTable.columnOrder}
            frozenColumns={appointmentTable.frozenColumns.frozenColumns}
            columnWidths={appointmentTable.columnWidths}
            getSortProps={appointmentTable.getSortProps}
            selectedIds={selectedAppointmentIds}
            onSelectionChange={setSelectedAppointmentIds}
            onOpenDialog={onOpenAppointmentDialog}
            onUpdateStatus={handleUpdateStatus}
            userName={user?.name || "مستخدم"}
          />
          
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

      {/* Bulk Update Dialog */}
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
  );
}
