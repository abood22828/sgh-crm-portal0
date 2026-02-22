import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import DashboardSidebar from "./DashboardSidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, Bell } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function DashboardLayout({
  children,
  pageTitle,
  pageDescription,
}: {
  children: React.ReactNode;
  pageTitle?: string;
  pageDescription?: string;
}) {
  const { loading, user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="flex flex-col items-center gap-6 p-8 max-w-sm w-full">
          <img
            src="/assets/new-logo.png"
            alt={APP_TITLE}
            className="h-20 w-auto object-contain"
          />
          <div className="text-center space-y-1.5">
            <h1 className="text-xl font-bold tracking-tight">{APP_TITLE}</h1>
            <p className="text-sm text-muted-foreground">
              يرجى تسجيل الدخول للوصول إلى لوحة التحكم
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full"
          >
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex" dir="rtl">
      {/* Sidebar - Meta Business Suite Style */}
      <DashboardSidebar currentPath={location} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pb-0 pb-14">
        {/* Top Header Bar */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 md:px-6">
            {/* Page Title */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <img
                src="/assets/new-logo.png"
                alt="المستشفى السعودي الألماني"
                className="h-9 md:h-10 w-auto object-contain flex-shrink-0 lg:hidden"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                  {pageTitle || "لوحة التحكم"}
                </h1>
                {pageDescription && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block truncate">
                    {pageDescription}
                  </p>
                )}
              </div>
            </div>
            
            {/* User Info with Dropdown */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer focus:outline-none">
                    <div className="text-right hidden md:block">
                      <p className="text-sm font-medium leading-tight text-gray-900 dark:text-gray-100">{user.name}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{user.role === 'admin' ? 'مدير النظام' : 'مستخدم'}</p>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center ring-2 ring-blue-100 dark:ring-blue-800">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                        {user.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-right">
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-[11px] text-muted-foreground">{user.email || 'لا يوجد بريد إلكتروني'}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-right text-sm"
                    onClick={() => setLocation('/dashboard/profile')}
                  >
                    <User className="ml-2 h-4 w-4" />
                    <span>الملف الشخصي</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-right text-sm"
                    onClick={() => setLocation('/dashboard/settings')}
                  >
                    <Settings className="ml-2 h-4 w-4" />
                    <span>الإعدادات</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-right text-sm text-red-600 focus:text-red-600"
                    onClick={async () => {
                      await logout();
                      toast.success('تم تسجيل الخروج بنجاح');
                      setLocation('/');
                    }}
                  >
                    <LogOut className="ml-2 h-4 w-4" />
                    <span>تسجيل الخروج</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
