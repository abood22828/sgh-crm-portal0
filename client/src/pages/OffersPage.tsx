/**
 * Offers Page - صفحة العروض الطبية
 * 
 * Displays all active medical offers with registration forms.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Gift, Calendar, Phone, Mail, User, CheckCircle } from "lucide-react";
import { getRegistrationSource } from "@/lib/tracking";
import { APP_LOGO, APP_TITLE } from "@/const";

interface OfferFormData {
  fullName: string;
  phone: string;
  email: string;
  notes: string;
}

export default function OffersPage() {
  const [selectedOffer, setSelectedOffer] = useState<number | null>(null);
  const [formData, setFormData] = useState<OfferFormData>({
    fullName: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Fetch all active offers
  const { data: offers, isLoading } = trpc.offers.getAll.useQuery();

  // Create lead mutation
  const createLead = trpc.leads.submit.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل طلبك بنجاح! سنتواصل معك قريباً");
      setSubmitted(true);
      setFormData({ fullName: "", phone: "", email: "", notes: "" });
    },
    onError: () => {
      toast.error("حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى");
      
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) {
      toast.error("يرجى اختيار عرض أولاً");
      return;
    }

    setIsSubmitting(true);
    try {
      await createLead.mutateAsync({
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email || undefined,
        campaignSlug: "offers",
        source: getRegistrationSource(), // Auto-detect source from UTM
        utmSource: "website",
        utmMedium: "offers-page",
        utmCampaign: `offer-${selectedOffer}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">تم التسجيل بنجاح!</h2>
            <p className="text-gray-600 mb-4">
              شكراً لاهتمامك بعروضنا الطبية. سيتواصل معك فريقنا خلال 24 ساعة.
            </p>
            <Button onClick={() => setSubmitted(false)} variant="outline">
              العودة للعروض
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-5 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-9 sm:h-12 w-auto" />
            <div>
              <h1 className="text-sm sm:text-lg font-bold text-blue-900 leading-tight">{APP_TITLE}</h1>
              <p className="text-xs sm:text-sm text-gray-500">العروض الطبية</p>
            </div>
          </div>
          <a href="tel:8000018" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
            <Phone className="h-5 w-5" />
            <span className="font-semibold">8000018</span>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-8 sm:py-12 md:py-16">
        <div className="container mx-auto px-5 sm:px-6 text-center">
          <Gift className="h-12 sm:h-16 w-12 sm:w-16 text-blue-600 mx-auto mb-3 sm:mb-4" />
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-blue-900 mb-3 sm:mb-4">
            العروض الطبية الخاصة
          </h1>
          <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto">
            استفد من عروضنا الطبية المميزة بأسعار تنافسية وخدمات عالية الجودة
          </p>
        </div>
      </section>

      {/* Offers Grid */}
      <section className="py-6 sm:py-8">
        <div className="container mx-auto px-5 sm:px-6">
          {offers && offers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {offers.map((offer) => (
                <Card 
                  key={offer.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedOffer === offer.id ? "ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => setSelectedOffer(offer.id)}
                >
                  {offer.imageUrl && (
                    <div className="relative h-40 sm:h-48 overflow-hidden rounded-t-lg">
                      <img 
                        src={offer.imageUrl} 
                        alt={offer.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-base sm:text-xl text-blue-900">{offer.title}</CardTitle>
                    {offer.endDate && (
                      <CardDescription className="flex items-center gap-1 text-orange-600">
                        <Calendar className="h-4 w-4" />
                        العرض ساري حتى {new Date(offer.endDate).toLocaleDateString("ar-SA")}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{offer.description}</p>
                    <Button 
                      className="w-full mt-4" 
                      variant={selectedOffer === offer.id ? "default" : "outline"}
                    >
                      {selectedOffer === offer.id ? "تم الاختيار" : "اختر هذا العرض"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 text-center">
                <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">لا توجد عروض متاحة حالياً</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Registration Form */}
      {selectedOffer && (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-5 sm:px-6">
            <Card className="max-w-lg mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-xl sm:text-2xl text-blue-900">سجل الآن</CardTitle>
                <CardDescription>
                  أكمل بياناتك وسنتواصل معك خلال 24 ساعة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      الاسم الكامل *
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="أدخل اسمك الكامل"
                      required
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      رقم الهاتف *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="مثال: 771234567"
                      required
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      البريد الإلكتروني (اختياري)
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="example@email.com"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">ملاحظات إضافية</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="أي معلومات إضافية تود مشاركتها..."
                      dir="rtl"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        جاري التسجيل...
                      </>
                    ) : (
                      "تسجيل الآن"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-8">
        <div className="container mx-auto px-5 sm:px-6 text-center">
          <img src={APP_LOGO} alt={APP_TITLE} className="h-10 sm:h-12 w-auto mx-auto mb-3 sm:mb-4 brightness-0 invert" />
          <p className="text-blue-200">{APP_TITLE}</p>
          <p className="text-sm text-blue-300 mt-2">
            للاستفسارات: <a href="tel:8000018" className="hover:text-white">8000018</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
