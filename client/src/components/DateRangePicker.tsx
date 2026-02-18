import { Calendar } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface DateRangePickerProps {
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFrom, setTempFrom] = useState<Date | undefined>(dateRange.from);
  const [tempTo, setTempTo] = useState<Date | undefined>(dateRange.to);

  const handleApply = () => {
    if (tempFrom && tempTo) {
      onDateRangeChange({ from: tempFrom, to: tempTo });
      setIsOpen(false);
    }
  };

  const handleQuickSelect = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    onDateRangeChange({ from, to });
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">
            {format(dateRange.from, "dd MMM yyyy", { locale: ar })} - {format(dateRange.to, "dd MMM yyyy", { locale: ar })}
          </span>
          <span className="sm:hidden">النطاق الزمني</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4" dir="rtl">
          <div className="text-sm font-medium">اختر النطاق الزمني</div>
          
          {/* Quick Select Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickSelect(7)}
              className="text-xs"
            >
              آخر 7 أيام
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickSelect(30)}
              className="text-xs"
            >
              آخر 30 يوم
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickSelect(90)}
              className="text-xs"
            >
              آخر 90 يوم
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const to = new Date();
                const from = new Date(to.getFullYear(), 0, 1);
                onDateRangeChange({ from, to });
                setIsOpen(false);
              }}
              className="text-xs"
            >
              هذا العام
            </Button>
          </div>

          {/* Custom Date Selection */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">أو اختر تاريخ مخصص:</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1 block">من</label>
                <CalendarComponent
                  mode="single"
                  selected={tempFrom}
                  onSelect={setTempFrom}
                  locale={ar}
                  className="rounded-md border"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">إلى</label>
                <CalendarComponent
                  mode="single"
                  selected={tempTo}
                  onSelect={setTempTo}
                  locale={ar}
                  className="rounded-md border"
                  disabled={(date) => tempFrom ? date < tempFrom : false}
                />
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <Button
            onClick={handleApply}
            disabled={!tempFrom || !tempTo}
            className="w-full"
          >
            تطبيق
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
