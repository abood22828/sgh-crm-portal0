/**
 * Footer Component - تذييل الصفحة
 * 
 * Unified footer for all public pages with improved responsive layout
 */
import { Phone, MapPin, Clock } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-green-900 text-white py-8 sm:py-10 md:py-12 mt-auto">
      <div className="container mx-auto px-4 sm:px-5 md:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
          {/* Logo and Description */}
          <div className="text-center sm:text-right">
            <img
              src="/assets/new-logo.png"
              alt={APP_TITLE}
              className="h-10 sm:h-12 w-auto mx-auto sm:mx-0 mb-3 sm:mb-4 brightness-0 invert"
            />
            <p className="text-green-100 text-xs sm:text-sm font-medium">{APP_TITLE}</p>
            <p className="text-green-300 text-[10px] sm:text-xs mt-1 sm:mt-1.5">نرعاكم كأهالينا - Caring like family</p>
            <p className="text-green-400/70 text-[10px] sm:text-xs mt-2 sm:mt-3 leading-relaxed max-w-xs mx-auto sm:mx-0">
              منصة الحجز الإلكترونية للمستشفى السعودي الألماني - صنعاء
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center sm:text-right">
            <h3 className="font-bold text-sm sm:text-base mb-3 sm:mb-4 text-green-100">روابط سريعة</h3>
            <ul className="space-y-2 sm:space-y-2.5 text-green-200 text-xs sm:text-sm">
              <li>
                <Link href="/">
                  <span className="hover:text-white transition-colors cursor-pointer">الرئيسية</span>
                </Link>
              </li>
              <li>
                <Link href="/doctors">
                  <span className="hover:text-white transition-colors cursor-pointer">الأطباء</span>
                </Link>
              </li>
              <li>
                <Link href="/visiting-doctors">
                  <span className="hover:text-white transition-colors cursor-pointer">الأطباء الزائرين</span>
                </Link>
              </li>
              <li>
                <Link href="/offers">
                  <span className="hover:text-white transition-colors cursor-pointer">العروض الطبية</span>
                </Link>
              </li>
              <li>
                <Link href="/camps">
                  <span className="hover:text-white transition-colors cursor-pointer">المخيمات الطبية</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="text-center sm:text-right">
            <h3 className="font-bold text-sm sm:text-base mb-3 sm:mb-4 text-green-100">تواصل معنا</h3>
            <div className="space-y-2.5 sm:space-y-3 text-green-200 text-xs sm:text-sm">
              <div className="flex items-center gap-2 sm:gap-2.5 justify-center sm:justify-start">
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 shrink-0" />
                <a href="tel:8000018" className="hover:text-white transition-colors font-medium">
                  8000018
                </a>
              </div>
              <div className="flex items-center gap-2 sm:gap-2.5 justify-center sm:justify-start">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 shrink-0" />
                <span>صنعاء - اليمن</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-2.5 justify-center sm:justify-start">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 shrink-0" />
                <span>24/7 خدمة متواصلة</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-green-800/60 mt-6 sm:mt-8 md:mt-10 pt-4 sm:pt-6 text-center text-green-400/70 text-[10px] sm:text-xs">
          <p>
            © {new Date().getFullYear()} {APP_TITLE}. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}
