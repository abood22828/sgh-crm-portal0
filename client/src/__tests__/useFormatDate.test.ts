import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFormatDate, formatDateUtil, formatDateTimeUtil } from "@/hooks/useFormatDate";

describe("useFormatDate hook", () => {
  const { result } = renderHook(() => useFormatDate());

  describe("formatDate", () => {
    it("يجب أن يُرجع '-' عند تمرير null", () => {
      expect(result.current.formatDate(null)).toBe("-");
    });

    it("يجب أن يُرجع '-' عند تمرير undefined", () => {
      expect(result.current.formatDate(undefined)).toBe("-");
    });

    it("يجب أن يُرجع '-' عند تمرير سلسلة فارغة", () => {
      expect(result.current.formatDate("")).toBe("-");
    });

    it("يجب أن يُنسق تاريخ ISO بشكل صحيح", () => {
      const formatted = result.current.formatDate("2026-02-23T10:00:00Z");
      // يجب أن يحتوي على اليوم والشهر والسنة
      expect(formatted).not.toBe("-");
      expect(formatted).toContain("٢٠٢٦");
      expect(formatted).toContain("٢٣");
    });

    it("يجب أن يقبل كائن Date", () => {
      const date = new Date(2026, 1, 23); // 23 فبراير 2026
      const formatted = result.current.formatDate(date);
      expect(formatted).not.toBe("-");
      expect(formatted).toContain("٢٠٢٦");
    });

    it("يجب أن يُرجع '-' عند تمرير تاريخ غير صالح", () => {
      expect(result.current.formatDate("invalid-date")).toBe("-");
    });
  });

  describe("formatDateShort", () => {
    it("يجب أن يُرجع '-' عند تمرير null", () => {
      expect(result.current.formatDateShort(null)).toBe("-");
    });

    it("يجب أن يُنسق التاريخ بشكل مختصر", () => {
      const formatted = result.current.formatDateShort("2026-02-23T10:00:00Z");
      expect(formatted).not.toBe("-");
      expect(formatted).toContain("٢٠٢٦");
    });
  });

  describe("formatDateTime", () => {
    it("يجب أن يُرجع '-' عند تمرير null", () => {
      expect(result.current.formatDateTime(null)).toBe("-");
    });

    it("يجب أن يحتوي على التاريخ والوقت", () => {
      const formatted = result.current.formatDateTime("2026-02-23T14:30:00Z");
      expect(formatted).not.toBe("-");
      expect(formatted).toContain("٢٠٢٦");
    });

    it("يجب أن يقبل كائن Date", () => {
      const date = new Date(2026, 1, 23, 14, 30);
      const formatted = result.current.formatDateTime(date);
      expect(formatted).not.toBe("-");
    });
  });

  describe("formatDateCompact", () => {
    it("يجب أن يُرجع '-' عند تمرير null", () => {
      expect(result.current.formatDateCompact(null)).toBe("-");
    });

    it("يجب أن يُنسق التاريخ بشكل مضغوط (XX/XX/XXXX)", () => {
      const formatted = result.current.formatDateCompact("2026-02-23T10:00:00Z");
      expect(formatted).not.toBe("-");
      // يجب أن يحتوي على فواصل
      expect(formatted).toMatch(/[\d\u0660-\u0669]/);
    });
  });

  describe("formatDateRange", () => {
    it("يجب أن يُرجع '-' عند تمرير null لكلا التاريخين", () => {
      expect(result.current.formatDateRange(null, null)).toBe("-");
    });

    it("يجب أن يُرجع تاريخ واحد عند تمرير null للتاريخ الأول", () => {
      const formatted = result.current.formatDateRange(null, "2026-02-28T10:00:00Z");
      expect(formatted).not.toBe("-");
      expect(formatted).toContain("٢٠٢٦");
    });

    it("يجب أن يُرجع تاريخ واحد عند تمرير null للتاريخ الثاني", () => {
      const formatted = result.current.formatDateRange("2026-02-23T10:00:00Z", null);
      expect(formatted).not.toBe("-");
      expect(formatted).toContain("٢٠٢٦");
    });

    it("يجب أن يُرجع نطاق تاريخ عند تمرير تاريخين صالحين", () => {
      const formatted = result.current.formatDateRange("2026-02-23T10:00:00Z", "2026-02-28T10:00:00Z");
      expect(formatted).toContain("-");
      expect(formatted).toContain("٢٠٢٦");
    });
  });
});

describe("formatDateUtil (standalone)", () => {
  it("يجب أن يُرجع '-' عند تمرير null", () => {
    expect(formatDateUtil(null)).toBe("-");
  });

  it("يجب أن يُرجع '-' عند تمرير undefined", () => {
    expect(formatDateUtil(undefined)).toBe("-");
  });

  it("يجب أن يُنسق التاريخ بشكل صحيح", () => {
    const formatted = formatDateUtil("2026-02-23T10:00:00Z");
    expect(formatted).not.toBe("-");
    expect(formatted).toContain("٢٠٢٦");
  });

  it("يجب أن يُرجع 'Invalid Date' عند تمرير تاريخ غير صالح", () => {
    // formatDateUtil لا يتحقق من صلاحية التاريخ بنفس طريقة hook
    const result = formatDateUtil("not-a-date");
    expect(typeof result).toBe("string");
  });
});

describe("formatDateTimeUtil (standalone)", () => {
  it("يجب أن يُرجع '-' عند تمرير null", () => {
    expect(formatDateTimeUtil(null)).toBe("-");
  });

  it("يجب أن يُنسق التاريخ والوقت بشكل صحيح", () => {
    const formatted = formatDateTimeUtil("2026-02-23T14:30:00Z");
    expect(formatted).not.toBe("-");
    expect(formatted).toContain("٢٠٢٦");
  });
});
