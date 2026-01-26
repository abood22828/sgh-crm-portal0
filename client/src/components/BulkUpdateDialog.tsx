import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface BulkUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  statusOptions: { value: string; label: string }[];
  onConfirm: (newStatus: string) => void;
  isLoading?: boolean;
}

export default function BulkUpdateDialog({
  open,
  onOpenChange,
  selectedCount,
  statusOptions,
  onConfirm,
  isLoading = false,
}: BulkUpdateDialogProps) {
  const [newStatus, setNewStatus] = useState("");

  const handleConfirm = () => {
    if (newStatus) {
      onConfirm(newStatus);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تحديث الحالة المحددة</DialogTitle>
          <DialogDescription>
            سيتم تحديث حالة {selectedCount} عنصر محدد. اختر الحالة الجديدة:
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الحالة الجديدة" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!newStatus || isLoading}
          >
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            تحديث
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
