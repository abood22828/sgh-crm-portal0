import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Users, Loader2, Phone, MessageSquare } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useFormatDate } from "@/hooks/useFormatDate";
import { usePhoneFormat } from "@/hooks/usePhoneFormat";
import { SOURCE_LABELS, SOURCE_COLORS } from "@shared/sources";
import ActionButtons from "@/components/ActionButtons";

const statusLabels: Record<string, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  booked: "تم الحجز",
  not_interested: "غير مهتم",
  no_answer: "لم يرد",
};

const statusConfig: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  new: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200" },
  contacted: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
  booked: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  not_interested: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", border: "border-red-200" },
  no_answer: { bg: "bg-muted/50 dark:bg-gray-800", text: "text-foreground dark:text-gray-300", dot: "bg-gray-500", border: "border-border dark:border-gray-700" },
};

interface LeadTableDesktopProps {
  leads: any[];
  isLoading: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onUpdateStatus: (lead: any) => void;
}

export default function LeadTableDesktop({
  leads,
  isLoading,
  hasActiveFilters,
  onClearFilters,
  onUpdateStatus,
}: LeadTableDesktopProps) {
  const { formatDate } = useFormatDate();
  const { formatPhoneDisplay } = usePhoneFormat();

  return (
    <div className="hidden md:block rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold">الاسم</TableHead>
              <TableHead className="font-semibold">الهاتف</TableHead>
              <TableHead className="font-semibold">البريد الإلكتروني</TableHead>
              <TableHead className="font-semibold">المصدر</TableHead>
              <TableHead className="font-semibold">الحالة</TableHead>
              <TableHead className="font-semibold">التاريخ</TableHead>
              <TableHead className="font-semibold text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={!isLoading && leads.length > 0 ? 'stagger-rows' : ''}>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState
                    icon={Users}
                    title="لا توجد تسجيلات"
                    description={hasActiveFilters ? "لا توجد نتائج مطابقة للفلاتر المحددة." : "لم يتم تسجيل أي عملاء بعد."}
                    action={hasActiveFilters ? { label: "مسح الفلاتر", onClick: onClearFilters } : undefined}
                    compact
                  />
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead: any) => {
                const sc = statusConfig[lead.status] || statusConfig.new;
                return (
                  <TableRow
                    key={`lead-${lead.id}`}
                    className={`group ${lead.status === 'new' ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-muted/30'}`}
                  >
                    <TableCell className="font-medium">{lead.fullName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs">{formatPhoneDisplay(lead.phone)}</span>
                        <ActionButtons
                          phoneNumber={lead.phone}
                          size="icon"
                          variant="ghost"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.email ? (
                        <a href={`mailto:${lead.email}`} className="text-xs text-primary hover:underline">{lead.email}</a>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.source ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium"
                          style={{
                            backgroundColor: SOURCE_COLORS[lead.source] ? `${SOURCE_COLORS[lead.source]}15` : undefined,
                            borderColor: SOURCE_COLORS[lead.source] || undefined,
                            color: SOURCE_COLORS[lead.source] || undefined,
                          }}
                        >
                          {SOURCE_LABELS[lead.source] || lead.source}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${sc.bg} ${sc.text} border-0 text-[10px] gap-1`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} inline-block`} />
                        {statusLabels[lead.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(lead.createdAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => onUpdateStatus(lead)}
                      >
                        تحديث الحالة
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
