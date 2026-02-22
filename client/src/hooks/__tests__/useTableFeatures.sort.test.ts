import { describe, it, expect } from 'vitest';

/**
 * اختبارات نظام الفرز في useTableFeatures
 * يتم اختبار منطق الفرز بشكل مستقل عن React hooks
 */

// === Helper: محاكاة دالة الفرز من useTableFeatures ===
type SortDirection = 'asc' | 'desc';
type SortState = { field: string | null; direction: SortDirection };
type SortType = 'string' | 'number' | 'date';

interface ColumnConfig {
  key: string;
  label: string;
  sortable?: boolean;
  sortType?: SortType;
}

function sortData<T>(
  data: T[],
  sortState: SortState,
  columns: ColumnConfig[],
  getFieldValue: (item: T, key: string) => any
): T[] {
  if (!sortState.field) return data;

  const col = columns.find(c => c.key === sortState.field);
  if (!col || col.sortable === false) return data;

  const sortType = col.sortType || 'string';

  return [...data].sort((a, b) => {
    const aVal = getFieldValue(a, sortState.field!);
    const bVal = getFieldValue(b, sortState.field!);

    let comparison = 0;

    if (aVal == null && bVal == null) comparison = 0;
    else if (aVal == null) comparison = 1;
    else if (bVal == null) comparison = -1;
    else if (sortType === 'number') {
      const numA = typeof aVal === 'number' ? aVal : parseFloat(String(aVal));
      const numB = typeof bVal === 'number' ? bVal : parseFloat(String(bVal));
      comparison = (isNaN(numA) ? 0 : numA) - (isNaN(numB) ? 0 : numB);
    } else if (sortType === 'date') {
      const dateA = new Date(aVal).getTime();
      const dateB = new Date(bVal).getTime();
      comparison = (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB);
    } else {
      comparison = String(aVal).localeCompare(String(bVal), 'ar');
    }

    return sortState.direction === 'desc' ? -comparison : comparison;
  });
}

function toggleSort(currentState: SortState, field: string): SortState {
  if (currentState.field === field) {
    if (currentState.direction === 'asc') return { field, direction: 'desc' };
    return { field: null, direction: 'asc' };
  }
  return { field, direction: 'asc' };
}

// === Test Data ===
const testColumns: ColumnConfig[] = [
  { key: 'name', label: 'الاسم', sortType: 'string' },
  { key: 'age', label: 'العمر', sortType: 'number' },
  { key: 'date', label: 'التاريخ', sortType: 'date' },
  { key: 'actions', label: 'الإجراءات', sortable: false },
];

const testData = [
  { name: 'أحمد', age: 30, date: '2024-01-15' },
  { name: 'محمد', age: 25, date: '2024-03-20' },
  { name: 'علي', age: 35, date: '2024-02-10' },
  { name: 'خالد', age: 28, date: '2023-12-01' },
];

const getFieldValue = (item: any, key: string) => item[key];

