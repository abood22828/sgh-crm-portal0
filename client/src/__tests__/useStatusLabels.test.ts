import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useStatusLabels,
  leadStatusLabels,
  leadStatusColors,
  appointmentStatusLabels,
  appointmentStatusColors,
  campaignStatusLabels,
  campaignStatusColors,
  campaignTypeLabels,
  campRegistrationStatusLabels,
  campRegistrationStatusColors,
} from "@/hooks/useStatusLabels";

describe("useStatusLabels hook", () => {
  describe("lead type", () => {
    const { result } = renderHook(() => useStatusLabels("lead"));

    it("يجب أن يُرجع التسمية الصحيحة لحالة 'new'", () => {
      expect(result.current.getLabel("new")).toBe("جديد");
    });

    it("يجب أن يُرجع التسمية الصحيحة لحالة 'contacted'", () => {
      expect(result.current.getLabel("contacted")).toBe("تم التواصل");
    });

    it("يجب أن يُرجع التسمية الصحيحة لحالة 'booked'", () => {
      expect(result.current.getLabel("booked")).toBe("تم الحجز");
    });

    it("يجب أن يُرجع التسمية الصحيحة لحالة 'not_interested'", () => {
      expect(result.current.getLabel("not_interested")).toBe("غير مهتم");
    });

    it("يجب أن يُرجع التسمية الصحيحة لحالة 'no_answer'", () => {
      expect(result.current.getLabel("no_answer")).toBe("لا يرد");
    });

    it("يجب أن يُرجع الحالة كما هي إذا لم تكن معروفة", () => {
      expect(result.current.getLabel("unknown_status")).toBe("unknown_status");
    });

    it("يجب أن يُرجع لون CSS صحيح لحالة 'new'", () => {
      const color = result.current.getColor("new");
      expect(color).toContain("bg-blue");
      expect(color).toContain("text-blue");
    });

    it("يجب أن يُرجع لون افتراضي لحالة غير معروفة", () => {
      const color = result.current.getColor("unknown");
      expect(color).toBe("bg-muted text-foreground");
    });

    it("يجب أن يُرجع جميع الحالات كقائمة", () => {
      const statuses = result.current.getAllStatuses();
      expect(statuses.length).toBeGreaterThan(0);
      expect(statuses.find(s => s.value === "new")).toBeDefined();
      expect(statuses.find(s => s.value === "new")?.label).toBe("جديد");
    });

    it("يجب أن يُصدر labels و colors", () => {
      expect(result.current.labels).toBeDefined();
      expect(result.current.colors).toBeDefined();
      expect(result.current.labels.new).toBe("جديد");
    });
  });

  describe("appointment type", () => {
    const { result } = renderHook(() => useStatusLabels("appointment"));

    it("يجب أن يُرجع التسمية الصحيحة لحالة 'pending'", () => {
      expect(result.current.getLabel("pending")).toBe("قيد الانتظار");
    });

    it("يجب أن يُرجع التسمية الصحيحة لحالة 'confirmed'", () => {
      expect(result.current.getLabel("confirmed")).toBe("مؤكد");
    });

    it("يجب أن يُرجع التسمية الصحيحة لحالة 'cancelled'", () => {
      expect(result.current.getLabel("cancelled")).toBe("ملغي");
    });

    it("يجب أن يُرجع التسمية الصحيحة لحالة 'completed'", () => {
      expect(result.current.getLabel("completed")).toBe("مكتمل");
    });

    it("يجب أن يُرجع 4 حالات", () => {
      const statuses = result.current.getAllStatuses();
      expect(statuses).toHaveLength(4);
    });

    it("يجب أن يُرجع ألوان صحيحة لكل حالة", () => {
      expect(result.current.getColor("pending")).toContain("bg-orange");
      expect(result.current.getColor("confirmed")).toContain("bg-green");
      expect(result.current.getColor("cancelled")).toContain("bg-red");
      expect(result.current.getColor("completed")).toContain("bg-blue");
    });
  });

  describe("campaign type", () => {
    const { result } = renderHook(() => useStatusLabels("campaign"));

    it("يجب أن يُرجع التسمية الصحيحة لحالة 'draft'", () => {
      expect(result.current.getLabel("draft")).toBe("مسودة");
    });

    it("يجب أن يُرجع التسمية الصحيحة لحالة 'active'", () => {
      expect(result.current.getLabel("active")).toBe("نشطة");
    });

    it("يجب أن يُرجع التسمية الصحيحة لحالة 'paused'", () => {
      expect(result.current.getLabel("paused")).toBe("متوقفة");
    });

    it("يجب أن يُرجع 5 حالات", () => {
      const statuses = result.current.getAllStatuses();
      expect(statuses).toHaveLength(5);
    });
  });

  describe("campaignType type", () => {
    const { result } = renderHook(() => useStatusLabels("campaignType"));

    it("يجب أن يُرجع التسمية الصحيحة لنوع 'digital'", () => {
      expect(result.current.getLabel("digital")).toBe("رقمية");
    });

    it("يجب أن يُرجع التسمية الصحيحة لنوع 'field'", () => {
      expect(result.current.getLabel("field")).toBe("ميدانية");
    });

    it("يجب أن يُرجع التسمية الصحيحة لنوع 'mixed'", () => {
      expect(result.current.getLabel("mixed")).toBe("مختلطة");
    });
  });

  describe("campRegistration type", () => {
    const { result } = renderHook(() => useStatusLabels("campRegistration"));

    it("يجب أن يُرجع التسمية الصحيحة لحالة 'attended'", () => {
      expect(result.current.getLabel("attended")).toBe("حضر");
    });

    it("يجب أن يُرجع 4 حالات", () => {
      const statuses = result.current.getAllStatuses();
      expect(statuses).toHaveLength(4);
    });

    it("يجب أن يُرجع ألوان صحيحة", () => {
      expect(result.current.getColor("attended")).toContain("bg-blue");
      expect(result.current.getColor("pending")).toContain("bg-orange");
    });
  });

  describe("offerLead type", () => {
    const { result } = renderHook(() => useStatusLabels("offerLead"));

    it("يجب أن يستخدم نفس تسميات lead", () => {
      expect(result.current.getLabel("new")).toBe("جديد");
      expect(result.current.getLabel("contacted")).toBe("تم التواصل");
    });
  });
});

