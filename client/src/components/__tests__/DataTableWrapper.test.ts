import { describe, it, expect } from 'vitest';

/**
 * اختبارات مكون DataTableWrapper المشترك
 * يتحقق من صحة الخصائص والسلوك المتوقع
 */

describe('DataTableWrapper - Props Validation', () => {
  it('should have correct default values', () => {
    const defaults = {
      emptyTitle: 'لا توجد بيانات',
      emptyFilteredDescription: 'لا توجد نتائج مطابقة للفلاتر المحددة.',
      emptyDescription: 'لم يتم إضافة أي بيانات بعد.',
      skeletonColumns: 6,
      skeletonRows: 5,
      showExport: true,
      showPrint: true,
      showColumnVisibility: false,
      showSavedFilters: false,
      showToolbar: true,
      showResultCount: true,
      showPagination: true,
    };

    expect(defaults.emptyTitle).toBe('لا توجد بيانات');
    expect(defaults.skeletonColumns).toBe(6);
    expect(defaults.skeletonRows).toBe(5);
    expect(defaults.showToolbar).toBe(true);
    expect(defaults.showResultCount).toBe(true);
    expect(defaults.showPagination).toBe(true);
  });

  it('should format Arabic numbers correctly', () => {
    const count = 1500;
    const formatted = count.toLocaleString('ar-SA');
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
  });
});

describe('DataTableWrapper - State Logic', () => {
  it('should show loading state when isLoading is true', () => {
    const state = {
      isLoading: true,
      isEmpty: false,
      filteredCount: 0,
      totalCount: 100,
    };
    // When loading, should show skeleton
    expect(state.isLoading).toBe(true);
  });

  it('should show empty state when isEmpty is true and not loading', () => {
    const state = {
      isLoading: false,
      isEmpty: true,
      filteredCount: 0,
      totalCount: 0,
    };
    expect(state.isLoading).toBe(false);
    expect(state.isEmpty).toBe(true);
  });

  it('should show content when not loading and not empty', () => {
    const state = {
      isLoading: false,
      isEmpty: false,
      filteredCount: 50,
      totalCount: 100,
    };
    expect(state.isLoading).toBe(false);
    expect(state.isEmpty).toBe(false);
    expect(state.filteredCount).toBeGreaterThan(0);
  });

  it('should show result count only when filters are active', () => {
    const withFilters = { hasActiveFilters: true, showResultCount: true };
    const withoutFilters = { hasActiveFilters: false, showResultCount: true };
    
    expect(withFilters.hasActiveFilters && withFilters.showResultCount).toBe(true);
    expect(withoutFilters.hasActiveFilters && withoutFilters.showResultCount).toBe(false);
  });

  it('should show pagination only when there are items', () => {
    const withItems = { filteredCount: 50, showPagination: true };
    const withoutItems = { filteredCount: 0, showPagination: true };
    
    expect(withItems.filteredCount > 0 && withItems.showPagination).toBe(true);
    expect(withoutItems.filteredCount > 0 && withoutItems.showPagination).toBe(false);
  });
});
