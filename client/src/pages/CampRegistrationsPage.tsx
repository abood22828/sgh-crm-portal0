import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import CampRegistrationsManagement from "@/components/CampRegistrationsManagement";
import { DateRangePicker } from "@/components/DateRangePicker";

export default function CampRegistrationsPage() {
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { from, to };
  });

  return (
    <DashboardLayout
      pageTitle="تسجيلات المخيمات"
      pageDescription="إدارة ومتابعة تسجيلات المخيمات الطبية"
    >
      <div className="space-y-4" dir="rtl">
        <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
        <CampRegistrationsManagement 
          onPendingCountChange={() => {}} 
          dateRange={dateRange}
        />
      </div>
    </DashboardLayout>
  );
}
