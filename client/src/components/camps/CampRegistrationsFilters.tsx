import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MultiSelect from "@/components/MultiSelect";
import { Search, RotateCcw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SOURCE_OPTIONS } from "@shared/sources";

interface CampRegistrationsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCamp: string[];
  onCampChange: (value: string[]) => void;
  uniqueCamps: Array<{ id: number; title: string }>;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  statusFilter: string[];
  onStatusFilterChange: (value: string[]) => void;
  sourceFilter: string[];
  onSourceFilterChange: (value: string[]) => void;
  activeFilterCount: number;
  onResetFilters: () => void;
}

export default function CampRegistrationsFilters({
  searchTerm,
  onSearchChange,
  selectedCamp,
  onCampChange,
  uniqueCamps,
  dateFilter,
  onDateFilterChange,
  statusFilter,
  onStatusFilterChange,
  sourceFilter,
  onSourceFilterChange,
  activeFilterCount,
  onResetFilters,
}: CampRegistrationsFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Search and Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث بالاسم أو الهاتف..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-10 h-9"
          />
        </div>
        <MultiSelect
          options={uniqueCamps.map((camp) => ({ value: camp.id.toString(), label: camp.title }))}
          selected={selectedCamp}
          onChange={onCampChange}
          placeholder="جميع المخيمات"
          className="h-9"
        />
        <Select value={dateFilter} onValueChange={onDateFilterChange}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="كل الفترات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الفترات</SelectItem>
            <SelectItem value="today">اليوم</SelectItem>
            <SelectItem value="week">هذا الأسبوع</SelectItem>
            <SelectItem value="month">هذا الشهر</SelectItem>
          </SelectContent>
        </Select>
        <MultiSelect
          options={[
            { value: 'pending', label: 'قيد الانتظار' },
            { value: 'contacted', label: 'تم التواصل' },
            { value: 'no_answer', label: 'لم يرد' },
            { value: 'confirmed', label: 'مؤكد' },
            { value: 'attended', label: 'حضر' },
            { value: 'completed', label: 'مكتمل' },
            { value: 'cancelled', label: 'ملغي' },
          ]}
          selected={statusFilter}
          onChange={onStatusFilterChange}
          placeholder="كل الحالات"
          className="h-9"
        />
        <MultiSelect
          options={SOURCE_OPTIONS}
          selected={sourceFilter}
          onChange={onSourceFilterChange}
          placeholder="كل المصادر"
          className="h-9"
        />
      </div>

      {/* Reset Filters Button */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="gap-1 text-muted-foreground hover:text-foreground h-8"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            إعادة تعيين الفلاتر ({activeFilterCount})
          </Button>
        </div>
      )}
    </div>
  );
}
