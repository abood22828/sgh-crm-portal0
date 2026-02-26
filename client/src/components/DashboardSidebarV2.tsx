import { useAuth } from "@/_core/hooks/useAuth";
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
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useRecentlyUsed } from "@/hooks/useRecentlyUsed";
import AllToolsDrawer from "./AllToolsDrawer";
import EditSidebarModal from "./EditSidebarModal";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  hasDot?: boolean;
  id: string;
}

export interface NavGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

// جميع العناصر المتاحة
const allNavItems: NavItem[] = [
  { id: "home", title: "الرئيسية", href: "/dashboard", icon: Home },
  { id: "leads", title: "العملاء المحتملين", href: "/dashboard/bookings/leads", icon: UserCheck, hasDot: true },
  { id: "appointments", title: "مواعيد الأطباء", href: "/dashboard/bookings/appointments", icon: Calendar },
  { id: "offer-leads", title: "عروض العملاء", href: "/dashboard/bookings/offer-leads", icon: Gift },
  { id: "camp-registrations", title: "تسجيلات المخيمات", href: "/dashboard/bookings/camp-registrations", icon: Tent },
  { id: "customers", title: "ملفات العملاء", href: "/dashboard/bookings/customers", icon: Contact },
  { id: "tasks", title: "المهام", href: "/dashboard/bookings/tasks", icon: CheckSquare },
  { id: "reports", title: "التقارير", href: "/dashboard/reports", icon: FileText },
  { id: "analytics", title: "التحليلات", href: "/dashboard/analytics", icon: BarChart3 },
  { id: "whatsapp", title: "واتساب", href: "/dashboard/whatsapp", icon: MessageCircle },
  { id: "messages", title: "الرسائل", href: "/dashboard/messages", icon: MessageSquare },
  { id: "message-settings", title: "إعدادات الرسائل", href: "/dashboard/message-settings", icon: SettingsIcon },
  { id: "queue", title: "طوابير الرسائل", href: "/dashboard/queue", icon: ClipboardList },
  { id: "management", title: "الإدارة", href: "/dashboard/management", icon: SettingsIcon },
  { id: "content", title: "المحتوى", href: "/dashboard/content", icon: FileEdit },
  { id: "publishing", title: "النشر", href: "/dashboard/publishing", icon: Send },
  { id: "digital-marketing", title: "التسويق الرقمي", href: "/dashboard/teams/digital-marketing", icon: Megaphone },
  { id: "media", title: "وحدة الإعلام", href: "/dashboard/teams/media", icon: Video },
  { id: "field-marketing", title: "التسويق الميداني", href: "/dashboard/teams/field-marketing", icon: MapPin },
  { id: "customer-service", title: "خدمة العملاء", href: "/dashboard/teams/customer-service", icon: Headphones },
  { id: "users", title: "المستخدمين", href: "/dashboard/users", icon: Users },
  { id: "campaigns", title: "الحملات والمشاريع", href: "/dashboard/campaigns", icon: Target },
  { id: "review-approval", title: "المراجعة والاعتماد", href: "/dashboard/review-approval", icon: CheckSquare },
];

