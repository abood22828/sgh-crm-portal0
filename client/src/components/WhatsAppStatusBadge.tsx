/**
 * WhatsAppStatusBadge — مكون شارة حالة إشعار WhatsApp
 * يُستخدم في صفحات المواعيد والتسجيلات والعروض
 * يعرض حالة الإشعار مع زر إعادة الإرسال
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MessageCircle, RefreshCw, CheckCheck, Clock, XCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

type EntityType = "appointment" | "camp_registration" | "offer_lead";

interface WhatsAppStatusBadgeProps {
  entityType: EntityType;
  entityId: number;
  /** إظهار زر إعادة الإرسال */
  showResend?: boolean;
  /** حجم الشارة */
  size?: "sm" | "default";
}

const statusConfig = {
  sent: {
    label: "أُرسل",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Send,
  },
  delivered: {
    label: "تم التسليم",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCheck,
  },
  read: {
    label: "تمت القراءة",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCheck,
  },
  pending: {
    label: "في الانتظار",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: Clock,
  },
  failed: {
    label: "فشل الإرسال",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
};

export function WhatsAppStatusBadge({
  entityType,
  entityId,
  showResend = true,
  size = "sm",
}: WhatsAppStatusBadgeProps) {
  const [isResending, setIsResending] = useState(false);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.whatsapp.getEntityWhatsAppStatus.useQuery(
    { entityType, entityId },
    { staleTime: 30_000 }
  );

  const resendMutation = trpc.whatsapp.resendNotification.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("✅ تم إعادة إرسال رسالة WhatsApp بنجاح");
        utils.whatsapp.getEntityWhatsAppStatus.invalidate({ entityType, entityId });
      } else {
        toast.error(`❌ فشل الإرسال: ${result.error}`);
      }
      setIsResending(false);
    },
    onError: (error) => {
      toast.error(`❌ خطأ: ${error.message}`);
      setIsResending(false);
    },
  });

  const handleResend = () => {
    setIsResending(true);
    resendMutation.mutate({ entityType, entityId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-full bg-gray-200 animate-pulse" />
        <span className="text-xs text-gray-400">جاري التحقق...</span>
      </div>
    );
  }

  const status = data?.status as keyof typeof statusConfig | null;
  const config = status ? statusConfig[status] : null;
  const Icon = config?.icon || MessageCircle;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {data?.hasSent && config ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={`flex items-center gap-1 cursor-default border ${config.color} ${size === "sm" ? "text-xs px-1.5 py-0.5" : "text-sm px-2 py-1"}`}
            >
              <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
              <span>WhatsApp: {config.label}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {data.sentAt
              ? `أُرسل ${formatDistanceToNow(new Date(data.sentAt), { addSuffix: true, locale: ar })}`
              : "تم الإرسال"}
            {data.count > 1 && ` · ${data.count} رسائل`}
          </TooltipContent>
        </Tooltip>
      ) : (
        <Badge
          variant="outline"
          className={`flex items-center gap-1 border border-gray-200 text-gray-500 bg-gray-50 ${size === "sm" ? "text-xs px-1.5 py-0.5" : "text-sm px-2 py-1"}`}
        >
          <MessageCircle className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
          <span>لم يُرسل WhatsApp</span>
        </Badge>
      )}

      {showResend && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <MessageCircle className="w-3 h-3" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {data?.hasSent ? "إعادة إرسال WhatsApp" : "إرسال WhatsApp"}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export default WhatsAppStatusBadge;
