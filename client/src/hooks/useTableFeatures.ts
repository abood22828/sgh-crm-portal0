/**
 * useTableFeatures - Hook موحد لإدارة جميع ميزات الجداول
 * 
 * يوفر هذا الـ hook نظاماً موحداً لإدارة:
 * - إخفاء/إظهار الأعمدة (Column Visibility)
 * - ترتيب الأعمدة (Column Order)
 * - أحجام الأعمدة (Column Widths)
 * - تجميد الأعمدة (Frozen Columns)
 * - قوالب الأعمدة (Column Templates)
 * - القوالب المشتركة (Shared Templates)
 * - حفظ التفضيلات في localStorage وقاعدة البيانات
 * 
 * الاستخدام:
 * ```tsx
 * const tableFeatures = useTableFeatures({
 *   tableKey: 'appointments',
 *   columns: appointmentColumns,
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { getColumnWidth, getDefaultTemplates, type ColumnConfig, type ColumnTemplate } from "@/components/ColumnVisibility";
import type { SortDirection } from "@/components/ResizableTable";

/** Sort state for a column */
export interface SortState {
  columnKey: string;
  direction: SortDirection;
}

export interface UseTableFeaturesOptions {
  /** مفتاح فريد للجدول - يُستخدم لحفظ التفضيلات */
  tableKey: string;
  /** تعريف الأعمدة */
  columns: ColumnConfig[];
  /** الأعمدة المجمدة افتراضياً */
  defaultFrozenColumns?: string[];
  /** Whether to persist sort preferences (default: true) */
  persistSort?: boolean;
}

export interface UseTableFeaturesReturn {
  // === Column Visibility ===
  visibleColumns: Record<string, boolean>;
  handleColumnVisibilityChange: (columnKey: string, visible: boolean) => void;
  
  // === Column Order ===
  columnOrder: string[];
  handleColumnOrderChange: (newOrder: string[]) => void;
  /** ترتيب الأعمدة المرئية فقط */
  visibleColumnOrder: string[];
  
  // === Sorting ===
  sortState: SortState;
  handleSort: (columnKey: string) => void;
  getSortDirection: (columnKey: string) => SortDirection;
  /** Sort an array of data using the current sort state */
  sortData: <T>(data: T[], getField: (item: T, key: string) => any) => T[];
  /** Check if a column is sortable */
  isColumnSortable: (columnKey: string) => boolean;
  
  // === Column Widths ===
  columnWidths: ReturnType<typeof import("@/components/ResizableTable").useColumnWidths>;
  
  // === Frozen Columns ===
  frozenColumns: ReturnType<typeof import("@/components/ResizableTable").useFrozenColumns>;
  
  // === Templates ===
  allTemplates: ColumnTemplate[];
  customTemplates: ColumnTemplate[];
  sharedTemplates: ColumnTemplate[];
  activeTemplateId: string | null;
  handleApplyTemplate: (template: ColumnTemplate) => void;
  handleSaveTemplate: (name: string, columns: Record<string, boolean>, columnOrder: string[], columnWidths?: Record<string, number>, frozenCols?: string[]) => void;
  handleDeleteTemplate: (templateId: string) => void;
  handleSaveSharedTemplate: (name: string, columns: Record<string, boolean>, columnOrder: string[], columnWidths?: Record<string, number>, frozenCols?: string[]) => void;
  handleDeleteSharedTemplate: (dbId: number) => void;
  
  // === Reset ===
  handleResetAll: () => void;
  
  // === Props helpers for ColumnVisibility component ===
  columnVisibilityProps: {
    columns: ColumnConfig[];
    visibleColumns: Record<string, boolean>;
    columnOrder: string[];
    onVisibilityChange: (columnKey: string, visible: boolean) => void;
    onColumnOrderChange: (newOrder: string[]) => void;
    onReset: () => void;
    templates: ColumnTemplate[];
    activeTemplateId: string | null;
    onApplyTemplate: (template: ColumnTemplate) => void;
    onSaveTemplate: (name: string, columns: Record<string, boolean>, columnOrder: string[], columnWidths?: Record<string, number>, frozenCols?: string[]) => void;
    onDeleteTemplate: (templateId: string) => void;
    tableKey: string;
    columnWidths: Record<string, number>;
    frozenColumns: string[];
    onToggleFrozen: (columnKey: string) => void;
    isAdmin: boolean;
    sharedTemplates: ColumnTemplate[];
    onSaveSharedTemplate: (name: string, columns: Record<string, boolean>, columnOrder: string[], columnWidths?: Record<string, number>, frozenCols?: string[]) => void;
    onDeleteSharedTemplate: (dbId: number) => void;
  };
  
