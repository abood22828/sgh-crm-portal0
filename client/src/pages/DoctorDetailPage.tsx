/**
 * DoctorDetailPage - صفحة تفاصيل الطبيب
 * 
 * Individual doctor page with profile and appointment booking
 */
import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { ArrowRight, Calendar, Phone, Award, Loader2, CheckCircle, Star, Users, Clock, CheckCircle2, TrendingUp, Stethoscope, Globe, CreditCard, MessageSquare } from "lucide-react";
import { getCompleteTrackingData } from "@/lib/tracking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white" dir="rtl">
        <Navbar />
        <div className="container mx-auto px-4 py-4">
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="container mx-auto px-4 pb-8">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <Skeleton className="h-16 w-full" />
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex justify-center">
                  <Skeleton className="w-40 h-40 md:w-48 md:h-48 rounded-full" />
                </div>
                <div className="md:col-span-2 space-y-4">
                  <Skeleton className="h-10 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-20 w-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-20 rounded-xl" />
                    <Skeleton className="h-20 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Not Found State
  if (!doctor) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white" dir="rtl">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Stethoscope className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">لم يتم العثور على الطبيب</h2>
            <p className="text-gray-500 mb-6 text-sm">
              عذراً، لم نتمكن من العثور على الطبيب المطلوب. قد يكون الرابط غير صحيح أو تم إزالة الصفحة.
            </p>
            <Link href="/doctors">
              <Button className="bg-green-600 hover:bg-green-700 gap-2">
                <ArrowRight className="h-4 w-4" />
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
      <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-green-600 transition-colors">الرئيسية</Link>
            <span>/</span>
            <Link href="/doctors" className="hover:text-green-600 transition-colors">الأطباء</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{doctor.name}</span>
          </div>
        </div>
      </div>

      {/* Doctor Profile Section */}
      <section className="py-6 md:py-10">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Header Gradient Bar */}
            <div className="h-2 bg-gradient-to-r from-green-500 via-green-600 to-blue-500"></div>

            <div className="p-5 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-10">
                {/* Doctor Image */}
                <div className="flex justify-center md:justify-start">
                  <div className="relative">
                    <div className="w-36 h-36 md:w-48 md:h-48 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-md">
                      <img
                        src={doctor.image || "/images/default-doctor.jpg"}
                        alt={doctor.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-green-600 text-white rounded-xl p-2 shadow-md">
                      <Award className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                  </div>
                </div>

                {/* Doctor Info */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">طبيب معتمد</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                      {doctor.name}
                    </h1>
                    <p className="text-base md:text-lg text-green-600 font-medium">{doctor.specialty}</p>
                  </div>

                  {doctor.bio && (
                    <p className="text-gray-600 leading-relaxed text-sm md:text-base">{doctor.bio}</p>
                  )}

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {doctor.experience && (
                      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                        <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                          <Award className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">الخبرة</p>
                          <p className="font-semibold text-gray-900 text-sm">{doctor.experience}</p>
                        </div>
                      </div>
                    )}

                    {doctor.languages && (
                      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                        <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                          <Globe className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">اللغات</p>
                          <p className="font-semibold text-gray-900 text-sm">{doctor.languages}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                      <div className="bg-red-100 p-2 rounded-lg flex-shrink-0">
                        <Phone className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">للحجز والاستفسار</p>
                        <a href="tel:8000018" className="font-semibold text-gray-900 hover:text-green-600 text-sm">
                          8000018
                        </a>
                      </div>
                    </div>

                    {doctor.consultationFee && (
                      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                        <div className="bg-purple-100 p-2 rounded-lg flex-shrink-0">
                          <CreditCard className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">رسوم الكشف</p>
                          <p className="font-semibold text-gray-900 text-sm">{doctor.consultationFee} ريال</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <a href="#booking-form">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1.5 text-sm">
                        <Calendar className="h-3.5 w-3.5" />
                        احجز موعد
                      </Button>
                    </a>
                    <a href="tel:8000018">
                      <Button size="sm" variant="outline" className="gap-1.5 text-sm border-gray-200">
                        <Phone className="h-3.5 w-3.5" />
                        اتصل الآن
                      </Button>
                    </a>
                    <a href={`https://wa.me/9678000018?text=${encodeURIComponent(`مرحباً، أود حجز موعد مع ${doctor.name}`)}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="gap-1.5 text-sm border-gray-200 text-green-600">
                        <MessageSquare className="h-3.5 w-3.5" />
                        واتساب
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="pb-6 md:pb-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white p-4 md:p-5 rounded-xl text-center shadow-sm">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5">200+</div>
              <div className="text-xs text-gray-500">مريض سعيد</div>
            </div>
            <div className="bg-white p-4 md:p-5 rounded-xl text-center shadow-sm">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5">98%</div>
              <div className="text-xs text-gray-500">نسبة النجاح</div>
            </div>
            <div className="bg-white p-4 md:p-5 rounded-xl text-center shadow-sm">
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5">4.9</div>
              <div className="text-xs text-gray-500">تقييم المرضى</div>
            </div>
            <div className="bg-white p-4 md:p-5 rounded-xl text-center shadow-sm">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5">24/7</div>
              <div className="text-xs text-gray-500">خدمة متاحة</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="pb-6 md:pb-10">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-5 text-center">
              لماذا تختار {doctor.name}؟
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {[
                { title: "خبرة واسعة", desc: "سنوات من الخبرة في مجال التخصص", color: "green" },
                { title: "أحدث التقنيات", desc: "استخدام أحدث الأجهزة والتقنيات الطبية", color: "blue" },
                { title: "رعاية شخصية", desc: "اهتمام خاص بكل حالة على حدة", color: "purple" },
                { title: "متابعة مستمرة", desc: "متابعة دقيقة بعد العلاج لضمان أفضل النتائج", color: "orange" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 md:p-4 rounded-xl bg-gray-50">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-0.5">{item.title}</h3>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Booking Form Section */}
      <section id="booking-form" className="pb-8 md:pb-12">
        <div className="container mx-auto px-4">
          {/* Urgency Banner */}
          <div className="max-w-2xl mx-auto mb-4">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 md:p-4 rounded-xl text-center">
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 md:h-5 md:w-5" />
                <span className="font-bold text-sm md:text-base">المواعيد محدودة - احجز موعدك الآن</span>
              </div>
            </div>
          </div>

          <Card className="max-w-2xl mx-auto shadow-sm border-0 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white p-5 md:p-6">
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                احجز موعدك الآن
              </CardTitle>
              <CardDescription className="text-green-100 text-sm">
                املأ النموذج وسنتواصل معك لتأكيد الموعد خلال 24 ساعة
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 md:p-6">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="bg-green-50 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                    تم إرسال طلبك بنجاح!
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    سنتواصل معك قريباً لتأكيد موعدك مع {doctor.name}
                  </p>
                  <Button
                    onClick={() => setSubmitted(false)}
                    variant="outline"
                    className="text-sm"
                  >
                    حجز موعد آخر
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                      الاسم الكامل <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                      placeholder="أدخل اسمك الكامل"
                      className="mt-1.5 h-11"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        رقم الهاتف <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        placeholder="مثال: 771234567"
                        className="mt-1.5 h-11"
                      />
                    </div>
                    <div>
                      <Label htmlFor="age" className="text-sm font-medium text-gray-700">
                        العمر <span className="text-red-500">*</span>
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
                        className="mt-1.5 h-11"
                      />
                    </div>
                  </div>

                  {availableProcedures.length > 0 && (
                    <div>
                      <Label htmlFor="procedure" className="text-sm font-medium text-gray-700">
                        الإجراء المطلوب (اختياري)
                      </Label>
                      <Select
                        value={formData.procedure}
                        onValueChange={(value) => setFormData({ ...formData, procedure: value })}
                      >
                        <SelectTrigger className="mt-1.5 h-11">
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

                  <div>
                    <Label htmlFor="preferredDate" className="text-sm font-medium text-gray-700">
                      التاريخ المفضل <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="preferredDate"
                      type="date"
                      value={formData.preferredDate}
                      onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                      required
                      min={new Date().toISOString().split("T")[0]}
                      className="mt-1.5 h-11"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-base py-5 font-bold mt-2"
                    disabled={submitAppointment.isPending}
                  >
                    {submitAppointment.isPending ? (
                      <>
                        <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Calendar className="ml-2 h-5 w-5" />
                        تأكيد الحجز الآن
                      </>
                    )}
                  </Button>

                  {/* Trust Elements */}
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      <span>حجز آمن</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      <span>رد خلال 24 ساعة</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      <span>خدمة مميزة</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 text-center pt-1">
                    أو اتصل بنا مباشرة على{" "}
                    <a href="tel:8000018" className="text-green-600 font-semibold hover:underline">
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
