import { useFormatDate } from "@/hooks/useFormatDate";
import { unifiedStatusLabels as statusLabels, unifiedStatusOptions, formatStatusTime } from "@/hooks/useStatusLabels";
import { ResizableTable, ResizableHeaderCell, FrozenTableCell } from "@/components/ResizableTable";
import { getColumnWidth, type ColumnConfig } from "@/components/ColumnVisibility";
import TableSkeleton from "@/components/TableSkeleton";
import EmptyState from "@/components/EmptyState";
import InlineStatusEditor from "@/components/InlineStatusEditor";
import CommentCount from "@/components/CommentCount";
import TaskCount from "@/components/TaskCount";
import { printReceipt } from "@/components/PrintReceipt";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Phone,
  Settings,
  Printer,
  CalendarOff,
} from "lucide-react";
import { SOURCE_LABELS, SOURCE_COLORS } from "@shared/sources";
import { usePhoneFormat } from "@/hooks/usePhoneFormat";

interface AppointmentTableDesktopProps {
  appointments: any[];
  isLoading: boolean;
  columns: ColumnConfig[];
  visibleColumns: Record<string, boolean>;
  columnOrder: string[];
  frozenColumns: string[];
  columnWidths: {
    columnWidths: Record<string, number>;
    getWidth: (key: string) => number;
    handleResize: (key: string, width: number) => void;
  };
  getSortProps: (key: string) => any;
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  onOpenDialog: (appointment: any) => void;
  onUpdateStatus: (id: number, status: string) => Promise<void>;
  userName: string;
}

