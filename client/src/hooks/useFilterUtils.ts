import { useState, useMemo, useCallback } from 'react';
import { useDebounce } from './useDebounce';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DateRange {
  from: Date;
  to: Date;
}

export type DateFilterPreset = 'all' | 'today' | 'week' | 'month';

export interface FilterConfig<T> {
  /** The raw data array to filter */
  data: T[] | undefined;
  /** Search term to filter by (will be debounced) */
  searchTerm: string;
  /** Fields to search within - provide accessor functions */
  searchFields: ((item: T) => string | null | undefined)[];
  /** Multi-select status filter values */
  statusFilter: string[];
  /** Accessor for item status */
  getStatus?: (item: T) => string | null | undefined;
  /** Multi-select source filter values */
  sourceFilter: string[];
  /** Accessor for item source */
  getSource?: (item: T) => string | null | undefined;
  /** Category filter (e.g., doctor, offer, camp) - multi-select */
  categoryFilter?: string[];
  /** Accessor for item category */
  getCategory?: (item: T) => string | null | undefined;
  /** Debounce delay in ms (default: 500) */
  debounceDelay?: number;
}

export interface FilterState {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  debouncedSearch: string;
  statusFilter: string[];
  setStatusFilter: (value: string[]) => void;
  sourceFilter: string[];
  setSourceFilter: (value: string[]) => void;
  categoryFilter: string[];
  setCategoryFilter: (value: string[]) => void;
  dateFilter: DateFilterPreset;
  setDateFilter: (value: DateFilterPreset) => void;
  dateRange: DateRange;
  setDateRange: (value: DateRange) => void;
  resetAll: () => void;
  activeFilterCount: number;
}

export interface UseFilterUtilsReturn<T> {
  /** All filter state and setters */
  filters: FilterState;
  /** Filtered data (before sorting) */
  filteredData: T[];
  /** Total count before filtering */
  totalCount: number;
  /** Count after filtering */
  filteredCount: number;
  /** Date range as ISO strings for API queries */
  dateRangeISO: { dateFrom: string; dateTo: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Create a default date range (last 7 days)
 */
export function createDefaultDateRange(daysBack: number = 7): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - daysBack);
  return { from, to };
}

/**
 * Apply a date filter preset to a date range
 */
export function applyDatePreset(preset: DateFilterPreset, currentRange: DateRange): DateRange {
  const now = new Date();
  switch (preset) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { from: start, to: now };
    }
    case 'week': {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { from: start, to: now };
    }
    case 'month': {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      return { from: start, to: now };
    }
    case 'all':
    default:
      return currentRange;
  }
}

/**
 * Date filter preset options for Select components
 */
export const DATE_FILTER_OPTIONS = [
  { value: 'all', label: 'كل الفترات' },
  { value: 'today', label: 'اليوم' },
  { value: 'week', label: 'هذا الأسبوع' },
  { value: 'month', label: 'هذا الشهر' },
] as const;

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * useFilterUtils - Unified filter management hook for data tables
 * 
 * Provides consistent filter state management, debounced search,
 * multi-select status/source/category filtering, and date range handling.
 * 
 * @example
 * ```tsx
 * const { filters, filteredData, dateRangeISO } = useFilterUtils({
 *   data: appointments,
 *   searchTerm: filters.searchTerm,
 *   searchFields: [
 *     (item) => item.fullName,
 *     (item) => item.phone,
 *     (item) => item.email,
 *   ],
 *   statusFilter: filters.statusFilter,
 *   getStatus: (item) => item.status,
 *   sourceFilter: filters.sourceFilter,
 *   getSource: (item) => item.source,
 *   categoryFilter: filters.categoryFilter,
 *   getCategory: (item) => item.doctorId?.toString(),
 * });
 * ```
 */
