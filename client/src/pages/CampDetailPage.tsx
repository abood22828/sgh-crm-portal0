/**
 * CampDetailPage - صفحة تفاصيل المخيم الطبي
 * 
 * Individual camp page with details, gallery, and registration form
 */
import { useFormatDate } from "@/hooks/useFormatDate";
import { useEffect, useState, useMemo } from "react";
import { useParams, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Phone, Calendar, MapPin, Loader2, Heart, Users, CheckCircle2, Clock, Star, MessageSquare, Tag, ChevronDown, ChevronUp } from "lucide-react";
import { getCompleteTrackingData } from "@/lib/tracking";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { usePhoneFormat } from "@/hooks/usePhoneFormat";

export default function CampDetailPage() {
  const { formatPhoneDisplay, getWhatsAppLink, getCallLink } = usePhoneFormat();
  const { formatDate, formatDateTime } = useFormatDate();
  const params = useParams();
  const [, setLocation] = useLocation();
  const slug = params.slug as string;

  const { data: camp, isLoading } = trpc.camps.getBySlug.useQuery(
    { slug },
    { enabled: !!slug && slug !== ":slug" }
  );
  const submitRegistration = trpc.campRegistrations.submit.useMutation();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    age: "",
    procedures: [] as string[],
  });
  const [showAllFreeOffers, setShowAllFreeOffers] = useState(false);
  const [showAllDiscountedOffers, setShowAllDiscountedOffers] = useState(false);
  const [showProcedures, setShowProcedures] = useState(false);

  // Get available procedures from camp data
  const availableProcedures = useMemo(() => {
    if (!camp?.availableProcedures) return [];
    try {
      const parsed = JSON.parse(camp.availableProcedures);
      if (Array.isArray(parsed)) return parsed;
      return camp.availableProcedures.split('\n').filter((p: string) => p.trim());
    } catch {
      return camp.availableProcedures.split('\n').filter((p: string) => p.trim());
    }
  }, [camp]);

  useEffect(() => {
    if (!isLoading && !camp) {
      toast.error("المخيم غير موجود");
      setLocation("/camps");
    }
  }, [camp, isLoading, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phone) {
      toast.error("الرجاء إدخال الاسم ورقم الهاتف");
      return;
    }

    if (!formData.age || parseInt(formData.age) <= 0) {
      toast.error("الرجاء إدخال العمر بشكل صحيح");
      return;
    }

    if (!camp) return;

    try {
      const trackingData = getCompleteTrackingData();
      
      await submitRegistration.mutateAsync({
        campId: camp.id,
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email || undefined,
        age: parseInt(formData.age),
        procedures: formData.procedures.length > 0 ? JSON.stringify(formData.procedures) : undefined,
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

      toast.success("تم تسجيلك بنجاح! سنتواصل معك قريباً");
      
      const params = new URLSearchParams({
        type: 'camp',
        name: formData.fullName,
        phone: formData.phone,
        ...(formData.email && { email: formData.email }),
        ...(camp && { camp: camp.name }),
      });
      
      setTimeout(() => {
        setLocation(`/thank-you?${params.toString()}`);
      }, 1500);
    } catch (error) {
      toast.error("حدث خطأ أثناء التسجيل");
    }
  };

  const seoTitle = camp 
    ? `${camp.name} | المستشفى السعودي الألماني`
    : "المخيمات الطبية | المستشفى السعودي الألماني";
  
  const seoDescription = camp
    ? `${(camp.description || camp.name).substring(0, 150)}... سجل الآن في مخيمنا الطبي المجاني. اتصل: 8000018`
    : "مخيمات طبية مجانية لخدمة المجتمع في المستشفى السعودي الألماني";

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/50" dir="rtl">
        <Navbar />
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
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  <Skeleton className="h-12 sm:h-16 rounded-lg bg-white/20" />
                  <Skeleton className="h-12 sm:h-16 rounded-lg bg-white/20" />
                </div>
              </div>
              <Skeleton className="h-48 sm:h-64 md:h-80 rounded-2xl bg-white/20" />
            </div>
          </div>
        </section>
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
          <Skeleton className="h-6 sm:h-8 w-40 sm:w-48 mx-auto mb-4 sm:mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 sm:h-20 rounded-xl" />)}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Not Found State
  if (!camp) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/50" dir="rtl">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">لم يتم العثور على المخيم</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              عذراً، لم نتمكن من العثور على المخيم المطلوب. قد يكون المخيم منتهياً أو الرابط غير صحيح.
            </p>
            <Link href="/camps">
              <Button className="bg-green-600 hover:bg-green-700 gap-2">
                <ArrowRight className="h-4 w-4" />
                العودة إلى المخيمات
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
        image={camp.imageUrl || "/assets/new-logo.png"}
        type="article"
        keywords={`${camp.name}, مخيم طبي, مجاني, صنعاء, المستشفى السعودي الألماني`}
      />
      <div className="min-h-screen flex flex-col bg-muted/50">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white dark:bg-card border-b">
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
            <Link href="/" className="hover:text-green-600 transition-colors">الرئيسية</Link>
            <span>/</span>
            <Link href="/camps" className="hover:text-green-600 transition-colors">المخيمات</Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-[120px] sm:max-w-[200px]">{camp.name}</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 via-green-700 to-blue-600 text-white pt-4 sm:pt-6 md:pt-8 pb-8 sm:pb-16 md:pb-24 overflow-hidden">
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
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <img src="/assets/new-logo.png" alt="شعار المستشفى" className="h-4 w-4" />
                  <span className="text-sm font-semibold">مخيم طبي خيري</span>
                </div>
                <a href="#registration-form">
                  <Button 
                    size="sm"
                    className="bg-white dark:bg-card text-green-700 hover:bg-green-50 font-bold text-sm px-4 py-2 shadow-lg"
                  >
                    سجل الآن مجاناً
                  </Button>
                </a>
              </div>

              <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 md:mb-6 leading-tight">
                {camp.name}
              </h1>

              <p className="text-xs sm:text-base md:text-lg text-white/95 leading-relaxed mb-4 sm:mb-6">
                {camp.description}
              </p>

              {/* Key Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {camp.startDate && camp.endDate && (
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                    <Calendar className="h-5 w-5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-semibold">التاريخ</div>
                      <div className="text-white/90 text-xs">
                        {formatDate(camp.startDate)} - {formatDate(camp.endDate)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                  <Users className="h-5 w-5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-semibold">المقاعد محدودة</div>
                    <div className="text-white/90 text-xs">سجل الآن قبل انتهاء الفرصة</div>
                  </div>
                </div>
              </div>
            </div>

            {camp.imageUrl && (
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={camp.imageUrl}
                    alt={camp.name}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Free Offers Section */}
      {camp.freeOffers && (() => {
        const allOffers = camp.freeOffers.split('\n').filter((offer: string) => offer.trim());
        const displayedOffers = showAllFreeOffers ? allOffers : allOffers.slice(0, 4);
        const hasMore = allOffers.length > 4;
        
        return (
        <section className="py-6 sm:py-10 md:py-14">
          <div className="container mx-auto px-3 sm:px-4 max-w-5xl">
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-green-50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full mb-2 sm:mb-3">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                <span className="text-xs sm:text-sm font-semibold text-green-700">خدمات مجانية</span>
              </div>
              <h2 className="text-base sm:text-xl md:text-2xl font-bold text-foreground">
                ما يشمله المخيم
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {displayedOffers.map((offer: string, index: number) => (
                <div key={index} className="bg-white dark:bg-card p-3 sm:p-4 rounded-xl shadow-sm border-r-4 border-green-500 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="bg-green-50 p-1 sm:p-1.5 rounded-lg flex-shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                    </div>
                    <p className="text-foreground text-right flex-1 text-xs sm:text-sm">{offer.trim()}</p>
                  </div>
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="text-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAllFreeOffers(!showAllFreeOffers)}
                  className="gap-2 text-sm"
                >
                  {showAllFreeOffers ? (
                    <>إخفاء <ChevronUp className="h-4 w-4" /></>
                  ) : (
                    <>عرض المزيد ({allOffers.length - 4} خدمة) <ChevronDown className="h-4 w-4" /></>
                  )}
                </Button>
              </div>
            )}
          </div>
        </section>
        );
      })()}

      {/* Discounted Offers Section */}
      {camp.discountedOffers && (() => {
        const allOffers = camp.discountedOffers.split('\n').filter((offer: string) => offer.trim());
        const displayedOffers = showAllDiscountedOffers ? allOffers : allOffers.slice(0, 4);
        const hasMore = allOffers.length > 4;
        
        return (
        <section className="pb-6 sm:pb-10 md:pb-14">
          <div className="container mx-auto px-3 sm:px-4 max-w-5xl">
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-blue-50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full mb-2 sm:mb-3">
                <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-semibold text-blue-700">عروض مخفضة</span>
              </div>
              <h2 className="text-base sm:text-xl md:text-2xl font-bold text-foreground">
                العروض المخفضة
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {displayedOffers.map((offer: string, index: number) => (
                <div key={index} className="bg-white dark:bg-card p-3 sm:p-4 rounded-xl shadow-sm border-r-4 border-blue-500 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="bg-blue-50 p-1 sm:p-1.5 rounded-lg flex-shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                    </div>
                    <p className="text-foreground text-right flex-1 text-xs sm:text-sm">{offer.trim()}</p>
                  </div>
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="text-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAllDiscountedOffers(!showAllDiscountedOffers)}
                  className="gap-2 text-sm"
                >
                  {showAllDiscountedOffers ? (
                    <>إخفاء <ChevronUp className="h-4 w-4" /></>
                  ) : (
                    <>عرض المزيد ({allOffers.length - 4} عرض) <ChevronDown className="h-4 w-4" /></>
                  )}
                </Button>
              </div>
            )}
          </div>
        </section>
        );
      })()}

      {/* Gallery Section */}
      {camp.galleryImages && (() => {
        let images: string[] = [];
        try {
          const parsed = JSON.parse(camp.galleryImages);
          if (Array.isArray(parsed) && parsed.length > 0) {
            images = parsed;
          }
        } catch {
          images = camp.galleryImages.split('\n').filter((url: string) => url.trim());
        }
        
        if (images.length === 0) return null;
        
        return (
          <section className="pb-6 sm:pb-10 md:pb-14">
            <div className="container mx-auto px-3 sm:px-4 max-w-6xl">
              <h2 className="text-base sm:text-xl md:text-2xl font-bold text-center text-foreground mb-4 sm:mb-6">
                معرض صور المخيم
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
                {images.map((imageUrl: string, index: number) => (
                  <div key={index} className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-card">
                    <img
                      src={typeof imageUrl === 'string' ? imageUrl.trim() : imageUrl}
                      alt={`${camp.name} - صورة ${index + 1}`}
                      className="w-full h-32 sm:h-40 md:h-56 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Registration Form Section */}
      {camp.isActive && camp.endDate && new Date(camp.endDate) > new Date() && (
        <section id="registration-form" className="pb-6 sm:pb-10 md:pb-14">
          <div className="container mx-auto px-3 sm:px-4 max-w-2xl">
            {/* Urgency Banner */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-2.5 sm:p-3 md:p-4 rounded-xl mb-3 sm:mb-4 text-center">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                <span className="font-bold text-xs sm:text-sm md:text-base">المقاعد محدودة - سجل الآن!</span>
              </div>
            </div>

            <Card className="shadow-sm border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sm:p-5 md:p-6">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <img src="/assets/new-logo.png" alt="شعار المستشفى" className="h-6 w-6 sm:h-8 sm:w-8" />
                  <div>
                    <CardTitle className="text-base sm:text-lg md:text-xl">سجل الآن في المخيم</CardTitle>
                    <CardDescription className="text-green-100 text-xs sm:text-sm">
                      املأ النموذج وسنتواصل معك لتأكيد التسجيل
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 md:p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                        رقم الهاتف <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          value={formatPhoneDisplay(formData.phone)}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="مثال: 771234567"
                          required
                          className="mt-1.5 pr-10 h-11"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="age" className="text-sm font-medium text-foreground">
                        العمر <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        min="1"
                        max="120"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        placeholder="أدخل عمرك"
                        required
                        className="mt-1.5 h-11"
                      />
                    </div>
                  </div>

                  {/* Procedures Selection */}
                  {availableProcedures.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-foreground block mb-2">
                        الإجراءات المطلوبة (اختياري)
                      </Label>
                      
                      {!showProcedures ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowProcedures(true)}
                          className="w-full py-4 text-sm border-dashed border-border hover:border-green-500 hover:bg-green-50 gap-2"
                        >
                          <Heart className="w-4 h-4" />
                          اختر الإجراءات المطلوبة
                          {formData.procedures.length > 0 && (
                            <span className="bg-green-600 text-white px-2 py-0.5 rounded-full text-xs">
                              {formData.procedures.length} مختار
                            </span>
                          )}
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {availableProcedures.map((procedure: string) => (
                              <label
                                key={procedure}
                                className={`flex items-center gap-2.5 p-3 border rounded-lg cursor-pointer transition-all text-sm ${
                                  formData.procedures.includes(procedure)
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-border hover:border-green-300 hover:bg-muted/50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.procedures.includes(procedure)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        procedures: [...formData.procedures, procedure],
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        procedures: formData.procedures.filter((p) => p !== procedure),
                                      });
                                    }
                                  }}
                                  className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                                />
                                <span className={`text-sm ${
                                  formData.procedures.includes(procedure) ? 'text-green-700 font-medium' : 'text-foreground'
                                }`}>
                                  {procedure}
                                </span>
                              </label>
                            ))}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowProcedures(false)}
                            className="text-xs text-muted-foreground"
                          >
                            إخفاء الإجراءات
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-base py-5 font-bold mt-2"
                    disabled={submitRegistration.isPending}
                  >
                    {submitRegistration.isPending ? (
                      <>
                        <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                        جاري التسجيل...
                      </>
                    ) : (
                      <>
                        <Heart className="ml-2 h-5 w-5" />
                        تسجيل في المخيم مجاناً
                      </>
                    )}
                  </Button>

                  {/* Trust Elements */}
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      <span>تسجيل آمن</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      <span>رد فوري</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      <span>100% مجاني</span>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Expired Camp Notice */}
      {!camp.isActive && (
        <section className="py-8 sm:py-12 md:py-16">
          <div className="container mx-auto px-3 sm:px-4 max-w-2xl">
            <div className="bg-white dark:bg-card rounded-2xl shadow-sm p-4 sm:p-6 md:p-8 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <h2 className="text-base sm:text-xl md:text-2xl font-bold text-foreground mb-2 sm:mb-3">
                المخيم منتهي
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                هذا المخيم قد انتهى ولا يمكن التسجيل فيه حالياً. تابعنا للحصول على آخر التحديثات عن المخيمات القادمة.
              </p>
              <Button
                onClick={() => setLocation('/camps')}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                عودة إلى المخيمات
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-6 sm:py-8 md:py-10">
        <div className="container mx-auto px-3 sm:px-4 text-center">
          <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1.5 sm:mb-2">للاستفسارات والمزيد من المعلومات</h3>
          <p className="text-xs sm:text-sm md:text-base text-white/90 mb-3 sm:mb-4">اتصل بنا على الرقم المجاني</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="tel:8000018"
              className="inline-flex items-center gap-2 bg-white dark:bg-card text-green-600 px-5 py-2.5 rounded-full font-bold text-sm hover:bg-muted transition-colors shadow-lg"
            >
              <Phone className="h-4 w-4" />
              8000018
            </a>
            <a
              href={`https://wa.me/9678000018?text=${encodeURIComponent('مرحباً، أود الاستفسار عن المخيم الطبي')}`}
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
