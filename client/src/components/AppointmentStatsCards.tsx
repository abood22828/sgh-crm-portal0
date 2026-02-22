import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, CheckCircle2, XCircle, TrendingUp, TrendingDown } from "lucide-react";
import { AnimatedCounter } from "@/components/animations";

interface AppointmentStatsCardsProps {
  stats: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
  };
}

const statConfig = [
  {
    key: "total" as const,
    label: "إجمالي المواعيد",
    icon: Calendar,
    gradient: "from-blue-500 to-blue-600",
    bgLight: "bg-blue-50",
    textColor: "text-blue-600",
    iconBg: "bg-blue-100",
  },
  {
    key: "pending" as const,
    label: "قيد الانتظار",
    icon: Clock,
    gradient: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50",
    textColor: "text-amber-600",
    iconBg: "bg-amber-100",
  },
  {
    key: "confirmed" as const,
    label: "مؤكد",
    icon: CheckCircle2,
    gradient: "from-emerald-500 to-green-600",
    bgLight: "bg-emerald-50",
    textColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
  },
  {
    key: "cancelled" as const,
    label: "ملغي",
    icon: XCircle,
    gradient: "from-red-500 to-rose-600",
    bgLight: "bg-red-50",
    textColor: "text-red-600",
    iconBg: "bg-red-100",
  },
];

export default function AppointmentStatsCards({ stats }: AppointmentStatsCardsProps) {
  const total = stats?.total || 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 stagger-cards">
      {statConfig.map((config) => {
        const Icon = config.icon;
        const value = stats?.[config.key] || 0;
        const percentage = total > 0 && config.key !== "total"
          ? Math.round((value / total) * 100)
          : null;

        return (
          <Card
            key={config.key}
            className="group relative overflow-hidden border-0 shadow-sm stat-card-animated"
          >
            {/* Top gradient bar */}
            <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${config.gradient}`} />
            
            <CardContent className="p-3 sm:p-4 md:p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1 truncate">
                    {config.label}
                  </p>
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight">
                    <AnimatedCounter value={value} duration={900} />
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
                <div className={`${config.iconBg} p-2 sm:p-2.5 md:p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ${config.textColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
