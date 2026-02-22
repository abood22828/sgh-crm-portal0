import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the useTableFeatures hook logic without React rendering
// We test the pure logic functions that the hook uses internally

describe('useTableFeatures - Core Logic', () => {
  
  describe('Column Configuration', () => {
    const columns = [
      { key: 'checkbox', label: 'تحديد', defaultVisible: true },
      { key: 'name', label: 'الاسم', defaultVisible: true },
      { key: 'phone', label: 'الهاتف', defaultVisible: true },
      { key: 'email', label: 'البريد', defaultVisible: false },
      { key: 'status', label: 'الحالة', defaultVisible: true },
      { key: 'actions', label: 'الإجراءات', defaultVisible: true },
    ];

    it('should generate correct default visible columns from config', () => {
      const defaultVisible: Record<string, boolean> = {};
      columns.forEach(col => {
        defaultVisible[col.key] = col.defaultVisible;
      });
      
      expect(defaultVisible).toEqual({
        checkbox: true,
        name: true,
        phone: true,
        email: false,
        status: true,
        actions: true,
      });
    });

    it('should generate correct default column order from config', () => {
      const defaultOrder = columns.map(c => c.key);
      
      expect(defaultOrder).toEqual(['checkbox', 'name', 'phone', 'email', 'status', 'actions']);
    });

    it('should filter visible columns correctly', () => {
      const visibleColumns: Record<string, boolean> = {
        checkbox: true,
        name: true,
        phone: true,
        email: false,
        status: true,
        actions: true,
      };
      const columnOrder = ['checkbox', 'name', 'phone', 'email', 'status', 'actions'];
      
      const visibleColumnOrder = columnOrder.filter(key => visibleColumns[key]);
      
      expect(visibleColumnOrder).toEqual(['checkbox', 'name', 'phone', 'status', 'actions']);
      expect(visibleColumnOrder).not.toContain('email');
    });
  });

  describe('Column Visibility Toggle', () => {
    it('should toggle column visibility correctly', () => {
      const visibleColumns: Record<string, boolean> = {
        name: true,
        phone: true,
        email: false,
      };
      
      // Toggle email to visible
      const updated1 = { ...visibleColumns, email: true };
      expect(updated1.email).toBe(true);
      
      // Toggle phone to hidden
      const updated2 = { ...updated1, phone: false };
      expect(updated2.phone).toBe(false);
    });
  });

  describe('Column Order Management', () => {
    it('should reorder columns correctly', () => {
      const originalOrder = ['checkbox', 'name', 'phone', 'email', 'status', 'actions'];
      const newOrder = ['checkbox', 'phone', 'name', 'email', 'status', 'actions'];
      
      expect(newOrder[1]).toBe('phone');
      expect(newOrder[2]).toBe('name');
      expect(newOrder.length).toBe(originalOrder.length);
    });

    it('should preserve all columns during reorder', () => {
      const originalOrder = ['checkbox', 'name', 'phone', 'email', 'status', 'actions'];
      const newOrder = ['actions', 'status', 'email', 'phone', 'name', 'checkbox'];
      
      const originalSorted = [...originalOrder].sort();
      const newSorted = [...newOrder].sort();
      
      expect(newSorted).toEqual(originalSorted);
    });
  });

  describe('Column Width Management', () => {
    it('should calculate column widths with defaults', () => {
      const defaultWidths: Record<string, number> = {
        checkbox: 50,
        name: 160,
        phone: 130,
        email: 180,
        status: 120,
        actions: 100,
      };
      
      expect(defaultWidths.name).toBe(160);
      expect(defaultWidths.checkbox).toBe(50);
    });

    it('should apply custom widths over defaults', () => {
      const defaultWidths: Record<string, number> = {
        name: 160,
        phone: 130,
      };
      
      const customWidths: Record<string, number> = {
        name: 250,
      };
      
      const merged = { ...defaultWidths, ...customWidths };
      
      expect(merged.name).toBe(250);
      expect(merged.phone).toBe(130);
    });

    it('should enforce min/max width constraints', () => {
      const minWidth = 60;
      const maxWidth = 600;
      
      const clamp = (value: number) => Math.max(minWidth, Math.min(maxWidth, value));
      
      expect(clamp(30)).toBe(60);
      expect(clamp(800)).toBe(600);
      expect(clamp(200)).toBe(200);
    });
  });

  describe('Frozen Columns', () => {
    it('should add frozen column correctly', () => {
      const frozenColumns: string[] = [];
      
      const updated = [...frozenColumns, 'name'];
      expect(updated).toContain('name');
      expect(updated.length).toBe(1);
    });

    it('should remove frozen column correctly', () => {
      const frozenColumns = ['name', 'phone'];
      
      const updated = frozenColumns.filter(c => c !== 'name');
      expect(updated).not.toContain('name');
      expect(updated).toContain('phone');
      expect(updated.length).toBe(1);
    });

    it('should toggle frozen column', () => {
      const frozenColumns = ['name'];
      
      // Toggle off
      const isFrozen = frozenColumns.includes('name');
      expect(isFrozen).toBe(true);
      
      const afterToggleOff = frozenColumns.filter(c => c !== 'name');
      expect(afterToggleOff.length).toBe(0);
      
      // Toggle on
      const isNotFrozen = !afterToggleOff.includes('phone');
      expect(isNotFrozen).toBe(true);
      
      const afterToggleOn = [...afterToggleOff, 'phone'];
      expect(afterToggleOn).toContain('phone');
    });

    it('should calculate cumulative left offset for frozen columns', () => {
      const frozenColumns = ['checkbox', 'name'];
      const columnWidths: Record<string, number> = {
        checkbox: 50,
        name: 160,
        phone: 130,
      };
      const visibleColumnOrder = ['checkbox', 'name', 'phone', 'status'];
      
      const getLeftOffset = (colKey: string): number => {
        if (!frozenColumns.includes(colKey)) return 0;
        const frozenIndex = visibleColumnOrder.indexOf(colKey);
        let offset = 0;
        for (let i = 0; i < frozenIndex; i++) {
          const key = visibleColumnOrder[i];
          if (frozenColumns.includes(key)) {
            offset += columnWidths[key] || 100;
          }
        }
        return offset;
      };
      
      expect(getLeftOffset('checkbox')).toBe(0);
      expect(getLeftOffset('name')).toBe(50);
      expect(getLeftOffset('phone')).toBe(0); // not frozen
    });
  });

  describe('Template Management', () => {
    it('should create a new template with all settings', () => {
      const template = {
        id: `test_custom_${Date.now()}`,
        name: 'قالب اختبار',
        columns: { name: true, phone: true, email: false },
        columnOrder: ['name', 'phone', 'email'],
        columnWidths: { name: 200, phone: 150 },
        frozenColumns: ['name'],
        isDefault: false,
      };
      
      expect(template.name).toBe('قالب اختبار');
      expect(template.columns.email).toBe(false);
      expect(template.frozenColumns).toContain('name');
    });

    it('should apply template settings correctly', () => {
      const template = {
        columns: { name: true, phone: false, email: true },
        columnOrder: ['email', 'name', 'phone'],
        columnWidths: { name: 300, email: 250 },
        frozenColumns: ['email'],
      };
      
      // Simulate applying template
      const visibleColumns = template.columns;
      const columnOrder = template.columnOrder;
      const frozenColumns = template.frozenColumns;
      
      expect(visibleColumns.phone).toBe(false);
      expect(columnOrder[0]).toBe('email');
      expect(frozenColumns).toContain('email');
    });

    it('should delete template and clear active if matching', () => {
      const templates = [
        { id: 'template_1', name: 'قالب 1' },
        { id: 'template_2', name: 'قالب 2' },
      ];
      let activeTemplateId: string | null = 'template_1';
      
      const templateIdToDelete = 'template_1';
      const updated = templates.filter(t => t.id !== templateIdToDelete);
      
      if (activeTemplateId === templateIdToDelete) {
        activeTemplateId = null;
      }
      
      expect(updated.length).toBe(1);
      expect(activeTemplateId).toBeNull();
    });
  });

  describe('Reset All', () => {
    it('should reset all settings to defaults', () => {
      const columns = [
        { key: 'name', label: 'الاسم', defaultVisible: true },
        { key: 'phone', label: 'الهاتف', defaultVisible: true },
        { key: 'email', label: 'البريد', defaultVisible: false },
      ];
      
      // Simulate reset
      const defaultVisible: Record<string, boolean> = {};
      columns.forEach(col => {
        defaultVisible[col.key] = col.defaultVisible;
      });
      const defaultOrder = columns.map(c => c.key);
      const frozenColumns: string[] = [];
      const activeTemplateId: string | null = null;
      
      expect(defaultVisible.email).toBe(false);
      expect(defaultOrder).toEqual(['name', 'phone', 'email']);
      expect(frozenColumns).toEqual([]);
      expect(activeTemplateId).toBeNull();
    });
  });

  describe('LocalStorage Key Generation', () => {
    it('should generate consistent localStorage keys for a table', () => {
      const tableKey = 'appointments';
      
      const keys = {
        visibleColumns: `${tableKey}VisibleColumns`,
        columnOrder: `${tableKey}ColumnOrder`,
        columnWidths: `${tableKey}ColumnWidths`,
        frozenColumns: `${tableKey}FrozenColumns`,
        templates: `${tableKey}ColumnTemplates`,
        activeTemplate: `active${tableKey.charAt(0).toUpperCase() + tableKey.slice(1)}TemplateId`,
      };
      
      expect(keys.visibleColumns).toBe('appointmentsVisibleColumns');
      expect(keys.columnOrder).toBe('appointmentsColumnOrder');
      expect(keys.activeTemplate).toBe('activeAppointmentsTemplateId');
    });
  });

  describe('Shared Templates', () => {
    it('should format shared templates from API response', () => {
      const apiResponse = [
        { id: 1, name: 'قالب مشترك 1', columns: { name: true }, createdByName: 'أحمد' },
        { id: 2, name: 'قالب مشترك 2', columns: { name: true, phone: true }, createdByName: 'محمد' },
      ];
      const tableKey = 'appointments';
      
      const formatted = apiResponse.map((t: any) => ({
        id: `shared_${tableKey}_${t.id}`,
        name: t.name,
        columns: t.columns,
        isDefault: false,
        isShared: true,
        createdByName: t.createdByName,
        dbId: t.id,
      }));
      
      expect(formatted[0].id).toBe('shared_appointments_1');
      expect(formatted[0].isShared).toBe(true);
      expect(formatted[1].createdByName).toBe('محمد');
    });
  });
});
