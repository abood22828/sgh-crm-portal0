import DashboardLayout from "@/components/DashboardLayout";
import UnderDevelopmentPage from "@/components/UnderDevelopmentPage";
import { Send } from "lucide-react";

export default function PublishingPage() {
  return (
    <DashboardLayout pageTitle="النشر" pageDescription="نشر المحتوى على المنصات المختلفة">
      <UnderDevelopmentPage
        title="النشر"
        description="نشر المحتوى على منصات التواصل الاجتماعي"
        icon={Send}
        currentPath="/dashboard/publishing"
        features={[
          "نشر تلقائي على Facebook و Instagram",
          "جدولة المنشورات المستقبلية",
          "إدارة الحملات الإعلانية",
          "معاينة المنشورات قبل النشر",
          "تحليل أداء المنشورات",
        ]}
      />
    </DashboardLayout>
  );
}
