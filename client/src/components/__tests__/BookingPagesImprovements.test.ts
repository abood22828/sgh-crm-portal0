import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const componentsDir = path.resolve(__dirname, '..');
const pagesDir = path.resolve(__dirname, '../../pages');

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

describe('LeadStatsCards Improvements', () => {
  const content = readFile(path.join(componentsDir, 'LeadStatsCards.tsx'));

  it('should have professional stat card design with icons', () => {
    expect(content).toContain('lucide-react');
    expect(content).toContain('Users');
  });

  it('should have colored icon backgrounds', () => {
    expect(content).toMatch(/bg-(blue|emerald|amber|red|gray)-/);
  });

  it('should display stat values prominently', () => {
    expect(content).toMatch(/text-(2xl|3xl|xl)/);
  });

  it('should be responsive', () => {
    expect(content).toMatch(/grid-cols-\d.*lg:grid-cols|grid-cols-\d.*md:grid-cols|grid-cols-\d.*sm:grid-cols/);
  });
});

describe('AppointmentStatsCards Improvements', () => {
  const content = readFile(path.join(componentsDir, 'AppointmentStatsCards.tsx'));

  it('should have professional stat card design', () => {
    expect(content).toContain('lucide-react');
  });

  it('should have colored icon backgrounds', () => {
    expect(content).toMatch(/bg-(blue|emerald|amber|red|gray|purple)-/);
  });

  it('should be responsive', () => {
    expect(content).toMatch(/grid-cols-\d.*lg:grid-cols|grid-cols-\d.*md:grid-cols|grid-cols-\d.*sm:grid-cols/);
  });
});

describe('EmptyState Improvements', () => {
  const content = readFile(path.join(componentsDir, 'EmptyState.tsx'));

  it('should have a professional empty state design', () => {
    expect(content).toContain('EmptyState');
  });

  it('should support custom icons', () => {
    expect(content).toContain('icon');
  });

  it('should support action buttons', () => {
    expect(content).toMatch(/action|button|Button/i);
  });

  it('should have a description text', () => {
    expect(content).toMatch(/description|subtitle/i);
  });
});

describe('LeadCard Improvements', () => {
  const content = readFile(path.join(componentsDir, 'LeadCard.tsx'));

  it('should have status indicator with colored dot', () => {
    expect(content).toMatch(/rounded-full|dot/);
  });

  it('should have action buttons (call, whatsapp)', () => {
    expect(content).toContain('Phone');
    expect(content).toContain('MessageSquare');
  });

  it('should display lead info (name, phone, source)', () => {
    expect(content).toContain('fullName');
    expect(content).toContain('phone');
    expect(content).toContain('source');
  });

  it('should have status badge with color coding', () => {
    expect(content).toContain('Badge');
    expect(content).toMatch(/bg-(blue|emerald|amber|red|gray)-/);
  });
});

describe('AppointmentCard Improvements', () => {
  const content = readFile(path.join(componentsDir, 'AppointmentCard.tsx'));

  it('should have status indicator', () => {
    expect(content).toContain('Badge');
  });

  it('should have action buttons', () => {
    expect(content).toContain('Phone');
  });

  it('should display appointment info', () => {
    expect(content).toContain('fullName');
    expect(content).toContain('doctorName');
  });
});

describe('OfferLeadCard Improvements', () => {
  const content = readFile(path.join(componentsDir, 'OfferLeadCard.tsx'));

  it('should have status indicator', () => {
    expect(content).toContain('Badge');
  });

  it('should have action buttons', () => {
    expect(content).toContain('Phone');
  });

  it('should display offer lead info', () => {
    expect(content).toContain('fullName');
    expect(content).toContain('phone');
  });
});

describe('CampRegistrationCard Improvements', () => {
  const content = readFile(path.join(componentsDir, 'CampRegistrationCard.tsx'));

  it('should have status indicator', () => {
    expect(content).toContain('Badge');
  });

  it('should have action buttons', () => {
    expect(content).toContain('Phone');
  });

  it('should display camp registration info', () => {
    expect(content).toContain('fullName');
    expect(content).toContain('phone');
  });
});

describe('Pagination Improvements', () => {
  const content = readFile(path.join(componentsDir, 'Pagination.tsx'));

  it('should have page navigation buttons', () => {
    expect(content).toContain('ChevronLeft');
    expect(content).toContain('ChevronRight');
  });

  it('should display current page info', () => {
    expect(content).toMatch(/currentPage|page/);
  });

  it('should support page size selection', () => {
    expect(content).toMatch(/pageSize|PageSize/);
  });
});

describe('TableSkeleton Improvements', () => {
  const content = readFile(path.join(componentsDir, 'TableSkeleton.tsx'));

  it('should have skeleton loading animation', () => {
    expect(content).toContain('Skeleton');
  });

  it('should render table structure', () => {
    expect(content).toMatch(/Table|table/);
  });
});

describe('LeadsManagementPage Improvements', () => {
  const content = readFile(path.join(pagesDir, 'LeadsManagementPage.tsx'));

  it('should use DashboardLayout', () => {
    expect(content).toContain('DashboardLayout');
  });

  it('should have improved filter bar', () => {
    expect(content).toContain('Search');
    expect(content).toContain('Select');
  });

  it('should have status config with border property', () => {
    expect(content).toContain('border:');
  });

  it('should have improved dialog with quick actions', () => {
    expect(content).toContain('واتساب');
    expect(content).toContain('اتصال');
  });

  it('should have status selection buttons in dialog', () => {
    expect(content).toContain('جديد');
    expect(content).toContain('تم التواصل');
    expect(content).toContain('تم الحجز');
  });
});

describe('AppointmentsManagementPage Improvements', () => {
  const content = readFile(path.join(pagesDir, 'AppointmentsManagementPage.tsx'));

  it('should use DashboardLayout', () => {
    expect(content).toContain('DashboardLayout');
  });

  it('should have improved stats section', () => {
    expect(content).toContain('AppointmentStatsCards');
  });
});

describe('OfferLeadsManagement Improvements', () => {
  const content = readFile(path.join(componentsDir, 'OfferLeadsManagement.tsx'));

  it('should have improved stats cards with icons', () => {
    expect(content).toMatch(/bg-(blue|emerald|amber|red|purple)-/);
  });

  it('should have filter section', () => {
    expect(content).toContain('Search');
  });
});

describe('CampRegistrationsManagement Improvements', () => {
  const content = readFile(path.join(componentsDir, 'CampRegistrationsManagement.tsx'));

  it('should have improved stats cards with icons', () => {
    expect(content).toMatch(/bg-(blue|emerald|amber|red|purple|teal)-/);
  });

  it('should have filter section', () => {
    expect(content).toContain('Search');
  });
});
