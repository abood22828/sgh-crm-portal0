/**
 * AuditLogSection - مكون عرض سجل التغييرات
 * يعرض تاريخ التغييرات على سجل محدد
 */

import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Clock, User, ArrowRight } from "lucide-react";

const statusLabels: Record<string, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  booked: "تم الحجز",
  not_interested: "غير مهتم",
  no_answer: "لم يرد",
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  completed: "مكتمل",
  cancelled: "ملغي",
  attended: "حضر",
};

const actionLabels: Record<string, string> = {
  status_change: "تغيير الحالة",
  bulk_status_change: "تغيير جماعي للحالة",
  create: "إنشاء",
  update: "تحديث",
  delete: "حذف",
};

function formatDateTime(date: string | Date | null | undefined) {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

interface AuditLogSectionProps {
  entityType: string;
  entityId: number;
}

export default function AuditLogSection({ entityType, entityId }: AuditLogSectionProps) {
  const { data: logs, isLoading } = trpc.auditLogs.getByEntity.useQuery(
    { entityType, entityId },
    { enabled: !!entityId }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">لا يوجد سجل تغييرات بعد</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground mb-2">سجل التغييرات ({logs.length})</h4>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute right-3 top-0 bottom-0 w-0.5 bg-border" />
        
        <div className="space-y-4">
          {logs.map((log: any) => (
            <div key={log.id} className="relative flex gap-3 pr-8">
              {/* Timeline dot */}
              <div className="absolute right-1.5 top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
              
              <div className="flex-1 bg-muted/30 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {actionLabels[log.action] || log.action}
                    </Badge>
                    {log.userName && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {log.userName}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
                
                {/* Status change visualization */}
                {(log.action === 'status_change' || log.action === 'bulk_status_change') && (
                  <div className="flex items-center gap-2 mt-1">
                    {log.oldValue && (
                      <Badge variant="secondary" className="text-xs">
                        {statusLabels[log.oldValue] || log.oldValue}
                      </Badge>
                    )}
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <Badge className="text-xs bg-primary/10 text-primary">
                      {statusLabels[log.newValue] || log.newValue}
                    </Badge>
                  </div>
                )}
                
                {log.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{log.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
