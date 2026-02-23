import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

describe("useConfirmDialog", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("يبدأ بحالة مغلقة وعنصر فارغ", () => {
    const { result } = renderHook(() => useConfirmDialog());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.item).toBeNull();
  });

  it("يفتح الحوار مع العنصر المحدد", () => {
    const { result } = renderHook(() => useConfirmDialog<{ id: number; name: string }>());
    
    act(() => {
      result.current.openConfirm({ id: 1, name: "عنصر اختبار" });
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.item).toEqual({ id: 1, name: "عنصر اختبار" });
  });

  it("يغلق الحوار ويمسح العنصر بعد تأخير", () => {
    const { result } = renderHook(() => useConfirmDialog<{ id: number }>());
    
    act(() => {
      result.current.openConfirm({ id: 1 });
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.closeConfirm();
    });
    expect(result.current.isOpen).toBe(false);
    // العنصر لا يزال موجوداً بسبب التأخير
    expect(result.current.item).toEqual({ id: 1 });

    // بعد 200ms يتم مسح العنصر
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.item).toBeNull();
  });

  it("ينفذ الإجراء ويغلق الحوار عند التأكيد", () => {
    const { result } = renderHook(() => useConfirmDialog<{ id: number }>());
    const mockAction = vi.fn();

    act(() => {
      result.current.openConfirm({ id: 5 });
    });

    act(() => {
      result.current.confirm(mockAction);
    });

    expect(mockAction).toHaveBeenCalledOnce();
    expect(result.current.isOpen).toBe(false);
  });

  it("يعمل مع أنواع مختلفة من العناصر", () => {
    const { result } = renderHook(() => useConfirmDialog<string>());
    
    act(() => {
      result.current.openConfirm("نص اختبار");
    });
    expect(result.current.item).toBe("نص اختبار");
  });

  it("يمكن فتح حوار جديد بعد إغلاق السابق", () => {
    const { result } = renderHook(() => useConfirmDialog<{ id: number }>());
    
    act(() => {
      result.current.openConfirm({ id: 1 });
    });
    expect(result.current.item).toEqual({ id: 1 });

    act(() => {
      result.current.closeConfirm();
      vi.advanceTimersByTime(200);
    });

    act(() => {
      result.current.openConfirm({ id: 2 });
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.item).toEqual({ id: 2 });
  });

  it("يعمل بدون تحديد نوع (any)", () => {
    const { result } = renderHook(() => useConfirmDialog());
    
    act(() => {
      result.current.openConfirm({ anything: true });
    });
    expect(result.current.item).toEqual({ anything: true });
  });
});
