import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import LeadStatsCards from "@/components/LeadStatsCards";
import LeadCard from "@/components/LeadCard";
import MultiSelect from "@/components/MultiSelect";
import SavedFilters from "@/components/SavedFilters";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Users, Search, TrendingUp, Phone, Loader2, Download,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel, formatLeadsForExport } from "@/lib/exportToExcel";
import { useFilterUtils } from "@/hooks/useFilterUtils";
import { useAuth } from "@/_core/hooks/useAuth";
import { SOURCE_OPTIONS, SOURCE_LABELS, SOURCE_COLORS } from "@shared/sources";

const statusLabels: Record<string, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  booked: "تم الحجز",
  not_interested: "غير مهتم",
  no_answer: "لم يرد",
};

const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  booked: "bg-green-500",
  not_interested: "bg-red-500",
  no_answer: "bg-gray-500",
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

  return (
    <DashboardLayout
      pageTitle="تسجيلات العملاء"
      pageDescription="إدارة ومتابعة تسجيلات العملاء"
    >
      <div className="container mx-auto py-6 space-y-6" dir="rtl">
        <LeadStatsCards stats={stats} />

        <Card>
          <CardHeader>
            <CardTitle>تسجيلات العملاء</CardTitle>
            <CardDescription>إدارة ومتابعة تسجيلات العملاء</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant={leadsStatusFilter.includes("new") && leadsStatusFilter.length === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLeadsStatusFilter(leadsStatusFilter.includes("new") && leadsStatusFilter.length === 1 ? [] : ["new"])}
                  className="gap-2 h-9 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
                >
                  <TrendingUp className="h-4 w-4" />
                  {leadsStatusFilter.includes("new") && leadsStatusFilter.length === 1 ? "عرض الكل" : "المعلقة فقط"}
                  {!(leadsStatusFilter.includes("new") && leadsStatusFilter.length === 1) && (unifiedLeads?.filter((l: any) => l.status === 'new').length || 0) > 0 && (
                    <Badge variant="secondary" className="mr-1 bg-white text-orange-600">
                      {unifiedLeads?.filter((l: any) => l.status === 'new').length || 0}
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
                <Button variant="outline" size="sm" onClick={handleExportLeads} className="gap-2 h-9">
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
                <div className="text-center py-8 text-muted-foreground">لا توجد تسجيلات</div>
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
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد تسجيلات</TableCell>
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
                            <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>
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
                        <TableCell>{new Date(lead.createdAt).toLocaleDateString("ar-EG")}</TableCell>
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

        {/* Update Lead Status Dialog */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تحديث حالة العميل</DialogTitle>
              <DialogDescription>قم بتحديث حالة العميل وإضافة ملاحظات إذا لزم الأمر</DialogDescription>
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
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Button onClick={handleStatusUpdate} disabled={!newStatus}>تحديث</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
