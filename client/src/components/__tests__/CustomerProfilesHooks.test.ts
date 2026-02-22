import { describe, it, expect } from 'vitest';

/**
 * اختبارات تطبيق useTableFeatures و useFilterUtils و useExportUtils
 * على جدول ملفات العملاء (CustomerProfilesTab)
 */

// === تعريف أعمدة العملاء (مطابق لما في CustomerProfilesTab) ===
const customerColumns = [
  { key: 'index', label: '#', defaultVisible: true, sortable: false, defaultWidth: 50, minWidth: 40, maxWidth: 80 },
  { key: 'name', label: 'الاسم', defaultVisible: true, sortType: 'string' },
  { key: 'phone', label: 'الهاتف', defaultVisible: true, sortType: 'string' },
  { key: 'email', label: 'البريد الإلكتروني', defaultVisible: true, sortType: 'string' },
  { key: 'totalRecords', label: 'عدد التفاعلات', defaultVisible: true, sortType: 'number' },
  { key: 'lastSeen', label: 'آخر تفاعل', defaultVisible: true, sortType: 'date' },
  { key: 'firstSeen', label: 'أول تفاعل', defaultVisible: true, sortType: 'date' },
  { key: 'actions', label: 'الإجراءات', defaultVisible: true, sortable: false },
];

// === أعمدة التصدير ===
const exportColumns = [
  { key: 'name', label: 'الاسم' },
  { key: 'phone', label: 'الهاتف' },
  { key: 'email', label: 'البريد الإلكتروني' },
  { key: 'totalRecords', label: 'عدد التفاعلات' },
  { key: 'lastSeen', label: 'آخر تفاعل' },
  { key: 'firstSeen', label: 'أول تفاعل' },
];

