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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Search, 
  TrendingUp,
  Phone,
  Mail,
  Loader2,
  Eye,
  Tag,
  MessageCircle,
  Download,
  CheckSquare,
  Square,
  Printer,
  Settings,
  ShoppingBag,
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
import OfferLeadCard from "@/components/OfferLeadCard";
import CardSkeleton from "@/components/CardSkeleton";
import BulkUpdateDialog from "@/components/BulkUpdateDialog";
import Pagination, { type PageSizeValue } from "@/components/Pagination";
import { RotateCcw } from "lucide-react";

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

export default function OfferLeadsManagement({ 
  onPendingCountChange,
  dateRange 
}: { 
  onPendingCountChange?: (count: number) => void,
  dateRange: { from: Date, to: Date }
}) {
  const { user } = useAuth();
  const generateReceiptNumberMutation = trpc.offerLeads.generateReceiptNumber.useMutation();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  
  // Pagination state
  const [offerPage, setOfferPage] = useState(1);
  const [offerPageSize, setOfferPageSize] = useState<PageSizeValue>("100");
  
  // === Unified filter state via useFilterUtils ===
  const offerFilter = useFilterUtils<any>();
  
  // Aliases for backward compatibility
  const searchTerm = offerFilter.filters.searchTerm;
  const setSearchTerm = offerFilter.filters.setSearchTerm;
  const selectedOffer = offerFilter.filters.categoryFilter;
  const setSelectedOffer = offerFilter.filters.setCategoryFilter;
  const statusFilter = offerFilter.filters.statusFilter;
  const setStatusFilter = offerFilter.filters.setStatusFilter;
  const sourceFilter = offerFilter.filters.sourceFilter;
  const setSourceFilter = offerFilter.filters.setSourceFilter;
  const dateFilter = offerFilter.filters.dateFilter;
  const setDateFilter = offerFilter.filters.setDateFilter;
  const offerLeadsSearchTerm = offerFilter.filters.searchTerm;
  const setOfferLeadsSearchTerm = offerFilter.filters.setSearchTerm;
  
  // Sorting state
  // Sort state is now managed by offerTable.sortState via useTableFeatures

  // Column visibility state for OfferLeads - جميع الأعمدة من قاعدة البيانات
  const offerLeadColumns: ColumnConfig[] = [
    { key: 'checkbox', label: 'تحديد', defaultVisible: true, sortable: false },
    { key: 'receiptNumber', label: 'رقم السند', defaultVisible: true, sortType: 'string' },
    { key: 'name', label: 'الاسم الكامل', defaultVisible: true, sortType: 'string' },
    { key: 'phone', label: 'رقم الهاتف', defaultVisible: true, sortType: 'string' },
    { key: 'email', label: 'البريد الإلكتروني', defaultVisible: true, sortType: 'string' },
    { key: 'offer', label: 'العرض', defaultVisible: true, sortType: 'string' },
    { key: 'notes', label: 'ملاحظات العميل', defaultVisible: false, sortable: false },
    { key: 'status', label: 'الحالة', defaultVisible: true, sortType: 'string' },
    { key: 'statusNotes', label: 'ملاحظات الحالة', defaultVisible: false, sortable: false },
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
  const offerTable = useTableFeatures({
    tableKey: 'offerLeads',
    columns: offerLeadColumns,
  });
  
  // Debounced search - now managed by useFilterUtils
  const debouncedSearch = offerFilter.filters.debouncedSearch;

  // Reset page when filters change
  useEffect(() => {
    setOfferPage(1);
  }, [debouncedSearch, dateRange.from, dateRange.to, statusFilter, sourceFilter, selectedOffer, dateFilter]);
  
  const offerLimit = offerPageSize === "all" ? 100000 : parseInt(offerPageSize);
  const { data: offerLeadsData, isLoading, refetch } = trpc.offerLeads.listPaginated.useQuery({
    page: offerPageSize === "all" ? 1 : offerPage,
    limit: offerLimit,
    searchTerm: debouncedSearch,
    dateFrom: dateRange.from.toISOString(),
    dateTo: dateRange.to.toISOString(),
    dateFilter: dateFilter !== 'all' ? dateFilter as "today" | "week" | "month" : undefined,
    offerIds: selectedOffer && selectedOffer.length > 0 ? selectedOffer.map(Number) : undefined,
    sources: sourceFilter && sourceFilter.length > 0 ? sourceFilter : undefined,
    statuses: statusFilter && statusFilter.length > 0 ? statusFilter : undefined,
  });
  const offerLeads = offerLeadsData?.data || [];
  const { data: stats } = trpc.offerLeads.stats.useQuery();
  
  // Removed pagination reset effect
  
  // Count pending offerLeads (status = 'new')
  const pendingCount = useMemo(() => {
    return offerLeads?.filter(l => l.status === 'new').length || 0;
  }, [offerLeads]);
  
  // Notify parent of pending count changes
  useEffect(() => {
    if (onPendingCountChange) {
      onPendingCountChange(pendingCount);
    }
  }, [pendingCount, onPendingCountChange]);

  const utils = trpc.useUtils();
  
  const updateStatusMutation = trpc.offerLeads.updateStatus.useMutation({
    onMutate: async (variables) => {
      await utils.offerLeads.listPaginated.cancel();
      const previousData = utils.offerLeads.listPaginated.getData();
      
      utils.offerLeads.listPaginated.setData(
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
            data: old.data.map((lead: any) =>
              lead.id === variables.id
                ? { ...lead, status: variables.status }
                : lead
            ),
          };
        }
      );
      
      return { previousData };
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة الحجز بنجاح");
      setStatusDialogOpen(false);
      setSelectedLead(null);
      setNewStatus("");
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        utils.offerLeads.listPaginated.setData(
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
      utils.offerLeads.listPaginated.invalidate();
    },
  });

  const bulkUpdateMutation = trpc.offerLeads.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`تم تحديث ${data.count} حجز بنجاح`);
      refetch();
      setBulkUpdateDialogOpen(false);
      setSelectedIds([]);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الحالة");
    },
  });

  // Get unique offers for filter
  const uniqueOffers = useMemo(() => {
    if (!offerLeads) return [];
    const offers = offerLeads
      .filter((lead: any) => lead.offerTitle)
      .map((lead: any) => ({ id: lead.offerId, title: lead.offerTitle }));
    const unique = Array.from(new Map(offers.map((o: any) => [o.id, o])).values());
    return unique;
  }, [offerLeads]);

  // Apply sorting to offer leads (filtering is now done server-side)
  const filteredLeads = useMemo(() => {
    if (!offerLeads) return [];
    
    let filtered = [...offerLeads];
    
    // Apply sorting using useTableFeatures
    const sorted = offerTable.sortData(filtered, (item: any, key: string) => {
      switch (key) {
        case 'date': return item.createdAt;
        case 'name': return item.fullName;
        case 'phone': return item.phone;
        case 'email': return item.email;
        case 'offer': return item.offerTitle;
        case 'source': return item.source;
        case 'receiptNumber': return item.receiptNumber;
        case 'status': return item.status;
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
    if (!offerTable.sortState.direction) {
      sorted.sort((a: any, b: any) => {
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        return bDate - aDate;
      });
    }
    
    return sorted;
  }, [offerLeads, offerTable.sortState, offerTable.sortData]);

  // useExportUtils hook لحجوزات العروض
  const offerExport = useExportUtils({
    tableName: 'حجوزات العروض',
    filenamePrefix: 'حجوزات_العروض',
    exportColumns: [
      { key: 'receiptNumber', label: 'رقم السند' },
      { key: 'name', label: 'الاسم الكامل' },
      { key: 'phone', label: 'رقم الهاتف' },
      { key: 'email', label: 'البريد الإلكتروني' },
      { key: 'offer', label: 'العرض' },
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
      { key: 'offer', label: 'العرض' },
      { key: 'source', label: 'المصدر' },
      { key: 'status', label: 'الحالة' },
      { key: 'date', label: 'تاريخ التسجيل' },
      { key: 'comments', label: 'التعليقات' },
      { key: 'tasks', label: 'المهام' },
      { key: 'actions', label: 'الإجراءات' },
    ],
    mapToExportRow: (lead: any) => ({
      receiptNumber: lead.receiptNumber || '-',
      name: lead.fullName,
      phone: lead.phone,
      email: lead.email || '-',
      offer: lead.offerTitle || '-',
      source: SOURCE_LABELS[lead.source] || lead.source || '-',
      status: statusLabels[lead.status as keyof typeof statusLabels] || lead.status,
      date: new Date(lead.createdAt).toLocaleDateString('ar-SA'),
    }),
    mapToPrintRow: (lead: any) => ({
      checkbox: '-',
      receiptNumber: lead.receiptNumber || '-',
      name: lead.fullName,
      phone: lead.phone,
      email: lead.email || '-',
      offer: lead.offerTitle || '-',
      source: SOURCE_LABELS[lead.source] || lead.source || '-',
      status: statusLabels[lead.status as keyof typeof statusLabels] || lead.status,
      date: new Date(lead.createdAt).toLocaleDateString('ar-SA'),
      comments: lead.commentCount > 0 ? `${lead.commentCount} تعليق` : '-',
      tasks: lead.taskCount > 0 ? `${lead.taskCount} مهمة` : '-',
      actions: '-',
    }),
  });

  const getOfferExportOptions = useCallback(() => {
    const activeFilters = offerExport.buildActiveFilters([
      { label: 'البحث', value: debouncedSearch || undefined },
      { label: 'الحالة', value: statusFilter.length > 0 ? statusFilter.map(s => statusLabels[s as keyof typeof statusLabels]).join(', ') : undefined },
      { label: 'المصدر', value: sourceFilter.length > 0 ? sourceFilter.map(s => SOURCE_LABELS[s] || s).join(', ') : undefined },
      { label: 'العرض', value: selectedOffer.length > 0 ? selectedOffer.join(', ') : undefined },
    ]);
    return {
      data: filteredLeads,
      activeFilters,
      dateRangeStr: offerExport.formatDateRange(dateRange.from, dateRange.to),
      visibleColumns: offerTable.visibleColumns,
    };
  }, [filteredLeads, debouncedSearch, statusFilter, sourceFilter, selectedOffer, dateRange, offerTable.visibleColumns, offerExport]);

  const handleExportOfferLeads = useCallback(async (format: 'excel' | 'csv' | 'pdf') => {
    await offerExport.handleExport(format, getOfferExportOptions());
  }, [offerExport, getOfferExportOptions]);

  const handlePrintOfferLeads = useCallback(() => {
    offerExport.handlePrint(getOfferExportOptions());
  }, [offerExport, getOfferExportOptions]);

  const handleStatusUpdate = () => {
    if (!selectedLead || !newStatus) return;
    
    updateStatusMutation.mutate({
      id: selectedLead.id,
      status: newStatus as any,
    });
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
      <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحجوزات</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">حجوزات العروض</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">جديد</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.new || 0}</div>
            <p className="text-xs text-muted-foreground">بانتظار المتابعة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تم التواصل</CardTitle>
            <Phone className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.contacted || 0}</div>
            <p className="text-xs text-muted-foreground">قيد المتابعة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تم الحجز</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.booked || 0}</div>
            <p className="text-xs text-muted-foreground">حجوزات مؤكدة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">غير مهتم</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.not_interested || 0}</div>
            <p className="text-xs text-muted-foreground">لم يكملوا الحجز</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>حجوزات العروض</CardTitle>
              <CardDescription>إدارة ومتابعة جميع حجوزات العروض الطبية</CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedIds.length > 0 && (
                <Button
                  variant="default"
                  onClick={() => setBulkUpdateDialogOpen(true)}
                >
                  <CheckSquare className="h-4 w-4 ml-2" />
                  تحديث الحالة ({selectedIds.length})
                </Button>
              )}
              <ColumnVisibility
                 columns={offerLeadColumns}
                 visibleColumns={offerTable.visibleColumns}
                 columnOrder={offerTable.columnOrder}
                 onVisibilityChange={offerTable.handleColumnVisibilityChange}
                 onColumnOrderChange={offerTable.handleColumnOrderChange}
                 onReset={offerTable.handleResetAll}
                 templates={offerTable.allTemplates}
                 activeTemplateId={offerTable.activeTemplateId}
                 onApplyTemplate={offerTable.handleApplyTemplate}
                 onSaveTemplate={offerTable.handleSaveTemplate}
                 onDeleteTemplate={offerTable.handleDeleteTemplate}
                 tableKey="offerLeads"
                  columnWidths={offerTable.columnWidths.columnWidths}
                  frozenColumns={offerTable.frozenColumns.frozenColumns}
                  onToggleFrozen={offerTable.frozenColumns.toggleFrozen}
                  isAdmin={user?.role === 'admin'}
                  sharedTemplates={offerTable.sharedTemplates}
                  onSaveSharedTemplate={offerTable.handleSaveSharedTemplate}
                  onDeleteSharedTemplate={offerTable.handleDeleteSharedTemplate}
                />
              <Button
                variant="outline"
                onClick={handlePrintOfferLeads}
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
                  <DropdownMenuItem onClick={() => handleExportOfferLeads('excel')}>
                    تصدير Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportOfferLeads('csv')}>
                    تصدير CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportOfferLeads('pdf')}>
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
                value={offerLeadsSearchTerm}
                onChange={(e) => setOfferLeadsSearchTerm(e.target.value)}
                className="pr-10 h-9 md:h-10"
              />
            </div>

            <MultiSelect
              options={uniqueOffers.map((offer: any) => ({ value: offer.id.toString(), label: offer.title }))}
              selected={selectedOffer}
              onChange={setSelectedOffer}
              placeholder="جميع العروض"
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
                { value: 'new', label: 'جديد' },
                { value: 'contacted', label: 'تم التواصل' },
                { value: 'booked', label: 'تم الحجز' },
                { value: 'not_interested', label: 'غير مهتم' },
                { value: 'no_answer', label: 'لم يرد' },
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
          
          {/* Reset Filters Button */}
          {offerFilter.filters.activeFilterCount > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  offerFilter.filters.resetAll();
                  setOfferPage(1);
                  setSelectedIds([]);
                }}
                className="gap-1 text-muted-foreground hover:text-foreground h-8"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                إعادة تعيين الفلاتر ({offerFilter.filters.activeFilterCount})
              </Button>
            </div>
          )}

          {/* Mobile Cards View */}
          <div className="md:hidden">
            {isLoading ? (
              <TableSkeleton rows={3} columns={4} />
            ) : filteredLeads.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="لا توجد حجوزات"
                description="لم يتم العثور على أي حجوزات للعروض في الفترة المحددة. جرب تغيير الفلاتر."
              />
            ) : (
              filteredLeads.map((lead: any) => (
                <OfferLeadCard
                  key={lead.id}
                  lead={{
                    id: lead.id,
                    fullName: lead.fullName,
                    phone: lead.phone,
                    email: lead.email,
                    status: lead.status,
                    offerName: lead.offerTitle,
                    createdAt: lead.createdAt,
                  }}
                  onEdit={() => {
                    setSelectedLead(lead);
                    setNewStatus(lead.status);
                    setStatusDialogOpen(true);
                  }}
                  onPrint={async () => {
                    try {
                      const result = await generateReceiptNumberMutation.mutateAsync({ id: lead.id });
                      printReceipt({
                        fullName: lead.fullName,
                        phone: lead.phone,
                        age: undefined,
                        registrationDate: lead.createdAt ? new Date(lead.createdAt) : new Date(),
                        type: "offer",
                        typeName: lead.offerTitle || 'غير محدد',
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

          {/* Desktop Table View */}
          <div className="hidden md:block border rounded-lg">
             <ResizableTable
               frozenColumns={offerTable.frozenColumns.frozenColumns}
               columnWidths={offerTable.columnWidths.columnWidths}
               visibleColumnOrder={offerTable.columnOrder.filter(key => offerTable.visibleColumns[key])}
             >
              <TableHeader>
                <TableRow>
                  {offerTable.columnOrder.filter(key => offerTable.visibleColumns[key]).map(colKey => {
                    const col = offerLeadColumns.find(c => c.key === colKey);
                    if (!col) return null;
                    if (colKey === 'checkbox') {
                      return (
                        <ResizableHeaderCell key={colKey} columnKey={colKey} width={40} minWidth={40} maxWidth={40} onResize={() => {}}>
                          <input
                            type="checkbox"
                            checked={selectedIds.length === filteredLeads.length && filteredLeads.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds(filteredLeads.map(lead => lead.id));
                              } else {
                                setSelectedIds([]);
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
                        width={offerTable.columnWidths.getWidth(colKey)}
                        minWidth={widthConfig.min}
                        maxWidth={widthConfig.max}
                        onResize={offerTable.columnWidths.handleResize}
                        {...offerTable.getSortProps(colKey)}
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
                    <TableCell colSpan={offerTable.columnOrder.filter(k => offerTable.visibleColumns[k]).length || 1} className="p-0">
                      <TableSkeleton rows={5} columns={offerTable.columnOrder.filter(k => offerTable.visibleColumns[k]).length || 10} />
                    </TableCell>
                  </TableRow>
                ) : filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={offerTable.columnOrder.filter(k => offerTable.visibleColumns[k]).length || 1} className="py-12">
                      <EmptyState
                        icon={ShoppingBag}
                        title="لا توجد حجوزات"
                        description="لم يتم العثور على أي حجوزات للعروض في الفترة المحددة. جرب تغيير الفلاتر."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead: any) => (
                    <TableRow key={lead.id} className={lead.status === 'new' ? 'bg-red-50 hover:bg-red-100' : ''}>
                      {offerTable.columnOrder.filter(key => offerTable.visibleColumns[key]).map(colKey => {
                        switch(colKey) {
                          case 'checkbox':
                            return (
                              <FrozenTableCell key={colKey} columnKey={colKey}>
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(lead.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedIds([...selectedIds, lead.id]);
                                    } else {
                                      setSelectedIds(selectedIds.filter(id => id !== lead.id));
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                              </FrozenTableCell>
                            );
                          case 'receiptNumber':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-sm text-muted-foreground font-mono">{lead.receiptNumber || "-"}</FrozenTableCell>;
                          case 'name':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="font-medium">{lead.fullName}</FrozenTableCell>;
                          case 'phone':
                            return (
                              <FrozenTableCell key={colKey} columnKey={colKey}>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono">{lead.phone}</span>
                                  <ActionButtons
                                    phoneNumber={lead.phone}
                                    showWhatsApp={true}
                                    whatsAppMessage={`مرحباً ${lead.fullName}، شكراً لاهتمامك بعرضنا الطبي. نود التواصل معك لتأكيد حجزك.`}
                                    size="sm"
                                    variant="ghost"
                                  />
                                </div>
                              </FrozenTableCell>
                            );
                          case 'email':
                            return (
                              <FrozenTableCell key={colKey} columnKey={colKey}>
                                {lead.email ? (
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <a href={`mailto:${lead.email}`} className="hover:text-primary text-sm">{lead.email}</a>
                                  </div>
                                ) : (<span className="text-muted-foreground">-</span>)}
                              </FrozenTableCell>
                            );
                          case 'age':
                            return <FrozenTableCell key={colKey} columnKey={colKey}>{lead.age ? `${lead.age} سنة` : '-'}</FrozenTableCell>;
                          case 'offer':
                            return (
                              <FrozenTableCell key={colKey} columnKey={colKey}>
                                <div className="flex items-center gap-2">
                                  <Tag className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{lead.offerTitle || "غير محدد"}</span>
                                </div>
                              </FrozenTableCell>
                            );
                          case 'source':
                            return (
                              <FrozenTableCell key={colKey} columnKey={colKey}>
                                {lead.source ? (
                                  <Badge variant="outline" className="text-xs font-medium" style={{
                                    backgroundColor: SOURCE_COLORS[lead.source] ? `${SOURCE_COLORS[lead.source]}15` : undefined,
                                    borderColor: SOURCE_COLORS[lead.source] || undefined,
                                    color: SOURCE_COLORS[lead.source] || undefined,
                                  }}>
                                    {SOURCE_LABELS[lead.source] || lead.source}
                                  </Badge>
                                ) : (<Badge variant="outline" className="text-xs">غير محدد</Badge>)}
                              </FrozenTableCell>
                            );
                          case 'status':
                            return (
                              <FrozenTableCell key={colKey} columnKey={colKey}>
                                <InlineStatusEditor
                                  currentStatus={lead.status}
                                  statusOptions={[
                                    { value: 'new', label: 'جديد', color: 'bg-blue-500' },
                                    { value: 'contacted', label: 'تم التواصل', color: 'bg-yellow-500' },
                                    { value: 'booked', label: 'تم الحجز', color: 'bg-green-500' },
                                    { value: 'not_interested', label: 'غير مهتم', color: 'bg-red-500' },
                                    { value: 'no_answer', label: 'لم يرد', color: 'bg-gray-500' },
                                  ]}
                                  onSave={async (newStatus) => {
                                    await updateStatusMutation.mutateAsync({
                                      id: lead.id,
                                      status: newStatus as any,
                                      notes: '',
                                    });
                                  }}
                                />
                              </FrozenTableCell>
                            );
                          case 'statusNotes':
                            return <FrozenTableCell key={colKey} columnKey={colKey} wrap title={lead.statusNotes}>{lead.statusNotes || '-'}</FrozenTableCell>;
                          case 'date':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-sm text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString("ar-SA")}</FrozenTableCell>;
                          case 'utmSource':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{lead.utmSource || '-'}</FrozenTableCell>;
                          case 'utmMedium':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{lead.utmMedium || '-'}</FrozenTableCell>;
                          case 'utmCampaign':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{lead.utmCampaign || '-'}</FrozenTableCell>;
                          case 'utmTerm':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{lead.utmTerm || '-'}</FrozenTableCell>;
                          case 'utmContent':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{lead.utmContent || '-'}</FrozenTableCell>;
                          case 'utmPlacement':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{lead.utmPlacement || '-'}</FrozenTableCell>;
                          case 'referrer':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{lead.referrer || '-'}</FrozenTableCell>;
                          case 'fbclid':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs font-mono">{lead.fbclid || '-'}</FrozenTableCell>;
                          case 'gclid':
                            return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs font-mono">{lead.gclid || '-'}</FrozenTableCell>;
                          case 'comments':
                            return <FrozenTableCell key={colKey} columnKey={colKey}><CommentCount entityType="offerLead" entityId={lead.id} /></FrozenTableCell>;
                          case 'tasks':
                            return <FrozenTableCell key={colKey} columnKey={colKey}><TaskCount entityType="offerLead" entityId={lead.id} /></FrozenTableCell>;
                          case 'actions':
                            return (
                              <FrozenTableCell key={colKey} columnKey={colKey}>
                                <div className="flex gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="outline" size="sm" onClick={() => { setSelectedLead(lead); setNewStatus(lead.status); setStatusDialogOpen(true); }}>
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
                                            const result = await generateReceiptNumberMutation.mutateAsync({ id: lead.id });
                                            const offerName = lead.offerName || `عرض #${lead.offerId}`;
                                            printReceipt({
                                              fullName: lead.fullName, phone: lead.phone, age: lead.age ?? undefined,
                                              registrationDate: new Date(lead.createdAt), type: "offer", typeName: offerName,
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

          {/* Pagination */}
          <Pagination
            currentPage={offerPage}
            totalPages={offerLeadsData?.totalPages || 1}
            onPageChange={(page) => {
              setOfferPage(page);
              setSelectedIds([]);
            }}
            totalItems={offerLeadsData?.total || 0}
            itemsPerPage={offerLimit}
            pageSize={offerPageSize}
            onPageSizeChange={(size) => {
              setOfferPageSize(size);
              setOfferPage(1);
              setSelectedIds([]);
            }}
          />

        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
          <DialogHeader>
            <DialogTitle>تحديث حالة الحجز</DialogTitle>
            <DialogDescription>
              قم بتحديث حالة حجز العرض لـ {selectedLead?.fullName}
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">معلومات الحجز</TabsTrigger>
                  <TabsTrigger value="comments">التعليقات</TabsTrigger>
                  <TabsTrigger value="tasks">المهام</TabsTrigger>
                </TabsList>
                
                <div className="flex-1 overflow-y-auto mt-4">
                  <TabsContent value="info" className="space-y-4 mt-0">
                    <div className="space-y-2">
                      <Label>معلومات العميل</Label>
                      <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedLead.phone}</span>
                        </div>
                        {selectedLead.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedLead.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedLead.offerTitle || "غير محدد"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>الحالة الجديدة</Label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger>
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
                  </TabsContent>
                  
                  <TabsContent value="comments" className="mt-0">
                    <CommentsSection
                      entityType="offerLead"
                      entityId={selectedLead.id}
                    />
                  </TabsContent>
                  
                  <TabsContent value="tasks" className="mt-0">
                    <TasksSection
                      entityType="offerLead"
                      entityId={selectedLead.id}
                    />
                  </TabsContent>
                </div>
              </Tabs>
              
              <div className="flex gap-2 justify-end mt-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusDialogOpen(false);
                  setSelectedLead(null);
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

      {/* Bulk Update Dialog */}
      <BulkUpdateDialog
        open={bulkUpdateDialogOpen}
        onOpenChange={setBulkUpdateDialogOpen}
        selectedCount={selectedIds.length}
        statusOptions={[
          { value: "new", label: "جديد" },
          { value: "contacted", label: "تم التواصل" },
          { value: "confirmed", label: "مؤكد" },
          { value: "cancelled", label: "ملغي" },
          { value: "completed", label: "مكتمل" },
        ]}
        onConfirm={(newStatus) => {
          bulkUpdateMutation.mutate({ ids: selectedIds, status: newStatus as "new" | "contacted" | "booked" | "not_interested" | "no_answer" });
        }}
        isLoading={bulkUpdateMutation.isPending}
      />
    </div>
  );
}
