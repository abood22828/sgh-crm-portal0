import { useEffect } from "react";
import TopNavbar from "./TopNavbar";

export default function DashboardLayout({
  children,
  pageTitle,
  pageDescription,
}: {
  children: React.ReactNode;
  pageTitle?: string;
  pageDescription?: string;
}) {
  // Update document title dynamically based on pageTitle prop
  useEffect(() => {
    const baseTitle = 'لوحة تحكم SGH';
    if (pageTitle) {
      document.title = `${pageTitle} | ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
    // Restore on unmount
    return () => {
      document.title = baseTitle;
    };
  }, [pageTitle]);

  return (
    <>
      {/* Top Navbar with Notifications + Theme + User */}
      <TopNavbar pageTitle={pageTitle} pageDescription={pageDescription} />
      
      {/* Page Content */}
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </>
  );
}
