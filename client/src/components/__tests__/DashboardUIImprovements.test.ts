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

    // New tests for compact design and edit mode
    it('should have compact 60px width for slim sidebar', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('w-[60px]');
    });

    it('should have small icons (18px) for compact design', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('h-[18px] w-[18px]');
    });

    it('should have small text (8px) for compact design', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('text-[8px]');
    });

    it('should have edit mode functionality', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('editMode');
      expect(sidebarContent).toContain('startEditMode');
      expect(sidebarContent).toContain('cancelEditMode');
      expect(sidebarContent).toContain('saveEditMode');
    });

    it('should have edit button (تعديل) in all tools panel', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('Pencil');
      expect(sidebarContent).toContain('تعديل');
    });

    it('should have customizable visible items with localStorage', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('visibleItemIds');
      expect(sidebarContent).toContain('STORAGE_KEY');
      expect(sidebarContent).toContain('localStorage');
      expect(sidebarContent).toContain('DEFAULT_VISIBLE_IDS');
    });

    it('should have edit mode with checkboxes for item selection', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('editingItemIds');
      expect(sidebarContent).toContain('toggleEditItem');
      expect(sidebarContent).toContain('isChecked');
    });

    it('should prevent removing home item in edit mode', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      // Home item should be non-removable
      expect(sidebarContent).toContain('"home"');
      expect(sidebarContent).toContain('cursor-not-allowed');
      expect(sidebarContent).toContain('(ثابت)');
    });

    // Drag & Drop tests
    it('should import @dnd-kit libraries for drag and drop', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('@dnd-kit/core');
      expect(sidebarContent).toContain('@dnd-kit/sortable');
      expect(sidebarContent).toContain('@dnd-kit/utilities');
    });

    it('should have DndContext and SortableContext for reordering', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('DndContext');
      expect(sidebarContent).toContain('SortableContext');
      expect(sidebarContent).toContain('verticalListSortingStrategy');
    });

    it('should have SortableEditItem component with drag handle', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('SortableEditItem');
      expect(sidebarContent).toContain('useSortable');
      expect(sidebarContent).toContain('GripVertical');
      expect(sidebarContent).toContain('cursor-grab');
    });

    it('should have handleDragEnd with arrayMove for reordering', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('handleDragEnd');
      expect(sidebarContent).toContain('arrayMove');
    });

    it('should have drag sensors configured', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('useSensors');
      expect(sidebarContent).toContain('PointerSensor');
      expect(sidebarContent).toContain('KeyboardSensor');
    });

    it('should separate checked and unchecked items in edit mode', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('معروض في الشريط');
      expect(sidebarContent).toContain('عناصر مخفية');
    });

    it('should have visual feedback during drag (shadow, ring)', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('isDragging');
      expect(sidebarContent).toContain('shadow-lg');
      expect(sidebarContent).toContain('ring-2');
    });

    it('should keep home item fixed and not draggable', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      // Home drag handle should be invisible
      expect(sidebarContent).toContain('isHome && "invisible"');
    });

    it('should have save and cancel buttons in edit mode', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('إلغاء');
      expect(sidebarContent).toContain('حفظ');
      expect(sidebarContent).toContain('تعديل الشريط الجانبي');
    });

    it('should have all nav items defined with unique ids', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('allNavItems');
      expect(sidebarContent).toContain('id: "home"');
      expect(sidebarContent).toContain('id: "leads"');
      expect(sidebarContent).toContain('id: "appointments"');
      expect(sidebarContent).toContain('id: "customers"');
      expect(sidebarContent).toContain('id: "tasks"');
    });

    // Sidebar Badges tests
    it('should have SidebarBadge component for notification counts', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('SidebarBadge');
      expect(sidebarContent).toContain('count');
    });

    it('should fetch badge counts from sidebarBadges tRPC query', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('trpc.sidebarBadges.useQuery');
      expect(sidebarContent).toContain('badgeCounts');
    });

    it('should have getBadgeCount function mapping item IDs to counts', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('getBadgeCount');
    });

    it('should show badges on desktop slim sidebar icons', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      // SidebarBadge should appear in the slim sidebar section
      const slimSidebarSection = sidebarContent.split('renderDesktopSlimSidebar')[1];
      expect(slimSidebarSection).toContain('SidebarBadge');
      expect(slimSidebarSection).toContain('getBadgeCount');
    });

    it('should show badges on all tools panel items', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      // SidebarBadge should appear in the all tools panel section
      const allToolsSection = sidebarContent.split('renderAllToolsPanel')[1];
      expect(allToolsSection).toContain('SidebarBadge');
    });

    it('should show badges on mobile sidebar items', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      // SidebarBadge should appear in the mobile sidebar section
      const mobileSidebarSection = sidebarContent.split('renderMobileSidebar')[1];
      expect(mobileSidebarSection).toContain('SidebarBadge');
    });

    it('should show badges on mobile bottom bar', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      // SidebarBadge should appear in the mobile bottom bar section
      const mobileBottomSection = sidebarContent.split('renderMobileBottomBar')[1];
      expect(mobileBottomSection).toContain('SidebarBadge');
    });

    it('should auto-refresh badges periodically', () => {
      sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
      expect(sidebarContent).toContain('refetchInterval');
      expect(sidebarContent).toContain('60_000');
    });
  });

  describe('Notification Sound (useNotificationSound)', () => {
    const hookPath = path.join(basePath, 'client/src/hooks/useNotificationSound.ts');
    let hookContent: string;

    it('should exist', () => {
      expect(fs.existsSync(hookPath)).toBe(true);
      hookContent = fs.readFileSync(hookPath, 'utf-8');
    });

    it('should export useNotificationSound hook', () => {
      hookContent = fs.readFileSync(hookPath, 'utf-8');
      expect(hookContent).toContain('export function useNotificationSound');
    });

    it('should return soundEnabled and toggleSound', () => {
      hookContent = fs.readFileSync(hookPath, 'utf-8');
      expect(hookContent).toContain('soundEnabled');
      expect(hookContent).toContain('toggleSound');
    });

    it('should use trpc.sidebarBadges.useQuery for monitoring', () => {
      hookContent = fs.readFileSync(hookPath, 'utf-8');
      expect(hookContent).toContain('trpc.sidebarBadges.useQuery');
    });

    it('should persist sound preference in localStorage', () => {
      hookContent = fs.readFileSync(hookPath, 'utf-8');
      expect(hookContent).toContain('localStorage');
      expect(hookContent).toContain('notification-sound-enabled');
    });

    it('should use Web Audio API for notification sound', () => {
      hookContent = fs.readFileSync(hookPath, 'utf-8');
      expect(hookContent).toContain('AudioContext');
    });

    it('should track previous count to detect new messages', () => {
      hookContent = fs.readFileSync(hookPath, 'utf-8');
      expect(hookContent).toContain('prevWhatsappCountRef');
    });

    it('should have sound toggle button in DashboardSidebar', () => {
      const sidebarContent = fs.readFileSync(
        path.join(basePath, 'client/src/components/DashboardSidebar.tsx'), 'utf-8'
      );
      expect(sidebarContent).toContain('useNotificationSound');
      expect(sidebarContent).toContain('toggleSound');
      expect(sidebarContent).toContain('soundEnabled');
      expect(sidebarContent).toContain('Volume2');
      expect(sidebarContent).toContain('VolumeX');
    });

    it('should show sound toggle in desktop slim sidebar', () => {
      const sidebarContent = fs.readFileSync(
        path.join(basePath, 'client/src/components/DashboardSidebar.tsx'), 'utf-8'
      );
      const slimSection = sidebarContent.split('renderDesktopSlimSidebar')[1];
      expect(slimSection).toContain('toggleSound');
      expect(slimSection).toContain('التنبيه');
      expect(slimSection).toContain('صامت');
    });

    it('should show sound toggle in all tools panel', () => {
      const sidebarContent = fs.readFileSync(
        path.join(basePath, 'client/src/components/DashboardSidebar.tsx'), 'utf-8'
      );
      const allToolsSection = sidebarContent.split('renderAllToolsPanel')[1];
      expect(allToolsSection).toContain('toggleSound');
    });

    it('should show sound toggle in mobile sidebar', () => {
      const sidebarContent = fs.readFileSync(
        path.join(basePath, 'client/src/components/DashboardSidebar.tsx'), 'utf-8'
      );
      const mobileSection = sidebarContent.split('renderMobileSidebar')[1];
      expect(mobileSection).toContain('toggleSound');
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
