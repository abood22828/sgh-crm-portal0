import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel, formatOfferLeadsForExport } from "@/lib/exportToExcel";
import { SOURCE_OPTIONS } from "@shared/sources";
import OfferLeadCard from "@/components/OfferLeadCard";
import CardSkeleton from "@/components/CardSkeleton";
import BulkUpdateDialog from "@/components/BulkUpdateDialog";

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

export default function OfferLeadsManagement({ onPendingCountChange }: { onPendingCountChange?: (count: number) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);

  const { data: offerLeads, isLoading, refetch } = trpc.offerLeads.list.useQuery();
  const { data: stats } = trpc.offerLeads.stats.useQuery();
  
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

  const updateStatusMutation = trpc.offerLeads.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة الحجز بنجاح");
      refetch();
      setStatusDialogOpen(false);
      setSelectedLead(null);
      setNewStatus("");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الحالة");
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

  const filteredLeads = useMemo(() => {
    if (!offerLeads) return [];
    
    let filtered = offerLeads;
    
    // Filter by offer
    if (selectedOffer !== "all") {
      filtered = filtered.filter((lead: any) => lead.offerId === parseInt(selectedOffer));
    }
    
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
    if (dateFilter && dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter((lead: any) => {
        const leadDate = new Date(lead.createdAt);
        
        if (dateFilter === "today") {
          return leadDate >= today;
        } else if (dateFilter === "week") {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return leadDate >= weekAgo;
        } else if (dateFilter === "month") {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return leadDate >= monthAgo;
        }
        return true;
      });
    }
    
    // Filter by status
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((lead: any) => lead.status === statusFilter);
    }
    
    // Filter by source
    if (sourceFilter && sourceFilter !== "all") {
      filtered = filtered.filter((lead: any) => lead.source === sourceFilter);
    }
    
    return filtered;
  }, [offerLeads, selectedOffer, searchTerm, dateFilter, statusFilter, sourceFilter]);

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
              <Button
                variant="outline"
                onClick={() => {
                  if (!offerLeads || offerLeads.length === 0) {
                    toast.error("لا توجد بيانات لتصديرها");
                    return;
                  }
                  const formattedData = formatOfferLeadsForExport(offerLeads);
                  exportToExcel(formattedData, `offer-leads-${new Date().toISOString().split('T')[0]}`, 'حجوزات العروض');
                  toast.success("تم تصدير البيانات بنجاح");
                }}
              >
                <Download className="h-4 w-4 ml-2" />
                تصدير Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Filter Button */}
          <div className="flex items-center gap-2">
            <Button
              variant={statusFilter === "new" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(statusFilter === "new" ? "all" : "new")}
              className="gap-2 h-9 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
            >
              <TrendingUp className="h-4 w-4" />
              {statusFilter === "new" ? "عرض الكل" : "المعلقة فقط"}
              {statusFilter !== "new" && pendingCount > 0 && (
                <Badge variant="secondary" className="mr-1 bg-white text-orange-600">
                  {pendingCount}
                </Badge>
              )}
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث بالاسم، الهاتف، أو البريد الإلكتروني..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 h-9 md:h-10"
              />
            </div>
            <Select value={selectedOffer} onValueChange={setSelectedOffer}>
              <SelectTrigger className="w-full sm:w-[180px] h-9 md:h-10">
                <SelectValue placeholder="فلترة حسب العرض" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع العروض</SelectItem>
                {uniqueOffers.map((offer: any) => (
                  <SelectItem key={offer.id} value={offer.id.toString()}>
                    {offer.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-9 md:h-10">
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="new">جديد</SelectItem>
                <SelectItem value="contacted">تم التواصل</SelectItem>
                <SelectItem value="booked">تم الحجز</SelectItem>
                <SelectItem value="not_interested">غير مهتم</SelectItem>
                <SelectItem value="no_answer">لم يرد</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-9 md:h-10">
                <SelectValue placeholder="كل المصادر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المصادر</SelectItem>
                {SOURCE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden">
            {isLoading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : filteredLeads.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  لا توجد حجوزات متاحة
                </CardContent>
              </Card>
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
                />
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
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
                  <TableHead className="text-right">الاسم الكامل</TableHead>
                  <TableHead className="text-right">رقم الهاتف</TableHead>
                  <TableHead className="text-right">البريد الإلكتروني</TableHead>
                  <TableHead className="text-right">العرض</TableHead>
                  <TableHead className="text-right">المصدر</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ التسجيل</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      لا توجد حجوزات متاحة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead: any) => (
                    <TableRow key={lead.id} className={lead.status === 'new' ? 'bg-red-50 hover:bg-red-100' : ''}>
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
                      <TableCell className="font-medium">{lead.fullName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${lead.phone}`} className="hover:text-primary">
                            {lead.phone}
                          </a>
                        </div>
                      </TableCell>
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{lead.offerTitle || "غير محدد"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {lead.source === 'web' ? 'موقع' : lead.source === 'phone' ? 'هاتف' : lead.source === 'manual' ? 'يدوي' : lead.source || 'غير محدد'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[lead.status as keyof typeof statusColors]}>
                          {statusLabels[lead.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString("ar-SA")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLead(lead);
                              setNewStatus(lead.status);
                              setStatusDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 ml-2" />
                            عرض التفاصيل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => {
                              const message = `مرحباً ${lead.fullName}،\n\nشكراً لاهتمامك بعرضنا الطبي. نود التواصل معك لتأكيد حجزك.\n\nالمستشفى السعودي الألماني - صنعاء`;
                              window.open(`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                            }}
                          >
                            <MessageCircle className="h-4 w-4 ml-2" />
                            واتساب
                          </Button>
                        </div>
                      </TableCell>
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
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تحديث حالة الحجز</DialogTitle>
            <DialogDescription>
              قم بتحديث حالة حجز العرض لـ {selectedLead?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>معلومات العميل</Label>
              <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedLead?.phone}</span>
                </div>
                {selectedLead?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedLead.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedLead?.offerTitle || "غير محدد"}</span>
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

            <div className="flex gap-2 justify-end">
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
