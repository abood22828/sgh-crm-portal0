import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
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
import ManagementPage from "./pages/ManagementPage";
import ContentManagementPage from "./pages/ContentManagementPage";
import UsersManagementPage from "./pages/UsersManagementPage";
import PublishingPage from "./pages/PublishingPage";
import WhatsAppPage from "./pages/WhatsAppPage";
import MessagesPage from "./pages/MessagesPage";
import ReportsPage from "./pages/ReportsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import CampStatsPage from "./pages/CampStatsPage";
import BookingsManagementPage from "./pages/BookingsManagementPage";
import PWAManager from "./components/PWAManager";
import OfflineIndicator from "./components/OfflineIndicator";

function Router() {
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
      <Route path={"/dashboard/management"} component={ManagementPage} />
      <Route path={"/dashboard/content"} component={ContentManagementPage} />
      <Route path={"/dashboard/users"} component={UsersManagementPage} />
      <Route path={"/dashboard/publishing"} component={PublishingPage} />
      <Route path={"/dashboard/whatsapp"} component={WhatsAppPage} />
      <Route path={"/dashboard/messages"} component={MessagesPage} />
      <Route path={"/dashboard/reports"} component={ReportsPage} />
      <Route path={"/dashboard/analytics"} component={AnalyticsPage} />
       <Route path={"/dashboard/camp-stats"} component={CampStatsPage} />
      <Route path={"/dashboard/bookings"} component={BookingsManagementPage} />
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
