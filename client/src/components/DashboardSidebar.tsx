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
  ChevronDown,
  FileEdit,
  Users,
  Calendar,
  Briefcase,
  CheckSquare,
  Target,
  Megaphone,
  Video,
  MapPin,
  Headphones,
  UserCheck,
  Gift,
  Tent,
  ClipboardList,
  Contact
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
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
    children: [
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
    title: "طوابير الرسائل",
    href: "/dashboard/queue",
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Auto-expand groups that contain the active page
  useEffect(() => {
    navItems.forEach(item => {
      if (item.children) {
        const isChildActive = item.children.some(child => 
          currentPath === child.href || currentPath.startsWith(child.href)
        );
        const isParentActive = currentPath === item.href;
        if (isChildActive || isParentActive) {
          setExpandedGroups(prev => ({ ...prev, [item.href]: true }));
        }
      }
    });
  }, [currentPath]);

  const toggleGroup = (href: string) => {
    setExpandedGroups(prev => ({ ...prev, [href]: !prev[href] }));
  };

  const isItemActive = (item: NavItem) => {
    if (item.children) {
      return currentPath === item.href || item.children.some(child => 
        currentPath === child.href || currentPath.startsWith(child.href)
      );
    }
    return currentPath === item.href || 
      (item.href !== "/dashboard" && currentPath.startsWith(item.href));
  };

  const renderNavItem = (item: NavItem, isChild = false) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isActive = isItemActive(item);
    const isExpanded = expandedGroups[item.href];

    if (hasChildren) {
      return (
        <div key={item.href}>
          <Button
            variant={isActive && !isChild ? "default" : "ghost"}
            className={cn(
              "w-full justify-start gap-3",
              collapsed && "justify-center px-2"
            )}
            onClick={() => {
              if (collapsed) {
                setCollapsed(false);
                setExpandedGroups(prev => ({ ...prev, [item.href]: true }));
              } else {
                toggleGroup(item.href);
              }
            }}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-right">{item.title}</span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "rotate-180"
                )} />
              </>
            )}
          </Button>
          {!collapsed && isExpanded && (
            <div className="mr-4 mt-1 space-y-1 border-r-2 border-muted pr-2">
              {item.children!.map(child => {
                const ChildIcon = child.icon;
                const childActive = currentPath === child.href || currentPath.startsWith(child.href);
                return (
                  <Button
                    key={child.href}
                    variant={childActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2 h-9 text-sm",
                      childActive && "bg-accent font-medium"
                    )}
                    onClick={() => setLocation(child.href)}
                  >
                    <ChildIcon className="h-4 w-4 flex-shrink-0" />
                    <span>{child.title}</span>
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Button
        key={item.href}
        variant={isActive ? "default" : "ghost"}
        className={cn(
          "w-full justify-start gap-3",
          collapsed && "justify-center px-2",
          isChild && "h-9 text-sm"
        )}
        onClick={() => setLocation(item.href)}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && <span>{item.title}</span>}
      </Button>
    );
  };

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
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => renderNavItem(item))}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation - show all items flat */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 overflow-x-auto">
        <div className="flex gap-1 p-2 min-w-max">
          {navItems.flatMap((item) => {
            if (item.children) {
              return item.children.map(child => {
                const ChildIcon = child.icon;
                const childActive = currentPath === child.href || currentPath.startsWith(child.href);
                return (
                  <Button
                    key={child.href}
                    variant={childActive ? "default" : "ghost"}
                    className="flex-col h-auto py-2 px-3 min-w-[80px]"
                    onClick={() => setLocation(child.href)}
                  >
                    <ChildIcon className="h-5 w-5 mb-1 flex-shrink-0" />
                    <span className="text-xs whitespace-nowrap">{child.title}</span>
                  </Button>
                );
              });
            }
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
