/**
 * Mobile Responsive Tests
 * اختبارات تحسين تجربة الجوال
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const CLIENT_SRC = path.resolve(__dirname, "..");
const PAGES_DIR = path.join(CLIENT_SRC, "pages");
const COMPONENTS_DIR = path.join(CLIENT_SRC, "components");

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

describe("Mobile Responsive - Navbar", () => {
  const navbarPath = path.join(COMPONENTS_DIR, "Navbar.tsx");

  it("should have hamburger menu for mobile", () => {
    const content = readFile(navbarPath);
    expect(content).toMatch(/Menu|hamburger|mobile.*menu|menuOpen|isMenuOpen/i);
  });

  it("should have responsive visibility classes", () => {
    const content = readFile(navbarPath);
    expect(content).toMatch(/md:hidden|lg:hidden|sm:hidden|md:flex|lg:flex/);
  });
});

describe("Mobile Responsive - DashboardLayout", () => {
  const layoutPath = path.join(COMPONENTS_DIR, "DashboardLayout.tsx");

  it("should have responsive padding", () => {
    const content = readFile(layoutPath);
    // Should use responsive padding like p-3 sm:p-4 md:p-6
    expect(content).toMatch(/p-[23]\s+sm:p-|px-[23]\s+sm:px-|p-[23]\s+md:p-/);
  });
});

describe("Mobile Responsive - DashboardSidebar", () => {
  const sidebarPath = path.join(COMPONENTS_DIR, "DashboardSidebar.tsx");

  it("should have mobile bottom bar", () => {
    const content = readFile(sidebarPath);
    expect(content).toMatch(/md:hidden|lg:hidden/);
    expect(content).toMatch(/fixed.*bottom|bottom.*bar/i);
  });

  it("should have theme toggle button", () => {
    const content = readFile(sidebarPath);
    expect(content).toMatch(/useTheme|toggleTheme|Sun|Moon/);
  });
});

describe("Mobile Responsive - Admin Dashboard", () => {
  const dashboardPath = path.join(PAGES_DIR, "AdminDashboard.tsx");

  it("should have responsive padding", () => {
    const content = readFile(dashboardPath);
    expect(content).toMatch(/p-[23]\s+sm:p-|px-[23]\s+sm:px-/);
  });

  it("should have responsive grid for stats", () => {
    const content = readFile(dashboardPath);
    expect(content).toMatch(/grid-cols-[12]\s+.*md:grid-cols-|grid-cols-[12]\s+.*lg:grid-cols-/);
  });
});

describe("Mobile Responsive - Management Pages", () => {
  const managementPages = [
    "LeadsManagementPage.tsx",
    "BookingsManagementPage.tsx",
    "AppointmentsManagementPage.tsx",
    "UsersManagementPage.tsx",
  ];

  managementPages.forEach((pageName) => {
    const pagePath = path.join(PAGES_DIR, pageName);
    if (!fs.existsSync(pagePath)) return;

    describe(pageName, () => {
      it("should have responsive padding", () => {
        const content = readFile(pagePath);
        expect(content).toMatch(/p-[23]\s+sm:p-|px-[23]\s+sm:px-|p-3\s+md:p-|p-2\s+md:p-/);
      });
    });
  });
});

describe("Mobile Responsive - WhatsApp Page", () => {
  const whatsappPath = path.join(PAGES_DIR, "WhatsAppPage.tsx");

  it("should have responsive padding", () => {
    const content = readFile(whatsappPath);
    expect(content).toMatch(/p-[23]\s+sm:p-|px-[23]\s+sm:px-/);
  });

  it("should have responsive text sizes", () => {
    const content = readFile(whatsappPath);
    expect(content).toMatch(/text-sm\s+sm:text-|text-xs\s+sm:text-/);
  });
});

describe("Mobile Responsive - Stats Cards", () => {
  const statsComponents = [
    "LeadStatsCards.tsx",
    "AppointmentStatsCards.tsx",
    "DetailedStatsCards.tsx",
  ];

  statsComponents.forEach((compName) => {
    const compPath = path.join(COMPONENTS_DIR, compName);
    if (!fs.existsSync(compPath)) return;

    describe(compName, () => {
      it("should have responsive text sizes for numbers", () => {
        const content = readFile(compPath);
        // Should use responsive text like text-lg sm:text-2xl
        expect(content).toMatch(/text-(lg|base|sm)\s+sm:text-(2xl|xl|lg)/);
      });

      it("should have responsive padding", () => {
        const content = readFile(compPath);
        expect(content).toMatch(/p-[23]\s+sm:p-|gap-[23]\s+sm:gap-/);
      });
    });
  });
});

describe("Mobile Responsive - Dialog", () => {
  const dialogPath = path.join(COMPONENTS_DIR, "ui", "dialog.tsx");

  it("should have responsive dialog sizing", () => {
    const content = readFile(dialogPath);
    // Should have mobile-friendly dialog sizing
    expect(content).toMatch(/sm:max-w-|max-w-\[/);
  });

  it("should have responsive padding for dialog content", () => {
    const content = readFile(dialogPath);
    expect(content).toMatch(/p-[34]\s+sm:p-|p-[34]\s+md:p-/);
  });
});

describe("Mobile Responsive - Detail Pages", () => {
  const detailPages = [
    "CampDetailPage.tsx",
    "OfferDetailPage.tsx",
    "DoctorDetailPage.tsx",
  ];

  detailPages.forEach((pageName) => {
    const pagePath = path.join(PAGES_DIR, pageName);
    if (!fs.existsSync(pagePath)) return;

    describe(pageName, () => {
      it("should have responsive grid gaps", () => {
        const content = readFile(pagePath);
        // Should use responsive gaps like gap-4 sm:gap-6 md:gap-8
        expect(content).toMatch(/gap-[34]\s+sm:gap-|gap-[34]\s+md:gap-/);
      });
    });
  });
});

describe("Mobile Responsive - CSS Global Styles", () => {
  const cssPath = path.join(CLIENT_SRC, "index.css");

  it("should have table-responsive class", () => {
    const content = readFile(cssPath);
    expect(content).toMatch(/\.table-responsive/);
  });

  it("should have dark mode variables", () => {
    const content = readFile(cssPath);
    expect(content).toMatch(/\.dark\s*\{/);
  });
});
