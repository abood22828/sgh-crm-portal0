/**
 * Home Page - الصفحة الرئيسية
 * 
 * This is the main landing page for the hospital portal.
 * It displays hospital information, services, and navigation to key sections.
 * 
 * @component
 * @returns {JSX.Element} The home page
 */
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * HomePage Component
 * 
 * Displays:
 * - Hospital branding and information
 * - Main navigation buttons (Offers, Doctors, Medical Camps)
 * - Hospital services and departments
 * - Contact information
 */
export default function HomePage() {
  return (
    <main className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          {/* Hospital Logo and Name */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-2">
              المستشفى السعودي الألماني - صنعاء
            </h1>
            <p className="text-xl text-blue-600 font-semibold">
              بعون الله نرعاكم كأهالينا
            </p>
            <p className="text-gray-600 mt-2">
              Caring Like Family
            </p>
          </div>

          {/* Hospital Description */}
          <div className="max-w-3xl mx-auto mb-12">
            <p className="text-lg text-gray-700 leading-relaxed">
              مستشفى متخصصة توفر خدمات طبية عالية الجودة بأحدث التقنيات الطبية وأفضل الكوادر الطبية المتخصصة. 
              نلتزم بتقديم رعاية صحية شاملة وآمنة لجميع مرضانا بمهنية واحترافية عالية.
            </p>
          </div>

          {/* Main Navigation Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Offers Button */}
            <Link href="/offers" className="block">
              <Button className="w-full h-24 text-xl font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all">
                🎁 العروض الطبية
              </Button>
            </Link>

            {/* Doctors Button */}
            <Link href="/doctors" className="block">
              <Button className="w-full h-24 text-xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all">
                👨‍⚕️ الأطباء
              </Button>
            </Link>

            {/* Medical Camps Button */}
            <Link href="/camps" className="block">
              <Button className="w-full h-24 text-xl font-bold bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all">
                🏥 المخيمات الطبية
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-900 mb-12">
            خدماتنا والأقسام الطبية
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Obstetrics and Gynecology */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">قسم أمراض وجراحة النساء والتوليد</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  خدمات متخصصة للولادة الطبيعية والقيصرية وعلاج أمراض النساء بأحدث التقنيات الطبية.
                </p>
              </CardContent>
            </Card>

            {/* General Surgery */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">قسم الجراحة العامة</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  جراحات عامة متنوعة بأحدث التقنيات الجراحية الحديثة وفريق طبي متخصص.
                </p>
              </CardContent>
            </Card>

            {/* Pediatrics */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">قسم طب الأطفال</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  رعاية متخصصة للأطفال حديثي الولادة والأطفال بجميع أعمارهم.
                </p>
              </CardContent>
            </Card>

            {/* Orthopedics */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">قسم العظام</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  علاج شامل لأمراض وإصابات العظام والمفاصل بأحدث الطرق العلاجية.
                </p>
              </CardContent>
            </Card>

            {/* Internal Medicine */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">قسم الطب الباطني</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  تشخيص وعلاج الأمراض الداخلية بمتابعة دقيقة وعناية شاملة.
                </p>
              </CardContent>
            </Card>

            {/* Emergency */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">قسم الطوارئ</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  خدمات طوارئ على مدار الساعة مع فريق متخصص وسريع الاستجابة.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 md:py-24 bg-blue-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-900 mb-12">
            لماذا تختار المستشفى السعودي الألماني؟
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex gap-4">
              <div className="text-3xl">✓</div>
              <div>
                <h3 className="text-xl font-bold text-blue-900 mb-2">كوادر طبية متخصصة</h3>
                <p className="text-gray-600">
                  أطباء وممرضات متخصصون بخبرات عالية وشهادات عالمية معترف بها.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-3xl">✓</div>
              <div>
                <h3 className="text-xl font-bold text-blue-900 mb-2">تقنيات حديثة</h3>
                <p className="text-gray-600">
                  أحدث الأجهزة الطبية والتقنيات العلاجية المتقدمة.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-3xl">✓</div>
              <div>
                <h3 className="text-xl font-bold text-blue-900 mb-2">رعاية شاملة</h3>
                <p className="text-gray-600">
                  متابعة دقيقة وشاملة لكل مريض من الاستقبال إلى الشفاء.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-3xl">✓</div>
              <div>
                <h3 className="text-xl font-bold text-blue-900 mb-2">أسعار منافسة</h3>
                <p className="text-gray-600">
                  خدمات طبية عالية الجودة بأسعار معقولة وعروض خاصة.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-8">
            تواصل معنا
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div>
              <p className="text-2xl font-bold text-blue-600 mb-2">☎️</p>
              <p className="text-gray-600">
                <strong>الهاتف:</strong>
                <br />
                +967 713 133 333
              </p>
            </div>

            <div>
              <p className="text-2xl font-bold text-blue-600 mb-2">📱</p>
              <p className="text-gray-600">
                <strong>الواتساب:</strong>
                <br />
                +967 734 333 706
              </p>
            </div>

            <div>
              <p className="text-2xl font-bold text-blue-600 mb-2">🏥</p>
              <p className="text-gray-600">
                <strong>الفاكس:</strong>
                <br />
                800 0018
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">
            © 2025 المستشفى السعودي الألماني - صنعاء. جميع الحقوق محفوظة.
          </p>
          <p className="text-blue-200">
            بعون الله نرعاكم كأهالينا
          </p>
        </div>
      </footer>
    </main>
  );
}
