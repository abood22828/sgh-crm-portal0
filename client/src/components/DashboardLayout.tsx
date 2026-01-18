import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import DashboardSidebar from "./DashboardSidebar";

import { useLocation } from "wouter";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="relative">
                <img
                  src={APP_LOGO}
                  alt={APP_TITLE}
                  className="h-20 w-20 rounded-xl object-cover shadow"
                />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{APP_TITLE}</h1>
              <p className="text-sm text-muted-foreground">
                Please sign in to continue
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex" dir="rtl">
      {/* Sidebar */}
      <DashboardSidebar currentPath={location} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pb-0 pb-20">
        {/* Top Header Bar */}
        <div className="bg-white border-b shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <img
                src={APP_LOGO}
                alt={APP_TITLE}
                className="h-10 w-10 md:h-12 md:w-12 rounded-lg object-cover shadow-sm"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-xl font-bold text-primary">
                  {APP_TITLE}
                </h1>
                <p className="text-xs text-muted-foreground hidden md:block">
                  نرعاكم كأهلينا - Caring like family
                </p>
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex items-center gap-2">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.role === 'admin' ? 'مدير النظام' : 'مستخدم'}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {user.name?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {children}
      </div>
    </div>
  );
}
