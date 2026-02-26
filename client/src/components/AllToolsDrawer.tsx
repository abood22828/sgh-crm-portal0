import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "wouter";
import { Clock, X, Search } from "lucide-react";
import { useRecentlyUsed } from "@/hooks/useRecentlyUsed";
import type { NavItem, NavGroup } from "./DashboardSidebarV2";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface AllToolsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  allToolsGroups: NavGroup[];
  allNavItems: NavItem[];
}

export default function AllToolsDrawer({ 
  isOpen, 
  onClose, 
  allToolsGroups,
  allNavItems 
}: AllToolsDrawerProps) {
  const [location, setLocation] = useLocation();
  const { recentlyUsed } = useRecentlyUsed();
  const [searchQuery, setSearchQuery] = useState("");

  const handleNavigate = (href: string) => {
    setLocation(href);
    onClose();
  };

  // Get recently used items with full details
  const recentItems = recentlyUsed
    .map(tool => allNavItems.find(item => item.id === tool.id))
    .filter(Boolean) as NavItem[];

  // Filter items based on search
  const filteredGroups = searchQuery.trim()
    ? allToolsGroups.map(group => ({
        ...group,
        items: group.items.filter(item =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(group => group.items.length > 0)
    : allToolsGroups;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-[900px] p-0 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">كل الأدوات</h2>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث في كل الأدوات عن كلمات أساسية..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-12 pl-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="px-6 py-5 space-y-6">
            {/* Recently Used Section - Top Icons Style */}
            {!searchQuery && recentItems.length > 0 && (
              <div>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">المستخدمة مؤخراً</h3>
                </div>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  {recentItems.slice(0, 7).map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.href;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigate(item.href)}
                        className={cn(
                          "flex flex-col items-center gap-3 p-4 rounded-xl transition-all min-w-[100px]",
                          isActive
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                      >
                        <div className={cn(
                          "p-4 rounded-xl transition-colors",
                          isActive 
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" 
                            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        )}>
                          <Icon className="h-7 w-7" />
                        </div>
                        <span className="text-sm font-medium text-center text-gray-900 dark:text-gray-100">
                          {item.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Tools Groups - Text Lists Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {filteredGroups.map((group) => {
                const GroupIcon = group.icon;
                return (
                  <div key={group.label} className="space-y-3">
                    {/* Group Header - أكبر وأوضح */}
                    <div className="flex items-center gap-2 pb-1.5 border-b border-gray-200/50 dark:border-gray-700/50">
                      <GroupIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {group.label}
                      </h3>
                    </div>
                    
                    {/* Group Items - Simple List with smaller text */}
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location === item.href;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleNavigate(item.href)}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-all text-right",
                              isActive
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                            )}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm font-normal">{item.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* No Results */}
            {searchQuery && filteredGroups.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">لا توجد نتائج لـ "{searchQuery}"</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