export default function AppointmentTableDesktop({
  appointments,
  isLoading,
  columns,
  visibleColumns,
  columnOrder,
  frozenColumns,
  columnWidths,
  getSortProps,
  selectedIds,
  onSelectionChange,
  onOpenDialog,
  onUpdateStatus,
  userName,
}: AppointmentTableDesktopProps) {
  const { formatPhoneDisplay, getWhatsAppLink, getCallLink } = usePhoneFormat();
  const { formatDate } = useFormatDate();
  const visibleColumnKeys = columnOrder.filter(key => visibleColumns[key]);

  return (
    <div className="table-responsive">
      <ResizableTable
        frozenColumns={frozenColumns}
        columnWidths={columnWidths.columnWidths}
        visibleColumnOrder={visibleColumnKeys}
      >
        <TableHeader>
          <TableRow>
            {visibleColumnKeys.map(colKey => {
              const col = columns.find(c => c.key === colKey);
              if (!col) return null;
              if (colKey === 'checkbox') {
                return (
                  <ResizableHeaderCell key={colKey} columnKey={colKey} width={40} minWidth={40} maxWidth={40} onResize={() => {}}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === appointments.length && appointments.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onSelectionChange(appointments.map((a: any) => a.id));
                        } else {
                          onSelectionChange([]);
                        }
                      }}
                      className="rounded border-border"
                    />
                  </ResizableHeaderCell>
                );
              }
              const widthConfig = getColumnWidth(colKey, col);
              return (
                <ResizableHeaderCell
                  key={colKey}
                  columnKey={colKey}
                  width={columnWidths.getWidth(colKey)}
                  minWidth={widthConfig.min}
                  maxWidth={widthConfig.max}
                  onResize={columnWidths.handleResize}
                  {...getSortProps(colKey)}
                >
                  {col.label}
                </ResizableHeaderCell>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody className={!isLoading && appointments.length > 0 ? 'stagger-rows' : ''}>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={visibleColumnKeys.length || 1} className="p-0">
                <TableSkeleton rows={5} columns={visibleColumnKeys.length || 11} />
              </TableCell>
            </TableRow>
          ) : appointments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={visibleColumnKeys.length || 1} className="py-12">
                <EmptyState
                  icon={CalendarOff}
                  title="لا توجد مواعيد"
                  description="لم يتم العثور على أي مواعيد في الفترة المحددة. جرب تغيير الفلاتر أو إضافة موعد جديد."
                />
              </TableCell>
            </TableRow>
          ) : (
            appointments.map((appointment: any) => (
              <TableRow 
                key={`appointment-${appointment.id}`}
                className={appointment.status === 'pending' ? 'bg-red-50 hover:bg-red-100' : ''}
              >
                {visibleColumnKeys.map(colKey => {
                  switch(colKey) {
                    case 'checkbox':
                      return (
                        <FrozenTableCell key={colKey} columnKey={colKey}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(appointment.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                onSelectionChange([...selectedIds, appointment.id]);
                              } else {
                                onSelectionChange(selectedIds.filter((id: number) => id !== appointment.id));
                              }
                            }}
                            className="rounded border-border"
                          />
                        </FrozenTableCell>
                      );
                    case 'receiptNumber':
                      return <FrozenTableCell key={colKey} columnKey={colKey} className="text-sm text-muted-foreground font-mono">{appointment.receiptNumber || "-"}</FrozenTableCell>;
                    case 'date':
                      return <FrozenTableCell key={colKey} columnKey={colKey}>{formatDate(appointment.createdAt)}</FrozenTableCell>;
                    case 'name':
                      return (
                        <FrozenTableCell key={colKey} columnKey={colKey}>
                          <span className="font-medium">{appointment.fullName || appointment.patientName}</span>
                        </FrozenTableCell>
                      );
                    case 'phone':
                      return (
                        <FrozenTableCell key={colKey} columnKey={colKey}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{formatPhoneDisplay(appointment.phone)}</span>
                            <a href={`tel:${formatPhoneDisplay(appointment.phone)}`} className="text-primary hover:underline">
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </FrozenTableCell>
                      );
                    case 'email':
                      return <FrozenTableCell key={colKey} columnKey={colKey}>{appointment.email || '-'}</FrozenTableCell>;
                    case 'age':
                      return <FrozenTableCell key={colKey} columnKey={colKey}>{appointment.age || '-'}</FrozenTableCell>;
                    case 'doctor':
                      return <FrozenTableCell key={colKey} columnKey={colKey}>{appointment.doctorName || '-'}</FrozenTableCell>;
                    case 'specialty':
                      return <FrozenTableCell key={colKey} columnKey={colKey}>{appointment.doctorSpecialty || '-'}</FrozenTableCell>;
                    case 'procedure':
                      return <FrozenTableCell key={colKey} columnKey={colKey}>{appointment.procedure || '-'}</FrozenTableCell>;
                    case 'preferredDate':
                      return <FrozenTableCell key={colKey} columnKey={colKey}>{formatDate(appointment.preferredDate)}</FrozenTableCell>;
                    case 'preferredTime':
                      return <FrozenTableCell key={colKey} columnKey={colKey}>{appointment.preferredTime || '-'}</FrozenTableCell>;
                    case 'appointmentDate':
                      return <FrozenTableCell key={colKey} columnKey={colKey}>{formatDate(appointment.appointmentDate)}</FrozenTableCell>;
                    case 'notes':
                      return <FrozenTableCell key={colKey} columnKey={colKey} wrap title={appointment.notes}>{appointment.notes || '-'}</FrozenTableCell>;
                    case 'additionalNotes':
                      return <FrozenTableCell key={colKey} columnKey={colKey} wrap title={appointment.additionalNotes}>{appointment.additionalNotes || '-'}</FrozenTableCell>;
                    case 'staffNotes':
                      return <FrozenTableCell key={colKey} columnKey={colKey} wrap title={appointment.staffNotes}>{appointment.staffNotes || '-'}</FrozenTableCell>;
                    case 'source':
                      return (
                        <FrozenTableCell key={colKey} columnKey={colKey}>
                          {appointment.source ? (
                            <Badge 
                              variant="outline" 
                              className="text-xs font-medium"
                              style={{
                                backgroundColor: SOURCE_COLORS[appointment.source] ? `${SOURCE_COLORS[appointment.source]}15` : undefined,
                                borderColor: SOURCE_COLORS[appointment.source] || undefined,
                                color: SOURCE_COLORS[appointment.source] || undefined,
                              }}
                            >
                              {SOURCE_LABELS[appointment.source] || appointment.source}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </FrozenTableCell>
                      );
                    case 'status':
                      return (
                        <FrozenTableCell key={colKey} columnKey={colKey}>
                          <InlineStatusEditor
                            currentStatus={appointment.status}
                            statusOptions={unifiedStatusOptions}
                            onSave={async (newStatus) => {
                              await onUpdateStatus(appointment.id, newStatus);
                            }}
                          />
                        </FrozenTableCell>
                      );
                    case 'contactedAt':
                      return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs text-muted-foreground">{formatStatusTime(appointment.contactedAt)}</FrozenTableCell>;
                    case 'confirmedAt':
                      return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs text-muted-foreground">{formatStatusTime(appointment.confirmedAt)}</FrozenTableCell>;
                    case 'attendedAt':
                      return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs text-muted-foreground">{formatStatusTime(appointment.attendedAt)}</FrozenTableCell>;
                    case 'completedAt':
                      return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs text-muted-foreground">{formatStatusTime(appointment.completedAt)}</FrozenTableCell>;
                    case 'cancelledAt':
                      return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs text-muted-foreground">{formatStatusTime(appointment.cancelledAt)}</FrozenTableCell>;
                    case 'utmSource':
                    case 'utmMedium':
                    case 'utmCampaign':
                    case 'utmTerm':
                    case 'utmContent':
                    case 'utmPlacement':
                    case 'referrer':
                      return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs">{appointment[colKey] || '-'}</FrozenTableCell>;
                    case 'fbclid':
                    case 'gclid':
                      return <FrozenTableCell key={colKey} columnKey={colKey} className="text-xs font-mono">{appointment[colKey] || '-'}</FrozenTableCell>;
                    case 'comments':
                      return <FrozenTableCell key={colKey} columnKey={colKey}><CommentCount entityType="appointment" entityId={appointment.id} /></FrozenTableCell>;
                    case 'tasks':
                      return <FrozenTableCell key={colKey} columnKey={colKey}><TaskCount entityType="appointment" entityId={appointment.id} /></FrozenTableCell>;
                    case 'actions':
                      return (
                        <FrozenTableCell key={colKey} columnKey={colKey}>
                          <div className="flex gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onOpenDialog(appointment)}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>تحديث الحالة</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => {
                                    const doctorName = appointment.doctorName || `طبيب #${appointment.doctorId}`;
                                    printReceipt({
                                      fullName: appointment.fullName || appointment.patientName,
                                      phone: appointment.phone,
                                      age: appointment.age ?? undefined,
                                      registrationDate: new Date(appointment.createdAt || appointment.appointmentDate),
                                      type: "appointment",
                                      typeName: doctorName
                                    }, userName);
                                  }}
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>طباعة السند</p></TooltipContent>
                            </Tooltip>
                          </div>
                        </FrozenTableCell>
                      );
                    default:
                      return <FrozenTableCell key={colKey} columnKey={colKey}>-</FrozenTableCell>;
                  }
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </ResizableTable>
    </div>
  );
}
