import { useEffect, useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Phone, Mail, Calendar, MapPin, Loader2, Heart, Users, CheckCircle2, Clock, Star } from "lucide-react";
import { getCompleteTrackingData } from "@/lib/tracking";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

export default function CampDetailPage() {
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
      return camp.availableProcedures.split('\n').filter(p => p.trim());
    } catch {
      return camp.availableProcedures.split('\n').filter(p => p.trim());
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <Loader2 className="w-12 h-12 animate-spin text-green-600" />
      </div>
    );
  }

  if (!camp) {
    return null;
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />

      {/* Enhanced Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 via-green-700 to-blue-600 text-white pt-4 md:pt-8 pb-16 md:pb-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20 mb-4 md:mb-6 text-sm md:text-base"
            onClick={() => setLocation("/camps")}
          >
            <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
            العودة إلى المخيمات
          </Button>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              {/* Trust Badge with Register Button */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <img src="/assets/new-logo.png" alt="شعار المستشفى" className="h-5 w-5" />
                  <span className="text-sm md:text-base font-semibold">مخيم طبي خيري</span>
                </div>
                <a href="#registration-form">
                  <Button 
                    size="sm"
                    className="bg-white text-green-700 hover:bg-green-50 font-bold text-sm px-4 py-2 shadow-lg"
                  >
                    سجل الآن مجاناً
                  </Button>
                </a>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
                {camp.name}
              </h1>

              <p className="text-lg md:text-xl text-white/95 leading-relaxed mb-6">
                {camp.description}
              </p>

              {/* Key Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6">
                {camp.startDate && camp.endDate && (
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-3 md:p-4 rounded-lg">
                    <Calendar className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0" />
                    <div className="text-sm md:text-base">
                      <div className="font-semibold">التاريخ</div>
                      <div className="text-white/90 text-xs md:text-sm">
                        {new Date(camp.startDate).toLocaleDateString("ar-EG")} - {new Date(camp.endDate).toLocaleDateString("ar-EG")}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-3 md:p-4 rounded-lg">
                  <Users className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0" />
                  <div className="text-sm md:text-base">
                    <div className="font-semibold">المقاعد محدودة</div>
                    <div className="text-white/90 text-xs md:text-sm">سجل الآن قبل انتهاء الفرصة</div>
                  </div>
                </div>
              </div>


            </div>

            {camp.imageUrl && (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-green-400/20 to-blue-400/20 rounded-2xl transform rotate-3"></div>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300">
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
        <section className="py-12 md:py-16 bg-gradient-to-br from-green-50 to-blue-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-6 md:mb-8">
              <div className="inline-flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm md:text-base font-semibold text-green-700">خدمات مجانية</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                ما يشمله المخيم
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {displayedOffers.map((offer: string, index: number) => (
                <div key={index} className="bg-white p-4 md:p-6 rounded-xl shadow-md border-r-4 border-green-600 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-gray-700 text-right flex-1 text-sm md:text-base">{offer.trim()}</p>
                  </div>
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="text-center mt-6 md:mt-8">
                <Button
                  variant="outline"
                  onClick={() => setShowAllFreeOffers(!showAllFreeOffers)}
                  className="gap-2 text-sm md:text-base"
                >
                  {showAllFreeOffers ? 'إخفاء' : `عرض المزيد (${allOffers.length - 4} خدمة)`}
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
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-6 md:mb-8">
              العروض المخفضة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {displayedOffers.map((offer: string, index: number) => (
                <div key={index} className="bg-white p-4 md:p-6 rounded-xl shadow-md border-r-4 border-blue-600 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-gray-700 text-right flex-1 text-sm md:text-base">{offer.trim()}</p>
                  </div>
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="text-center mt-6 md:mt-8">
                <Button
                  variant="outline"
                  onClick={() => setShowAllDiscountedOffers(!showAllDiscountedOffers)}
                  className="gap-2 text-sm md:text-base"
                >
                  {showAllDiscountedOffers ? 'إخفاء' : `عرض المزيد (${allOffers.length - 4} عرض)`}
                </Button>
              </div>
            )}
          </div>
        </section>
        );
      })()}

      {/* Gallery Section */}
      {camp.galleryImages && (() => {
        try {
          const images = JSON.parse(camp.galleryImages);
          if (Array.isArray(images) && images.length > 0) {
            return (
              <section className="py-12 md:py-16 bg-gradient-to-br from-green-50 to-blue-50">
                <div className="container mx-auto px-4 max-w-6xl">
                  <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-6 md:mb-8">
                    معرض صور المخيم
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                    {images.map((imageUrl: string, index: number) => (
                      <div key={index} className="rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                        <img
                          src={imageUrl}
                          alt={`${camp.name} - صورة ${index + 1}`}
                          className="w-full h-48 md:h-64 object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }
        } catch {
          const images = camp.galleryImages.split('\n').filter((url: string) => url.trim());
          if (images.length > 0) {
            return (
              <section className="py-12 md:py-16 bg-gradient-to-br from-green-50 to-blue-50">
                <div className="container mx-auto px-4 max-w-6xl">
                  <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-6 md:mb-8">
                    معرض صور المخيم
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                    {images.map((imageUrl: string, index: number) => (
                      <div key={index} className="rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                        <img
                          src={imageUrl.trim()}
                          alt={`${camp.name} - صورة ${index + 1}`}
                          className="w-full h-48 md:h-64 object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }
        }
        return null;
      })()}

      {/* Registration Form Section */}
      {camp.isActive && (
        <section id="registration-form" className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4 max-w-2xl">
            {/* Urgency Banner */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 md:p-6 rounded-xl mb-6 md:mb-8 text-center shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-5 w-5 md:h-6 md:w-6 animate-pulse" />
                <span className="font-bold text-base md:text-lg">المقاعد محدودة!</span>
              </div>
              <p className="text-sm md:text-base">سجل الآن قبل امتلاء المقاعد المتاحة</p>
            </div>

            <Card className="shadow-2xl border-t-4 border-green-600">
            <CardContent className="p-6 md:p-8">
              <div className="text-center mb-6 md:mb-8">
                <img src="/assets/new-logo.png" alt="شعار المستشفى" className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4" />
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  سجل الآن في المخيم
                </h2>
                <p className="text-sm md:text-base text-gray-600">
                  املأ النموذج وسنتواصل معك لتأكيد التسجيل
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
                  <Label htmlFor="age" className="text-right block mb-2 text-sm md:text-base">
                    العمر <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: e.target.value })
                    }
                    placeholder="أدخل عمرك"
                    required
                    className="text-right text-sm md:text-base h-11 md:h-12"
                  />
                </div>

                {availableProcedures.length > 0 && (
                  <div>
                    <Label className="text-right block mb-3 text-sm md:text-base font-medium">
                      الإجراءات المطلوبة (اختياري)
                    </Label>
                    
                    {!showProcedures ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowProcedures(true)}
                        className="w-full py-5 md:py-6 text-sm md:text-base border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50"
                      >
                        <Heart className="w-5 h-5 ml-2" />
                        اضغط لاختيار الإجراءات المطلوبة
                        {formData.procedures.length > 0 && (
                          <span className="mr-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs md:text-sm">
                            {formData.procedures.length} مختار
                          </span>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {availableProcedures.map((procedure: string) => (
                            <label
                              key={procedure}
                              className={`flex items-center gap-3 p-3 md:p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                formData.procedures.includes(procedure)
                                  ? 'border-green-600 bg-green-50'
                                  : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
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
                                      procedures: formData.procedures.filter(
                                        (p) => p !== procedure
                                      ),
                                    });
                                  }
                                }}
                                className="w-4 h-4 md:w-5 md:h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                              />
                              <span className={`text-xs md:text-sm font-medium ${
                                formData.procedures.includes(procedure)
                                  ? 'text-green-900'
                                  : 'text-gray-700'
                              }`}>
                                {procedure}
                              </span>
                            </label>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowProcedures(false)}
                          className="w-full text-sm md:text-base"
                        >
                          إخفاء الإجراءات
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-5 md:py-6 text-base md:text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={submitRegistration.isPending}
                >
                  {submitRegistration.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      جاري التسجيل...
                    </>
                  ) : (
                    <>
                      <Heart className="mr-2 h-5 w-5" />
                      تسجيل في المخيم مجاناً
                    </>
                  )}
                </Button>

                {/* Trust Elements */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 pt-4 text-xs md:text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>تسجيل آمن</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>رد فوري</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
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
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card className="shadow-xl border-t-4 border-gray-400">
              <CardContent className="p-6 md:p-8 text-center">
                <div className="bg-gray-100 rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 md:h-10 md:w-10 text-gray-500" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                  المخيم منتهي
                </h2>
                <p className="text-sm md:text-base text-gray-600 mb-6">
                  هذا المخيم قد انتهى ولا يمكن التسجيل فيه حالياً. تابعنا للحصول على آخر التحديثات عن المخيمات القادمة.
                </p>
                <Button
                  onClick={() => setLocation('/camps')}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-sm md:text-base"
                >
                  <ArrowRight className="h-4 w-4 ml-2" />
                  عودة إلى المخيمات
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="bg-gradient-to-br from-green-600 to-blue-600 text-white py-10 md:py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">للاستفسارات والمزيد من المعلومات</h3>
          <p className="text-base md:text-xl mb-4 md:mb-6">اتصل بنا على الرقم المجاني</p>
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
