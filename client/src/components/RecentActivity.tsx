import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, Calendar, TrendingUp, UserCheck, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export default function RecentActivity() {
  const { data: leads } = trpc.leads.unifiedList.useQuery();
  const { data: appointments } = trpc.appointments.list.useQuery();
  const { data: offerLeads } = trpc.offerLeads.list.useQuery();
  const { data: campRegistrations } = trpc.campRegistrations.list.useQuery();

  // Combine and sort all activities
  const recentActivities = useMemo(() => {
    const allActivities = [
      ...(leads || []).map(l => ({ ...l, type: 'lead', icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'تسجيل عميل' })),
      ...(appointments || []).map(a => ({ ...a, type: 'appointment', icon: Calendar, color: 'text-green-500', bgColor: 'bg-green-100', label: 'موعد طبيب' })),
      ...(offerLeads || []).map(o => ({ ...o, type: 'offerLead', icon: TrendingUp, color: 'text-purple-500', bgColor: 'bg-purple-100', label: 'حجز عرض' })),
      ...(campRegistrations || []).map(c => ({ ...c, type: 'campRegistration', icon: UserCheck, color: 'text-teal-500', bgColor: 'bg-teal-100', label: 'تسجيل مخيم' })),
    ];

    return allActivities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [leads, appointments, offerLeads, campRegistrations]);

  const getRelativeTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ar });
    } catch (e) {
      return 'الآن';
    }
  };

  const getStatusBadge = (activity: any) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      new: { label: 'جديد', variant: 'default' },
      pending: { label: 'قيد الانتظار', variant: 'default' },
      contacted: { label: 'تم التواصل', variant: 'secondary' },
      confirmed: { label: 'مؤكد', variant: 'secondary' },
      booked: { label: 'تم الحجز', variant: 'secondary' },
      cancelled: { label: 'ملغي', variant: 'destructive' },
      completed: { label: 'مكتمل', variant: 'outline' },
      attended: { label: 'حضر', variant: 'outline' },
      not_interested: { label: 'غير مهتم', variant: 'destructive' },
      no_answer: { label: 'لم يرد', variant: 'outline' },
    };

    const status = statusMap[activity.status] || { label: activity.status, variant: 'outline' as const };
    return <Badge variant={status.variant} className="text-xs">{status.label}</Badge>;
  };

  return (
    <Card className="col-span-full lg:col-span-3">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <CardTitle>النشاط الأخير</CardTitle>
        </div>
        <CardDescription>آخر الحجوزات والتسجيلات</CardDescription>
      </CardHeader>
      <CardContent>
        {recentActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">لا توجد أنشطة حديثة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((activity: any, index: number) => {
              const Icon = activity.icon;
              return (
                <div 
                  key={`${activity.type}-${activity.id}`}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border"
                >
                  <div className={`mt-1 w-10 h-10 ${activity.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.fullName}</p>
                        <p className="text-xs text-muted-foreground">{activity.label}</p>
                      </div>
                      {getStatusBadge(activity)}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {getRelativeTime(activity.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
