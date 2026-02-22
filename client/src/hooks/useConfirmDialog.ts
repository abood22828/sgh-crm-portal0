import { useState, useCallback } from "react";

/**
 * useConfirmDialog - هوك لإدارة حوارات التأكيد (حذف، إلغاء، إلخ)
 * 
 * @returns { isOpen, item, openConfirm, closeConfirm, confirm }
 * 
 * الاستخدام:
 * const deleteConfirm = useConfirmDialog<Offer>();
 * 
 * // فتح حوار التأكيد:
 * <Button onClick={() => deleteConfirm.openConfirm(offer)}>حذف</Button>
 * 
 * // في الحوار:
 * <Dialog open={deleteConfirm.isOpen} onOpenChange={deleteConfirm.closeConfirm}>
 *   <DialogContent>
 *     <p>هل أنت متأكد من حذف {deleteConfirm.item?.title}؟</p>
 *     <Button onClick={() => deleteConfirm.confirm(() => deleteMutation.mutate(deleteConfirm.item!.id))}>
 *       تأكيد
 *     </Button>
 *   </DialogContent>
 * </Dialog>
 */

export function useConfirmDialog<T = any>() {
  const [isOpen, setIsOpen] = useState(false);
  const [item, setItem] = useState<T | null>(null);

  const openConfirm = useCallback((targetItem: T) => {
    setItem(targetItem);
    setIsOpen(true);
  }, []);

  const closeConfirm = useCallback(() => {
    setIsOpen(false);
    // تأخير مسح العنصر لتجنب flicker أثناء إغلاق الحوار
    setTimeout(() => setItem(null), 200);
  }, []);

  const confirm = useCallback((action: () => void) => {
    action();
    closeConfirm();
  }, [closeConfirm]);

  return {
    isOpen,
    item,
    openConfirm,
    closeConfirm,
    confirm,
  };
}
