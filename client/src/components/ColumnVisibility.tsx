import { useState } from "react";
import { Settings, Save, Trash2, BookTemplate, ChevronDown, Check, Plus } from "lucide-react";
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

export interface ColumnConfig {
  key: string;
  label: string;
  defaultVisible: boolean;
}

export interface ColumnTemplate {
  id: string;
  name: string;
  columns: Record<string, boolean>;
  isDefault?: boolean;
}

interface ColumnVisibilityProps {
  columns: ColumnConfig[];
  visibleColumns: Record<string, boolean>;
  onVisibilityChange: (columnKey: string, visible: boolean) => void;
  onReset: () => void;
  // Template support
  templates?: ColumnTemplate[];
  activeTemplateId?: string | null;
  onApplyTemplate?: (template: ColumnTemplate) => void;
  onSaveTemplate?: (name: string, columns: Record<string, boolean>) => void;
  onDeleteTemplate?: (templateId: string) => void;
  tableKey?: string; // unique key for the table (e.g., 'appointments', 'offerLeads', 'campRegistrations')
}

// Built-in default templates generator
export function getDefaultTemplates(columns: ColumnConfig[], tableKey: string): ColumnTemplate[] {
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
    { id: `${tableKey}_default_basic`, name: 'عرض أساسي', columns: basicColumns, isDefault: true },
    { id: `${tableKey}_default_marketing`, name: 'عرض تسويقي', columns: marketingColumns, isDefault: true },
    { id: `${tableKey}_default_full`, name: 'عرض كامل', columns: fullColumns, isDefault: true },
  ];
}

export function ColumnVisibility({
  columns,
  visibleColumns,
  onVisibilityChange,
  onReset,
  templates = [],
  activeTemplateId,
  onApplyTemplate,
  onSaveTemplate,
  onDeleteTemplate,
  tableKey,
}: ColumnVisibilityProps) {
  const visibleCount = Object.values(visibleColumns).filter(Boolean).length;
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const hasTemplateSupport = onApplyTemplate && onSaveTemplate && onDeleteTemplate;

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) {
      toast.error('يرجى إدخال اسم القالب');
      return;
    }
    if (onSaveTemplate) {
      onSaveTemplate(newTemplateName.trim(), { ...visibleColumns });
      setNewTemplateName('');
      setSaveDialogOpen(false);
      toast.success(`تم حفظ القالب "${newTemplateName.trim()}" بنجاح`);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (onDeleteTemplate) {
      onDeleteTemplate(templateId);
      setDeleteConfirmId(null);
      toast.success('تم حذف القالب بنجاح');
    }
  };

  const activeTemplate = templates.find(t => t.id === activeTemplateId);

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Template Selector Dropdown */}
        {hasTemplateSupport && templates.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <BookTemplate className="h-3.5 w-3.5" />
                <span className="hidden sm:inline max-w-[100px] truncate">
                  {activeTemplate ? activeTemplate.name : 'القوالب'}
                </span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                القوالب الافتراضية
              </div>
              {templates.filter(t => t.isDefault).map((template) => (
                <DropdownMenuItem
                  key={template.id}
                  onClick={() => onApplyTemplate(template)}
                  className="flex items-center justify-between"
                >
                  <span>{template.name}</span>
                  {activeTemplateId === template.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}

              {templates.filter(t => !t.isDefault).length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    القوالب المخصصة
                  </div>
                  {templates.filter(t => !t.isDefault).map((template) => (
                    <DropdownMenuItem
                      key={template.id}
                      className="flex items-center justify-between group"
                    >
                      <span
                        className="flex-1 cursor-pointer"
                        onClick={() => onApplyTemplate(template)}
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
              <DropdownMenuItem
                onClick={() => setSaveDialogOpen(true)}
                className="text-primary"
              >
                <Plus className="h-4 w-4 ml-2" />
                حفظ كقالب جديد
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Column Visibility Popover */}
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
          <PopoverContent className="w-64" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">اختيار الأعمدة</h4>
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
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {columns.map((column) => (
                  <div key={column.key} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={`column-${column.key}`}
                      checked={visibleColumns[column.key] ?? column.defaultVisible}
                      onCheckedChange={(checked) =>
                        onVisibilityChange(column.key, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`column-${column.key}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Save Template Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>حفظ قالب جديد</DialogTitle>
            <DialogDescription>
              سيتم حفظ إعدادات الأعمدة الحالية كقالب يمكنك استخدامه لاحقاً
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

      {/* Delete Confirmation Dialog */}
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
    </>
  );
}
