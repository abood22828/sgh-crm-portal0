import { useLocation } from "wouter";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutDashboard, 
  Settings as SettingsIcon, 
  Send, 
  MessageSquare, 
  FileText, 
  BarChart3,
  MessageCircle,
  ChevronDown,
  FileEdit,
  Users,
  Calendar,
  CheckSquare,
  Target,
  Megaphone,
  Video,
  MapPin,
  Headphones,
  UserCheck,
  Gift,
  Tent,
  Contact,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Home,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  defaultOpen?: boolean;
}

const navGroups: NavGroup[] = [
  {
    label: "الرئيسية",
    icon: Home,
    defaultOpen: true,
    items: [
      {
        title: "لوحة التحكم",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "إدارة الحجوزات",
    icon: ClipboardList,
    items: [
      {
        title: "العملاء المحتملين",
        href: "/dashboard/bookings/leads",
        icon: UserCheck,
      },
      {
        title: "مواعيد الأطباء",
        href: "/dashboard/bookings/appointments",
        icon: Calendar,
      },
      {
        title: "عروض العملاء",
        href: "/dashboard/bookings/offer-leads",
        icon: Gift,
      },
      {
        title: "تسجيلات المخيمات",
        href: "/dashboard/bookings/camp-registrations",
        icon: Tent,
      },
      {
        title: "ملفات العملاء",
        href: "/dashboard/bookings/customers",
        icon: Contact,
      },
      {
        title: "المهام",
        href: "/dashboard/bookings/tasks",
        icon: CheckSquare,
      },
    ],
  },
  {
    label: "إدارة المحتوى",
    icon: FileEdit,
    items: [
      {
        title: "الإدارة",
        href: "/dashboard/management",
        icon: SettingsIcon,
      },
      {
        title: "المحتوى",
        href: "/dashboard/content",
        icon: FileEdit,
      },
      {
        title: "النشر",
        href: "/dashboard/publishing",
        icon: Send,
      },
    ],
  },
  {
    label: "التواصل",
    icon: MessageCircle,
    items: [
      {
        title: "واتساب",
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
        title: "طوابير الرسائل",
        href: "/dashboard/queue",
        icon: SettingsIcon,
      },
    ],
  },
  {
    label: "الفرق",
    icon: Users,
    items: [
      {
        title: "التسويق الرقمي",
        href: "/dashboard/teams/digital-marketing",
        icon: Megaphone,
      },
      {
        title: "وحدة الإعلام",
        href: "/dashboard/teams/media",
        icon: Video,
      },
      {
        title: "التسويق الميداني",
        href: "/dashboard/teams/field-marketing",
        icon: MapPin,
      },
      {
        title: "خدمة العملاء",
        href: "/dashboard/teams/customer-service",
        icon: Headphones,
      },
    ],
  },
  {
    label: "التقارير والتحليلات",
    icon: BarChart3,
    items: [
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
    ],
  },
  {
    label: "الإدارة العامة",
    icon: SettingsIcon,
    items: [
      {
        title: "المستخدمين",
        href: "/dashboard/users",
        icon: Users,
      },
      {
        title: "الحملات والمشاريع",
        href: "/dashboard/projects",
        icon: Target,
      },
      {
        title: "المراجعة والاعتماد",
        href: "/dashboard/review-approval",
        icon: CheckSquare,
      },
    ],
  },
];

interface DashboardSidebarProps {
  currentPath: string;
}

export default function DashboardSidebar({ currentPath }: DashboardSidebarProps) {
  const [, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Auto-expand groups that contain the active page
  useEffect(() => {
    const newExpanded: Record<string, boolean> = {};
    navGroups.forEach(group => {
      const hasActive = group.items.some(item => {
        if (item.href === "/dashboard") return currentPath === "/dashboard";
        return currentPath === item.href || currentPath.startsWith(item.href + "/");
      });
      if (hasActive || group.defaultOpen) {
        newExpanded[group.label] = true;
      }
    });
    setExpandedGroups(prev => ({ ...prev, ...newExpanded }));
  }, [currentPath]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [currentPath]);

  // Close mobile sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    if (mobileOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const toggleGroup = useCallback((label: string) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const isItemActive = useCallback((item: NavItem) => {
    if (item.href === "/dashboard") {
      return currentPath === "/dashboard";
    }
    return currentPath === item.href || currentPath.startsWith(item.href + "/");
  }, [currentPath]);

  const handleNavClick = useCallback((href: string) => {
    setLocation(href);
    setMobileOpen(false);
  }, [setLocation]);

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = isItemActive(item);

    if (collapsed) {
      return (
        <Tooltip key={item.href} delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleNavClick(item.href)}
              className={cn(
                "w-full flex items-center justify-center h-9 rounded-md transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="font-medium text-xs">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <button
        key={item.href}
        onClick={() => handleNavClick(item.href)}
        className={cn(
          "w-full flex items-center gap-2.5 px-2.5 h-9 rounded-md text-[13px] transition-all duration-150",
          isActive
            ? "bg-primary/10 text-primary font-semibold nav-item-active"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{item.title}</span>
        {item.badge && item.badge > 0 && (
          <span className="mr-auto bg-destructive text-destructive-foreground text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  const renderNavGroup = (group: NavGroup, index: number) => {
    const isExpanded = expandedGroups[group.label] !== false;
    const hasActiveItem = group.items.some(item => isItemActive(item));
    const GroupIcon = group.icon;

    if (collapsed) {
      return (
        <div key={group.label} className="space-y-0.5">
          {index > 0 && <div className="border-t border-border/40 my-1.5 mx-1" />}
          {group.items.map(item => renderNavItem(item))}
        </div>
      );
    }

    return (
      <div key={group.label}>
        {index > 0 && <div className="border-t border-border/30 my-2 mx-2" />}
        {/* Group Header */}
        <button
          onClick={() => toggleGroup(group.label)}
          className={cn(
            "w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors rounded-md",
            hasActiveItem ? "text-primary" : "text-muted-foreground/60 hover:text-muted-foreground"
          )}
        >
          <GroupIcon className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
          <span className="flex-1 text-right">{group.label}</span>
          <ChevronDown className={cn(
            "h-3 w-3 transition-transform duration-200 opacity-50",
            !isExpanded && "-rotate-90"
          )} />
        </button>

        {/* Group Items with animation */}
        <div className={cn(
          "overflow-hidden transition-all duration-200",
          isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="space-y-0.5 pt-0.5">
            {group.items.map(item => renderNavItem(item))}
          </div>
        </div>
      </div>
    );
  };

  const sidebarContent = (
    <>
      {/* Logo Section */}
      <div className={cn(
        "flex items-center border-b border-border/40 flex-shrink-0",
        collapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"
      )}>
        <img
          src="/assets/new-logo.png"
          alt="المستشفى السعودي الألماني"
          className={cn(
            "object-contain flex-shrink-0 transition-all duration-300",
            collapsed ? "h-9 w-9" : "h-10"
          )}
        />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <h2 className="text-[13px] font-bold text-foreground leading-tight truncate">
              المستشفى السعودي الألماني
            </h2>
            <p className="text-[10px] text-muted-foreground/70 truncate">
              لوحة التحكم الإدارية
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className={cn("space-y-0", collapsed ? "px-1.5" : "px-2")}>
          {navGroups.map((group, index) => renderNavGroup(group, index))}
        </nav>
      </ScrollArea>

      {/* Collapse Toggle - Desktop Only */}
      <div className="hidden lg:flex border-t border-border/40 p-1.5 flex-shrink-0">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center gap-2 h-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-xs"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4" />
                  <span>طي القائمة</span>
                </>
              )}
            </button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="left" className="text-xs">
              توسيع القائمة
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-card border-l border-border/50 transition-all duration-300 h-screen sticky top-0",
          collapsed ? "w-[60px]" : "w-60"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 right-0 left-0 z-40 bg-card border-t border-border/50 safe-bottom">
        <div className="flex items-center justify-around px-1 py-1.5">
          <button
            onClick={() => handleNavClick("/dashboard")}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] transition-colors",
              currentPath === "/dashboard" ? "text-primary" : "text-muted-foreground"
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>الرئيسية</span>
          </button>
          <button
            onClick={() => handleNavClick("/dashboard/bookings/leads")}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] transition-colors",
              currentPath.includes("/bookings") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <UserCheck className="h-5 w-5" />
            <span>الحجوزات</span>
          </button>
          <button
            onClick={() => handleNavClick("/dashboard/reports")}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] transition-colors",
              currentPath.includes("/reports") || currentPath.includes("/analytics") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <BarChart3 className="h-5 w-5" />
            <span>التقارير</span>
          </button>
          <button
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] text-muted-foreground"
          >
            <Menu className="h-5 w-5" />
            <span>المزيد</span>
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 right-0 z-50 h-full w-[280px] bg-card border-l border-border/50 shadow-xl flex flex-col transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Mobile Close Button */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <button
            onClick={() => setMobileOpen(false)}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors"
            aria-label="إغلاق القائمة"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {sidebarContent}
      </aside>
    </>
  );
}
