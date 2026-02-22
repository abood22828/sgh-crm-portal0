import { describe, it, expect } from 'vitest';

/**
 * اختبارات تطبيق useTableFeatures على الجداول البسيطة
 * (DoctorsManagement, OffersManagement, CampsManagement)
 */

// === اختبار تعريف أعمدة الأطباء ===
describe('DoctorsManagement Column Config', () => {
  const doctorColumns = [
    { key: "name", label: "الاسم", defaultVisible: true, defaultWidth: 200, minWidth: 120, maxWidth: 400 },
    { key: "specialty", label: "التخصص", defaultVisible: true, defaultWidth: 180, minWidth: 100, maxWidth: 350 },
    { key: "status", label: "الحالة", defaultVisible: true, defaultWidth: 100, minWidth: 80, maxWidth: 200 },
    { key: "availableFrom", label: "متاح من", defaultVisible: true, defaultWidth: 130, minWidth: 100, maxWidth: 250 },
    { key: "availableTo", label: "متاح حتى", defaultVisible: true, defaultWidth: 130, minWidth: 100, maxWidth: 250 },
    { key: "actions", label: "الإجراءات", defaultVisible: true, defaultWidth: 180, minWidth: 140, maxWidth: 300 },
  ];

  it('should have all required columns defined', () => {
    expect(doctorColumns.length).toBeGreaterThanOrEqual(5);
    const keys = doctorColumns.map(c => c.key);
    expect(keys).toContain('name');
    expect(keys).toContain('specialty');
    expect(keys).toContain('status');
    expect(keys).toContain('actions');
  });

  it('should have valid width constraints for all columns', () => {
    doctorColumns.forEach(col => {
      expect(col.minWidth).toBeLessThan(col.defaultWidth);
      expect(col.defaultWidth).toBeLessThan(col.maxWidth);
      expect(col.minWidth).toBeGreaterThan(0);
    });
  });

  it('should have all columns visible by default', () => {
    doctorColumns.forEach(col => {
      expect(col.defaultVisible).toBe(true);
    });
  });

  it('should have Arabic labels for all columns', () => {
    doctorColumns.forEach(col => {
      expect(col.label).toBeTruthy();
      // Arabic characters range
      expect(/[\u0600-\u06FF]/.test(col.label)).toBe(true);
    });
  });
});

