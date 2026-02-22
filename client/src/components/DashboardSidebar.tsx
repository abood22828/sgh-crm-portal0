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
  Pencil,
  GripVertical,
  Check,
  Volume2,
  VolumeX,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  hasDot?: boolean;
  id: string; // unique identifier for customization
}

interface NavGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  defaultOpen?: boolean;
}

// جميع العناصر المتاحة للشريط الضيق
const allNavItems: NavItem[] = [
  {
    id: "home",
    title: "الرئيسية",
    href: "/dashboard",
    icon: Home,
  },
  {
    id: "leads",
    title: "العملاء المحتملين",
    href: "/dashboard/bookings/leads",
    icon: UserCheck,
    hasDot: true,
  },
  {
    id: "appointments",
    title: "مواعيد الأطباء",
    href: "/dashboard/bookings/appointments",
    icon: Calendar,
  },
  {
    id: "offer-leads",
    title: "عروض العملاء",
    href: "/dashboard/bookings/offer-leads",
    icon: Gift,
  },
  {
    id: "camp-registrations",
    title: "تسجيلات المخيمات",
    href: "/dashboard/bookings/camp-registrations",
    icon: Tent,
  },
  {
    id: "customers",
    title: "ملفات العملاء",
    href: "/dashboard/bookings/customers",
    icon: Contact,
  },
  {
    id: "tasks",
    title: "المهام",
    href: "/dashboard/bookings/tasks",
    icon: CheckSquare,
  },
  {
    id: "reports",
    title: "التقارير",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    id: "whatsapp",
    title: "واتساب",
    href: "/dashboard/whatsapp",
    icon: MessageCircle,
  },
  {
    id: "management",
    title: "الإدارة",
    href: "/dashboard/management",
    icon: SettingsIcon,
  },
  {
    id: "content",
    title: "المحتوى",
    href: "/dashboard/content",
    icon: FileEdit,
  },
  {
    id: "publishing",
    title: "النشر",
    href: "/dashboard/publishing",
    icon: Send,
  },
  {
    id: "messages",
    title: "الرسائل",
    href: "/dashboard/messages",
    icon: MessageSquare,
  },
  {
    id: "analytics",
    title: "التحليلات",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
];

// العناصر الافتراضية المعروضة في الشريط الضيق
const DEFAULT_VISIBLE_IDS = [
  "home", "leads", "appointments", "offer-leads", "camp-registrations",
  "customers", "tasks", "reports", "whatsapp"
];

const STORAGE_KEY = "sgh-sidebar-visible-items";

function getVisibleItemIds(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_VISIBLE_IDS;
}

function saveVisibleItemIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

// جميع المجموعات للقائمة الموسعة "كل الأدوات"
const allToolsGroups: NavGroup[] = [
  {
    label: "إدارة الحجوزات",
    icon: ClipboardList,
    defaultOpen: true,
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
      { id: "queue", title: "طوابير الرسائل", href: "/dashboard/queue", icon: SettingsIcon },
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
      { id: "projects", title: "الحملات والمشاريع", href: "/dashboard/projects", icon: Target },
      { id: "review-approval", title: "المراجعة والاعتماد", href: "/dashboard/review-approval", icon: CheckSquare },
    ],
  },
];

// ============================================
// مكون عنصر قابل للسحب (Sortable Item)
// ============================================
function SortableEditItem({
  item,
  isChecked,
  isHome,
  onToggle,
}: {
  item: NavItem;
  isChecked: boolean;
  isHome: boolean;
  onToggle: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  const Icon = item.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-all duration-150 mb-0.5 select-none",
        isChecked ? "bg-blue-50 text-blue-700" : "text-muted-foreground hover:bg-muted/50",
        isHome && "opacity-60",
        isDragging && "shadow-lg ring-2 ring-blue-300 bg-white dark:bg-card"
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className={cn(
          "flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted/60 text-muted-foreground hover:text-muted-foreground touch-none",
          isHome && "invisible"
        )}
        tabIndex={-1}
        aria-label="اسحب لإعادة الترتيب"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Checkbox */}
      <button
        onClick={() => !isHome && onToggle(item.id)}
        className={cn(
          "h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
          isChecked ? "bg-blue-600 border-blue-600" : "border-border",
          isHome ? "cursor-not-allowed" : "cursor-pointer"
        )}
      >
        {isChecked && <Check className="h-3 w-3 text-white" />}
      </button>

      {/* Icon & Label */}
      <button
        onClick={() => !isHome && onToggle(item.id)}
        className={cn(
          "flex items-center gap-2 flex-1 min-w-0",
          isHome ? "cursor-not-allowed" : "cursor-pointer"
        )}
      >
        <Icon className={cn("h-4 w-4 flex-shrink-0", isChecked ? "text-blue-600" : "text-muted-foreground")} />
        <span className="truncate">{item.title}</span>
      </button>

      {isHome && <span className="text-[10px] text-muted-foreground flex-shrink-0">(ثابت)</span>}
    </div>
  );
}

