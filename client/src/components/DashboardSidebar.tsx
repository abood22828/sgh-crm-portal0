import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Settings as SettingsIcon, 
  Send, 
  MessageSquare, 
  FileText, 
  BarChart3,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  FileEdit,
  Users,
  Calendar,
  Briefcase,
  CheckSquare,
  Target,
  Megaphone,
  Video,
  MapPin,
  Headphones
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    title: "الصفحة الرئيسية",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "إدارة الحجوزات",
    href: "/dashboard/bookings",
    icon: Calendar,
  },
  {
    title: "الإدارة",
    href: "/dashboard/management",
    icon: SettingsIcon,
  },
  {
    title: "إدارة المحتوى",
    href: "/dashboard/content",
    icon: FileEdit,
  },
  {
    title: "إدارة المستخدمين",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    title: "النشر",
    href: "/dashboard/publishing",
    icon: Send,
  },
  {
    title: "واتس اب",
    href: "/dashboard/whatsapp",
    icon: MessageCircle,
  },
  {
    title: "الرسائل",
    href: "/dashboard/messages",
    icon: MessageSquare,
  },
  {
    title: "إعدادات الرسائل",
    href: "/dashboard/message-settings",
    icon: SettingsIcon,
  },
  {
    title: "التقارير",
    href: "/dashboard/reports",
    icon: FileText,
  },
  {
    title: "التحليلات",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "فريق التسويق الرقمي",
    href: "/dashboard/teams/digital-marketing",
    icon: Megaphone,
  },
  {
    title: "فريق وحدة الإعلام",
    href: "/dashboard/teams/media",
    icon: Video,
  },
  {
    title: "فريق التسويق الميداني",
    href: "/dashboard/teams/field-marketing",
    icon: MapPin,
  },
  {
    title: "فريق خدمة العملاء",
    href: "/dashboard/teams/customer-service",
    icon: Headphones,
  },
  {
    title: "إدارة الحملات والمشاريع",
    href: "/dashboard/projects",
    icon: Target,
  },
  {
    title: "المراجعة والاعتماد",
    href: "/dashboard/review-approval",
    icon: CheckSquare,
  },
];

interface DashboardSidebarProps {
  currentPath: string;
}

export default function DashboardSidebar({ currentPath }: DashboardSidebarProps) {
  const [, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-white border-l shadow-sm transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Toggle Button */}
        <div className="p-4 border-b flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8"
          >
            {collapsed ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href || 
              (item.href !== "/dashboard" && currentPath.startsWith(item.href));
            
            return (
              <Button
                key={item.href}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  collapsed && "justify-center px-2"
                )}
                onClick={() => setLocation(item.href)}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 overflow-x-auto">
        <div className="flex gap-1 p-2 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href || 
              (item.href !== "/dashboard" && currentPath.startsWith(item.href));
            
            return (
              <Button
                key={item.href}
                variant={isActive ? "default" : "ghost"}
                className="flex-col h-auto py-2 px-3 min-w-[80px]"
                onClick={() => setLocation(item.href)}
              >
                <Icon className="h-5 w-5 mb-1 flex-shrink-0" />
                <span className="text-xs whitespace-nowrap">{item.title}</span>
              </Button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
