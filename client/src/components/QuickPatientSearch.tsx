import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Phone, MessageCircle, Edit, X, Calendar, Mail, User, MapPin, Printer } from "lucide-react";
import { toast } from "sonner";
import { printReceipt } from "./PrintReceipt";
import { useAuth } from "@/_core/hooks/useAuth";

interface PatientCardProps {
  patient: any;
  onClose: () => void;
  onUpdateStatus: (id: number, status: string) => void;
}

function PatientCard({ patient, onClose, onUpdateStatus }: PatientCardProps) {
  const [selectedStatus, setSelectedStatus] = useState(patient.status);
  const { user } = useAuth();
  const [isPrinting, setIsPrinting] = useState(false);
  
  const generateAppointmentReceipt = trpc.appointments.generateReceiptNumber.useMutation();
  const generateOfferReceipt = trpc.offerLeads.generateReceiptNumber.useMutation();
  const generateCampReceipt = trpc.campRegistrations.generateReceiptNumber.useMutation();

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

  const handlePrint = async () => {
    let type: "appointment" | "camp" | "offer" = "appointment";
    let typeName = 'غير محدد';
    
    if (patient.type === 'appointment') {
      type = 'appointment';
      typeName = patient.doctorName || 'غير محدد';
    } else if (patient.type === 'offerLead') {
      type = 'offer';
      typeName = patient.offerTitle || 'غير محدد';
    } else if (patient.type === 'campRegistration') {
      type = 'camp';
      typeName = patient.campName || 'غير محدد';
    }
    
    try {
      setIsPrinting(true);
      
      // Generate or retrieve receipt number
      let receiptNumber = 'غير متاح';
      
      if (type === 'appointment') {
        const result = await generateAppointmentReceipt.mutateAsync({ id: patient.id });
        receiptNumber = result.receiptNumber;
      } else if (type === 'offer') {
        const result = await generateOfferReceipt.mutateAsync({ id: patient.id });
        receiptNumber = result.receiptNumber;
      } else if (type === 'camp') {
        const result = await generateCampReceipt.mutateAsync({ id: patient.id });
        receiptNumber = result.receiptNumber;
      }
      
      // Print with receipt number
      printReceipt({
        fullName: patient.fullName,
        age: patient.age,
        phone: patient.phone,
        registrationDate: patient.createdAt ? new Date(patient.createdAt) : new Date(),
        type,
        typeName,
        receiptNumber,
      }, user?.name || 'غير معروف');
    } catch (error) {
      console.error('Failed to generate receipt number:', error);
      toast.error('فشل توليد رقم السند');
    } finally {
      setIsPrinting(false);
    }
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

  // Get status options based on type
  const getStatusOptions = () => {
    if (patient.type === 'appointment') {
      return [
        { value: 'pending', label: 'قيد الانتظار' },
        { value: 'confirmed', label: 'مؤكد' },
        { value: 'completed', label: 'مكتمل' },
        { value: 'cancelled', label: 'ملغي' },
      ];
    } else if (patient.type === 'offerLead') {
      return [
        { value: 'new', label: 'جديد' },
        { value: 'contacted', label: 'تم التواصل' },
        { value: 'booked', label: 'تم الحجز' },
        { value: 'not_interested', label: 'غير مهتم' },
        { value: 'no_answer', label: 'لم يرد' },
      ];
    } else if (patient.type === 'campRegistration') {
      return [
        { value: 'pending', label: 'قيد الانتظار' },
        { value: 'confirmed', label: 'مؤكد' },
        { value: 'attended', label: 'حضر' },
        { value: 'cancelled', label: 'ملغي' },
      ];
    } else {
      // Default for leads
      return [
        { value: 'new', label: 'جديد' },
        { value: 'contacted', label: 'تم التواصل' },
        { value: 'booked', label: 'تم الحجز' },
        { value: 'not_interested', label: 'غير مهتم' },
        { value: 'no_answer', label: 'لم يرد' },
      ];
    }
  };

  const getTypeLabel = () => {
    if (patient.type === 'lead') return 'عميل';
    if (patient.type === 'appointment') return 'موعد طبيب';
    if (patient.type === 'offerLead') return 'حجز عرض';
    if (patient.type === 'campRegistration') return 'تسجيل مخيم';
    return 'غير محدد';
  };

  return (
    <Card className="border-2 border-primary shadow-lg">
      <CardContent className="p-4 md:p-6">
        {/* Close Button */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg md:text-xl font-bold mb-1">{patient.fullName}</h3>
            <p className="text-xs md:text-sm text-muted-foreground">{getTypeLabel()}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Patient Info */}
        <div className="space-y-3 mb-4">
          {/* Phone */}
          <div className="flex items-start gap-2">
            <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">رقم الهاتف</p>
              <p className="font-medium text-sm break-all" dir="ltr">{patient.phone || 'غير متوفر'}</p>
            </div>
          </div>

          {/* Email */}
          {patient.email && (
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                <p className="font-medium text-sm break-all">{patient.email}</p>
              </div>
            </div>
          )}

          {/* Age */}
          {patient.age && (
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">العمر</p>
                <p className="font-medium text-sm">{patient.age} سنة</p>
              </div>
            </div>
          )}

          {/* Address */}
          {patient.address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">العنوان</p>
                <p className="font-medium text-sm">{patient.address}</p>
              </div>
            </div>
          )}

          {/* Doctor Name (for appointments) */}
          {patient.type === 'appointment' && patient.doctorName && (
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">الطبيب</p>
                <p className="font-medium text-sm">{patient.doctorName}</p>
              </div>
            </div>
          )}

          {/* Appointment Date (for appointments) */}
          {patient.type === 'appointment' && patient.appointmentDate && (
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">تاريخ الموعد</p>
                <p className="font-medium text-sm">{new Date(patient.appointmentDate).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>
          )}

          {/* Offer Title (for offer leads) */}
          {patient.type === 'offerLead' && patient.offerTitle && (
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">العرض</p>
                <p className="font-medium text-sm">{patient.offerTitle}</p>
              </div>
            </div>
          )}

          {/* Camp Name (for camp registrations) */}
          {patient.type === 'campRegistration' && patient.campName && (
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">المخيم</p>
                <p className="font-medium text-sm">{patient.campName}</p>
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">الحالة</p>
            <div>{getStatusBadge(patient.status)}</div>
          </div>

          {/* Created At */}
          {patient.createdAt && (
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">تاريخ التسجيل</p>
                <p className="font-medium text-sm">{new Date(patient.createdAt).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Status Update */}
        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
          <p className="text-sm font-medium mb-2">تحديث الحالة</p>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full p-2 border rounded-md text-sm"
          >
            {getStatusOptions().map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
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
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" onClick={handleCall} className="w-full text-xs md:text-sm">
            <Phone className="h-4 w-4 mr-1 md:mr-2" />
            اتصال
          </Button>
          <Button variant="outline" onClick={handleWhatsApp} className="w-full text-xs md:text-sm">
            <MessageCircle className="h-4 w-4 mr-1 md:mr-2" />
            واتساب
          </Button>
          <Button variant="outline" onClick={handlePrint} className="w-full text-xs md:text-sm">
            <Printer className="h-4 w-4 mr-1 md:mr-2" />
            طباعة
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function QuickPatientSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
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

  // Search when query length >= 3 - show ALL matching results
  useEffect(() => {
    if (searchQuery.length >= 3) {
      const allPatients = [
        ...(appointments || []).map(a => ({ ...a, type: 'appointment' })),
        ...(offerLeads || []).map(o => ({ ...o, type: 'offerLead' })),
        ...(campRegistrations || []).map(c => ({ ...c, type: 'campRegistration' })),
      ];

      const results = allPatients.filter(p => 
        p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone?.includes(searchQuery)
      );

      setSearchResults(results);
    } else {
      setSearchResults([]);
      setSelectedPatient(null);
    }
  }, [searchQuery, leads, appointments, offerLeads, campRegistrations]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSelectedPatient(null);
        setSearchQuery("");
        setSearchResults([]);
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

  const getTypeLabel = (type: string) => {
    if (type === 'lead') return 'عميل';
    if (type === 'appointment') return 'موعد';
    if (type === 'offerLead') return 'عرض';
    if (type === 'campRegistration') return 'مخيم';
    return '';
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
          className="pr-10 h-12 text-base md:text-lg"
        />
      </div>

      {/* Search Results List */}
      {searchQuery.length >= 3 && searchResults.length > 0 && !selectedPatient && (
        <div className="absolute top-full mt-2 w-full z-50 max-h-[60vh] overflow-y-auto">
          <Card>
            <CardContent className="p-2">
              <p className="text-xs text-muted-foreground p-2">
                تم العثور على {searchResults.length} نتيجة
              </p>
              <div className="space-y-1">
                {searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => setSelectedPatient(result)}
                    className="w-full p-3 text-right hover:bg-slate-50 rounded-md transition-colors flex items-center justify-between group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                        {result.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground" dir="ltr">{result.phone}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 ml-2 text-xs">
                      {getTypeLabel(result.type)}
                    </Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Selected Patient Card */}
      {selectedPatient && (
        <div className="absolute top-full mt-2 w-full z-50">
          <PatientCard
            patient={selectedPatient}
            onClose={() => {
              setSelectedPatient(null);
              setSearchQuery("");
              setSearchResults([]);
            }}
            onUpdateStatus={handleUpdateStatus}
          />
        </div>
      )}

      {/* No Results */}
      {searchQuery.length >= 3 && searchResults.length === 0 && (
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
