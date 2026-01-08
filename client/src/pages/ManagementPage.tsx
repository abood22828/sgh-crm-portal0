import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import DashboardSidebar from "@/components/DashboardSidebar";
import OffersManagement from "@/components/OffersManagement";
import CampsManagement from "@/components/CampsManagement";
import DoctorsManagement from "@/components/DoctorsManagement";

export default function ManagementPage() {
  const { user, loading, error } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("offers");
  
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل الخروج بنجاح");
      setLocation("/");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error || !user || user.role !== "admin") {
    setLocation("/unauthorized");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex" dir="rtl">
      {/* Sidebar */}
      <DashboardSidebar currentPath="/dashboard/management" />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pb-0 pb-20">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="container py-3 md:py-4">
            <div className="flex items-center justify-between gap-2">
              {/* Logo and Title */}
              <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                <img 
                  src="/assets/logo-color.png" 
                  alt="المستشفى السعودي الألماني" 
                  className="h-10 md:h-12 flex-shrink-0"
                />
                <div className="min-w-0">
                  <h1 className="text-base md:text-xl font-bold text-foreground truncate">الإدارة</h1>
                  <p className="text-xs md:text-sm text-muted-foreground hidden sm:block truncate">إدارة العروض والمخيمات والأطباء</p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                {/* Back to Dashboard */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation("/dashboard")}
                  className="hidden sm:flex"
                >
                  <ArrowRight className="w-4 h-4 ml-2" />
                  <span className="hidden md:inline">لوحة التحكم</span>
                </Button>
                
                {/* Logout Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout} 
                  className="hidden sm:flex"
                >
                  <LogOut className="w-4 h-4 md:ml-2" />
                  <span className="hidden md:inline">تسجيل الخروج</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleLogout} 
                  className="sm:hidden h-9 w-9"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 container py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
              <TabsTrigger value="offers">إدارة العروض</TabsTrigger>
              <TabsTrigger value="camps">إدارة المخيمات</TabsTrigger>
              <TabsTrigger value="doctors">إدارة الأطباء</TabsTrigger>
            </TabsList>
            
            <TabsContent value="offers" className="space-y-6">
              <OffersManagement />
            </TabsContent>
            
            <TabsContent value="camps" className="space-y-6">
              <CampsManagement />
            </TabsContent>
            
            <TabsContent value="doctors" className="space-y-6">
              <DoctorsManagement />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
