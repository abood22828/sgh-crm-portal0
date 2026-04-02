import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Send, RefreshCw, AlertCircle, CheckCircle, Phone } from "lucide-react";
import { toast } from "sonner";

export default function WhatsAppAppointments() {
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "confirmed" | "cancelled">("all");

  const auditStatsQuery = trpc.whatsapp.getAuditStats.useQuery();
  const sendConfirmationMutation = trpc.whatsapp.sendAppointmentConfirmation.useMutation();
  const sendReminderMutation = trpc.whatsapp.sendAppointmentReminder.useMutation();
  const sendFollowupMutation = trpc.whatsapp.sendAppointmentFollowup.useMutation();

  const appointments = [
    {
      id: 1,
      patientName: "أحمد محمد",
      phone: "967777165305",
      doctorName: "علي الأحمري",
      department: "القلب",
      appointmentTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "pending" as const,
      confirmationSent: false,
    },
    {
      id: 2,
      patientName: "فاطمة علي",
      phone: "967771234567",
      doctorName: "سارة الهاشمي",
      department: "الأسنان",
      appointmentTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: "confirmed" as const,
      confirmationSent: true,
    },
  ];

  const filteredAppointments = filterStatus === "all" ? appointments : appointments.filter((apt) => apt.status === filterStatus);

  const handleSendConfirmation = async (appointment: (typeof appointments)[0]) => {
    setIsLoading(true);
    try {
      const result = await sendConfirmationMutation.mutateAsync({
        appointmentId: appointment.id,
        phone: appointment.phone,
        patientName: appointment.patientName,
        doctorName: appointment.doctorName,
        appointmentTime: appointment.appointmentTime,
        department: appointment.department,
      });

      if (result.success) {
        toast.success("تم إرسال التأكيد بنجاح");
      } else {
        toast.error(result.error || "فشل إرسال التأكيد");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء إرسال التأكيد");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">إدارة الحجوزات عبر WhatsApp</h1>
        <p className="text-muted-foreground">إرسال التأكيدات والتذكيرات والمتابعات</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحجوزات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">الرسائل المرسلة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditStatsQuery.data?.stats?.sentMessages || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">95%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">الأخطاء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{auditStatsQuery.data?.stats?.errorCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            قائمة الحجوزات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant={filterStatus === "all" ? "default" : "outline"} onClick={() => setFilterStatus("all")} size="sm">
              الكل
            </Button>
            <Button variant={filterStatus === "pending" ? "default" : "outline"} onClick={() => setFilterStatus("pending")} size="sm">
              قيد الانتظار
            </Button>
            <Button variant={filterStatus === "confirmed" ? "default" : "outline"} onClick={() => setFilterStatus("confirmed")} size="sm">
              مؤكدة
            </Button>
          </div>

          <div className="space-y-3">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="p-4 border rounded-lg space-y-3 hover:bg-muted/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{appointment.patientName}</p>
                    <p className="text-sm text-muted-foreground">د. {appointment.doctorName} • {appointment.department}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Phone className="w-4 h-4" />
                      {appointment.phone}
                    </p>
                  </div>
                  <Badge variant={appointment.status === "pending" ? "outline" : "default"}>
                    {appointment.status === "pending" ? "قيد الانتظار" : "مؤكدة"}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4" />
                  {appointment.appointmentTime.toLocaleDateString("ar-SA")}
                  <Clock className="w-4 h-4 ml-2" />
                  {appointment.appointmentTime.toLocaleTimeString("ar-SA")}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {!appointment.confirmationSent && (
                    <Button size="sm" onClick={() => handleSendConfirmation(appointment)} disabled={isLoading}>
                      <Send className="w-4 h-4 mr-1" />
                      إرسال تأكيد
                    </Button>
                  )}

                  {appointment.status === "confirmed" && (
                    <>
                      <Button size="sm" variant="outline" disabled={isLoading}>
                        <RefreshCw className="w-4 h-4 mr-1" />
                        تذكير (24 ساعة)
                      </Button>
                      <Button size="sm" variant="outline" disabled={isLoading}>
                        <AlertCircle className="w-4 h-4 mr-1" />
                        تذكير (1 ساعة)
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
