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

export default function DetailedStatsCards() {
  const { data: leads } = trpc.leads.unifiedList.useQuery();
  const { data: appointments } = trpc.appointments.list.useQuery();
  const { data: offerLeads } = trpc.offerLeads.list.useQuery();
  const { data: campRegistrations } = trpc.campRegistrations.list.useQuery();

  // Calculate statistics
  const stats = useMemo(() => {
    // Camp registrations stats
    const campStats = {
      total: campRegistrations?.length || 0,
      pending: campRegistrations?.filter((r: any) => r.status === 'pending').length || 0,
      confirmed: campRegistrations?.filter((r: any) => r.status === 'confirmed').length || 0,
      attended: campRegistrations?.filter((r: any) => r.status === 'attended').length || 0,
      cancelled: campRegistrations?.filter((r: any) => r.status === 'cancelled').length || 0,
    };

    // Appointments stats
    const appointmentStats = {
      total: appointments?.length || 0,
      pending: appointments?.filter((a: any) => a.status === 'pending').length || 0,
      confirmed: appointments?.filter((a: any) => a.status === 'confirmed').length || 0,
      completed: appointments?.filter((a: any) => a.status === 'completed').length || 0,
      cancelled: appointments?.filter((a: any) => a.status === 'cancelled').length || 0,
    };

    // Offer leads stats
    const offerStats = {
      total: offerLeads?.length || 0,
      pending: offerLeads?.filter((o: any) => o.status === 'pending').length || 0,
      confirmed: offerLeads?.filter((o: any) => o.status === 'confirmed').length || 0,
      completed: offerLeads?.filter((o: any) => o.status === 'completed').length || 0,
      cancelled: offerLeads?.filter((o: any) => o.status === 'cancelled').length || 0,
    };

    // Total stats (all bookings combined)
    const totalStats = {
      total: campStats.total + appointmentStats.total + offerStats.total + (leads?.length || 0),
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 md:mb-8">
      {/* Card 1: Total Stats */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg text-blue-900">إجمالي التسجيلات</CardTitle>
            <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-700" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-3xl md:text-4xl font-bold text-blue-900">
            {stats.total.total}
          </div>
          <div className="space-y-1 text-xs md:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-blue-700">تسجيلات المخيمات</span>
              <span className="font-semibold text-blue-900">{stats.total.camps}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-700">مواعيد الأطباء</span>
              <span className="font-semibold text-blue-900">{stats.total.appointments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-700">حجوزات العروض</span>
              <span className="font-semibold text-blue-900">{stats.total.offers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-700">العملاء المسجلين</span>
              <span className="font-semibold text-blue-900">{stats.total.leads}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Camp Registrations */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg text-purple-900">تسجيلات المخيمات</CardTitle>
            <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
              <Tent className="w-5 h-5 text-purple-700" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-3xl md:text-4xl font-bold text-purple-900">
            {stats.camps.total}
          </div>
          <div className="space-y-1 text-xs md:text-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-yellow-600" />
                <span className="text-purple-700">قيد الانتظار</span>
              </div>
              <span className="font-semibold text-yellow-600">{stats.camps.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-blue-600" />
                <span className="text-purple-700">مؤكد</span>
              </div>
              <span className="font-semibold text-blue-600">{stats.camps.confirmed}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-green-600" />
                <span className="text-purple-700">حضر</span>
              </div>
              <span className="font-semibold text-green-600">{stats.camps.attended}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-600" />
                <span className="text-purple-700">ملغي</span>
              </div>
              <span className="font-semibold text-red-600">{stats.camps.cancelled}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Appointments */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg text-green-900">مواعيد الأطباء</CardTitle>
            <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-700" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-3xl md:text-4xl font-bold text-green-900">
            {stats.appointments.total}
          </div>
          <div className="space-y-1 text-xs md:text-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-yellow-600" />
                <span className="text-green-700">قيد الانتظار</span>
              </div>
              <span className="font-semibold text-yellow-600">{stats.appointments.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-blue-600" />
                <span className="text-green-700">مؤكد</span>
              </div>
              <span className="font-semibold text-blue-600">{stats.appointments.confirmed}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-green-600" />
                <span className="text-green-700">مكتمل</span>
              </div>
              <span className="font-semibold text-green-600">{stats.appointments.completed}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-600" />
                <span className="text-green-700">ملغي</span>
              </div>
              <span className="font-semibold text-red-600">{stats.appointments.cancelled}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Offer Leads */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg text-orange-900">حجوزات العروض</CardTitle>
            <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5 text-orange-700" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-3xl md:text-4xl font-bold text-orange-900">
            {stats.offers.total}
          </div>
          <div className="space-y-1 text-xs md:text-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-yellow-600" />
                <span className="text-orange-700">قيد الانتظار</span>
              </div>
              <span className="font-semibold text-yellow-600">{stats.offers.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-blue-600" />
                <span className="text-orange-700">مؤكد</span>
              </div>
              <span className="font-semibold text-blue-600">{stats.offers.confirmed}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-green-600" />
                <span className="text-orange-700">مكتمل</span>
              </div>
              <span className="font-semibold text-green-600">{stats.offers.completed}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-600" />
                <span className="text-orange-700">ملغي</span>
              </div>
              <span className="font-semibold text-red-600">{stats.offers.cancelled}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
