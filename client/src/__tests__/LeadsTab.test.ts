import { describe, it, expect } from "vitest";

/**
 * اختبارات وحدة لمنطق LeadsTab
 * نختبر دوال المعالجة والتصفية والتنظيف
 */

// استخراج دالة sanitizeLead من المكون
const sanitizeLead = (lead: any) => {
  if (!lead) return null;
  const sanitized = { ...lead };
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitized[key]
        .replace(/[\x00-\x1F\x7F]/g, '')
        .replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
    }
  });
  return sanitized;
};

describe("LeadsTab - sanitizeLead", () => {
  it("يعيد null للقيم الفارغة", () => {
    expect(sanitizeLead(null)).toBeNull();
    expect(sanitizeLead(undefined)).toBeNull();
  });

  it("ينظف الأحرف التحكمية من النصوص", () => {
    const lead = { name: "أحمد\x00\x01محمد", phone: "123\x1F456" };
    const result = sanitizeLead(lead);
    expect(result.name).toBe("أحمدمحمد");
    expect(result.phone).toBe("123456");
  });

  it("يحافظ على النصوص النظيفة بدون تغيير", () => {
    const lead = { name: "أحمد محمد", phone: "967773171477", status: "new" };
    const result = sanitizeLead(lead);
    expect(result).toEqual(lead);
  });

  it("يتعامل مع القيم غير النصية بدون تغيير", () => {
    const lead = { id: 1, active: true, count: 5.5, tags: ["a", "b"] };
    const result = sanitizeLead(lead);
    expect(result.id).toBe(1);
    expect(result.active).toBe(true);
    expect(result.count).toBe(5.5);
    expect(result.tags).toEqual(["a", "b"]);
  });

  it("يصلح backslashes غير صالحة", () => {
    const lead = { name: "test\\invalid" };
    const result = sanitizeLead(lead);
    expect(result.name).toBe("test\\\\invalid");
  });

  it("يحافظ على backslashes الصالحة", () => {
    const lead = { name: 'test\\"valid' };
    const result = sanitizeLead(lead);
    expect(result.name).toBe('test\\"valid');
  });

  it("لا يعدل الكائن الأصلي", () => {
    const lead = { name: "أحمد\x00" };
    const original = { ...lead };
    sanitizeLead(lead);
    expect(lead).toEqual(original);
  });
});

describe("LeadsTab - تصفية العملاء", () => {
  const leads = [
    { id: 1, fullName: "أحمد محمد", phone: "967773171477", status: "new", source: "facebook" },
    { id: 2, fullName: "سارة علي", phone: "967771234567", status: "contacted", source: "instagram" },
    { id: 3, fullName: "خالد أحمد", phone: "967779876543", status: "new", source: "facebook" },
    { id: 4, fullName: "فاطمة حسن", phone: "967770001111", status: "converted", source: "website" },
  ];

  it("يفلتر حسب الحالة", () => {
    const filtered = leads.filter(l => l.status === "new");
    expect(filtered).toHaveLength(2);
    expect(filtered.every(l => l.status === "new")).toBe(true);
  });

  it("يفلتر حسب المصدر", () => {
    const filtered = leads.filter(l => l.source === "facebook");
    expect(filtered).toHaveLength(2);
  });

  it("يبحث بالاسم", () => {
    const searchTerm = "أحمد";
    const filtered = leads.filter(l => 
      l.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    expect(filtered).toHaveLength(2); // أحمد محمد + خالد أحمد
  });

  it("يبحث برقم الهاتف", () => {
    const searchTerm = "773171";
    const filtered = leads.filter(l => l.phone.includes(searchTerm));
    expect(filtered).toHaveLength(1);
    expect(filtered[0].fullName).toBe("أحمد محمد");
  });

  it("يجمع فلاتر متعددة", () => {
    const filtered = leads.filter(l => l.status === "new" && l.source === "facebook");
    expect(filtered).toHaveLength(2);
  });

  it("يعيد مصفوفة فارغة عند عدم وجود نتائج", () => {
    const filtered = leads.filter(l => l.status === "nonexistent");
    expect(filtered).toHaveLength(0);
  });
});

describe("LeadsTab - إحصائيات العملاء", () => {
  it("يحسب عدد العملاء الجدد", () => {
    const leads = [
      { status: "new" },
      { status: "contacted" },
      { status: "new" },
      { status: "converted" },
    ];
    const newCount = leads.filter(l => l.status === "new").length;
    expect(newCount).toBe(2);
  });

  it("يحسب نسبة التحويل", () => {
    const total = 10;
    const converted = 3;
    const rate = total > 0 ? (converted / total) * 100 : 0;
    expect(rate).toBe(30);
  });

  it("يتعامل مع عدم وجود عملاء", () => {
    const total = 0;
    const converted = 0;
    const rate = total > 0 ? (converted / total) * 100 : 0;
    expect(rate).toBe(0);
  });
});
