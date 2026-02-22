import { useState, useMemo } from "react";
import { Settings, Save, Trash2, BookTemplate, ChevronDown, Check, Plus, Globe, User, GripVertical, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface ColumnConfig {
  key: string;
  label: string;
  defaultVisible: boolean;
  /** Default width in pixels for this column */
  defaultWidth?: number;
  /** Minimum width in pixels */
  minWidth?: number;
  /** Maximum width in pixels */
  maxWidth?: number;
  /** Whether this column is sortable (default: true) */
  sortable?: boolean;
  /** Sort type hint for proper comparison: 'string' | 'number' | 'date' | 'boolean' (default: 'string') */
  sortType?: 'string' | 'number' | 'date' | 'boolean';
}

// Smart default widths based on column content type
export const COLUMN_WIDTH_PRESETS: Record<string, { width: number; min: number; max: number }> = {
  // IDs & Numbers
  receiptNumber: { width: 100, min: 60, max: 200 },
  ticketNumber: { width: 100, min: 60, max: 200 },
  id: { width: 60, min: 40, max: 120 },
  // Names
  name: { width: 160, min: 80, max: 400 },
  fullName: { width: 180, min: 80, max: 400 },
  doctor: { width: 150, min: 80, max: 350 },
  doctorName: { width: 150, min: 80, max: 350 },
  // Contact
  phone: { width: 140, min: 90, max: 250 },
  email: { width: 180, min: 100, max: 400 },
  // Dates
  date: { width: 110, min: 70, max: 200 },
  createdAt: { width: 110, min: 70, max: 200 },
  preferredDate: { width: 110, min: 70, max: 200 },
  appointmentDate: { width: 110, min: 70, max: 200 },
  attendanceDate: { width: 110, min: 70, max: 200 },
  registrationDate: { width: 110, min: 70, max: 200 },
  // Status & Badges
  status: { width: 120, min: 70, max: 220 },
  source: { width: 110, min: 60, max: 220 },
  // Short text
  age: { width: 70, min: 40, max: 150 },
  gender: { width: 70, min: 40, max: 150 },
  specialty: { width: 130, min: 70, max: 300 },
  procedure: { width: 130, min: 70, max: 300 },
  preferredTime: { width: 100, min: 60, max: 200 },
  camp: { width: 140, min: 80, max: 300 },
  offer: { width: 140, min: 80, max: 300 },
  // Long text (notes)
  notes: { width: 180, min: 80, max: 500 },
  additionalNotes: { width: 180, min: 80, max: 500 },
  staffNotes: { width: 180, min: 80, max: 500 },
  statusNotes: { width: 180, min: 80, max: 500 },
  medicalCondition: { width: 160, min: 80, max: 400 },
  procedures: { width: 160, min: 80, max: 400 },
  // UTM fields
  utmSource: { width: 110, min: 60, max: 250 },
  utmMedium: { width: 110, min: 60, max: 250 },
  utmCampaign: { width: 130, min: 60, max: 300 },
  utmTerm: { width: 110, min: 60, max: 250 },
  utmContent: { width: 110, min: 60, max: 250 },
  utmPlacement: { width: 110, min: 60, max: 250 },
  referrer: { width: 140, min: 60, max: 300 },
  fbclid: { width: 120, min: 60, max: 250 },
  gclid: { width: 120, min: 60, max: 250 },
  // Actions & interactive
  comments: { width: 80, min: 50, max: 150 },
  tasks: { width: 80, min: 50, max: 150 },
  actions: { width: 140, min: 80, max: 250 },
};

/** Get width config for a column key */
export function getColumnWidth(key: string, config?: ColumnConfig): { width: number; min: number; max: number } {
  if (config?.defaultWidth) {
    return {
      width: config.defaultWidth,
      min: config.minWidth || Math.max(50, config.defaultWidth - 40),
      max: config.maxWidth || config.defaultWidth + 100,
    };
  }
  return COLUMN_WIDTH_PRESETS[key] || { width: 120, min: 60, max: 250 };
}

export interface ColumnTemplate {
  id: string;
  name: string;
  columns: Record<string, boolean>;
  columnOrder?: string[]; // ordered column keys
  columnWidths?: Record<string, number>; // custom column widths
  frozenColumns?: string[]; // frozen/sticky column keys
  isDefault?: boolean;
  isShared?: boolean;
  createdByName?: string | null;
  dbId?: number; // database ID for shared templates
}

interface ColumnVisibilityProps {
  columns: ColumnConfig[];
  visibleColumns: Record<string, boolean>;
  columnOrder: string[]; // current column order
  onVisibilityChange: (columnKey: string, visible: boolean) => void;
  onColumnOrderChange: (newOrder: string[]) => void;
  onReset: () => void;
  // Template support
  templates?: ColumnTemplate[];
  activeTemplateId?: string | null;
  onApplyTemplate?: (template: ColumnTemplate) => void;
  onSaveTemplate?: (name: string, columns: Record<string, boolean>, columnOrder: string[], columnWidths?: Record<string, number>, frozenColumns?: string[]) => void;
  onDeleteTemplate?: (templateId: string) => void;
  tableKey?: string;
  // Column widths support
  columnWidths?: Record<string, number>;
  // Frozen columns support
  frozenColumns?: string[];
  onToggleFrozen?: (columnKey: string) => void;
  // Shared template support (admin only)
  isAdmin?: boolean;
  sharedTemplates?: ColumnTemplate[];
  onSaveSharedTemplate?: (name: string, columns: Record<string, boolean>, columnOrder: string[], columnWidths?: Record<string, number>, frozenColumns?: string[]) => void;
  onDeleteSharedTemplate?: (dbId: number) => void;
}

// Built-in default templates generator
export function getDefaultTemplates(columns: ColumnConfig[], tableKey: string): ColumnTemplate[] {
  const defaultOrder = columns.map(c => c.key);

  // Basic template - only essential columns
  const basicColumns: Record<string, boolean> = {};
  const essentialKeys = ['ticketNumber', 'fullName', 'phone', 'status', 'createdAt', 'actions'];
  columns.forEach(col => {
    basicColumns[col.key] = essentialKeys.includes(col.key);
  });

  // Marketing template - includes UTM and source data
  const marketingColumns: Record<string, boolean> = {};
  const marketingKeys = ['ticketNumber', 'fullName', 'phone', 'source', 'status', 'createdAt',
    'utmSource', 'utmMedium', 'utmCampaign', 'utmTerm', 'utmContent', 'utmPlacement',
    'referrer', 'fbclid', 'gclid', 'actions'];
  columns.forEach(col => {
    marketingColumns[col.key] = marketingKeys.includes(col.key);
  });

  // Full template - all columns visible
  const fullColumns: Record<string, boolean> = {};
  columns.forEach(col => {
    fullColumns[col.key] = true;
  });

  return [
    { id: `${tableKey}_default_basic`, name: 'عرض أساسي', columns: basicColumns, columnOrder: defaultOrder, isDefault: true },
    { id: `${tableKey}_default_marketing`, name: 'عرض تسويقي', columns: marketingColumns, columnOrder: defaultOrder, isDefault: true },
    { id: `${tableKey}_default_full`, name: 'عرض كامل', columns: fullColumns, columnOrder: defaultOrder, isDefault: true },
  ];
}

// Sortable column item component
function SortableColumnItem({ column, isVisible, onVisibilityChange, isFrozen, onToggleFrozen }: {
  column: ColumnConfig;
  isVisible: boolean;
  onVisibilityChange: (key: string, visible: boolean) => void;
  isFrozen?: boolean;
  onToggleFrozen?: (key: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1.5 py-1 px-1 rounded-md ${isDragging ? 'bg-accent shadow-md' : 'hover:bg-accent/50'}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 text-muted-foreground hover:text-foreground touch-none"
        tabIndex={-1}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <Checkbox
        id={`column-${column.key}`}
        checked={isVisible}
        onCheckedChange={(checked) =>
          onVisibilityChange(column.key, checked as boolean)
        }
      />
      <Label
        htmlFor={`column-${column.key}`}
        className="text-sm font-normal cursor-pointer flex-1 select-none"
      >
        {column.label}
      </Label>
      {onToggleFrozen && isVisible && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFrozen(column.key);
          }}
          className={`p-0.5 rounded transition-colors ${
            isFrozen 
              ? 'text-blue-600 bg-blue-100 hover:bg-blue-200' 
              : 'text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent'
          }`}
          title={isFrozen ? 'إلغاء تجميد العمود' : 'تجميد العمود'}
        >
          <Snowflake className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export function ColumnVisibility({
  columns,
  visibleColumns,
  columnOrder,
  onVisibilityChange,
  onColumnOrderChange,
  onReset,
  templates = [],
  activeTemplateId,
  onApplyTemplate,
  onSaveTemplate,
  onDeleteTemplate,
  tableKey,
  columnWidths,
  frozenColumns = [],
  onToggleFrozen,
  isAdmin = false,
  sharedTemplates = [],
  onSaveSharedTemplate,
  onDeleteSharedTemplate,
}: ColumnVisibilityProps) {
  const visibleCount = Object.values(visibleColumns).filter(Boolean).length;
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveSharedDialogOpen, setSaveSharedDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newSharedTemplateName, setNewSharedTemplateName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteSharedConfirmId, setDeleteSharedConfirmId] = useState<number | null>(null);

  const hasTemplateSupport = onApplyTemplate && onSaveTemplate && onDeleteTemplate;
  const hasSharedTemplateSupport = isAdmin && onSaveSharedTemplate && onDeleteSharedTemplate;

  // Sort columns by current order
  const orderedColumns = useMemo(() => {
    const orderMap = new Map(columnOrder.map((key, idx) => [key, idx]));
    return [...columns].sort((a, b) => {
      const aIdx = orderMap.get(a.key) ?? 999;
      const bIdx = orderMap.get(b.key) ?? 999;
      return aIdx - bIdx;
    });
  }, [columns, columnOrder]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over.id as string);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(columnOrder, oldIndex, newIndex);
        onColumnOrderChange(newOrder);
      }
    }
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) {
      toast.error('يرجى إدخال اسم القالب');
      return;
    }
    if (onSaveTemplate) {
      onSaveTemplate(newTemplateName.trim(), { ...visibleColumns }, [...columnOrder], columnWidths ? { ...columnWidths } : undefined, frozenColumns.length > 0 ? [...frozenColumns] : undefined);
      setNewTemplateName('');
      setSaveDialogOpen(false);
      toast.success(`تم حفظ القالب "${newTemplateName.trim()}" بنجاح`);
    }
  };

  const handleSaveSharedTemplate = () => {
    if (!newSharedTemplateName.trim()) {
      toast.error('يرجى إدخال اسم القالب المشترك');
      return;
    }
    if (onSaveSharedTemplate) {
      onSaveSharedTemplate(newSharedTemplateName.trim(), { ...visibleColumns }, [...columnOrder], columnWidths ? { ...columnWidths } : undefined, frozenColumns.length > 0 ? [...frozenColumns] : undefined);
      setNewSharedTemplateName('');
      setSaveSharedDialogOpen(false);
      toast.success(`تم حفظ القالب المشترك "${newSharedTemplateName.trim()}" بنجاح - سيظهر لجميع المستخدمين`);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (onDeleteTemplate) {
      onDeleteTemplate(templateId);
      setDeleteConfirmId(null);
      toast.success('تم حذف القالب بنجاح');
    }
  };

  const handleDeleteSharedTemplate = (dbId: number) => {
    if (onDeleteSharedTemplate) {
      onDeleteSharedTemplate(dbId);
      setDeleteSharedConfirmId(null);
      toast.success('تم حذف القالب المشترك بنجاح');
    }
  };

  const activeTemplate = [...templates, ...sharedTemplates].find(t => t.id === activeTemplateId);

  // Combine all templates for the dropdown
  const defaultTemplates = templates.filter(t => t.isDefault);
  const customTemplates = templates.filter(t => !t.isDefault);

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Template Selector Dropdown */}
        {hasTemplateSupport && (templates.length > 0 || sharedTemplates.length > 0) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <BookTemplate className="h-3.5 w-3.5" />
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {activeTemplate ? activeTemplate.name : 'القوالب'}
                </span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {/* Default Templates */}
              {defaultTemplates.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    القوالب الافتراضية
                  </div>
                  {defaultTemplates.map((template) => (
                    <DropdownMenuItem
                      key={template.id}
                      onClick={() => onApplyTemplate!(template)}
                      className="flex items-center justify-between"
                    >
                      <span>{template.name}</span>
                      {activeTemplateId === template.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              {/* Shared Templates (from admin) */}
              {sharedTemplates.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    قوالب مشتركة (من المدير)
                  </div>
                  {sharedTemplates.map((template) => (
                    <DropdownMenuItem
                      key={template.id}
                      className="flex items-center justify-between group"
                    >
                      <span
                        className="flex-1 cursor-pointer flex items-center gap-1.5"
                        onClick={() => onApplyTemplate!(template)}
                      >
                        <Globe className="h-3 w-3 text-blue-500 shrink-0" />
                        <span className="truncate">{template.name}</span>
                        {template.createdByName && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 shrink-0">
                            {template.createdByName}
                          </Badge>
                        )}
                      </span>
                      <div className="flex items-center gap-1">
                        {activeTemplateId === template.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                        {isAdmin && template.dbId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteSharedConfirmId(template.dbId!);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              {/* Custom (personal) Templates */}
              {customTemplates.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    قوالبي المخصصة
                  </div>
                  {customTemplates.map((template) => (
                    <DropdownMenuItem
                      key={template.id}
                      className="flex items-center justify-between group"
                    >
                      <span
                        className="flex-1 cursor-pointer"
                        onClick={() => onApplyTemplate!(template)}
                      >
                        {template.name}
                      </span>
                      <div className="flex items-center gap-1">
                        {activeTemplateId === template.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(template.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              <DropdownMenuSeparator />
              {/* Save personal template */}
              <DropdownMenuItem
                onClick={() => setSaveDialogOpen(true)}
                className="text-primary"
              >
                <Plus className="h-4 w-4 ml-2" />
                حفظ كقالب شخصي
              </DropdownMenuItem>

              {/* Save shared template (admin only) */}
              {hasSharedTemplateSupport && (
                <DropdownMenuItem
                  onClick={() => setSaveSharedDialogOpen(true)}
                  className="text-blue-600"
                >
                  <Globe className="h-4 w-4 ml-2" />
                  حفظ كقالب مشترك (للجميع)
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Column Visibility & Order Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">الأعمدة</span>
              <span className="text-xs text-muted-foreground">
                ({visibleCount}/{columns.length})
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">اختيار وترتيب الأعمدة</h4>
                <div className="flex items-center gap-1">
                  {hasTemplateSupport && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSaveDialogOpen(true)}
                      className="h-auto p-1 text-xs gap-1"
                      title="حفظ كقالب"
                    >
                      <Save className="h-3 w-3" />
                      حفظ
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    className="h-auto p-1 text-xs"
                  >
                    إعادة تعيين
                  </Button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground -mt-1">
                اسحب <GripVertical className="h-3 w-3 inline" /> لإعادة الترتيب • انقر <Snowflake className="h-3 w-3 inline text-blue-500" /> للتجميد
              </p>
              <div className="max-h-[350px] overflow-y-auto -mx-1 px-1">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={orderedColumns.map(c => c.key)}
                    strategy={verticalListSortingStrategy}
                  >
                    {orderedColumns.map((column) => (
                      <SortableColumnItem
                        key={column.key}
                        column={column}
                        isVisible={visibleColumns[column.key] ?? column.defaultVisible}
                        onVisibilityChange={onVisibilityChange}
                        isFrozen={frozenColumns.includes(column.key)}
                        onToggleFrozen={onToggleFrozen}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Save Personal Template Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              حفظ قالب شخصي
            </DialogTitle>
            <DialogDescription>
              سيتم حفظ إعدادات الأعمدة وترتيبها الحالي كقالب شخصي خاص بك فقط
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="template-name" className="text-sm font-medium">
              اسم القالب
            </Label>
            <Input
              id="template-name"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="مثال: عرض إداري"
              className="mt-2"
              dir="rtl"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTemplate();
              }}
            />
            <p className="text-xs text-muted-foreground mt-2">
              الأعمدة المرئية حالياً: {visibleCount} من {columns.length}
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveTemplate} disabled={!newTemplateName.trim()}>
              <Save className="h-4 w-4 ml-2" />
              حفظ القالب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Shared Template Dialog (Admin Only) */}
      <Dialog open={saveSharedDialogOpen} onOpenChange={setSaveSharedDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              حفظ قالب مشترك
            </DialogTitle>
            <DialogDescription>
              سيتم حفظ إعدادات الأعمدة وترتيبها الحالي كقالب مشترك يظهر لجميع المستخدمين
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="shared-template-name" className="text-sm font-medium">
              اسم القالب المشترك
            </Label>
            <Input
              id="shared-template-name"
              value={newSharedTemplateName}
              onChange={(e) => setNewSharedTemplateName(e.target.value)}
              placeholder="مثال: عرض التقارير الأسبوعية"
              className="mt-2"
              dir="rtl"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveSharedTemplate();
              }}
            />
            <p className="text-xs text-muted-foreground mt-2">
              الأعمدة المرئية حالياً: {visibleCount} من {columns.length}
            </p>
            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1">
                <Globe className="h-3 w-3" />
                هذا القالب سيكون متاحاً لجميع المستخدمين في النظام
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSaveSharedDialogOpen(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSaveSharedTemplate} 
              disabled={!newSharedTemplateName.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Globe className="h-4 w-4 ml-2" />
              حفظ للجميع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Personal Template Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>حذف القالب</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذا القالب؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDeleteTemplate(deleteConfirmId)}
            >
              <Trash2 className="h-4 w-4 ml-2" />
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Shared Template Confirmation Dialog */}
      <Dialog open={deleteSharedConfirmId !== null} onOpenChange={() => setDeleteSharedConfirmId(null)}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              حذف القالب المشترك
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذا القالب المشترك؟ سيتم إزالته من جميع المستخدمين. لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteSharedConfirmId(null)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteSharedConfirmId !== null && handleDeleteSharedTemplate(deleteSharedConfirmId)}
            >
              <Trash2 className="h-4 w-4 ml-2" />
              حذف للجميع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
