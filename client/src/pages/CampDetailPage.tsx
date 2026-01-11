import { useEffect, useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Phone, Mail, Calendar, MapPin, Loader2, Heart } from "lucide-react";
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

  // Get available procedures from camp data
  const availableProcedures = useMemo(() => {
    if (!camp?.availableProcedures) return [];
    try {
      // Try to parse as JSON array first
      const parsed = JSON.parse(camp.availableProcedures);
      if (Array.isArray(parsed)) return parsed;
      // If not JSON, split by newlines
      return camp.availableProcedures.split('\n').filter(p => p.trim());
    } catch {
      // If parsing fails, split by newlines
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
      await submitRegistration.mutateAsync({
        campId: camp.id,
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email || undefined,
        age: parseInt(formData.age),
        procedures: formData.procedures.length > 0 ? JSON.stringify(formData.procedures) : undefined,
      });

      toast.success("تم تسجيلك بنجاح! سنتواصل معك قريباً");
      setFormData({ fullName: "", phone: "", email: "", age: "", procedures: [] });
    } catch (error) {
      toast.error("حدث خطأ أثناء التسجيل");
    }
  };

  // SEO meta tags
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

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 to-blue-600 text-white py-20">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20 mb-6"
            onClick={() => setLocation("/camps")}
          >
            <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
            العودة إلى المخيمات
          </Button>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Heart className="h-8 w-8 text-red-400 fill-red-400" />
                <span className="text-xl font-semibold">مخيم طبي خيري</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {camp.name}
              </h1>

              <p className="text-xl text-white/90 leading-relaxed mb-6">
                {camp.description}
              </p>

              {camp.startDate && camp.endDate && (
                <div className="flex items-center gap-2 text-white/90 mb-4">
                  <Calendar className="h-5 w-5" />
                  <span>
                    من {new Date(camp.startDate).toLocaleDateString("ar-EG")} إلى{" "}
                    {new Date(camp.endDate).toLocaleDateString("ar-EG")}
                  </span>
                </div>
              )}
            </div>

            {camp.imageUrl && (
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={camp.imageUrl}
                  alt={camp.name}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About Camp Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            عن المخيم
          </h2>
          <div className="prose prose-lg max-w-none text-right">
            <p className="text-gray-700 leading-relaxed text-lg">
              يأتي هذا المخيم الطبي الخيري ضمن مبادرات المستشفى السعودي الألماني في إطار
              المسؤولية المجتمعية، حيث نسعى لتقديم خدمات طبية عالية الجودة للمحتاجين
              والمستحقين بأسعار رمزية أو مجاناً.
            </p>
            <p className="text-gray-700 leading-relaxed text-lg mt-4">
              يشرف على المخيم نخبة من أفضل الأطباء والجراحين المتخصصين، مع توفير أحدث
              الأجهزة والتقنيات الطبية لضمان أفضل النتائج.
            </p>
          </div>
        </div>
      </section>

      {/* Camp Offers Section */}
      {/* Free Offers Section */}
      {camp.freeOffers && (
        <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              العروض المجانية
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {camp.freeOffers.split('\n').filter((offer: string) => offer.trim()).map((offer: string, index: number) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md border-r-4 border-green-600">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-gray-700 text-right flex-1">{offer.trim()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Discounted Offers Section */}
      {camp.discountedOffers && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              العروض المخفضة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {camp.discountedOffers.split('\n').filter((offer: string) => offer.trim()).map((offer: string, index: number) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md border-r-4 border-blue-600">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-gray-700 text-right flex-1">{offer.trim()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {camp.galleryImages && (() => {
        try {
          const images = JSON.parse(camp.galleryImages);
          if (Array.isArray(images) && images.length > 0) {
            return (
              <section className="py-16 bg-white">
                <div className="container mx-auto px-4 max-w-6xl">
                  <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
                    معرض صور المخيم
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {images.map((imageUrl: string, index: number) => (
                      <div key={index} className="rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                        <img
                          src={imageUrl}
                          alt={`${camp.name} - صورة ${index + 1}`}
                          className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }
        } catch {
          // If parsing fails, try splitting by newlines
          const images = camp.galleryImages.split('\n').filter((url: string) => url.trim());
          if (images.length > 0) {
            return (
              <section className="py-16 bg-white">
                <div className="container mx-auto px-4 max-w-6xl">
                  <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
                    معرض صور المخيم
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {images.map((imageUrl: string, index: number) => (
                      <div key={index} className="rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                        <img
                          src={imageUrl.trim()}
                          alt={`${camp.name} - صورة ${index + 1}`}
                          className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
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
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="shadow-xl border-t-4 border-green-600">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <Heart className="h-16 w-16 text-red-500 fill-red-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  سجل الآن في المخيم
                </h2>
                <p className="text-gray-600">
                  املأ النموذج وسنتواصل معك لتأكيد التسجيل
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="fullName" className="text-right block mb-2">
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
                    className="text-right"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-right block mb-2">
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
                      className="text-right pr-12"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-right block mb-2">
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
                      className="text-right pr-12"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="age" className="text-right block mb-2">
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
                    className="text-right"
                  />
                </div>

                <div>
                  <Label className="text-right block mb-3">
                    الإجراءات المطلوبة (اختر واحد أو أكثر)
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableProcedures.map((procedure: string) => (
                      <label
                        key={procedure}
                        className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
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
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">{procedure}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-6 text-lg"
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
                      تسجيل في المخيم
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-gradient-to-br from-green-600 to-blue-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">للاستفسارات والمزيد من المعلومات</h3>
          <p className="text-xl mb-6">اتصل بنا على الرقم المجاني</p>
          <a
            href="tel:8000018"
            className="inline-flex items-center gap-2 bg-white text-green-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors"
          >
            <Phone className="h-6 w-6" />
            8000018
          </a>
        </div>
      </section>

      <Footer />
      </div>
    </div>
  );
}
