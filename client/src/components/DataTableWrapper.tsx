/**
 * DataTableWrapper - مكون مشترك يغلف الجداول
 * 
 * يوفر:
 * - شريط أدوات موحد (تصدير، طباعة، إدارة أعمدة، فلاتر محفوظة)
 * - شريط بحث وفلاتر
 * - حالة التحميل (skeleton)
 * - حالة فارغة (empty state)
 * - ترقيم الصفحات (pagination)
 * - عرض عدد النتائج المفلترة
 * 
 * يُستخدم كغلاف حول محتوى الجدول الفعلي الذي يتم تمريره كـ children
 */
import { ReactNode } from "react";
import { Filter } from "lucide-react";
import Pagination, { type PageSizeValue } from "@/components/Pagination";
import DataTableToolbar from "@/components/DataTableToolbar";
import TableSkeleton from "@/components/TableSkeleton";
import EmptyState from "@/components/EmptyState";
import { Users, type LucideIcon } from "lucide-react";
import type { ColumnConfig, ColumnTemplate } from "@/components/ColumnVisibility";

interface DataTableWrapperProps {
  /** محتوى الجدول (children) */
  children: ReactNode;
  /** حالة التحميل */
  isLoading: boolean;
  /** هل البيانات فارغة */
  isEmpty: boolean;
  /** عدد العناصر المفلترة */
  filteredCount: number;
  /** عدد العناصر الكلي */
  totalCount: number;
  /** هل توجد فلاتر نشطة */
  hasActiveFilters: boolean;
  /** دالة مسح الفلاتر */
  onClearFilters: () => void;

  /** أيقونة الحالة الفارغة */
  emptyIcon?: LucideIcon;
  /** عنوان الحالة الفارغة */
  emptyTitle?: string;
  /** وصف الحالة الفارغة عند وجود فلاتر */
  emptyFilteredDescription?: string;
  /** وصف الحالة الفارغة بدون فلاتر */
  emptyDescription?: string;

  /** عدد أعمدة skeleton */
  skeletonColumns?: number;
  /** عدد صفوف skeleton */
  skeletonRows?: number;

  /** Pagination */
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: PageSizeValue;
  onPageSizeChange: (size: PageSizeValue) => void;
  itemsPerPage: number;

  /** Toolbar */
  toolbarCustomActions?: ReactNode;
  onExport?: (format: 'excel' | 'csv' | 'pdf') => void;
  onPrint?: () => void;
  showExport?: boolean;
  showPrint?: boolean;
  showColumnVisibility?: boolean;
  showSavedFilters?: boolean;
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
  savedFiltersProps?: {
    pageKey: "appointments" | "offerLeads" | "campRegistrations" | "customers";
    currentFilters: Record<string, any>;
    onApplyFilter: (filters: Record<string, any>) => void;
  };

  /** عرض شريط الأدوات */
  showToolbar?: boolean;
  /** عرض عدد النتائج */
  showResultCount?: boolean;
  /** عرض Pagination */
  showPagination?: boolean;
  /** CSS class إضافي */
  className?: string;
}

export default function DataTableWrapper({
  children,
  isLoading,
  isEmpty,
  filteredCount,
  totalCount,
  hasActiveFilters,
  onClearFilters,
  emptyIcon,
  emptyTitle = "لا توجد بيانات",
  emptyFilteredDescription = "لا توجد نتائج مطابقة للفلاتر المحددة.",
  emptyDescription = "لم يتم إضافة أي بيانات بعد.",
  skeletonColumns = 6,
  skeletonRows = 5,
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  itemsPerPage,
  toolbarCustomActions,
  onExport,
  onPrint,
  showExport = true,
  showPrint = true,
  showColumnVisibility = false,
  showSavedFilters = false,
  columnVisibilityProps,
  savedFiltersProps,
  showToolbar = true,
  showResultCount = true,
  showPagination = true,
  className = "",
}: DataTableWrapperProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Toolbar */}
      {showToolbar && (
        <DataTableToolbar
          customActions={toolbarCustomActions}
          onExport={onExport}
          onPrint={onPrint}
          showExport={showExport}
          showPrint={showPrint}
          showColumnVisibility={showColumnVisibility}
          showSavedFilters={showSavedFilters}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={onClearFilters}
          columnVisibilityProps={columnVisibilityProps}
          savedFiltersProps={savedFiltersProps}
        />
      )}

      {/* Result Count */}
      {showResultCount && hasActiveFilters && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span>عرض {filteredCount.toLocaleString("ar-SA")} من {totalCount.toLocaleString("ar-SA")} نتيجة</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="rounded-lg border bg-card p-4">
          <TableSkeleton rows={skeletonRows} columns={skeletonColumns} />
        </div>
      ) : isEmpty ? (
        /* Empty State */
        <div className="rounded-lg border bg-card p-8">
          <EmptyState
            icon={emptyIcon || Users}
            title={emptyTitle}
            description={hasActiveFilters ? emptyFilteredDescription : emptyDescription}
            action={hasActiveFilters ? { label: "مسح الفلاتر", onClick: onClearFilters } : undefined}
          />
        </div>
      ) : (
        /* Table Content */
        <>
          {children}

          {/* Pagination */}
          {showPagination && filteredCount > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              totalItems={filteredCount}
              itemsPerPage={itemsPerPage}
              pageSize={pageSize}
              onPageSizeChange={onPageSizeChange}
            />
          )}
        </>
      )}
    </div>
  );
}
