import React, { useState, useCallback, useRef, useEffect, useMemo, createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { getColumnWidth, type ColumnConfig } from "./ColumnVisibility";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

/** Sort direction type */
export type SortDirection = 'asc' | 'desc' | null;

// Context for frozen columns
interface FrozenColumnsContextType {
  frozenColumns: string[];
  columnWidths: Record<string, number>;
  visibleColumnOrder: string[];
}

const FrozenColumnsContext = createContext<FrozenColumnsContextType>({
  frozenColumns: [],
  columnWidths: {},
  visibleColumnOrder: [],
});

interface ResizableTableProps {
  children: React.ReactNode;
  className?: string;
  frozenColumns?: string[];
  columnWidths?: Record<string, number>;
  visibleColumnOrder?: string[];
}

export function ResizableTable({ children, className, frozenColumns = [], columnWidths = {}, visibleColumnOrder = [] }: ResizableTableProps) {
  return (
    <FrozenColumnsContext.Provider value={{ frozenColumns, columnWidths, visibleColumnOrder }}>
      <div className="relative w-full overflow-x-auto border border-border rounded-md" data-slot="table-container">
        <table
          data-slot="table"
          className={cn("caption-bottom text-sm border-collapse table-fixed w-full", className)}
          style={{ minWidth: 'max-content' }}
        >
          {children}
        </table>
      </div>
    </FrozenColumnsContext.Provider>
  );
}

/** Calculate the right offset for a frozen column based on all frozen columns to its left (RTL) */
function useFrozenStyle(columnKey: string) {
  const { frozenColumns, columnWidths, visibleColumnOrder } = useContext(FrozenColumnsContext);
  
  return useMemo(() => {
    if (!frozenColumns.includes(columnKey)) {
      return { isFrozen: false, style: {} as React.CSSProperties };
    }

    // Find the position of this column among frozen columns in visible order
    const frozenInOrder = visibleColumnOrder.filter(k => frozenColumns.includes(k));
    const frozenIndex = frozenInOrder.indexOf(columnKey);
    
    if (frozenIndex === -1) {
      return { isFrozen: false, style: {} as React.CSSProperties };
    }

    // Calculate right offset: sum of widths of all frozen columns to the right of this one (RTL)
    let rightOffset = 0;
    for (let i = frozenIndex + 1; i < frozenInOrder.length; i++) {
      const key = frozenInOrder[i];
      const preset = getColumnWidth(key);
      rightOffset += columnWidths[key] || preset.width;
    }

    return {
      isFrozen: true,
      style: {
        position: 'sticky' as const,
        right: `${rightOffset}px`,
        zIndex: 20 + (frozenInOrder.length - frozenIndex), // Higher z-index for earlier frozen columns
      } as React.CSSProperties,
    };
  }, [columnKey, frozenColumns, columnWidths, visibleColumnOrder]);
}

interface ResizableHeaderCellProps {
  children: React.ReactNode;
  columnKey: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  onResize: (key: string, width: number) => void;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Current sort direction for this column */
  sortDirection?: SortDirection;
  /** Callback when sort is toggled */
  onSort?: (columnKey: string) => void;
}

export function ResizableHeaderCell({
  children,
  columnKey,
  width,
  minWidth = 50,
  maxWidth = 500,
  onResize,
  className,
  onClick,
  style,
  sortable = false,
  sortDirection,
  onSort,
}: ResizableHeaderCellProps) {
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const { isFrozen, style: frozenStyle } = useFrozenStyle(columnKey);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = width;
    },
    [width]
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // RTL: moving left increases width
      const diff = startXRef.current - e.clientX;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidthRef.current + diff));
      onResize(columnKey, newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, columnKey, minWidth, maxWidth, onResize]);

  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-3 text-right align-middle font-medium whitespace-nowrap relative group select-none",
        "border-b border-l border-border bg-muted/30",
        isResizing && "bg-muted/70",
        isFrozen && "bg-muted/60 shadow-[inset_2px_0_4px_-2px_rgba(0,0,0,0.1)] after:content-[''] after:absolute after:top-0 after:left-0 after:h-full after:w-[2px] after:bg-border/50",
        className
      )}
      style={{ 
        width: `${width}px`, 
        minWidth: `${minWidth}px`, 
        maxWidth: `${maxWidth}px`, 
        ...frozenStyle,
        ...style 
      }}
      onClick={!isResizing ? onClick : undefined}
    >
      <div className="flex items-center gap-1 w-full">
        <span className="flex-1 truncate">{children}</span>
        {sortable && (
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center shrink-0 w-5 h-5 rounded-sm transition-colors",
              sortDirection ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground/70"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onSort?.(columnKey);
            }}
            title={sortDirection === 'asc' ? 'ترتيب تنازلي' : sortDirection === 'desc' ? 'إلغاء الترتيب' : 'ترتيب تصاعدي'}
          >
            {sortDirection === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5" />
            ) : sortDirection === 'desc' ? (
              <ArrowDown className="w-3.5 h-3.5" />
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
      {/* Resize handle */}
      <div
        className={cn(
          "absolute top-0 left-0 h-full w-1.5 cursor-col-resize z-10",
          "hover:bg-primary/30 active:bg-primary/50",
          isResizing ? "bg-primary/50" : "bg-transparent group-hover:bg-border"
        )}
        onMouseDown={handleMouseDown}
        onClick={(e) => e.stopPropagation()}
        style={isFrozen ? { zIndex: 30 } : undefined}
      />
    </th>
  );
}

