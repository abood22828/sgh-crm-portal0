import DashboardLayout from "@/components/DashboardLayout";
import UnderDevelopmentPage from "@/components/UnderDevelopmentPage";
import { FileText } from "lucide-react";

export default function ReportsPage() {
  return (
    <DashboardLayout pageTitle="التقارير" pageDescription="تقارير مفصلة عن أداء المنصة">
      <UnderDevelopmentPage
        title="التقارير"
        description="تقارير مفصلة عن أداء المنصة"
        icon={FileText}
        currentPath="/dashboard/reports"
        features={[
          "تقارير الحجوزات والمواعيد",
          "تقارير العملاء الجدد",
          "تقارير معدلات التحويل",
          "تقارير الإيرادات والأرباح",
          "تصدير التقارير بصيغة PDF و Excel",
        ]}
      />
    </DashboardLayout>
  );
}
