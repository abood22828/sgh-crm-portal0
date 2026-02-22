/**
 * OfferDetailPage - صفحة تفاصيل العرض
 * 
 * Individual offer page with details and registration form
 */
import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Phone, Mail, Calendar, CheckCircle2, Loader2, Tag, Clock, Sparkles, Stethoscope, Shield, HeartPulse, MessageSquare } from "lucide-react";
import { getCompleteTrackingData } from "@/lib/tracking";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

export default function OfferDetailPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const slug = params.slug as string;

  const { data: offer, isLoading } = trpc.offers.getBySlug.useQuery(
    { slug },
    { enabled: !!slug && slug !== ":slug" }
  );
  const submitLead = trpc.offerLeads.submit.useMutation();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
  });

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

    if (!offer) return;

    try {
      const trackingData = getCompleteTrackingData();
      
      await submitLead.mutateAsync({
        offerId: offer.id,
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email || undefined,
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
    } catch (error) {
      toast.error("حدث خطأ أثناء إرسال الطلب");
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
      <div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
        <Navbar />
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-3">
            <Skeleton className="h-5 w-60" />
          </div>
        </div>
        <section className="bg-gradient-to-br from-green-600 to-blue-600 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 items-center">
              <div className="space-y-4">
                <Skeleton className="h-8 w-40 bg-white/20" />
                <Skeleton className="h-14 w-full bg-white/20" />
                <Skeleton className="h-14 w-3/4 bg-white/20" />
                <Skeleton className="h-6 w-full bg-white/20" />
                <Skeleton className="h-12 w-48 bg-white/20 rounded-lg" />
              </div>
              <Skeleton className="h-64 md:h-80 rounded-2xl bg-white/20" />
            </div>
          </div>
        </section>
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Not Found State
  if (!offer) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Tag className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">لم يتم العثور على العرض</h2>
            <p className="text-gray-500 mb-6 text-sm">
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
        <Footer />
      </div>
    );
  }

  // Calculate days remaining
  const daysRemaining = offer.endDate 
    ? Math.ceil((new Date(offer.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div dir="rtl">
      <SEO 
        title={seoTitle}
        description={seoDescription}
        image={offer.imageUrl || "/assets/new-logo.png"}
        type="article"
        keywords={`${offer.title}, عرض طبي, صنعاء, المستشفى السعودي الألماني`}
      />
      <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-green-600 transition-colors">الرئيسية</Link>
            <span>/</span>
            <Link href="/offers" className="hover:text-green-600 transition-colors">العروض</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{offer.title}</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 text-white pt-4 md:pt-8 pb-16 md:pb-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-12 items-center">
            <div>
              {/* Badge + CTA */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-3 py-1.5 rounded-full shadow-lg">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-bold">عرض خاص محدود</span>
                </div>
                <a href="#booking-form">
                  <Button 
                    size="sm"
                    className="bg-white text-green-700 hover:bg-green-50 font-bold text-sm px-4 py-2 shadow-lg"
                  >
                    احجز الآن
                  </Button>
                </a>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight">
                {offer.title}
              </h1>

              <p className="text-base md:text-lg text-white/95 leading-relaxed mb-6">
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
                        حتى {new Date(offer.endDate).toLocaleDateString("ar-EG")}
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
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              ماذا يشمل العرض
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
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
                <div key={i} className={`flex items-start gap-3 ${bgColors[item.color]} p-4 md:p-5 rounded-xl`}>
                  <div className={`${iconBgColors[item.color]} p-2 rounded-lg flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${iconColors[item.color]}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-0.5">{item.title}</h3>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      {offer.isActive && offer.endDate && new Date(offer.endDate) > new Date() && (
      <section id="booking-form" className="pb-10 md:pb-14">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Urgency Banner */}
          {daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7 && (
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 md:p-4 rounded-xl mb-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 md:h-5 md:w-5" />
                <span className="font-bold text-sm md:text-base">
                  العرض ينتهي خلال {daysRemaining} {daysRemaining === 1 ? 'يوم' : 'أيام'} - احجز الآن!
                </span>
              </div>
            </div>
          )}

          <Card className="shadow-sm border-0 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-5 md:p-6">
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <Tag className="h-5 w-5" />
                احجز العرض الآن
              </CardTitle>
              <CardDescription className="text-green-100 text-sm">
                املأ النموذج وسنتواصل معك في أقرب وقت لتأكيد الحجز
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 md:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                    الاسم الكامل <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="أدخل اسمك الكامل"
                    required
                    className="mt-1.5 h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    رقم الهاتف <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="مثال: 771234567"
                      required
                      className="mt-1.5 pr-10 h-11"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    البريد الإلكتروني (اختياري)
                  </Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="example@email.com"
                      className="mt-1.5 pr-10 h-11"
                    />
                  </div>
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
                <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs text-gray-500">
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

                <p className="text-xs text-gray-500 text-center pt-1">
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
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                العرض منتهي
              </h2>
              <p className="text-sm text-gray-500 mb-6">
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
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-8 md:py-10">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-lg md:text-xl font-bold mb-2">هل لديك استفسار؟</h3>
          <p className="text-sm md:text-base text-white/90 mb-4">تواصل معنا الآن</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="tel:8000018"
              className="inline-flex items-center gap-2 bg-white text-green-600 px-5 py-2.5 rounded-full font-bold text-sm hover:bg-gray-100 transition-colors shadow-lg"
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

      <Footer />
      </div>
    </div>
  );
}