export function useFilterUtils<T>(
  config?: Partial<FilterConfig<T>>
): UseFilterUtilsReturn<T> {
  // ─── State ───────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterPreset>('all');
  const [dateRange, setDateRange] = useState<DateRange>(() => createDefaultDateRange(7));

  const debounceDelay = config?.debounceDelay ?? 500;
  const debouncedSearch = useDebounce(searchTerm, debounceDelay);

  // ─── Date Range ISO ──────────────────────────────────────────────────────
  const dateRangeISO = useMemo(() => ({
    dateFrom: dateRange.from.toISOString(),
    dateTo: dateRange.to.toISOString(),
  }), [dateRange]);

  // ─── Active Filter Count ─────────────────────────────────────────────────
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (debouncedSearch) count++;
    if (statusFilter.length > 0) count++;
    if (sourceFilter.length > 0) count++;
    if (categoryFilter.length > 0) count++;
    if (dateFilter !== 'all') count++;
    return count;
  }, [debouncedSearch, statusFilter, sourceFilter, categoryFilter, dateFilter]);

  // ─── Reset ───────────────────────────────────────────────────────────────
  const resetAll = useCallback(() => {
    setSearchTerm('');
    setStatusFilter([]);
    setSourceFilter([]);
    setCategoryFilter([]);
    setDateFilter('all');
    setDateRange(createDefaultDateRange(7));
  }, []);

  // ─── Filtering Logic ────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    const data = config?.data;
    if (!data) return [];

    let filtered = [...data];

    // Category filter (doctor, offer, camp, etc.)
    const catFilter = config?.categoryFilter ?? categoryFilter;
    const getCat = config?.getCategory;
    if (catFilter.length > 0 && getCat) {
      filtered = filtered.filter((item) => {
        const val = getCat(item);
        return val != null && catFilter.includes(val);
      });
    }

    // Source filter
    const srcFilter = config?.sourceFilter ?? sourceFilter;
    const getSrc = config?.getSource;
    if (srcFilter.length > 0 && getSrc) {
      filtered = filtered.filter((item) => {
        const val = getSrc(item);
        return val != null && srcFilter.includes(val);
      });
    }

    // Status filter
    const statFilter = config?.statusFilter ?? statusFilter;
    const getStat = config?.getStatus;
    if (statFilter.length > 0 && getStat) {
      filtered = filtered.filter((item) => {
        const val = getStat(item);
        return val != null && statFilter.includes(val);
      });
    }

    // Search filter (uses debounced value)
    const search = config?.searchTerm ?? debouncedSearch;
    const searchFields = config?.searchFields;
    if (search && searchFields && searchFields.length > 0) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter((item) =>
        searchFields.some((accessor) => {
          const val = accessor(item);
          return val != null && val.toLowerCase().includes(lowerSearch);
        })
      );
    }

    return filtered;
  }, [
    config?.data,
    config?.categoryFilter, categoryFilter, config?.getCategory,
    config?.sourceFilter, sourceFilter, config?.getSource,
    config?.statusFilter, statusFilter, config?.getStatus,
    config?.searchTerm, debouncedSearch, config?.searchFields,
  ]);

  // ─── Counts ──────────────────────────────────────────────────────────────
  const totalCount = config?.data?.length ?? 0;
  const filteredCount = filteredData.length;

  // ─── Filter State Object ─────────────────────────────────────────────────
  const filters: FilterState = useMemo(() => ({
    searchTerm,
    setSearchTerm,
    debouncedSearch,
    statusFilter,
    setStatusFilter,
    sourceFilter,
    setSourceFilter,
    categoryFilter,
    setCategoryFilter,
    dateFilter,
    setDateFilter,
    dateRange,
    setDateRange,
    resetAll,
    activeFilterCount,
  }), [
    searchTerm, debouncedSearch,
    statusFilter, sourceFilter, categoryFilter,
    dateFilter, dateRange,
    resetAll, activeFilterCount,
  ]);

  return {
    filters,
    filteredData,
    totalCount,
    filteredCount,
    dateRangeISO,
  };
}

/**
 * applyDefaultSort - Sort data by createdAt descending when no sort is active
 * Common pattern used across all booking pages
 */
export function applyDefaultSort<T>(
  data: T[],
  sortDirection: string | null | undefined,
  getCreatedAt: (item: T) => string | Date | null | undefined
): T[] {
  if (sortDirection) return data;
  
  return [...data].sort((a, b) => {
    const aDate = new Date(getCreatedAt(a) || 0).getTime();
    const bDate = new Date(getCreatedAt(b) || 0).getTime();
    return bDate - aDate;
  });
}
