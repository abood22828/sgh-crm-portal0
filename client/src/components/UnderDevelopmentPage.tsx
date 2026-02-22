import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Construction } from "lucide-react";
import DashboardLayout from "./DashboardLayout";

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

  return (
    <DashboardLayout
      pageTitle={title}
      pageDescription={description}
    >
      <main className="container py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-dashed">
            <CardHeader className="text-center pb-4 sm:pb-6 md:pb-8 px-4 sm:px-6">
              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="relative">
                  <Icon className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-muted-foreground" />
                  <Construction className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-orange-500 absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2" />
                </div>
              </div>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl mb-2">صفحة {title} قيد التطوير</CardTitle>
              <CardDescription className="text-sm sm:text-base md:text-lg">
                نعمل حالياً على تطوير صفحة {title} لتوفير تجربة أفضل لك
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center px-4 sm:px-6">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 sm:p-6 mb-6">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 text-sm sm:text-base">الميزات القادمة:</h3>
                <ul className="text-right text-blue-800 dark:text-blue-400 space-y-2 text-sm">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-blue-500 flex-shrink-0">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <Button 
                size="lg"
                onClick={() => setLocation("/dashboard")}
                className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                العودة للوحة التحكم
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </DashboardLayout>
  );
}
