import { useState } from "react";
import { useLocation } from "wouter";
import { MetaPixel, trackMetaLead, trackMetaCompleteRegistration } from "@/components/MetaPixel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle2, Phone, Mail, MapPin, Calendar, Clock, Stethoscope } from "lucide-react";
import { toast } from "sonner";

export default function DoctorAppointments() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    doctorId: "",
    preferredDate: "",
    preferredTime: "",
    notes: "",
  });

  // Get UTM parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get("utm_source") || "";
  const utmMedium = urlParams.get("utm_medium") || "";
  const utmCampaign = urlParams.get("utm_campaign") || "";
  const utmContent = urlParams.get("utm_content") || "";

  // Fetch doctors list
  const { data: doctors, isLoading: doctorsLoading } = trpc.doctors.list.useQuery();

  const submitAppointment = trpc.appointments.submit.useMutation({
    onSuccess: () => {
      // Track Meta Conversion
      trackMetaCompleteRegistration({ fullName: formData.fullName, phone: formData.phone });

      toast.success("تم حجز الموعد بنجاح!");
      setLocation("/thank-you");
    },
    onError: (error: any) => {
      toast.error("حدث خطأ أثناء حجز الموعد. يرجى المحاولة مرة أخرى.");
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phone || !formData.doctorId) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    // Track Meta Lead
    trackMetaLead({ fullName: formData.fullName, phone: formData.phone });

    submitAppointment.mutate({
      ...formData,
      doctorId: parseInt(formData.doctorId),
      campaignSlug: "doctor-appointments",
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
    });
  };

  const selectedDoctor = doctors?.find((d: any) => d.id === parseInt(formData.doctorId));

  return (
    <>
      <MetaPixel pixelId="2008380493273171" />
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50" dir="rtl">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <img 
                src="/assets/logo-color.png" 
                alt="المستشفى السعودي الألماني" 
                className="h-16 md:h-20"
              />
              <div className="text-left">
                <div className="flex items-center gap-2 text-primary font-bold text-xl md:text-2xl">
                  <Phone className="w-5 h-5" />
                  <span>8000018</span>
                </div>
                <p className="text-sm text-muted-foreground">الرقم المجاني</p>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative py-12 md:py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent"></div>
          <div className="container relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                <Stethoscope className="w-5 h-5" />
                <span className="font-semibold">احجز موعدك الآن</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                احجز موعدك مع أفضل الأطباء
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                فريق طبي متميز من الاستشاريين والأخصائيين في مختلف التخصصات
              </p>
            </div>
          </div>
        </section>

        {/* Doctors Grid */}
        <section className="py-12 bg-white">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">أطباؤنا المتميزون</h2>
            
            {doctorsLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
                {doctors?.map((doctor: any) => (
                  <Card 
                    key={doctor.id} 
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      formData.doctorId === doctor.id.toString() 
                        ? 'ring-2 ring-primary shadow-lg' 
                        : ''
                    }`}
                    onClick={() => setFormData({ ...formData, doctorId: doctor.id.toString() })}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-square rounded-lg overflow-hidden mb-3">
                        <img 
                          src={doctor.image || '/assets/logo-color.png'} 
                          alt={doctor.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-bold text-sm mb-1 text-center">{doctor.name}</h3>
                      <p className="text-xs text-muted-foreground text-center">{doctor.specialty}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Booking Form */}
        <section className="py-12 bg-gradient-to-b from-white to-blue-50">
          <div className="container">
            <div className="max-w-2xl mx-auto">
              <Card className="shadow-xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl md:text-3xl">نموذج حجز الموعد</CardTitle>
                  <CardDescription className="text-base">
                    املأ البيانات التالية وسنتواصل معك لتأكيد الموعد
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Selected Doctor Display */}
                    {selectedDoctor && (
                      <div className="bg-primary/5 p-4 rounded-lg flex items-center gap-4">
                        <img 
                          src={selectedDoctor.image || '/assets/logo-color.png'} 
                          alt={selectedDoctor.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-bold">{selectedDoctor.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedDoctor.specialty}</p>
                        </div>
                      </div>
                    )}

                    {/* Doctor Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="doctor">اختر الطبيب *</Label>
                      <Select 
                        value={formData.doctorId} 
                        onValueChange={(value) => setFormData({ ...formData, doctorId: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الطبيب المطلوب" />
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

                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label htmlFor="fullName">الاسم الكامل *</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="أدخل اسمك الكامل"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="مثال: 777123456"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    {/* Preferred Date */}
                    <div className="space-y-2">
                      <Label htmlFor="preferredDate">التاريخ المفضل</Label>
                      <Input
                        id="preferredDate"
                        type="date"
                        value={formData.preferredDate}
                        onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                      />
                    </div>

                    {/* Preferred Time */}
                    <div className="space-y-2">
                      <Label htmlFor="preferredTime">الوقت المفضل</Label>
                      <Select 
                        value={formData.preferredTime} 
                        onValueChange={(value) => setFormData({ ...formData, preferredTime: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الوقت المناسب" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">صباحاً (8:00 - 12:00)</SelectItem>
                          <SelectItem value="afternoon">ظهراً (12:00 - 4:00)</SelectItem>
                          <SelectItem value="evening">مساءً (4:00 - 8:00)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes">ملاحظات إضافية</Label>
                      <Textarea
                        id="notes"
                        placeholder="أي معلومات إضافية تود إخبارنا بها..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                      />
                    </div>

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-lg"
                      disabled={submitAppointment.isPending}
                    >
                      {submitAppointment.isPending ? (
                        <>
                          <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                          جاري الحجز...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="ml-2 h-5 w-5" />
                          احجز موعدك الآن
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-12 bg-white">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">تواصل معنا</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Phone className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <h3 className="font-bold mb-2">الرقم المجاني</h3>
                    <p className="text-2xl font-bold text-primary">8000018</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Mail className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <h3 className="font-bold mb-2">البريد الإلكتروني</h3>
                    <p className="text-sm">info@sgh-sanaa.com</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <MapPin className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <h3 className="font-bold mb-2">العنوان</h3>
                    <p className="text-sm">صنعاء - شارع الستين الشمالي</p>
                    <p className="text-xs text-muted-foreground">بين جولة عمران وجولة الجمنة</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-primary text-white py-8">
          <div className="container text-center">
            <img 
              src="/assets/logo-white.png" 
              alt="المستشفى السعودي الألماني" 
              className="h-16 mx-auto mb-4"
            />
            <p className="text-lg font-semibold mb-2">نرعاكم كأهالينا</p>
            <p className="text-sm opacity-90">
              © 2025 المستشفى السعودي الألماني - صنعاء. جميع الحقوق محفوظة.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
