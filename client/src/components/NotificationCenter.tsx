import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, X, Users, Calendar, TrendingUp, UserCheck, Check } from "lucide-react";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<number[]>([]);
  const [, setLocation] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch all pending bookings
  const { data: leads } = trpc.leads.unifiedList.useQuery();
  const { data: appointments } = trpc.appointments.list.useQuery();
  const { data: offerLeads } = trpc.offerLeads.list.useQuery();
  const { data: campRegistrations } = trpc.campRegistrations.list.useQuery();

  // Get pending notifications
  const pendingLeads = leads?.filter(l => l.status === 'new').slice(0, 10) || [];
  const pendingAppointments = appointments?.filter(a => a.status === 'pending').slice(0, 10) || [];
  const pendingOfferLeads = offerLeads?.filter(o => o.status === 'new').slice(0, 10) || [];
  const pendingCampRegistrations = campRegistrations?.filter(c => c.status === 'pending').slice(0, 10) || [];

  // Combine all notifications
  const allNotifications = [
    ...pendingLeads.map(l => ({ ...l, type: 'lead', icon: Users, color: 'text-blue-500' })),
    ...pendingAppointments.map(a => ({ ...a, type: 'appointment', icon: Calendar, color: 'text-green-500' })),
    ...pendingOfferLeads.map(o => ({ ...o, type: 'offerLead', icon: TrendingUp, color: 'text-purple-500' })),
    ...pendingCampRegistrations.map(c => ({ ...c, type: 'campRegistration', icon: UserCheck, color: 'text-teal-500' })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const unreadCount = allNotifications.filter(n => !readNotifications.includes(n.id)).length;

  // Load read notifications from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('readNotifications');
    if (stored) {
      try {
        setReadNotifications(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse read notifications', e);
      }
    }
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAsRead = (id: number) => {
    const updated = [...readNotifications, id];
    setReadNotifications(updated);
    localStorage.setItem('readNotifications', JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const allIds = allNotifications.map(n => n.id);
    setReadNotifications(allIds);
    localStorage.setItem('readNotifications', JSON.stringify(allIds));
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    setIsOpen(false);
    
    // Navigate to bookings management with specific tab
    const tabMap: Record<string, string> = {
      lead: "leads",
      appointment: "appointments",
      offerLead: "offerLeads",
      campRegistration: "campRegistrations",
    };
    setLocation(`/bookings?tab=${tabMap[notification.type]}`);
  };

  const getNotificationTitle = (notification: any) => {
    switch (notification.type) {
      case 'lead':
        return 'تسجيل عميل جديد';
      case 'appointment':
        return 'موعد طبيب جديد';
      case 'offerLead':
        return 'حجز عرض جديد';
      case 'campRegistration':
        return 'تسجيل مخيم جديد';
      default:
        return 'إشعار جديد';
    }
  };

  const getRelativeTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ar });
    } catch (e) {
      return 'الآن';
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Notification Bell */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -left-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold rounded-full"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-[90vw] md:w-[400px] max-h-[80vh] overflow-y-auto bg-white rounded-lg shadow-2xl border z-[100]">
          <div className="p-4 border-b sticky top-0 bg-white flex items-center justify-between">
            <div>
              <h3 className="font-semibold">الإشعارات</h3>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : 'لا توجد إشعارات جديدة'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <Check className="h-3 w-3 ml-1" />
                تحديد الكل كمقروء
              </Button>
            )}
          </div>

          <div className="p-2">
            {allNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">لا توجد إشعارات</p>
                <p className="text-xs mt-1">جميع الحجوزات محدثة</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allNotifications.map((notification: any) => {
                  const Icon = notification.icon;
                  const isRead = readNotifications.includes(notification.id);
                  
                  return (
                    <Card 
                      key={`${notification.type}-${notification.id}`}
                      className={`cursor-pointer hover:bg-slate-50 transition-colors ${
                        !isRead ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 ${notification.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{getNotificationTitle(notification)}</p>
                                <p className="text-sm mt-1">{notification.fullName}</p>
                                <p className="text-xs text-muted-foreground mt-1" dir="ltr">
                                  {notification.phone}
                                </p>
                              </div>
                              {!isRead && (
                                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {getRelativeTime(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {allNotifications.length > 0 && (
            <div className="p-3 border-t bg-slate-50 text-center">
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  setLocation('/bookings');
                }}
                className="text-xs"
              >
                عرض جميع الحجوزات
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
