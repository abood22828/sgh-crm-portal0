/**
 * DoctorDetailPage - صفحة تفاصيل الطبيب
 * 
 * Individual doctor page with profile and appointment booking
 */
import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { ArrowRight, Calendar, Phone, Award, Loader2, CheckCircle } from "lucide-react";
import { getRegistrationSource } from "@/lib/tracking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function DoctorDetailPage() {
  const [, params] = useRoute("/doctors/:slug");
  const slug = params?.slug || "";

  const { data: doctor, isLoading } = trpc.doctors.getBySlug.useQuery(
    { slug },
    { enabled: !!slug && slug !== ":slug" }
  );
  const submitAppointment = trpc.appointments.submit.useMutation();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    age: "",
    procedure: "",
    preferredDate: "",
    preferredTime: "",
    additionalNotes: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [, setLocation] = useLocation();

  // Parse procedures from doctor data (comma-separated string)
  const availableProcedures = doctor?.procedures 
    ? doctor.procedures.split(',').map(p => p.trim()).filter(Boolean)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!doctor) {
      toast.error("لم يتم العثور على بيانات الطبيب");
      return;
    }

    try {
      await submitAppointment.mutateAsync({
        doctorId: doctor.id,
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        procedure: formData.procedure || undefined,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime || undefined,
        additionalNotes: formData.additionalNotes || undefined,
        campaignSlug: `doctor-${slug}`,
        source: getRegistrationSource(), // Auto-detect source from UTM
      });

      setSubmitted(true);
      toast.success("تم إرسال طلب الحجز بنجاح! سنتواصل معك قريباً");
      
      // Redirect to Thank You page with booking details
      const params = new URLSearchParams({
        type: 'appointment',
        name: formData.fullName,
        phone: formData.phone,
        ...(formData.email && { email: formData.email }),
        ...(doctor && { doctor: doctor.name }),
        ...(formData.preferredDate && { date: formData.preferredDate }),
        ...(formData.preferredTime && { time: formData.preferredTime }),
      });
      
      setTimeout(() => {
        setLocation(`/thank-you?${params.toString()}`);
      }, 1500);
    } catch (error) {
      toast.error("حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى");
    }
  };

  // SEO meta tags
  const seoTitle = doctor 
    ? `${doctor.name} - ${doctor.specialty} | المستشفى السعودي الألماني`
    : "الأطباء | المستشفى السعودي الألماني";
  
  const seoDescription = doctor
    ? `احجز موعدك مع ${doctor.name}، ${doctor.specialty} في المستشفى السعودي الألماني. ${doctor.bio || 'خدمات طبية متميزة ورعاية شاملة'}. اتصل الآن: 8000018`
    : "احجز موعدك مع أفضل الأطباء في المستشفى السعودي الألماني";

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">لم يتم العثور على الطبيب</h2>
            <Link href="/doctors">
              <Button className="bg-green-600 hover:bg-green-700">
                <ArrowRight className="mr-2 h-4 w-4" />
                العودة إلى قائمة الأطباء
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div dir="rtl">
      <SEO 
        title={seoTitle}
        description={seoDescription}
        image={doctor.image || "/assets/new-logo.png"}
        type="profile"
        keywords={`${doctor.name}, ${doctor.specialty}, طبيب, استشاري, صنعاء, حجز موعد`}
      />
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-white">
      <Navbar />

      {/* Back Button */}
      <div className="container mx-auto px-4 py-4">
        <Link href="/doctors">
          <Button variant="ghost" className="gap-2 hover:bg-green-50">
            <ArrowRight className="h-4 w-4" />
            العودة إلى قائمة الأطباء
          </Button>
        </Link>
      </div>

      {/* Doctor Profile Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Card className="border-2 border-green-200 shadow-lg">
            <CardContent className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Doctor Image */}
                <div className="flex justify-center md:justify-start">
                  <div className="relative">
                    <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-green-500 shadow-lg">
                      <img
                        src={doctor.image || "/images/default-doctor.jpg"}
                        alt={doctor.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-green-600 text-white rounded-full p-3 shadow-lg">
                      <Award className="h-6 w-6" />
                    </div>
                  </div>
                </div>

                {/* Doctor Info */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-green-900 mb-2">
                      {doctor.name}
                    </h1>
                    <p className="text-xl text-blue-600 font-medium">{doctor.specialty}</p>
                  </div>

                  {doctor.bio && (
                    <p className="text-gray-700 leading-relaxed text-lg">{doctor.bio}</p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    {doctor.experience && (
                      <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg">
                        <div className="bg-blue-600 p-2 rounded-lg">
                          <Award className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">الخبرة</p>
                          <p className="font-semibold text-gray-900">{doctor.experience}</p>
                        </div>
                      </div>
                    )}

                    {doctor.languages && (
                      <div className="flex items-start gap-3 bg-green-50 p-4 rounded-lg">
                        <div className="bg-green-600 p-2 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">اللغات</p>
                          <p className="font-semibold text-gray-900">{doctor.languages}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3 bg-red-50 p-4 rounded-lg">
                      <div className="bg-red-600 p-2 rounded-lg">
                        <Phone className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">للحجز والاستفسار</p>
                        <a
                          href="tel:8000018"
                          className="font-semibold text-gray-900 hover:text-green-600 text-lg"
                        >
                          8000018
                        </a>
                      </div>
                    </div>

                    {doctor.consultationFee && (
                      <div className="flex items-start gap-3 bg-purple-50 p-4 rounded-lg">
                        <div className="bg-purple-600 p-2 rounded-lg">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">رسوم الكشف</p>
                          <p className="font-semibold text-gray-900">
                            {doctor.consultationFee} ريال
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Booking Form Section */}
      <section className="py-8 pb-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-2 border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl md:text-3xl flex items-center gap-3">
                <Calendar className="h-7 w-7" />
                احجز موعدك الآن
              </CardTitle>
              <CardDescription className="text-green-100 text-base">
                املأ النموذج وسنتواصل معك لتأكيد الموعد خلال 24 ساعة
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-900 mb-2">
                    تم إرسال طلبك بنجاح!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    سنتواصل معك قريباً لتأكيد موعدك مع {doctor.name}
                  </p>
                  <Button
                    onClick={() => setSubmitted(false)}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    حجز موعد آخر
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Label htmlFor="fullName" className="text-base">
                      الاسم الكامل *
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      required
                      placeholder="أدخل اسمك الكامل"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="text-base">
                        رقم الهاتف *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        placeholder="مثال: 771234567"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="age" className="text-base">
                        العمر *
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        min="1"
                        max="150"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        required
                        placeholder="مثال: 30"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-base">
                      البريد الإلكتروني (اختياري)
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="example@email.com"
                      className="mt-1"
                    />
                  </div>

                  {availableProcedures.length > 0 && (
                    <div>
                      <Label htmlFor="procedure" className="text-base">
                        الإجراء المطلوب (اختياري)
                      </Label>
                      <Select
                        value={formData.procedure}
                        onValueChange={(value) => setFormData({ ...formData, procedure: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="اختر الإجراء المطلوب" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProcedures.map((proc, index) => (
                            <SelectItem key={index} value={proc}>
                              {proc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="preferredDate" className="text-base">
                        التاريخ المفضل *
                      </Label>
                      <Input
                        id="preferredDate"
                        type="date"
                        value={formData.preferredDate}
                        onChange={(e) =>
                          setFormData({ ...formData, preferredDate: e.target.value })
                        }
                        required
                        min={new Date().toISOString().split("T")[0]}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="preferredTime" className="text-base">
                        الوقت المفضل (اختياري)
                      </Label>
                      <Input
                        id="preferredTime"
                        type="time"
                        value={formData.preferredTime}
                        onChange={(e) =>
                          setFormData({ ...formData, preferredTime: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="additionalNotes" className="text-base">
                      ملاحظات إضافية (اختياري)
                    </Label>
                    <Textarea
                      id="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                      placeholder="أي معلومات إضافية تود إخبارنا بها (مثل: الأعراض، التاريخ المرضي، إلخ)"
                      rows={4}
                      className="mt-1"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                    disabled={submitAppointment.isPending}
                  >
                    {submitAppointment.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Calendar className="mr-2 h-5 w-5" />
                        تأكيد الحجز
                      </>
                    )}
                  </Button>

                  <p className="text-sm text-gray-600 text-center pt-2">
                    أو اتصل بنا مباشرة على{" "}
                    <a
                      href="tel:8000018"
                      className="text-green-600 font-semibold hover:underline"
                    >
                      8000018
                    </a>
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
      </div>
    </div>
  );
}
