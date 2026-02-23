import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import MultiSelect from "@/components/MultiSelect";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, TrendingUp, Download, X, Filter, Printer,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SOURCE_OPTIONS } from "@shared/sources";
import type { DateFilterPreset } from "@/hooks/useFilterUtils";

const STATUS_OPTIONS = [
  { value: 'new', label: 'جديد' },
  { value: 'contacted', label: 'تم التواصل' },
  { value: 'booked', label: 'تم الحجز' },
  { value: 'not_interested', label: 'غير مهتم' },
  { value: 'no_answer', label: 'لم يرد' },
];

interface LeadFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: DateFilterPreset) => void;
  statusFilter: string[];
  onStatusFilterChange: (value: string[]) => void;
  sourceFilter: string[];
  onSourceFilterChange: (value: string[]) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  filteredCount: number;
  totalCount: number;
  pendingCount: number;
  onExport: (format: 'excel' | 'csv' | 'pdf') => void;
  onPrint: () => void;
}

export default function LeadFilters({
  searchTerm,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  statusFilter,
  onStatusFilterChange,
  sourceFilter,
  onSourceFilterChange,
  hasActiveFilters,
  onClearFilters,
  filteredCount,
  totalCount,
  pendingCount,
  onExport,
  onPrint,
}: LeadFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Quick filter + Actions row */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={statusFilter.includes("new") && statusFilter.length === 1 ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusFilterChange(statusFilter.includes("new") && statusFilter.length === 1 ? [] : ["new"])}
          className={`gap-2 h-9 ${
            !(statusFilter.includes("new") && statusFilter.length === 1)
              ? "border-amber-200 text-amber-700 hover:bg-amber-50"
              : ""
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          {statusFilter.includes("new") && statusFilter.length === 1 ? "عرض الكل" : "المعلقة فقط"}
          {!(statusFilter.includes("new") && statusFilter.length === 1) && pendingCount > 0 && (
            <Badge variant="secondary" className="mr-1 bg-amber-100 text-amber-700 text-xs">
              {pendingCount}
            </Badge>
          )}
        </Button>

        <div className="flex-1" />

        <Button variant="outline" size="sm" onClick={onPrint} className="gap-2 h-9">
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">طباعة</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 h-9">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">تصدير</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExport('excel')}>تصدير Excel</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('csv')}>تصدير CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('pdf')}>تصدير PDF</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-1 h-9 text-muted-foreground">
            <X className="h-3.5 w-3.5" />
            مسح الفلاتر
          </Button>
        )}
      </div>

      {/* Search + Filters row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو الهاتف..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-10 h-9"
          />
        </div>
        <Select value={dateFilter} onValueChange={(v) => onDateFilterChange(v as DateFilterPreset)}>
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
          options={STATUS_OPTIONS}
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

      {/* Active filters count */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span>عرض {filteredCount.toLocaleString("ar-SA")} من {totalCount.toLocaleString("ar-SA")} نتيجة</span>
        </div>
      )}
    </div>
  );
}
