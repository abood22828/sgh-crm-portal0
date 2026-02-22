import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Phone, MessageCircle, Edit, Printer, Tag, User, Mail } from "lucide-react";
import { SOURCE_LABELS, SOURCE_COLORS } from "@shared/sources";

interface OfferLead {
  id: number;
  fullName: string;
  phone: string;
  email?: string | null;
  status: string;
  offerName?: string;
  source?: string;
  createdAt: Date;
}

interface OfferLeadCardProps {
  lead: OfferLead;
  onEdit: () => void;
  onPrint?: () => void;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; border: string; label: string }> = {
  new: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200", label: "جديد" },
  contacted: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200", label: "تم التواصل" },
  booked: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200", label: "تم الحجز" },
  notInterested: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", border: "border-red-200", label: "غير مهتم" },
  not_interested: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", border: "border-red-200", label: "غير مهتم" },
  no_answer: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500", border: "border-gray-200", label: "لم يرد" },
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200", label: "قيد الانتظار" },
};

export default function OfferLeadCard({ lead, onEdit, onPrint }: OfferLeadCardProps) {
  const status = statusConfig[lead.status] || { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500", border: "border-gray-200", label: lead.status };
  const isUrgent = lead.status === 'new' || lead.status === 'pending';

  const handleCall = () => {
    window.location.href = `tel:${lead.phone}`;
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `مرحباً ${lead.fullName}، نود التواصل معك بخصوص حجز العرض: ${lead.offerName || 'العرض المميز'}`
    );
    window.open(`https://wa.me/967${lead.phone.replace(/^0+/, '')}?text=${message}`, '_blank');
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
              <h3 className="font-semibold text-sm leading-tight truncate">{lead.fullName}</h3>
              {lead.source && (
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-block mt-0.5"
                  style={{
                    backgroundColor: SOURCE_COLORS[lead.source] ? `${SOURCE_COLORS[lead.source]}15` : '#f3f4f6',
                    color: SOURCE_COLORS[lead.source] || '#6b7280',
                  }}
                >
                  {SOURCE_LABELS[lead.source] || lead.source}
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
            <span dir="ltr" className="font-mono text-xs">{lead.phone}</span>
          </div>
          
          {lead.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="truncate text-xs text-muted-foreground">{lead.email}</span>
            </div>
          )}

          {lead.offerName && (
            <div className="flex items-center gap-2 text-sm">
              <Tag className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="truncate text-xs font-medium">{lead.offerName}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1 border-t border-dashed">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(lead.createdAt).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
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
              onClick={onEdit}
            >
              <Edit className="w-3.5 h-3.5" />
              تحديث
            </Button>
          )}
        </div>
        {onPrint && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="w-full h-8 text-xs gap-1"
          >
            <Edit className="w-3.5 h-3.5" />
            تحديث الحالة
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