  // === Props helpers for ResizableTable component ===
  resizableTableProps: {
    frozenColumns: string[];
    columnWidths: Record<string, number>;
    visibleColumnOrder: string[];
  };
  
  // === Props helpers for sort on ResizableHeaderCell ===
  getSortProps: (columnKey: string) => {
    sortable: boolean;
    sortDirection: SortDirection;
    onSort: (columnKey: string) => void;
  };
}

export function useTableFeatures({
  tableKey,
  columns,
  defaultFrozenColumns = [],
  persistSort = true,
}: UseTableFeaturesOptions): UseTableFeaturesReturn {
  const utils = trpc.useUtils();
  const savePreferencesMutation = trpc.preferences.set.useMutation();

  // ==========================================
  // === Column Visibility ===
  // ==========================================
  
  const { data: savedVisibleColumns } = trpc.preferences.get.useQuery(
    { key: `${tableKey}VisibleColumns` },
    { retry: false }
  );

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`${tableKey}VisibleColumns`);
      if (saved) return JSON.parse(saved);
    } catch {}
    const defaults: Record<string, boolean> = {};
    columns.forEach(col => { defaults[col.key] = col.defaultVisible; });
    return defaults;
  });

  useEffect(() => {
    if (savedVisibleColumns) {
      setVisibleColumns(savedVisibleColumns);
      try { localStorage.setItem(`${tableKey}VisibleColumns`, JSON.stringify(savedVisibleColumns)); } catch {}
    }
  }, [savedVisibleColumns, tableKey]);

  const handleColumnVisibilityChange = useCallback((columnKey: string, visible: boolean) => {
    const updated = { ...visibleColumns, [columnKey]: visible };
    setVisibleColumns(updated);
    try { localStorage.setItem(`${tableKey}VisibleColumns`, JSON.stringify(updated)); } catch {}
    savePreferencesMutation.mutate({ key: `${tableKey}VisibleColumns`, value: updated });
  }, [visibleColumns, tableKey, savePreferencesMutation]);

  // ==========================================
  // === Column Order ===
  // ==========================================
  
  const defaultColumnOrder = useMemo(() => columns.map(c => c.key), [columns]);
  
  const { data: savedColumnOrder } = trpc.preferences.get.useQuery(
    { key: `${tableKey}ColumnOrder` },
    { retry: false }
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${tableKey}ColumnOrder`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultColumnOrder;
  });

  useEffect(() => {
    if (savedColumnOrder && Array.isArray(savedColumnOrder)) {
      setColumnOrder(savedColumnOrder);
      try { localStorage.setItem(`${tableKey}ColumnOrder`, JSON.stringify(savedColumnOrder)); } catch {}
    }
  }, [savedColumnOrder, tableKey]);

  const handleColumnOrderChange = useCallback((newOrder: string[]) => {
    setColumnOrder(newOrder);
    try { localStorage.setItem(`${tableKey}ColumnOrder`, JSON.stringify(newOrder)); } catch {}
    savePreferencesMutation.mutate({ key: `${tableKey}ColumnOrder`, value: newOrder });
  }, [tableKey, savePreferencesMutation]);

  const visibleColumnOrder = useMemo(() => 
    columnOrder.filter(key => visibleColumns[key]),
    [columnOrder, visibleColumns]
  );

  // ==========================================
  // === Column Widths (via useColumnWidths) ===
  // ==========================================
  
  const { data: savedColumnWidths } = trpc.preferences.get.useQuery(
    { key: `${tableKey}ColumnWidths` },
    { retry: false }
  );

  const saveColumnWidthsFn = useCallback((widths: Record<string, number>) => {
    savePreferencesMutation.mutate({ key: `${tableKey}ColumnWidths`, value: widths });
  }, [savePreferencesMutation, tableKey]);

  // Inline implementation of useColumnWidths to avoid circular dependency
  const [columnWidthsState, setColumnWidthsState] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(`columnWidths_${tableKey}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    const defaults: Record<string, number> = {};
    columns.forEach((col) => {
      const preset = getColumnWidth(col.key, col);
      defaults[col.key] = preset.width;
    });
    return defaults;
  });

  useEffect(() => {
    const dbWidths = savedColumnWidths as Record<string, number> | null;
    if (dbWidths && Object.keys(dbWidths).length > 0) {
      setColumnWidthsState(prev => {
        const merged = { ...prev, ...dbWidths };
        try { localStorage.setItem(`columnWidths_${tableKey}`, JSON.stringify(merged)); } catch {}
        return merged;
      });
    }
  }, [savedColumnWidths, tableKey]);

  const widthSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleWidthResize = useCallback((key: string, width: number) => {
    setColumnWidthsState((prev) => {
      const updated = { ...prev, [key]: width };
      try { localStorage.setItem(`columnWidths_${tableKey}`, JSON.stringify(updated)); } catch {}
      if (widthSaveTimerRef.current) clearTimeout(widthSaveTimerRef.current);
      widthSaveTimerRef.current = setTimeout(() => { saveColumnWidthsFn(updated); }, 500);
      return updated;
    });
  }, [tableKey, saveColumnWidthsFn]);

  const resetWidths = useCallback(() => {
    const defaults: Record<string, number> = {};
    columns.forEach((col) => {
      const preset = getColumnWidth(col.key, col);
      defaults[col.key] = preset.width;
    });
    setColumnWidthsState(defaults);
    try { localStorage.removeItem(`columnWidths_${tableKey}`); } catch {}
    saveColumnWidthsFn(defaults);
  }, [columns, tableKey, saveColumnWidthsFn]);

  const applyWidths = useCallback((widths: Record<string, number>) => {
    if (widths && Object.keys(widths).length > 0) {
      setColumnWidthsState(prev => {
        const merged = { ...prev, ...widths };
        try { localStorage.setItem(`columnWidths_${tableKey}`, JSON.stringify(merged)); } catch {}
        return merged;
      });
    }
  }, [tableKey]);

  const getWidth = useCallback((key: string) => {
    if (columnWidthsState[key]) return columnWidthsState[key];
    const col = columns.find(c => c.key === key);
    return getColumnWidth(key, col).width;
  }, [columnWidthsState, columns]);

  const getMinWidth = useCallback((key: string) => {
    const col = columns.find(c => c.key === key);
    return getColumnWidth(key, col).min;
  }, [columns]);

  const getMaxWidth = useCallback((key: string) => {
    const col = columns.find(c => c.key === key);
    return getColumnWidth(key, col).max;
  }, [columns]);

  const columnWidths = useMemo(() => ({
    columnWidths: columnWidthsState,
    handleResize: handleWidthResize,
    resetWidths,
    applyWidths,
    getWidth,
    getMinWidth,
    getMaxWidth,
  }), [columnWidthsState, handleWidthResize, resetWidths, applyWidths, getWidth, getMinWidth, getMaxWidth]);

  // ==========================================
  // === Frozen Columns (via useFrozenColumns) ===
  // ==========================================
  
  const { data: savedFrozenColumns } = trpc.preferences.get.useQuery(
    { key: `${tableKey}FrozenColumns` },
    { retry: false }
  );

  const saveFrozenColumnsFn = useCallback((frozen: string[]) => {
    savePreferencesMutation.mutate({ key: `${tableKey}FrozenColumns`, value: frozen });
  }, [savePreferencesMutation, tableKey]);

  const [frozenColumnsState, setFrozenColumnsState] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`frozenColumns_${tableKey}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultFrozenColumns;
  });

  useEffect(() => {
    const dbFrozen = savedFrozenColumns as string[] | null;
    if (dbFrozen && dbFrozen.length > 0) {
      setFrozenColumnsState(dbFrozen);
      try { localStorage.setItem(`frozenColumns_${tableKey}`, JSON.stringify(dbFrozen)); } catch {}
    }
  }, [savedFrozenColumns, tableKey]);

  const toggleFrozen = useCallback((columnKey: string) => {
    setFrozenColumnsState(prev => {
      const updated = prev.includes(columnKey) 
        ? prev.filter(k => k !== columnKey)
        : [...prev, columnKey];
      try { localStorage.setItem(`frozenColumns_${tableKey}`, JSON.stringify(updated)); } catch {}
      saveFrozenColumnsFn(updated);
      return updated;
    });
  }, [tableKey, saveFrozenColumnsFn]);

  const setFrozen = useCallback((cols: string[]) => {
    setFrozenColumnsState(cols);
    try { localStorage.setItem(`frozenColumns_${tableKey}`, JSON.stringify(cols)); } catch {}
    saveFrozenColumnsFn(cols);
  }, [tableKey, saveFrozenColumnsFn]);

  const resetFrozen = useCallback(() => {
    setFrozenColumnsState(defaultFrozenColumns);
    try { localStorage.removeItem(`frozenColumns_${tableKey}`); } catch {}
    saveFrozenColumnsFn(defaultFrozenColumns);
  }, [defaultFrozenColumns, tableKey, saveFrozenColumnsFn]);

  const frozenColumns = useMemo(() => ({
    frozenColumns: frozenColumnsState,
    toggleFrozen,
    setFrozen,
    resetFrozen,
    isFrozen: (key: string) => frozenColumnsState.includes(key),
  }), [frozenColumnsState, toggleFrozen, setFrozen, resetFrozen]);

  // ==========================================
  // === Templates ===
  // ==========================================
  
  const defaultTemplates = useMemo(() => getDefaultTemplates(columns, tableKey), [columns, tableKey]);

  const { data: savedTemplates } = trpc.preferences.get.useQuery(
    { key: `${tableKey}ColumnTemplates` },
    { retry: false }
  );

  const { data: savedActiveTemplateId } = trpc.preferences.get.useQuery(
    { key: `active${tableKey.charAt(0).toUpperCase() + tableKey.slice(1)}TemplateId` },
    { retry: false }
  );

  const [customTemplates, setCustomTemplates] = useState<ColumnTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(`${tableKey}ColumnTemplates`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`active${tableKey.charAt(0).toUpperCase() + tableKey.slice(1)}TemplateId`) || null;
    } catch {}
    return null;
  });

  useEffect(() => {
    if (savedTemplates && Array.isArray(savedTemplates)) {
      setCustomTemplates(savedTemplates);
      try { localStorage.setItem(`${tableKey}ColumnTemplates`, JSON.stringify(savedTemplates)); } catch {}
    }
  }, [savedTemplates, tableKey]);

  useEffect(() => {
    if (savedActiveTemplateId !== undefined) {
      setActiveTemplateId(savedActiveTemplateId);
      if (savedActiveTemplateId) {
        try { localStorage.setItem(`active${tableKey.charAt(0).toUpperCase() + tableKey.slice(1)}TemplateId`, savedActiveTemplateId); } catch {}
      } else {
        try { localStorage.removeItem(`active${tableKey.charAt(0).toUpperCase() + tableKey.slice(1)}TemplateId`); } catch {}
      }
    }
  }, [savedActiveTemplateId, tableKey]);

  // Shared templates
  const { data: sharedTemplatesData } = trpc.sharedTemplates.list.useQuery(
    { tableKey },
    { retry: false }
  );

  const createSharedTemplateMutation = trpc.sharedTemplates.create.useMutation({
    onSuccess: () => { utils.sharedTemplates.list.invalidate({ tableKey }); },
  });

  const deleteSharedTemplateMutation = trpc.sharedTemplates.delete.useMutation({
    onSuccess: () => { utils.sharedTemplates.list.invalidate({ tableKey }); },
  });

  const sharedTemplates: ColumnTemplate[] = useMemo(() => 
    (sharedTemplatesData || []).map((t: any) => ({
      id: `shared_${tableKey}_${t.id}`,
      name: t.name,
      columns: t.columns,
      columnOrder: t.columnOrder,
      columnWidths: t.columnWidths,
      frozenColumns: t.frozenColumns,
      isDefault: false,
      isShared: true,
      createdByName: t.createdByName,
      dbId: t.id,
    })),
    [sharedTemplatesData, tableKey]
  );

  const allTemplates = useMemo(() => [...defaultTemplates, ...customTemplates], [defaultTemplates, customTemplates]);

  const activeTemplateIdKey = `active${tableKey.charAt(0).toUpperCase() + tableKey.slice(1)}TemplateId`;

  const handleApplyTemplate = useCallback((template: ColumnTemplate) => {
    setVisibleColumns(template.columns);
    setActiveTemplateId(template.id);
    if (template.columnOrder) {
      setColumnOrder(template.columnOrder);
      try { localStorage.setItem(`${tableKey}ColumnOrder`, JSON.stringify(template.columnOrder)); } catch {}
      savePreferencesMutation.mutate({ key: `${tableKey}ColumnOrder`, value: template.columnOrder });
    }
    if (template.columnWidths) {
      applyWidths(template.columnWidths);
      savePreferencesMutation.mutate({ key: `${tableKey}ColumnWidths`, value: template.columnWidths });
    }
    if (template.frozenColumns) {
      setFrozen(template.frozenColumns);
    }
    try { localStorage.setItem(`${tableKey}VisibleColumns`, JSON.stringify(template.columns)); } catch {}
    try { localStorage.setItem(activeTemplateIdKey, template.id); } catch {}
    savePreferencesMutation.mutate({ key: `${tableKey}VisibleColumns`, value: template.columns });
    savePreferencesMutation.mutate({ key: activeTemplateIdKey, value: template.id });
  }, [tableKey, activeTemplateIdKey, applyWidths, setFrozen, savePreferencesMutation]);

  const handleSaveTemplate = useCallback((name: string, cols: Record<string, boolean>, order: string[], widths?: Record<string, number>, frozenCols?: string[]) => {
    const newTemplate: ColumnTemplate = {
      id: `${tableKey}_custom_${Date.now()}`,
      name,
      columns: cols,
      columnOrder: order || columnOrder,
      columnWidths: widths || columnWidthsState,
      frozenColumns: frozenCols || frozenColumnsState,
      isDefault: false,
    };
    const updated = [...customTemplates, newTemplate];
    setCustomTemplates(updated);
    setActiveTemplateId(newTemplate.id);
    try { localStorage.setItem(`${tableKey}ColumnTemplates`, JSON.stringify(updated)); } catch {}
    try { localStorage.setItem(activeTemplateIdKey, newTemplate.id); } catch {}
    savePreferencesMutation.mutate({ key: `${tableKey}ColumnTemplates`, value: updated });
    savePreferencesMutation.mutate({ key: activeTemplateIdKey, value: newTemplate.id });
  }, [tableKey, activeTemplateIdKey, columnOrder, columnWidthsState, frozenColumnsState, customTemplates, savePreferencesMutation]);

  const handleDeleteTemplate = useCallback((templateId: string) => {
    const updated = customTemplates.filter(t => t.id !== templateId);
    setCustomTemplates(updated);
    if (activeTemplateId === templateId) {
      setActiveTemplateId(null);
      try { localStorage.removeItem(activeTemplateIdKey); } catch {}
      savePreferencesMutation.mutate({ key: activeTemplateIdKey, value: null });
    }
    try { localStorage.setItem(`${tableKey}ColumnTemplates`, JSON.stringify(updated)); } catch {}
    savePreferencesMutation.mutate({ key: `${tableKey}ColumnTemplates`, value: updated });
  }, [customTemplates, activeTemplateId, activeTemplateIdKey, tableKey, savePreferencesMutation]);

  const handleSaveSharedTemplate = useCallback((name: string, cols: Record<string, boolean>, order: string[], widths?: Record<string, number>, frozenCols?: string[]) => {
    createSharedTemplateMutation.mutate({
      name,
      tableKey,
      columns: cols,
      columnOrder: order || columnOrder,
      columnWidths: widths || columnWidthsState,
      frozenColumns: frozenCols || frozenColumnsState,
    } as any);
  }, [tableKey, columnOrder, columnWidthsState, frozenColumnsState, createSharedTemplateMutation]);

  const handleDeleteSharedTemplate = useCallback((dbId: number) => {
    deleteSharedTemplateMutation.mutate({ id: dbId });
  }, [deleteSharedTemplateMutation]);

  // ==========================================
  // === Sorting ===
  // ==========================================

  const { data: savedSortState } = trpc.preferences.get.useQuery(
    { key: `${tableKey}SortState` },
    { retry: false, enabled: persistSort }
  );

  const [sortState, setSortState] = useState<SortState>(() => {
    if (persistSort) {
      try {
        const saved = localStorage.getItem(`${tableKey}SortState`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return { columnKey: '', direction: null };
  });

  useEffect(() => {
    if (persistSort && savedSortState && typeof savedSortState === 'object' && 'columnKey' in (savedSortState as any)) {
      setSortState(savedSortState as SortState);
      try { localStorage.setItem(`${tableKey}SortState`, JSON.stringify(savedSortState)); } catch {}
    }
  }, [savedSortState, tableKey, persistSort]);

  const handleSort = useCallback((columnKey: string) => {
    setSortState(prev => {
      let newState: SortState;
      if (prev.columnKey === columnKey) {
        // Cycle: asc -> desc -> null
        if (prev.direction === 'asc') {
          newState = { columnKey, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          newState = { columnKey: '', direction: null };
        } else {
          newState = { columnKey, direction: 'asc' };
        }
      } else {
        newState = { columnKey, direction: 'asc' };
      }
      if (persistSort) {
        try { localStorage.setItem(`${tableKey}SortState`, JSON.stringify(newState)); } catch {}
        savePreferencesMutation.mutate({ key: `${tableKey}SortState`, value: newState });
      }
      return newState;
    });
  }, [tableKey, persistSort, savePreferencesMutation]);

  const getSortDirection = useCallback((columnKey: string): SortDirection => {
    return sortState.columnKey === columnKey ? sortState.direction : null;
  }, [sortState]);

  const isColumnSortable = useCallback((columnKey: string): boolean => {
    const col = columns.find(c => c.key === columnKey);
    if (!col) return false;
    // Default sortable=true unless explicitly set to false, or it's 'actions'/'comments'/'tasks'
    if (col.sortable === false) return false;
    if (['actions', 'comments', 'tasks'].includes(columnKey)) return false;
    return true;
  }, [columns]);

  const sortData = useCallback(<T,>(data: T[], getField: (item: T, key: string) => any): T[] => {
    if (!sortState.direction || !sortState.columnKey) return data;

    const col = columns.find(c => c.key === sortState.columnKey);
    const sortType = col?.sortType || 'string';
    const direction = sortState.direction;
    const key = sortState.columnKey;

    return [...data].sort((a, b) => {
      const aVal = getField(a, key);
      const bVal = getField(b, key);

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return direction === 'asc' ? 1 : -1;
      if (bVal == null) return direction === 'asc' ? -1 : 1;

      let comparison = 0;

      switch (sortType) {
        case 'number': {
          const numA = typeof aVal === 'number' ? aVal : parseFloat(String(aVal));
          const numB = typeof bVal === 'number' ? bVal : parseFloat(String(bVal));
          if (isNaN(numA) && isNaN(numB)) comparison = 0;
          else if (isNaN(numA)) comparison = 1;
          else if (isNaN(numB)) comparison = -1;
          else comparison = numA - numB;
          break;
        }
        case 'date': {
          const dateA = aVal instanceof Date ? aVal.getTime() : new Date(String(aVal)).getTime();
          const dateB = bVal instanceof Date ? bVal.getTime() : new Date(String(bVal)).getTime();
          if (isNaN(dateA) && isNaN(dateB)) comparison = 0;
          else if (isNaN(dateA)) comparison = 1;
          else if (isNaN(dateB)) comparison = -1;
          else comparison = dateA - dateB;
          break;
        }
        case 'boolean': {
          const boolA = Boolean(aVal);
          const boolB = Boolean(bVal);
          comparison = boolA === boolB ? 0 : boolA ? -1 : 1;
          break;
        }
        default: { // string
          const strA = String(aVal).toLowerCase();
          const strB = String(bVal).toLowerCase();
          comparison = strA.localeCompare(strB, 'ar');
          break;
        }
      }

      return direction === 'asc' ? comparison : -comparison;
    });
  }, [sortState, columns]);

  const getSortProps = useCallback((columnKey: string) => ({
    sortable: isColumnSortable(columnKey),
    sortDirection: getSortDirection(columnKey),
    onSort: handleSort,
  }), [isColumnSortable, getSortDirection, handleSort]);

  // ==========================================
  // === Reset All ===
  // ==========================================
  
  const handleResetAll = useCallback(() => {
    const defaultVisible: Record<string, boolean> = {};
    columns.forEach(col => { defaultVisible[col.key] = col.defaultVisible; });
    setVisibleColumns(defaultVisible);
    setActiveTemplateId(null);
    setColumnOrder(defaultColumnOrder);
    resetWidths();
    resetFrozen();
    try { localStorage.setItem(`${tableKey}VisibleColumns`, JSON.stringify(defaultVisible)); } catch {}
    try { localStorage.removeItem(activeTemplateIdKey); } catch {}
    try { localStorage.setItem(`${tableKey}ColumnOrder`, JSON.stringify(defaultColumnOrder)); } catch {}
    savePreferencesMutation.mutate({ key: `${tableKey}VisibleColumns`, value: defaultVisible });
    savePreferencesMutation.mutate({ key: activeTemplateIdKey, value: null });
    savePreferencesMutation.mutate({ key: `${tableKey}ColumnOrder`, value: defaultColumnOrder });
  }, [columns, defaultColumnOrder, tableKey, activeTemplateIdKey, resetWidths, resetFrozen, savePreferencesMutation]);

  // ==========================================
  // === Props Helpers ===
  // ==========================================

  // Placeholder for isAdmin - will be overridden by consumer
  const columnVisibilityProps = useMemo(() => ({
    columns,
    visibleColumns,
    columnOrder,
    onVisibilityChange: handleColumnVisibilityChange,
    onColumnOrderChange: handleColumnOrderChange,
    onReset: handleResetAll,
    templates: allTemplates,
    activeTemplateId,
    onApplyTemplate: handleApplyTemplate,
    onSaveTemplate: handleSaveTemplate,
    onDeleteTemplate: handleDeleteTemplate,
    tableKey,
    columnWidths: columnWidthsState,
    frozenColumns: frozenColumnsState,
    onToggleFrozen: toggleFrozen,
    isAdmin: false, // Override in consumer
    sharedTemplates,
    onSaveSharedTemplate: handleSaveSharedTemplate,
    onDeleteSharedTemplate: handleDeleteSharedTemplate,
  }), [
    columns, visibleColumns, columnOrder, handleColumnVisibilityChange,
    handleColumnOrderChange, handleResetAll, allTemplates, activeTemplateId,
    handleApplyTemplate, handleSaveTemplate, handleDeleteTemplate, tableKey,
    columnWidthsState, frozenColumnsState, toggleFrozen, sharedTemplates,
    handleSaveSharedTemplate, handleDeleteSharedTemplate,
  ]);

  const resizableTableProps = useMemo(() => ({
    frozenColumns: frozenColumnsState,
    columnWidths: columnWidthsState,
    visibleColumnOrder,
  }), [frozenColumnsState, columnWidthsState, visibleColumnOrder]);

  return {
    visibleColumns,
    handleColumnVisibilityChange,
    columnOrder,
    handleColumnOrderChange,
    visibleColumnOrder,
    columnWidths,
    frozenColumns,
    allTemplates,
    customTemplates,
    sharedTemplates,
    activeTemplateId,
    handleApplyTemplate,
    handleSaveTemplate,
    handleDeleteTemplate,
    handleSaveSharedTemplate,
    handleDeleteSharedTemplate,
    handleResetAll,
    sortState,
    handleSort,
    getSortDirection,
    sortData,
    isColumnSortable,
    getSortProps,
    columnVisibilityProps,
    resizableTableProps,
  };
}
