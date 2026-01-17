import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Users, Calendar, TrendingUp, UserCheck } from "lucide-react";

export default function NotificationCenter() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    campRegistrations: false,
    appointments: false,
    offerLeads: false,
  });

  // Fetch all pending bookings
  const { data: appointments } = trpc.appointments.list.useQuery();
  const { data: offerLeads } = trpc.offerLeads.list.useQuery();
  const { data: campRegistrations } = trpc.campRegistrations.list.useQuery();

  // Count pending items
  const counts = useMemo(() => ({
    appointments: appointments?.filter(a => a.status === 'pending').length || 0,
    offerLeads: offerLeads?.filter(o => o.status === 'new').length || 0,
    campRegistrations: campRegistrations?.filter(c => c.status === 'pending').length || 0,
  }), [appointments, offerLeads, campRegistrations]);

  const totalCount = counts.appointments + counts.offerLeads + counts.campRegistrations;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const sections = [
    {
      id: 'campRegistrations',
      title: 'تسجيلات المخيمات',
      count: counts.campRegistrations,
      icon: UserCheck,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
    },
    {
      id: 'appointments',
      title: 'مواعيد الأطباء',
      count: counts.appointments,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      id: 'offerLeads',
      title: 'حجوزات العروض',
      count: counts.offerLeads,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">الإشعارات</h2>
        {totalCount > 0 && (
          <Badge variant="destructive" className="text-sm">
            {totalCount} إشعار
          </Badge>
        )}
      </div>

      {/* Notification Sections */}
      {totalCount === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد إشعارات جديدة</p>
            <p className="text-sm mt-1">جميع الحجوزات محدثة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections[section.id];
            
            if (section.count === 0) return null;

            return (
              <Card 
                key={section.id}
                className={`border-2 ${section.borderColor} ${section.bgColor} transition-all`}
              >
                <CardContent className="p-0">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${section.bgColor} rounded-full flex items-center justify-center border-2 ${section.borderColor}`}>
                        <Icon className={`h-5 w-5 ${section.color}`} />
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{section.title}</p>
                        <p className="text-sm text-muted-foreground">
                          هناك {section.count} {section.count === 1 ? 'طلب' : 'طلبات'} قيد الانتظار
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="font-bold">
                        {section.count}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t p-4 bg-white">
                      <p className="text-sm text-muted-foreground">
                        يمكنك عرض التفاصيل الكاملة من صفحة <strong>إدارة الحجوزات</strong>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
