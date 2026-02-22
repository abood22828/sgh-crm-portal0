import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Calendar, 
  Gift, 
  Tent,
  CheckCircle,
  Clock,
  XCircle,
  UserCheck,
} from "lucide-react";
import { AnimatedCounter } from "@/components/animations";

export default function DetailedStatsCards() {
  const { data: leads } = trpc.leads.unifiedList.useQuery();
  const { data: appointments } = trpc.appointments.list.useQuery();
  const { data: offerLeads } = trpc.offerLeads.list.useQuery();
  const { data: campRegistrations } = trpc.campRegistrations.list.useQuery();

  // Calculate statistics
  const stats = useMemo(() => {
    const campStats = {
      total: campRegistrations?.length || 0,
      pending: campRegistrations?.filter((r: any) => r.status === 'pending').length || 0,
      confirmed: campRegistrations?.filter((r: any) => r.status === 'confirmed').length || 0,
      attended: campRegistrations?.filter((r: any) => r.status === 'attended').length || 0,
      cancelled: campRegistrations?.filter((r: any) => r.status === 'cancelled').length || 0,
    };

    const appointmentStats = {
      total: appointments?.length || 0,
      pending: appointments?.filter((a: any) => a.status === 'pending').length || 0,
      confirmed: appointments?.filter((a: any) => a.status === 'confirmed').length || 0,
      completed: appointments?.filter((a: any) => a.status === 'completed').length || 0,
      cancelled: appointments?.filter((a: any) => a.status === 'cancelled').length || 0,
    };

    const offerStats = {
      total: offerLeads?.length || 0,
      pending: offerLeads?.filter((o: any) => o.status === 'pending').length || 0,
      confirmed: offerLeads?.filter((o: any) => o.status === 'confirmed').length || 0,
      completed: offerLeads?.filter((o: any) => o.status === 'completed').length || 0,
      cancelled: offerLeads?.filter((o: any) => o.status === 'cancelled').length || 0,
    };

    const totalStats = {
      total: campStats.total + appointmentStats.total + offerStats.total,
      camps: campStats.total,
      appointments: appointmentStats.total,
      offers: offerStats.total,
      leads: leads?.length || 0,
    };

    return {
      total: totalStats,
      camps: campStats,
      appointments: appointmentStats,
      offers: offerStats,
    };
  }, [leads, appointments, offerLeads, campRegistrations]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8 stagger-cards">
      {/* Card 1: Total Stats */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 stat-card-animated">
        <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 md:pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs sm:text-sm md:text-lg text-blue-900">إجمالي التسجيلات</CardTitle>
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-200 rounded-full flex items-center justify-center">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-700" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-1 md:space-y-2">
          <div className="text-lg sm:text-2xl md:text-4xl font-bold text-blue-900">
            <AnimatedCounter value={stats.total.total} duration={1000} />
          </div>
          <div className="space-y-0.5 md:space-y-1 text-[10px] md:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-blue-700">تسجيلات المخيمات</span>
              <span className="font-semibold text-blue-900"><AnimatedCounter value={stats.total.camps} duration={800} /></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-700">مواعيد الأطباء</span>
              <span className="font-semibold text-blue-900"><AnimatedCounter value={stats.total.appointments} duration={800} /></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-700">حجوزات العروض</span>
              <span className="font-semibold text-blue-900"><AnimatedCounter value={stats.total.offers} duration={800} /></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-700">العملاء المسجلين</span>
              <span className="font-semibold text-blue-900"><AnimatedCounter value={stats.total.leads} duration={800} /></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Camp Registrations */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 stat-card-animated">
        <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 md:pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs sm:text-sm md:text-lg text-purple-900">تسجيلات المخيمات</CardTitle>
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-purple-200 rounded-full flex items-center justify-center">
              <Tent className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-700" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-1 md:space-y-2">
          <div className="text-lg sm:text-2xl md:text-4xl font-bold text-purple-900">
            <AnimatedCounter value={stats.camps.total} duration={1000} />
          </div>
          <div className="space-y-0.5 md:space-y-1 text-[10px] md:text-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-yellow-600" />
                <span className="text-purple-700">قيد الانتظار</span>
              </div>
              <span className="font-semibold text-yellow-600"><AnimatedCounter value={stats.camps.pending} duration={700} /></span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-blue-600" />
                <span className="text-purple-700">مؤكد</span>
              </div>
              <span className="font-semibold text-blue-600"><AnimatedCounter value={stats.camps.confirmed} duration={700} /></span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-green-600" />
                <span className="text-purple-700">حضر</span>
              </div>
              <span className="font-semibold text-green-600"><AnimatedCounter value={stats.camps.attended} duration={700} /></span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-600" />
                <span className="text-purple-700">ملغي</span>
              </div>
              <span className="font-semibold text-red-600"><AnimatedCounter value={stats.camps.cancelled} duration={700} /></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Appointments */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 stat-card-animated">
        <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 md:pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs sm:text-sm md:text-lg text-green-900">مواعيد الأطباء</CardTitle>
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-200 rounded-full flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-700" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-1 md:space-y-2">
          <div className="text-lg sm:text-2xl md:text-4xl font-bold text-green-900">
            <AnimatedCounter value={stats.appointments.total} duration={1000} />
          </div>
          <div className="space-y-0.5 md:space-y-1 text-[10px] md:text-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-yellow-600" />
                <span className="text-green-700">قيد الانتظار</span>
              </div>
              <span className="font-semibold text-yellow-600"><AnimatedCounter value={stats.appointments.pending} duration={700} /></span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-blue-600" />
                <span className="text-green-700">مؤكد</span>
              </div>
              <span className="font-semibold text-blue-600"><AnimatedCounter value={stats.appointments.confirmed} duration={700} /></span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-green-600" />
                <span className="text-green-700">مكتمل</span>
              </div>
              <span className="font-semibold text-green-600"><AnimatedCounter value={stats.appointments.completed} duration={700} /></span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-600" />
                <span className="text-green-700">ملغي</span>
              </div>
              <span className="font-semibold text-red-600"><AnimatedCounter value={stats.appointments.cancelled} duration={700} /></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Offer Leads */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 stat-card-animated">
        <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 md:pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs sm:text-sm md:text-lg text-orange-900">حجوزات العروض</CardTitle>
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-orange-200 rounded-full flex items-center justify-center">
              <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-orange-700" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-1 md:space-y-2">
          <div className="text-lg sm:text-2xl md:text-4xl font-bold text-orange-900">
            <AnimatedCounter value={stats.offers.total} duration={1000} />
          </div>
          <div className="space-y-0.5 md:space-y-1 text-[10px] md:text-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-yellow-600" />
                <span className="text-orange-700">قيد الانتظار</span>
              </div>
              <span className="font-semibold text-yellow-600"><AnimatedCounter value={stats.offers.pending} duration={700} /></span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-blue-600" />
                <span className="text-orange-700">مؤكد</span>
              </div>
              <span className="font-semibold text-blue-600"><AnimatedCounter value={stats.offers.confirmed} duration={700} /></span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-green-600" />
                <span className="text-orange-700">مكتمل</span>
              </div>
              <span className="font-semibold text-green-600"><AnimatedCounter value={stats.offers.completed} duration={700} /></span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-600" />
                <span className="text-orange-700">ملغي</span>
              </div>
              <span className="font-semibold text-red-600"><AnimatedCounter value={stats.offers.cancelled} duration={700} /></span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
