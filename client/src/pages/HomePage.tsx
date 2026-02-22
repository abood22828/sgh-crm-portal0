/**
 * HomePage - الصفحة الرئيسية
 * 
 * Main landing page with hospital information and platform overview
 * Optimized for mobile and desktop
 */
import { Heart, Stethoscope, Calendar, TrendingUp, ArrowLeft } from "lucide-react";
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
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/30",
    },
    {
      icon: TrendingUp,
      title: "العروض الطبية",
      description: "استفد من عروضنا الطبية المميزة بأسعار تنافسية وخدمات متكاملة",
      link: "/offers",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/30",
    },
    {
      icon: Heart,
      title: "المخيمات الطبية الخيرية",
      description: "خدمات طبية مجانية للمجتمع ضمن مسؤوليتنا الاجتماعية",
      link: "/camps",
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/30",
    },
  ];

  const stats = [
    { number: "22+", label: "طبيب واستشاري" },
    { number: "15+", label: "تخصص طبي" },
    { number: "1000+", label: "مريض سعيد" },
    { number: "24/7", label: "خدمة متواصلة" },
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
      <section className="py-10 md:py-20 bg-gradient-to-r from-green-600 to-blue-600 text-white overflow-hidden">
        <div className="container mx-auto px-5 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <img
              src="/assets/new-logo.png"
              alt={APP_TITLE}
              className="h-16 sm:h-20 w-auto mx-auto mb-4 sm:mb-6"
            />
            <h1 className="text-xl sm:text-3xl md:text-5xl font-bold mb-3 sm:mb-4 leading-tight px-2">{APP_TITLE}</h1>
            <p className="text-base sm:text-xl md:text-2xl mb-1.5 sm:mb-2 text-green-100">
              Saudi German Hospital
            </p>
            <p className="text-sm sm:text-lg md:text-xl mb-5 sm:mb-8 text-blue-100">
              نرعاكم كأهالينا - Caring like family
            </p>
            <p className="text-xs sm:text-base md:text-lg mb-5 sm:mb-8 leading-relaxed max-w-3xl mx-auto px-2">
              منصة الحجز الإلكترونية للمستشفى السعودي الألماني - صنعاء. احجز موعدك مع أفضل
              الأطباء، استفد من العروض الطبية المميزة، وشارك في المخيمات الطبية الخيرية.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center px-4 sm:px-0">
              <Link href="/doctors">
                <Button size="lg" className="w-full sm:w-auto bg-white text-green-600 hover:bg-gray-100 text-base">
                  احجز موعدك الآن
                  <ArrowLeft className="mr-2 h-5 w-5 rotate-180" />
                </Button>
              </Link>
              <a href="tel:8000018" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-white text-white hover:bg-white/10 text-base"
                >
                  اتصل بنا: 8000018
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 sm:py-12 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-3 sm:p-4">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400 mb-1 sm:mb-2">
                  {stat.number}
                </div>
                <div className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-10 sm:py-16">
        <div className="container mx-auto px-5 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-green-900 dark:text-green-400 mb-3 sm:mb-4">
              خدماتنا الإلكترونية
            </h2>
            <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              نوفر لك منصة متكاملة لحجز المواعيد والاستفادة من العروض الطبية والمشاركة في
              المخيمات الخيرية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
            {services.map((service, index) => (
              <Card
                key={index}
                className="hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-green-500 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-green-500"
              >
                <CardHeader className="pb-3 sm:pb-6">
                  <div
                    className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full ${service.bgColor} flex items-center justify-center mb-3 sm:mb-4`}
                  >
                    <service.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${service.color}`} />
                  </div>
                  <CardTitle className="text-base sm:text-xl text-green-900 dark:text-green-400 text-right">{service.title}</CardTitle>
                  <CardDescription className="text-xs sm:text-base text-right dark:text-gray-400">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={service.link}>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-sm sm:text-base">
                      استكشف الآن
                      <ArrowLeft className="mr-2 h-4 w-4 rotate-180" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-10 sm:py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-5 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-green-900 dark:text-green-400 mb-4 sm:mb-6 text-center">
              عن المستشفى السعودي الألماني
            </h2>
            <div className="prose prose-sm sm:prose-lg max-w-none text-gray-700 dark:text-gray-300 leading-relaxed space-y-3 sm:space-y-4 text-right">
              <p>
                المستشفى السعودي الألماني - صنعاء هو أحد أبرز المؤسسات الصحية في اليمن،
                حيث نقدم خدمات طبية متميزة بمعايير عالمية. نحن ملتزمون بتوفير رعاية صحية
                شاملة ومتكاملة لجميع المرضى.
              </p>
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
      <section className="py-10 sm:py-16 bg-gradient-to-r from-green-600 to-blue-600 text-white overflow-hidden">
        <div className="container mx-auto px-5 sm:px-6 text-center">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 leading-tight">
            جاهزون لخدمتك على مدار الساعة
          </h2>
          <p className="text-sm sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto">
            فريقنا الطبي المتميز في انتظارك. احجز موعدك الآن أو اتصل بنا للاستفسار
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center px-4 sm:px-0">
            <Link href="/doctors">
              <Button size="lg" className="w-full sm:w-auto bg-white text-green-600 hover:bg-gray-100 text-base">
                احجز موعدك
                <Calendar className="mr-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="tel:8000018" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white text-white hover:bg-white/10 text-base"
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
