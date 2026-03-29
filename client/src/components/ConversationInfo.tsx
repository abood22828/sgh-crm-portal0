import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Calendar, MessageSquare, Clock, MoreVertical, Loader2, AlertCircle, MessageCircle } from "lucide-react";
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

  const handleCall = () => {
    window.location.href = `tel:${conversation.phoneNumber}`;
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent("مرحباً! هذه رسالة من المستشفى السعودي الألماني");
    window.open(`https://wa.me/${conversation.phoneNumber}?text=${message}`, '_blank');
  };

  const handleEmail = (email?: string) => {
    if (!email) {
      toast.error("لا يوجد بريد إلكتروني");
      return;
    }
    window.location.href = `mailto:${email}`;
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

  const getRecordIcon = (type: string) => {
    const icons: Record<string, string> = {
      'appointment': '📅',
      'lead': '👤',
      'offer': '🏥',
      'camp': '🏕️',
    };
    return icons[type] || '📋';
  };

  return (
    <div className="space-y-3 p-3 sm:p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
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

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          onClick={handleCall}
        >
          <Phone className="h-3.5 w-3.5 ml-1" />
          <span className="hidden sm:inline">اتصال</span>
          <span className="sm:hidden">☎️</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs bg-green-50 hover:bg-green-100 dark:bg-green-900/20"
          onClick={handleWhatsApp}
        >
          <MessageCircle className="h-3.5 w-3.5 ml-1" />
          <span className="hidden sm:inline">واتس</span>
          <span className="sm:hidden">💬</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          onClick={() => handleEmail(customerInfo?.email)}
        >
          <Mail className="h-3.5 w-3.5 ml-1" />
          <span className="hidden sm:inline">بريد</span>
          <span className="sm:hidden">✉️</span>
        </Button>
      </div>

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
            <p className="text-xs font-semibold text-muted-foreground">معلومات العميل الأساسية</p>
            <div className="space-y-1.5">
              <div>
                <p className="text-xs text-muted-foreground">الاسم</p>
                <p className="font-semibold text-sm text-foreground">{customerInfo.name}</p>
              </div>
              {customerInfo.email && (
                <div>
                  <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                  <p className="text-xs text-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {customerInfo.email}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">الحالة والنوع</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-xs ${getStatusBadgeColor(customerInfo.status)}`}>
                    {customerInfo.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getTypeLabel(customerInfo.type)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Records Section */}
      {!loading && customerRecords && (
        <div className="space-y-2">
          {/* Appointments Card */}
          {customerRecords.appointments.length > 0 && (
            <Card className="p-3 sm:p-4 border-l-4 border-l-blue-500">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📅</span>
                <p className="text-xs font-semibold text-foreground">
                  المواعيد الطبية ({customerRecords.appointments.length})
                </p>
              </div>
              <div className="space-y-1.5">
                {customerRecords.appointments.slice(0, 3).map((apt) => (
                  <div key={apt.id} className="text-xs p-2 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-between">
                    <span className="truncate flex-1">{apt.fullName}</span>
                    <Badge variant="outline" className="text-[10px] ml-2 flex-shrink-0">{apt.status}</Badge>
                  </div>
                ))}
                {customerRecords.appointments.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    +{customerRecords.appointments.length - 3} مواعيد أخرى
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Leads Card */}
          {customerRecords.leads.length > 0 && (
            <Card className="p-3 sm:p-4 border-l-4 border-l-yellow-500">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">👤</span>
                <p className="text-xs font-semibold text-foreground">
                  العملاء المحتملين ({customerRecords.leads.length})
                </p>
              </div>
              <div className="space-y-1.5">
                {customerRecords.leads.slice(0, 2).map((lead) => (
                  <div key={lead.id} className="text-xs p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded flex items-center justify-between">
                    <span className="truncate flex-1">{lead.fullName}</span>
                    <Badge variant="outline" className="text-[10px] ml-2 flex-shrink-0">{lead.status}</Badge>
                  </div>
                ))}
                {customerRecords.leads.length > 2 && (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    +{customerRecords.leads.length - 2} عملاء آخرين
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Offers Card */}
          {customerRecords.offers.length > 0 && (
            <Card className="p-3 sm:p-4 border-l-4 border-l-green-500">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🏥</span>
                <p className="text-xs font-semibold text-foreground">
                  العروض الطبية ({customerRecords.offers.length})
                </p>
              </div>
              <div className="space-y-1.5">
                {customerRecords.offers.slice(0, 2).map((offer) => (
                  <div key={offer.id} className="text-xs p-2 bg-green-50 dark:bg-green-900/20 rounded flex items-center justify-between">
                    <span className="truncate flex-1">{offer.fullName}</span>
                    <Badge variant="outline" className="text-[10px] ml-2 flex-shrink-0">{offer.status}</Badge>
                  </div>
                ))}
                {customerRecords.offers.length > 2 && (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    +{customerRecords.offers.length - 2} عروض أخرى
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Camps Card */}
          {customerRecords.camps.length > 0 && (
            <Card className="p-3 sm:p-4 border-l-4 border-l-purple-500">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🏕️</span>
                <p className="text-xs font-semibold text-foreground">
                  تسجيلات المخيمات ({customerRecords.camps.length})
                </p>
              </div>
              <div className="space-y-1.5">
                {customerRecords.camps.slice(0, 2).map((camp) => (
                  <div key={camp.id} className="text-xs p-2 bg-purple-50 dark:bg-purple-900/20 rounded flex items-center justify-between">
                    <span className="truncate flex-1">{camp.fullName}</span>
                    <Badge variant="outline" className="text-[10px] ml-2 flex-shrink-0">{camp.status}</Badge>
                  </div>
                ))}
                {customerRecords.camps.length > 2 && (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    +{customerRecords.camps.length - 2} تسجيلات أخرى
                  </p>
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