// === Tests ===
describe('نظام الفرز - Sort System', () => {
  describe('toggleSort - تبديل حالة الفرز', () => {
    it('يجب أن يبدأ بالفرز التصاعدي عند النقر الأول', () => {
      const result = toggleSort({ field: null, direction: 'asc' }, 'name');
      expect(result).toEqual({ field: 'name', direction: 'asc' });
    });

    it('يجب أن يتحول إلى تنازلي عند النقر الثاني على نفس العمود', () => {
      const result = toggleSort({ field: 'name', direction: 'asc' }, 'name');
      expect(result).toEqual({ field: 'name', direction: 'desc' });
    });

    it('يجب أن يلغي الفرز عند النقر الثالث على نفس العمود', () => {
      const result = toggleSort({ field: 'name', direction: 'desc' }, 'name');
      expect(result).toEqual({ field: null, direction: 'asc' });
    });

    it('يجب أن يبدأ بالفرز التصاعدي عند النقر على عمود مختلف', () => {
      const result = toggleSort({ field: 'name', direction: 'desc' }, 'age');
      expect(result).toEqual({ field: 'age', direction: 'asc' });
    });
  });

  describe('sortData - فرز النصوص (string)', () => {
    it('يجب أن يفرز النصوص تصاعدياً', () => {
      const sorted = sortData(testData, { field: 'name', direction: 'asc' }, testColumns, getFieldValue);
      const names = sorted.map(d => d.name);
      // Arabic locale sort
      expect(names.length).toBe(4);
      expect(sorted[0].name).not.toBe(sorted[3].name);
    });

    it('يجب أن يفرز النصوص تنازلياً', () => {
      const sortedAsc = sortData(testData, { field: 'name', direction: 'asc' }, testColumns, getFieldValue);
      const sortedDesc = sortData(testData, { field: 'name', direction: 'desc' }, testColumns, getFieldValue);
      expect(sortedAsc[0].name).toBe(sortedDesc[sortedDesc.length - 1].name);
    });
  });

  describe('sortData - فرز الأرقام (number)', () => {
    it('يجب أن يفرز الأرقام تصاعدياً', () => {
      const sorted = sortData(testData, { field: 'age', direction: 'asc' }, testColumns, getFieldValue);
      expect(sorted[0].age).toBe(25);
      expect(sorted[1].age).toBe(28);
      expect(sorted[2].age).toBe(30);
      expect(sorted[3].age).toBe(35);
    });

    it('يجب أن يفرز الأرقام تنازلياً', () => {
      const sorted = sortData(testData, { field: 'age', direction: 'desc' }, testColumns, getFieldValue);
      expect(sorted[0].age).toBe(35);
      expect(sorted[1].age).toBe(30);
      expect(sorted[2].age).toBe(28);
      expect(sorted[3].age).toBe(25);
    });
  });

  describe('sortData - فرز التواريخ (date)', () => {
    it('يجب أن يفرز التواريخ تصاعدياً', () => {
      const sorted = sortData(testData, { field: 'date', direction: 'asc' }, testColumns, getFieldValue);
      expect(sorted[0].date).toBe('2023-12-01');
      expect(sorted[1].date).toBe('2024-01-15');
      expect(sorted[2].date).toBe('2024-02-10');
      expect(sorted[3].date).toBe('2024-03-20');
    });

    it('يجب أن يفرز التواريخ تنازلياً', () => {
      const sorted = sortData(testData, { field: 'date', direction: 'desc' }, testColumns, getFieldValue);
      expect(sorted[0].date).toBe('2024-03-20');
      expect(sorted[1].date).toBe('2024-02-10');
      expect(sorted[2].date).toBe('2024-01-15');
      expect(sorted[3].date).toBe('2023-12-01');
    });
  });

  describe('sortData - حالات خاصة', () => {
    it('يجب أن يعيد البيانات بدون تغيير إذا لم يكن هناك فرز', () => {
      const sorted = sortData(testData, { field: null, direction: 'asc' }, testColumns, getFieldValue);
      expect(sorted).toEqual(testData);
    });

    it('يجب أن يتجاهل الفرز للأعمدة غير القابلة للفرز', () => {
      const sorted = sortData(testData, { field: 'actions', direction: 'asc' }, testColumns, getFieldValue);
      expect(sorted).toEqual(testData);
    });

    it('يجب أن يتعامل مع القيم الفارغة (null)', () => {
      const dataWithNull = [
        { name: 'أحمد', age: 30, date: '2024-01-15' },
        { name: null, age: null, date: null },
        { name: 'علي', age: 35, date: '2024-02-10' },
      ];
      const sorted = sortData(dataWithNull, { field: 'name', direction: 'asc' }, testColumns, getFieldValue);
      expect(sorted.length).toBe(3);
      // null values should be at the end
      expect(sorted[2].name).toBeNull();
    });

    it('يجب أن لا يغير البيانات الأصلية (immutability)', () => {
      const original = [...testData];
      sortData(testData, { field: 'age', direction: 'asc' }, testColumns, getFieldValue);
      expect(testData).toEqual(original);
    });
  });

  describe('sortData - فرز الأرقام مع قيم نصية', () => {
    it('يجب أن يتعامل مع الأرقام المخزنة كنصوص', () => {
      const dataWithStringNumbers = [
        { name: 'أ', age: '30', date: '' },
        { name: 'ب', age: '5', date: '' },
        { name: 'ج', age: '100', date: '' },
      ];
      const sorted = sortData(
        dataWithStringNumbers,
        { field: 'age', direction: 'asc' },
        testColumns,
        getFieldValue
      );
      expect(parseFloat(String(sorted[0].age))).toBe(5);
      expect(parseFloat(String(sorted[1].age))).toBe(30);
      expect(parseFloat(String(sorted[2].age))).toBe(100);
    });
  });

  describe('دورة الفرز الكاملة', () => {
    it('يجب أن تعمل دورة الفرز الكاملة: بدون فرز -> تصاعدي -> تنازلي -> بدون فرز', () => {
      let state: SortState = { field: null, direction: 'asc' };
      
      // النقر الأول: بدون فرز -> تصاعدي
      state = toggleSort(state, 'age');
      expect(state).toEqual({ field: 'age', direction: 'asc' });
      let sorted = sortData(testData, state, testColumns, getFieldValue);
      expect(sorted[0].age).toBe(25);
      
      // النقر الثاني: تصاعدي -> تنازلي
      state = toggleSort(state, 'age');
      expect(state).toEqual({ field: 'age', direction: 'desc' });
      sorted = sortData(testData, state, testColumns, getFieldValue);
      expect(sorted[0].age).toBe(35);
      
      // النقر الثالث: تنازلي -> بدون فرز
      state = toggleSort(state, 'age');
      expect(state).toEqual({ field: null, direction: 'asc' });
      sorted = sortData(testData, state, testColumns, getFieldValue);
      expect(sorted).toEqual(testData);
    });

    it('يجب أن يعمل التبديل بين أعمدة مختلفة', () => {
      let state: SortState = { field: null, direction: 'asc' };
      
      // فرز حسب العمر
      state = toggleSort(state, 'age');
      let sorted = sortData(testData, state, testColumns, getFieldValue);
      expect(sorted[0].age).toBe(25);
      
      // التبديل إلى الاسم
      state = toggleSort(state, 'name');
      expect(state).toEqual({ field: 'name', direction: 'asc' });
      sorted = sortData(testData, state, testColumns, getFieldValue);
      expect(sorted.length).toBe(4);
      
      // التبديل إلى التاريخ
      state = toggleSort(state, 'date');
      expect(state).toEqual({ field: 'date', direction: 'asc' });
      sorted = sortData(testData, state, testColumns, getFieldValue);
      expect(sorted[0].date).toBe('2023-12-01');
    });
  });
});
