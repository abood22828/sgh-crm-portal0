import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Calendar, MessageSquare, Clock, MoreVertical, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ConversationInfoProps {
  conversation: {
    id: number;
    customerName?: string | null;
    phoneNumber: string;
    lastMessageAt?: string | Date | null;
    unreadCount: number;
    leadId?: number | null;
    appointmentId?: number | null;
    offerLeadId?: number | null;
    campRegistrationId?: number | null;
  };
  messageCount?: number;
  onMarkAsImportant?: () => void;
  onArchive?: () => void;
}

interface CustomerInfo {
  type: 'lead' | 'appointment' | 'offer' | 'camp';
  id: number;
  name: string;
  phone: string;
  email?: string;
  status: string;
  createdAt: Date;
}

interface CustomerRecords {
  leads: any[];
  appointments: any[];
  offers: any[];
  camps: any[];
}

export default function ConversationInfo({
  conversation,
  messageCount = 0,
  onMarkAsImportant,
  onArchive,
}: ConversationInfoProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [customerRecords, setCustomerRecords] = useState<CustomerRecords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    const fetchCustomerData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [infoResult, recordsResult] = await Promise.all([
          trpc.whatsapp.conversations.getCustomerInfo.fetch({ phone: conversation.phoneNumber }),
          trpc.whatsapp.conversations.getCustomerRecords.fetch({ phone: conversation.phoneNumber }),
        ]);
        
        if (infoResult) setCustomerInfo(infoResult);
        if (recordsResult) setCustomerRecords(recordsResult);
      } catch (err: any) {
        setError(err.message || "خطأ في تحميل البيانات");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [conversation.phoneNumber]);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(conversation.phoneNumber);
    toast.success("تم نسخ رقم الهاتف");
  };

  const getStatusBadgeColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'new': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'contacted': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'booked': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'confirmed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'completed': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'not_interested': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
      'pending': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'lead': 'عميل محتمل',
      'appointment': 'موعد طبي',
      'offer': 'عرض طبي',
      'camp': 'تسجيل مخيم',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-3 p-3 sm:p-4">
      {/* Header Card */}
      <Card className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm sm:text-base text-foreground truncate">
              {conversation.customerName || "عميل جديد"}
            </h3>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span dir="ltr" className="font-mono text-[10px] sm:text-xs">
                {conversation.phoneNumber}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 flex-shrink-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={handleCopyPhone}>
                <Phone className="h-3.5 w-3.5 ml-2" />
                نسخ رقم الهاتف
              </DropdownMenuItem>
              {onMarkAsImportant && (
                <DropdownMenuItem onClick={onMarkAsImportant}>
                  <span className="ml-2">⭐</span>
                  وضع علامة مهمة
                </DropdownMenuItem>
              )}
              {onArchive && (
                <DropdownMenuItem onClick={onArchive}>
                  <span className="ml-2">📦</span>
                  أرشفة المحادثة
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-2.5 sm:p-3">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">الرسائل</p>
              <p className="font-bold text-sm sm:text-base text-foreground">
                {messageCount}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-2.5 sm:p-3">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">آخر رسالة</p>
              <p className="font-bold text-sm sm:text-base text-foreground">
                {conversation.lastMessageAt
                  ? new Date(conversation.lastMessageAt).toLocaleDateString("ar-EG", {
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Customer Info Section */}
      {loading && (
        <Card className="p-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          جاري التحميل...
        </Card>
      )}

      {error && (
        <Card className="p-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
        </Card>
      )}

      {!loading && customerInfo && (
        <Card className="p-3 sm:p-4 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">معلومات العميل</p>
                <p className="font-semibold text-sm text-foreground">{customerInfo.name}</p>
                {customerInfo.email && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {customerInfo.email}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`text-xs ${getStatusBadgeColor(customerInfo.status)}`}>
                {customerInfo.status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getTypeLabel(customerInfo.type)}
              </Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Records Section */}
      {!loading && customerRecords && (
        <div className="space-y-2">
          {customerRecords.appointments.length > 0 && (
            <Card className="p-3 sm:p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">المواعيد الطبية ({customerRecords.appointments.length})</p>
              <div className="space-y-1.5">
                {customerRecords.appointments.slice(0, 3).map((apt) => (
                  <div key={apt.id} className="text-xs p-1.5 bg-muted rounded flex items-center justify-between">
                    <span className="truncate">{apt.fullName}</span>
                    <Badge variant="outline" className="text-[10px]">{apt.status}</Badge>
                  </div>
                ))}
                {customerRecords.appointments.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center py-1">+{customerRecords.appointments.length - 3} مواعيد أخرى</p>
                )}
              </div>
            </Card>
          )}

          {customerRecords.leads.length > 0 && (
            <Card className="p-3 sm:p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">العملاء المحتملين ({customerRecords.leads.length})</p>
              <div className="space-y-1.5">
                {customerRecords.leads.slice(0, 2).map((lead) => (
                  <div key={lead.id} className="text-xs p-1.5 bg-muted rounded flex items-center justify-between">
                    <span className="truncate">{lead.fullName}</span>
                    <Badge variant="outline" className="text-[10px]">{lead.status}</Badge>
                  </div>
                ))}
                {customerRecords.leads.length > 2 && (
                  <p className="text-xs text-muted-foreground text-center py-1">+{customerRecords.leads.length - 2} عملاء آخرين</p>
                )}
              </div>
            </Card>
          )}

          {customerRecords.offers.length > 0 && (
            <Card className="p-3 sm:p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">العروض الطبية ({customerRecords.offers.length})</p>
              <div className="space-y-1.5">
                {customerRecords.offers.slice(0, 2).map((offer) => (
                  <div key={offer.id} className="text-xs p-1.5 bg-muted rounded flex items-center justify-between">
                    <span className="truncate">{offer.fullName}</span>
                    <Badge variant="outline" className="text-[10px]">{offer.status}</Badge>
                  </div>
                ))}
                {customerRecords.offers.length > 2 && (
                  <p className="text-xs text-muted-foreground text-center py-1">+{customerRecords.offers.length - 2} عروض أخرى</p>
                )}
              </div>
            </Card>
          )}

          {customerRecords.camps.length > 0 && (
            <Card className="p-3 sm:p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">تسجيلات المخيمات ({customerRecords.camps.length})</p>
              <div className="space-y-1.5">
                {customerRecords.camps.slice(0, 2).map((camp) => (
                  <div key={camp.id} className="text-xs p-1.5 bg-muted rounded flex items-center justify-between">
                    <span className="truncate">{camp.fullName}</span>
                    <Badge variant="outline" className="text-[10px]">{camp.status}</Badge>
                  </div>
                ))}
                {customerRecords.camps.length > 2 && (
                  <p className="text-xs text-muted-foreground text-center py-1">+{customerRecords.camps.length - 2} تسجيلات أخرى</p>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Related Items */}
      <div className="space-y-1.5">
        {conversation.appointmentId && (
          <Badge variant="outline" className="w-full justify-start gap-1.5 px-2 py-1 text-xs">
            <Calendar className="h-3 w-3" />
            <span className="truncate">موعد طبي مرتبط</span>
          </Badge>
        )}
        {conversation.offerLeadId && (
          <Badge variant="outline" className="w-full justify-start gap-1.5 px-2 py-1 text-xs">
            <Mail className="h-3 w-3" />
            <span className="truncate">عرض طبي مرتبط</span>
          </Badge>
        )}
        {conversation.campRegistrationId && (
          <Badge variant="outline" className="w-full justify-start gap-1.5 px-2 py-1 text-xs">
            <span>🏕️</span>
            <span className="truncate">تسجيل مخيم مرتبط</span>
          </Badge>
        )}
      </div>
    </div>
  );
}