/** Frozen-aware TableCell wrapper */
interface FrozenTableCellProps {
  children: React.ReactNode;
  columnKey: string;
  className?: string;
  title?: string;
  colSpan?: number;
  style?: React.CSSProperties;
}

export function FrozenTableCell({ children, columnKey, className, title, colSpan, style: propStyle }: FrozenTableCellProps) {
  const { isFrozen, style: frozenStyle } = useFrozenStyle(columnKey);

  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 px-3 align-middle whitespace-nowrap text-right border-l border-border [tr:last-child>&]:border-b-0",
        isFrozen && "bg-background shadow-[inset_2px_0_4px_-2px_rgba(0,0,0,0.08)]",
        className
      )}
      style={{ ...frozenStyle, ...propStyle }}
      title={title}
      colSpan={colSpan}
    >
      {children}
    </td>
  );
}

/** Hook to manage frozen columns with persistence */
export function useFrozenColumns(
  storageKey: string,
  defaultFrozen: string[] = [],
  dbSaveFn?: (frozen: string[]) => void,
  dbFrozen?: string[] | null
) {
  const [frozenColumns, setFrozenColumns] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`frozenColumns_${storageKey}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultFrozen;
  });

  // Sync from database
  useEffect(() => {
    if (dbFrozen && dbFrozen.length > 0) {
      setFrozenColumns(dbFrozen);
      try {
        localStorage.setItem(`frozenColumns_${storageKey}`, JSON.stringify(dbFrozen));
      } catch {}
    }
  }, [dbFrozen, storageKey]);

  const toggleFrozen = useCallback((columnKey: string) => {
    setFrozenColumns(prev => {
      const updated = prev.includes(columnKey) 
        ? prev.filter(k => k !== columnKey)
        : [...prev, columnKey];
      try {
        localStorage.setItem(`frozenColumns_${storageKey}`, JSON.stringify(updated));
      } catch {}
      if (dbSaveFn) dbSaveFn(updated);
      return updated;
    });
  }, [storageKey, dbSaveFn]);

  const setFrozen = useCallback((columns: string[]) => {
    setFrozenColumns(columns);
    try {
      localStorage.setItem(`frozenColumns_${storageKey}`, JSON.stringify(columns));
    } catch {}
    if (dbSaveFn) dbSaveFn(columns);
  }, [storageKey, dbSaveFn]);

  const resetFrozen = useCallback(() => {
    setFrozenColumns(defaultFrozen);
    try {
      localStorage.removeItem(`frozenColumns_${storageKey}`);
    } catch {}
    if (dbSaveFn) dbSaveFn(defaultFrozen);
  }, [defaultFrozen, storageKey, dbSaveFn]);

  return {
    frozenColumns,
    toggleFrozen,
    setFrozen,
    resetFrozen,
    isFrozen: useCallback((key: string) => frozenColumns.includes(key), [frozenColumns]),
  };
}

/** Hook to manage column widths with persistence */
export function useColumnWidths(
  columns: ColumnConfig[],
  columnOrder: string[],
  storageKey: string,
  dbSaveFn?: (widths: Record<string, number>) => void,
  dbWidths?: Record<string, number> | null
) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    // Try to load from localStorage
    try {
      const saved = localStorage.getItem(`columnWidths_${storageKey}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    
    // Initialize with smart defaults
    const defaults: Record<string, number> = {};
    columns.forEach((col) => {
      const preset = getColumnWidth(col.key, col);
      defaults[col.key] = preset.width;
    });
    return defaults;
  });

  // Sync from database when loaded
  useEffect(() => {
    if (dbWidths && Object.keys(dbWidths).length > 0) {
      setColumnWidths(prev => {
        const merged = { ...prev, ...dbWidths };
        try {
          localStorage.setItem(`columnWidths_${storageKey}`, JSON.stringify(merged));
        } catch {}
        return merged;
      });
    }
  }, [dbWidths, storageKey]);

  // Debounce timer for database saves
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleResize = useCallback((key: string, width: number) => {
    setColumnWidths((prev) => {
      const updated = { ...prev, [key]: width };
      // Save to localStorage immediately
      try {
        localStorage.setItem(`columnWidths_${storageKey}`, JSON.stringify(updated));
      } catch {}
      // Debounce database save (save after 500ms of no resizing)
      if (dbSaveFn) {
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
        }
        saveTimerRef.current = setTimeout(() => {
          dbSaveFn(updated);
        }, 500);
      }
      return updated;
    });
  }, [storageKey, dbSaveFn]);

  const resetWidths = useCallback(() => {
    const defaults: Record<string, number> = {};
    columns.forEach((col) => {
      const preset = getColumnWidth(col.key, col);
      defaults[col.key] = preset.width;
    });
    setColumnWidths(defaults);
    try {
      localStorage.removeItem(`columnWidths_${storageKey}`);
    } catch {}
    if (dbSaveFn) {
      dbSaveFn(defaults);
    }
  }, [columns, storageKey, dbSaveFn]);

  const applyWidths = useCallback((widths: Record<string, number>) => {
    if (widths && Object.keys(widths).length > 0) {
      setColumnWidths(prev => {
        const merged = { ...prev, ...widths };
        try {
          localStorage.setItem(`columnWidths_${storageKey}`, JSON.stringify(merged));
        } catch {}
        return merged;
      });
    }
  }, [storageKey]);

  const getWidth = useCallback((key: string) => {
    if (columnWidths[key]) return columnWidths[key];
    const col = columns.find(c => c.key === key);
    return getColumnWidth(key, col).width;
  }, [columnWidths, columns]);

  const getMinWidth = useCallback((key: string) => {
    const col = columns.find(c => c.key === key);
    return getColumnWidth(key, col).min;
  }, [columns]);

  const getMaxWidth = useCallback((key: string) => {
    const col = columns.find(c => c.key === key);
    return getColumnWidth(key, col).max;
  }, [columns]);

  return {
    columnWidths,
    handleResize,
    resetWidths,
    applyWidths,
    getWidth,
    getMinWidth,
    getMaxWidth,
  };
}
