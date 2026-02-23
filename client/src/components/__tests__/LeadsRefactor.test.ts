import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * اختبارات تقسيم LeadsManagementPage إلى مكونات أصغر
 * يتحقق من وجود الملفات وصحة البنية
 */

const COMPONENTS_DIR = path.resolve(__dirname, '../../components/leads');
const PAGES_DIR = path.resolve(__dirname, '../../pages');

describe('LeadsManagementPage Refactoring - File Structure', () => {
  it('should have leads components directory', () => {
    expect(fs.existsSync(COMPONENTS_DIR)).toBe(true);
  });

  it('should have all required component files', () => {
    const requiredFiles = [
      'LeadFilters.tsx',
      'LeadTableDesktop.tsx',
      'LeadStatusDialog.tsx',
      'LeadMobileCards.tsx',
      'index.ts',
    ];

    requiredFiles.forEach(file => {
      const filePath = path.join(COMPONENTS_DIR, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  it('should have index.ts exporting all components', () => {
    const indexContent = fs.readFileSync(path.join(COMPONENTS_DIR, 'index.ts'), 'utf-8');
    expect(indexContent).toContain('LeadFilters');
    expect(indexContent).toContain('LeadTableDesktop');
    expect(indexContent).toContain('LeadStatusDialog');
    expect(indexContent).toContain('LeadMobileCards');
  });

  it('should have LeadsManagementPage importing from leads components', () => {
    const pageContent = fs.readFileSync(path.join(PAGES_DIR, 'LeadsManagementPage.tsx'), 'utf-8');
    expect(pageContent).toContain("from \"@/components/leads\"");
    expect(pageContent).toContain('LeadFilters');
    expect(pageContent).toContain('LeadTableDesktop');
    expect(pageContent).toContain('LeadStatusDialog');
    expect(pageContent).toContain('LeadMobileCards');
  });

  it('should have reduced LeadsManagementPage to under 300 lines', () => {
    const content = fs.readFileSync(path.join(PAGES_DIR, 'LeadsManagementPage.tsx'), 'utf-8');
    const lineCount = content.split('\n').length;
    expect(lineCount).toBeLessThan(300);
  });

  it('should have each component under 250 lines', () => {
    const files = ['LeadFilters.tsx', 'LeadTableDesktop.tsx', 'LeadStatusDialog.tsx', 'LeadMobileCards.tsx'];
    files.forEach(file => {
      const content = fs.readFileSync(path.join(COMPONENTS_DIR, file), 'utf-8');
      const lineCount = content.split('\n').length;
      expect(lineCount).toBeLessThan(250);
    });
  });
});

describe('LeadsManagementPage Refactoring - Component Content', () => {
  it('LeadFilters should contain search and filter UI elements', () => {
    const content = fs.readFileSync(path.join(COMPONENTS_DIR, 'LeadFilters.tsx'), 'utf-8');
    expect(content).toContain('searchTerm');
    expect(content).toContain('dateFilter');
    expect(content).toContain('statusFilter');
    expect(content).toContain('sourceFilter');
    expect(content).toContain('MultiSelect');
  });

  it('LeadTableDesktop should contain table structure', () => {
    const content = fs.readFileSync(path.join(COMPONENTS_DIR, 'LeadTableDesktop.tsx'), 'utf-8');
    expect(content).toContain('Table');
    expect(content).toContain('TableHeader');
    expect(content).toContain('TableBody');
    expect(content).toContain('TableRow');
    expect(content).toContain('TableCell');
  });

  it('LeadStatusDialog should contain dialog and status update UI', () => {
    const content = fs.readFileSync(path.join(COMPONENTS_DIR, 'LeadStatusDialog.tsx'), 'utf-8');
    expect(content).toContain('Dialog');
    expect(content).toContain('newStatus');
    expect(content).toContain('statusNotes');
    expect(content).toContain('onSubmit');
  });

  it('LeadMobileCards should use LeadCard component', () => {
    const content = fs.readFileSync(path.join(COMPONENTS_DIR, 'LeadMobileCards.tsx'), 'utf-8');
    expect(content).toContain('LeadCard');
    expect(content).toContain('md:hidden');
  });
});

describe('Shared Components - DataTableToolbar', () => {
  it('should exist as a shared component', () => {
    const filePath = path.resolve(__dirname, '../DataTableToolbar.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('should contain export, print, and column visibility features', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../DataTableToolbar.tsx'), 'utf-8');
    expect(content).toContain('onExport');
    expect(content).toContain('onPrint');
    expect(content).toContain('ColumnVisibility');
    expect(content).toContain('SavedFilters');
  });
});

describe('Shared Components - DataTableWrapper', () => {
  it('should exist as a shared component', () => {
    const filePath = path.resolve(__dirname, '../DataTableWrapper.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('should contain toolbar, pagination, loading, and empty states', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../DataTableWrapper.tsx'), 'utf-8');
    expect(content).toContain('DataTableToolbar');
    expect(content).toContain('Pagination');
    expect(content).toContain('TableSkeleton');
    expect(content).toContain('EmptyState');
    expect(content).toContain('isLoading');
    expect(content).toContain('isEmpty');
  });
});

describe('Shared Hooks - usePagination', () => {
  it('should exist as a shared hook', () => {
    const filePath = path.resolve(__dirname, '../../hooks/usePagination.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('should export usePagination function', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../../hooks/usePagination.ts'), 'utf-8');
    expect(content).toContain('export function usePagination');
    expect(content).toContain('paginatedData');
    expect(content).toContain('paginationProps');
    expect(content).toContain('resetPage');
  });
});

describe('Lazy Loading - App.tsx', () => {
  it('should have all page imports as lazy', () => {
    const appContent = fs.readFileSync(path.resolve(__dirname, '../../App.tsx'), 'utf-8');
    // Should not have direct page imports
    const directImports = appContent.match(/^import\s+\w+\s+from\s+["']\.\/pages\//gm);
    expect(directImports).toBeNull();
  });

  it('should have Suspense wrapper in Router', () => {
    const appContent = fs.readFileSync(path.resolve(__dirname, '../../App.tsx'), 'utf-8');
    expect(appContent).toContain('Suspense');
    expect(appContent).toContain('fallback');
  });

  it('should have NotFound as lazy loaded', () => {
    const appContent = fs.readFileSync(path.resolve(__dirname, '../../App.tsx'), 'utf-8');
    expect(appContent).toContain('const NotFound = lazy');
  });

  it('should have MessageSettingsPage as lazy loaded', () => {
    const appContent = fs.readFileSync(path.resolve(__dirname, '../../App.tsx'), 'utf-8');
    expect(appContent).toContain('const MessageSettingsPage = lazy');
  });

  it('should have QueueDashboard as lazy loaded', () => {
    const appContent = fs.readFileSync(path.resolve(__dirname, '../../App.tsx'), 'utf-8');
    expect(appContent).toContain('const QueueDashboard = lazy');
  });
});
