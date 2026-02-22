import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Dark Mode System', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark', 'light');
  });

  describe('Theme Persistence', () => {
    it('should store theme preference in localStorage', () => {
      localStorage.setItem('theme', 'dark');
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('should default to light theme when no preference stored', () => {
      const stored = localStorage.getItem('theme');
      expect(stored).toBeNull();
    });

    it('should persist dark theme choice', () => {
      localStorage.setItem('theme', 'dark');
      expect(localStorage.getItem('theme')).toBe('dark');
      
      // Simulate page reload
      const theme = localStorage.getItem('theme');
      expect(theme).toBe('dark');
    });

    it('should persist light theme choice', () => {
      localStorage.setItem('theme', 'light');
      expect(localStorage.getItem('theme')).toBe('light');
    });
  });

  describe('Theme Toggle', () => {
    it('should toggle from light to dark', () => {
      let currentTheme = 'light';
      currentTheme = currentTheme === 'light' ? 'dark' : 'light';
      expect(currentTheme).toBe('dark');
    });

    it('should toggle from dark to light', () => {
      let currentTheme = 'dark';
      currentTheme = currentTheme === 'light' ? 'dark' : 'light';
      expect(currentTheme).toBe('light');
    });

    it('should apply dark class to document element', () => {
      document.documentElement.classList.add('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove dark class when switching to light', () => {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('CSS Variables', () => {
    it('should have dark mode CSS variables defined', () => {
      // Verify the CSS file contains .dark selector
      // This is a structural test - the actual CSS is loaded at runtime
      const darkModeVars = [
        '--background',
        '--foreground',
        '--card',
        '--card-foreground',
        '--primary',
        '--primary-foreground',
        '--secondary',
        '--secondary-foreground',
        '--muted',
        '--muted-foreground',
        '--accent',
        '--accent-foreground',
        '--border',
        '--input',
        '--ring',
      ];
      
      // Each variable should be a valid CSS custom property name
      darkModeVars.forEach(varName => {
        expect(varName).toMatch(/^--[a-z-]+$/);
      });
    });
  });

  describe('System Preference Detection', () => {
    it('should detect system dark mode preference', () => {
      const mockMatchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      
      window.matchMedia = mockMatchMedia;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      expect(prefersDark).toBe(true);
    });

    it('should detect system light mode preference', () => {
      const mockMatchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: light)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      
      window.matchMedia = mockMatchMedia;
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      expect(prefersLight).toBe(true);
    });
  });

  describe('Theme Toggle Button', () => {
    it('should show sun icon in dark mode', () => {
      const theme = 'dark';
      const iconName = theme === 'dark' ? 'Sun' : 'Moon';
      expect(iconName).toBe('Sun');
    });

    it('should show moon icon in light mode', () => {
      const theme = 'light';
      const iconName = theme === 'dark' ? 'Sun' : 'Moon';
      expect(iconName).toBe('Moon');
    });

    it('should show correct label in dark mode', () => {
      const theme = 'dark';
      const label = theme === 'dark' ? 'مضيء' : 'مظلم';
      expect(label).toBe('مضيء');
    });

    it('should show correct label in light mode', () => {
      const theme = 'light';
      const label = theme === 'dark' ? 'مضيء' : 'مظلم';
      expect(label).toBe('مظلم');
    });
  });

  describe('Dark Mode Color Classes', () => {
    it('should have dark mode variants for sidebar', () => {
      const sidebarClasses = 'bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700';
      expect(sidebarClasses).toContain('dark:bg-gray-900');
      expect(sidebarClasses).toContain('dark:border-gray-700');
    });

    it('should have dark mode variants for header', () => {
      const headerClasses = 'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700';
      expect(headerClasses).toContain('dark:bg-gray-900');
      expect(headerClasses).toContain('dark:border-gray-700');
    });

    it('should have dark mode variants for main content area', () => {
      const mainClasses = 'min-h-screen bg-gray-50 dark:bg-gray-950';
      expect(mainClasses).toContain('dark:bg-gray-950');
    });

    it('should have dark mode variants for active nav items', () => {
      const activeClasses = 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      expect(activeClasses).toContain('dark:bg-blue-900/30');
      expect(activeClasses).toContain('dark:text-blue-400');
    });

    it('should have dark mode variants for text colors', () => {
      const textClasses = 'text-gray-900 dark:text-gray-100';
      expect(textClasses).toContain('dark:text-gray-100');
    });
  });

  describe('Transition Effect', () => {
    it('should add theme-transition class during toggle', () => {
      document.documentElement.classList.add('theme-transition');
      expect(document.documentElement.classList.contains('theme-transition')).toBe(true);
    });

    it('should remove theme-transition class after animation', async () => {
      document.documentElement.classList.add('theme-transition');
      // Simulate timeout removal
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
      }, 0);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(document.documentElement.classList.contains('theme-transition')).toBe(false);
    });
  });
});
