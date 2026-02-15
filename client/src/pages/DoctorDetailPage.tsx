/**
 * DoctorDetailPage - صفحة تفاصيل الطبيب
 * 
 * Individual doctor page with profile and appointment booking
 */
import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { ArrowRight, Calendar, Phone, Award, Loader2, CheckCircle, Star, Users, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { getCompleteTrackingData } from "@/lib/tracking";
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
      const trackingData = getCompleteTrackingData();
      
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
        source: trackingData.source,
        utmSource: trackingData.utmSource,
        utmMedium: trackingData.utmMedium,
        utmCampaign: trackingData.utmCampaign,
        utmTerm: trackingData.utmTerm,
        utmContent: trackingData.utmContent,
        utmPlacement: trackingData.utmPlacement,
        referrer: trackingData.referrer,
        fbclid: trackingData.fbclid,
        gclid: trackingData.gclid,
      });

      setSubmitted(true);
      toast.success("تم إرسال طلب الحجز بنجاح! سنتواصل معك قريباً");
      
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
          <Button variant="ghost" className="gap-2 hover:bg-green-50 text-sm md:text-base">
            <ArrowRight className="h-4 w-4" />
            العودة إلى قائمة الأطباء
          </Button>
        </Link>
      </div>

      {/* Enhanced Doctor Profile Section */}
      <section className="py-6 md:py-8">
        <div className="container mx-auto px-4">
          <Card className="border-2 border-green-200 shadow-2xl overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-4 md:p-6">
              <div className="flex items-center gap-3 text-white">
                <Award className="h-6 w-6 md:h-8 md:w-8" />
                <span className="text-base md:text-lg font-semibold">طبيب معتمد</span>
              </div>
            </div>

            <CardContent className="p-4 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {/* Doctor Image */}
                <div className="flex justify-center md:justify-start">
                  <div className="relative">
                    <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-green-500 shadow-xl">
                      <img
                        src={doctor.image || "/images/default-doctor.jpg"}
                        alt={doctor.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-green-600 text-white rounded-full p-2 md:p-3 shadow-lg">
                      <Award className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    {/* Rating Badge */}
                    <div className="absolute -top-2 -left-2 bg-yellow-400 text-gray-900 rounded-full px-3 py-1 md:px-4 md:py-2 shadow-lg flex items-center gap-1">
                      <Star className="h-3 w-3 md:h-4 md:w-4 fill-gray-900" />
                      <span className="font-bold text-xs md:text-sm">4.9</span>
                    </div>
                  </div>
                </div>

                {/* Doctor Info */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h1 className="text-2xl md:text-4xl font-bold text-green-900 mb-2">
                      {doctor.name}
                    </h1>
                    <p className="text-lg md:text-xl text-blue-600 font-medium">{doctor.specialty}</p>
                  </div>

                  {doctor.bio && (
                    <p className="text-gray-700 leading-relaxed text-sm md:text-lg">{doctor.bio}</p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 pt-4">
                    {doctor.experience && (
                      <div className="flex items-start gap-3 bg-blue-50 p-3 md:p-4 rounded-lg hover:shadow-md transition-shadow">
                        <div className="bg-blue-600 p-2 rounded-lg flex-shrink-0">
                          <Award className="h-4 w-4 md:h-5 md:w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs md:text-sm text-gray-600 font-medium">الخبرة</p>
                          <p className="font-semibold text-gray-900 text-sm md:text-base">{doctor.experience}</p>
                        </div>
                      </div>
                    )}

                    {doctor.languages && (
                      <div className="flex items-start gap-3 bg-green-50 p-3 md:p-4 rounded-lg hover:shadow-md transition-shadow">
                        <div className="bg-green-600 p-2 rounded-lg flex-shrink-0">
                          <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs md:text-sm text-gray-600 font-medium">اللغات</p>
                          <p className="font-semibold text-gray-900 text-sm md:text-base">{doctor.languages}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3 bg-red-50 p-3 md:p-4 rounded-lg hover:shadow-md transition-shadow">
                      <div className="bg-red-600 p-2 rounded-lg flex-shrink-0">
                        <Phone className="h-4 w-4 md:h-5 md:w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-gray-600 font-medium">للحجز والاستفسار</p>
                        <a
                          href="tel:8000018"
                          className="font-semibold text-gray-900 hover:text-green-600 text-base md:text-lg"
                        >
                          8000018
                        </a>
                      </div>
                    </div>

                    {doctor.consultationFee && (
                      <div className="flex items-start gap-3 bg-purple-50 p-3 md:p-4 rounded-lg hover:shadow-md transition-shadow">
                        <div className="bg-purple-600 p-2 rounded-lg flex-shrink-0">
                          <Calendar className="h-4 w-4 md:h-5 md:w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs md:text-sm text-gray-600 font-medium">رسوم الكشف</p>
                          <p className="font-semibold text-gray-900 text-sm md:text-base">
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

      {/* Social Proof Section */}
      <section className="py-6 md:py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 text-center">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 md:p-6 rounded-xl">
              <Users className="h-6 w-6 md:h-8 md:w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">200+</div>
              <div className="text-xs md:text-sm text-gray-600">مريض سعيد</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 md:p-6 rounded-xl">
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">98%</div>
              <div className="text-xs md:text-sm text-gray-600">نسبة النجاح</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 md:p-6 rounded-xl">
              <Star className="h-6 w-6 md:h-8 md:w-8 text-yellow-600 mx-auto mb-2 fill-yellow-600" />
              <div className="text-2xl md:text-3xl font-bold text-yellow-600 mb-1">4.9</div>
              <div className="text-xs md:text-sm text-gray-600">تقييم المرضى</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 md:p-6 rounded-xl">
              <Clock className="h-6 w-6 md:h-8 md:w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">24/7</div>
              <div className="text-xs md:text-sm text-gray-600">خدمة متاحة</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose This Doctor Section */}
      <section className="py-8 md:py-12 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-6 md:mb-8">
            لماذا تختار {doctor.name}؟
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="flex items-start gap-3 md:gap-4 bg-white p-4 md:p-6 rounded-xl shadow-md">
              <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-1 md:mb-2 text-sm md:text-base">خبرة واسعة</h3>
                <p className="text-xs md:text-sm text-gray-600">سنوات من الخبرة في مجال التخصص</p>
              </div>
            </div>
            <div className="flex items-start gap-3 md:gap-4 bg-white p-4 md:p-6 rounded-xl shadow-md">
              <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-1 md:mb-2 text-sm md:text-base">أحدث التقنيات</h3>
                <p className="text-xs md:text-sm text-gray-600">استخدام أحدث الأجهزة والتقنيات الطبية</p>
              </div>
            </div>
            <div className="flex items-start gap-3 md:gap-4 bg-white p-4 md:p-6 rounded-xl shadow-md">
              <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-1 md:mb-2 text-sm md:text-base">رعاية شخصية</h3>
                <p className="text-xs md:text-sm text-gray-600">اهتمام خاص بكل حالة على حدة</p>
              </div>
            </div>
            <div className="flex items-start gap-3 md:gap-4 bg-white p-4 md:p-6 rounded-xl shadow-md">
              <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-1 md:mb-2 text-sm md:text-base">متابعة مستمرة</h3>
                <p className="text-xs md:text-sm text-gray-600">متابعة دقيقة بعد العلاج لضمان أفضل النتائج</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Booking Form Section */}
      <section className="py-8 md:py-16 pb-12 md:pb-16 bg-white">
        <div className="container mx-auto px-4">
          {/* Urgency Banner */}
          <div className="max-w-2xl mx-auto mb-6 md:mb-8">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 md:p-6 rounded-xl text-center shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-5 w-5 md:h-6 md:w-6 animate-pulse" />
                <span className="font-bold text-base md:text-lg">المواعيد محدودة!</span>
              </div>
              <p className="text-sm md:text-base">احجز موعدك الآن - المواعيد المتاحة تنفد بسرعة</p>
            </div>
          </div>

          <Card className="max-w-2xl mx-auto border-2 border-green-200 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg p-4 md:p-6">
              <CardTitle className="text-xl md:text-3xl flex items-center gap-3">
                <Calendar className="h-6 w-6 md:h-7 md:w-7" />
                احجز موعدك الآن
              </CardTitle>
              <CardDescription className="text-green-100 text-sm md:text-base">
                املأ النموذج وسنتواصل معك لتأكيد الموعد خلال 24 ساعة
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-8">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="bg-green-100 rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-10 w-10 md:h-12 md:w-12 text-green-600" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-green-900 mb-2">
                    تم إرسال طلبك بنجاح!
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 mb-6">
                    سنتواصل معك قريباً لتأكيد موعدك مع {doctor.name}
                  </p>
                  <Button
                    onClick={() => setSubmitted(false)}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50 text-sm md:text-base"
                  >
                    حجز موعد آخر
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                  <div>
                    <Label htmlFor="fullName" className="text-sm md:text-base">
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
                      className="mt-1 text-sm md:text-base h-10 md:h-12"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="text-sm md:text-base">
                        رقم الهاتف *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        placeholder="مثال: 771234567"
                        className="mt-1 text-sm md:text-base h-10 md:h-12"
                      />
                    </div>

                    <div>
                      <Label htmlFor="age" className="text-sm md:text-base">
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
                        className="mt-1 text-sm md:text-base h-10 md:h-12"
                      />
                    </div>
                  </div>

                  {availableProcedures.length > 0 && (
                    <div>
                      <Label htmlFor="procedure" className="text-sm md:text-base">
                        الإجراء المطلوب (اختياري)
                      </Label>
                      <Select
                        value={formData.procedure}
                        onValueChange={(value) => setFormData({ ...formData, procedure: value })}
                      >
                        <SelectTrigger className="mt-1 text-sm md:text-base h-10 md:h-12">
                          <SelectValue placeholder="اختر الإجراء المطلوب" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProcedures.map((proc, index) => (
                            <SelectItem key={index} value={proc} className="text-sm md:text-base">
                              {proc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="preferredDate" className="text-sm md:text-base">
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
                      className="mt-1 text-sm md:text-base h-10 md:h-12"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-base md:text-lg py-5 md:py-6 font-bold shadow-lg hover:shadow-xl transition-all duration-300"
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
                        تأكيد الحجز الآن
                      </>
                    )}
                  </Button>

                  {/* Trust Elements */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 pt-4 text-xs md:text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>حجز آمن</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>رد خلال 24 ساعة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>خدمة مميزة</span>
                    </div>
                  </div>

                  <p className="text-xs md:text-sm text-gray-600 text-center pt-2">
                    أو اتصل بنا مباشرة على{" "}
                    <a
                      href="tel:8000018"
                      className="text-green-600 font-semibold hover:underline text-sm md:text-base"
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
