import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function readComponent(name: string): string {
  return readFileSync(resolve(__dirname, '..', `${name}.tsx`), 'utf-8');
}

describe('DoctorsManagement التحسينات', () => {
  const code = readComponent('DoctorsManagement');

  it('يجب أن يحتوي على بطاقات إحصائيات محسنة بأيقونات', () => {
    expect(code).toContain('Stethoscope');
    expect(code).toContain('Users');
  });

  it('يجب أن يحتوي على skeleton loading بدلاً من spinner بسيط', () => {
    expect(code).toContain('animate-pulse');
    expect(code).toContain('isLoading');
  });

  it('يجب أن يستخدم EmptyState بدلاً من نص بسيط', () => {
    expect(code).toContain('EmptyState');
  });

  it('يجب أن لا يحتوي على Card wrapper خارجي', () => {
    // يجب أن يبدأ بـ div بدلاً من Card
    expect(code).toMatch(/return\s*\(\s*<div/);
  });

  it('يجب أن يحتوي على حوار إضافة/تعديل محسن بأيقونات', () => {
    expect(code).toContain('DialogTitle');
    expect(code).toContain('rounded-lg');
  });

  it('يجب أن يحتوي على حوار حذف محسن مع أيقونة تحذير', () => {
    expect(code).toContain('AlertTriangle');
    expect(code).toContain('destructive');
  });

  it('يجب أن يحتوي على toolbar مع بحث وأزرار', () => {
    expect(code).toContain('Search');
    expect(code).toContain('Plus');
    expect(code).toContain('ColumnVisibility');
  });

  it('يجب أن يحتوي على صور أو أيقونات بديلة في الجدول', () => {
    expect(code).toContain('doctor.image');
    expect(code).toContain('Stethoscope');
  });
});

describe('OffersManagement التحسينات', () => {
  const code = readComponent('OffersManagement');

  it('يجب أن يحتوي على بطاقات إحصائيات محسنة بأيقونات', () => {
    expect(code).toContain('Tag');
    expect(code).toContain('CheckCircle2');
  });

  it('يجب أن يحتوي على skeleton loading', () => {
    expect(code).toContain('animate-pulse');
    expect(code).toContain('isLoading');
  });

  it('يجب أن يستخدم EmptyState', () => {
    expect(code).toContain('EmptyState');
  });

  it('يجب أن لا يحتوي على Card wrapper خارجي', () => {
    expect(code).toMatch(/return\s*\(\s*<div/);
  });

  it('يجب أن يحتوي على حوار محسن بأقسام منظمة', () => {
    expect(code).toContain('DialogTitle');
    expect(code).toContain('المعلومات الأساسية');
  });

  it('يجب أن يحتوي على حوار حذف محسن', () => {
    expect(code).toContain('AlertTriangle');
    expect(code).toContain('destructive');
  });

  it('يجب أن يحتوي على badges محسنة للحالة', () => {
    expect(code).toContain('Badge');
    expect(code).toContain('variant');
  });
});

describe('CampsManagement التحسينات', () => {
  const code = readComponent('CampsManagement');

  it('يجب أن يحتوي على بطاقات إحصائيات محسنة بأيقونات', () => {
    expect(code).toContain('Tent');
    expect(code).toContain('CheckCircle2');
    expect(code).toContain('XCircle');
  });

  it('يجب أن يحتوي على skeleton loading', () => {
    expect(code).toContain('animate-pulse');
    expect(code).toContain('isLoading');
  });

  it('يجب أن يستخدم EmptyState', () => {
    expect(code).toContain('EmptyState');
  });

  it('يجب أن لا يحتوي على Card wrapper خارجي', () => {
    expect(code).toMatch(/return\s*\(\s*<div/);
  });

  it('يجب أن يحتوي على حوار محسن بأقسام منظمة', () => {
    expect(code).toContain('DialogTitle');
    expect(code).toContain('المعلومات الأساسية');
    expect(code).toContain('تفاصيل المخيم');
    expect(code).toContain('الإعدادات والتواريخ');
  });

  it('يجب أن يحتوي على حوار حذف محسن', () => {
    expect(code).toContain('AlertTriangle');
    expect(code).toContain('destructive');
  });

  it('يجب أن يحتوي على badges محسنة للحالة مع مؤشر لوني', () => {
    expect(code).toContain('Badge');
    expect(code).toContain('rounded-full');
  });

  it('يجب أن يحتوي على صور أو أيقونات بديلة في الجدول', () => {
    expect(code).toContain('imageUrl');
    expect(code).toContain('ring-1');
  });
});

describe('التناسق بين الصفحات الثلاث', () => {
  const doctors = readComponent('DoctorsManagement');
  const offers = readComponent('OffersManagement');
  const camps = readComponent('CampsManagement');

  it('جميع الصفحات تستخدم EmptyState', () => {
    expect(doctors).toContain('EmptyState');
    expect(offers).toContain('EmptyState');
    expect(camps).toContain('EmptyState');
  });

  it('جميع الصفحات تحتوي على skeleton loading', () => {
    expect(doctors).toContain('animate-pulse');
    expect(offers).toContain('animate-pulse');
    expect(camps).toContain('animate-pulse');
  });

  it('جميع الصفحات تحتوي على حوار حذف مع AlertTriangle', () => {
    expect(doctors).toContain('AlertTriangle');
    expect(offers).toContain('AlertTriangle');
    expect(camps).toContain('AlertTriangle');
  });

  it('جميع الصفحات تستخدم hover:shadow-md في بطاقات الإحصائيات', () => {
    expect(doctors).toContain('hover:shadow-md');
    expect(offers).toContain('hover:shadow-md');
    expect(camps).toContain('hover:shadow-md');
  });

  it('جميع الصفحات تستخدم rounded-xl في بطاقات الإحصائيات', () => {
    expect(doctors).toContain('rounded-xl');
    expect(offers).toContain('rounded-xl');
    expect(camps).toContain('rounded-xl');
  });
});
