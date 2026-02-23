/**
 * DataTableToolbar - شريط أدوات مشترك للجداول
 * 
 * يجمع الأنماط المتكررة في جميع الجداول:
 * - أزرار الطباعة والتصدير (Excel/CSV/PDF)
 * - إدارة أعمدة الجدول (ColumnVisibility)
 * - الفلاتر المحفوظة (SavedFilters)
 * - أزرار إجراءات مخصصة
 */
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Printer, X } from "lucide-react";
import { ColumnVisibility, type ColumnConfig, type ColumnTemplate } from "@/components/ColumnVisibility";
import SavedFilters from "@/components/SavedFilters";

type ExportFormat = 'excel' | 'csv' | 'pdf';

interface DataTableToolbarProps {
  /** أزرار إجراءات مخصصة (مثل تحديث الحالة الجماعي) */
  customActions?: ReactNode;
  /** دالة التصدير */
  onExport?: (format: ExportFormat) => void;
  /** دالة الطباعة */
  onPrint?: () => void;
  /** إظهار أزرار التصدير */
  showExport?: boolean;
  /** إظهار زر الطباعة */
  showPrint?: boolean;
  /** إظهار إدارة الأعمدة */
  showColumnVisibility?: boolean;
  /** إظهار الفلاتر المحفوظة */
  showSavedFilters?: boolean;
  /** هل توجد فلاتر نشطة */
  hasActiveFilters?: boolean;
  /** دالة مسح الفلاتر */
  onClearFilters?: () => void;
  /** خصائص ColumnVisibility */
  columnVisibilityProps?: {
    columns: ColumnConfig[];
    visibleColumns: Record<string, boolean>;
    columnOrder: string[];
    onVisibilityChange: (key: string, visible: boolean) => void;
    onColumnOrderChange: (order: string[]) => void;
    onReset: () => void;
    templates: any[];
    activeTemplateId: string | null;
    onApplyTemplate: (template: ColumnTemplate) => void;
    onSaveTemplate: (name: string, columns: Record<string, boolean>, columnOrder: string[], columnWidths?: Record<string, number>, frozenColumns?: string[]) => void;
    onDeleteTemplate: (templateId: string) => void;
    tableKey: string;
    columnWidths: Record<string, number>;
    frozenColumns: string[];
    onToggleFrozen: (key: string) => void;
    isAdmin: boolean;
    sharedTemplates?: any[];
    onSaveSharedTemplate?: (name: string, columns: Record<string, boolean>, columnOrder: string[], columnWidths?: Record<string, number>, frozenColumns?: string[]) => void;
    onDeleteSharedTemplate?: (dbId: number) => void;
  };
  /** خصائص SavedFilters */
  savedFiltersProps?: {
    pageKey: "appointments" | "offerLeads" | "campRegistrations" | "customers";
    currentFilters: Record<string, any>;
    onApplyFilter: (filters: Record<string, any>) => void;
  };
}

export default function DataTableToolbar({
  customActions,
  onExport,
  onPrint,
  showExport = true,
  showPrint = true,
  showColumnVisibility = false,
  showSavedFilters = false,
  hasActiveFilters = false,
  onClearFilters,
  columnVisibilityProps,
  savedFiltersProps,
}: DataTableToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Custom Actions (left side) */}
      {customActions}

      <div className="flex-1" />

      {/* Print Button */}
      {showPrint && onPrint && (
        <Button variant="outline" size="sm" onClick={onPrint} className="gap-2 h-9">
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">طباعة</span>
        </Button>
      )}

      {/* Export Dropdown */}
      {showExport && onExport && (
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
      )}

      {/* Column Visibility */}
      {showColumnVisibility && columnVisibilityProps && (
        <ColumnVisibility {...columnVisibilityProps} />
      )}

      {/* Saved Filters */}
      {showSavedFilters && savedFiltersProps && (
        <SavedFilters {...savedFiltersProps} />
      )}

      {/* Clear Filters */}
      {hasActiveFilters && onClearFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-1 h-9 text-muted-foreground">
          <X className="h-3.5 w-3.5" />
          مسح الفلاتر
        </Button>
      )}
    </div>
  );
}