interface DashboardSidebarProps {
  currentPath: string;
}

// Badge component for sidebar icons with pulse animation
function SidebarBadge({ count, className }: { count: number; className?: string }) {
  const prevCountRef = useRef(count);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    if (count > prevCountRef.current && prevCountRef.current >= 0) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 600);
      prevCountRef.current = count;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = count;
  }, [count]);

  if (!count || count <= 0) return null;
  const display = count > 99 ? '99+' : String(count);
  return (
    <span
      className={cn(
        "absolute flex items-center justify-center rounded-full bg-red-500 text-white font-bold shadow-sm border border-white transition-transform duration-300",
        count > 99 ? "min-w-[18px] h-[14px] text-[7px] px-0.5 -top-1 -left-1.5" :
        count > 9 ? "min-w-[16px] h-[14px] text-[7px] px-0.5 -top-1 -left-1" :
        "h-[14px] w-[14px] text-[7px] -top-0.5 -left-0.5",
        isPulsing && "badge-pulse",
        className
      )}
    >
      {display}
    </span>
  );
}

export default function DashboardSidebar({ currentPath }: DashboardSidebarProps) {
  const [, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [allToolsOpen, setAllToolsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleItemIds, setVisibleItemIds] = useState<string[]>(getVisibleItemIds);
  const [editingItemIds, setEditingItemIds] = useState<string[]>([]);
  const allToolsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Notification sound for new WhatsApp messages
  const { soundEnabled, toggleSound } = useNotificationSound();
  
  // Theme toggle
  const { theme, toggleTheme } = useTheme();

  // Fetch sidebar badge counts (auto-refresh every 60 seconds)
  const { data: badgeCounts } = trpc.sidebarBadges.useQuery(undefined, {
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
    retry: 1,
  });

  // Map nav item IDs to their badge counts
  const getBadgeCount = useCallback((itemId: string): number => {
    if (!badgeCounts) return 0;
    const mapping: Record<string, number> = {
      leads: badgeCounts.leads,
      tasks: badgeCounts.tasks,
      whatsapp: badgeCounts.whatsapp,
      management: badgeCounts.management,
    };
    return mapping[itemId] || 0;
  }, [badgeCounts]);

  // العناصر الرئيسية المعروضة في الشريط الضيق
  const primaryNavItems = useMemo(() => {
    return visibleItemIds
      .map(id => allNavItems.find(item => item.id === id))
      .filter(Boolean) as NavItem[];
  }, [visibleItemIds]);

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
        if (editMode) {
          setEditMode(false);
        } else if (allToolsOpen) {
          setAllToolsOpen(false);
        } else {
          setMobileOpen(false);
        }
      }
    };
    if (mobileOpen || allToolsOpen || editMode) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen, allToolsOpen, editMode]);

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
    if (allToolsOpen && searchInputRef.current && !editMode) {
      setTimeout(() => searchInputRef.current?.focus(), 200);
    } else if (!allToolsOpen) {
      setSearchQuery("");
      setEditMode(false);
    }
  }, [allToolsOpen, editMode]);

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
    setEditMode(false);
  }, [setLocation]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Edit mode: combined list of checked (ordered) + unchecked items
  const editOrderedItems = useMemo(() => {
    const checkedItems = editingItemIds
      .map(id => allNavItems.find(item => item.id === id))
      .filter(Boolean) as NavItem[];
    const uncheckedItems = allNavItems.filter(item => !editingItemIds.includes(item.id));
    return [...checkedItems, ...uncheckedItems];
  }, [editingItemIds]);

  // Edit mode handlers
  const startEditMode = useCallback(() => {
    setEditingItemIds([...visibleItemIds]);
    setEditMode(true);
  }, [visibleItemIds]);

  const cancelEditMode = useCallback(() => {
    setEditMode(false);
    setEditingItemIds([]);
  }, []);

  const saveEditMode = useCallback(() => {
    setVisibleItemIds(editingItemIds);
    saveVisibleItemIds(editingItemIds);
    setEditMode(false);
    setEditingItemIds([]);
  }, [editingItemIds]);

  const toggleEditItem = useCallback((id: string) => {
    setEditingItemIds(prev => {
      if (prev.includes(id)) {
        if (id === "home") return prev;
        return prev.filter(i => i !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setEditingItemIds(prev => {
      // Only reorder within checked items
      const activeId = active.id as string;
      const overId = over.id as string;

      // Both must be in editingItemIds (checked)
      const oldIndex = prev.indexOf(activeId);
      const newIndex = prev.indexOf(overId);

      if (oldIndex === -1 || newIndex === -1) return prev;
      // Don't allow moving "home" from first position
      if (activeId === "home" || (newIndex === 0 && prev[0] === "home")) {
        // Allow moving home only within checked, but keep it first
        if (activeId === "home") return prev;
        // If trying to move something to index 0 where home is, put it at index 1
        if (newIndex === 0) {
          const withoutActive = prev.filter(id => id !== activeId);
          withoutActive.splice(1, 0, activeId);
          return withoutActive;
        }
      }
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

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
    <aside className="hidden lg:flex flex-col h-screen sticky top-0 w-[60px] bg-white dark:bg-card dark:bg-gray-900 border-l border-border dark:border-gray-700 z-30">
      {/* Logo */}
      <div className="flex items-center justify-center py-2 border-b border-gray-100 dark:border-gray-700">
        <img
          src="/assets/new-logo.png"
          alt="المستشفى السعودي الألماني"
          className="h-8 w-8 object-contain"
        />
      </div>

      {/* Primary Nav Items */}
      <ScrollArea className="flex-1 py-0.5">
        <nav className="flex flex-col items-center gap-0 px-1">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.href);
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleNavClick(item.href)}
                    className={cn(
                      "relative w-full flex flex-col items-center gap-0 py-1.5 px-0.5 rounded-md transition-all duration-150 group",
                      isActive
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground dark:text-muted-foreground dark:hover:bg-gray-800 dark:hover:text-gray-300"
                    )}
                  >
                    <div className="relative">
                      <Icon className={cn("h-[18px] w-[18px]", isActive && "stroke-[2.5]")} />
                      <SidebarBadge count={getBadgeCount(item.id)} />
                      {!getBadgeCount(item.id) && item.hasDot && (
                        <span className="absolute -top-0.5 -left-0.5 h-1.5 w-1.5 bg-red-500 rounded-full dot-pulse" />
                      )}
                    </div>
                    <span className={cn(
                      "text-[8px] leading-tight text-center max-w-full truncate mt-0.5",
                      isActive ? "font-bold" : "font-medium"
                    )}>
                      {item.title}
                    </span>
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[2.5px] h-5 bg-blue-600 rounded-l-full" />
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
      <div className="flex flex-col items-center gap-0 px-1 py-1 border-t border-gray-100 dark:border-gray-700">
        {/* All Tools Button */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setAllToolsOpen(!allToolsOpen)}
              className={cn(
                "w-full flex flex-col items-center gap-0 py-1.5 px-0.5 rounded-md transition-all duration-150",
                allToolsOpen
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground dark:text-muted-foreground dark:hover:bg-gray-800 dark:hover:text-gray-300"
              )}
            >
              <Menu className="h-[18px] w-[18px]" />
              <span className="text-[8px] font-medium mt-0.5">كل الأدوات</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">كل الأدوات</TooltipContent>
        </Tooltip>

        {/* Notification Sound Toggle */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={toggleSound}
              className={cn(
                "w-full flex flex-col items-center gap-0 py-1.5 px-0.5 rounded-md transition-all duration-150",
                soundEnabled
                  ? "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-muted-foreground dark:text-muted-foreground dark:hover:bg-gray-800 dark:hover:text-muted-foreground"
              )}
            >
              {soundEnabled ? (
                <Volume2 className="h-[18px] w-[18px]" />
              ) : (
                <VolumeX className="h-[18px] w-[18px]" />
              )}
              <span className="text-[8px] font-medium mt-0.5">{soundEnabled ? "التنبيه" : "صامت"}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            {soundEnabled ? "إيقاف صوت التنبيه" : "تفعيل صوت التنبيه"}
          </TooltipContent>
        </Tooltip>

        {/* Dark Mode Toggle */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={toggleTheme}
              className={cn(
                "w-full flex flex-col items-center gap-0 py-1.5 px-0.5 rounded-md transition-all duration-150",
                theme === 'dark'
                  ? "text-amber-400 hover:bg-amber-50/10"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground dark:hover:bg-gray-800"
              )}
            >
              {theme === 'dark' ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
              <span className="text-[8px] font-medium mt-0.5">{theme === 'dark' ? 'مضيء' : 'مظلم'}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            {theme === 'dark' ? 'التبديل إلى الوضع المضيء' : 'التبديل إلى الوضع المظلم'}
          </TooltipContent>
        </Tooltip>

        {/* Settings */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleNavClick("/dashboard/settings")}
              className={cn(
                "w-full flex flex-col items-center gap-0 py-1.5 px-0.5 rounded-md transition-all duration-150",
                isItemActive("/dashboard/settings")
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground dark:text-muted-foreground dark:hover:bg-gray-800 dark:hover:text-gray-300"
              )}
            >
              <SettingsIcon className="h-[18px] w-[18px]" />
              <span className="text-[8px] font-medium mt-0.5">الإعدادات</span>
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
          onClick={() => { setAllToolsOpen(false); setEditMode(false); }}
        />
      )}
      
      {/* Panel */}
      <div
        ref={allToolsRef}
        className={cn(
          "hidden lg:flex fixed top-0 right-[60px] z-50 h-screen w-[320px] bg-white dark:bg-card dark:bg-gray-900 border-l border-border dark:border-gray-700 shadow-xl flex-col transition-transform duration-300 ease-out",
          allToolsOpen ? "translate-x-0" : "translate-x-full opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-foreground dark:text-gray-100">كل الأدوات</h2>
          <button
            onClick={() => { setAllToolsOpen(false); setEditMode(false); }}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted dark:hover:bg-gray-800 text-muted-foreground dark:text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search (hidden in edit mode) */}
        {!editMode && (
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="ابحث في كل الأدوات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pr-9 pl-3 rounded-full bg-muted dark:bg-gray-800 border-0 text-sm text-foreground dark:text-gray-300 placeholder:text-muted-foreground dark:placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white dark:bg-card dark:focus:bg-gray-700 transition-all"
              />
            </div>
          </div>
        )}

        {/* Edit Mode Header */}
        {editMode && (
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-blue-50/50 dark:bg-blue-900/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground dark:text-gray-300">تعديل الشريط الجانبي</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelEditMode}
                  className="text-xs px-3 py-1.5 rounded-md text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-gray-800 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={saveEditMode}
                  className="text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  حفظ
                </button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">اختر العناصر واسحبها لإعادة ترتيبها في الشريط الجانبي</p>
          </div>
        )}

        {/* Tools List / Edit List */}
        <ScrollArea className="flex-1">
          {editMode ? (
            // Edit mode: sortable items with drag & drop
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="py-2 px-3">
                {/* Checked items - sortable */}
                {editingItemIds.length > 0 && (
                  <>
                    <div className="text-[10px] font-bold text-muted-foreground dark:text-muted-foreground uppercase tracking-wider px-2 py-1 mb-1 flex items-center gap-1">
                      <GripVertical className="h-3 w-3" />
                      معروض في الشريط — اسحب لإعادة الترتيب
                    </div>
                    <SortableContext
                      items={editingItemIds}
                      strategy={verticalListSortingStrategy}
                    >
                      {editingItemIds
                        .map(id => allNavItems.find(item => item.id === id))
                        .filter(Boolean)
                        .map((item) => (
                          <SortableEditItem
                            key={item!.id}
                            item={item!}
                            isChecked={true}
                            isHome={item!.id === "home"}
                            onToggle={toggleEditItem}
                          />
                        ))}
                    </SortableContext>
                  </>
                )}

                {/* Unchecked items - not sortable */}
                {allNavItems.filter(item => !editingItemIds.includes(item.id)).length > 0 && (
                  <>
                    <div className="border-t border-border dark:border-gray-700 my-2" />
                    <div className="text-[10px] font-bold text-muted-foreground dark:text-muted-foreground uppercase tracking-wider px-2 py-1 mb-1">
                      عناصر مخفية — انقر لإضافتها
                    </div>
                    {allNavItems
                      .filter(item => !editingItemIds.includes(item.id))
                      .map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => toggleEditItem(item.id)}
                            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-muted-foreground dark:text-muted-foreground hover:bg-muted/50 dark:hover:bg-gray-800 transition-all duration-150 mb-0.5"
                          >
                            <div className="w-5 flex-shrink-0" />
                            <div className="h-5 w-5 rounded border-2 border-border flex items-center justify-center flex-shrink-0" />
                            <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span className="truncate">{item.title}</span>
                          </button>
                        );
                      })}
                  </>
                )}
              </div>
            </DndContext>
          ) : (
            // Normal mode: grouped tools
            <div className="py-2 px-3">
              {filteredGroups.map((group, index) => {
                const isExpanded = expandedGroups[group.label] !== false;
                const GroupIcon = group.icon;
                
                return (
                  <div key={group.label}>
                    {index > 0 && <div className="border-t border-gray-100 dark:border-gray-700 my-2" />}
                    
                    {/* Group Header */}
                    <button
                      onClick={() => toggleGroup(group.label)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-muted-foreground dark:text-muted-foreground uppercase tracking-wider hover:text-foreground dark:hover:text-gray-300 transition-colors rounded-md"
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
                                  ? "bg-blue-50 text-blue-600 font-semibold dark:bg-blue-900/30 dark:text-blue-400"
                                  : "text-foreground hover:bg-muted/50 dark:text-gray-300 dark:hover:bg-gray-800"
                              )}
                            >
                              <div className="relative flex-shrink-0">
                                <Icon className={cn("h-4.5 w-4.5", isActive ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground dark:text-muted-foreground")} />
                                <SidebarBadge count={getBadgeCount(item.id)} />
                              </div>
                              <span className="truncate flex-1">{item.title}</span>
                              {getBadgeCount(item.id) > 0 && (
                                <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                                  {getBadgeCount(item.id)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Bottom: Edit Button (like Meta Business Suite "تعديل") */}
        {!editMode && (
          <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3">
            <button
              onClick={startEditMode}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-muted-foreground dark:text-muted-foreground hover:bg-muted/50 dark:hover:bg-gray-800 hover:text-foreground dark:hover:text-gray-300 transition-colors border border-border dark:border-gray-700"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>تعديل</span>
            </button>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2 flex items-center gap-3">
          <button
            onClick={() => handleNavClick("/dashboard/settings")}
            className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-gray-300 transition-colors"
          >
            <Search className="h-4 w-4" />
            <span>بحث</span>
          </button>
          <button
            onClick={toggleSound}
            className={cn(
              "flex items-center gap-2 py-1.5 text-sm transition-colors",
              soundEnabled ? "text-green-600 dark:text-green-400 hover:text-green-700" : "text-muted-foreground dark:text-muted-foreground hover:text-muted-foreground"
            )}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span>{soundEnabled ? "التنبيه" : "صامت"}</span>
          </button>
          <button
            onClick={() => handleNavClick("/dashboard/settings")}
            className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-gray-300 transition-colors"
          >
            <SettingsIcon className="h-4 w-4" />
            <span>الإعدادات</span>
          </button>
          <button
            className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-gray-300 transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            <span>مساعدة</span>
          </button>
        </div>
      </div>
    </>
  );

  // ============================================
  // Mobile Bottom Navigation Bar
  // ============================================
  const renderMobileBottomBar = () => (
    <div className="lg:hidden fixed bottom-0 right-0 left-0 z-40 bg-white dark:bg-card dark:bg-gray-900 border-t border-border dark:border-gray-700 safe-bottom">
      <div className="flex items-center justify-around px-1 py-1.5">
        <button
          onClick={() => handleNavClick("/dashboard")}
          className={cn(
            "flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] transition-colors min-w-[56px]",
            currentPath === "/dashboard" ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground dark:text-muted-foreground"
          )}
        >
          <Home className={cn("h-5 w-5", currentPath === "/dashboard" && "stroke-[2.5]")} />
          <span className={currentPath === "/dashboard" ? "font-bold" : "font-medium"}>الرئيسية</span>
        </button>
        <button
          onClick={() => handleNavClick("/dashboard/bookings/leads")}
          className={cn(
            "flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] transition-colors min-w-[56px]",
            currentPath.includes("/bookings") ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground dark:text-muted-foreground"
          )}
        >
          <div className="relative">
            <UserCheck className={cn("h-5 w-5", currentPath.includes("/bookings") && "stroke-[2.5]")} />
            <SidebarBadge count={(badgeCounts?.leads || 0)} />
          </div>
          <span className={currentPath.includes("/bookings") ? "font-bold" : "font-medium"}>الحجوزات</span>
        </button>
        <button
          onClick={() => handleNavClick("/dashboard/reports")}
          className={cn(
            "flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] transition-colors min-w-[56px]",
            currentPath.includes("/reports") || currentPath.includes("/analytics") ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground dark:text-muted-foreground"
          )}
        >
          <BarChart3 className={cn("h-5 w-5", (currentPath.includes("/reports") || currentPath.includes("/analytics")) && "stroke-[2.5]")} />
          <span className={(currentPath.includes("/reports") || currentPath.includes("/analytics")) ? "font-bold" : "font-medium"}>التقارير</span>
        </button>
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] text-muted-foreground dark:text-muted-foreground min-w-[56px]"
        >
          <div className="relative">
            <Menu className="h-5 w-5" />
            {((badgeCounts?.tasks || 0) + (badgeCounts?.whatsapp || 0) + (badgeCounts?.management || 0)) > 0 && (
              <span className="absolute -top-0.5 -left-0.5 h-2 w-2 bg-red-500 rounded-full dot-pulse" />
            )}
          </div>
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
          "lg:hidden fixed top-0 right-0 z-50 h-full w-[300px] bg-white dark:bg-card dark:bg-gray-900 shadow-xl flex flex-col transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <img
              src="/assets/new-logo.png"
              alt="المستشفى السعودي الألماني"
              className="h-9 w-9 object-contain"
            />
            <div>
              <h2 className="text-sm font-bold text-foreground dark:text-gray-100">المستشفى السعودي الألماني</h2>
              <p className="text-[10px] text-muted-foreground dark:text-muted-foreground">لوحة التحكم</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted dark:hover:bg-gray-800 text-muted-foreground dark:text-muted-foreground transition-colors"
            aria-label="إغلاق القائمة"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2.5">
          <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
              <input
                type="text"
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pr-9 pl-3 rounded-full bg-muted dark:bg-gray-800 border-0 text-sm text-foreground dark:text-gray-300 placeholder:text-muted-foreground dark:placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white dark:bg-card dark:focus:bg-gray-700 transition-all"
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
                  ? "bg-blue-50 text-blue-600 font-semibold dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-foreground hover:bg-muted/50 dark:text-gray-300 dark:hover:bg-gray-800"
              )}
            >
              <Home className={cn("h-5 w-5 flex-shrink-0", currentPath === "/dashboard" ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground dark:text-muted-foreground")} />
              <span>الرئيسية</span>
            </button>

            {/* Groups */}
            {(searchQuery ? filteredGroups : allToolsGroups).map((group, index) => {
              const isExpanded = expandedGroups[group.label] !== false;
              const hasActiveItem = group.items.some(item => isItemActive(item.href));

              return (
                <div key={group.label}>
                  {<div className="border-t border-gray-100 dark:border-gray-700 my-1.5" />}
                  
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors rounded-md",
                      hasActiveItem ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground dark:text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground"
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
                                ? "bg-blue-50 text-blue-600 font-semibold dark:bg-blue-900/30 dark:text-blue-400"
                                : "text-foreground hover:bg-muted/50 dark:text-gray-300 dark:hover:bg-gray-800"
                            )}
                          >
                            <div className="relative flex-shrink-0">
                              <Icon className={cn("h-4 w-4", isActive ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground dark:text-muted-foreground")} />
                              <SidebarBadge count={getBadgeCount(item.id)} />
                            </div>
                            <span className="truncate flex-1">{item.title}</span>
                            {getBadgeCount(item.id) > 0 && (
                              <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                                {getBadgeCount(item.id)}
                              </span>
                            )}
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
        <div className="border-t border-gray-100 dark:border-gray-700 p-3 flex items-center gap-2">
          <button
            onClick={toggleSound}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors",
              soundEnabled
                ? "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                : "text-muted-foreground dark:text-muted-foreground hover:bg-muted/50 dark:hover:bg-gray-800 hover:text-muted-foreground"
            )}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span>{soundEnabled ? "التنبيه" : "صامت"}</span>
          </button>
          <button
            onClick={toggleTheme}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors",
              theme === 'dark'
                ? "text-amber-400 hover:bg-amber-50/10"
                : "text-muted-foreground dark:text-muted-foreground hover:bg-muted/50 dark:hover:bg-gray-800 hover:text-foreground"
            )}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>{theme === 'dark' ? 'مضيء' : 'مظلم'}</span>
          </button>
          <button
            onClick={() => handleNavClick("/dashboard/settings")}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-muted-foreground dark:text-muted-foreground hover:bg-muted/50 dark:hover:bg-gray-800 hover:text-foreground dark:hover:text-gray-300 transition-colors"
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
