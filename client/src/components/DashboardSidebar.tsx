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
  FileEdit
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
    title: "لوحة التحكم",
    href: "/dashboard",
    icon: LayoutDashboard,
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
    title: "التقارير",
    href: "/dashboard/reports",
    icon: FileText,
  },
  {
    title: "التحليلات",
    href: "/dashboard/analytics",
    icon: BarChart3,
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
