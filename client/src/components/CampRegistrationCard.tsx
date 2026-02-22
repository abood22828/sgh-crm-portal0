import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Phone, MessageCircle, Edit, User, Eye, Printer, Tent, Mail } from "lucide-react";
import { SOURCE_LABELS, SOURCE_COLORS } from "@shared/sources";

interface CampRegistration {
  id: number;
  fullName: string;
  phone: string;
  email?: string | null;
  age?: number | null;
  status: string;
  campName?: string;
  source?: string;
  createdAt: Date;
}

interface CampRegistrationCardProps {
  registration: CampRegistration;
  onEdit: () => void;
  onViewDetails: () => void;
  onPrint?: () => void;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; border: string; label: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200", label: "قيد الانتظار" },
  new: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200", label: "جديد" },
  contacted: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500", border: "border-purple-200", label: "تم التواصل" },
  confirmed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200", label: "مؤكد" },
  cancelled: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", border: "border-red-200", label: "ملغي" },
  completed: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200", label: "مكتمل" },
};

export default function CampRegistrationCard({ registration, onEdit, onViewDetails, onPrint }: CampRegistrationCardProps) {
  const status = statusConfig[registration.status] || { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500", border: "border-gray-200", label: registration.status };
  const isUrgent = registration.status === 'pending' || registration.status === 'new';

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
              <h3 className="font-semibold text-sm leading-tight truncate">{registration.fullName}</h3>
              {(registration as any).source && (
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-block mt-0.5"
                  style={{
                    backgroundColor: SOURCE_COLORS[(registration as any).source] ? `${SOURCE_COLORS[(registration as any).source]}15` : '#f3f4f6',
                    color: SOURCE_COLORS[(registration as any).source] || '#6b7280',
                  }}
                >
                  {SOURCE_LABELS[(registration as any).source] || (registration as any).source}
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
            <span dir="ltr" className="font-mono text-xs">{registration.phone}</span>
          </div>
          
          {registration.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="truncate text-xs text-muted-foreground">{registration.email}</span>
            </div>
          )}

          {registration.campName && (
            <div className="flex items-center gap-2 text-sm">
              <Tent className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="truncate text-xs font-medium">{registration.campName}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1 border-t border-dashed">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(registration.createdAt).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {registration.age && (
              <>
                <span className="mx-1">•</span>
                <span>{registration.age} سنة</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={handleCall}
          >
            <Phone className="w-3.5 h-3.5" />
            اتصال
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            واتساب
          </Button>
          {onPrint ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={onPrint}
            >
              <Printer className="w-3.5 h-3.5" />
              طباعة
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={onViewDetails}
            >
              <Eye className="w-3.5 h-3.5" />
              تفاصيل
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={onViewDetails}
          >
            <Eye className="w-3.5 h-3.5" />
            تفاصيل
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={onEdit}
          >
            <Edit className="w-3.5 h-3.5" />
            تحديث
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
