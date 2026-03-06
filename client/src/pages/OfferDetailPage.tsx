/**
 * OfferDetailPage - صفحة تفاصيل العرض
 * 
 * Individual offer page with details and registration form
 */
import { useFormatDate } from "@/hooks/useFormatDate";
import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Phone, Mail, Calendar, CheckCircle2, Loader2, Tag, Clock, Sparkles, Stethoscope, Shield, HeartPulse, MessageSquare } from "lucide-react";
import { getCompleteTrackingData } from "@/lib/tracking";
import { toast } from "sonner";

import { usePhoneFormat } from "@/hooks/usePhoneFormat";
import { usePatientStorage } from "@/hooks/usePatientStorage";

export default function OfferDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <OfferDetailContent slug={slug} />
    </div>
  );
}

function OfferDetailContent({ slug }: { slug: string }) {
  const { formatPhoneDisplay, getWhatsAppLink, getCallLink, validateYemeniPhone, processPhoneInput } = usePhoneFormat();
  const { getSavedPatientInfo, savePatientInfo } = usePatientStorage();
  const { formatDate, formatDateTime } = useFormatDate();
  const [, setLocation] = useLocation();
  const [phoneError, setPhoneError] = useState<string>("");

  const { data: offer, isLoading } = trpc.offers.getBySlug.useQuery(
    { slug },
    { enabled: !!slug && slug !== ":slug" }
  );
  const submitLead = trpc.offerLeads.submit.useMutation();

  const savedInfo = getSavedPatientInfo();
  const [formData, setFormData] = useState({
    fullName: savedInfo?.fullName || "",
    phone: savedInfo?.phone || "",
    email: "",
    age: "",
    gender: (savedInfo?.gender || "") as "male" | "female" | "",
    patientMessage: "",
  });
  const [genderError, setGenderError] = useState<string>("");

  useEffect(() => {
    if (!isLoading && !offer) {
      toast.error("العرض غير موجود");
      setLocation("/offers");
    }
  }, [offer, isLoading, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phone) {
      toast.error("الرجاء إدخال الاسم ورقم الهاتف");
      return;
    }

    if (!formData.gender) {
      setGenderError("الرجاء تحديد الجنس");
      toast.error("الرجاء تحديد الجنس");
      return;
    }
    setGenderError("");

    if (!formData.age || isNaN(Number(formData.age)) || Number(formData.age) < 1 || Number(formData.age) > 120) {
      toast.error("الرجاء إدخال عمر صحيح");
      return;
    }

    // التحقق من رقم الهاتف اليمني
    const phoneValidation = validateYemeniPhone(formData.phone);
    if (!phoneValidation.valid) {
      setPhoneError(phoneValidation.message || "رقم الهاتف غير صحيح");
      toast.error(phoneValidation.message || "رقم الهاتف غير صحيح");
      return;
    }
    setPhoneError("");

    if (!offer) return;

    try {
      const trackingData = getCompleteTrackingData();
      
      // حفظ بيانات المريض في localStorage بعد الإرسال الناجح
      savePatientInfo({
        fullName: formData.fullName,
        phone: formData.phone,
        gender: formData.gender || undefined,
      });

      await submitLead.mutateAsync({
        offerId: offer.id,
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email || undefined,
        age: formData.age ? Number(formData.age) : undefined,
        gender: formData.gender as "male" | "female",
        patientMessage: formData.patientMessage || undefined,
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

      toast.success("تم إرسال طلبك بنجاح! سنتواصل معك قريباً");
      
      const params = new URLSearchParams({
        type: 'offer',
        name: formData.fullName,
        phone: formData.phone,
        ...(formData.email && { email: formData.email }),
        ...(offer && { offer: offer.title }),
      });
      
      setTimeout(() => {
        setLocation(`/thank-you?${params.toString()}`);
      }, 1500);
    } catch (error: unknown) {
      const msg = (error as { message?: string })?.message;
      if (msg && (msg.includes("تكرار") || msg.includes("طلب"))) {
        toast.error(msg);
      } else {
        toast.error("حدث خطأ أثناء إرسال الطلب");
      }
    }
  };

  const seoTitle = offer 
    ? `${offer.title} | المستشفى السعودي الألماني`
    : "العروض الطبية | المستشفى السعودي الألماني";
  
  const seoDescription = offer
    ? `${(offer.description || offer.title).substring(0, 150)}... احجز الآن واستفد من عرضنا الخاص. اتصل: 8000018`
    : "عروض طبية مميزة بأسعار تنافسية في المستشفى السعودي الألماني";

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="bg-white dark:bg-card border-b">
          <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
            <Skeleton className="h-4 sm:h-5 w-48 sm:w-60" />
          </div>
        </div>
        <section className="bg-gradient-to-br from-green-600 to-blue-600 py-8 sm:py-16 md:py-24">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 items-center">
              <div className="space-y-3 sm:space-y-4">
                <Skeleton className="h-6 sm:h-8 w-32 sm:w-40 bg-white/20" />
                <Skeleton className="h-10 sm:h-14 w-full bg-white/20" />
                <Skeleton className="h-10 sm:h-14 w-3/4 bg-white/20" />
                <Skeleton className="h-5 sm:h-6 w-full bg-white/20" />
                <Skeleton className="h-10 sm:h-12 w-40 sm:w-48 bg-white/20 rounded-lg" />
              </div>
              <Skeleton className="h-48 sm:h-64 md:h-80 rounded-2xl bg-white/20" />
            </div>
          </div>
        </section>
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 sm:h-28 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!offer) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Tag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">لم يتم العثور على العرض</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              عذراً، لم نتمكن من العثور على العرض المطلوب. قد يكون العرض منتهياً أو الرابط غير صحيح.
            </p>
            <Link href="/offers">
              <Button className="bg-green-600 hover:bg-green-700 gap-2">
                <ArrowRight className="h-4 w-4" />
                تصفح العروض المتاحة
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate days remaining
  const daysRemaining = offer.endDate 
    ? Math.ceil((new Date(offer.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6" dir="rtl">

      {/* Breadcrumb */}
      <div className="bg-white dark:bg-card border-b">
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
            <Link href="/" className="hover:text-green-600 transition-colors">الرئيسية</Link>
            <span>/</span>
            <Link href="/offers" className="hover:text-green-600 transition-colors">العروض</Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-[120px] sm:max-w-[200px]">{offer.title}</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 text-white pt-4 sm:pt-6 md:pt-8 pb-8 sm:pb-16 md:pb-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}></div>
        </div>

        <div className="container mx-auto px-3 sm:px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-12 items-center">
            <div>
              {/* Badge + CTA */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-foreground px-3 py-1.5 rounded-full shadow-lg">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-bold">عرض خاص محدود</span>
                </div>
                <a href="#booking-form">
                  <Button 
                    size="sm"
                    className="bg-white dark:bg-card text-green-700 hover:bg-green-50 font-bold text-sm px-4 py-2 shadow-lg"
                  >
                    احجز الآن
                  </Button>
                </a>
              </div>

              <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 md:mb-6 leading-tight">
                {offer.title}
              </h1>

              <p className="text-xs sm:text-base md:text-lg text-white/95 leading-relaxed mb-4 sm:mb-6">
                {offer.description}
              </p>

              {/* Offer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {offer.startDate && offer.endDate && (
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                    <Calendar className="h-5 w-5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-semibold">مدة العرض</div>
                      <div className="text-white/90 text-xs">
                        حتى {formatDate(offer.endDate)}
                      </div>
                    </div>
                  </div>
                )}

                {daysRemaining !== null && daysRemaining > 0 && (
                  <div className="flex items-center gap-3 bg-red-500/20 backdrop-blur-sm p-3 rounded-lg border border-red-400/30">
                    <Clock className="h-5 w-5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-semibold">متبقي</div>
                      <div className="text-white/90 text-xs font-bold">
                        {daysRemaining} {daysRemaining === 1 ? 'يوم' : 'أيام'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {offer.imageUrl && (
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={offer.imageUrl}
                    alt={offer.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="py-6 sm:py-10 md:py-14">
        <div className="container mx-auto px-3 sm:px-4 max-w-5xl">
          <div className="text-center mb-4 sm:mb-6 md:mb-8">
            <h2 className="text-base sm:text-xl md:text-2xl font-bold text-foreground">
              ماذا يشمل العرض
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
            {[
              { icon: Stethoscope, title: "فحص شامل", desc: "فحص طبي كامل مع أحدث الأجهزة", color: "green" },
              { icon: HeartPulse, title: "استشارة مجانية", desc: "استشارة طبية مع أفضل الأطباء", color: "blue" },
              { icon: Shield, title: "متابعة مجانية", desc: "متابعة لمدة شهر بعد العلاج", color: "purple" },
              { icon: Tag, title: "خصم حصري", desc: "خصم خاص على الخدمات الإضافية", color: "orange" },
            ].map((item, i) => {
              const Icon = item.icon;
              const bgColors: Record<string, string> = {
                green: "bg-green-50",
                blue: "bg-blue-50",
                purple: "bg-purple-50",
                orange: "bg-orange-50"
              };
              const iconBgColors: Record<string, string> = {
                green: "bg-green-100",
                blue: "bg-blue-100",
                purple: "bg-purple-100",
                orange: "bg-orange-100"
              };
              const iconColors: Record<string, string> = {
                green: "text-green-600",
                blue: "text-blue-600",
                purple: "text-purple-600",
                orange: "text-orange-600"
              };
              return (
                <div key={i} className={`flex items-start gap-2.5 sm:gap-3 ${bgColors[item.color]} p-3 sm:p-4 md:p-5 rounded-xl`}>
                  <div className={`${iconBgColors[item.color]} p-1.5 sm:p-2 rounded-lg flex-shrink-0`}>
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColors[item.color]}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-xs sm:text-sm mb-0.5">{item.title}</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      {offer.isActive && offer.endDate && new Date(offer.endDate) > new Date() && (
      <section id="booking-form" className="pb-6 sm:pb-10 md:pb-14">
        <div className="container mx-auto px-3 sm:px-4 max-w-2xl">
          {/* Urgency Banner */}
          {daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7 && (
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-2.5 sm:p-3 md:p-4 rounded-xl mb-3 sm:mb-4 text-center">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                <span className="font-bold text-xs sm:text-sm md:text-base">
                  العرض ينتهي خلال {daysRemaining} {daysRemaining === 1 ? 'يوم' : 'أيام'} - احجز الآن!
                </span>
              </div>
            </div>
          )}

          <Card className="shadow-sm border-0 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 sm:p-5 md:p-6">
              <CardTitle className="text-base sm:text-lg md:text-xl flex items-center gap-1.5 sm:gap-2">
                <Tag className="h-4 w-4 sm:h-5 sm:w-5" />
                احجز العرض الآن
              </CardTitle>
              <CardDescription className="text-green-100 text-xs sm:text-sm">
                املأ النموذج وسنتواصل معك في أقرب وقت لتأكيد الحجز
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                    الاسم الكامل <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    name="name"
                    autoComplete="name"
                    enterKeyHint="next"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="أدخل اسمك الكامل"
                    required
                    className="mt-1.5 h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                    رقم الهاتف <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="tel"
                      type="tel"
                      autoComplete="tel-national"
                      enterKeyHint="next"
                      value={formData.phone}
                      onChange={(e) => {
                        const processed = processPhoneInput(e.target.value);
                        setFormData({ ...formData, phone: processed });
                        if (phoneError) {
                          const v = validateYemeniPhone(processed);
                          setPhoneError(v.valid ? "" : (v.message || ""));
                        }
                      }}
                      onBlur={() => {
                        if (formData.phone) {
                          const v = validateYemeniPhone(formData.phone);
                          setPhoneError(v.valid ? "" : (v.message || ""));
                        }
                      }}
                      placeholder="مثال: 771234567"
                      required
                      className={`mt-1.5 pr-10 h-11 ${phoneError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      dir="ltr"
                      inputMode="numeric"
                    />
                  </div>
                  {phoneError && (
                    <p className="text-red-500 text-xs mt-1">{phoneError}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    البريد الإلكتروني (اختياري)
                  </Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      enterKeyHint="next"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="example@email.com"
                      className="mt-1.5 pr-10 h-11"
                    />
                  </div>
                </div>

                {/* حقل العمر */}
                <div>
                  <Label htmlFor="age" className="text-sm font-medium text-foreground">
                    العمر <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    autoComplete="off"
                    enterKeyHint="next"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="مثال: 35"
                    min={1}
                    max={120}
                    required
                    className="mt-1.5 h-11"
                    dir="ltr"
                    inputMode="numeric"
                  />
                </div>

                {/* حقل الجنس - إلزامي */}
                <div>
                  <Label className="text-sm font-medium text-foreground">
                    الجنس <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3 mt-1.5">
                    <button
                      type="button"
                      onClick={() => { setFormData({ ...formData, gender: "male" }); setGenderError(""); }}
                      className={`h-11 rounded-lg border-2 text-sm font-medium transition-colors ${
                        formData.gender === "male"
                          ? "border-green-600 bg-green-50 text-green-700"
                          : genderError
                          ? "border-red-500 bg-background text-foreground"
                          : "border-border bg-background text-foreground hover:border-green-400"
                      }`}
                    >
                      ذكر
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFormData({ ...formData, gender: "female" }); setGenderError(""); }}
                      className={`h-11 rounded-lg border-2 text-sm font-medium transition-colors ${
                        formData.gender === "female"
                          ? "border-pink-500 bg-pink-50 text-pink-700"
                          : genderError
                          ? "border-red-500 bg-background text-foreground"
                          : "border-border bg-background text-foreground hover:border-pink-400"
                      }`}
                    >
                      أنثى
                    </button>
                  </div>
                  {genderError && <p className="text-red-500 text-xs mt-1">{genderError}</p>}
                </div>

                {/* حقل الرسالة الاختياري */}
                <div>
                  <Label htmlFor="patientMessage" className="text-sm font-medium text-foreground">
                    رسالة أو ملاحظة (اختياري)
                  </Label>
                  <textarea
                    id="patientMessage"
                    name="patientMessage"
                    value={formData.patientMessage}
                    onChange={(e) => setFormData({ ...formData, patientMessage: e.target.value })}
                    placeholder="أي معلومات إضافية تودّ إضافتها..."
                    maxLength={500}
                    rows={3}
                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-left" dir="ltr">{formData.patientMessage.length}/500</p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-base py-5 font-bold mt-2"
                  disabled={submitLead.isPending}
                >
                  {submitLead.isPending ? (
                    <>
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="ml-2 h-5 w-5" />
                      احجز العرض الآن
                    </>
                  )}
                </Button>

                {/* Trust Elements */}
                <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    <span>حجز آمن</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    <span>رد فوري</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    <span>أسعار مميزة</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center pt-1">
                  أو اتصل بنا مباشرة على{" "}
                  <a href="tel:8000018" className="text-green-600 font-semibold hover:underline">
                    8000018
                  </a>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
      )}

      {/* Expired Offer Message */}
      {!offer.isActive && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="bg-white dark:bg-card rounded-2xl shadow-sm p-6 md:p-8 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                العرض منتهي
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                هذا العرض قد انتهى ولا يمكن الحجز فيه حالياً. تابعنا للحصول على آخر التحديثات عن العروض القادمة.
              </p>
              <Button
                onClick={() => setLocation('/offers')}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                تصفح العروض الأخرى
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-6 sm:py-8 md:py-10">
        <div className="container mx-auto px-3 sm:px-4 text-center">
          <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1.5 sm:mb-2">هل لديك استفسار؟</h3>
          <p className="text-xs sm:text-sm md:text-base text-white/90 mb-3 sm:mb-4">تواصل معنا الآن</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="tel:8000018"
              className="inline-flex items-center gap-2 bg-white dark:bg-card text-green-600 px-5 py-2.5 rounded-full font-bold text-sm hover:bg-muted transition-colors shadow-lg"
            >
              <Phone className="h-4 w-4" />
              8000018
            </a>
            <a
              href={`https://wa.me/9678000018?text=${encodeURIComponent('مرحباً، أود الاستفسار عن العرض')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-white/20 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              واتساب
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
