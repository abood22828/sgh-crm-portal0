import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Phone, Edit, TrendingUp } from "lucide-react";

export default function SourceAnalytics() {
  const { data: leads } = trpc.leads.unifiedList.useQuery();
  const { data: appointments } = trpc.appointments.list.useQuery();
  const { data: offerLeads } = trpc.offerLeads.list.useQuery();
  const { data: campRegistrations } = trpc.campRegistrations.list.useQuery();

  // Calculate source statistics
  const sourceStats = useMemo(() => {
    const allBookings = [
      ...(leads || []),
      ...(appointments || []),
      ...(offerLeads || []),
      ...(campRegistrations || []),
    ];

    const websiteCount = allBookings.filter((b: any) => b.source === 'website').length;
    const phoneCount = allBookings.filter((b: any) => b.source === 'phone').length;
    const manualCount = allBookings.filter((b: any) => b.source === 'manual').length;
    const total = allBookings.length;

    return {
      website: {
        count: websiteCount,
        percentage: total > 0 ? Math.round((websiteCount / total) * 100) : 0,
        color: 'bg-blue-500',
        lightColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        icon: Globe,
      },
      phone: {
        count: phoneCount,
        percentage: total > 0 ? Math.round((phoneCount / total) * 100) : 0,
        color: 'bg-green-500',
        lightColor: 'bg-green-100',
        textColor: 'text-green-600',
        icon: Phone,
      },
      manual: {
        count: manualCount,
        percentage: total > 0 ? Math.round((manualCount / total) * 100) : 0,
        color: 'bg-purple-500',
        lightColor: 'bg-purple-100',
        textColor: 'text-purple-600',
        icon: Edit,
      },
      total,
    };
  }, [leads, appointments, offerLeads, campRegistrations]);

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle>تحليل مصادر التسجيل</CardTitle>
        </div>
        <CardDescription>توزيع الحجوزات حسب المصدر</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress Bars */}
          <div className="space-y-4">
            {/* Website */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 ${sourceStats.website.lightColor} rounded-full flex items-center justify-center`}>
                    <sourceStats.website.icon className={`h-4 w-4 ${sourceStats.website.textColor}`} />
                  </div>
                  <span className="font-medium">الموقع الإلكتروني</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${sourceStats.website.textColor}`}>
                    {sourceStats.website.percentage}%
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({sourceStats.website.count})
                  </span>
                </div>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${sourceStats.website.color} transition-all duration-500`}
                  style={{ width: `${sourceStats.website.percentage}%` }}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 ${sourceStats.phone.lightColor} rounded-full flex items-center justify-center`}>
                    <sourceStats.phone.icon className={`h-4 w-4 ${sourceStats.phone.textColor}`} />
                  </div>
                  <span className="font-medium">الهاتف</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${sourceStats.phone.textColor}`}>
                    {sourceStats.phone.percentage}%
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({sourceStats.phone.count})
                  </span>
                </div>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${sourceStats.phone.color} transition-all duration-500`}
                  style={{ width: `${sourceStats.phone.percentage}%` }}
                />
              </div>
            </div>

            {/* Manual */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 ${sourceStats.manual.lightColor} rounded-full flex items-center justify-center`}>
                    <sourceStats.manual.icon className={`h-4 w-4 ${sourceStats.manual.textColor}`} />
                  </div>
                  <span className="font-medium">يدوي</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${sourceStats.manual.textColor}`}>
                    {sourceStats.manual.percentage}%
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({sourceStats.manual.count})
                  </span>
                </div>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${sourceStats.manual.color} transition-all duration-500`}
                  style={{ width: `${sourceStats.manual.percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">إجمالي الحجوزات</span>
              <span className="text-2xl font-bold">{sourceStats.total}</span>
            </div>
          </div>

          {/* Insights */}
          {sourceStats.total > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">💡 ملاحظة: </span>
                {sourceStats.website.percentage >= 50 
                  ? 'معظم الحجوزات تأتي من الموقع الإلكتروني. استمر في تحسين تجربة المستخدم على الموقع.'
                  : sourceStats.phone.percentage >= 50
                  ? 'معظم الحجوزات تأتي عبر الهاتف. فكر في تحسين عملية الحجز الهاتفي.'
                  : 'الحجوزات موزعة بشكل متوازن بين المصادر المختلفة.'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
