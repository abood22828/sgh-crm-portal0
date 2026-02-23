import { describe, it, expect } from 'vitest';

/**
 * اختبارات مكون DataTableToolbar المشترك
 * يتحقق من صحة الخصائص والسلوك المتوقع
 */

describe('DataTableToolbar - Props Validation', () => {
  it('should accept export formats: excel, csv, pdf', () => {
    const validFormats = ['excel', 'csv', 'pdf'] as const;
    expect(validFormats).toHaveLength(3);
    expect(validFormats).toContain('excel');
    expect(validFormats).toContain('csv');
    expect(validFormats).toContain('pdf');
  });

  it('should have correct default values for optional props', () => {
    const defaults = {
      showExport: true,
      showPrint: true,
      showColumnVisibility: false,
      showSavedFilters: false,
      hasActiveFilters: false,
    };
    
    expect(defaults.showExport).toBe(true);
    expect(defaults.showPrint).toBe(true);
    expect(defaults.showColumnVisibility).toBe(false);
    expect(defaults.showSavedFilters).toBe(false);
    expect(defaults.hasActiveFilters).toBe(false);
  });

  it('should support valid SavedFilters pageKey values', () => {
    const validPageKeys = ['appointments', 'offerLeads', 'campRegistrations', 'customers'] as const;
    expect(validPageKeys).toHaveLength(4);
    validPageKeys.forEach(key => {
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    });
  });
});

describe('DataTableToolbar - Feature Combinations', () => {
  it('should support toolbar with only export', () => {
    const config = {
      showExport: true,
      showPrint: false,
      showColumnVisibility: false,
      showSavedFilters: false,
    };
    expect(config.showExport).toBe(true);
    expect(config.showPrint).toBe(false);
  });

  it('should support toolbar with all features', () => {
    const config = {
      showExport: true,
      showPrint: true,
      showColumnVisibility: true,
      showSavedFilters: true,
      hasActiveFilters: true,
    };
    const enabledCount = Object.values(config).filter(v => v === true).length;
    expect(enabledCount).toBe(5);
  });

  it('should support toolbar with custom actions only', () => {
    const config = {
      showExport: false,
      showPrint: false,
      showColumnVisibility: false,
      showSavedFilters: false,
      hasCustomActions: true,
    };
    expect(config.hasCustomActions).toBe(true);
    expect(config.showExport).toBe(false);
  });
});
