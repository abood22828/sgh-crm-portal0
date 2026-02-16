import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Phone, MessageCircle, Edit, Printer } from "lucide-react";

interface OfferLead {
  id: number;
  fullName: string;
  phone: string;
  email?: string | null;
  status: string;
  offerName?: string;
  createdAt: Date;
}

interface OfferLeadCardProps {
  lead: OfferLead;
  onEdit: () => void;
  onPrint?: () => void;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  booked: "bg-green-100 text-green-800",
  notInterested: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  booked: "تم الحجز",
  notInterested: "غير مهتم",
};

export default function OfferLeadCard({ lead, onEdit, onPrint }: OfferLeadCardProps) {
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
    <Card className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-1">{lead.fullName}</h3>
            <Badge className={statusColors[lead.status] || "bg-gray-100 text-gray-800"}>
              {statusLabels[lead.status] || lead.status}
            </Badge>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-2 mb-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span dir="ltr" className="font-medium">{lead.phone}</span>
          </div>
          
          {lead.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageCircle className="w-4 h-4 flex-shrink-0" />
              <span className="truncate text-xs">{lead.email}</span>
            </div>
          )}

          {lead.offerName && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{lead.offerName}</span>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            {new Date(lead.createdAt).toLocaleDateString('ar-YE', {
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-1"
          >
            <Edit className="w-4 h-4 ml-1" />
            تحديث
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
