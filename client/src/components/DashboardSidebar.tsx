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
  Menu,
  X,
  Home,
  ClipboardList,
  Search,
  HelpCircle,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback, useRef } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  hasDot?: boolean;
}

interface NavGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  defaultOpen?: boolean;
}

// العناصر الرئيسية التي تظهر دائماً في الشريط الضيق (مثل Meta Business Suite)
const primaryNavItems: NavItem[] = [
  {
    title: "الرئيسية",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "العملاء المحتملين",
    href: "/dashboard/bookings/leads",
    icon: UserCheck,
    hasDot: true,
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
  {
    title: "التقارير",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    title: "واتساب",
    href: "/dashboard/whatsapp",
    icon: MessageCircle,
  },
];

// جميع المجموعات للقائمة الموسعة "كل الأدوات"
const allToolsGroups: NavGroup[] = [
  {
    label: "إدارة الحجوزات",
    icon: ClipboardList,
    defaultOpen: true,
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [allToolsOpen, setAllToolsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const allToolsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-expand groups that contain the active page
  useEffect(() => {
    const newExpanded: Record<string, boolean> = {};
    allToolsGroups.forEach(group => {
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
    setAllToolsOpen(false);
  }, [currentPath]);

  // Close mobile sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (allToolsOpen) {
          setAllToolsOpen(false);
        } else {
          setMobileOpen(false);
        }
      }
    };
    if (mobileOpen || allToolsOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen, allToolsOpen]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Focus search input when all tools panel opens
  useEffect(() => {
    if (allToolsOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 200);
    } else {
      setSearchQuery("");
    }
  }, [allToolsOpen]);

  const toggleGroup = useCallback((label: string) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const isItemActive = useCallback((href: string) => {
    if (href === "/dashboard") {
      return currentPath === "/dashboard";
    }
    return currentPath === href || currentPath.startsWith(href + "/");
  }, [currentPath]);

  const handleNavClick = useCallback((href: string) => {
    setLocation(href);
    setMobileOpen(false);
    setAllToolsOpen(false);
  }, [setLocation]);

  // Filter items based on search query
  const filteredGroups = allToolsGroups.map(group => ({
    ...group,
    items: group.items.filter(item =>
      !searchQuery || item.title.includes(searchQuery)
    ),
  })).filter(group => group.items.length > 0);

  // ============================================
  // الشريط الضيق الرئيسي (Desktop) - بأسلوب Meta
  // ============================================
  const renderDesktopSlimSidebar = () => (
    <aside className="hidden lg:flex flex-col h-screen sticky top-0 w-[72px] bg-white border-l border-gray-200 z-30">
      {/* Logo */}
      <div className="flex items-center justify-center py-3 border-b border-gray-100">
        <img
          src="/assets/new-logo.png"
          alt="المستشفى السعودي الألماني"
          className="h-10 w-10 object-contain"
        />
      </div>

      {/* Primary Nav Items */}
      <ScrollArea className="flex-1 py-1">
        <nav className="flex flex-col items-center gap-0.5 px-1.5">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.href);
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleNavClick(item.href)}
                    className={cn(
                      "relative w-full flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg transition-all duration-150 group",
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    )}
                  >
                    <div className="relative">
                      <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                      {item.hasDot && (
                        <span className="absolute -top-0.5 -left-0.5 h-2 w-2 bg-red-500 rounded-full" />
                      )}
                    </div>
                    <span className={cn(
                      "text-[9px] leading-tight text-center max-w-full truncate",
                      isActive ? "font-bold" : "font-medium"
                    )}>
                      {item.title}
                    </span>
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-600 rounded-l-full" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="font-medium text-xs">
                  {item.title}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-0.5 px-1.5 py-2 border-t border-gray-100">
        {/* All Tools Button */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setAllToolsOpen(!allToolsOpen)}
              className={cn(
                "w-full flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg transition-all duration-150",
                allToolsOpen
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              )}
            >
              <Menu className="h-5 w-5" />
              <span className="text-[9px] font-medium">كل الأدوات</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">كل الأدوات</TooltipContent>
        </Tooltip>

        {/* Settings */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleNavClick("/dashboard/settings")}
              className={cn(
                "w-full flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg transition-all duration-150",
                isItemActive("/dashboard/settings")
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              )}
            >
              <SettingsIcon className="h-5 w-5" />
              <span className="text-[9px] font-medium">الإعدادات</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">الإعدادات</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );

  // ============================================
  // لوحة "كل الأدوات" الموسعة (Desktop)
  // ============================================
  const renderAllToolsPanel = () => (
    <>
      {/* Backdrop */}
      {allToolsOpen && (
        <div
          className="hidden lg:block fixed inset-0 z-40 bg-black/20"
          onClick={() => setAllToolsOpen(false)}
        />
      )}
      
      {/* Panel */}
      <div
        ref={allToolsRef}
        className={cn(
          "hidden lg:flex fixed top-0 right-[72px] z-50 h-screen w-[320px] bg-white border-l border-gray-200 shadow-xl flex-col transition-transform duration-300 ease-out",
          allToolsOpen ? "translate-x-0" : "translate-x-full opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">كل الأدوات</h2>
          <button
            onClick={() => setAllToolsOpen(false)}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="ابحث في كل الأدوات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pr-9 pl-3 rounded-full bg-gray-100 border-0 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Tools List */}
        <ScrollArea className="flex-1">
          <div className="py-2 px-3">
            {filteredGroups.map((group, index) => {
              const isExpanded = expandedGroups[group.label] !== false;
              const GroupIcon = group.icon;
              
              return (
                <div key={group.label}>
                  {index > 0 && <div className="border-t border-gray-100 my-2" />}
                  
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors rounded-md"
                  >
                    <span className="flex-1 text-right">{group.label}</span>
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200",
                      !isExpanded && "-rotate-90"
                    )} />
                  </button>

                  {/* Group Items */}
                  <div className={cn(
                    "overflow-hidden transition-all duration-200",
                    isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                  )}>
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = isItemActive(item.href);
                        return (
                          <button
                            key={item.href}
                            onClick={() => handleNavClick(item.href)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                              isActive
                                ? "bg-blue-50 text-blue-600 font-semibold"
                                : "text-gray-700 hover:bg-gray-50"
                            )}
                          >
                            <Icon className={cn("h-4.5 w-4.5 flex-shrink-0", isActive ? "text-blue-600" : "text-gray-400")} />
                            <span className="truncate">{item.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </>
  );

  // ============================================
  // Mobile Bottom Navigation Bar
  // ============================================
  const renderMobileBottomBar = () => (
    <div className="lg:hidden fixed bottom-0 right-0 left-0 z-40 bg-white border-t border-gray-200 safe-bottom">
      <div className="flex items-center justify-around px-1 py-1.5">
        <button
          onClick={() => handleNavClick("/dashboard")}
          className={cn(
            "flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] transition-colors min-w-[56px]",
            currentPath === "/dashboard" ? "text-blue-600" : "text-gray-500"
          )}
        >
          <Home className={cn("h-5 w-5", currentPath === "/dashboard" && "stroke-[2.5]")} />
          <span className={currentPath === "/dashboard" ? "font-bold" : "font-medium"}>الرئيسية</span>
        </button>
        <button
          onClick={() => handleNavClick("/dashboard/bookings/leads")}
          className={cn(
            "flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] transition-colors min-w-[56px]",
            currentPath.includes("/bookings") ? "text-blue-600" : "text-gray-500"
          )}
        >
          <UserCheck className={cn("h-5 w-5", currentPath.includes("/bookings") && "stroke-[2.5]")} />
          <span className={currentPath.includes("/bookings") ? "font-bold" : "font-medium"}>الحجوزات</span>
        </button>
        <button
          onClick={() => handleNavClick("/dashboard/reports")}
          className={cn(
            "flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] transition-colors min-w-[56px]",
            currentPath.includes("/reports") || currentPath.includes("/analytics") ? "text-blue-600" : "text-gray-500"
          )}
        >
          <BarChart3 className={cn("h-5 w-5", (currentPath.includes("/reports") || currentPath.includes("/analytics")) && "stroke-[2.5]")} />
          <span className={(currentPath.includes("/reports") || currentPath.includes("/analytics")) ? "font-bold" : "font-medium"}>التقارير</span>
        </button>
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] text-gray-500 min-w-[56px]"
        >
          <Menu className="h-5 w-5" />
          <span className="font-medium">المزيد</span>
        </button>
      </div>
    </div>
  );

  // ============================================
  // Mobile Full Sidebar (slide from right)
  // ============================================
  const renderMobileSidebar = () => (
    <>
      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 right-0 z-50 h-full w-[300px] bg-white shadow-xl flex flex-col transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img
              src="/assets/new-logo.png"
              alt="المستشفى السعودي الألماني"
              className="h-9 w-9 object-contain"
            />
            <div>
              <h2 className="text-sm font-bold text-gray-900">المستشفى السعودي الألماني</h2>
              <p className="text-[10px] text-gray-400">لوحة التحكم</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
            aria-label="إغلاق القائمة"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2.5">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pr-9 pl-3 rounded-full bg-gray-100 border-0 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="py-1 px-3">
            {/* Dashboard Home */}
            <button
              onClick={() => handleNavClick("/dashboard")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 mb-1",
                currentPath === "/dashboard"
                  ? "bg-blue-50 text-blue-600 font-semibold"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <Home className={cn("h-5 w-5 flex-shrink-0", currentPath === "/dashboard" ? "text-blue-600" : "text-gray-400")} />
              <span>الرئيسية</span>
            </button>

            {/* Groups */}
            {(searchQuery ? filteredGroups : allToolsGroups).map((group, index) => {
              const isExpanded = expandedGroups[group.label] !== false;
              const hasActiveItem = group.items.some(item => isItemActive(item.href));

              return (
                <div key={group.label}>
                  {<div className="border-t border-gray-100 my-1.5" />}
                  
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors rounded-md",
                      hasActiveItem ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    <span className="flex-1 text-right">{group.label}</span>
                    <ChevronDown className={cn(
                      "h-3 w-3 transition-transform duration-200",
                      !isExpanded && "-rotate-90"
                    )} />
                  </button>

                  <div className={cn(
                    "overflow-hidden transition-all duration-200",
                    isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                  )}>
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = isItemActive(item.href);
                        return (
                          <button
                            key={item.href}
                            onClick={() => handleNavClick(item.href)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                              isActive
                                ? "bg-blue-50 text-blue-600 font-semibold"
                                : "text-gray-700 hover:bg-gray-50"
                            )}
                          >
                            <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-blue-600" : "text-gray-400")} />
                            <span className="truncate">{item.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Bottom Actions */}
        <div className="border-t border-gray-100 p-3 flex items-center gap-2">
          <button
            onClick={() => handleNavClick("/dashboard/settings")}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <SettingsIcon className="h-4 w-4" />
            <span>الإعدادات</span>
          </button>
        </div>
      </aside>
    </>
  );

  return (
    <>
      {renderDesktopSlimSidebar()}
      {renderAllToolsPanel()}
      {renderMobileBottomBar()}
      {renderMobileSidebar()}
    </>
  );
}
