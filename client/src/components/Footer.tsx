/**
 * Footer Component - تذييل الصفحة
 * 
 * Unified footer for all public pages
 */
import { APP_LOGO, APP_TITLE } from "@/const";

export default function Footer() {
  return (
    <footer className="bg-green-900 text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and Description */}
          <div className="text-center md:text-right">
            <img
              src={APP_LOGO}
              alt={APP_TITLE}
              className="h-12 w-auto mx-auto md:mx-0 mb-4 brightness-0 invert"
            />
            <p className="text-green-200 text-sm">{APP_TITLE}</p>
            <p className="text-green-300 text-xs mt-2">نرعاكم كأهالينا</p>
          </div>

          {/* Quick Links */}
          <div className="text-center">
            <h3 className="font-bold text-lg mb-4">روابط سريعة</h3>
            <ul className="space-y-2 text-green-200 text-sm">
              <li>
                <a href="/" className="hover:text-white transition-colors">
                  الرئيسية
                </a>
              </li>
              <li>
                <a href="/doctors" className="hover:text-white transition-colors">
                  الأطباء
                </a>
              </li>
              <li>
                <a href="/offers" className="hover:text-white transition-colors">
                  العروض
                </a>
              </li>
              <li>
                <a href="/camps" className="hover:text-white transition-colors">
                  المخيمات الطبية
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="text-center md:text-left">
            <h3 className="font-bold text-lg mb-4">تواصل معنا</h3>
            <div className="space-y-2 text-green-200 text-sm">
              <p>
                <span className="font-semibold">الهاتف:</span>{" "}
                <a href="tel:8000018" className="hover:text-white transition-colors">
                  8000018
                </a>
              </p>
              <p>
                <span className="font-semibold">العنوان:</span> صنعاء - اليمن
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-green-800 mt-8 pt-6 text-center text-green-300 text-sm">
          <p>
            © {new Date().getFullYear()} {APP_TITLE}. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}
