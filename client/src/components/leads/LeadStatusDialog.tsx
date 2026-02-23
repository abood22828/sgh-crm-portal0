import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Phone, Mail, User, MessageSquare, Loader2 } from "lucide-react";
import { useFormatDate } from "@/hooks/useFormatDate";
import { usePhoneFormat } from "@/hooks/usePhoneFormat";
import { SOURCE_LABELS } from "@shared/sources";

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
  no_answer: { bg: "bg-muted/50 dark:bg-gray-800", text: "text-foreground dark:text-gray-300", dot: "bg-gray-500", border: "border-border dark:border-gray-700" },
};

const STATUS_BUTTONS = [
  { value: 'new', label: 'جديد', color: 'blue' },
  { value: 'contacted', label: 'تم التواصل', color: 'amber' },
  { value: 'booked', label: 'تم الحجز', color: 'emerald' },
  { value: 'not_interested', label: 'غير مهتم', color: 'red' },
  { value: 'no_answer', label: 'لم يرد', color: 'gray' },
];

interface LeadStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any | null;
  onSubmit: (status: string, notes: string) => void;
  isPending: boolean;
}

export default function LeadStatusDialog({
  open,
  onOpenChange,
  lead,
  onSubmit,
  isPending,
}: LeadStatusDialogProps) {
  const { formatDateTime } = useFormatDate();
  const { formatPhoneDisplay } = usePhoneFormat();
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");

  // Reset state when lead changes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setNewStatus("");
      setStatusNotes("");
    } else if (lead) {
      setNewStatus(lead.status);
    }
    onOpenChange(isOpen);
  };

  // Sync status when lead changes
  if (lead && newStatus === "" && open) {
    setNewStatus(lead.status);
  }

  const handleSubmit = () => {
    if (!newStatus) return;
    onSubmit(newStatus, statusNotes);
    setNewStatus("");
    setStatusNotes("");
  };

  const handleCancel = () => {
    setNewStatus("");
    setStatusNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-base">تحديث حالة العميل</DialogTitle>
          <DialogDescription>قم بتحديث حالة العميل وإضافة ملاحظات إذا لزم الأمر</DialogDescription>
        </DialogHeader>
        {lead && (
          <div className="space-y-4">
            {/* Lead info card */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${(statusConfig[lead.status] || statusConfig.new).bg}`}>
                    <User className={`w-4 h-4 ${(statusConfig[lead.status] || statusConfig.new).text}`} />
                  </div>
                  <p className="font-semibold text-sm">{lead.fullName}</p>
                </div>
                <Badge className={`${(statusConfig[lead.status] || statusConfig.new).bg} ${(statusConfig[lead.status] || statusConfig.new).text} border ${(statusConfig[lead.status] || statusConfig.new).border} text-[10px]`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${(statusConfig[lead.status] || statusConfig.new).dot} ml-1.5 inline-block`} />
                  {statusLabels[lead.status] || lead.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  <span dir="ltr" className="font-mono">{formatPhoneDisplay(lead.phone)}</span>
                </div>
                {lead.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-muted-foreground" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">النوع:</span>{' '}
                  <span className="font-medium">{lead.type === 'general' ? 'عام' : lead.type === 'offer' ? 'عرض' : 'مخيم'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">المصدر:</span>{' '}
                  <span className="font-medium">{lead.source ? SOURCE_LABELS[lead.source] || lead.source : '-'}</span>
                </div>
              </div>
              {lead.notes && (
                <div className="text-xs bg-background/60 rounded p-2 border border-dashed">
                  <span className="font-medium">الملاحظات:</span> {lead.notes}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">
                تاريخ التسجيل:{' '}
                {(() => {
                  try {
                    const date = lead.createdAt ? new Date(lead.createdAt) : null;
                    return formatDateTime(date);
                  } catch {
                    return 'غير متوفر';
                  }
                })()}
              </p>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-xs gap-1.5"
                onClick={() => window.location.href = `tel:${formatPhoneDisplay(lead.phone)}`}
              >
                <Phone className="w-3.5 h-3.5" />
                اتصال
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-xs gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                onClick={() => {
                  const msg = encodeURIComponent(`مرحباً ${lead.fullName}، نود التواصل معك بخصوص استفسارك.`);
                  window.open(`https://wa.me/${lead.phone.replace(/^0+/, '')}?text=${msg}`, '_blank');
                }}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                واتساب
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">الحالة الجديدة</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {STATUS_BUTTONS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setNewStatus(s.value)}
                    className={`text-[10px] py-2 px-1 rounded-lg border-2 transition-all text-center leading-tight ${
                      newStatus === s.value
                        ? `border-${s.color}-500 bg-${s.color}-50 text-${s.color}-700 font-semibold ring-1 ring-${s.color}-200`
                        : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">ملاحظات (اختياري)</Label>
              <Textarea
                placeholder="أضف ملاحظات..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                إلغاء
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!newStatus || isPending}
                className="gap-1.5"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                تحديث الحالة
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
