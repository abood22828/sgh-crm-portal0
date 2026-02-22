import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import LeadStatsCards from "@/components/LeadStatsCards";
import LeadCard from "@/components/LeadCard";
import MultiSelect from "@/components/MultiSelect";
import SavedFilters from "@/components/SavedFilters";
import EmptyState from "@/components/EmptyState";
import Pagination, { type PageSizeValue } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Users, Search, TrendingUp, Phone, Loader2, Download, MessageSquare, X, Filter, User, Mail,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel, formatLeadsForExport } from "@/lib/exportToExcel";
import { useFilterUtils, type DateFilterPreset } from "@/hooks/useFilterUtils";
import { useAuth } from "@/_core/hooks/useAuth";
import { SOURCE_OPTIONS, SOURCE_LABELS, SOURCE_COLORS } from "@shared/sources";

const statusLabels: Record<string, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  booked: "تم الحجز",
  not_interested: "غير مهتم",
  no_answer: "لم يرد",
};

const statusConfig: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  new: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200" },
  contacted: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
  booked: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  not_interested: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", border: "border-red-200" },
  no_answer: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500", border: "border-gray-200" },
};

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
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeValue>("100");

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
      setNewStatus("");
      setStatusNotes("");
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

  // Pagination logic
  const numericPageSize = pageSize === "all" ? filteredLeads.length : parseInt(pageSize);
  const totalPages = pageSize === "all" ? 1 : Math.max(1, Math.ceil(filteredLeads.length / numericPageSize));
  const paginatedLeads = pageSize === "all"
    ? filteredLeads
    : filteredLeads.slice((currentPage - 1) * numericPageSize, currentPage * numericPageSize);

  const hasActiveFilters = searchTerm || (leadsDateFilter && leadsDateFilter !== "all") || leadsStatusFilter.length > 0 || leadsSourceFilter.length > 0;

  const clearAllFilters = () => {
    setSearchTerm("");
    setLeadsDateFilter("all");
    setLeadsStatusFilter([]);
    setLeadsSourceFilter([]);
  };

  const handleStatusUpdate = () => {
    if (!selectedLead || !newStatus) return;
    updateStatusMutation.mutate({
      id: selectedLead.id,
      status: newStatus as "new" | "contacted" | "booked" | "not_interested" | "no_answer",
      notes: statusNotes,
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

  const pendingCount = unifiedLeads?.filter((l: any) => l.status === 'new').length || 0;

  return (
    <DashboardLayout
      pageTitle="تسجيلات العملاء"
      pageDescription="إدارة ومتابعة تسجيلات العملاء"
    >
      <div className="space-y-5" dir="rtl">
        {/* Stats Cards */}
        <LeadStatsCards stats={stats} />

        {/* Filters Section */}
        <div className="space-y-3">
          {/* Quick filter + Actions row */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={leadsStatusFilter.includes("new") && leadsStatusFilter.length === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setLeadsStatusFilter(leadsStatusFilter.includes("new") && leadsStatusFilter.length === 1 ? [] : ["new"])}
              className={`gap-2 h-9 ${
                !(leadsStatusFilter.includes("new") && leadsStatusFilter.length === 1)
                  ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                  : ""
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              {leadsStatusFilter.includes("new") && leadsStatusFilter.length === 1 ? "عرض الكل" : "المعلقة فقط"}
              {!(leadsStatusFilter.includes("new") && leadsStatusFilter.length === 1) && pendingCount > 0 && (
                <Badge variant="secondary" className="mr-1 bg-amber-100 text-amber-700 text-xs">
                  {pendingCount}
                </Badge>
              )}
            </Button>

            <div className="flex-1" />

            <Button variant="outline" size="sm" onClick={handleExportLeads} className="gap-2 h-9">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">تصدير</span>
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1 h-9 text-muted-foreground">
                <X className="h-3.5 w-3.5" />
                مسح الفلاتر
              </Button>
            )}
          </div>

          {/* Search + Filters row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو الهاتف..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pr-10 h-9"
              />
            </div>
            <Select value={leadsDateFilter} onValueChange={(v) => { setLeadsDateFilter(v as DateFilterPreset); setCurrentPage(1); }}>
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
              onChange={(v) => { setLeadsStatusFilter(v); setCurrentPage(1); }}
              placeholder="كل الحالات"
              className="h-9"
            />
            <MultiSelect
              options={SOURCE_OPTIONS}
              selected={leadsSourceFilter}
              onChange={(v) => { setLeadsSourceFilter(v); setCurrentPage(1); }}
              placeholder="كل المصادر"
              className="h-9"
            />
          </div>

          {/* Active filters count */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              <span>عرض {filteredLeads.length.toLocaleString("ar-SA")} من {(unifiedLeads?.length || 0).toLocaleString("ar-SA")} نتيجة</span>
            </div>
          )}
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden space-y-3">
          {leadsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : paginatedLeads.length === 0 ? (
            <EmptyState
              icon={Users}
              title="لا توجد تسجيلات"
              description={hasActiveFilters ? "لا توجد نتائج مطابقة للفلاتر المحددة. جرب تغيير معايير البحث." : "لم يتم تسجيل أي عملاء بعد."}
              action={hasActiveFilters ? { label: "مسح الفلاتر", onClick: clearAllFilters } : undefined}
            />
          ) : (
            paginatedLeads.map((lead: any) => (
              <LeadCard
                key={`lead-${lead.id}`}
                lead={lead}
                onUpdateStatus={(lead) => {
                  setSelectedLead(sanitizeLead(lead));
                  setNewStatus(lead.status);
                  setStatusDialogOpen(true);
                }}
                onWhatsApp={(lead) => {
                  window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank');
                }}
              />
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold">الاسم</TableHead>
                  <TableHead className="font-semibold">الهاتف</TableHead>
                  <TableHead className="font-semibold">البريد الإلكتروني</TableHead>
                  <TableHead className="font-semibold">المصدر</TableHead>
                  <TableHead className="font-semibold">الحالة</TableHead>
                  <TableHead className="font-semibold">التاريخ</TableHead>
                  <TableHead className="font-semibold text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : paginatedLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <EmptyState
                        icon={Users}
                        title="لا توجد تسجيلات"
                        description={hasActiveFilters ? "لا توجد نتائج مطابقة للفلاتر المحددة." : "لم يتم تسجيل أي عملاء بعد."}
                        action={hasActiveFilters ? { label: "مسح الفلاتر", onClick: clearAllFilters } : undefined}
                        compact
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLeads.map((lead: any) => {
                    const sc = statusConfig[lead.status] || statusConfig.new;
                    return (
                      <TableRow
                        key={`lead-${lead.id}`}
                        className={`group ${lead.status === 'new' ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-muted/30'}`}
                      >
                        <TableCell className="font-medium">{lead.fullName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs">{lead.phone}</span>
                            <a href={`tel:${lead.phone}`} className="text-primary hover:text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                            <a
                              href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>
                          {lead.email ? (
                            <a href={`mailto:${lead.email}`} className="text-xs text-primary hover:underline">{lead.email}</a>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {lead.source ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-medium"
                              style={{
                                backgroundColor: SOURCE_COLORS[lead.source] ? `${SOURCE_COLORS[lead.source]}15` : undefined,
                                borderColor: SOURCE_COLORS[lead.source] || undefined,
                                color: SOURCE_COLORS[lead.source] || undefined,
                              }}
                            >
                              {SOURCE_LABELS[lead.source] || lead.source}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${sc.bg} ${sc.text} border-0 text-[10px] gap-1`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} inline-block`} />
                            {statusLabels[lead.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(lead.createdAt).toLocaleDateString("ar-SA")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1"
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredLeads.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredLeads.length}
              itemsPerPage={numericPageSize}
              pageSize={pageSize}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          )}
        </div>

        {/* Mobile Pagination */}
        {filteredLeads.length > 0 && (
          <div className="md:hidden">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredLeads.length}
              itemsPerPage={numericPageSize}
              pageSize={pageSize}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          </div>
        )}

        {/* Update Lead Status Dialog */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-base">تحديث حالة العميل</DialogTitle>
              <DialogDescription>قم بتحديث حالة العميل وإضافة ملاحظات إذا لزم الأمر</DialogDescription>
            </DialogHeader>
            {selectedLead && (
              <div className="space-y-4">
                {/* Lead info card */}
                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${(statusConfig[selectedLead.status] || statusConfig.new).bg}`}>
                        <User className={`w-4 h-4 ${(statusConfig[selectedLead.status] || statusConfig.new).text}`} />
                      </div>
                      <p className="font-semibold text-sm">{selectedLead.fullName}</p>
                    </div>
                    <Badge className={`${(statusConfig[selectedLead.status] || statusConfig.new).bg} ${(statusConfig[selectedLead.status] || statusConfig.new).text} border ${(statusConfig[selectedLead.status] || statusConfig.new).border} text-[10px]`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${(statusConfig[selectedLead.status] || statusConfig.new).dot} ml-1.5 inline-block`} />
                      {statusLabels[selectedLead.status] || selectedLead.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <span dir="ltr" className="font-mono">{selectedLead.phone}</span>
                    </div>
                    {selectedLead.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <span className="truncate">{selectedLead.email}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">النوع:</span>{' '}
                      <span className="font-medium">{selectedLead.type === 'general' ? 'عام' : selectedLead.type === 'offer' ? 'عرض' : 'مخيم'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">المصدر:</span>{' '}
                      <span className="font-medium">{selectedLead.source ? SOURCE_LABELS[selectedLead.source] || selectedLead.source : '-'}</span>
                    </div>
                  </div>
                  {selectedLead.notes && (
                    <div className="text-xs bg-background/60 rounded p-2 border border-dashed">
                      <span className="font-medium">الملاحظات:</span> {selectedLead.notes}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    تاريخ التسجيل:{' '}
                    {(() => {
                      try {
                        const date = selectedLead.createdAt ? new Date(selectedLead.createdAt) : null;
                        return date && !isNaN(date.getTime()) ? date.toLocaleString("ar-SA") : 'غير متوفر';
                      } catch (e) {
                        return 'غير متوفر';
                      }
                    })()}
                  </p>
                </div>

                {/* Quick actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs gap-1.5"
                    onClick={() => window.location.href = `tel:${selectedLead.phone}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    اتصال
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                    onClick={() => {
                      const msg = encodeURIComponent(`مرحباً ${selectedLead.fullName}، نود التواصل معك بخصوص استفسارك.`);
                      window.open(`https://wa.me/${selectedLead.phone.replace(/^0+/, '')}?text=${msg}`, '_blank');
                    }}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    واتساب
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">الحالة الجديدة</Label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { value: 'new', label: 'جديد', color: 'blue' },
                      { value: 'contacted', label: 'تم التواصل', color: 'amber' },
                      { value: 'booked', label: 'تم الحجز', color: 'emerald' },
                      { value: 'not_interested', label: 'غير مهتم', color: 'red' },
                      { value: 'no_answer', label: 'لم يرد', color: 'gray' },
                    ].map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setNewStatus(s.value)}
                        className={`text-[10px] py-2 px-1 rounded-lg border-2 transition-all text-center leading-tight ${
                          newStatus === s.value
                            ? `border-${s.color}-500 bg-${s.color}-50 text-${s.color}-700 font-semibold ring-1 ring-${s.color}-200`
                            : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">ملاحظات (اختياري)</Label>
                  <Textarea
                    placeholder="أضف ملاحظات..."
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
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
                    size="sm"
                    onClick={handleStatusUpdate}
                    disabled={!newStatus || updateStatusMutation.isPending}
                    className="gap-1.5"
                  >
                    {updateStatusMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    تحديث الحالة
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
