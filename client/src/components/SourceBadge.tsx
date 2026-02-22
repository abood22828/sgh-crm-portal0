import { Facebook, Instagram, Search, MessageCircle, Send, Twitter, Linkedin, Music, Youtube, Globe, Phone, Mail, User } from "lucide-react";
import { getSourceDisplayName } from "@/lib/tracking";

interface SourceBadgeProps {
  source: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  showDetails?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * SourceBadge Component
 * عرض مصدر الحجز/التسجيل مع أيقونة ولون مميز
 */
export default function SourceBadge({
  source,
  utmSource,
  utmMedium,
  utmCampaign,
  referrer,
  fbclid,
  gclid,
  showDetails = false,
  size = "md",
}: SourceBadgeProps) {
  // Determine the actual source (priority: fbclid → gclid → utmSource → source)
  const actualSource = fbclid 
    ? 'facebook' 
    : gclid 
    ? 'google' 
    : utmSource 
    ? utmSource.toLowerCase() 
    : source?.toLowerCase() || 'direct';

  // Get icon and color based on source
  const getSourceConfig = (src: string) => {
    const configs: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
      facebook: {
        icon: Facebook,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        label: "فيسبوك",
      },
      instagram: {
        icon: Instagram,
        color: "text-pink-600",
        bgColor: "bg-pink-100",
        label: "انستجرام",
      },
      google: {
        icon: Search,
        color: "text-red-600",
        bgColor: "bg-red-100",
        label: "جوجل",
      },
      whatsapp: {
        icon: MessageCircle,
        color: "text-green-600",
        bgColor: "bg-green-100",
        label: "واتساب",
      },
      telegram: {
        icon: Send,
        color: "text-blue-500",
        bgColor: "bg-blue-100",
        label: "تيليجرام",
      },
      twitter: {
        icon: Twitter,
        color: "text-sky-600",
        bgColor: "bg-sky-100",
        label: "تويتر",
      },
      linkedin: {
        icon: Linkedin,
        color: "text-blue-700",
        bgColor: "bg-blue-100",
        label: "لينكد إن",
      },
      tiktok: {
        icon: Music,
        color: "text-foreground",
        bgColor: "bg-muted",
        label: "تيك توك",
      },
      youtube: {
        icon: Youtube,
        color: "text-red-600",
        bgColor: "bg-red-100",
        label: "يوتيوب",
      },
      email: {
        icon: Mail,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
        label: "بريد إلكتروني",
      },
      sms: {
        icon: MessageCircle,
        color: "text-orange-600",
        bgColor: "bg-orange-100",
        label: "رسالة نصية",
      },
      phone: {
        icon: Phone,
        color: "text-teal-600",
        bgColor: "bg-teal-100",
        label: "هاتف",
      },
      manual: {
        icon: User,
        color: "text-indigo-600",
        bgColor: "bg-indigo-100",
        label: "يدوي",
      },
      referral: {
        icon: Globe,
        color: "text-cyan-600",
        bgColor: "bg-cyan-100",
        label: "إحالة",
      },
      direct: {
        icon: Globe,
        color: "text-muted-foreground",
        bgColor: "bg-muted",
        label: "مباشر",
      },
    };

    return configs[src] || configs.direct;
  };

  const config = getSourceConfig(actualSource);
  const Icon = config.icon;

  // Size classes
  const sizeClasses = {
    sm: {
      container: "px-2 py-1 text-xs",
      icon: "h-3 w-3",
      text: "text-xs",
    },
    md: {
      container: "px-3 py-1.5 text-sm",
      icon: "h-4 w-4",
      text: "text-sm",
    },
    lg: {
      container: "px-4 py-2 text-base",
      icon: "h-5 w-5",
      text: "text-base",
    },
  };

  const sizeClass = sizeClasses[size];

  return (
    <div className="flex flex-col gap-1">
      <div className={`inline-flex items-center gap-1.5 rounded-full ${config.bgColor} ${config.color} ${sizeClass.container} font-medium`}>
        <Icon className={sizeClass.icon} />
        <span>{config.label}</span>
      </div>

      {showDetails && (utmMedium || utmCampaign || referrer) && (
        <div className="text-xs text-muted-foreground space-y-0.5">
          {utmMedium && (
            <div>
              <span className="font-semibold">الوسيط:</span> {utmMedium}
            </div>
          )}
          {utmCampaign && (
            <div>
              <span className="font-semibold">الحملة:</span> {utmCampaign}
            </div>
          )}
          {referrer && (
            <div>
              <span className="font-semibold">المُحيل:</span>{" "}
              <span className="truncate max-w-[200px] inline-block" title={referrer}>
                {new URL(referrer).hostname}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
