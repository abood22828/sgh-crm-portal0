import { useState, useMemo, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import LeadStatsCards from "@/components/LeadStatsCards";
import Pagination from "@/components/Pagination";
import { toast } from "sonner";
import { exportToExcel, formatLeadsForExport } from "@/lib/exportToExcel";
import { useFilterUtils, type DateFilterPreset } from "@/hooks/useFilterUtils";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePagination } from "@/hooks/usePagination";
import { LeadFilters, LeadTableDesktop, LeadStatusDialog, LeadMobileCards } from "@/components/leads";

const sanitizeLead = (lead: any) => {
  if (!lead) return null;
  const sanitized = { ...lead };
  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key];
    if (value === undefined || value === null || (typeof value === 'number' && isNaN(value))) {
      delete sanitized[key];
    }
  });
  return sanitized;
};

export default function LeadsManagementPage() {
  const { user } = useAuth();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const leadsFilter = useFilterUtils<any>({
    data: undefined,
    searchFields: [],
  });

  const searchTerm = leadsFilter.filters.searchTerm;
  const setSearchTerm = leadsFilter.filters.setSearchTerm;
  const leadsDateFilter = leadsFilter.filters.dateFilter;
  const setLeadsDateFilter = leadsFilter.filters.setDateFilter;
  const leadsStatusFilter = leadsFilter.filters.statusFilter;
  const setLeadsStatusFilter = leadsFilter.filters.setStatusFilter;
  const leadsSourceFilter = leadsFilter.filters.sourceFilter;
  const setLeadsSourceFilter = leadsFilter.filters.setSourceFilter;

  const { data: unifiedLeads, isLoading: leadsLoading, refetch: refetchLeads } = trpc.leads.list.useQuery();
  const { data: stats } = trpc.leads.stats.useQuery();

  const updateStatusMutation = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة العميل بنجاح");
      refetchLeads();
      setStatusDialogOpen(false);
      setSelectedLead(null);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الحالة");
    },
  });

  const filteredLeads = useMemo(() => {
    if (!unifiedLeads) return [];
    let filtered = unifiedLeads;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lead: any) =>
          lead.fullName.toLowerCase().includes(term) ||
          lead.phone.includes(term) ||
          (lead.email && lead.email.toLowerCase().includes(term))
      );
    }

    if (leadsDateFilter && leadsDateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter((lead: any) => {
        const leadDate = new Date(lead.createdAt);
        if (leadsDateFilter === "today") return leadDate >= today;
        if (leadsDateFilter === "week") {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return leadDate >= weekAgo;
        }
        if (leadsDateFilter === "month") {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return leadDate >= monthAgo;
        }
        return true;
      });
    }

    if (leadsStatusFilter && leadsStatusFilter.length > 0) {
      filtered = filtered.filter((lead: any) => leadsStatusFilter.includes(lead.status));
    }

    if (leadsSourceFilter && leadsSourceFilter.length > 0) {
      filtered = filtered.filter((lead: any) => leadsSourceFilter.includes(lead.source));
    }

    return filtered;
  }, [unifiedLeads, searchTerm, leadsDateFilter, leadsStatusFilter, leadsSourceFilter]);

  // استخدام usePagination المشترك
  const pagination = usePagination(filteredLeads);

  // إعادة تعيين الصفحة عند تغيير الفلاتر
  useEffect(() => {
    pagination.resetPage();
  }, [searchTerm, leadsDateFilter, leadsStatusFilter, leadsSourceFilter]);

  const hasActiveFilters = !!(searchTerm || (leadsDateFilter && leadsDateFilter !== "all") || leadsStatusFilter.length > 0 || leadsSourceFilter.length > 0);

  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setLeadsDateFilter("all");
    setLeadsStatusFilter([]);
    setLeadsSourceFilter([]);
  }, [setSearchTerm, setLeadsDateFilter, setLeadsStatusFilter, setLeadsSourceFilter]);

  const handleStatusUpdate = useCallback((status: string, notes: string) => {
    if (!selectedLead || !status) return;
    updateStatusMutation.mutate({
      id: selectedLead.id,
      status: status as "new" | "contacted" | "booked" | "not_interested" | "no_answer",
      notes,
    });
  }, [selectedLead, updateStatusMutation]);

  const handleExport = useCallback((format: 'excel' | 'csv' | 'pdf') => {
    if (!filteredLeads || filteredLeads.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }
    const formattedData = formatLeadsForExport(filteredLeads);
    exportToExcel(formattedData, "تسجيلات_العملاء");
    toast.success("تم تصدير البيانات بنجاح");
  }, [filteredLeads]);

  const handlePrint = useCallback(() => {
    if (!filteredLeads || filteredLeads.length === 0) {
      toast.error("لا توجد بيانات للطباعة");
      return;
    }
    window.print();
  }, [filteredLeads]);

  const handleUpdateStatusClick = useCallback((lead: any) => {
    setSelectedLead(sanitizeLead(lead));
    setStatusDialogOpen(true);
  }, []);

  const handleWhatsApp = useCallback((lead: any) => {
    window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank');
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, [setSearchTerm]);

  const handleDateFilterChange = useCallback((value: DateFilterPreset) => {
    setLeadsDateFilter(value);
  }, [setLeadsDateFilter]);

  const handleStatusFilterChange = useCallback((value: string[]) => {
    setLeadsStatusFilter(value);
  }, [setLeadsStatusFilter]);

  const handleSourceFilterChange = useCallback((value: string[]) => {
    setLeadsSourceFilter(value);
  }, [setLeadsSourceFilter]);

  const pendingCount = unifiedLeads?.filter((l: any) => l.status === 'new').length || 0;

  return (
    <DashboardLayout
      pageTitle="تسجيلات العملاء"
      pageDescription="إدارة ومتابعة تسجيلات العملاء"
    >
      <div className="space-y-4 sm:space-y-5 px-3 sm:px-4 md:px-6 py-3 sm:py-4" dir="rtl">
        {/* Stats Cards */}
        <LeadStatsCards stats={stats} />

        {/* Filters Section */}
        <LeadFilters
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          dateFilter={leadsDateFilter}
          onDateFilterChange={handleDateFilterChange}
          statusFilter={leadsStatusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          sourceFilter={leadsSourceFilter}
          onSourceFilterChange={handleSourceFilterChange}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearAllFilters}
          filteredCount={filteredLeads.length}
          totalCount={unifiedLeads?.length || 0}
          pendingCount={pendingCount}
          onExport={handleExport}
          onPrint={handlePrint}
        />

        {/* Mobile Cards View */}
        <LeadMobileCards
          leads={pagination.paginatedData}
          isLoading={leadsLoading}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearAllFilters}
          onUpdateStatus={handleUpdateStatusClick}
          onWhatsApp={handleWhatsApp}
        />

        {/* Desktop Table View */}
        <LeadTableDesktop
          leads={pagination.paginatedData}
          isLoading={leadsLoading}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearAllFilters}
          onUpdateStatus={handleUpdateStatusClick}
        />

        {/* Pagination (Desktop + Mobile) */}
        {filteredLeads.length > 0 && (
          <Pagination {...pagination.paginationProps} />
        )}

        {/* Update Lead Status Dialog */}
        <LeadStatusDialog
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          lead={selectedLead}
          onSubmit={handleStatusUpdate}
          isPending={updateStatusMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
