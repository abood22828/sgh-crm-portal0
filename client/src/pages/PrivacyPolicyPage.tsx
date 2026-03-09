/**
 * Privacy Policy Page - سياسة الخصوصية
 * 
 * Compliant with:
 * - Saudi Arabia's Personal Data Protection Law (PDPL)
 * - Meta/WhatsApp Business API requirements
 * - SGH Group privacy standards (saudigermanhealth.com/en/privacy-policy)
 * - GDPR principles for international compliance
 */

import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Phone, Mail, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = "سياسة الخصوصية | المستشفى السعودي الألماني - صنعاء";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-l from-green-800 to-green-600 text-white py-10 sm:py-14">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-green-200 text-sm mb-3">
            <Link href="/">
              <span className="hover:text-white cursor-pointer">الرئيسية</span>
            </Link>
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span>سياسة الخصوصية</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-green-300 shrink-0" />
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">سياسة الخصوصية</h1>
              <p className="text-green-200 text-sm sm:text-base mt-1">
                آخر تحديث: مارس 2026 | المستشفى السعودي الألماني - صنعاء
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 md:p-10 space-y-8 text-gray-700 leading-relaxed">

          {/* Introduction */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-3 border-b border-green-100 pb-2">
              1. المقدمة
            </h2>
            <p className="text-sm sm:text-base">
              يلتزم المستشفى السعودي الألماني - صنعاء بحماية خصوصيتك وصون بياناتك الشخصية وفقاً لأحكام نظام حماية البيانات الشخصية في المملكة العربية السعودية (PDPL) وأفضل الممارسات الدولية. تُوضّح هذه السياسة كيفية جمع بياناتك واستخدامها وتخزينها ومشاركتها، وكيف نضمن التعامل معها بمسؤولية وشفافية تامة.
            </p>
            <p className="text-sm sm:text-base mt-3">
              تنطبق هذه السياسة على جميع الخدمات الرقمية التي نقدمها، بما في ذلك موقعنا الإلكتروني، وتطبيق الجوال، وخدمات الحجز الإلكتروني، والتواصل عبر واتساب وفيسبوك وإنستغرام.
            </p>
          </section>

          {/* Data Collected */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-3 border-b border-green-100 pb-2">
              2. البيانات التي نجمعها
            </h2>
            <p className="text-sm sm:text-base mb-4">
              نجمع فقط البيانات الضرورية لتقديم خدماتنا الصحية وإدارة عملياتنا وتلبية المتطلبات القانونية والتنظيمية، وتشمل:
            </p>
            <div className="space-y-4">
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 text-sm sm:text-base mb-2">أ. بيانات المريض والمستخدم</h3>
                <p className="text-sm">الاسم الكامل، رقم الهاتف، البريد الإلكتروني، العمر، الجنس، والبيانات الصحية الضرورية لتقديم الرعاية الطبية ومعالجة مطالبات التأمين.</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 text-sm sm:text-base mb-2">ب. بيانات الخدمات الرقمية</h3>
                <p className="text-sm">تفاصيل التسجيل عبر الإنترنت، بيانات الحجز والمواعيد، والتفاعلات عبر تطبيقاتنا ومنصاتنا الرقمية.</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 text-sm sm:text-base mb-2">ج. بيانات التتبع والتحليل</h3>
                <p className="text-sm">مصدر الزيارة (فيسبوك، واتساب، جوجل، أو مباشر)، مسار التنقل داخل الموقع، ومعلومات الجهاز والمتصفح — وذلك بناءً على موافقتك فقط.</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="font-semibold text-orange-800 text-sm sm:text-base mb-2">د. مسودات النماذج غير المكتملة (Lead Recovery)</h3>
                <p className="text-sm">في حال بدأت ملء نموذج حجز ولم تكمله، قد نحفظ البيانات المُدخلة مؤقتاً (رقم الهاتف أو الاسم) للتواصل معك ومساعدتك في إتمام الحجز. يمكنك طلب حذف هذه البيانات في أي وقت.</p>
              </div>
            </div>
          </section>

          {/* Collection Methods */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-3 border-b border-green-100 pb-2">
              3. طرق جمع البيانات
            </h2>
            <p className="text-sm sm:text-base">
              نجمع بياناتك من خلال وسائل آمنة وقانونية، تشمل: النماذج الإلكترونية وتطبيقات الجوال وبوابات المرضى، وأنظمة المعلومات الصحية والسجلات الطبية الإلكترونية، وملفات تعريف الارتباط (Cookies) عند استخدامك لموقعنا أو منصاتنا الرقمية، والتواصل المباشر عبر الهاتف أو واتساب أو وسائل التواصل الاجتماعي.
            </p>
          </section>

          {/* WhatsApp API */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-3 border-b border-green-100 pb-2">
              4. استخدام واتساب للأعمال (WhatsApp Business API)
            </h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-5">
              <p className="text-sm sm:text-base mb-3">
                يستخدم المستشفى السعودي الألماني - صنعاء واجهة برمجة تطبيقات واتساب للأعمال المُقدَّمة من شركة Meta Platforms, Inc. لأغراض التواصل مع المرضى والمستخدمين، وتشمل:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">•</span>
                  <span>إرسال تأكيدات الحجز والمواعيد الطبية فور التسجيل.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">•</span>
                  <span>إرسال تذكيرات بالمواعيد والفحوصات الطبية.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">•</span>
                  <span>إرسال عروض طبية وحملات توعوية صحية (بموافقتك المسبقة فقط).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">•</span>
                  <span>التواصل لمتابعة الحجوزات غير المكتملة وتقديم المساعدة.</span>
                </li>
              </ul>
              <p className="text-sm mt-3 text-gray-600">
                <strong>ملاحظة:</strong> يُعالَج رقم هاتفك عبر خوادم Meta وفقاً لسياسة خصوصية Meta المتاحة على <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-green-700 underline">whatsapp.com/legal/privacy-policy</a>. يمكنك إلغاء الاشتراك في رسائل واتساب التسويقية في أي وقت بإرسال كلمة "إلغاء" أو التواصل معنا مباشرة.
              </p>
            </div>
          </section>

          {/* Meta Pixel & Ads */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-3 border-b border-green-100 pb-2">
              5. تقنيات Meta للإعلانات والقياس
            </h2>
            <p className="text-sm sm:text-base mb-3">
              بموافقتك على ملفات تعريف الارتباط التسويقية، قد نستخدم تقنيات Meta (فيسبوك وإنستغرام) لأغراض قياس أداء الإعلانات وتحسين تجربتك، وتشمل:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-semibold text-sm mb-1">Meta Pixel</h4>
                <p className="text-xs text-gray-600">تتبع تحويلات الإعلانات وقياس فعالية حملاتنا التسويقية على فيسبوك وإنستغرام.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-semibold text-sm mb-1">Conversions API</h4>
                <p className="text-xs text-gray-600">مشاركة أحداث التحويل مع Meta من خادمنا مباشرةً لتحسين دقة قياس الإعلانات.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-semibold text-sm mb-1">Custom Audiences</h4>
                <p className="text-xs text-gray-600">إنشاء جماهير مخصصة لاستهداف إعلانات ذات صلة بناءً على تفاعلاتك مع خدماتنا.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-semibold text-sm mb-1">UTM Tracking</h4>
                <p className="text-xs text-gray-600">تتبع مصدر زيارتك (فيسبوك، واتساب، جوجل) لتحسين تجربتك وتخصيص العروض.</p>
              </div>
            </div>
          </section>

          {/* Data Use */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-3 border-b border-green-100 pb-2">
              6. كيف نستخدم بياناتك
            </h2>
            <p className="text-sm sm:text-base">
              تُستخدم بياناتك لدعم الأنشطة الصحية والإدارية، وتشمل: تقديم الخدمات الطبية عالية الجودة والآمنة، وإدارة سجلات الموظفين والمستشفى، والوفاء بالالتزامات القانونية والتنظيمية، وضمان التواصل الفعّال وتنسيق الخدمات، وتحسين تجربة المستخدم على منصاتنا الرقمية، وإرسال تحديثات وعروض ذات صلة بخدماتنا (بموافقتك فقط).
            </p>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-3 border-b border-green-100 pb-2">
              7. مشاركة البيانات
            </h2>
            <p className="text-sm sm:text-base mb-3">
              لا نبيع بياناتك الشخصية لأي طرف ثالث. نشارك البيانات فقط عند الضرورة ولأغراض مشروعة، تشمل:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2"><span className="text-green-600 font-bold mt-0.5">•</span><span>المختبرات والمرافق الطبية لأغراض التشخيص والعلاج.</span></li>
              <li className="flex items-start gap-2"><span className="text-green-600 font-bold mt-0.5">•</span><span>شركات التأمين لمعالجة المطالبات والتسويات.</span></li>
              <li className="flex items-start gap-2"><span className="text-green-600 font-bold mt-0.5">•</span><span>مزودي الخدمات التقنية (مثل Meta وGoogle) لأغراض الإعلانات والتحليل — بموافقتك.</span></li>
              <li className="flex items-start gap-2"><span className="text-green-600 font-bold mt-0.5">•</span><span>الجهات الحكومية عند الاقتضاء القانوني.</span></li>
            </ul>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-3 border-b border-green-100 pb-2">
              8. ملفات تعريف الارتباط (Cookies)
            </h2>
            <p className="text-sm sm:text-base mb-4">
              يستخدم موقعنا وتطبيقاتنا ملفات تعريف الارتباط لضمان التشغيل السلس وتحسين تجربتك. يمكنك إدارة تفضيلاتك عبر شريط الموافقة الذي يظهر عند زيارة الموقع لأول مرة.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-green-50">
                    <th className="border border-gray-200 p-2 text-right font-semibold text-green-800">النوع</th>
                    <th className="border border-gray-200 p-2 text-right font-semibold text-green-800">الغرض</th>
                    <th className="border border-gray-200 p-2 text-right font-semibold text-green-800">إلزامي؟</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 p-2 font-medium">الأساسية</td>
                    <td className="border border-gray-200 p-2">تشغيل الموقع، الجلسات، الأمان</td>
                    <td className="border border-gray-200 p-2 text-green-700 font-medium">نعم دائماً</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 p-2 font-medium">التحليلية</td>
                    <td className="border border-gray-200 p-2">قياس حركة المرور وتحسين الموقع</td>
                    <td className="border border-gray-200 p-2 text-orange-600">بموافقتك</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-2 font-medium">التسويقية</td>
                    <td className="border border-gray-200 p-2">الإعلانات وإعادة الاستهداف (Meta Pixel)</td>
                    <td className="border border-gray-200 p-2 text-orange-600">بموافقتك</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* PWA & Local Storage */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-3 border-b border-green-100 pb-2">
              9. التطبيق التدريجي (PWA) والتخزين المحلي
            </h2>
            <p className="text-sm sm:text-base">
              يدعم موقعنا تقنية التطبيق التدريجي (Progressive Web App) التي تتيح لك تثبيته على جهازك والوصول إليه بدون إنترنت. لتحقيق ذلك، نستخدم التخزين المحلي (LocalStorage وIndexedDB وService Worker Cache) لحفظ بعض البيانات على جهازك، مثل تفضيلاتك وبيانات الحجوزات المؤقتة. هذه البيانات تبقى على جهازك فقط ولا تُرسل إلى خوادمنا إلا عند استعادة الاتصال بالإنترنت.
            </p>
          </section>

          {/* Storage & Protection */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-3 border-b border-green-100 pb-2">
              10. تخزين البيانات وحمايتها
            </h2>
            <p className="text-sm sm:text-base mb-3">
              تُخزَّن بياناتك بصورة رئيسية داخل المملكة العربية السعودية. في حالات محدودة، قد تُعالَج خارج المملكة وفق ضمانات وعقود معتمدة بموجب نظام حماية البيانات الشخصية (PDPL).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">التدابير التقنية</h4>
                <ul className="text-xs space-y-1 text-gray-600">
                  <li>• تشفير البيانات أثناء النقل والتخزين</li>
                  <li>• التحكم في الوصول والمصادقة متعددة العوامل</li>
                  <li>• جدران الحماية وأنظمة مكافحة الفيروسات</li>
                  <li>• اختبارات أمنية دورية</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">فترات الاحتفاظ</h4>
                <ul className="text-xs space-y-1 text-gray-600">
                  <li>• سجلات المرضى: 10 سنوات (وفق متطلبات وزارة الصحة)</li>
                  <li>• ملفات الموارد البشرية: مدة العمل + 5 سنوات</li>
                  <li>• بيانات التأمين: وفق القوانين المالية</li>
                  <li>• السجلات الرقمية: 1-3 سنوات</li>
                </ul>
              </div>
            </div>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-3 border-b border-green-100 pb-2">
              11. حقوقك بموجب نظام حماية البيانات الشخصية (PDPL)
            </h2>
            <p className="text-sm sm:text-base mb-4">يحق لك ممارسة الحقوق التالية في أي وقت:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: "الإعلام", desc: "الحق في معرفة كيفية استخدام بياناتك." },
                { title: "الوصول", desc: "الحق في الاطلاع على بياناتك الشخصية المحفوظة لدينا." },
                { title: "الحذف", desc: "الحق في طلب حذف بياناتك عند انتفاء الحاجة إليها." },
                { title: "سحب الموافقة", desc: "الحق في سحب موافقتك على المعالجة الاختيارية في أي وقت." },
                { title: "التصحيح", desc: "الحق في تصحيح أو تحديث بياناتك غير الدقيقة أو الناقصة." },
                { title: "نسخة من البيانات", desc: "الحق في الحصول على نسخة من بياناتك الشخصية." },
              ].map((right) => (
                <div key={right.title} className="flex items-start gap-3 bg-green-50 rounded-lg p-3">
                  <Shield className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-sm text-green-800">{right.title}: </span>
                    <span className="text-sm text-gray-700">{right.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm mt-4 text-gray-600">
              ستُعالَج جميع الطلبات الصحيحة خلال 30 يوماً، مع إمكانية التمديد 30 يوماً إضافية عند الاقتضاء القانوني.
            </p>
          </section>

          {/* Opt-out */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-3 border-b border-green-100 pb-2">
              12. إلغاء الاشتراك وحذف البيانات
            </h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 sm:p-5">
              <p className="text-sm sm:text-base mb-3">
                يمكنك في أي وقت:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-0.5">•</span>
                  <span>إلغاء الاشتراك في الرسائل التسويقية عبر واتساب بإرسال كلمة "إلغاء" أو "STOP".</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-0.5">•</span>
                  <span>إلغاء الاشتراك في رسائل البريد الإلكتروني التسويقية عبر رابط "إلغاء الاشتراك" في أسفل كل رسالة.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-0.5">•</span>
                  <span>طلب حذف بياناتك الشخصية بالكامل من خلال التواصل مع مسؤول حماية البيانات.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-0.5">•</span>
                  <span>إدارة تفضيلات ملفات تعريف الارتباط عبر شريط الموافقة أو إعدادات المتصفح.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Children */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-3 border-b border-green-100 pb-2">
              13. بيانات الأطفال
            </h2>
            <p className="text-sm sm:text-base">
              نحرص على حماية خصوصية الأطفال. لا يمكن إنشاء حسابات إلا للأفراد الذين تجاوزوا سن الثامنة عشرة. بالنسبة للأطفال، يجب أن يُنشئ الحساب ويُدار من قِبل أحد الوالدين أو الأوصياء القانونيين.
            </p>
          </section>

          {/* Contact DPO */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-3 border-b border-green-100 pb-2">
              14. التواصل مع مسؤول حماية البيانات
            </h2>
            <p className="text-sm sm:text-base mb-4">
              إذا كنت ترغب في ممارسة أي من حقوقك المتعلقة بحماية البيانات، أو إذا كنت تعتقد أن بياناتك الشخصية قد تعرضت لسوء المعالجة، يمكنك التواصل مع مسؤول حماية البيانات في المستشفى السعودي الألماني - صنعاء :
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a href="tel:+967734000018" className="flex items-center gap-3 bg-green-50 rounded-lg p-4 hover:bg-green-100 transition-colors">
                <Phone className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">هاتف</p>
                  <p className="font-medium text-sm">+967 734000018</p>
                </div>
              </a>
              <a href="mailto:DPO@sghsanaa.net" className="flex items-center gap-3 bg-green-50 rounded-lg p-4 hover:bg-green-100 transition-colors">
                <Mail className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">بريد إلكتروني</p>
                  <p className="font-medium text-sm">DPO@sghsanaa.net</p>
                </div>
              </a>
            </div>
            <p className="text-sm mt-4 text-gray-600">
              إذا لم تكن راضياً عن ردنا خلال 30 يوماً، يمكنك تقديم شكوى إلى المركز الوطني للمعلومات (Yemen-NIC).
            </p>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-3 border-b border-green-100 pb-2">
              15. تحديثات سياسة الخصوصية
            </h2>
            <p className="text-sm sm:text-base">
              قد نُحدّث هذه السياسة من وقت لآخر لتعكس التغييرات القانونية أو التشغيلية. ستكون النسخة الأحدث متاحة دائماً على موقعنا الرسمي. في حال إجراء تغييرات جوهرية، سنُخطرك عبر البريد الإلكتروني أو إشعار بارز على الموقع.
            </p>
            <p className="text-sm mt-3 text-gray-500">
              آخر تحديث لهذه السياسة: مارس 2026
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
