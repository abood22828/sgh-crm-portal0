import { Dialog, DialogContent } from "@/components/ui/dialog";
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

  // Get recently used items with full details (max 7)
  const recentItems = recentlyUsed
    .slice(0, 7)
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[900px] h-[85vh] p-0 gap-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-gray-200 dark:border-gray-700"
        dir="rtl"
        style={{ 
          position: 'fixed',
          right: '80px',
          top: '50%',
          transform: 'translateY(-50%)',
          margin: 0
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-l from-blue-50/50 to-transparent dark:from-blue-900/20">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            كل الأدوات
          </h2>
          <div className="w-9" />
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث في كل الأدوات عن كلمات أساسية..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6">
            {/* Recently Used Section */}
            {!searchQuery && recentItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    المستخدمة مؤخراً
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {recentItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.href;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigate(item.href)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg text-right transition-all",
                          isActive
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                        )}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{item.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Tools Groups */}
            {filteredGroups.map((group) => {
              const GroupIcon = group.icon;
              return (
                <div key={group.label} className="space-y-3">
                  {/* Group Header */}
                  <div className="flex items-center gap-2 px-2">
                    <GroupIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {group.label}
                    </h3>
                  </div>

                  {/* Group Items */}
                  <div className="grid grid-cols-2 gap-3">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location === item.href;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavigate(item.href)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg text-right transition-all",
                            isActive
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                              : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                          )}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">{item.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* No Results */}
            {searchQuery && filteredGroups.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  لا توجد نتائج لـ "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
