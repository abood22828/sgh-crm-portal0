import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Phone as PhoneIcon } from "lucide-react";
import { toast } from "sonner";

export default function ManualRegistrationForm() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [registrationType, setRegistrationType] = useState<"lead" | "appointment" | "offer" | "camp">("lead");
  
  // Form fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  
  // Appointment specific
  const [doctorId, setDoctorId] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [appointmentAge, setAppointmentAge] = useState("");
  const [appointmentProcedure, setAppointmentProcedure] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  
  // Offer specific
  const [offerId, setOfferId] = useState("");
  
  // Camp specific
  const [campId, setCampId] = useState("");
  const [campAge, setCampAge] = useState("");
  const [campProcedure, setCampProcedure] = useState("");
  const [medicalCondition, setMedicalCondition] = useState("");
  const [registrationStatus, setRegistrationStatus] = useState<"new" | "contacted" | "booked" | "not_interested" | "no_answer" | "pending" | "confirmed" | "completed" | "cancelled">("new");

  const { data: doctors } = trpc.doctors.list.useQuery();
  const { data: offers } = trpc.offers.getAll.useQuery();
  const { data: camps } = trpc.camps.getAll.useQuery();

  // Get selected doctor's procedures
  const selectedDoctor = doctors?.find((d: any) => d.id.toString() === doctorId);
  const doctorProcedures = selectedDoctor?.procedures ? selectedDoctor.procedures.split(',').map((p: string) => p.trim()).filter(Boolean) : [];

  // Get selected camp's procedures
  const selectedCamp = camps?.find((c: any) => c.id.toString() === campId);
  const campProcedures = selectedCamp?.availableProcedures ? selectedCamp.availableProcedures.split(',').map((p: string) => p.trim()).filter(Boolean) : [];

  // Reset procedure when doctor/camp changes
  useEffect(() => {
    setAppointmentProcedure("");
  }, [doctorId]);

  useEffect(() => {
    setCampProcedure("");
  }, [campId]);

  // Update registration status when registration type changes
  useEffect(() => {
    if (registrationType === 'appointment') {
      setRegistrationStatus('confirmed');
    } else if (registrationType === 'offer') {
      setRegistrationStatus('confirmed');
    } else if (registrationType === 'camp') {
      setRegistrationStatus('confirmed');
    } else {
      setRegistrationStatus('new');
    }
  }, [registrationType]);

  const createLeadMutation = trpc.leads.submit.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة العميل بنجاح");
      resetForm();
      setDialogOpen(false);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إضافة العميل");
    },
  });

  const createAppointmentMutation = trpc.appointments.submit.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الموعد بنجاح");
      resetForm();
      setDialogOpen(false);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إضافة الموعد");
    },
  });

  const createOfferLeadMutation = trpc.offerLeads.submit.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة حجز العرض بنجاح");
      resetForm();
      setDialogOpen(false);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إضافة حجز العرض");
    },
  });

  const createCampRegistrationMutation = trpc.campRegistrations.submit.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة تسجيل المخيم بنجاح");
      resetForm();
      setDialogOpen(false);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إضافة تسجيل المخيم");
    },
  });

  const resetForm = () => {
    setFullName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setDoctorId("");
    setPreferredDate("");
    setPreferredTime("");
    setAppointmentAge("");
    setAppointmentProcedure("");
    setAdditionalNotes("");
    setOfferId("");
    setCampId("");
    setCampAge("");
    setCampProcedure("");
    setMedicalCondition("");
    setRegistrationStatus("new");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !phone) {
      toast.error("الرجاء إدخال الاسم ورقم الهاتف");
      return;
    }

    const baseData = {
      fullName,
      phone,
      email: email || undefined,
      notes: notes || undefined,
      source: "manual" as const,
      status: registrationStatus as any, // Type will be validated by backend schema
    };

    switch (registrationType) {
      case "lead":
        createLeadMutation.mutate({ ...baseData, campaignSlug: "manual" });
        break;
      case "appointment":
        if (!doctorId) {
          toast.error("الرجاء اختيار الطبيب");
          return;
        }
        const parsedDoctorId = parseInt(doctorId);
        if (isNaN(parsedDoctorId)) {
          toast.error("معرف الطبيب غير صالح");
          return;
        }
        createAppointmentMutation.mutate({
          ...baseData,
          campaignSlug: "manual",
          doctorId: parsedDoctorId,
          preferredDate: preferredDate || undefined,
          preferredTime: preferredTime || undefined,
          age: appointmentAge ? parseInt(appointmentAge) : undefined,
          procedure: appointmentProcedure || undefined,
          additionalNotes: additionalNotes || undefined,
        });
        break;
      case "offer":
        if (!offerId) {
          toast.error("الرجاء اختيار العرض");
          return;
        }
        const parsedOfferId = parseInt(offerId);
        if (isNaN(parsedOfferId)) {
          toast.error("معرف العرض غير صالح");
          return;
        }
        createOfferLeadMutation.mutate({
          ...baseData,
          offerId: parsedOfferId,
        });
        break;
      case "camp":
        if (!campId) {
          toast.error("الرجاء اختيار المخيم");
          return;
        }
        const parsedCampId = parseInt(campId);
        if (isNaN(parsedCampId)) {
          toast.error("معرف المخيم غير صالح");
          return;
        }
        // Convert 'completed' to 'attended' for camp registrations
        const campStatus = registrationStatus === 'completed' ? 'attended' : registrationStatus;
        createCampRegistrationMutation.mutate({
          ...baseData,
          status: campStatus as any,
          campId: parsedCampId,
          age: campAge ? parseInt(campAge) : undefined,
          procedures: campProcedure || undefined,
          medicalCondition: medicalCondition || undefined,
        });
        break;
    }
  };

  const isPending = 
    createLeadMutation.isPending ||
    createAppointmentMutation.isPending ||
    createOfferLeadMutation.isPending ||
    createCampRegistrationMutation.isPending;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1 md:gap-2">
          <Plus className="h-3 w-3 md:h-4 md:w-4" />
          <PhoneIcon className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden md:inline">تسجيل يدوي (هاتفي)</span>
          <span className="md:hidden text-xs">تسجيل</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>تسجيل حجز يدوي</DialogTitle>
          <DialogDescription>
            إضافة حجز تم استلامه عبر الهاتف (8000018) مباشرة في النظام
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Registration Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>نوع الحجز</Label>
              <Select value={registrationType} onValueChange={(value: any) => setRegistrationType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الحجز" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">عميل عام</SelectItem>
                  <SelectItem value="appointment">موعد طبيب</SelectItem>
                  <SelectItem value="offer">حجز عرض</SelectItem>
                  <SelectItem value="camp">تسجيل مخيم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>حالة التسجيل</Label>
              <Select value={registrationStatus} onValueChange={(value: any) => setRegistrationStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  {registrationType === "lead" ? (
                    <>
                      <SelectItem value="new">جديد</SelectItem>
                      <SelectItem value="contacted">تم التواصل</SelectItem>
                      <SelectItem value="booked">تم الحجز</SelectItem>
                      <SelectItem value="not_interested">غير مهتم</SelectItem>
                      <SelectItem value="no_answer">لم يرد</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="confirmed">مؤكد</SelectItem>
                      <SelectItem value="completed">حضر/مكتمل</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أدخل الاسم الكامل"
                className="text-right"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف *</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 967xxxxxxxxx"
                className="text-right"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="text-right"
            />
          </div>

          {/* Appointment Specific Fields */}
          {registrationType === "appointment" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="doctorId">الطبيب *</Label>
                <Select value={doctorId} onValueChange={setDoctorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الطبيب" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors?.map((doctor: any) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        {doctor.name} - {doctor.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preferredDate">التاريخ المفضل</Label>
                  <Input
                    id="preferredDate"
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredTime">الوقت المفضل</Label>
                  <Input
                    id="preferredTime"
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointmentAge">العمر</Label>
                <Input
                  id="appointmentAge"
                  type="number"
                  value={appointmentAge}
                  onChange={(e) => setAppointmentAge(e.target.value)}
                  placeholder="أدخل العمر"
                  className="text-right"
                />
              </div>

              {doctorProcedures.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="appointmentProcedure">الإجراء المطلوب</Label>
                  <Select value={appointmentProcedure} onValueChange={setAppointmentProcedure}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الإجراء" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctorProcedures.map((proc: string, idx: number) => (
                        <SelectItem key={idx} value={proc}>
                          {proc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="additionalNotes">ملاحظات المريض الإضافية</Label>
                <Textarea
                  id="additionalNotes"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="أي ملاحظات من المريض..."
                  className="text-right"
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Offer Specific Fields */}
          {registrationType === "offer" && (
            <div className="space-y-2">
              <Label htmlFor="offerId">العرض *</Label>
              <Select value={offerId} onValueChange={setOfferId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر العرض" />
                </SelectTrigger>
                <SelectContent>
                  {offers?.map((offer: any) => (
                    <SelectItem key={offer.id} value={offer.id.toString()}>
                      {offer.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Camp Specific Fields */}
          {registrationType === "camp" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="campId">المخيم *</Label>
                <Select value={campId} onValueChange={setCampId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المخيم" />
                  </SelectTrigger>
                  <SelectContent>
                    {camps?.map((camp: any) => (
                      <SelectItem key={camp.id} value={camp.id.toString()}>
                        {camp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campAge">العمر</Label>
                <Input
                  id="campAge"
                  type="number"
                  value={campAge}
                  onChange={(e) => setCampAge(e.target.value)}
                  placeholder="أدخل العمر"
                  className="text-right"
                />
              </div>

              {campProcedures.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="campProcedure">الإجراء المطلوب</Label>
                  <Select value={campProcedure} onValueChange={setCampProcedure}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الإجراء" />
                    </SelectTrigger>
                    <SelectContent>
                      {campProcedures.map((proc: string, idx: number) => (
                        <SelectItem key={idx} value={proc}>
                          {proc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="medicalCondition">الحالة الطبية</Label>
                <Textarea
                  id="medicalCondition"
                  value={medicalCondition}
                  onChange={(e) => setMedicalCondition(e.target.value)}
                  placeholder="أدخل الحالة الطبية إن وجدت"
                  className="text-right"
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات الموظف</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات من الموظف..."
              className="text-right"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setDialogOpen(false);
              }}
              disabled={isPending}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ الحجز"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
