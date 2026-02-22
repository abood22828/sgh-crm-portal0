/**
 * Navbar Component - شريط التنقل العلوي
 * 
 * Unified navigation bar for all public pages with mobile hamburger menu
 * Enhanced responsive design for all screen sizes
 */
import { useState, useEffect, useRef } from "react";
import { Phone, Menu, X, ChevronLeft } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Link } from "wouter";

export default function Navbar() {
  const location = window.location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { label: "الرئيسية", path: "/" },
    { label: "الأطباء", path: "/doctors" },
    { label: "الأطباء الزائرين", path: "/visiting-doctors" },
    { label: "العروض", path: "/offers" },
    { label: "المخيمات الطبية", path: "/camps" },
  ];

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="bg-white dark:bg-card dark:bg-gray-900 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="flex items-center justify-between py-2.5 sm:py-3 md:py-4">
            {/* Mobile: Hamburger Button */}
            <button
              className="md:hidden flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-foreground dark:text-gray-200 hover:bg-muted dark:hover:bg-gray-800 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>

            {/* Logo and Title */}
            <Link href="/">
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 hover:opacity-80 transition-opacity cursor-pointer">
                <img src="/assets/new-logo.png" alt={APP_TITLE} className="h-5 sm:h-6 md:h-8 w-auto" />
                <div className="hidden xs:block sm:block">
                  <h1 className="text-[11px] sm:text-sm md:text-lg font-bold text-green-900 dark:text-green-400 leading-tight line-clamp-1">{APP_TITLE}</h1>
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground dark:text-muted-foreground">نرعاكم كأهالينا</p>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-6">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <span
                    className={`text-sm font-medium transition-colors hover:text-green-600 dark:hover:text-green-400 cursor-pointer whitespace-nowrap ${
                      location === item.path
                        ? "text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400 pb-1"
                        : "text-foreground dark:text-gray-300"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
            </nav>

            {/* Contact Button */}
            <a
              href="tel:8000018"
              className="flex items-center gap-1 sm:gap-1.5 md:gap-2 bg-green-600 text-white px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm md:text-base"
            >
              <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="font-semibold">8000018</span>
            </a>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" />
      )}

      {/* Mobile Slide Menu */}
      <div
        ref={menuRef}
        className={`md:hidden fixed top-0 right-0 z-[70] h-full w-[75vw] max-w-[300px] bg-white dark:bg-card dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border dark:border-gray-700">
          <div className="flex items-center gap-2">
            <img src="/assets/new-logo.png" alt={APP_TITLE} className="h-7 sm:h-8 w-auto" />
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-green-900 dark:text-green-400 leading-tight">
                المستشفى السعودي الألماني
              </h2>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground dark:text-muted-foreground">نرعاكم كأهالينا</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-gray-800"
            aria-label="إغلاق القائمة"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-2 sm:p-3">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <div
                className={`flex items-center justify-between px-3 sm:px-4 py-3 sm:py-3.5 rounded-lg sm:rounded-xl mb-0.5 sm:mb-1 transition-colors cursor-pointer ${
                  location === item.path
                    ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold"
                    : "text-foreground dark:text-gray-300 hover:bg-muted/50 dark:hover:bg-gray-800"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-sm sm:text-base">{item.label}</span>
                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-40" />
              </div>
            </Link>
          ))}
        </nav>

        {/* Menu Footer - Contact */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 border-t border-border dark:border-gray-700">
          <a
            href="tel:8000018"
            className="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:bg-green-700 transition-colors font-semibold text-sm sm:text-base"
          >
            <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>اتصل بنا: 8000018</span>
          </a>
          <Link href="/dashboard">
            <div className="flex items-center justify-center gap-2 w-full mt-2 border border-green-600 dark:border-green-500 text-green-700 dark:text-green-400 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors font-medium cursor-pointer text-xs sm:text-sm">
              لوحة التحكم
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
