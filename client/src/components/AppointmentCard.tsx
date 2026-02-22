import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, User, Calendar, Eye, Stethoscope, MessageCircle, Printer } from "lucide-react";
import { SOURCE_LABELS, SOURCE_COLORS } from "@shared/sources";

interface AppointmentCardProps {
  appointment: any;
  onViewDetails: (appointment: any) => void;
  onPrint?: () => void;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; border: string; label: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200", label: "قيد الانتظار" },
  confirmed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200", label: "مؤكد" },
  cancelled: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", border: "border-red-200", label: "ملغي" },
  completed: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200", label: "مكتمل" },
};

export default function AppointmentCard({ appointment, onViewDetails, onPrint }: AppointmentCardProps) {
  const status = statusConfig[appointment.status] || statusConfig.pending;
  const isUrgent = appointment.status === 'pending';

  return (
    <Card className={`group relative overflow-hidden hover:shadow-md transition-all duration-200 ${
      isUrgent ? 'border-amber-200 bg-amber-50/30' : ''
    }`}>
      {/* Status indicator bar */}
      <div className={`absolute top-0 right-0 w-1 h-full ${status.dot} rounded-r-lg`} />
      
      <CardContent className="p-4 pr-5">
        {/* Header: Name + Status */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={`${status.bg} p-1.5 rounded-lg flex-shrink-0`}>
              <User className={`w-4 h-4 ${status.text}`} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm leading-tight truncate">{appointment.fullName}</h3>
              {appointment.source && (
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-block mt-0.5"
                  style={{
                    backgroundColor: SOURCE_COLORS[appointment.source] ? `${SOURCE_COLORS[appointment.source]}15` : '#f3f4f6',
                    color: SOURCE_COLORS[appointment.source] || '#6b7280',
                  }}
                >
                  {SOURCE_LABELS[appointment.source] || appointment.source}
                </span>
              )}
            </div>
          </div>
          <Badge className={`${status.bg} ${status.text} border ${status.border} text-[10px] px-2 py-0.5 flex-shrink-0`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ml-1.5 inline-block`} />
            {status.label}
          </Badge>
        </div>

        {/* Info Section */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span dir="ltr" className="font-mono text-xs">{appointment.phone}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Stethoscope className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{appointment.doctorName || `طبيب #${appointment.doctorId}`}</p>
              {appointment.doctorSpecialty && (
                <p className="text-[10px] text-muted-foreground truncate">{appointment.doctorSpecialty}</p>
              )}
            </div>
          </div>

          {appointment.procedure && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">الإجراء:</span>
              <span className="font-medium truncate">{appointment.procedure}</span>
            </div>
          )}

          {appointment.preferredDate && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{appointment.preferredDate}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1 border-t border-dashed">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(appointment.createdAt).toLocaleDateString("ar-SA", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            {appointment.age && (
              <>
                <span className="mx-1">•</span>
                <span>{appointment.age} سنة</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1"
            onClick={() => window.location.href = `tel:${appointment.phone}`}
          >
            <Phone className="w-3.5 h-3.5" />
            اتصال
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
            onClick={() => {
              const message = encodeURIComponent(
                `مرحباً ${appointment.fullName}، نود التواصل معك بخصوص موعدك مع ${appointment.doctorName || 'الطبيب'}`
              );
              window.open(`https://wa.me/967${appointment.phone.replace(/^0+/, '')}?text=${message}`, '_blank');
            }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            واتساب
          </Button>
          {onPrint ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1"
              onClick={onPrint}
            >
              <Printer className="w-3.5 h-3.5" />
              طباعة
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1"
              onClick={() => onViewDetails(appointment)}
            >
              <Eye className="w-3.5 h-3.5" />
              تفاصيل
            </Button>
          )}
        </div>
        {onPrint && (
          <Button
            size="sm"
            variant="outline"
            className="w-full h-8 text-xs gap-1"
            onClick={() => onViewDetails(appointment)}
          >
            <Eye className="w-3.5 h-3.5" />
            تحديث الحالة
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
