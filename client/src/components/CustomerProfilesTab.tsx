/**
 * CustomerProfilesTab - تبويب ملفات العملاء الموحد
 * يعرض قائمة بجميع العملاء الفريدين مع إمكانية عرض تفاصيل كل عميل
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import Pagination, { type PageSizeValue } from "@/components/Pagination";
import TableSkeleton from "@/components/TableSkeleton";
import ActionButtons from "@/components/ActionButtons";
import {
  Users,
  Search,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  UserCheck,
  Eye,
  Clock,
  Activity,
} from "lucide-react";
import { SOURCE_LABELS, SOURCE_COLORS } from "@shared/sources";

const statusLabels: Record<string, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  booked: "تم الحجز",
  not_interested: "غير مهتم",
  no_answer: "لم يرد",
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  completed: "مكتمل",
  cancelled: "ملغي",
  attended: "حضر",
};

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  booked: "bg-green-100 text-green-800",
  not_interested: "bg-red-100 text-red-800",
  no_answer: "bg-gray-100 text-gray-800",
  pending: "bg-orange-100 text-orange-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-teal-100 text-teal-800",
  cancelled: "bg-red-100 text-red-800",
  attended: "bg-green-100 text-green-800",
};

function formatDate(date: string | Date | null | undefined) {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "-";
  }
}

function formatDateTime(date: string | Date | null | undefined) {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

export default function CustomerProfilesTab() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeValue>("100");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Debounce search
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
    setSearchTimeout(timeout);
  };

  const limit = pageSize === "all" ? 100000 : parseInt(pageSize);

  // Fetch paginated customers
  const { data: customersData, isLoading } = trpc.customers.listPaginated.useQuery({
    page: pageSize === "all" ? 1 : page,
    limit,
    searchTerm: debouncedSearch || undefined,
  });

  // Fetch customer details when selected
  const { data: customerProfile, isLoading: profileLoading } = trpc.customers.getByPhone.useQuery(
    { phone: selectedPhone || "" },
    { enabled: !!selectedPhone && detailsOpen }
  );

  const customers = customersData?.customers || [];
  const totalCustomers = customersData?.total || 0;
  const totalPages = Math.ceil(totalCustomers / limit);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">إجمالي العملاء</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            ملفات العملاء
          </CardTitle>
          <CardDescription>
            عرض جميع العملاء الموحدين عبر رقم الهاتف مع تاريخ تفاعلاتهم الكاملة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو رقم الهاتف..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <TableSkeleton rows={10} />
          ) : customers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">لا يوجد عملاء</p>
              <p className="text-sm">لم يتم العثور على عملاء مطابقين للبحث</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-right">الهاتف</TableHead>
                      <TableHead className="text-right">البريد</TableHead>
                      <TableHead className="text-right">عدد التفاعلات</TableHead>
                      <TableHead className="text-right">آخر تفاعل</TableHead>
                      <TableHead className="text-right">أول تفاعل</TableHead>
                      <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer: any, index: number) => (
                      <TableRow
                        key={customer.phone}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedPhone(customer.phone);
                          setDetailsOpen(true);
                        }}
                      >
                        <TableCell className="font-medium">
                          {(page - 1) * limit + index + 1}
                        </TableCell>
                        <TableCell className="font-medium">{customer.name || "-"}</TableCell>
                        <TableCell dir="ltr" className="text-right">
                          {customer.phone}
                        </TableCell>
                        <TableCell>{customer.email || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{customer.totalRecords}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(customer.lastSeen)}</TableCell>
                        <TableCell>{formatDate(customer.firstSeen)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPhone(customer.phone);
                                setDetailsOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <ActionButtons phoneNumber={customer.phone} size="sm" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={totalCustomers}
                itemsPerPage={limit}
                pageSize={pageSize}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Customer Profile Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              ملف العميل
            </DialogTitle>
            <DialogDescription>
              عرض تاريخ تفاعلات العميل الكاملة عبر جميع الأقسام
            </DialogDescription>
          </DialogHeader>

          {profileLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : customerProfile ? (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Customer Info Header */}
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{customerProfile.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm" dir="ltr">{customerProfile.phone}</span>
                  </div>
                  {customerProfile.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{customerProfile.email}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    إجمالي التفاعلات: <strong>{customerProfile.totalInteractions}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    أول تفاعل: {formatDate(customerProfile.firstSeen)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    آخر تفاعل: {formatDate(customerProfile.lastSeen)}
                  </span>
                </div>
                <div className="mt-2">
                  <ActionButtons phoneNumber={customerProfile.phone} size="sm" />
                </div>
              </div>

              {/* Tabs for different record types */}
              <Tabs defaultValue="appointments" className="flex-1 overflow-hidden flex flex-col">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="appointments" className="gap-1 text-xs sm:text-sm">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">مواعيد</span>
                    <Badge variant="secondary" className="text-xs">{customerProfile.appointments.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="leads" className="gap-1 text-xs sm:text-sm">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">تسجيلات</span>
                    <Badge variant="secondary" className="text-xs">{customerProfile.leads.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="offerLeads" className="gap-1 text-xs sm:text-sm">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">عروض</span>
                    <Badge variant="secondary" className="text-xs">{customerProfile.offerLeads.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="campRegistrations" className="gap-1 text-xs sm:text-sm">
                    <UserCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">مخيمات</span>
                    <Badge variant="secondary" className="text-xs">{customerProfile.campRegistrations.length}</Badge>
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto mt-4">
                  {/* Appointments Tab */}
                  <TabsContent value="appointments" className="mt-0 space-y-3">
                    {customerProfile.appointments.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">لا توجد مواعيد</p>
                    ) : (
                      customerProfile.appointments.map((apt: any) => (
                        <Card key={apt.id} className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{apt.doctorName || "طبيب غير محدد"}</span>
                                {apt.doctorSpecialty && (
                                  <Badge variant="outline" className="text-xs">{apt.doctorSpecialty}</Badge>
                                )}
                              </div>
                              {apt.procedure && (
                                <p className="text-xs text-muted-foreground">الإجراء: {apt.procedure}</p>
                              )}
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{formatDateTime(apt.createdAt)}</span>
                                {apt.source && (
                                  <Badge variant="outline" className="text-xs">
                                    {SOURCE_LABELS[apt.source] || apt.source}
                                  </Badge>
                                )}
                              </div>
                              {apt.notes && (
                                <p className="text-xs text-muted-foreground mt-1">{apt.notes}</p>
                              )}
                            </div>
                            <Badge className={`text-xs ${statusColors[apt.status] || ""}`}>
                              {statusLabels[apt.status] || apt.status}
                            </Badge>
                          </div>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  {/* Leads Tab */}
                  <TabsContent value="leads" className="mt-0 space-y-3">
                    {customerProfile.leads.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">لا توجد تسجيلات</p>
                    ) : (
                      customerProfile.leads.map((lead: any) => (
                        <Card key={lead.id} className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 flex-1">
                              <span className="font-medium text-sm">{lead.fullName}</span>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{formatDateTime(lead.createdAt)}</span>
                                {lead.source && (
                                  <Badge variant="outline" className="text-xs">
                                    {SOURCE_LABELS[lead.source] || lead.source}
                                  </Badge>
                                )}
                              </div>
                              {lead.notes && (
                                <p className="text-xs text-muted-foreground mt-1">{lead.notes}</p>
                              )}
                            </div>
                            <Badge className={`text-xs ${statusColors[lead.status] || ""}`}>
                              {statusLabels[lead.status] || lead.status}
                            </Badge>
                          </div>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  {/* Offer Leads Tab */}
                  <TabsContent value="offerLeads" className="mt-0 space-y-3">
                    {customerProfile.offerLeads.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">لا توجد حجوزات عروض</p>
                    ) : (
                      customerProfile.offerLeads.map((ol: any) => (
                        <Card key={ol.id} className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{ol.offerTitle || "عرض غير محدد"}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{formatDateTime(ol.createdAt)}</span>
                                {ol.source && (
                                  <Badge variant="outline" className="text-xs">
                                    {SOURCE_LABELS[ol.source] || ol.source}
                                  </Badge>
                                )}
                              </div>
                              {ol.notes && (
                                <p className="text-xs text-muted-foreground mt-1">{ol.notes}</p>
                              )}
                            </div>
                            <Badge className={`text-xs ${statusColors[ol.status] || ""}`}>
                              {statusLabels[ol.status] || ol.status}
                            </Badge>
                          </div>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  {/* Camp Registrations Tab */}
                  <TabsContent value="campRegistrations" className="mt-0 space-y-3">
                    {customerProfile.campRegistrations.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">لا توجد تسجيلات مخيمات</p>
                    ) : (
                      customerProfile.campRegistrations.map((cr: any) => (
                        <Card key={cr.id} className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{cr.campName || "مخيم غير محدد"}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{formatDateTime(cr.createdAt)}</span>
                                {cr.source && (
                                  <Badge variant="outline" className="text-xs">
                                    {SOURCE_LABELS[cr.source] || cr.source}
                                  </Badge>
                                )}
                              </div>
                              {cr.notes && (
                                <p className="text-xs text-muted-foreground mt-1">{cr.notes}</p>
                              )}
                            </div>
                            <Badge className={`text-xs ${statusColors[cr.status] || ""}`}>
                              {statusLabels[cr.status] || cr.status}
                            </Badge>
                          </div>
                        </Card>
                      ))
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">لم يتم العثور على بيانات العميل</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
