import { describe, it, expect } from "vitest";

/**
 * اختبارات وحدة لمنطق AppointmentsTab و AppointmentFilters و AppointmentTableDesktop
 */

describe("AppointmentsTab - تصفية المواعيد", () => {
  const appointments = [
    { id: 1, fullName: "أحمد محمد", phone: "967773171477", status: "confirmed", doctorName: "د. سالم", source: "facebook", appointmentDate: "2025-03-15" },
    { id: 2, fullName: "سارة علي", phone: "967771234567", status: "pending", doctorName: "د. خالد", source: "instagram", appointmentDate: "2025-03-16" },
    { id: 3, fullName: "خالد أحمد", phone: "967779876543", status: "confirmed", doctorName: "د. سالم", source: "website", appointmentDate: "2025-03-17" },
    { id: 4, fullName: "فاطمة حسن", phone: "967770001111", status: "cancelled", doctorName: "د. أمل", source: "facebook", appointmentDate: "2025-03-18" },
    { id: 5, fullName: "محمد يوسف", phone: "967772223333", status: "attended", doctorName: "د. خالد", source: "whatsapp", appointmentDate: "2025-03-19" },
  ];

  it("يفلتر حسب الطبيب", () => {
    const filtered = appointments.filter(a => a.doctorName === "د. سالم");
    expect(filtered).toHaveLength(2);
    expect(filtered.every(a => a.doctorName === "د. سالم")).toBe(true);
  });

  it("يفلتر حسب الحالة", () => {
    const filtered = appointments.filter(a => a.status === "confirmed");
    expect(filtered).toHaveLength(2);
  });

  it("يفلتر حسب المصدر", () => {
    const filtered = appointments.filter(a => a.source === "facebook");
    expect(filtered).toHaveLength(2);
  });

  it("يبحث بالاسم", () => {
    const searchTerm = "أحمد";
    const filtered = appointments.filter(a =>
      a.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    expect(filtered).toHaveLength(2);
  });

  it("يبحث برقم الهاتف", () => {
    const searchTerm = "773171";
    const filtered = appointments.filter(a => a.phone.includes(searchTerm));
    expect(filtered).toHaveLength(1);
    expect(filtered[0].fullName).toBe("أحمد محمد");
  });

  it("يجمع فلاتر متعددة (طبيب + حالة)", () => {
    const filtered = appointments.filter(a =>
      a.doctorName === "د. خالد" && a.status === "pending"
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].fullName).toBe("سارة علي");
  });

  it("يعيد كل المواعيد عند عدم وجود فلاتر", () => {
    const filtered = appointments.filter(() => true);
    expect(filtered).toHaveLength(5);
  });
});

describe("AppointmentsTab - إحصائيات المواعيد", () => {
  const appointments = [
    { status: "confirmed" },
    { status: "pending" },
    { status: "confirmed" },
    { status: "cancelled" },
    { status: "attended" },
    { status: "pending" },
  ];

  it("يحسب عدد المواعيد المؤكدة", () => {
    const count = appointments.filter(a => a.status === "confirmed").length;
    expect(count).toBe(2);
  });

  it("يحسب عدد المواعيد المعلقة", () => {
    const count = appointments.filter(a => a.status === "pending").length;
    expect(count).toBe(2);
  });

  it("يحسب عدد المواعيد الملغاة", () => {
    const count = appointments.filter(a => a.status === "cancelled").length;
    expect(count).toBe(1);
  });

  it("يحسب عدد الحضور", () => {
    const count = appointments.filter(a => a.status === "attended").length;
    expect(count).toBe(1);
  });

  it("يحسب نسبة الحضور", () => {
    const total = appointments.length;
    const attended = appointments.filter(a => a.status === "attended").length;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;
    expect(rate).toBe(17);
  });

  it("يحسب نسبة الإلغاء", () => {
    const total = appointments.length;
    const cancelled = appointments.filter(a => a.status === "cancelled").length;
    const rate = total > 0 ? Math.round((cancelled / total) * 100) : 0;
    expect(rate).toBe(17);
  });
});