// المجموعات لعرضها في لوحة كل الأدوات
const allToolsGroups: NavGroup[] = [
  {
    label: "إدارة الحجوزات",
    icon: ClipboardList,
    items: [
      { id: "leads", title: "العملاء المحتملين", href: "/dashboard/bookings/leads", icon: UserCheck },
      { id: "appointments", title: "مواعيد الأطباء", href: "/dashboard/bookings/appointments", icon: Calendar },
      { id: "offer-leads", title: "عروض العملاء", href: "/dashboard/bookings/offer-leads", icon: Gift },
      { id: "camp-registrations", title: "تسجيلات المخيمات", href: "/dashboard/bookings/camp-registrations", icon: Tent },
      { id: "customers", title: "ملفات العملاء", href: "/dashboard/bookings/customers", icon: Contact },
      { id: "tasks", title: "المهام", href: "/dashboard/bookings/tasks", icon: CheckSquare },
    ],
  },
  {
    label: "إدارة المحتوى",
    icon: FileEdit,
    items: [
      { id: "management", title: "الإدارة", href: "/dashboard/management", icon: SettingsIcon },
      { id: "content", title: "المحتوى", href: "/dashboard/content", icon: FileEdit },
      { id: "publishing", title: "النشر", href: "/dashboard/publishing", icon: Send },
    ],
  },
  {
    label: "التواصل",
    icon: MessageCircle,
    items: [
      { id: "whatsapp", title: "واتساب", href: "/dashboard/whatsapp", icon: MessageCircle },
      { id: "messages", title: "الرسائل", href: "/dashboard/messages", icon: MessageSquare },
      { id: "message-settings", title: "إعدادات الرسائل", href: "/dashboard/message-settings", icon: SettingsIcon },
      { id: "queue", title: "طوابير الرسائل", href: "/dashboard/queue", icon: ClipboardList },
    ],
  },
  {
    label: "الفرق",
    icon: Users,
    items: [
      { id: "digital-marketing", title: "التسويق الرقمي", href: "/dashboard/teams/digital-marketing", icon: Megaphone },
      { id: "media", title: "وحدة الإعلام", href: "/dashboard/teams/media", icon: Video },
      { id: "field-marketing", title: "التسويق الميداني", href: "/dashboard/teams/field-marketing", icon: MapPin },
      { id: "customer-service", title: "خدمة العملاء", href: "/dashboard/teams/customer-service", icon: Headphones },
    ],
  },
  {
    label: "التقارير والتحليلات",
    icon: BarChart3,
    items: [
      { id: "reports", title: "التقارير", href: "/dashboard/reports", icon: FileText },
      { id: "analytics", title: "التحليلات", href: "/dashboard/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "الإدارة العامة",
    icon: SettingsIcon,
    items: [
      { id: "users", title: "المستخدمين", href: "/dashboard/users", icon: Users },
      { id: "campaigns", title: "الحملات والمشاريع", href: "/dashboard/campaigns", icon: Target },
      { id: "review-approval", title: "المراجعة والاعتماد", href: "/dashboard/review-approval", icon: CheckSquare },
    ],
  },
];

// Badge Component
function SidebarBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute -top-1 -left-1 h-4 w-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export default function DashboardSidebarV2({ currentPath }: { currentPath: string }) {
  const { user } = useAuth();
  const {
    shouldShowText,
    isHomePage,
    handleMouseEnter,
    handleMouseLeave,
    isMobileOpen,
    toggleMobile,
    closeMobile,
  } = useSidebarState();
  
  const { recentlyUsed, addRecentlyUsed } = useRecentlyUsed();
  const [allToolsOpen, setAllToolsOpen] = useState(false);
  const [editSidebarOpen, setEditSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // TODO: إضافة procedure للحصول على عدد الإشعارات
  // const { data: unreadCounts } = trpc.leads.getUnreadCounts.useQuery(undefined, {
  //   refetchInterval: 30000,
  // });
  const unreadCounts = { leads: 0, appointments: 0, offerLeads: 0, campRegistrations: 0 };

  // تحديد العناصر المرئية في الشريط (أول 10 عناصر)
  const [visibleItemIds, setVisibleItemIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("sidebar_visible_items");
      if (stored) {
        const parsed = JSON.parse(stored);
        // التأكد من أن "home" موجود دائماً في البداية
        if (!parsed.includes("home")) {
          return ["home", ...parsed.slice(0, 9)];
        }
        return parsed.slice(0, 10);
      }
    } catch (error) {
      console.error("[Sidebar] Error loading visible items:", error);
    }
    // القيم الافتراضية
    return ["home", "leads", "appointments", "offer-leads", "camp-registrations", "customers", "tasks", "reports", "whatsapp", "management"];
  });

  // حفظ العناصر المرئية في localStorage
  useEffect(() => {
    try {
      localStorage.setItem("sidebar_visible_items", JSON.stringify(visibleItemIds));
    } catch (error) {
      console.error("[Sidebar] Error saving visible items:", error);
    }
  }, [visibleItemIds]);

  // الحصول على العناصر المرئية
  const primaryNavItems = useMemo(() => {
    return visibleItemIds
      .map(id => allNavItems.find(item => item.id === id))
      .filter((item): item is NavItem => item !== undefined);
  }, [visibleItemIds]);

  // التحقق من أن العنصر نشط
  const isItemActive = useCallback((href: string) => {
    if (href === "/dashboard") {
      return currentPath === "/dashboard" || currentPath === "/dashboard/";
    }
    return currentPath.startsWith(href);
  }, [currentPath]);

  // الحصول على عدد الإشعارات لعنصر معين
  const getBadgeCount = useCallback((itemId: string) => {
    if (!unreadCounts) return 0;
    switch (itemId) {
      case "leads":
        return unreadCounts.leads || 0;
      case "appointments":
        return unreadCounts.appointments || 0;
      case "offer-leads":
        return unreadCounts.offerLeads || 0;
      case "camp-registrations":
        return unreadCounts.campRegistrations || 0;
      default:
        return 0;
    }
  }, [unreadCounts]);

  // معالج النقر على عنصر التنقل
  const handleNavClick = useCallback((href: string) => {
    const item = allNavItems.find(i => i.href === href);
    if (item) {
      addRecentlyUsed({ id: item.id, title: item.title, href: item.href });
    }
    window.location.href = href;
    closeMobile();
    setAllToolsOpen(false);
  }, [addRecentlyUsed, closeMobile]);

  // ============================================
  // الشريط الجانبي الديناميكي (Desktop) - Meta Business Suite Style
  // ============================================
  const renderDesktopSidebar = () => (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 bg-white dark:bg-gray-900 border-l border-border dark:border-gray-700 z-30 transition-all duration-300 ease-in-out",
        shouldShowText ? "w-64" : "w-[72px]"
      )}
      dir="rtl"
    >
      {/* Logo + Hospital Name */}
      <div className="flex items-center gap-3 py-3 px-3 border-b border-gray-100 dark:border-gray-700">
        <img
          src="/icon-72x72.png"
          alt="المستشفى السعودي الألماني"
          className="h-10 w-10 object-contain flex-shrink-0"
        />
        {shouldShowText && (
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-foreground dark:text-gray-100 truncate">
              المستشفى السعودي الألماني
            </h2>
            <p className="text-xs text-muted-foreground dark:text-gray-400 truncate">
              صنعاء
            </p>
          </div>
        )}
      </div>

      {/* Primary Nav Items */}
      <ScrollArea className="flex-1 py-2">
        <nav className="flex flex-col gap-1 px-2">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.href);
            const badgeCount = getBadgeCount(item.id);

            return (
              <Tooltip key={item.href} delayDuration={shouldShowText ? 999999 : 300}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleNavClick(item.href)}
                    className={cn(
                      "relative w-full flex items-center gap-3 py-3 rounded-lg transition-all duration-200",
                      shouldShowText ? "px-3" : "px-0 justify-center",
                      isActive
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        : "text-foreground hover:bg-muted/50 dark:text-gray-300 dark:hover:bg-gray-800"
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <Icon className={cn(
                        "transition-all duration-200",
                        shouldShowText ? "h-5 w-5" : "h-6 w-6",
                        isActive && "stroke-[2.5]"
                      )} />
                      <SidebarBadge count={badgeCount} />
                      {!badgeCount && item.hasDot && (
                        <span className="absolute -top-0.5 -left-0.5 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    {shouldShowText && (
                      <span className={cn(
                        "text-sm truncate flex-1 text-right transition-opacity duration-200",
                        isActive ? "font-semibold" : "font-medium"
                      )}>
                        {item.title}
                      </span>
                    )}
                    {shouldShowText && badgeCount > 0 && (
                      <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full flex-shrink-0">
                        {badgeCount}
                      </span>
                    )}
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-l-full" />
                    )}
                  </button>
                </TooltipTrigger>
                {!shouldShowText && (
                  <TooltipContent side="left" className="font-medium">
                    {item.title}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}

          {/* كل الأدوات و تعديل - أسفل العناصر مباشرة */}
          <div className="border-t border-gray-100 dark:border-gray-700 my-2 pt-2">
            {/* كل الأدوات */}
            <Tooltip delayDuration={shouldShowText ? 999999 : 300}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setAllToolsOpen(!allToolsOpen)}
                  className={cn(
                    "w-full flex items-center gap-3 py-3 rounded-lg transition-all duration-200 mb-1",
                    shouldShowText ? "px-3" : "px-0 justify-center",
                    allToolsOpen
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-foreground hover:bg-muted/50 dark:text-gray-300 dark:hover:bg-gray-800"
                  )}
                >
                  <Menu className={cn(
                    "flex-shrink-0 transition-all duration-200",
                    shouldShowText ? "h-5 w-5" : "h-6 w-6"
                  )} />
                  {shouldShowText && (
                    <span className="text-sm font-medium truncate flex-1 text-right">
                      كل الأدوات
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              {!shouldShowText && (
                <TooltipContent side="left">كل الأدوات</TooltipContent>
              )}
            </Tooltip>

            {/* تعديل */}
            <Tooltip delayDuration={shouldShowText ? 999999 : 300}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setEditSidebarOpen(true)}
                  className={cn(
                    "w-full flex items-center gap-3 py-3 rounded-lg transition-all duration-200",
                    shouldShowText ? "px-3" : "px-0 justify-center",
                    "text-foreground hover:bg-muted/50 dark:text-gray-300 dark:hover:bg-gray-800"
                  )}
                >
                  <Pencil className={cn(
                    "flex-shrink-0 transition-all duration-200",
                    shouldShowText ? "h-5 w-5" : "h-6 w-6"
                  )} />
                  {shouldShowText && (
                    <span className="text-sm font-medium truncate flex-1 text-right">
                      تعديل
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              {!shouldShowText && (
                <TooltipContent side="left">تعديل الشريط</TooltipContent>
              )}
            </Tooltip>
          </div>
        </nav>
      </ScrollArea>

      {/* Bottom Actions - الإعدادات والمساعدة */}
      <div className="flex flex-col gap-1 px-2 py-2 border-t border-gray-100 dark:border-gray-700">
        {/* الإعدادات */}
        <Tooltip delayDuration={shouldShowText ? 999999 : 300}>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleNavClick("/dashboard/settings")}
              className={cn(
                "w-full flex items-center gap-3 py-3 rounded-lg transition-all duration-200",
                shouldShowText ? "px-3" : "px-0 justify-center",
                isItemActive("/dashboard/settings")
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-foreground hover:bg-muted/50 dark:text-gray-300 dark:hover:bg-gray-800"
              )}
            >
              <SettingsIcon className={cn(
                "flex-shrink-0 transition-all duration-200",
                shouldShowText ? "h-5 w-5" : "h-6 w-6"
              )} />
              {shouldShowText && (
                <span className="text-sm font-medium truncate flex-1 text-right">
                  الإعدادات
                </span>
              )}
            </button>
          </TooltipTrigger>
          {!shouldShowText && (
            <TooltipContent side="left">الإعدادات</TooltipContent>
          )}
        </Tooltip>

        {/* المساعدة */}
        <Tooltip delayDuration={shouldShowText ? 999999 : 300}>
          <TooltipTrigger asChild>
            <button
              onClick={() => {/* TODO: فتح المساعدة */}}
              className={cn(
                "w-full flex items-center gap-3 py-3 rounded-lg transition-all duration-200",
                shouldShowText ? "px-3" : "px-0 justify-center",
                "text-foreground hover:bg-muted/50 dark:text-gray-300 dark:hover:bg-gray-800"
              )}
            >
              <HelpCircle className={cn(
                "flex-shrink-0 transition-all duration-200",
                shouldShowText ? "h-5 w-5" : "h-6 w-6"
              )} />
              {shouldShowText && (
                <span className="text-sm font-medium truncate flex-1 text-right">
                  المساعدة
                </span>
              )}
            </button>
          </TooltipTrigger>
          {!shouldShowText && (
            <TooltipContent side="left">المساعدة</TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );

  // ============================================
  // الشريط السفلي للهاتف (Mobile Bottom Navigation)
  // ============================================
  
  // أهم 5 أقسام للشريط السفلي
  const bottomNavItems: NavItem[] = useMemo(() => [
    { id: "home", title: "الرئيسية", href: "/dashboard", icon: Home },
    { id: "leads", title: "العملاء", href: "/dashboard/bookings/leads", icon: UserCheck, hasDot: true },
    { id: "appointments", title: "المواعيد", href: "/dashboard/bookings/appointments", icon: Calendar },
    { id: "reports", title: "التقارير", href: "/dashboard/reports", icon: FileText },
  ], []);

  const renderMobileBottomNav = () => (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-t border-border dark:border-gray-700 z-40 safe-area-inset-bottom" dir="rtl">
        <div className="h-full flex items-center justify-around px-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.href);
            const badgeCount = getBadgeCount(item.id);

            return (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-[60px]",
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground dark:text-gray-400"
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    "h-6 w-6",
                    isActive && "stroke-[2.5]"
                  )} />
                  <SidebarBadge count={badgeCount} />
                  {!badgeCount && item.hasDot && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] truncate max-w-[60px]",
                  isActive ? "font-semibold" : "font-medium"
                )}>
                  {item.title}
                </span>
              </button>
            );
          })}

          {/* زر المزيد */}
          <button
            onClick={() => setAllToolsOpen(true)}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 text-muted-foreground dark:text-gray-400 min-w-[60px]"
          >
            <MoreHorizontal className="h-6 w-6" />
            <span className="text-[10px] font-medium">المزيد</span>
          </button>
        </div>
      </nav>
    </>
  );

  // معالج حفظ تعديلات الشريط
  const handleSaveVisibleItems = useCallback((newVisibleIds: string[]) => {
    setVisibleItemIds(newVisibleIds);
  }, []);

  return (
    <>
      {renderDesktopSidebar()}
      {renderMobileBottomNav()}
      <AllToolsDrawer
        isOpen={allToolsOpen}
        onClose={() => setAllToolsOpen(false)}
        allToolsGroups={allToolsGroups}
        allNavItems={allNavItems}
      />
      <EditSidebarModal
        isOpen={editSidebarOpen}
        onClose={() => setEditSidebarOpen(false)}
        allToolsGroups={allToolsGroups}
        visibleItemIds={visibleItemIds}
        onSave={handleSaveVisibleItems}
      />
    </>
  );
}
