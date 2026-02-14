/**
 * Navbar Component - شريط التنقل العلوي
 * 
 * Unified navigation bar for all public pages
 */
import { Phone } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Link } from "wouter";

export default function Navbar() {
  const location = window.location.pathname;

  const navItems = [
    { label: "الرئيسية", path: "/" },
    { label: "الأطباء", path: "/doctors" },
    { label: "الأطباء الزائرين", path: "/visiting-doctors" },
    { label: "العروض", path: "/offers" },
    { label: "المخيمات الطبية", path: "/camps" },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo and Title */}
          <Link href="/">
            <div className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
              <img src="/assets/new-logo.png" alt={APP_TITLE} className="h-12 w-auto" />
              <div className="hidden md:block">
                <h1 className="text-lg font-bold text-green-900">{APP_TITLE}</h1>
                <p className="text-xs text-gray-500">نرعاكم كأهالينا</p>
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <span
                  className={`text-sm font-medium transition-colors hover:text-green-600 cursor-pointer ${
                    location === item.path
                      ? "text-green-600 border-b-2 border-green-600 pb-1"
                      : "text-gray-700"
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
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Phone className="h-4 w-4" />
            <span className="font-semibold">8000018</span>
          </a>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center gap-4 pb-3 overflow-x-auto">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <span
                className={`text-sm font-medium whitespace-nowrap transition-colors hover:text-green-600 cursor-pointer ${
                  location === item.path
                    ? "text-green-600 border-b-2 border-green-600 pb-1"
                    : "text-gray-700"
                }`}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
