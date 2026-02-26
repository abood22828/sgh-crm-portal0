import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { X, GripVertical } from "lucide-react";
import { useState, useEffect } from "react";
import type { NavItem, NavGroup } from "./DashboardSidebarV2";
import { cn } from "@/lib/utils";

interface EditSidebarModalProps {
  isOpen: boolean;
  onClose: () => void;
  allToolsGroups: NavGroup[];
  visibleItemIds: string[];
  onSave: (newVisibleIds: string[]) => void;
}

const MAX_VISIBLE_ITEMS = 10;

export default function EditSidebarModal({
  isOpen,
  onClose,
  allToolsGroups,
  visibleItemIds,
  onSave
}: EditSidebarModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(visibleItemIds);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(visibleItemIds);
    }
  }, [isOpen, visibleItemIds]);

  // Get all items from all groups
  const allItems = allToolsGroups.flatMap(group => group.items);

  // Get selected items in order
  const selectedItems = selectedIds
    .map(id => allItems.find(item => item.id === id))
    .filter(Boolean) as NavItem[];

  // Toggle selection
  const toggleItem = (itemId: string) => {
    if (itemId === "home") return; // Cannot remove home

    if (selectedIds.includes(itemId)) {
      setSelectedIds(selectedIds.filter(id => id !== itemId));
    } else {
      if (selectedIds.length < MAX_VISIBLE_ITEMS) {
        setSelectedIds([...selectedIds, itemId]);
      }
    }
  };

  // Remove item from selected
  const removeItem = (itemId: string) => {
    if (itemId === "home") return;
    setSelectedIds(selectedIds.filter(id => id !== itemId));
  };

  // Move item up/down
  const moveItem = (itemId: string, direction: "up" | "down") => {
    const index = selectedIds.indexOf(itemId);
    if (index === -1) return;
    
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedIds.length) return;

    const newIds = [...selectedIds];
    [newIds[index], newIds[newIndex]] = [newIds[newIndex], newIds[index]];
    setSelectedIds(newIds);
  };

  const handleSave = () => {
    onSave(selectedIds);
    onClose();
  };

  const handleCancel = () => {
    setSelectedIds(visibleItemIds);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 gap-0 bg-white dark:bg-gray-900" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="text-center flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              تخصيص الأدوات التي تظهر في لـ Saudi German Hospital Sana'a
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              يمكنك تحديد 10 أدوات بحد أقصى
            </p>
          </div>
          <div className="w-9" />
        </div>



        {/* Two Column Layout */}
        <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700 divide-x-reverse h-[600px]">
          {/* Right Column - "التفاعل مع الجمهور" (Selected Items) */}
          <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                التفاعل مع الجمهور
              </h3>
            </div>
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-2">
                {selectedItems.map((item, index) => {
                  const Icon = item.icon;
                  const isHome = item.id === "home";
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 group"
                    >
                      {/* Drag Handle */}
                      {!isHome && (
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => moveItem(item.id, "up")}
                            disabled={index === 0}
                            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                          >
                            <GripVertical className="h-3 w-3 text-gray-400" />
                          </button>
                          <button
                            onClick={() => moveItem(item.id, "down")}
                            disabled={index === selectedItems.length - 1}
                            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                          >
                            <GripVertical className="h-3 w-3 text-gray-400" />
                          </button>
                        </div>
                      )}

                      {/* Checkbox */}
                      <Checkbox
                        checked={true}
                        onCheckedChange={() => toggleItem(item.id)}
                        disabled={isHome}
                        className="flex-shrink-0"
                      />

                      {/* Item Info */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {item.title}
                        </span>
                      </div>

                      {/* Remove Button */}
                      {!isHome && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Left Column - "تم تحديد X من الأدوات" (All Available Items) */}
          <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                تم تحديد {selectedIds.length} من الأدوات
              </h3>
            </div>
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-6">
                {allToolsGroups.map((group) => {
                  const GroupIcon = group.icon;
                  return (
                    <div key={group.label} className="space-y-2">
                      {/* Group Header */}
                      <div className="flex items-center gap-2 px-2">
                        <GroupIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {group.label}
                        </h4>
                      </div>

                      {/* Group Items */}
                      <div className="space-y-1">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isSelected = selectedIds.includes(item.id);
                          const isHome = item.id === "home";
                          const canSelect = !isSelected && selectedIds.length < MAX_VISIBLE_ITEMS;

                          return (
                            <button
                              key={item.id}
                              onClick={() => toggleItem(item.id)}
                              disabled={isHome || (!isSelected && !canSelect)}
                              className={cn(
                                "w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-right",
                                isSelected
                                  ? "bg-blue-50 dark:bg-blue-900/20"
                                  : canSelect
                                  ? "hover:bg-gray-100 dark:hover:bg-gray-800"
                                  : "opacity-50 cursor-not-allowed"
                              )}
                            >
                              <Checkbox
                                checked={isSelected}
                                disabled={isHome || (!isSelected && !canSelect)}
                                className="flex-shrink-0"
                              />
                              <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                                {item.title}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="min-w-[120px]"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            className="min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white"
          >
            حفظ
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
