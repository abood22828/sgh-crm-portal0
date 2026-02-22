import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export const PAGE_SIZE_OPTIONS = [
  { value: "50", label: "50" },
  { value: "100", label: "100" },
  { value: "500", label: "500" },
  { value: "1000", label: "1000" },
  { value: "all", label: "الكل" },
] as const;

export type PageSizeValue = "50" | "100" | "500" | "1000" | "all";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  pageSize?: PageSizeValue;
  onPageSizeChange?: (size: PageSizeValue) => void;
  showPageSizeSelector?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  pageSize,
  onPageSizeChange,
  showPageSizeSelector = true,
}: PaginationProps) {
  const isShowAll = pageSize === "all";
  const startItem = totalItems && itemsPerPage && !isShowAll ? (currentPage - 1) * itemsPerPage + 1 : null;
  const endItem = totalItems && itemsPerPage && !isShowAll ? Math.min(currentPage * itemsPerPage, totalItems) : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-4">
      <div className="flex items-center gap-3">
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">عرض:</span>
            <Select value={pageSize || "100"} onValueChange={(val) => onPageSizeChange(val as PageSizeValue)}>
              <SelectTrigger className="h-8 w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          {isShowAll && totalItems !== undefined ? (
            <span>عرض الكل ({totalItems})</span>
          ) : totalItems !== undefined && startItem && endItem ? (
            <span>
              عرض {startItem} - {endItem} من {totalItems}
            </span>
          ) : (
            <span>الصفحة {currentPage} من {totalPages}</span>
          )}
        </div>
      </div>

      {!isShowAll && totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">{currentPage}</span>
            <span className="text-sm text-muted-foreground">من</span>
            <span className="text-sm font-medium">{totalPages}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
