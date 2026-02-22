import DashboardLayout from "@/components/DashboardLayout";
import CustomerProfilesTab from "@/components/CustomerProfilesTab";

export default function CustomersPage() {
  return (
    <DashboardLayout
      pageTitle="ملفات العملاء"
      pageDescription="عرض ملفات العملاء الموحدة وتاريخ تفاعلاتهم"
    >
      <div className="container mx-auto py-6 space-y-6" dir="rtl">
        <CustomerProfilesTab />
      </div>
    </DashboardLayout>
  );
}
