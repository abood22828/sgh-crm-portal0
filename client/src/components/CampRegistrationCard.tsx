import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Phone, MessageCircle, Edit, User, Eye, Printer } from "lucide-react";

interface CampRegistration {
  id: number;
  fullName: string;
  phone: string;
  email?: string | null;
  age?: number | null;
  status: string;
  campName?: string;
  createdAt: Date;
}

interface CampRegistrationCardProps {
  registration: CampRegistration;
  onEdit: () => void;
  onViewDetails: () => void;
  onPrint?: () => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-orange-100 text-orange-800",
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  new: "جديد",
  contacted: "تم التواصل",
  confirmed: "مؤكد",
  cancelled: "ملغي",
};

export default function CampRegistrationCard({ registration, onEdit, onViewDetails, onPrint }: CampRegistrationCardProps) {
  const handleCall = () => {
    window.location.href = `tel:${registration.phone}`;
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `مرحباً ${registration.fullName}، نود التواصل معك بخصوص تسجيلك في: ${registration.campName || 'المخيم'}`
    );
    window.open(`https://wa.me/967${registration.phone.replace(/^0+/, '')}?text=${message}`, '_blank');
  };

  return (
    <Card className={`mb-3 hover:shadow-md transition-shadow ${registration.status === 'pending' ? 'bg-orange-50 border-orange-200' : ''}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-1">{registration.fullName}</h3>
            <Badge className={statusColors[registration.status] || "bg-gray-100 text-gray-800"}>
              {statusLabels[registration.status] || registration.status}
            </Badge>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-2 mb-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span dir="ltr" className="font-medium">{registration.phone}</span>
          </div>
          
          {registration.age && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4 flex-shrink-0" />
              <span>العمر: {registration.age} سنة</span>
            </div>
          )}

          {registration.campName && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{registration.campName}</span>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            {new Date(registration.createdAt).toLocaleDateString('ar-YE', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCall}
          >
            <Phone className="w-4 h-4 ml-1" />
            اتصال
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsApp}
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
          >
            <MessageCircle className="w-4 h-4 ml-1" />
            واتساب
          </Button>
          {onPrint && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPrint}
            >
              <Printer className="w-4 h-4 ml-1" />
              طباعة
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
          >
            <Eye className="w-4 h-4 ml-1" />
            تفاصيل
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
          >
            <Edit className="w-4 h-4 ml-1" />
            تحديث
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
