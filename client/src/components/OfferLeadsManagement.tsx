import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import ActionButtons from "@/components/ActionButtons";
import EmptyState from "@/components/EmptyState";
import MultiSelect from "@/components/MultiSelect";
import { ColumnVisibility, type ColumnConfig } from "@/components/ColumnVisibility";
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
import { exportToExcel, formatOfferLeadsForExport } from "@/lib/exportToExcel";
import { advancedExport, prepareExportData } from "@/lib/advancedExport";
import { printReceipt } from "@/components/PrintReceipt";
import { useAuth } from "@/_core/hooks/useAuth";
import { SOURCE_OPTIONS, SOURCE_LABELS, SOURCE_COLORS } from "@shared/sources";
import OfferLeadCard from "@/components/OfferLeadCard";
import CardSkeleton from "@/components/CardSkeleton";
import BulkUpdateDialog from "@/components/BulkUpdateDialog";
import Pagination from "@/components/Pagination";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<string[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  // Removed pagination - using date range instead
  const [offerLeadsSearchTerm, setOfferLeadsSearchTerm] = useState("");
  
  // Sorting state
  const [sortField, setSortField] = useState<'date' | 'name' | 'phone' | 'email' | 'offer' | 'source' | 'receiptNumber' | 'status' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Column visibility state for OfferLeads
  const offerLeadColumns: ColumnConfig[] = [
    { key: 'checkbox', label: 'تحديد', defaultVisible: true },
    { key: 'receiptNumber', label: 'رقم السند', defaultVisible: true },
    { key: 'name', label: 'الاسم الكامل', defaultVisible: true },
    { key: 'phone', label: 'رقم الهاتف', defaultVisible: true },
    { key: 'email', label: 'البريد الإلكتروني', defaultVisible: true },
    { key: 'offer', label: 'العرض', defaultVisible: true },
    { key: 'source', label: 'المصدر', defaultVisible: true },
    { key: 'status', label: 'الحالة', defaultVisible: true },
    { key: 'date', label: 'تاريخ التسجيل', defaultVisible: true },
    { key: 'comments', label: 'التعليقات', defaultVisible: true },
    { key: 'tasks', label: 'المهام', defaultVisible: true },
    { key: 'actions', label: 'الإجراءات', defaultVisible: true },
  ];

  const [offerLeadVisibleColumns, setOfferLeadVisibleColumns] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('offerLeadVisibleColumns');
    if (saved) {
      return JSON.parse(saved);
    }
    const defaultVisible: Record<string, boolean> = {};
    offerLeadColumns.forEach(col => {
      defaultVisible[col.key] = col.defaultVisible;
    });
    return defaultVisible;
  });

  const handleOfferLeadColumnVisibilityChange = (columnKey: string, visible: boolean) => {
    const updated = { ...offerLeadVisibleColumns, [columnKey]: visible };
    setOfferLeadVisibleColumns(updated);
    localStorage.setItem('offerLeadVisibleColumns', JSON.stringify(updated));
  };

  const handleOfferLeadColumnsReset = () => {
    const defaultVisible: Record<string, boolean> = {};
    offerLeadColumns.forEach(col => {
      defaultVisible[col.key] = col.defaultVisible;
    });
    setOfferLeadVisibleColumns(defaultVisible);
    localStorage.setItem('offerLeadVisibleColumns', JSON.stringify(defaultVisible));
  };
  
  // Debounced search for better performance
  const debouncedSearch = useDebounce(offerLeadsSearchTerm, 500);

  const { data: offerLeadsData, isLoading, refetch } = trpc.offerLeads.listPaginated.useQuery({
    page: 1,
    limit: 10000, // Get all records within date range
    searchTerm: debouncedSearch,
    dateFrom: dateRange.from.toISOString(),
    dateTo: dateRange.to.toISOString(),
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

  // دالة التصدير المتقدمة
  const handleExportOfferLeads = async (format: 'excel' | 'csv' | 'pdf') => {
    if (!filteredLeads || filteredLeads.length === 0) {
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
      if (selectedOffer.length > 0) {
        activeFilters['العرض'] = selectedOffer.join(', ');
      }

      // تحضير نطاق التاريخ
      const dateRangeStr = `${dateRange.from.toLocaleDateString('ar-SA')} - ${dateRange.to.toLocaleDateString('ar-SA')}`;

      // تحضير تعريفات الأعمدة
      const columnDefinitions = [
        { key: 'receiptNumber', label: 'رقم السند' },
        { key: 'name', label: 'الاسم الكامل' },
        { key: 'phone', label: 'رقم الهاتف' },
        { key: 'email', label: 'البريد الإلكتروني' },
        { key: 'offer', label: 'العرض' },
        { key: 'source', label: 'المصدر' },
        { key: 'status', label: 'الحالة' },
        { key: 'date', label: 'تاريخ التسجيل' },
      ];

      // تحويل البيانات للتصدير
      const exportData = filteredLeads.map((lead: any) => ({
        receiptNumber: lead.receiptNumber || '-',
        name: lead.fullName,
        phone: lead.phone,
        email: lead.email || '-',
        offer: lead.offerTitle || '-',
        source: SOURCE_LABELS[lead.source] || lead.source || '-',
        status: statusLabels[lead.status as keyof typeof statusLabels] || lead.status,
        date: new Date(lead.createdAt).toLocaleDateString('ar-SA'),
      }));

      // تحضير بيانات التصدير
      const exportOptions = prepareExportData(
        exportData,
        exportData,
        offerLeadVisibleColumns,
        columnDefinitions,
        'حجوزات العروض',
        dateRangeStr,
        Object.keys(activeFilters).length > 0 ? activeFilters : undefined,
        user?.name || 'مستخدم'
      );

      // تصدير بالتنسيق المحدد
      await advancedExport({
        ...exportOptions,
        format,
        filename: `حجوزات_العروض_${Date.now()}.${format === 'excel' ? 'xlsx' : format}`,
      });

      toast.success(`تم تصدير البيانات بنجاح بتنسيق ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('حدث خطأ أثناء التصدير');
    }
  };
  
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

  // Apply filtering and sorting to offer leads
  const filteredLeads = useMemo(() => {
    if (!offerLeads) return [];
    
    let filtered = [...offerLeads];
    
    // Filter by offer (multiple selection)
    if (selectedOffer && selectedOffer.length > 0) {
      filtered = filtered.filter((lead: any) => selectedOffer.includes(lead.offerId?.toString()));
    }
    
    // Filter by source (multiple selection)
    if (sourceFilter && sourceFilter.length > 0) {
      filtered = filtered.filter((lead: any) => sourceFilter.includes(lead.source));
    }
    
    // Filter by status (multiple selection)
    if (statusFilter && statusFilter.length > 0) {
      filtered = filtered.filter((lead: any) => statusFilter.includes(lead.status));
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
          case 'offer':
            aValue = (a.offerTitle || '').toLowerCase();
            bValue = (b.offerTitle || '').toLowerCase();
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
  }, [offerLeads, selectedOffer, sourceFilter, statusFilter, sortField, sortDirection]);

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
                visibleColumns={offerLeadVisibleColumns}
                onVisibilityChange={handleOfferLeadColumnVisibilityChange}
                onReset={handleOfferLeadColumnsReset}
              />
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
            <Table>
              <TableHeader>
                <TableRow>
                  {offerLeadVisibleColumns['checkbox'] && (
                    <TableHead className="w-12">
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
                    </TableHead>
                  )}
                  {offerLeadVisibleColumns['receiptNumber'] && (
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
                  {offerLeadVisibleColumns['name'] && (
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
                  {offerLeadVisibleColumns['phone'] && (
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
                  {offerLeadVisibleColumns['email'] && (
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
                  {offerLeadVisibleColumns['offer'] && (
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => {
                        if (sortField === 'offer') {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('offer');
                          setSortDirection('asc');
                        }
                      }}
                    >
                      <div className="flex items-center gap-1 justify-end">
                        العرض
                        {sortField === 'offer' && (
                          <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                  )}
                  {offerLeadVisibleColumns['source'] && (
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
                  {offerLeadVisibleColumns['status'] && (
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
                  {offerLeadVisibleColumns['date'] && (
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
                  {offerLeadVisibleColumns['comments'] && (
                    <TableHead className="text-right">التعليقات</TableHead>
                  )}
                  {offerLeadVisibleColumns['tasks'] && (
                    <TableHead className="text-right">المهام</TableHead>
                  )}
                  {offerLeadVisibleColumns['actions'] && (
                    <TableHead className="text-right">الإجراءات</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="p-0">
                      <TableSkeleton rows={5} columns={10} />
                    </TableCell>
                  </TableRow>
                ) : filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-12">
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
                      {offerLeadVisibleColumns['checkbox'] && (
                        <TableCell>
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
                        </TableCell>
                      )}
                      {offerLeadVisibleColumns['receiptNumber'] && (
                        <TableCell className="text-sm text-muted-foreground font-mono">
                          {lead.receiptNumber || "-"}
                        </TableCell>
                      )}
                      {offerLeadVisibleColumns['name'] && (
                        <TableCell className="font-medium">{lead.fullName}</TableCell>
                      )}
                      {offerLeadVisibleColumns['phone'] && (
                        <TableCell>
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
                        </TableCell>
                      )}
                      {offerLeadVisibleColumns['email'] && (
                        <TableCell>
                          {lead.email ? (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <a href={`mailto:${lead.email}`} className="hover:text-primary text-sm">
                                {lead.email}
                              </a>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      )}
                      {offerLeadVisibleColumns['offer'] && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{lead.offerTitle || "غير محدد"}</span>
                          </div>
                        </TableCell>
                      )}
                      {offerLeadVisibleColumns['source'] && (
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
                            <Badge variant="outline" className="text-xs">غير محدد</Badge>
                          )}
                        </TableCell>
                      )}
                      {offerLeadVisibleColumns['status'] && (
                        <TableCell>
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
                        </TableCell>
                      )}
                      {offerLeadVisibleColumns['date'] && (
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(lead.createdAt).toLocaleDateString("ar-SA")}
                        </TableCell>
                      )}
                      {offerLeadVisibleColumns['comments'] && (
                        <TableCell>
                          <CommentCount
                            entityType="offerLead"
                            entityId={lead.id}
                          />
                        </TableCell>
                      )}
                      {offerLeadVisibleColumns['tasks'] && (
                        <TableCell>
                          <TaskCount
                            entityType="offerLead"
                            entityId={lead.id}
                          />
                        </TableCell>
                      )}
                      {offerLeadVisibleColumns['actions'] && (
                        <TableCell>
                        <div className="flex gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setNewStatus(lead.status);
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
                                    const result = await generateReceiptNumberMutation.mutateAsync({ id: lead.id });
                                    const offerName = lead.offerName || `عرض #${lead.offerId}`;
                                    printReceipt({
                                      fullName: lead.fullName,
                                      phone: lead.phone,
                                      age: lead.age ?? undefined,
                                      registrationDate: new Date(lead.createdAt),
                                      type: "offer",
                                      typeName: offerName,
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
