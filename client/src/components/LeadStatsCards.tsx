import { Card, CardContent } from "@/components/ui/card";
import { Users, UserPlus, PhoneCall, CalendarCheck, TrendingUp, TrendingDown } from "lucide-react";

interface LeadStatsCardsProps {
  stats: {
    total: number;
    new: number;
    contacted: number;
    booked: number;
  } | null | undefined;
}

const statConfig = [
  {
    key: "total" as const,
    label: "إجمالي العملاء",
    icon: Users,
    gradient: "from-blue-500 to-blue-600",
    bgLight: "bg-blue-50",
    textColor: "text-blue-600",
    iconBg: "bg-blue-100",
  },
  {
    key: "new" as const,
    label: "جديد",
    icon: UserPlus,
    gradient: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50",
    textColor: "text-amber-600",
    iconBg: "bg-amber-100",
  },
  {
    key: "contacted" as const,
    label: "تم التواصل",
    icon: PhoneCall,
    gradient: "from-purple-500 to-purple-600",
    bgLight: "bg-purple-50",
    textColor: "text-purple-600",
    iconBg: "bg-purple-100",
  },
  {
    key: "booked" as const,
    label: "تم الحجز",
    icon: CalendarCheck,
    gradient: "from-emerald-500 to-green-600",
    bgLight: "bg-emerald-50",
    textColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
  },
];

export default function LeadStatsCards({ stats }: LeadStatsCardsProps) {
  const total = stats?.total || 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {statConfig.map((config) => {
        const Icon = config.icon;
        const value = stats?.[config.key] || 0;
        const percentage = total > 0 && config.key !== "total" 
          ? Math.round((value / total) * 100) 
          : null;

        return (
          <Card
            key={config.key}
            className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300"
          >
            {/* Top gradient bar */}
            <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${config.gradient}`} />
            
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1 truncate">
                    {config.label}
                  </p>
                  <p className="text-2xl md:text-3xl font-bold tracking-tight">
                    {value.toLocaleString("ar-SA")}
                  </p>
                  {percentage !== null && (
                    <div className="flex items-center gap-1 mt-2">
                      <div className={`flex items-center gap-0.5 text-xs font-medium ${config.textColor}`}>
                        {percentage > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>{percentage}%</span>
                      </div>
                      <span className="text-xs text-muted-foreground">من الإجمالي</span>
                    </div>
                  )}
                </div>
                <div className={`${config.iconBg} p-2.5 md:p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`h-5 w-5 md:h-6 md:w-6 ${config.textColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
