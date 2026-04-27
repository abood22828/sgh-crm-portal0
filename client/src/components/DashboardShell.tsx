import { useAuth } from "@/_core/hooks/useAuth";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Button } from "./ui/button";
import DashboardSidebarV2 from "./DashboardSidebarV2";
import { useLocation } from "wouter";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const { loading, user } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="flex flex-col items-center gap-6 p-8 max-w-sm w-full">
          <img
            src="/icon-72x72.png"
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
    <div className="min-h-screen bg-muted/50 dark:bg-gray-950 flex" dir="rtl">
      {/* Sidebar - Meta Business Suite Style V2 */}
      <DashboardSidebarV2 currentPath={location} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pb-0 pb-16">
        {children}
      </div>
    </div>
  );
}
