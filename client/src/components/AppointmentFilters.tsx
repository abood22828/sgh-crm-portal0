import { useCallback } from "react";
import MultiSelect from "@/components/MultiSelect";
import SavedFilters from "@/components/SavedFilters";
import { ColumnVisibility, type ColumnConfig } from "@/components/ColumnVisibility";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Download,
  Printer,
  RotateCcw,
} from "lucide-react";
import { SOURCE_OPTIONS } from "@shared/sources";

interface AppointmentFiltersProps {
  // Search
  searchTerm: string;
  onSearchChange: (value: string) => void;
  // Doctor filter
  doctors: Array<{ id: number; name: string }>;
  selectedDoctor: string[];
  onDoctorChange: (value: string[]) => void;
  // Date filter
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  // Status filter
  statusFilter: string[];
  onStatusFilterChange: (value: string[]) => void;
  // Source filter
  sourceFilter: string[];
  onSourceFilterChange: (value: string[]) => void;
  // Active filter count & reset
  activeFilterCount: number;
  onResetAll: () => void;
  // Column visibility
  columns: ColumnConfig[];
  visibleColumns: Record<string, boolean>;
  columnOrder: string[];
  onVisibilityChange: (key: string, visible: boolean) => void;
  onColumnOrderChange: (order: string[]) => void;
  onResetColumns: () => void;
  // Column templates
  allTemplates: any[];
  activeTemplateId: string | null;
  onApplyTemplate: (template: any) => void;
  onSaveTemplate: (name: string, columns: Record<string, boolean>, columnOrder: string[], columnWidths?: Record<string, number>, frozenColumns?: string[]) => void;
  onDeleteTemplate: (templateId: string) => void;
  // Column widths & frozen
  columnWidths: Record<string, number>;
  frozenColumns: string[];
  onToggleFrozen: (key: string) => void;
  // Admin
  isAdmin: boolean;
  sharedTemplates: any[];
  onSaveSharedTemplate: (name: string, columns: Record<string, boolean>, columnOrder: string[], columnWidths?: Record<string, number>, frozenColumns?: string[]) => void;
  onDeleteSharedTemplate: (dbId: number) => void;
  // Saved filters
  currentFilters: any;
  onApplyFilter: (filters: any) => void;
  // Export & Print
  onExport: (format: 'excel' | 'csv' | 'pdf') => void;
  onPrint: () => void;
}

export default function AppointmentFilters({
  searchTerm,
  onSearchChange,
  doctors,
  selectedDoctor,
  onDoctorChange,
  dateFilter,
  onDateFilterChange,
  statusFilter,
  onStatusFilterChange,
  sourceFilter,
  onSourceFilterChange,
  activeFilterCount,
  onResetAll,
  columns,
  visibleColumns,
  columnOrder,
  onVisibilityChange,
  onColumnOrderChange,
  onResetColumns,
  allTemplates,
  activeTemplateId,
  onApplyTemplate,
  onSaveTemplate,
  onDeleteTemplate,
  columnWidths,
  frozenColumns,
  onToggleFrozen,
  isAdmin,
  sharedTemplates,
  onSaveSharedTemplate,
  onDeleteSharedTemplate,
  currentFilters,
  onApplyFilter,
  onExport,
  onPrint,
}: AppointmentFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-10 h-9"
          />
        </div>
        <MultiSelect
          options={doctors.map((doctor) => ({ value: doctor.id.toString(), label: doctor.name }))}
          selected={selectedDoctor}
          onChange={onDoctorChange}
          placeholder="كل الأطباء"
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
            { value: 'confirmed', label: 'مؤكد' },
            { value: 'cancelled', label: 'ملغي' },
            { value: 'completed', label: 'مكتمل' },
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
        <Button
          variant="outline"
          size="sm"
          onClick={onPrint}
          className="gap-2 h-9"
        >
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
        <ColumnVisibility
          columns={columns}
          visibleColumns={visibleColumns}
          columnOrder={columnOrder}
          onVisibilityChange={onVisibilityChange}
          onColumnOrderChange={onColumnOrderChange}
          onReset={onResetColumns}
          templates={allTemplates}
          activeTemplateId={activeTemplateId}
          onApplyTemplate={onApplyTemplate}
          onSaveTemplate={onSaveTemplate}
          onDeleteTemplate={onDeleteTemplate}
          tableKey="appointments"
          columnWidths={columnWidths}
          frozenColumns={frozenColumns}
          onToggleFrozen={onToggleFrozen}
          isAdmin={isAdmin}
          sharedTemplates={sharedTemplates}
          onSaveSharedTemplate={onSaveSharedTemplate}
          onDeleteSharedTemplate={onDeleteSharedTemplate}
        />
        <SavedFilters
          pageKey="appointments"
          currentFilters={currentFilters}
          onApplyFilter={onApplyFilter}
        />
      </div>
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetAll}
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
