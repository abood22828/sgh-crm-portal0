import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, User, Calendar, Eye, Stethoscope, MessageCircle, Printer } from "lucide-react";

interface AppointmentCardProps {
  appointment: any;
  onViewDetails: (appointment: any) => void;
  onPrint?: () => void;
}

export default function AppointmentCard({ appointment, onViewDetails, onPrint }: AppointmentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "confirmed":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      case "completed":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "قيد الانتظار";
      case "confirmed":
        return "مؤكد";
      case "cancelled":
        return "ملغي";
      case "completed":
        return "مكتمل";
      default:
        return status;
    }
  };

  return (
    <Card className={`mb-3 hover:shadow-md transition-shadow ${
      appointment.status === 'pending' ? 'bg-red-50 border-red-200' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-1">{appointment.fullName}</h3>
            <Badge className={`${getStatusColor(appointment.status)} text-white text-xs`}>
              {getStatusLabel(appointment.status)}
            </Badge>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span dir="ltr" className="font-medium">{appointment.phone}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Stethoscope className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">{appointment.doctorName || `طبيب #${appointment.doctorId}`}</p>
              {appointment.doctorSpecialty && (
                <p className="text-xs text-muted-foreground">{appointment.doctorSpecialty}</p>
              )}
            </div>
          </div>

          {appointment.age && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span>{appointment.age} سنة</span>
            </div>
          )}

          {appointment.procedure && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">الإجراء:</span>
              <span className="font-medium">{appointment.procedure}</span>
            </div>
          )}

          {appointment.preferredDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>{appointment.preferredDate}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(appointment.createdAt).toLocaleDateString("ar-YE", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.href = `tel:${appointment.phone}`}
          >
            <Phone className="w-4 h-4 ml-1" />
            اتصال
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={() => {
              const message = encodeURIComponent(
                `مرحباً ${appointment.fullName}، نود التواصل معك بخصوص موعدك مع ${appointment.doctorName || 'الطبيب'}`
              );
              window.open(`https://wa.me/967${appointment.phone.replace(/^0+/, '')}?text=${message}`, '_blank');
            }}
          >
            <MessageCircle className="w-4 h-4 ml-1" />
            واتساب
          </Button>
          {onPrint && (
            <Button
              size="sm"
              variant="outline"
              onClick={onPrint}
            >
              <Printer className="w-4 h-4 ml-1" />
              طباعة
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onViewDetails(appointment)}
          >
            <Eye className="w-4 h-4 ml-1" />
            تحديث
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
