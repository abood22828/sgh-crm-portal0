import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePhoneFormat, formatPhoneDisplayUtil, formatPhoneUtil } from "@/hooks/usePhoneFormat";

describe("usePhoneFormat hook", () => {
  const { result } = renderHook(() => usePhoneFormat());

  describe("formatPhoneDisplay", () => {
    it("يجب أن يُرجع '-' عند تمرير null", () => {
      expect(result.current.formatPhoneDisplay(null)).toBe("-");
    });

    it("يجب أن يُرجع '-' عند تمرير undefined", () => {
      expect(result.current.formatPhoneDisplay(undefined)).toBe("-");
    });

    it("يجب أن يُنسق رقم يمني 12 خانة يبدأ بـ 967", () => {
      const formatted = result.current.formatPhoneDisplay("967773171477");
      expect(formatted).toBe("+967 773 171 477");
    });

    it("يجب أن يُنسق رقم يمني يبدأ بـ +967", () => {
      const formatted = result.current.formatPhoneDisplay("+967773171477");
      expect(formatted).toBe("+967 773 171 477");
    });

    it("يجب أن يُرجع الرقم كما هو إذا لم يتطابق مع النمط اليمني", () => {
      const formatted = result.current.formatPhoneDisplay("1234567890");
      expect(formatted).toBe("1234567890");
    });

    it("يجب أن يتعامل مع أرقام تحتوي على مسافات", () => {
      const formatted = result.current.formatPhoneDisplay("967 773 171 477");
      expect(formatted).toBe("+967 773 171 477");
    });
  });

  describe("formatPhone", () => {
    it("يجب أن يُرجع سلسلة فارغة عند تمرير null", () => {
      expect(result.current.formatPhone(null)).toBe("");
    });

    it("يجب أن يُرجع سلسلة فارغة عند تمرير undefined", () => {
      expect(result.current.formatPhone(undefined)).toBe("");
    });

    it("يجب أن يُحول رقم 9 خانات إلى صيغة 967XXXXXXXXX", () => {
      expect(result.current.formatPhone("773171477")).toBe("967773171477");
    });

    it("يجب أن يُزيل + من بداية الرقم", () => {
      expect(result.current.formatPhone("+967773171477")).toBe("967773171477");
    });

    it("يجب أن يُحول رقم يبدأ بـ 0 (10 خانات) إلى صيغة 967", () => {
      expect(result.current.formatPhone("0773171477")).toBe("967773171477");
    });

    it("يجب أن يُزيل 00 من بداية الرقم", () => {
      expect(result.current.formatPhone("00967773171477")).toBe("967773171477");
    });

    it("يجب أن يُبقي رقم 967 كما هو", () => {
      expect(result.current.formatPhone("967773171477")).toBe("967773171477");
    });
  });

  describe("getWhatsAppLink", () => {
    it("يجب أن يُرجع '#' عند تمرير null", () => {
      expect(result.current.getWhatsAppLink(null)).toBe("#");
    });

    it("يجب أن يُنشئ رابط واتساب صحيح", () => {
      const link = result.current.getWhatsAppLink("773171477");
      expect(link).toBe("https://wa.me/967773171477");
    });

    it("يجب أن يُنشئ رابط واتساب من رقم كامل", () => {
      const link = result.current.getWhatsAppLink("+967773171477");
      expect(link).toBe("https://wa.me/967773171477");
    });
  });

  describe("getCallLink", () => {
    it("يجب أن يُرجع '#' عند تمرير null", () => {
      expect(result.current.getCallLink(null)).toBe("#");
    });

    it("يجب أن يُنشئ رابط اتصال صحيح", () => {
      const link = result.current.getCallLink("773171477");
      expect(link).toBe("tel:+967773171477");
    });

    it("يجب أن يُنشئ رابط اتصال من رقم كامل", () => {
      const link = result.current.getCallLink("967773171477");
      expect(link).toBe("tel:+967773171477");
    });
  });
});

describe("formatPhoneDisplayUtil (standalone)", () => {
  it("يجب أن يُنسق رقم يمني 12 خانة", () => {
    expect(formatPhoneDisplayUtil("967773171477")).toBe("+967 773 171 477");
  });

  it("يجب أن يُرجع الرقم كما هو لأرقام غير يمنية", () => {
    expect(formatPhoneDisplayUtil("1234567890")).toBe("1234567890");
  });
});

describe("formatPhoneUtil (standalone)", () => {
  it("يجب أن يُحول رقم 9 خانات إلى صيغة 967", () => {
    expect(formatPhoneUtil("773171477")).toBe("967773171477");
  });

  it("يجب أن يُزيل + من بداية الرقم", () => {
    expect(formatPhoneUtil("+967773171477")).toBe("967773171477");
  });

  it("يجب أن يُزيل 00 من بداية الرقم", () => {
    expect(formatPhoneUtil("00967773171477")).toBe("967773171477");
  });
});
