import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Construction, LogOut } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardSidebar from "./DashboardSidebar";

interface UnderDevelopmentPageProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  currentPath: string;
}

export default function UnderDevelopmentPage({
  title,
  description,
  icon: Icon,
  features,
  currentPath,
}: UnderDevelopmentPageProps) {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  
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

  if (!user || user.role !== "admin") {
    setLocation("/unauthorized");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex" dir="rtl">
      {/* Sidebar */}
      <DashboardSidebar currentPath={currentPath} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pb-0 pb-20">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src="/assets/new-logo.png" 
                  alt="المستشفى السعودي الألماني" 
                  className="h-12"
                />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/dashboard")}
                >
                  <ArrowRight className="ml-2 h-4 w-4" />
                  لوحة التحكم
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="hidden sm:flex"
                >
                  <LogOut className="ml-2 h-4 w-4" />
                  تسجيل الخروج
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 container py-12">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-dashed">
              <CardHeader className="text-center pb-8">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <Icon className="h-24 w-24 text-muted-foreground" />
                    <Construction className="h-12 w-12 text-orange-500 absolute -bottom-2 -right-2" />
                  </div>
                </div>
                <CardTitle className="text-3xl mb-2">صفحة {title} قيد التطوير</CardTitle>
                <CardDescription className="text-lg">
                  نعمل حالياً على تطوير صفحة {title} لتوفير تجربة أفضل لك
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">الميزات القادمة:</h3>
                  <ul className="text-right text-blue-800 space-y-2">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="text-blue-500">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Button 
                  size="lg"
                  onClick={() => setLocation("/dashboard")}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  <ArrowRight className="ml-2 h-5 w-5" />
                  العودة للوحة التحكم
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
