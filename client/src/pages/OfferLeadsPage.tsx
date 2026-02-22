import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import OfferLeadsManagement from "@/components/OfferLeadsManagement";
import { DateRangePicker } from "@/components/DateRangePicker";

export default function OfferLeadsPage() {
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { from, to };
  });

  return (
    <DashboardLayout
      pageTitle="عروض العملاء"
      pageDescription="إدارة ومتابعة عروض العملاء المحتملين"
    >
      <div className="space-y-4" dir="rtl">
        <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
        <OfferLeadsManagement 
          onPendingCountChange={() => {}} 
          dateRange={dateRange}
        />
      </div>
    </DashboardLayout>
  );
}
