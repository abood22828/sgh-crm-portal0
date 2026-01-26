import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import { initializeTracking } from "./lib/tracking";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import HomePage from "./pages/HomePage";
import CampaignLanding from "./pages/CampaignLanding";
import ThankYou from "./pages/ThankYou";
import AdminDashboard from "./pages/AdminDashboard";
import DoctorAppointments from "./pages/DoctorAppointments";
import Doctors from "./pages/Doctors";
import Unauthorized from "./pages/Unauthorized";
import AccessRequest from "./pages/AccessRequest";
import OffersListPage from "./pages/OffersListPage";
import CampsListPage from "./pages/CampsListPage";
import DoctorDetailPage from "./pages/DoctorDetailPage";
import OfferDetailPage from "./pages/OfferDetailPage";
import CampDetailPage from "./pages/CampDetailPage";

import VisitingDoctors from "./pages/VisitingDoctors";
import OfflinePage from "./pages/OfflinePage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import ManagementPage from "./pages/ManagementPage";
import ContentManagementPage from "./pages/ContentManagementPage";
import UsersManagementPage from "./pages/UsersManagementPage";
import PublishingPage from "./pages/PublishingPage";
import WhatsAppPage from "./pages/WhatsAppPage";
import WhatsAppTemplatesPage from "./pages/WhatsAppTemplatesPage";
import WhatsAppConnectionPage from "./pages/WhatsAppConnectionPage";
import MessagesPage from "./pages/MessagesPage";
import ReportsPage from "./pages/ReportsPage";
import ReportsPageNew from "./pages/admin/ReportsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import CampStatsPage from "./pages/CampStatsPage";
import BookingsManagementPage from "./pages/BookingsManagementPage";
import PWAManager from "./components/PWAManager";
import OfflineIndicator from "./components/OfflineIndicator";
import DigitalMarketingTeamPage from "./pages/DigitalMarketingTeamPage";
import MediaTeamPage from "./pages/MediaTeamPage";
import FieldMarketingTeamPage from "./pages/FieldMarketingTeamPage";
import CustomerServiceTeamPage from "./pages/CustomerServiceTeamPage";
import ProjectsManagementPage from "./pages/ProjectsManagementPage";
import ReviewApprovalPage from "./pages/ReviewApprovalPage";
import CampaignsPage from "./pages/admin/CampaignsPage";
import DigitalMarketingTasksPage from "./pages/admin/DigitalMarketingTasksPage";
import MessageSettingsPage from "./pages/MessageSettingsPage";

function Router() {
  const [location] = useLocation();
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={HomePage} />
      <Route path="/campaign/:slug" component={CampaignLanding} />
      <Route path={"/doctors"} component={Doctors} />
      <Route path={"/visiting-doctors"} component={VisitingDoctors} />
      <Route path={"/book-appointment"} component={DoctorAppointments} />
      <Route path={"/doctors/:slug"} component={DoctorDetailPage} />
      <Route path={"/offers"} component={OffersListPage} />
      <Route path={"/offers/:slug"} component={OfferDetailPage} />
      <Route path={"/camps"} component={CampsListPage} />
      <Route path={"/camps/:slug"} component={CampDetailPage} />
      <Route path={"/thank-you"} component={ThankYou} />
      <Route path={"/unauthorized"} component={Unauthorized} />
      <Route path={"/access-request"} component={AccessRequest} />
      <Route path={"/dashboard"} component={AdminDashboard} />
      <Route path={"/dashboard/profile"} component={ProfilePage} />
      <Route path={"/dashboard/management"} component={ManagementPage} />
      <Route path={"/dashboard/content"} component={ContentManagementPage} />
      <Route path={"/dashboard/users"} component={UsersManagementPage} />
      <Route path={"/dashboard/publishing"} component={PublishingPage} />
      <Route path={"/dashboard/whatsapp"} component={WhatsAppPage} />
      <Route path={"/dashboard/whatsapp/templates"} component={WhatsAppTemplatesPage} />
      <Route path={"/dashboard/whatsapp/connection"} component={WhatsAppConnectionPage} />
      <Route path={"/dashboard/messages"} component={MessagesPage} />
      <Route path={"/dashboard/message-settings"} component={MessageSettingsPage} />
      <Route path={"/dashboard/reports"} component={ReportsPageNew} />
      <Route path={"/dashboard/campaigns"} component={CampaignsPage} />
      <Route path={"/dashboard/analytics"} component={AnalyticsPage} />
       <Route path={"/dashboard/camp-stats"} component={CampStatsPage} />
      <Route path={"/dashboard/bookings"} component={BookingsManagementPage} />
      <Route path={"/dashboard/teams/digital-marketing"} component={DigitalMarketingTasksPage} />
      <Route path={"/dashboard/teams/media"} component={MediaTeamPage} />
      <Route path={"/dashboard/teams/field-marketing"} component={FieldMarketingTeamPage} />
      <Route path={"/dashboard/teams/customer-service"} component={CustomerServiceTeamPage} />
      <Route path={"/dashboard/projects"} component={CampaignsPage} />
      <Route path={"/dashboard/review-approval"} component={ReviewApprovalPage} />
      <Route path={"/admin"} component={AdminDashboard} />

      <Route path={"/offline"} component={OfflinePage} />
      <Route path={"/settings"} component={SettingsPage} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  // Initialize UTM tracking on mount
  useEffect(() => {
    initializeTracking();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <PWAManager />
          <OfflineIndicator />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
