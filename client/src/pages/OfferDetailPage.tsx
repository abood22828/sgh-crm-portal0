import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Phone, Mail, Calendar, CheckCircle2, Loader2 } from "lucide-react";
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
      await submitLead.mutateAsync({
        offerId: offer.id,
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email || undefined,
      });

      toast.success("تم إرسال طلبك بنجاح! سنتواصل معك قريباً");
      setFormData({ fullName: "", phone: "", email: "" });
    } catch (error) {
      toast.error("حدث خطأ أثناء إرسال الطلب");
    }
  };

  // SEO meta tags
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

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 to-blue-600 text-white py-20">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20 mb-6"
            onClick={() => setLocation("/offers")}
          >
            <ArrowRight className="ml-2 h-4 w-4 rotate-180" />
            العودة إلى العروض
          </Button>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {offer.title}
              </h1>
              <p className="text-xl text-white/90 leading-relaxed">
                {offer.description}
              </p>

              {offer.startDate && offer.endDate && (
                <div className="mt-6 flex items-center gap-2 text-white/90">
                  <Calendar className="h-5 w-5" />
                  <span>
                    من {new Date(offer.startDate).toLocaleDateString("ar-EG")} إلى{" "}
                    {new Date(offer.endDate).toLocaleDateString("ar-EG")}
                  </span>
                </div>
              )}
            </div>

            {offer.imageUrl && (
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={offer.imageUrl}
                  alt={offer.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="shadow-xl border-t-4 border-green-600">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  اطلب العرض الآن
                </h2>
                <p className="text-gray-600">
                  املأ النموذج وسنتواصل معك في أقرب وقت
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

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-6 text-lg"
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
                      إرسال الطلب
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
          <h3 className="text-2xl font-bold mb-4">هل لديك استفسار؟</h3>
          <p className="text-xl mb-6">تواصل معنا الآن</p>
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