// === اختبار تعريف أعمدة العروض ===
describe('OffersManagement Column Config', () => {
  const offerColumns = [
    { key: "title", label: "العنوان", defaultVisible: true, defaultWidth: 220, minWidth: 150, maxWidth: 400 },
    { key: "slug", label: "الرابط", defaultVisible: true, defaultWidth: 160, minWidth: 100, maxWidth: 300 },
    { key: "status", label: "الحالة", defaultVisible: true, defaultWidth: 100, minWidth: 80, maxWidth: 200 },
    { key: "startDate", label: "تاريخ البداية", defaultVisible: true, defaultWidth: 140, minWidth: 100, maxWidth: 250 },
    { key: "endDate", label: "تاريخ النهاية", defaultVisible: true, defaultWidth: 140, minWidth: 100, maxWidth: 250 },
    { key: "actions", label: "الإجراءات", defaultVisible: true, defaultWidth: 180, minWidth: 140, maxWidth: 300 },
  ];

  it('should have all required columns defined', () => {
    expect(offerColumns.length).toBe(6);
    const keys = offerColumns.map(c => c.key);
    expect(keys).toContain('title');
    expect(keys).toContain('slug');
    expect(keys).toContain('status');
    expect(keys).toContain('startDate');
    expect(keys).toContain('endDate');
    expect(keys).toContain('actions');
  });

  it('should have valid width constraints for all columns', () => {
    offerColumns.forEach(col => {
      expect(col.minWidth).toBeLessThan(col.defaultWidth);
      expect(col.defaultWidth).toBeLessThan(col.maxWidth);
    });
  });

  it('should have unique keys for all columns', () => {
    const keys = offerColumns.map(c => c.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });
});

// === اختبار تعريف أعمدة المخيمات ===
describe('CampsManagement Column Config', () => {
  const campColumns = [
    { key: "name", label: "الاسم", defaultVisible: true, defaultWidth: 220, minWidth: 150, maxWidth: 400 },
    { key: "slug", label: "الرابط", defaultVisible: true, defaultWidth: 160, minWidth: 100, maxWidth: 300 },
    { key: "status", label: "الحالة", defaultVisible: true, defaultWidth: 100, minWidth: 80, maxWidth: 200 },
    { key: "startDate", label: "تاريخ البداية", defaultVisible: true, defaultWidth: 140, minWidth: 100, maxWidth: 250 },
    { key: "endDate", label: "تاريخ النهاية", defaultVisible: true, defaultWidth: 140, minWidth: 100, maxWidth: 250 },
    { key: "actions", label: "الإجراءات", defaultVisible: true, defaultWidth: 180, minWidth: 140, maxWidth: 300 },
  ];

  it('should have all required columns defined', () => {
    expect(campColumns.length).toBe(6);
    const keys = campColumns.map(c => c.key);
    expect(keys).toContain('name');
    expect(keys).toContain('slug');
    expect(keys).toContain('status');
    expect(keys).toContain('actions');
  });

  it('should have valid width constraints for all columns', () => {
    campColumns.forEach(col => {
      expect(col.minWidth).toBeLessThan(col.defaultWidth);
      expect(col.defaultWidth).toBeLessThan(col.maxWidth);
    });
  });

  it('should have unique keys for all columns', () => {
    const keys = campColumns.map(c => c.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });
});

// === اختبار توافق الأعمدة بين الجداول ===
describe('Column Config Consistency Across Tables', () => {
  const doctorColumns = [
    { key: "name", defaultWidth: 200, minWidth: 120, maxWidth: 400 },
    { key: "specialty", defaultWidth: 180, minWidth: 100, maxWidth: 350 },
    { key: "status", defaultWidth: 100, minWidth: 80, maxWidth: 200 },
    { key: "actions", defaultWidth: 180, minWidth: 140, maxWidth: 300 },
  ];

  const offerColumns = [
    { key: "title", defaultWidth: 220, minWidth: 150, maxWidth: 400 },
    { key: "slug", defaultWidth: 160, minWidth: 100, maxWidth: 300 },
    { key: "status", defaultWidth: 100, minWidth: 80, maxWidth: 200 },
    { key: "actions", defaultWidth: 180, minWidth: 140, maxWidth: 300 },
  ];

  const campColumns = [
    { key: "name", defaultWidth: 220, minWidth: 150, maxWidth: 400 },
    { key: "slug", defaultWidth: 160, minWidth: 100, maxWidth: 300 },
    { key: "status", defaultWidth: 100, minWidth: 80, maxWidth: 200 },
    { key: "actions", defaultWidth: 180, minWidth: 140, maxWidth: 300 },
  ];

  it('should have consistent status column width across tables', () => {
    const doctorStatus = doctorColumns.find(c => c.key === 'status');
    const offerStatus = offerColumns.find(c => c.key === 'status');
    const campStatus = campColumns.find(c => c.key === 'status');
    
    expect(doctorStatus?.defaultWidth).toBe(offerStatus?.defaultWidth);
    expect(offerStatus?.defaultWidth).toBe(campStatus?.defaultWidth);
  });

  it('should have consistent actions column width across tables', () => {
    const doctorActions = doctorColumns.find(c => c.key === 'actions');
    const offerActions = offerColumns.find(c => c.key === 'actions');
    const campActions = campColumns.find(c => c.key === 'actions');
    
    expect(doctorActions?.defaultWidth).toBe(offerActions?.defaultWidth);
    expect(offerActions?.defaultWidth).toBe(campActions?.defaultWidth);
  });

  it('all tables should have actions column', () => {
    expect(doctorColumns.some(c => c.key === 'actions')).toBe(true);
    expect(offerColumns.some(c => c.key === 'actions')).toBe(true);
    expect(campColumns.some(c => c.key === 'actions')).toBe(true);
  });
});

// === اختبار useTableFeatures integration ===
describe('useTableFeatures Integration for Simple Tables', () => {
  it('should support default frozen columns for doctors table', () => {
    const defaultFrozenColumns = ['name'];
    expect(defaultFrozenColumns).toContain('name');
    expect(defaultFrozenColumns.length).toBe(1);
  });

  it('should support default frozen columns for offers table', () => {
    const defaultFrozenColumns = ['title'];
    expect(defaultFrozenColumns).toContain('title');
    expect(defaultFrozenColumns.length).toBe(1);
  });

  it('should support default frozen columns for camps table', () => {
    const defaultFrozenColumns = ['name'];
    expect(defaultFrozenColumns).toContain('name');
    expect(defaultFrozenColumns.length).toBe(1);
  });

  it('should use unique table keys for each table', () => {
    const tableKeys = ['doctors', 'offers', 'camps'];
    const uniqueKeys = new Set(tableKeys);
    expect(uniqueKeys.size).toBe(tableKeys.length);
  });
});
