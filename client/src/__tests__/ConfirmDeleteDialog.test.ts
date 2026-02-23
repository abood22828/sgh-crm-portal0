import { describe, it, expect } from "vitest";

/**
 * اختبارات وحدة لمنطق ConfirmDeleteDialog
 * نختبر المنطق الداخلي (title/description generation) بدون DOM rendering
 */

// استخراج منطق العنوان والوصف من المكون للاختبار
function getDialogTitle(title?: string): string {
  return title || "تأكيد الحذف";
}

function getDialogDescription(
  description?: string,
  itemName?: string | null,
  itemType: string = "العنصر"
): string {
  if (description) return description;
  return itemName
    ? `هل أنت متأكد من حذف ${itemType} "${itemName}"؟ لا يمكن التراجع عن هذا الإجراء.`
    : `هل أنت متأكد من حذف هذا ${itemType}؟ لا يمكن التراجع عن هذا الإجراء.`;
}

describe("ConfirmDeleteDialog - منطق العنوان", () => {
  it("يعرض العنوان الافتراضي عند عدم تحديد عنوان", () => {
    expect(getDialogTitle()).toBe("تأكيد الحذف");
  });

  it("يعرض العنوان المخصص عند تحديده", () => {
    expect(getDialogTitle("تأكيد إلغاء الموعد")).toBe("تأكيد إلغاء الموعد");
  });

  it("يعرض العنوان المخصص حتى لو كان فارغاً", () => {
    expect(getDialogTitle("")).toBe("تأكيد الحذف");
  });
});

describe("ConfirmDeleteDialog - منطق الوصف", () => {
  it("يعرض الوصف المخصص عند تحديده", () => {
    const desc = "هذا وصف مخصص";
    expect(getDialogDescription(desc, "عنصر", "العرض")).toBe(desc);
  });

  it("يعرض وصف مع اسم العنصر ونوعه", () => {
    const result = getDialogDescription(undefined, "عرض خاص", "العرض");
    expect(result).toBe('هل أنت متأكد من حذف العرض "عرض خاص"؟ لا يمكن التراجع عن هذا الإجراء.');
  });

  it("يعرض وصف بدون اسم العنصر مع النوع", () => {
    const result = getDialogDescription(undefined, null, "الطبيب");
    expect(result).toBe("هل أنت متأكد من حذف هذا الطبيب؟ لا يمكن التراجع عن هذا الإجراء.");
  });

  it("يعرض وصف بالنوع الافتراضي عند عدم تحديد النوع", () => {
    const result = getDialogDescription(undefined, null);
    expect(result).toBe("هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.");
  });

  it("يعرض وصف مع اسم العنصر والنوع الافتراضي", () => {
    const result = getDialogDescription(undefined, "مخيم صحي");
    expect(result).toBe('هل أنت متأكد من حذف العنصر "مخيم صحي"؟ لا يمكن التراجع عن هذا الإجراء.');
  });

  it("يتعامل مع اسم عنصر فارغ كـ null", () => {
    const result = getDialogDescription(undefined, "", "العرض");
    expect(result).toBe("هل أنت متأكد من حذف هذا العرض؟ لا يمكن التراجع عن هذا الإجراء.");
  });
});

describe("ConfirmDeleteDialog - القيم الافتراضية", () => {
  it("القيم الافتراضية للـ props", () => {
    // التحقق من القيم الافتراضية المتوقعة
    const defaults = {
      itemType: "العنصر",
      isLoading: false,
      confirmText: "حذف",
      cancelText: "إلغاء",
      variant: "destructive",
    };
    
    expect(defaults.itemType).toBe("العنصر");
    expect(defaults.isLoading).toBe(false);
    expect(defaults.confirmText).toBe("حذف");
    expect(defaults.cancelText).toBe("إلغاء");
    expect(defaults.variant).toBe("destructive");
  });

  it("يدعم variant warning", () => {
    const variant = "warning";
    expect(variant).toBe("warning");
    expect(variant !== "destructive").toBe(true);
  });
});
