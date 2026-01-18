import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Users, Calendar, TrendingUp, UserCheck } from "lucide-react";
import { useLocation } from "wouter";

export default function NotificationCenter() {
  const [, setLocation] = useLocation();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    campRegistrations: false,
    appointments: false,
    offerLeads: false,
  });

  // Fetch all pending bookings
  const { data: appointments } = trpc.appointments.list.useQuery();
  const { data: offerLeads } = trpc.offerLeads.list.useQuery();
  const { data: campRegistrations } = trpc.campRegistrations.list.useQuery();

  // Get last 5 pending items for each type
  const pendingItems = useMemo(() => {
    const pendingAppointments = (appointments || [])
      .filter(a => a.status === 'pending')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    const pendingOfferLeads = (offerLeads || [])
      .filter(o => o.status === 'new')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    const pendingCampRegistrations = (campRegistrations || [])
      .filter(c => c.status === 'pending')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      appointments: pendingAppointments,
      offerLeads: pendingOfferLeads,
      campRegistrations: pendingCampRegistrations,
    };
  }, [appointments, offerLeads, campRegistrations]);

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

  const handleItemClick = (type: string) => {
    // Navigate to bookings management page with the appropriate tab
    setLocation(`/dashboard/bookings?tab=${type}`);
  };

  const sections = [
    {
      id: 'campRegistrations',
      title: 'تسجيلات المخيمات',
      count: counts.campRegistrations,
      items: pendingItems.campRegistrations,
      icon: UserCheck,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      type: 'campRegistrations',
    },
    {
      id: 'appointments',
      title: 'مواعيد الأطباء',
      count: counts.appointments,
      items: pendingItems.appointments,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      type: 'appointments',
    },
    {
      id: 'offerLeads',
      title: 'حجوزات العروض',
      count: counts.offerLeads,
      items: pendingItems.offerLeads,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      type: 'offerLeads',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">طلبات قيد الانتظار</h2>
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
            <p>لا توجد طلبات قيد الانتظار</p>
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

                  {/* Expanded Content - Show last 5 requests */}
                  {isExpanded && (
                    <div className="border-t bg-white">
                      {section.items.length > 0 ? (
                        <div className="divide-y">
                          {section.items.map((item: any, index: number) => (
                            <button
                              key={index}
                              onClick={() => handleItemClick(section.type)}
                              className="w-full p-3 text-right hover:bg-gray-50 transition-colors flex items-center justify-between group"
                            >
                              <span className="font-medium group-hover:text-primary transition-colors">
                                {item.fullName || item.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(item.createdAt).toLocaleDateString('ar-EG')}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          لا توجد طلبات
                        </div>
                      )}
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
