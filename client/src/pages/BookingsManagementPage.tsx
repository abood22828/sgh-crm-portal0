import { useFormatDate } from "@/hooks/useFormatDate";
import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import OfferLeadsManagement from "@/components/OfferLeadsManagement";
import CampRegistrationsManagement from "@/components/CampRegistrationsManagement";
import CustomerProfilesTab from "@/components/CustomerProfilesTab";
import ManualRegistrationForm from "@/components/ManualRegistrationForm";
import LeadsTab from "@/components/LeadsTab";
import AppointmentsTab from "@/components/AppointmentsTab";
import TasksSection from "@/components/TasksSection";
import CommentsSection from "@/components/CommentsSection";
import AuditLogSection from "@/components/AuditLogSection";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  Plus,
  BarChart3,
  CheckSquare,
} from "lucide-react";
import { toast } from "sonner";
import { useFilterUtils } from "@/hooks/useFilterUtils";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { SOURCE_LABELS } from "@shared/sources";

export default function BookingsManagementPage() {
  const { formatDate, formatDateTime } = useFormatDate();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"leads" | "appointments" | "offerLeads" | "campRegistrations" | "tasks" | "customers">("leads");

  // === Lead Status Dialog State ===
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");

  // === Appointment Status Dialog State ===
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [appointmentStatusDialogOpen, setAppointmentStatusDialogOpen] = useState(false);
  const [newAppointmentStatus, setNewAppointmentStatus] = useState("");
  const [appointmentStatusNotes, setAppointmentStatusNotes] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");

  // === Manual Registration Dialog ===
  const [manualRegistrationOpen, setManualRegistrationOpen] = useState(false);

  // === Pending counts from child components ===
  const [offerLeadsPendingCount, setOfferLeadsPendingCount] = useState(0);
  const [campRegistrationsPendingCount, setCampRegistrationsPendingCount] = useState(0);

  // === Filter state ===
  const leadsFilter = useFilterUtils<any>({
    data: undefined,
    searchFields: [],
  });
  const appointmentFilter = useFilterUtils<any>();
  const dateRange = appointmentFilter.filters.dateRange;
  const setDateRange = appointmentFilter.filters.setDateRange;

  // === Data queries for pending counts ===
  const { data: unifiedLeads, refetch: refetchLeads } = trpc.leads.list.useQuery();
  const { data: appointmentsData } = trpc.appointments.listPaginated.useQuery({
    page: 1,
    limit: 1,
    dateFrom: dateRange.from.toISOString(),
    dateTo: dateRange.to.toISOString(),
  });
  const { data: offerLeadsData } = trpc.offerLeads.list.useQuery();
  const { data: campRegistrationsData } = trpc.campRegistrations.list.useQuery();

  // Handle query parameters for direct navigation from notifications
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const type = params.get('type');
    const tab = params.get('tab');

    if (id && type) {
      if (type === 'appointment') setActiveTab('appointments');
      else if (type === 'offer') setActiveTab('offerLeads');
      else if (type === 'camp') setActiveTab('campRegistrations');
      window.history.replaceState({}, '', '/dashboard/bookings');
    } else if (tab) {
      if (tab === 'appointments' || tab === 'offerLeads' || tab === 'campRegistrations' || tab === 'leads') {
        setActiveTab(tab as any);
      }
      window.history.replaceState({}, '', '/dashboard/bookings');
    }
  }, [location]);

  const pendingCounts = useMemo(() => {
    const leadsPending = unifiedLeads?.filter(l => l.status === 'new').length || 0;
    const appointmentsPending = appointmentsData?.total || 0;
    const offerLeadsPending = offerLeadsData?.filter((o: any) => o.status === 'pending').length || offerLeadsPendingCount;
    const campRegistrationsPending = campRegistrationsData?.filter((c: any) => c.status === 'pending').length || campRegistrationsPendingCount;
    return {
      leads: leadsPending,
      appointments: appointmentsPending > 0 ? 0 : 0, // Count from actual data
      offerLeads: offerLeadsPending,
      campRegistrations: campRegistrationsPending,
    };
  }, [unifiedLeads, appointmentsData, offerLeadsData, campRegistrationsData, offerLeadsPendingCount, campRegistrationsPendingCount]);

  // === Lead Status Update ===
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

  // === Appointment Status Update ===
  const updateAppointmentStatusMutation = trpc.appointments.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة الموعد بنجاح");
      utils.appointments.listPaginated.invalidate();
      setAppointmentStatusDialogOpen(false);
      setSelectedAppointment(null);
      setNewAppointmentStatus("");
      setAppointmentStatusNotes("");
      setAppointmentDate("");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الحالة");
    },
  });

  const handleStatusUpdate = () => {
    if (!selectedLead || !newStatus) return;
    updateStatusMutation.mutate({
      id: selectedLead.id,
      status: newStatus as "new" | "contacted" | "booked" | "not_interested" | "no_answer",
      notes: statusNotes,
    });
  };

  const handleAppointmentStatusUpdate = () => {
    if (!selectedAppointment || !newAppointmentStatus) return;
    updateAppointmentStatusMutation.mutate({
      id: selectedAppointment.id,
      status: newAppointmentStatus,
      staffNotes: appointmentStatusNotes,
    });
  };

  const openLeadStatusDialog = (lead: any) => {
    setSelectedLead(lead);
    setNewStatus(lead.status || "new");
    setStatusNotes("");
    setStatusDialogOpen(true);
  };

  const openAppointmentDialog = (appointment: any) => {
    setSelectedAppointment(appointment);
    setNewAppointmentStatus(appointment.status);
    setAppointmentDate(appointment.appointmentDate);
    setAppointmentStatusDialogOpen(true);
  };

  return (
    <DashboardLayout
      pageTitle="إدارة الحجوزات"
      pageDescription="إدارة ومتابعة جميع الحجوزات والمواعيد"
    >
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 space-y-4 sm:space-y-6" dir="rtl">
        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => setLocation('/dashboard/camp-stats')}
              variant="outline"
              className="gap-2"
              size="sm"
            >
              <BarChart3 className="h-4 w-4" />
              إحصائيات المخيمات
            </Button>
            <Button
              onClick={() => setManualRegistrationOpen(true)}
              className="gap-2"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              تسجيل يدوي
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pt-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <Button
            variant={activeTab === "leads" ? "default" : "outline"}
            onClick={() => setActiveTab("leads")}
            className="flex-shrink-0 gap-2 relative"
          >
            <Users className="h-4 w-4" />
            تسجيلات العملاء
            {pendingCounts.leads > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -left-2 h-6 w-6 flex items-center justify-center p-0 text-xs font-bold rounded-full shadow-lg">
                {pendingCounts.leads}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === "appointments" ? "default" : "outline"}
            onClick={() => setActiveTab("appointments")}
            className="flex-shrink-0 gap-2 relative"
          >
            <Calendar className="h-4 w-4" />
            مواعيد الأطباء
          </Button>
          <Button
            variant={activeTab === "offerLeads" ? "default" : "outline"}
            onClick={() => setActiveTab("offerLeads")}
            className="flex-shrink-0 gap-2 relative"
          >
            <TrendingUp className="h-4 w-4" />
            حجوزات العروض
            {pendingCounts.offerLeads > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -left-2 h-6 w-6 flex items-center justify-center p-0 text-xs font-bold rounded-full shadow-lg">
                {pendingCounts.offerLeads}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === "campRegistrations" ? "default" : "outline"}
            onClick={() => setActiveTab("campRegistrations")}
            className="flex-shrink-0 gap-2 relative"
          >
            <UserCheck className="h-4 w-4" />
            تسجيلات المخيمات
            {pendingCounts.campRegistrations > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -left-2 h-6 w-6 flex items-center justify-center p-0 text-xs font-bold rounded-full shadow-lg">
                {pendingCounts.campRegistrations}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === "customers" ? "default" : "outline"}
            onClick={() => setActiveTab("customers")}
            className="flex-shrink-0 gap-2"
          >
            <Users className="h-4 w-4" />
            ملفات العملاء
          </Button>
          <Button
            variant={activeTab === "tasks" ? "default" : "outline"}
            onClick={() => setActiveTab("tasks")}
            className="flex-shrink-0 gap-2"
          >
            <CheckSquare className="h-4 w-4" />
            المهام
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === "leads" && (
          <LeadsTab
            leadsFilter={leadsFilter}
            onOpenStatusDialog={openLeadStatusDialog}
            pendingCount={pendingCounts.leads}
          />
        )}

        {activeTab === "appointments" && (
          <AppointmentsTab
            appointmentFilter={appointmentFilter}
            dateRange={dateRange}
            onOpenAppointmentDialog={openAppointmentDialog}
          />
        )}

        {activeTab === "offerLeads" && (
          <OfferLeadsManagement
            onPendingCountChange={setOfferLeadsPendingCount}
            dateRange={dateRange}
          />
        )}

        {activeTab === "campRegistrations" && (
          <CampRegistrationsManagement
            onPendingCountChange={setCampRegistrationsPendingCount}
            dateRange={dateRange}
          />
        )}

        {activeTab === "customers" && (
          <CustomerProfilesTab />
        )}

        {activeTab === "tasks" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  جميع المهام
                </CardTitle>
                <CardDescription>
                  عرض وإدارة جميع المهام من كل الأقسام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TasksSection
                  entityType="all"
                  entityId={0}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Update Lead Status Dialog */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تحديث حالة العميل</DialogTitle>
              <DialogDescription>
                قم بتحديث حالة العميل وإضافة ملاحظات إذا لزم الأمر
              </DialogDescription>
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
                    {formatDateTime(selectedLead.createdAt)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>الحالة الجديدة</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                  <Button onClick={handleStatusUpdate} disabled={!newStatus}>
                    تحديث
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Update Appointment Status Dialog */}
        <Dialog open={appointmentStatusDialogOpen} onOpenChange={setAppointmentStatusDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>تحديث حالة الموعد</DialogTitle>
              <DialogDescription>
                قم بتحديث حالة الموعد وإضافة ملاحظات إذا لزم الأمر
              </DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col">
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
                    <TabsTrigger value="info" className="text-xs sm:text-sm">معلومات الموعد</TabsTrigger>
                    <TabsTrigger value="comments" className="text-xs sm:text-sm">التعليقات</TabsTrigger>
                    <TabsTrigger value="tasks" className="text-xs sm:text-sm">المهام</TabsTrigger>
                    <TabsTrigger value="history" className="text-xs sm:text-sm">سجل التغييرات</TabsTrigger>
                  </TabsList>

                  <div className="flex-1 overflow-y-auto mt-4">
                    <TabsContent value="info" className="space-y-4 mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-sm"><span className="font-medium">المريض:</span> {selectedAppointment.patientName}</p>
                          <p className="text-sm"><span className="font-medium">الهاتف:</span> {selectedAppointment.phone}</p>
                          {selectedAppointment.email && (
                            <p className="text-sm"><span className="font-medium">البريد:</span> {selectedAppointment.email}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm"><span className="font-medium">الطبيب:</span> {selectedAppointment.doctorName}</p>
                          <p className="text-sm"><span className="font-medium">التخصص:</span> {selectedAppointment.doctorSpecialty}</p>
                          {selectedAppointment.procedure && (
                            <p className="text-sm"><span className="font-medium">الإجراء:</span> {selectedAppointment.procedure}</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">المصدر:</span>{' '}
                          {(selectedAppointment as any).source ? SOURCE_LABELS[(selectedAppointment as any).source] || (selectedAppointment as any).source : '-'}
                        </p>
                        {selectedAppointment.patientNotes && (
                          <p className="text-sm"><span className="font-medium">ملاحظات المريض:</span> {selectedAppointment.patientNotes}</p>
                        )}
                        <p className="text-sm">
                          <span className="font-medium">تاريخ التسجيل:</span>{' '}
                          {formatDateTime(selectedAppointment.createdAt)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>الحالة الجديدة</Label>
                        <Select value={newAppointmentStatus} onValueChange={setNewAppointmentStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
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
                        <Input
                          type="date"
                          value={appointmentDate ? new Date(appointmentDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => setAppointmentDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>ملاحظات (اختياري)</Label>
                        <Textarea
                          placeholder="أضف ملاحظات..."
                          value={appointmentStatusNotes}
                          onChange={(e) => setAppointmentStatusNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="comments" className="mt-0">
                      <CommentsSection
                        entityType="appointment"
                        entityId={selectedAppointment.id}
                      />
                    </TabsContent>

                    <TabsContent value="tasks" className="mt-0">
                      <TasksSection
                        entityType="appointment"
                        entityId={selectedAppointment.id}
                      />
                    </TabsContent>

                    <TabsContent value="history" className="mt-0">
                      <AuditLogSection
                        entityType="appointment"
                        entityId={selectedAppointment.id}
                      />
                    </TabsContent>
                  </div>
                </Tabs>

                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAppointmentStatusDialogOpen(false);
                      setSelectedAppointment(null);
                      setNewAppointmentStatus("");
                      setAppointmentStatusNotes("");
                      setAppointmentDate("");
                    }}
                  >
                    إلغاء
                  </Button>
                  <Button onClick={handleAppointmentStatusUpdate} disabled={!newAppointmentStatus}>
                    تحديث
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Manual Registration Dialog */}
        <Dialog open={manualRegistrationOpen} onOpenChange={setManualRegistrationOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تسجيل يدوي</DialogTitle>
              <DialogDescription>
                قم بإضافة تسجيل جديد يدوياً
              </DialogDescription>
            </DialogHeader>
            <ManualRegistrationForm />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
