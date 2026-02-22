import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Phone, Edit, TrendingUp, Facebook, Instagram, Send } from "lucide-react";
import { LucideIcon } from "lucide-react";

// Map sources to display info
const sourceDisplayMap: Record<string, { name: string; color: string; lightColor: string; textColor: string; icon: LucideIcon }> = {
  facebook: {
    name: "فيسبوك",
    color: "bg-[#1877F2]",
    lightColor: "bg-blue-100",
    textColor: "text-[#1877F2]",
    icon: Facebook,
  },
  instagram: {
    name: "إنستغرام",
    color: "bg-[#E4405F]",
    lightColor: "bg-pink-100",
    textColor: "text-[#E4405F]",
    icon: Instagram,
  },
  telegram: {
    name: "تيليجرام",
    color: "bg-[#0088CC]",
    lightColor: "bg-cyan-100",
    textColor: "text-[#0088CC]",
    icon: Send,
  },
  manual: {
    name: "يدوي",
    color: "bg-purple-500",
    lightColor: "bg-purple-100",
    textColor: "text-purple-600",
    icon: Edit,
  },
  direct: {
    name: "مباشر",
    color: "bg-gray-500",
    lightColor: "bg-gray-100",
    textColor: "text-gray-600",
    icon: Globe,
  },
  // للتوافق مع التسجيلات القديمة
  website: {
    name: "الموقع الإلكتروني",
    color: "bg-blue-500",
    lightColor: "bg-blue-100",
    textColor: "text-blue-600",
    icon: Globe,
  },
  web: {
    name: "الموقع الإلكتروني",
    color: "bg-blue-500",
    lightColor: "bg-blue-100",
    textColor: "text-blue-600",
    icon: Globe,
  },
  phone: {
    name: "الهاتف",
    color: "bg-green-500",
    lightColor: "bg-green-100",
    textColor: "text-green-600",
    icon: Phone,
  },
};

export default function SourceAnalytics() {
  const { data: leads } = trpc.leads.unifiedList.useQuery();
  const { data: appointments } = trpc.appointments.list.useQuery();
  const { data: offerLeads } = trpc.offerLeads.list.useQuery();
  const { data: campRegistrations } = trpc.campRegistrations.list.useQuery();

  // Calculate source statistics dynamically
  const sourceStats = useMemo(() => {
    // Note: leads are the same people who made bookings, so we don't include them
    // Only count actual bookings: appointments, offerLeads, campRegistrations
    const allBookings = [
      ...(appointments || []),
      ...(offerLeads || []),
      ...(campRegistrations || []),
    ];

    const total = allBookings.length;

    // Count by source
    const sourceCountsMap = new Map<string, number>();
    allBookings.forEach((b: any) => {
      const source = b.source || "direct";
      sourceCountsMap.set(source, (sourceCountsMap.get(source) || 0) + 1);
    });

    // Convert to array with display info
    const sources = Array.from(sourceCountsMap.entries())
      .map(([source, count]) => {
        const displayInfo = sourceDisplayMap[source] || {
          name: source,
          color: "bg-gray-500",
          lightColor: "bg-gray-100",
          textColor: "text-gray-600",
          icon: Globe,
        };
        
        return {
          source,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          ...displayInfo,
        };
      })
      .sort((a, b) => b.count - a.count); // Sort by count descending

    return {
      sources,
      total,
    };
  }, [leads, appointments, offerLeads, campRegistrations]);

  // Get top source for insights
  const topSource = sourceStats.sources[0];

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
            {sourceStats.sources.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.source}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 ${stat.lightColor} rounded-full flex items-center justify-center`}>
                        <Icon className={`h-4 w-4 ${stat.textColor}`} />
                      </div>
                      <span className="font-medium">{stat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${stat.textColor}`}>
                        {stat.percentage}%
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({stat.count})
                      </span>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${stat.color} transition-all duration-500`}
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">إجمالي الحجوزات</span>
              <span className="text-lg sm:text-2xl font-bold text-primary">{sourceStats.total}</span>
            </div>
            
            {/* Insights */}
            {topSource && (
              <div className={`${topSource.lightColor} p-3 rounded-lg`}>
                <p className="text-sm">
                  <span className="font-semibold">{topSource.name}</span> هو المصدر الأكثر فعالية بنسبة{" "}
                  <span className="font-bold">{topSource.percentage}%</span> من إجمالي الحجوزات.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