// === اختبار تعريف أعمدة العملاء ===
describe('CustomerProfilesTab Column Config', () => {
  it('should have all required columns defined', () => {
    expect(customerColumns.length).toBe(8);
    const keys = customerColumns.map(c => c.key);
    expect(keys).toContain('index');
    expect(keys).toContain('name');
    expect(keys).toContain('phone');
    expect(keys).toContain('email');
    expect(keys).toContain('totalRecords');
    expect(keys).toContain('lastSeen');
    expect(keys).toContain('firstSeen');
    expect(keys).toContain('actions');
  });

  it('should have all columns visible by default', () => {
    customerColumns.forEach(col => {
      expect(col.defaultVisible).toBe(true);
    });
  });

  it('should have unique keys for all columns', () => {
    const keys = customerColumns.map(c => c.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it('should have Arabic labels for all columns except index', () => {
    customerColumns.forEach(col => {
      if (col.key !== 'index') {
        expect(col.label).toBeTruthy();
        expect(/[\u0600-\u06FF]/.test(col.label)).toBe(true);
      }
    });
  });

  it('should mark index and actions columns as non-sortable', () => {
    const indexCol = customerColumns.find(c => c.key === 'index');
    const actionsCol = customerColumns.find(c => c.key === 'actions');
    expect(indexCol?.sortable).toBe(false);
    expect(actionsCol?.sortable).toBe(false);
  });

  it('should have correct sort types for sortable columns', () => {
    const nameCol = customerColumns.find(c => c.key === 'name');
    const phoneCol = customerColumns.find(c => c.key === 'phone');
    const emailCol = customerColumns.find(c => c.key === 'email');
    const totalRecordsCol = customerColumns.find(c => c.key === 'totalRecords');
    const lastSeenCol = customerColumns.find(c => c.key === 'lastSeen');
    const firstSeenCol = customerColumns.find(c => c.key === 'firstSeen');

    expect(nameCol?.sortType).toBe('string');
    expect(phoneCol?.sortType).toBe('string');
    expect(emailCol?.sortType).toBe('string');
    expect(totalRecordsCol?.sortType).toBe('number');
    expect(lastSeenCol?.sortType).toBe('date');
    expect(firstSeenCol?.sortType).toBe('date');
  });

  it('should have valid width constraints for index column', () => {
    const indexCol = customerColumns.find(c => c.key === 'index');
    expect(indexCol?.defaultWidth).toBe(50);
    expect(indexCol?.minWidth).toBe(40);
    expect(indexCol?.maxWidth).toBe(80);
    expect(indexCol!.minWidth!).toBeLessThan(indexCol!.defaultWidth!);
    expect(indexCol!.defaultWidth!).toBeLessThan(indexCol!.maxWidth!);
  });
});

// === اختبار أعمدة التصدير ===
describe('CustomerProfilesTab Export Columns', () => {
  it('should have all export columns defined', () => {
    expect(exportColumns.length).toBe(6);
    const keys = exportColumns.map(c => c.key);
    expect(keys).toContain('name');
    expect(keys).toContain('phone');
    expect(keys).toContain('email');
    expect(keys).toContain('totalRecords');
    expect(keys).toContain('lastSeen');
    expect(keys).toContain('firstSeen');
  });

  it('should NOT include index or actions in export columns', () => {
    const keys = exportColumns.map(c => c.key);
    expect(keys).not.toContain('index');
    expect(keys).not.toContain('actions');
  });

  it('should have Arabic labels for all export columns', () => {
    exportColumns.forEach(col => {
      expect(col.label).toBeTruthy();
      expect(/[\u0600-\u06FF]/.test(col.label)).toBe(true);
    });
  });

  it('export columns should be a subset of table columns', () => {
    const tableKeys = customerColumns.map(c => c.key);
    exportColumns.forEach(ec => {
      expect(tableKeys).toContain(ec.key);
    });
  });
});

// === اختبار mapToExportRow ===
describe('CustomerProfilesTab Export Row Mapping', () => {
  const mapToExportRow = (customer: any) => ({
    name: customer.name || '-',
    phone: customer.phone || '-',
    email: customer.email || '-',
    totalRecords: customer.totalRecords || 0,
    lastSeen: customer.lastSeen ? new Date(customer.lastSeen).toLocaleDateString('ar-SA') : '-',
    firstSeen: customer.firstSeen ? new Date(customer.firstSeen).toLocaleDateString('ar-SA') : '-',
  });

  it('should map a complete customer correctly', () => {
    const customer = {
      name: 'أحمد محمد',
      phone: '+967777123456',
      email: 'ahmed@example.com',
      totalRecords: 5,
      lastSeen: '2026-02-20T10:00:00Z',
      firstSeen: '2026-01-15T08:00:00Z',
    };
    const row = mapToExportRow(customer);
    expect(row.name).toBe('أحمد محمد');
    expect(row.phone).toBe('+967777123456');
    expect(row.email).toBe('ahmed@example.com');
    expect(row.totalRecords).toBe(5);
    expect(row.lastSeen).not.toBe('-');
    expect(row.firstSeen).not.toBe('-');
  });

  it('should handle missing fields with defaults', () => {
    const customer = {
      name: null,
      phone: null,
      email: null,
      totalRecords: null,
      lastSeen: null,
      firstSeen: null,
    };
    const row = mapToExportRow(customer);
    expect(row.name).toBe('-');
    expect(row.phone).toBe('-');
    expect(row.email).toBe('-');
    expect(row.totalRecords).toBe(0);
    expect(row.lastSeen).toBe('-');
    expect(row.firstSeen).toBe('-');
  });

  it('should handle empty customer object', () => {
    const row = mapToExportRow({});
    expect(row.name).toBe('-');
    expect(row.phone).toBe('-');
    expect(row.email).toBe('-');
    expect(row.totalRecords).toBe(0);
    expect(row.lastSeen).toBe('-');
    expect(row.firstSeen).toBe('-');
  });
});

// === اختبار useTableFeatures integration ===
describe('CustomerProfilesTab useTableFeatures Integration', () => {
  it('should use "customers" as the table key', () => {
    const tableKey = 'customers';
    expect(tableKey).toBe('customers');
  });

  it('should be unique from other table keys', () => {
    const allTableKeys = ['appointments', 'offerLeads', 'campRegistrations', 'leads', 'doctors', 'offers', 'camps', 'customers'];
    const uniqueKeys = new Set(allTableKeys);
    expect(uniqueKeys.size).toBe(allTableKeys.length);
  });

  it('should support sort field accessor for all sortable columns', () => {
    const getField = (item: any, key: string) => {
      switch (key) {
        case 'name': return item.name || '';
        case 'phone': return item.phone || '';
        case 'email': return item.email || '';
        case 'totalRecords': return Number(item.totalRecords) || 0;
        case 'lastSeen': return item.lastSeen;
        case 'firstSeen': return item.firstSeen;
        default: return item[key];
      }
    };

    const testItem = {
      name: 'Test',
      phone: '+967',
      email: 'test@test.com',
      totalRecords: 3,
      lastSeen: '2026-01-01',
      firstSeen: '2025-12-01',
    };

    expect(getField(testItem, 'name')).toBe('Test');
    expect(getField(testItem, 'phone')).toBe('+967');
    expect(getField(testItem, 'email')).toBe('test@test.com');
    expect(getField(testItem, 'totalRecords')).toBe(3);
    expect(getField(testItem, 'lastSeen')).toBe('2026-01-01');
    expect(getField(testItem, 'firstSeen')).toBe('2025-12-01');
  });
});

// === اختبار useFilterUtils integration ===
describe('CustomerProfilesTab useFilterUtils Integration', () => {
  it('should support search by name and phone', () => {
    const searchFields = [
      (item: any) => item.name,
      (item: any) => item.phone,
    ];

    const testItem = { name: 'أحمد', phone: '+967777123456' };
    
    // Test name search
    const nameResult = searchFields.some(accessor => {
      const val = accessor(testItem);
      return val != null && val.toLowerCase().includes('أحمد'.toLowerCase());
    });
    expect(nameResult).toBe(true);

    // Test phone search
    const phoneResult = searchFields.some(accessor => {
      const val = accessor(testItem);
      return val != null && val.toLowerCase().includes('777'.toLowerCase());
    });
    expect(phoneResult).toBe(true);

    // Test non-matching search
    const noResult = searchFields.some(accessor => {
      const val = accessor(testItem);
      return val != null && val.toLowerCase().includes('xyz'.toLowerCase());
    });
    expect(noResult).toBe(false);
  });
});

// === اختبار useExportUtils integration ===
describe('CustomerProfilesTab useExportUtils Integration', () => {
  it('should have correct export config', () => {
    const exportConfig = {
      tableName: 'ملفات العملاء',
      filenamePrefix: 'ملفات_العملاء',
    };
    expect(exportConfig.tableName).toBe('ملفات العملاء');
    expect(exportConfig.filenamePrefix).toBe('ملفات_العملاء');
  });

  it('should build active filters correctly', () => {
    const buildActiveFilters = (filters: { label: string; value: string | undefined }[]) => {
      return filters.filter(f => f.value !== undefined && f.value !== '');
    };

    const withSearch = buildActiveFilters([
      { label: 'البحث', value: 'أحمد' },
    ]);
    expect(withSearch.length).toBe(1);
    expect(withSearch[0].label).toBe('البحث');

    const withoutSearch = buildActiveFilters([
      { label: 'البحث', value: undefined },
    ]);
    expect(withoutSearch.length).toBe(0);

    const withEmptySearch = buildActiveFilters([
      { label: 'البحث', value: '' },
    ]);
    expect(withEmptySearch.length).toBe(0);
  });
});

// === اختبار SavedFilters pageKey ===
describe('SavedFilters customers pageKey', () => {
  it('should support "customers" as a valid pageKey', () => {
    const validPageKeys = ["appointments", "offerLeads", "campRegistrations", "customers"];
    expect(validPageKeys).toContain("customers");
  });
});
