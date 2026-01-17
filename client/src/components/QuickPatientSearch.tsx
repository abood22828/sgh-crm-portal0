import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Phone, MessageCircle, Eye, Edit, X } from "lucide-react";
import { toast } from "sonner";

interface PatientCardProps {
  patient: any;
  onClose: () => void;
  onUpdateStatus: (id: number, status: string) => void;
}

function PatientCard({ patient, onClose, onUpdateStatus }: PatientCardProps) {
  const [selectedStatus, setSelectedStatus] = useState(patient.status);

  const handleCall = () => {
    if (patient.phone) {
      window.location.href = `tel:${patient.phone}`;
    } else {
      toast.error("رقم الهاتف غير متوفر");
    }
  };

  const handleWhatsApp = () => {
    if (patient.phone) {
      const cleanPhone = patient.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    } else {
      toast.error("رقم الهاتف غير متوفر");
    }
  };

  const handleViewDetails = () => {
    // Navigate to bookings management page
    window.location.href = '/bookings-management';
  };

  const handleUpdateStatus = () => {
    if (selectedStatus !== patient.status) {
      onUpdateStatus(patient.id, selectedStatus);
    }
  };

  const getStatusBadge = (status: string) => {
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
    const status_info = statusMap[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={status_info.variant}>{status_info.label}</Badge>;
  };

  return (
    <Card className="border-2 border-primary shadow-lg">
      <CardContent className="p-6">
        {/* Close Button */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold mb-1">{patient.fullName}</h3>
            <p className="text-sm text-muted-foreground">{patient.type === 'lead' ? 'عميل' : patient.type === 'appointment' ? 'موعد طبيب' : patient.type === 'offerLead' ? 'حجز عرض' : 'تسجيل مخيم'}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Patient Info */}
        <div className="space-y-3 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">رقم الهاتف</p>
            <p className="font-medium">{patient.phone || 'غير متوفر'}</p>
          </div>
          {patient.email && (
            <div>
              <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
              <p className="font-medium">{patient.email}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">الحالة</p>
            <div className="mt-1">{getStatusBadge(patient.status)}</div>
          </div>
        </div>

        {/* Status Update */}
        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
          <p className="text-sm font-medium mb-2">تحديث الحالة</p>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full p-2 border rounded-md text-sm"
          >
            <option value="new">جديد</option>
            <option value="pending">قيد الانتظار</option>
            <option value="contacted">تم التواصل</option>
            <option value="confirmed">مؤكد</option>
            <option value="booked">تم الحجز</option>
            <option value="attended">حضر</option>
            <option value="cancelled">ملغي</option>
            <option value="not_interested">غير مهتم</option>
            <option value="no_answer">لم يرد</option>
          </select>
          {selectedStatus !== patient.status && (
            <Button 
              onClick={handleUpdateStatus} 
              size="sm" 
              className="w-full mt-2"
            >
              <Edit className="h-4 w-4 mr-2" />
              حفظ التحديث
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={handleCall} className="w-full">
            <Phone className="h-4 w-4 mr-2" />
            اتصال
          </Button>
          <Button variant="outline" onClick={handleWhatsApp} className="w-full">
            <MessageCircle className="h-4 w-4 mr-2" />
            واتساب
          </Button>
          <Button variant="outline" onClick={handleViewDetails} className="col-span-2">
            <Eye className="h-4 w-4 mr-2" />
            عرض التفاصيل الكاملة
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function QuickPatientSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: leads } = trpc.leads.unifiedList.useQuery();
  const { data: appointments } = trpc.appointments.list.useQuery();
  const { data: offerLeads } = trpc.offerLeads.list.useQuery();
  const { data: campRegistrations } = trpc.campRegistrations.list.useQuery();

  const updateLeadMutation = trpc.leads.updateStatus.useMutation();
  const updateAppointmentMutation = trpc.appointments.updateStatus.useMutation();
  const updateOfferLeadMutation = trpc.offerLeads.updateStatus.useMutation();
  const updateCampMutation = trpc.campRegistrations.updateStatus.useMutation();

  // Search when query length >= 3
  useEffect(() => {
    if (searchQuery.length >= 3) {
      const allPatients = [
        ...(leads || []).map(l => ({ ...l, type: 'lead' })),
        ...(appointments || []).map(a => ({ ...a, type: 'appointment' })),
        ...(offerLeads || []).map(o => ({ ...o, type: 'offerLead' })),
        ...(campRegistrations || []).map(c => ({ ...c, type: 'campRegistration' })),
      ];

      const found = allPatients.find(p => 
        p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone?.includes(searchQuery)
      );

      if (found) {
        setSelectedPatient(found);
      } else {
        setSelectedPatient(null);
      }
    } else {
      setSelectedPatient(null);
    }
  }, [searchQuery, leads, appointments, offerLeads, campRegistrations]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSelectedPatient(null);
        setSearchQuery("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      if (selectedPatient.type === 'lead') {
        await updateLeadMutation.mutateAsync({ id, status: status as any });
      } else if (selectedPatient.type === 'appointment') {
        await updateAppointmentMutation.mutateAsync({ id, status: status as any });
      } else if (selectedPatient.type === 'offerLead') {
        await updateOfferLeadMutation.mutateAsync({ id, status: status as any });
      } else if (selectedPatient.type === 'campRegistration') {
        await updateCampMutation.mutateAsync({ id, status: status as any });
      }
      toast.success("تم تحديث الحالة بنجاح");
      setSelectedPatient({ ...selectedPatient, status });
    } catch (error) {
      toast.error("فشل تحديث الحالة");
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="ابحث بالاسم أو رقم الهاتف (3 أحرف على الأقل)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10 h-12 text-lg"
        />
      </div>

      {/* Patient Card */}
      {selectedPatient && (
        <div className="absolute top-full mt-2 w-full z-50">
          <PatientCard
            patient={selectedPatient}
            onClose={() => {
              setSelectedPatient(null);
              setSearchQuery("");
            }}
            onUpdateStatus={handleUpdateStatus}
          />
        </div>
      )}

      {/* No Results */}
      {searchQuery.length >= 3 && !selectedPatient && (
        <div className="absolute top-full mt-2 w-full z-50">
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              <p className="text-sm">لا توجد نتائج</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
