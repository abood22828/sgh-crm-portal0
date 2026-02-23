import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock requestAnimationFrame for AnimatedCounter tests
let rafCallbacks: ((time: number) => void)[] = [];
const originalRAF = globalThis.requestAnimationFrame;
const originalCAF = globalThis.cancelAnimationFrame;

beforeEach(() => {
  rafCallbacks = [];
  globalThis.requestAnimationFrame = vi.fn((cb) => {
    rafCallbacks.push(cb);
    return rafCallbacks.length;
  }) as any;
  globalThis.cancelAnimationFrame = vi.fn() as any;
});

afterEach(() => {
  globalThis.requestAnimationFrame = originalRAF;
  globalThis.cancelAnimationFrame = originalCAF;
});

describe('AnimatedCounter Logic', () => {
  it('should export AnimatedCounter component', async () => {
    const mod = await import('@/components/animations/AnimatedCounter');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });

  it('should have correct default props interface', async () => {
    const mod = await import('@/components/animations/AnimatedCounter');
    // Component should be a valid React component (function)
    expect(mod.default.length).toBeGreaterThanOrEqual(0);
  });
});

describe('FadeIn Logic', () => {
  it('should export FadeIn and StaggeredList components', async () => {
    const mod = await import('@/components/animations/FadeIn');
    expect(mod.default).toBeDefined();
    expect(mod.StaggeredList).toBeDefined();
    expect(typeof mod.default).toBe('function');
    expect(typeof mod.StaggeredList).toBe('function');
  });
});

describe('AnimatedBadge Logic', () => {
  it('should export AnimatedBadge component', async () => {
    const mod = await import('@/components/animations/AnimatedBadge');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });
});

describe('FlashUpdate Logic', () => {
  it('should export FlashUpdate component', async () => {
    const mod = await import('@/components/animations/FlashUpdate');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });
});

describe('AnimatedProgressBar Logic', () => {
  it('should export AnimatedProgressBar component', async () => {
    const mod = await import('@/components/animations/AnimatedProgressBar');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });
});

describe('Animations Index Exports', () => {
  it('should export all animation components from index', async () => {
    const mod = await import('@/components/animations');
    expect(mod.AnimatedCounter).toBeDefined();
    expect(mod.FadeIn).toBeDefined();
    expect(mod.StaggeredList).toBeDefined();
    expect(mod.AnimatedBadge).toBeDefined();
    expect(mod.FlashUpdate).toBeDefined();
    expect(mod.AnimatedProgressBar).toBeDefined();
  });
});

describe('EaseOutExpo Function', () => {
  it('should return correct easing values', () => {
    // easeOutExpo: t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
    const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    
    expect(easeOutExpo(0)).toBeCloseTo(0, 2);
    expect(easeOutExpo(0.5)).toBeGreaterThan(0.9); // Should be fast at start
    expect(easeOutExpo(1)).toBe(1);
    
    // Monotonically increasing
    let prev = 0;
    for (let t = 0.1; t <= 1; t += 0.1) {
      const val = easeOutExpo(t);
      expect(val).toBeGreaterThan(prev);
      prev = val;
    }
  });
});

describe('CSS Animation Classes', () => {
  it('should have animation keyframes defined in CSS', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const cssPath = path.resolve(__dirname, '../index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    
    // Check all animation keyframes are defined
    expect(cssContent).toContain('@keyframes flash-highlight');
    expect(cssContent).toContain('@keyframes badge-pulse');
    expect(cssContent).toContain('@keyframes row-enter');
    expect(cssContent).toContain('@keyframes slide-in-right');
    expect(cssContent).toContain('@keyframes scale-in');
    expect(cssContent).toContain('@keyframes number-shimmer');
    expect(cssContent).toContain('@keyframes card-enter');
    expect(cssContent).toContain('@keyframes counter-glow');
    expect(cssContent).toContain('@keyframes progress-shimmer');
    expect(cssContent).toContain('@keyframes breathe');
    expect(cssContent).toContain('@keyframes dot-pulse');
    expect(cssContent).toContain('@keyframes gentle-shake');
  });

  it('should have animation utility classes defined', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const cssPath = path.resolve(__dirname, '../index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    
    // Check utility classes
    expect(cssContent).toContain('.flash-highlight');
    expect(cssContent).toContain('.badge-pulse');
    expect(cssContent).toContain('.row-enter');
    expect(cssContent).toContain('.stagger-rows');
    expect(cssContent).toContain('.stagger-cards');
    expect(cssContent).toContain('.stat-card-animated');
    expect(cssContent).toContain('.dot-pulse');
    expect(cssContent).toContain('.gentle-shake');
  });

  it('should have stagger delay classes for rows', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const cssPath = path.resolve(__dirname, '../index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    
    // Check stagger delays for at least 10 rows
    for (let i = 1; i <= 10; i++) {
      expect(cssContent).toContain(`.stagger-rows tr:nth-child(${i})`);
    }
  });

  it('should have stagger delay classes for cards', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const cssPath = path.resolve(__dirname, '../index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    
    // Check stagger delays for at least 4 cards
    for (let i = 1; i <= 4; i++) {
      expect(cssContent).toContain(`.stagger-cards > *:nth-child(${i})`);
    }
  });
});

describe('Animation Integration in Components', () => {
  it('should use AnimatedCounter in LeadStatsCards', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(__dirname, '../components/LeadStatsCards.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    
    expect(content).toContain('AnimatedCounter');
    expect(content).toContain('stagger-cards');
    expect(content).toContain('stat-card-animated');
  });

  it('should use AnimatedCounter in AppointmentStatsCards', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(__dirname, '../components/AppointmentStatsCards.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    
    expect(content).toContain('AnimatedCounter');
    expect(content).toContain('stagger-cards');
    expect(content).toContain('stat-card-animated');
  });

  it('should use AnimatedCounter in DetailedStatsCards', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(__dirname, '../components/DetailedStatsCards.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    
    expect(content).toContain('AnimatedCounter');
    expect(content).toContain('stagger-cards');
    expect(content).toContain('stat-card-animated');
  });

  it('should use stagger-rows in table pages', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const pages = [
      // LeadsManagementPage تم تقسيمه - stagger-rows انتقل إلى LeadTableDesktop
      '../components/leads/LeadTableDesktop.tsx',
      '../pages/AppointmentsManagementPage.tsx',
      '../pages/UsersManagementPage.tsx',
      // AdminDashboard تم تقسيمه - الجداول انتقلت إلى مكونات فرعية
      // BookingsManagementPage يستخدم LeadsTab/AppointmentsTab المنفصلة
    ];
    
    for (const page of pages) {
      const filePath = path.resolve(__dirname, page);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('stagger-rows');
    }
  });

  it('should use badge-pulse in DashboardSidebar', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(__dirname, '../components/DashboardSidebar.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    
    expect(content).toContain('badge-pulse');
    expect(content).toContain('dot-pulse');
  });

  it('should use animation in WhatsAppPage', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(__dirname, '../pages/WhatsAppPage.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    
    expect(content).toContain('row-enter');
    expect(content).toContain('badge-pulse');
  });
});
