import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Dashboard UI Improvements', () => {
  const basePath = path.resolve(__dirname, '../../../..');

  describe('DashboardSidebar (Meta Business Suite Style)', () => {
    const sidebarPath = path.join(basePath, 'client/src/components/DashboardSidebar.tsx');
    let sidebarContent: string;

    it('should exist', () => {
      expect(fs.existsSync(sidebarPath)).toBe(true);
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
    });

    it('should have nav groups with labels', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      // New Meta-style sidebar uses NavGroup interface with label
      expect(sidebarContent).toContain('NavGroup');
      expect(sidebarContent).toContain('label:');
      expect(sidebarContent).toContain('الرئيسية');
      expect(sidebarContent).toContain('إدارة الحجوزات');
      expect(sidebarContent).toContain('إدارة المحتوى');
      expect(sidebarContent).toContain('التواصل');
    });

    it('should have collapsible groups with ChevronDown', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('ChevronDown');
      expect(sidebarContent).toContain('expandedGroups');
      expect(sidebarContent).toContain('toggleGroup');
    });

    it('should have hospital logo', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('new-logo.png');
      expect(sidebarContent).toContain('المستشفى السعودي الألماني');
    });

    it('should have mobile bottom navigation', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('lg:hidden');
      expect(sidebarContent).toContain('mobileOpen');
    });

    it('should have Meta-style icon rail (narrow sidebar)', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      // Meta Business Suite style: narrow icon rail + expanded panel
      expect(sidebarContent).toContain('primaryNavItems');
      expect(sidebarContent).toContain('allToolsOpen');
      expect(sidebarContent).toContain('Tooltip');
    });

    it('should have active item highlighting with blue color', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('isItemActive');
      expect(sidebarContent).toContain('bg-blue');
    });

    it('should auto-expand groups with active items', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('hasActive');
      expect(sidebarContent).toContain('defaultOpen');
    });

    it('should have search functionality in expanded panel', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('Search');
      expect(sidebarContent).toContain('searchQuery');
    });

    it('should have settings and help icons at bottom', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('SettingsIcon');
      expect(sidebarContent).toContain('HelpCircle');
    });
  });

  describe('DashboardLayout', () => {
    const layoutPath = path.join(basePath, 'client/src/components/DashboardLayout.tsx');
    let layoutContent: string;

    it('should exist', () => {
      expect(fs.existsSync(layoutPath)).toBe(true);
      layoutContent = fs.readFileSync(layoutPath, 'utf-8');
    });

    it('should use DashboardSidebar component', () => {
      layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      expect(layoutContent).toContain('DashboardSidebar');
    });

    it('should have user dropdown menu', () => {
      layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      expect(layoutContent).toContain('DropdownMenu');
      expect(layoutContent).toContain('الملف الشخصي');
      expect(layoutContent).toContain('تسجيل الخروج');
    });

    it('should have login screen for unauthenticated users', () => {
      layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      expect(layoutContent).toContain('getLoginUrl');
      expect(layoutContent).toContain('تسجيل الدخول');
    });

    it('should have RTL direction', () => {
      layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      expect(layoutContent).toContain('dir="rtl"');
    });

    it('should show page title and description', () => {
      layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      expect(layoutContent).toContain('pageTitle');
      expect(layoutContent).toContain('pageDescription');
    });

    it('should have header with border bottom', () => {
      layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      expect(layoutContent).toContain('border-b');
    });

    it('should have mobile logo visible only on small screens', () => {
      layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      expect(layoutContent).toContain('lg:hidden');
      expect(layoutContent).toContain('new-logo.png');
    });
  });

  describe('DashboardLayoutSkeleton', () => {
    const skeletonPath = path.join(basePath, 'client/src/components/DashboardLayoutSkeleton.tsx');

    it('should exist', () => {
      expect(fs.existsSync(skeletonPath)).toBe(true);
    });

    it('should have loading skeleton elements', () => {
      const content = fs.readFileSync(skeletonPath, 'utf-8');
      expect(content).toContain('Skeleton');
    });
  });

  describe('CSS Improvements', () => {
    const cssPath = path.join(basePath, 'client/src/index.css');
    let cssContent: string;

    it('should exist', () => {
      expect(fs.existsSync(cssPath)).toBe(true);
      cssContent = fs.readFileSync(cssPath, 'utf-8');
    });

    it('should have nav-item-active styles', () => {
      cssContent = fs.readFileSync(cssPath, 'utf-8');
      expect(cssContent).toContain('.nav-item-active');
      expect(cssContent).toContain('.nav-item-active::before');
    });

    it('should have dashboard-header gradient', () => {
      cssContent = fs.readFileSync(cssPath, 'utf-8');
      expect(cssContent).toContain('.dashboard-header');
      expect(cssContent).toContain('backdrop-filter');
    });

    it('should have stat-card-hover effect', () => {
      cssContent = fs.readFileSync(cssPath, 'utf-8');
      expect(cssContent).toContain('.stat-card-hover');
      expect(cssContent).toContain('translateY');
    });

    it('should have SGH brand colors', () => {
      cssContent = fs.readFileSync(cssPath, 'utf-8');
      expect(cssContent).toContain('SGH Blue');
      expect(cssContent).toContain('SGH Green');
    });

    it('should have sidebar color variables', () => {
      cssContent = fs.readFileSync(cssPath, 'utf-8');
      expect(cssContent).toContain('--sidebar:');
      expect(cssContent).toContain('--sidebar-foreground:');
      expect(cssContent).toContain('--sidebar-accent:');
    });
  });

  describe('AdminDashboard uses DashboardLayout', () => {
    const adminPath = path.join(basePath, 'client/src/pages/AdminDashboard.tsx');

    it('should exist', () => {
      expect(fs.existsSync(adminPath)).toBe(true);
    });

    it('should import and use DashboardLayout', () => {
      const content = fs.readFileSync(adminPath, 'utf-8');
      expect(content).toContain('import DashboardLayout');
      expect(content).toContain('<DashboardLayout');
    });

    it('should NOT import DashboardSidebar directly', () => {
      const content = fs.readFileSync(adminPath, 'utf-8');
      expect(content).not.toContain('import DashboardSidebar');
    });

    it('should pass pageTitle to DashboardLayout', () => {
      const content = fs.readFileSync(adminPath, 'utf-8');
      expect(content).toContain('pageTitle=');
    });
  });
});
