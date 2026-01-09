import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { MetaPixel, trackMetaLead, trackMetaCompleteRegistration } from "@/components/MetaPixel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle2, Phone, Mail, MapPin, Calendar, Heart } from "lucide-react";
import { toast } from "sonner";

export default function CampaignLanding() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
  });

  // Get UTM parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get("utm_source") || "";
  const utmMedium = urlParams.get("utm_medium") || "";
  const utmCampaign = urlParams.get("utm_campaign") || "";
  const utmContent = urlParams.get("utm_content") || "";

  const submitLead = trpc.leads.submit.useMutation({
    onSuccess: () => {
      // Track Meta Conversion
      trackMetaCompleteRegistration({
        fullName: formData.fullName,
        phone: formData.phone,
      });
      
      toast.success("تم التسجيل بنجاح!");
      setLocation("/thank-you");
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.");
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.phone) {
      toast.error("يرجى إدخال الاسم ورقم الهاتف");
      return;
    }

    submitLead.mutate({
      campaignSlug: "medical-camp-charity",
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email || undefined,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
    });
  };

  return (
    <>
      <MetaPixel pixelId="2008380493273171" />
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <img 
              src="/assets/new-logo.png" 
              alt="المستشفى السعودي الألماني" 
              className="h-16 md:h-20"
            />
            <div className="text-left">
              <div className="flex items-center gap-2 text-primary font-bold text-xl md:text-2xl">
                <Phone className="w-5 h-5" />
                <span>8000018</span>
              </div>
              <p className="text-sm text-muted-foreground">الرقم المجاني</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent"></div>
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-semibold">
                <Heart className="w-4 h-4 fill-current" />
                <span>عرض خاص</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                المخيم الطبي الخيري
              </h1>
              
              <div className="flex items-center gap-3 text-lg md:text-xl text-muted-foreground">
                <Calendar className="w-6 h-6 text-primary" />
                <span className="font-semibold">متاح حتى 10 نوفمبر 2025</span>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-primary/20">
                <h3 className="text-2xl font-bold text-primary mb-4">الخدمات المتاحة مجاناً:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                    <span className="text-lg">المعاينة والفحص الطبي الشامل</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                    <span className="text-lg">تخطيط القلب (ECG)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                    <span className="text-lg">فحص السكر في الدم</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                    <span className="text-lg">رفع مود القسطرة</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                    <span className="text-lg">الأدوية المتوفرة</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-1">القسطرة التشخيصية</p>
                    <p className="text-3xl font-bold">90,000 ريال</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-90 mb-1">القسطرة العلاجية</p>
                    <p className="text-3xl font-bold">820,000 ريال</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between">
                    <span className="text-lg" style={{height: '36px'}}>القلب المفتوح</span>
                    <span className="text-3xl font-bold">1,100,000 ريال</span>
                  </div>
                  <p className="text-sm opacity-90 mt-2">فحوصات بخصم 50%</p>
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <div>
              <Card className="shadow-2xl border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-br from-primary/5 to-secondary/5">
                  <CardTitle className="text-2xl md:text-3xl text-center">
                    سجل الآن واحجز موعدك
                  </CardTitle>
                  <CardDescription className="text-center text-base">
                    املأ البيانات وسنتواصل معك خلال 24 ساعة
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-base">
                        الاسم الكامل <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="أدخل اسمك الكامل"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        className="h-12 text-base"
                        disabled={submitLead.isPending}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-base">
                        رقم الهاتف <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="مثال: 771234567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        className="h-12 text-base"
                        disabled={submitLead.isPending}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-base">
                        البريد الإلكتروني (اختياري)
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-12 text-base"
                        disabled={submitLead.isPending}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                      disabled={submitLead.isPending}
                    >
                      {submitLead.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                          جاري التسجيل...
                        </>
                      ) : (
                        "سجل الآن مجاناً"
                      )}
                    </Button>

                    <p className="text-sm text-center text-muted-foreground">
                      بالتسجيل، أنت توافق على سياسة الخصوصية الخاصة بنا
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Hospital Info Section */}
      <section className="py-12 bg-white">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              المستشفى السعودي الألماني - صنعاء
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              نرعاكم كأهالينا - رعاية طبية متميزة بخبرة عالمية
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">الموقع</h3>
                <p className="text-muted-foreground">
                  صنعاء - شارع الستين الشمالي
                  <br />
                  بين جولة عمران وجولة الجمنة
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="font-bold text-lg mb-2">الرقم المجاني</h3>
                <p className="text-2xl font-bold text-primary">8000018</p>
                <p className="text-sm text-muted-foreground mt-1">متاح على مدار الساعة</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">تواصل معنا</h3>
                <p className="text-muted-foreground">
                  نحن هنا لخدمتك
                  <br />
                  في أي وقت
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img 
                src="/assets/logo-white.png" 
                alt="المستشفى السعودي الألماني" 
                className="h-12"
              />
              <div>
                <p className="font-bold">المستشفى السعودي الألماني</p>
                <p className="text-sm text-slate-400">نرعاكم كأهالينا</p>
              </div>
            </div>
            <div className="text-center md:text-left">
              <p className="text-sm text-slate-400">
                © 2025 جميع الحقوق محفوظة
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
