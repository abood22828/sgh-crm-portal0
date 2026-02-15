import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Phone, Mail, Calendar, CheckCircle2, Loader2, Tag, Users, Clock, Star, TrendingUp, Sparkles } from "lucide-react";
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <Loader2 className="w-12 h-12 animate-spin text-green-600" />
      </div>
    );
  }

  if (!offer) {
    return null;
  }

  // Calculate days remaining if offer has end date
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />

      {/* Enhanced Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 text-white py-16 md:py-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}></div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>

        <div className="container mx-auto px-4 relative z-10">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20 mb-6 text-sm md:text-base"
            onClick={() => setLocation("/offers")}
          >
            <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
            العودة إلى العروض
          </Button>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              {/* Special Offer Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-4 py-2 rounded-full mb-4 shadow-lg">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm md:text-base font-bold">عرض خاص محدود</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
                {offer.title}
              </h1>

              <p className="text-lg md:text-xl text-white/95 leading-relaxed mb-6">
                {offer.description}
              </p>

              {/* Offer Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6">
                {offer.startDate && offer.endDate && (
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-3 md:p-4 rounded-lg">
                    <Calendar className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0" />
                    <div className="text-sm md:text-base">
                      <div className="font-semibold">مدة العرض</div>
                      <div className="text-white/90 text-xs md:text-sm">
                        حتى {new Date(offer.endDate).toLocaleDateString("ar-EG")}
                      </div>
                    </div>
                  </div>
                )}

                {daysRemaining !== null && daysRemaining > 0 && (
                  <div className="flex items-center gap-3 bg-red-500/20 backdrop-blur-sm p-3 md:p-4 rounded-lg border-2 border-red-400/50">
                    <Clock className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0 animate-pulse" />
                    <div className="text-sm md:text-base">
                      <div className="font-semibold">متبقي</div>
                      <div className="text-white/90 text-xs md:text-sm font-bold">
                        {daysRemaining} {daysRemaining === 1 ? 'يوم' : 'أيام'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <a href="#booking-form" className="inline-block">
                <Button 
                  size="lg" 
                  className="bg-white text-green-700 hover:bg-green-50 font-bold text-base md:text-lg px-6 md:px-8 py-5 md:py-6 shadow-2xl hover:shadow-3xl transition-all duration-300 w-full sm:w-auto"
                >
                  <Tag className="ml-2 h-5 w-5 md:h-6 md:w-6" />
                  احجز العرض الآن
                </Button>
              </a>
            </div>

            {offer.imageUrl && (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/20 to-orange-400/20 rounded-2xl transform rotate-3"></div>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300">
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

      {/* Social Proof Section */}
      <section className="py-8 md:py-12 bg-white border-b-2 border-green-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
            <div className="p-4">
              <Users className="h-8 w-8 md:h-10 md:w-10 text-green-600 mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">150+</div>
              <div className="text-xs md:text-sm text-gray-600">مستفيد من العرض</div>
            </div>
            <div className="p-4">
              <TrendingUp className="h-8 w-8 md:h-10 md:w-10 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">95%</div>
              <div className="text-xs md:text-sm text-gray-600">رضا العملاء</div>
            </div>
            <div className="p-4">
              <div className="flex justify-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-4 w-4 md:h-5 md:w-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <div className="text-xs md:text-sm text-gray-600">تقييم ممتاز</div>
            </div>
            <div className="p-4">
              <Clock className="h-8 w-8 md:h-10 md:w-10 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">24/7</div>
              <div className="text-xs md:text-sm text-gray-600">خدمة متاحة</div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-6 md:mb-8">
            ماذا يشمل العرض؟
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="flex items-start gap-3 md:gap-4 bg-gradient-to-br from-green-50 to-green-100 p-4 md:p-6 rounded-xl shadow-md">
              <div className="bg-green-600 p-2 rounded-full flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1 md:mb-2 text-sm md:text-base">فحص شامل</h3>
                <p className="text-xs md:text-sm text-gray-600">فحص طبي كامل مع أحدث الأجهزة</p>
              </div>
            </div>
            <div className="flex items-start gap-3 md:gap-4 bg-gradient-to-br from-blue-50 to-blue-100 p-4 md:p-6 rounded-xl shadow-md">
              <div className="bg-blue-600 p-2 rounded-full flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1 md:mb-2 text-sm md:text-base">استشارة مجانية</h3>
                <p className="text-xs md:text-sm text-gray-600">استشارة طبية مع أفضل الأطباء</p>
              </div>
            </div>
            <div className="flex items-start gap-3 md:gap-4 bg-gradient-to-br from-purple-50 to-purple-100 p-4 md:p-6 rounded-xl shadow-md">
              <div className="bg-purple-600 p-2 rounded-full flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1 md:mb-2 text-sm md:text-base">متابعة مجانية</h3>
                <p className="text-xs md:text-sm text-gray-600">متابعة لمدة شهر بعد العلاج</p>
              </div>
            </div>
            <div className="flex items-start gap-3 md:gap-4 bg-gradient-to-br from-orange-50 to-orange-100 p-4 md:p-6 rounded-xl shadow-md">
              <div className="bg-orange-600 p-2 rounded-full flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1 md:mb-2 text-sm md:text-base">خصم حصري</h3>
                <p className="text-xs md:text-sm text-gray-600">خصم خاص على الخدمات الإضافية</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      <section id="booking-form" className="py-12 md:py-16 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Urgency Banner */}
          {daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7 && (
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 md:p-6 rounded-xl mb-6 md:mb-8 text-center shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-5 w-5 md:h-6 md:w-6 animate-pulse" />
                <span className="font-bold text-base md:text-lg">العرض ينتهي قريباً!</span>
              </div>
              <p className="text-sm md:text-base">
                متبقي {daysRemaining} {daysRemaining === 1 ? 'يوم' : 'أيام'} فقط - احجز الآن قبل فوات الأوان
              </p>
            </div>
          )}

          <Card className="shadow-2xl border-t-4 border-green-600">
            <CardContent className="p-6 md:p-8">
              <div className="text-center mb-6 md:mb-8">
                <div className="bg-gradient-to-r from-green-600 to-blue-600 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Tag className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  احجز العرض الآن
                </h2>
                <p className="text-sm md:text-base text-gray-600">
                  املأ النموذج وسنتواصل معك في أقرب وقت
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                <div>
                  <Label htmlFor="fullName" className="text-right block mb-2 text-sm md:text-base">
                    الاسم الكامل <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="أدخل اسمك الكامل"
                    required
                    className="text-right text-sm md:text-base h-11 md:h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-right block mb-2 text-sm md:text-base">
                    رقم الهاتف <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="مثال: 0500000000"
                      required
                      className="text-right pr-12 text-sm md:text-base h-11 md:h-12"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-right block mb-2 text-sm md:text-base">
                    البريد الإلكتروني (اختياري)
                  </Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="example@email.com"
                      className="text-right pr-12 text-sm md:text-base h-11 md:h-12"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-5 md:py-6 text-base md:text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={submitLead.isPending}
                >
                  {submitLead.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      احجز العرض الآن
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
                    <span>رد فوري</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>أسعار مميزة</span>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-gradient-to-br from-green-600 to-blue-600 text-white py-10 md:py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">هل لديك استفسار؟</h3>
          <p className="text-base md:text-xl mb-4 md:mb-6">تواصل معنا الآن</p>
          <a
            href="tel:8000018"
            className="inline-flex items-center gap-2 bg-white text-green-600 px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-base md:text-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            <Phone className="h-5 w-5 md:h-6 md:w-6" />
            8000018
          </a>
        </div>
      </section>

      <Footer />
      </div>
    </div>
  );
}
