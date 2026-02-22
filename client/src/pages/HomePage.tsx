/**
 * HomePage - الصفحة الرئيسية
 * 
 * Main landing page with hospital information and platform overview
 * Optimized for mobile and desktop with enhanced visual design and responsive layout
 */
import { Heart, Stethoscope, Calendar, TrendingUp, ArrowLeft, Users, Clock, Award, Shield, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import InstallPWAButton from "@/components/InstallPWAButton";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Link } from "wouter";

export default function HomePage() {

  const services = [
    {
      icon: Stethoscope,
      title: "حجز مواعيد الأطباء",
      description: "احجز موعدك مع أفضل الأطباء والاستشاريين في مختلف التخصصات",
      link: "/doctors",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/30",
      borderColor: "border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600",
    },
    {
      icon: TrendingUp,
      title: "العروض الطبية",
      description: "استفد من عروضنا الطبية المميزة بأسعار تنافسية وخدمات متكاملة",
      link: "/offers",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/30",
      borderColor: "border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600",
    },
    {
      icon: Heart,
      title: "المخيمات الطبية الخيرية",
      description: "خدمات طبية مجانية للمجتمع ضمن مسؤوليتنا الاجتماعية",
      link: "/camps",
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-900/30",
      borderColor: "border-rose-200 dark:border-rose-800 hover:border-rose-400 dark:hover:border-rose-600",
    },
  ];

  const stats = [
    { number: "22+", label: "طبيب واستشاري", icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/30" },
    { number: "15+", label: "تخصص طبي", icon: Activity, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
    { number: "1000+", label: "مريض سعيد", icon: Heart, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/30" },
    { number: "24/7", label: "خدمة متواصلة", icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/30" },
  ];

  const features = [
    { icon: Award, title: "معايير عالمية", description: "نقدم خدمات طبية متميزة بمعايير عالمية" },
    { icon: Shield, title: "رعاية شاملة", description: "رعاية صحية متكاملة لجميع المرضى" },
    { icon: Stethoscope, title: "أطباء متخصصون", description: "نخبة من الأطباء والاستشاريين المتخصصين" },
  ];

  return (
    <>
      <SEO 
        title="المستشفى السعودي الألماني - صنعاء | احجز موعدك الآن"
        description="احجز موعدك مع أفضل الأطباء في المستشفى السعودي الألماني بصنعاء. خدمات طبية متميزة، عروض خاصة، ومخيمات صحية مجانية. اتصل الآن: 8000018"
        image="/assets/logo-color.png"
        keywords="المستشفى السعودي الألماني, صنعاء, حجز موعد, أطباء, عروض طبية, مخيمات صحية, استشارات طبية, 8000018"
      />
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-950" dir="rtl">
      <Navbar />

      {/* Hero Section */}
      <section className="py-8 sm:py-12 md:py-20 bg-gradient-to-br from-green-600 via-green-700 to-blue-600 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        <div className="container mx-auto px-4 sm:px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <img
              src="/assets/new-logo.png"
              alt={APP_TITLE}
              className="h-12 sm:h-16 md:h-20 w-auto mx-auto mb-3 sm:mb-5 md:mb-6 drop-shadow-lg"
            />
            <h1 className="text-lg sm:text-2xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 leading-tight px-1">{APP_TITLE}</h1>
            <p className="text-sm sm:text-lg md:text-2xl mb-1 sm:mb-2 text-green-100 font-medium">
              Saudi German Hospital
            </p>
            <p className="text-xs sm:text-base md:text-xl mb-4 sm:mb-6 md:mb-8 text-blue-100">
              نرعاكم كأهالينا - Caring like family
            </p>
            <p className="text-[11px] sm:text-sm md:text-lg mb-5 sm:mb-7 md:mb-8 leading-relaxed max-w-3xl mx-auto px-2 text-white/90">
              منصة الحجز الإلكترونية للمستشفى السعودي الألماني - صنعاء. احجز موعدك مع أفضل
              الأطباء، استفد من العروض الطبية المميزة، وشارك في المخيمات الطبية الخيرية.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center px-3 sm:px-0">
              <Link href="/doctors">
                <Button size="lg" className="w-full sm:w-auto bg-white dark:bg-card text-green-600 hover:bg-muted text-sm sm:text-base shadow-lg hover:shadow-xl transition-all h-11 sm:h-12">
                  احجز موعدك الآن
                  <ArrowLeft className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 rotate-180" />
                </Button>
              </Link>
              <a href="tel:8000018" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-white/80 text-white hover:bg-white/10 text-sm sm:text-base backdrop-blur-sm h-11 sm:h-12"
                >
                  اتصل بنا: 8000018
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Enhanced */}
      <section className="py-6 sm:py-10 md:py-14 bg-white dark:bg-card dark:bg-gray-900 relative">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-3 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-muted/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-shadow">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-2 sm:mb-3`}>
                  <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${stat.color}`} />
                </div>
                <div className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold ${stat.color} mb-0.5 sm:mb-1`}>
                  {stat.number}
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground dark:text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section - Enhanced */}
      <section className="py-8 sm:py-12 md:py-16 bg-muted/50 dark:bg-gray-950">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-6 sm:mb-10 md:mb-12">
            <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground dark:text-white mb-2 sm:mb-3 md:mb-4">
              خدماتنا الإلكترونية
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground dark:text-muted-foreground max-w-2xl mx-auto px-2">
              نوفر لك منصة متكاملة لحجز المواعيد والاستفادة من العروض الطبية والمشاركة في
              المخيمات الخيرية
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {services.map((service, index) => (
              <Card
                key={index}
                className={`hover:shadow-xl transition-all cursor-pointer border-2 ${service.borderColor} dark:bg-gray-800/50 group`}
              >
                <CardHeader className="pb-2 sm:pb-3 md:pb-4 p-4 sm:p-5 md:p-6">
                  <div
                    className={`w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl ${service.bgColor} flex items-center justify-center mb-2.5 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <service.icon className={`h-5 w-5 sm:h-7 sm:w-7 md:h-8 md:w-8 ${service.color}`} />
                  </div>
                  <CardTitle className="text-sm sm:text-base md:text-xl text-foreground dark:text-white text-right">{service.title}</CardTitle>
                  <CardDescription className="text-[11px] sm:text-xs md:text-sm text-right dark:text-muted-foreground leading-relaxed">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5 md:px-6 md:pb-6">
                  <Link href={service.link}>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-xs sm:text-sm md:text-base shadow-sm h-9 sm:h-10 md:h-11">
                      استكشف الآن
                      <ArrowLeft className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 rotate-180" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section - Enhanced with features */}
      <section className="py-8 sm:py-12 md:py-16 bg-white dark:bg-card dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground dark:text-white mb-3 sm:mb-5 md:mb-6 text-center">
              عن المستشفى السعودي الألماني
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground dark:text-muted-foreground text-center max-w-3xl mx-auto mb-6 sm:mb-8 md:mb-10 leading-relaxed px-2">
              المستشفى السعودي الألماني - صنعاء هو أحد أبرز المؤسسات الصحية في اليمن،
              حيث نقدم خدمات طبية متميزة بمعايير عالمية. نحن ملتزمون بتوفير رعاية صحية
              شاملة ومتكاملة لجميع المرضى.
            </p>
            
            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-10">
              {features.map((feature, index) => (
                <div key={index} className="flex flex-row sm:flex-col items-center sm:items-center gap-3 sm:gap-3 p-3 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-muted/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-right sm:text-center">
                    <h3 className="font-bold text-xs sm:text-sm md:text-base text-foreground dark:text-white mb-0.5 sm:mb-1">{feature.title}</h3>
                    <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground dark:text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs sm:text-sm md:text-base text-muted-foreground dark:text-muted-foreground leading-relaxed space-y-2 sm:space-y-3 text-right max-w-3xl mx-auto px-1">
              <p>
                يضم المستشفى نخبة من الأطباء والاستشاريين المتخصصين في مختلف المجالات
                الطبية، مع توفير أحدث التقنيات والأجهزة الطبية لضمان أفضل النتائج العلاجية.
              </p>
              <p>
                نؤمن بأهمية المسؤولية المجتمعية، ولذلك نقيم بشكل دوري مخيمات طبية خيرية
                مجانية لخدمة المجتمع وتقديم الرعاية الصحية للمحتاجين.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-br from-green-600 via-green-700 to-blue-600 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        <div className="container mx-auto px-4 sm:px-6 text-center relative">
          <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 md:mb-4 leading-tight px-1">
            جاهزون لخدمتك على مدار الساعة
          </h2>
          <p className="text-xs sm:text-sm md:text-lg lg:text-xl mb-5 sm:mb-6 md:mb-8 max-w-2xl mx-auto text-white/90 px-2">
            فريقنا الطبي المتميز في انتظارك. احجز موعدك الآن أو اتصل بنا للاستفسار
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center px-3 sm:px-0">
            <Link href="/doctors">
              <Button size="lg" className="w-full sm:w-auto bg-white dark:bg-card text-green-600 hover:bg-muted text-sm sm:text-base shadow-lg h-11 sm:h-12">
                احجز موعدك
                <Calendar className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <a href="tel:8000018" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white/80 text-white hover:bg-white/10 text-sm sm:text-base backdrop-blur-sm h-11 sm:h-12"
              >
                اتصل: 8000018
              </Button>
            </a>
          </div>
        </div>
      </section>

      <InstallPWAButton />
      <Footer />
    </div>
    </>
  );
}
