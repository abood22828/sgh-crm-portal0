import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useFilterUtils,
  createDefaultDateRange,
  applyDatePreset,
  applyDefaultSort,
  DATE_FILTER_OPTIONS,
} from '../useFilterUtils';

// Mock useDebounce to return value immediately for testing
vi.mock('../useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

describe('useFilterUtils', () => {
  // ─── Helper Functions ─────────────────────────────────────────────────

  describe('createDefaultDateRange', () => {
    it('should create a date range with default 7 days back', () => {
      const range = createDefaultDateRange();
      const now = new Date();
      const diffMs = now.getTime() - range.from.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(7);
      expect(range.to.getTime()).toBeLessThanOrEqual(now.getTime());
    });

    it('should create a date range with custom days back', () => {
      const range = createDefaultDateRange(30);
      const now = new Date();
      const diffMs = now.getTime() - range.from.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(30);
    });
  });

  describe('applyDatePreset', () => {
    const currentRange = createDefaultDateRange();

    it('should return current range for "all" preset', () => {
      const result = applyDatePreset('all', currentRange);
      expect(result).toBe(currentRange);
    });

    it('should return today range for "today" preset', () => {
      const result = applyDatePreset('today', currentRange);
      const now = new Date();
      expect(result.from.getDate()).toBe(now.getDate());
      expect(result.from.getHours()).toBe(0);
      expect(result.from.getMinutes()).toBe(0);
    });

    it('should return week range for "week" preset', () => {
      const result = applyDatePreset('week', currentRange);
      const now = new Date();
      const diffMs = now.getTime() - result.from.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(7);
    });

    it('should return month range for "month" preset', () => {
      const result = applyDatePreset('month', currentRange);
      const now = new Date();
      const diffMs = now.getTime() - result.from.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      expect(diffDays).toBeGreaterThanOrEqual(28);
      expect(diffDays).toBeLessThanOrEqual(31);
    });
  });

  describe('DATE_FILTER_OPTIONS', () => {
    it('should have 4 options', () => {
      expect(DATE_FILTER_OPTIONS).toHaveLength(4);
    });

    it('should include all, today, week, month', () => {
      const values = DATE_FILTER_OPTIONS.map(o => o.value);
      expect(values).toContain('all');
      expect(values).toContain('today');
      expect(values).toContain('week');
      expect(values).toContain('month');
    });
  });

  describe('applyDefaultSort', () => {
    const items = [
      { id: 1, createdAt: '2024-01-01' },
      { id: 2, createdAt: '2024-03-01' },
      { id: 3, createdAt: '2024-02-01' },
    ];

    it('should sort by createdAt descending when no sort direction', () => {
      const sorted = applyDefaultSort(items, null, (item) => item.createdAt);
      expect(sorted[0].id).toBe(2);
      expect(sorted[1].id).toBe(3);
      expect(sorted[2].id).toBe(1);
    });

    it('should return data as-is when sort direction is active', () => {
      const sorted = applyDefaultSort(items, 'asc', (item) => item.createdAt);
      expect(sorted[0].id).toBe(1);
      expect(sorted[1].id).toBe(2);
      expect(sorted[2].id).toBe(3);
    });
  });

  // ─── Hook Tests ───────────────────────────────────────────────────────

  describe('useFilterUtils hook', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useFilterUtils());

      expect(result.current.filters.searchTerm).toBe('');
      expect(result.current.filters.statusFilter).toEqual([]);
      expect(result.current.filters.sourceFilter).toEqual([]);
      expect(result.current.filters.categoryFilter).toEqual([]);
      expect(result.current.filters.dateFilter).toBe('all');
      expect(result.current.filters.activeFilterCount).toBe(0);
    });

    it('should update search term', () => {
      const { result } = renderHook(() => useFilterUtils());

      act(() => {
        result.current.filters.setSearchTerm('test');
      });

      expect(result.current.filters.searchTerm).toBe('test');
    });

    it('should update status filter', () => {
      const { result } = renderHook(() => useFilterUtils());

      act(() => {
        result.current.filters.setStatusFilter(['pending', 'confirmed']);
      });

      expect(result.current.filters.statusFilter).toEqual(['pending', 'confirmed']);
    });

    it('should update source filter', () => {
      const { result } = renderHook(() => useFilterUtils());

      act(() => {
        result.current.filters.setSourceFilter(['website', 'instagram']);
      });

      expect(result.current.filters.sourceFilter).toEqual(['website', 'instagram']);
    });

    it('should update category filter', () => {
      const { result } = renderHook(() => useFilterUtils());

      act(() => {
        result.current.filters.setCategoryFilter(['1', '2']);
      });

      expect(result.current.filters.categoryFilter).toEqual(['1', '2']);
    });

    it('should update date filter', () => {
      const { result } = renderHook(() => useFilterUtils());

      act(() => {
        result.current.filters.setDateFilter('today');
      });

      expect(result.current.filters.dateFilter).toBe('today');
    });

    it('should count active filters correctly', () => {
      const { result } = renderHook(() => useFilterUtils());

      act(() => {
        result.current.filters.setSearchTerm('test');
        result.current.filters.setStatusFilter(['pending']);
        result.current.filters.setDateFilter('week');
      });

      expect(result.current.filters.activeFilterCount).toBe(3);
    });

    it('should reset all filters', () => {
      const { result } = renderHook(() => useFilterUtils());

      act(() => {
        result.current.filters.setSearchTerm('test');
        result.current.filters.setStatusFilter(['pending']);
        result.current.filters.setSourceFilter(['website']);
        result.current.filters.setCategoryFilter(['1']);
        result.current.filters.setDateFilter('today');
      });

      act(() => {
        result.current.filters.resetAll();
      });

      expect(result.current.filters.searchTerm).toBe('');
      expect(result.current.filters.statusFilter).toEqual([]);
      expect(result.current.filters.sourceFilter).toEqual([]);
      expect(result.current.filters.categoryFilter).toEqual([]);
      expect(result.current.filters.dateFilter).toBe('all');
      expect(result.current.filters.activeFilterCount).toBe(0);
    });

    it('should provide dateRangeISO', () => {
      const { result } = renderHook(() => useFilterUtils());

      expect(result.current.dateRangeISO.dateFrom).toBeDefined();
      expect(result.current.dateRangeISO.dateTo).toBeDefined();
      expect(typeof result.current.dateRangeISO.dateFrom).toBe('string');
      expect(typeof result.current.dateRangeISO.dateTo).toBe('string');
    });
  });

  // ─── Filtering Logic Tests ────────────────────────────────────────────

  describe('useFilterUtils filtering', () => {
    const testData = [
      { id: 1, name: 'أحمد محمد', phone: '777111222', status: 'pending', source: 'website', category: 'cat1' },
      { id: 2, name: 'سارة علي', phone: '777333444', status: 'confirmed', source: 'instagram', category: 'cat2' },
      { id: 3, name: 'محمد خالد', phone: '777555666', status: 'pending', source: 'website', category: 'cat1' },
      { id: 4, name: 'فاطمة أحمد', phone: '777777888', status: 'cancelled', source: 'facebook', category: 'cat3' },
    ];

    it('should filter by search term', () => {
      const { result } = renderHook(() =>
        useFilterUtils({
          data: testData,
          searchTerm: 'أحمد',
          searchFields: [(item: any) => item.name],
          statusFilter: [],
          sourceFilter: [],
        })
      );

      expect(result.current.filteredData).toHaveLength(2);
      expect(result.current.filteredData.map((d: any) => d.id)).toContain(1);
      expect(result.current.filteredData.map((d: any) => d.id)).toContain(4);
    });

    it('should filter by status', () => {
      const { result } = renderHook(() =>
        useFilterUtils({
          data: testData,
          searchTerm: '',
          searchFields: [],
          statusFilter: ['pending'],
          getStatus: (item: any) => item.status,
          sourceFilter: [],
        })
      );

      expect(result.current.filteredData).toHaveLength(2);
    });

    it('should filter by source', () => {
      const { result } = renderHook(() =>
        useFilterUtils({
          data: testData,
          searchTerm: '',
          searchFields: [],
          statusFilter: [],
          sourceFilter: ['instagram'],
          getSource: (item: any) => item.source,
        })
      );

      expect(result.current.filteredData).toHaveLength(1);
      expect((result.current.filteredData[0] as any).id).toBe(2);
    });

    it('should filter by category', () => {
      const { result } = renderHook(() =>
        useFilterUtils({
          data: testData,
          searchTerm: '',
          searchFields: [],
          statusFilter: [],
          sourceFilter: [],
          categoryFilter: ['cat1'],
          getCategory: (item: any) => item.category,
        })
      );

      expect(result.current.filteredData).toHaveLength(2);
    });

    it('should combine multiple filters', () => {
      const { result } = renderHook(() =>
        useFilterUtils({
          data: testData,
          searchTerm: '',
          searchFields: [],
          statusFilter: ['pending'],
          getStatus: (item: any) => item.status,
          sourceFilter: ['website'],
          getSource: (item: any) => item.source,
        })
      );

      expect(result.current.filteredData).toHaveLength(2);
      expect(result.current.filteredData.every((d: any) => d.status === 'pending' && d.source === 'website')).toBe(true);
    });

    it('should return all data when no filters are active', () => {
      const { result } = renderHook(() =>
        useFilterUtils({
          data: testData,
          searchTerm: '',
          searchFields: [],
          statusFilter: [],
          sourceFilter: [],
        })
      );

      expect(result.current.filteredData).toHaveLength(4);
      expect(result.current.totalCount).toBe(4);
      expect(result.current.filteredCount).toBe(4);
    });

    it('should return empty array when data is undefined', () => {
      const { result } = renderHook(() => useFilterUtils());

      expect(result.current.filteredData).toEqual([]);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.filteredCount).toBe(0);
    });

    it('should track total and filtered counts', () => {
      const { result } = renderHook(() =>
        useFilterUtils({
          data: testData,
          searchTerm: '',
          searchFields: [],
          statusFilter: ['pending'],
          getStatus: (item: any) => item.status,
          sourceFilter: [],
        })
      );

      expect(result.current.totalCount).toBe(4);
      expect(result.current.filteredCount).toBe(2);
    });
  });
});
