import { useState } from "react";
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
  
  // Offer specific
  const [offerId, setOfferId] = useState("");
  
  // Camp specific
  const [campId, setCampId] = useState("");
  const [age, setAge] = useState("");
  const [medicalCondition, setMedicalCondition] = useState("");

  const { data: doctors } = trpc.doctors.list.useQuery();
  const { data: offers } = trpc.offers.getAll.useQuery();
  const { data: camps } = trpc.camps.getAll.useQuery();

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
    setOfferId("");
    setCampId("");
    setAge("");
    setMedicalCondition("");
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
      source: "phone",
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
        createAppointmentMutation.mutate({
          ...baseData,
          campaignSlug: "manual",
          doctorId: parseInt(doctorId),
          preferredDate: preferredDate || undefined,
          preferredTime: preferredTime || undefined,
        });
        break;
      case "offer":
        if (!offerId) {
          toast.error("الرجاء اختيار العرض");
          return;
        }
        createOfferLeadMutation.mutate({
          ...baseData,
          offerId: parseInt(offerId),
        });
        break;
      case "camp":
        if (!campId) {
          toast.error("الرجاء اختيار المخيم");
          return;
        }
        createCampRegistrationMutation.mutate({
          ...baseData,
          campId: parseInt(campId),
          age: age ? parseInt(age) : undefined,
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
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          <PhoneIcon className="h-4 w-4" />
          تسجيل يدوي (هاتفي)
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

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أدخل الاسم الكامل"
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
              <div className="grid grid-cols-2 gap-4">
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
                        {camp.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">العمر</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="أدخل العمر"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicalCondition">الحالة الطبية</Label>
                <Textarea
                  id="medicalCondition"
                  value={medicalCondition}
                  onChange={(e) => setMedicalCondition(e.target.value)}
                  placeholder="أدخل الحالة الطبية إن وجدت"
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات إضافية</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات إضافية..."
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
