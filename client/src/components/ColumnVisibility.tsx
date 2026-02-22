import { useState } from "react";
import { Settings, Save, Trash2, BookTemplate, ChevronDown, Check, Plus, Globe, User } from "lucide-react";
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
  isShared?: boolean;
  createdByName?: string | null;
  dbId?: number; // database ID for shared templates
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
  tableKey?: string;
  // Shared template support (admin only)
  isAdmin?: boolean;
  sharedTemplates?: ColumnTemplate[];
  onSaveSharedTemplate?: (name: string, columns: Record<string, boolean>) => void;
  onDeleteSharedTemplate?: (dbId: number) => void;
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

  const handleSaveSharedTemplate = () => {
    if (!newSharedTemplateName.trim()) {
      toast.error('يرجى إدخال اسم القالب المشترك');
      return;
    }
    if (onSaveSharedTemplate) {
      onSaveSharedTemplate(newSharedTemplateName.trim(), { ...visibleColumns });
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

      {/* Save Personal Template Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              حفظ قالب شخصي
            </DialogTitle>
            <DialogDescription>
              سيتم حفظ إعدادات الأعمدة الحالية كقالب شخصي خاص بك فقط
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
              سيتم حفظ إعدادات الأعمدة الحالية كقالب مشترك يظهر لجميع المستخدمين
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