describe("Exported constants", () => {
  it("leadStatusLabels يجب أن يحتوي على جميع الحالات", () => {
    expect(Object.keys(leadStatusLabels)).toContain("new");
    expect(Object.keys(leadStatusLabels)).toContain("contacted");
    expect(Object.keys(leadStatusLabels)).toContain("booked");
    expect(Object.keys(leadStatusLabels)).toContain("not_interested");
    expect(Object.keys(leadStatusLabels)).toContain("no_answer");
  });

  it("leadStatusColors يجب أن يحتوي على نفس المفاتيح", () => {
    const labelKeys = Object.keys(leadStatusLabels);
    const colorKeys = Object.keys(leadStatusColors);
    labelKeys.forEach(key => {
      expect(colorKeys).toContain(key);
    });
  });

  it("appointmentStatusLabels يجب أن يحتوي على 4 حالات", () => {
    expect(Object.keys(appointmentStatusLabels)).toHaveLength(4);
  });

  it("appointmentStatusColors يجب أن يحتوي على نفس المفاتيح", () => {
    const labelKeys = Object.keys(appointmentStatusLabels);
    const colorKeys = Object.keys(appointmentStatusColors);
    labelKeys.forEach(key => {
      expect(colorKeys).toContain(key);
    });
  });

  it("campaignStatusLabels يجب أن يحتوي على 5 حالات", () => {
    expect(Object.keys(campaignStatusLabels)).toHaveLength(5);
  });

  it("campaignTypeLabels يجب أن يحتوي على 4 أنواع", () => {
    expect(Object.keys(campaignTypeLabels)).toHaveLength(4);
  });

  it("campRegistrationStatusLabels يجب أن يحتوي على 4 حالات", () => {
    expect(Object.keys(campRegistrationStatusLabels)).toHaveLength(4);
  });
});
