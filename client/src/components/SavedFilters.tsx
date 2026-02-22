import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Bookmark, Save, Trash2, ChevronDown, Star } from "lucide-react";
import { toast } from "sonner";

interface SavedFiltersProps {
  pageKey: "appointments" | "offerLeads" | "campRegistrations";
  currentFilters: Record<string, any>;
  onApplyFilter: (filters: Record<string, any>) => void;
}

export default function SavedFilters({ pageKey, currentFilters, onApplyFilter }: SavedFiltersProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState("");

  const { data: savedFilters, refetch } = trpc.savedFilters.list.useQuery({ pageType: pageKey });
  const utils = trpc.useUtils();
  
  const createMutation = trpc.savedFilters.create.useMutation({
    onSuccess: () => {
      toast.success("تم حفظ الفلتر بنجاح");
      setSaveDialogOpen(false);
      setFilterName("");
      refetch();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حفظ الفلتر");
    },
  });

  const deleteMutation = trpc.savedFilters.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الفلتر بنجاح");
      refetch();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف الفلتر");
    },
  });

  const updateMutation = trpc.savedFilters.update.useMutation({
    onSuccess: () => {
      toast.success("تم تعيين الفلتر كافتراضي");
      refetch();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تعيين الفلتر الافتراضي");
    },
  });

  const handleSave = () => {
    if (!filterName.trim()) return;
    
    // Clean up filters - remove empty arrays and undefined values
    const cleanFilters: Record<string, any> = {};
    for (const [key, value] of Object.entries(currentFilters)) {
      if (value !== undefined && value !== null && value !== "" && 
          !(Array.isArray(value) && value.length === 0)) {
        cleanFilters[key] = value;
      }
    }
    
    createMutation.mutate({
      name: filterName.trim(),
      pageType: pageKey,
      filterConfig: JSON.stringify(cleanFilters),
    });
  };

  const handleApply = (filterConfig: string) => {
    try {
      const filters = JSON.parse(filterConfig);
      onApplyFilter(filters);
      toast.success("تم تطبيق الفلتر");
    } catch {
      toast.error("خطأ في تحميل الفلتر");
    }
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate({ id });
  };

  const handleSetDefault = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    updateMutation.mutate({ id, isDefault: true });
  };

  const hasActiveFilters = Object.values(currentFilters).some(
    (v) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0) && v !== "all"
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Bookmark className="h-4 w-4" />
            <span className="hidden sm:inline">الفلاتر المحفوظة</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {hasActiveFilters && (
            <>
              <DropdownMenuItem onClick={() => setSaveDialogOpen(true)}>
                <Save className="h-4 w-4 ml-2" />
                حفظ الفلتر الحالي
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          {savedFilters && savedFilters.length > 0 ? (
            savedFilters.map((filter: any) => (
              <DropdownMenuItem
                key={filter.id}
                className="flex items-center justify-between group"
                onClick={() => handleApply(filter.filterConfig)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {filter.isDefault && (
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                  )}
                  <span className="truncate">{filter.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {!filter.isDefault && (
                    <button
                      onClick={(e) => handleSetDefault(filter.id, e)}
                      className="p-1 hover:text-yellow-500 transition-colors"
                      title="تعيين كافتراضي"
                    >
                      <Star className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(filter.id, e)}
                    className="p-1 hover:text-destructive transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-2 py-3 text-sm text-muted-foreground text-center">
              لا توجد فلاتر محفوظة
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>حفظ الفلتر</DialogTitle>
            <DialogDescription>
              أدخل اسماً للفلتر الحالي لحفظه واستعادته لاحقاً
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="اسم الفلتر"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={!filterName.trim() || createMutation.isPending}>
              {createMutation.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
