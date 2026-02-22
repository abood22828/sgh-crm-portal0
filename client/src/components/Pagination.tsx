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
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-4 border-t">
      {/* Left side: Page size selector + info */}
      <div className="flex items-center gap-3">
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">عرض:</span>
            <Select value={pageSize || "100"} onValueChange={(val) => onPageSizeChange(val as PageSizeValue)}>
              <SelectTrigger className="h-8 w-[72px] text-xs">
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
        <div className="text-xs text-muted-foreground">
          {isShowAll && totalItems !== undefined ? (
            <span className="bg-muted/50 px-2 py-1 rounded">
              عرض الكل ({totalItems?.toLocaleString("ar-SA")})
            </span>
          ) : totalItems !== undefined && startItem && endItem ? (
            <span>
              <span className="font-medium text-foreground">{startItem?.toLocaleString("ar-SA")}</span>
              {" - "}
              <span className="font-medium text-foreground">{endItem?.toLocaleString("ar-SA")}</span>
              {" من "}
              <span className="font-medium text-foreground">{totalItems?.toLocaleString("ar-SA")}</span>
            </span>
          ) : (
            <span>
              الصفحة <span className="font-medium text-foreground">{currentPage}</span> من{" "}
              <span className="font-medium text-foreground">{totalPages}</span>
            </span>
          )}
        </div>
      </div>

      {/* Right side: Navigation buttons */}
      {!isShowAll && totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-0.5 mx-1">
            {generatePageNumbers(currentPage, totalPages).map((page, i) => (
              page === "..." ? (
                <span key={`ellipsis-${i}`} className="w-8 text-center text-xs text-muted-foreground">...</span>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "ghost"}
                  size="icon"
                  className={`h-8 w-8 text-xs ${currentPage === page ? 'pointer-events-none' : ''}`}
                  onClick={() => onPageChange(page as number)}
                >
                  {page}
                </Button>
              )
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
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

function generatePageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];
  
  if (current <= 3) {
    pages.push(1, 2, 3, 4, "...", total);
  } else if (current >= total - 2) {
    pages.push(1, "...", total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total);
  }

  return pages;
}