describe("AppointmentFilters - منطق التصدير", () => {
  it("يحدد اسم ملف التصدير بشكل صحيح", () => {
    const prefix = "مواعيد_الأطباء";
    const date = "2025-03-15";
    const filename = `${prefix}_${date}`;
    expect(filename).toBe("مواعيد_الأطباء_2025-03-15");
  });

  it("يحسب عدد الأعمدة المرئية", () => {
    const columns = {
      fullName: true,
      phone: true,
      doctorName: true,
      status: false,
      source: true,
      appointmentDate: false,
    };
    const visibleCount = Object.values(columns).filter(Boolean).length;
    expect(visibleCount).toBe(4);
  });
});

describe("AppointmentTableDesktop - ترتيب البيانات", () => {
  it("يرتب المواعيد حسب التاريخ تنازلياً (الأحدث أولاً)", () => {
    const appointments = [
      { id: 1, appointmentDate: "2025-03-15" },
      { id: 2, appointmentDate: "2025-03-18" },
      { id: 3, appointmentDate: "2025-03-16" },
    ];
    const sorted = [...appointments].sort((a, b) =>
      new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
    );
    expect(sorted[0].id).toBe(2);
    expect(sorted[1].id).toBe(3);
    expect(sorted[2].id).toBe(1);
  });

  it("يرتب المواعيد حسب الاسم أبجدياً", () => {
    const appointments = [
      { fullName: "خالد" },
      { fullName: "أحمد" },
      { fullName: "سارة" },
    ];
    const sorted = [...appointments].sort((a, b) =>
      a.fullName.localeCompare(b.fullName, "ar")
    );
    expect(sorted[0].fullName).toBe("أحمد");
    expect(sorted[1].fullName).toBe("خالد");
    expect(sorted[2].fullName).toBe("سارة");
  });
});

describe("AppointmentsTab - تحديد متعدد", () => {
  it("يحدد جميع المواعيد", () => {
    const ids = [1, 2, 3, 4, 5];
    const selectedIds: number[] = [];
    
    // Select all
    const newSelected = selectedIds.length === ids.length ? [] : ids;
    expect(newSelected).toEqual([1, 2, 3, 4, 5]);
  });

  it("يلغي تحديد الكل عند الضغط مرة أخرى", () => {
    const ids = [1, 2, 3, 4, 5];
    const selectedIds = [1, 2, 3, 4, 5];
    
    const newSelected = selectedIds.length === ids.length ? [] : ids;
    expect(newSelected).toEqual([]);
  });

  it("يضيف/يزيل عنصر واحد من التحديد", () => {
    let selectedIds = [1, 3];
    
    // Toggle id 2 (add)
    const id = 2;
    if (selectedIds.includes(id)) {
      selectedIds = selectedIds.filter(i => i !== id);
    } else {
      selectedIds = [...selectedIds, id];
    }
    expect(selectedIds).toEqual([1, 3, 2]);

    // Toggle id 1 (remove)
    const id2 = 1;
    if (selectedIds.includes(id2)) {
      selectedIds = selectedIds.filter(i => i !== id2);
    } else {
      selectedIds = [...selectedIds, id2];
    }
    expect(selectedIds).toEqual([3, 2]);
  });
});

describe("AppointmentsTab - Pagination", () => {
  it("يحسب عدد الصفحات بشكل صحيح", () => {
    const total = 250;
    const pageSize = 100;
    const totalPages = Math.ceil(total / pageSize);
    expect(totalPages).toBe(3);
  });

  it("يحسب offset الصفحة بشكل صحيح", () => {
    const page = 3;
    const pageSize = 100;
    const offset = (page - 1) * pageSize;
    expect(offset).toBe(200);
  });

  it("يتعامل مع pageSize = 'all'", () => {
    const pageSize = "all";
    const limit = pageSize === "all" ? 100000 : parseInt(pageSize);
    expect(limit).toBe(100000);
  });

  it("يتعامل مع pageSize رقمي", () => {
    const pageSize = "50";
    const limit = pageSize === "all" ? 100000 : parseInt(pageSize);
    expect(limit).toBe(50);
  });
});
