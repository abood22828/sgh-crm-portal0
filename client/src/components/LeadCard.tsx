import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Calendar, Eye, MessageSquare, User } from "lucide-react";
import { SOURCE_LABELS, SOURCE_COLORS } from "@shared/sources";

const statusLabels: Record<string, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  booked: "تم الحجز",
  not_interested: "غير مهتم",
  no_answer: "لم يرد",
};

const statusConfig: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  new: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200" },
  contacted: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
  booked: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  not_interested: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", border: "border-red-200" },
  no_answer: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500", border: "border-gray-200" },
};

interface LeadCardProps {
  lead: any;
  onUpdateStatus: (lead: any) => void;
  onWhatsApp: (lead: any) => void;
}

export default function LeadCard({ lead, onUpdateStatus, onWhatsApp }: LeadCardProps) {
  const status = statusConfig[lead.status] || statusConfig.new;
  const isUrgent = lead.status === 'new' || lead.status === 'pending';

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
            {statusLabels[lead.status] || lead.status}
          </Badge>
        </div>

        {/* Contact Info */}
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

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {new Date(lead.createdAt).toLocaleDateString("ar-SA", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1"
            onClick={() => window.location.href = `tel:${lead.phone}`}
          >
            <Phone className="w-3.5 h-3.5" />
            اتصال
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
            onClick={() => onWhatsApp(lead)}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            واتساب
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1"
            onClick={() => onUpdateStatus(lead)}
          >
            <Eye className="w-3.5 h-3.5" />
            تحديث
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
