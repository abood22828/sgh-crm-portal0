/**
 * Birth Offer Landing Page - صفحة هبوط عرض الولادة
 * 
 * Specialized landing page for the birth/maternity offer campaign.
 * Includes offer details, pricing, video, and registration form.
 * 
 * @component
 * @returns {JSX.Element} The birth offer landing page
 */
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import OfferForm from '@/components/offers/OfferForm';
import MetaPixel from '@/components/MetaPixel';

/**
 * BirthOfferPage Component
 * 
 * Displays:
 * - Offer image and details
 * - Pricing information
 * - Video from Facebook
 * - Registration form
 * - Meta Pixel tracking
 */
export default function BirthOfferPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <main className="w-full">
      {/* Meta Pixel */}
      <MetaPixel />

      {/* Hero Section with Offer Image */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Offer Image */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-md h-96 bg-gray-200 rounded-lg overflow-hidden shadow-lg">
                <Image
                  src="/images/offers/birth-offer.jpg"
                  alt="عرض الولادة - المستشفى السعودي الألماني"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Offer Details */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
                عرض الولادة والتوليد
              </h1>
              <p className="text-lg text-gray-700 mb-6">
                عرض خاص ومحدود على خدمات الولادة الطبيعية والقيصرية ومعالجة استئصال الرحم تحت إشراف د. علية شعيب
              </p>

              <div className="bg-blue-50 p-6 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-blue-900 mb-4">الخدمات المشمولة:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    الفحوصات الطبية الشاملة
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    العملية الجراحية أو الولادة
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    الرقود والعناية الطبية
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    استثناء الأدوية
                  </li>
                </ul>
              </div>

              <Button
                onClick={() => setShowForm(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6"
              >
                سجل الآن
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-12">
            الأسعار والعروض
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Cesarean Section */}
            <Card className="border-2 border-green-500 shadow-lg">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-center text-green-700">العملية القيصرية</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <p className="text-4xl font-bold text-green-600">185,000</p>
                  <p className="text-gray-600">ريال</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ العملية الجراحية</li>
                  <li>✓ الرقود والعناية</li>
                  <li>✓ الفحوصات</li>
                </ul>
              </CardContent>
            </Card>

            {/* Natural Birth */}
            <Card className="border-2 border-blue-500 shadow-lg">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-center text-blue-700">الولادة الطبيعية</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <p className="text-4xl font-bold text-blue-600">60,000</p>
                  <p className="text-gray-600">ريال</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ الولادة الطبيعية</li>
                  <li>✓ الرقود والعناية</li>
                  <li>✓ الفحوصات</li>
                </ul>
              </CardContent>
            </Card>

            {/* Hysterectomy */}
            <Card className="border-2 border-purple-500 shadow-lg">
              <CardHeader className="bg-purple-50">
                <CardTitle className="text-center text-purple-700">استئصال الرحم</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <p className="text-4xl font-bold text-purple-600">250,000</p>
                  <p className="text-gray-600">ريال</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ العملية الجراحية</li>
                  <li>✓ الرقود والعناية</li>
                  <li>✓ الفحوصات</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-12 md:py-16 bg-blue-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-12">
            تعرف على قسم الولادة والتوليد
          </h2>

          <div className="max-w-2xl mx-auto">
            <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Freel%2F24654540990901723&show_text=false&width=560&appId=1234567890"
                width="560"
                height="315"
                style={{ border: 'none', overflow: 'hidden' }}
                scrolling="no"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen={true}
              ></iframe>
            </div>
            <p className="text-center text-gray-600 mt-4">
              شاهد فيديو يشرح خدمات قسم الولادة والتوليد والعناية بالأمهات والمواليد
            </p>
          </div>
        </div>
      </section>

      {/* Doctor Information */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-2 border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-2xl">د. علية شعيب</CardTitle>
              <CardDescription className="text-lg">
                استشاري أول ورئيس قسم أمراض وجراحة النساء والتوليد
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-blue-900 mb-2">المؤهلات:</h4>
                  <p className="text-gray-700">
                    أستاذ جراحة النساء والتوليد - كلية الطب جامعة صنعاء
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 mb-2">الخبرة:</h4>
                  <p className="text-gray-700">
                    خبرة عملية طويلة في مجال الولادة والتوليد والعمليات الجراحية النسائية
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 mb-2">التخصص:</h4>
                  <p className="text-gray-700">
                    الولادة الطبيعية والقيصرية، علاج أمراض النساء، استئصال الرحم
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Registration Form Section */}
      {showForm && (
        <section className="py-12 md:py-16 bg-blue-50">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>نموذج التسجيل في عرض الولادة</CardTitle>
                  <CardDescription>
                    يرجى ملء البيانات التالية للتسجيل في العرض
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <OfferForm
                    offerId="birth-offer"
                    offerTitle="عرض الولادة والتوليد"
                    onSuccess={() => {
                      setShowForm(false);
                      // Show success message
                      alert('تم التسجيل بنجاح! سيتم التواصل معك قريبًا');
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {!showForm && (
        <section className="py-12 md:py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              لا تفوت هذا العرض المحدود!
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              عرض خاص ومحدود الوقت على خدمات الولادة والتوليد. سجل الآن واحصل على أفضل رعاية طبية
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6"
            >
              سجل الآن - عرض محدود
            </Button>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-blue-900 mb-8">
            للاستفسار والتواصل
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div>
              <p className="text-2xl mb-2">☎️</p>
              <p className="text-gray-600">
                <strong>الهاتف:</strong>
                <br />
                <a href="tel:+967713133333" className="text-blue-600 hover:underline">
                  +967 713 133 333
                </a>
              </p>
            </div>

            <div>
              <p className="text-2xl mb-2">📱</p>
              <p className="text-gray-600">
                <strong>الواتساب:</strong>
                <br />
                <a href="https://wa.me/967734333706" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  +967 734 333 706
                </a>
              </p>
            </div>

            <div>
              <p className="text-2xl mb-2">🏥</p>
              <p className="text-gray-600">
                <strong>الفاكس:</strong>
                <br />
                800 0018
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
