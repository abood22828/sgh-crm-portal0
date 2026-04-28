import { Toaster } from "@/components/ui/sonner";
import { useEffect, lazy, Suspense } from "react";
import { initializeTracking } from "./lib/tracking";
import { TooltipProvider } from "@/components/ui/tooltip";
const NotFound = lazy(() => import("@/pages/NotFound"));
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardShell from "./components/DashboardShell";
// Lazy load pages for better performance
const Home = lazy(() => import("./pages/Home"));
const HomePage = lazy(() => import("./pages/HomePage"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const DoctorAppointments = lazy(() => import("./pages/DoctorAppointments"));
const Doctors = lazy(() => import("./pages/Doctors"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const AccessRequest = lazy(() => import("./pages/AccessRequest"));
const OffersListPage = lazy(() => import("./pages/OffersListPage"));
const CampsListPage = lazy(() => import("./pages/CampsListPage"));
const DoctorDetailPage = lazy(() => import("./pages/DoctorDetailPage"));
const OfferDetailPage = lazy(() => import("./pages/OfferDetailPage"));
const CampDetailPage = lazy(() => import("./pages/CampDetailPage"));
const VisitingDoctors = lazy(() => import("./pages/VisitingDoctors"));
const OfflinePage = lazy(() => import("./pages/OfflinePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ManagementPage = lazy(() => import("./pages/ManagementPage"));
const ContentManagementPage = lazy(() => import("./pages/ContentManagementPage"));
const UsersManagementPage = lazy(() => import("./pages/UsersManagementPage"));
const PublishingPage = lazy(() => import("./pages/PublishingPage"));
const WhatsAppPage = lazy(() => import("./pages/WhatsAppPage"));
const WhatsAppTemplatesPage = lazy(() => import("./pages/WhatsAppTemplatesPage"));
const WhatsAppConnectionPage = lazy(() => import("./pages/WhatsAppConnectionPage"));
const WhatsAppDashboard = lazy(() => import("./pages/WhatsAppDashboard"));
const WhatsAppAnalytics = lazy(() => import("./pages/WhatsAppAnalytics"));
const WhatsAppBroadcast = lazy(() => import("./pages/WhatsAppBroadcast"));
const WhatsAppAutoReply = lazy(() => import("./pages/WhatsAppAutoReply"));
const WhatsAppCompliance = lazy(() => import("./pages/WhatsAppCompliance"));
const WhatsAppAppointments = lazy(() => import("./pages/WhatsAppAppointments"));
const WhatsAppIntegration = lazy(() => import("./pages/WhatsAppIntegration"));
const WhatsAppAccountHealthPage = lazy(() => import("./pages/WhatsAppAccountHealthPage"));
const WhatsAppPhoneQualityPage = lazy(() => import("./pages/WhatsAppPhoneQualityPage"));
const WhatsAppUserSubscriptionsPage = lazy(() => import("./pages/WhatsAppUserSubscriptionsPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const ReportsPageNew = lazy(() => import("./pages/admin/ReportsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const CampStatsPage = lazy(() => import("./pages/CampStatsPage"));
const BookingsManagementPage = lazy(() => import("./pages/BookingsManagementPage"));
const LeadsManagementPage = lazy(() => import("./pages/LeadsManagementPage"));
const AppointmentsManagementPage = lazy(() => import("./pages/AppointmentsManagementPage"));
const OfferLeadsPage = lazy(() => import("./pages/OfferLeadsPage"));
const CampRegistrationsPage = lazy(() => import("./pages/CampRegistrationsPage"));
const CustomersPage = lazy(() => import("./pages/CustomersPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
import PWAManager from "./components/PWAManager";
import MetaPixel from "./components/MetaPixel";
import OfflineIndicator from "./components/OfflineIndicator";
import CookieConsentBanner from "./components/CookieConsentBanner";
const DigitalMarketingTeamPage = lazy(() => import("./pages/DigitalMarketingTeamPage"));
const MediaTeamPage = lazy(() => import("./pages/MediaTeamPage"));
const FieldMarketingTeamPage = lazy(() => import("./pages/FieldMarketingTeamPage"));
const CustomerServiceTeamPage = lazy(() => import("./pages/CustomerServiceTeamPage"));
const ProjectsManagementPage = lazy(() => import("./pages/ProjectsManagementPage"));
const ReviewApprovalPage = lazy(() => import("./pages/ReviewApprovalPage"));
const CampaignsPage = lazy(() => import("./pages/admin/CampaignsPage"));
const DigitalMarketingTasksPage = lazy(() => import("./pages/admin/DigitalMarketingTasksPage"));
const PatientPortalLogin = lazy(() => import("./pages/PatientPortalLogin"));
const PatientDashboard = lazy(() => import("./pages/PatientDashboard"));
const MessageSettingsPage = lazy(() => import("./pages/MessageSettingsPage"));
const PWAStatsPage = lazy(() => import("./pages/PWAStatsPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const BIPage = lazy(() => import("./pages/BIPage"));
const TrackingSettingsPage = lazy(() => import("./pages/TrackingSettingsPage"));


function Router() {
  const [location] = useLocation();
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <Switch>
      <Route path={"/"} component={HomePage} />
      <Route path={"/doctors"} component={Doctors} />
      <Route path={"/visiting-doctors"} component={VisitingDoctors} />

      <Route path={"/doctors/:slug"} component={DoctorDetailPage} />
      <Route path={"/offers"} component={OffersListPage} />
      <Route path={"/offers/:slug"} component={OfferDetailPage} />
      <Route path={"/camps"} component={CampsListPage} />
      <Route path={"/camps/:slug"} component={CampDetailPage} />
      <Route path={"/thank-you"} component={ThankYou} />
      <Route path={"/privacy-policy"} component={PrivacyPolicyPage} />
      <Route path={"/unauthorized"} component={Unauthorized} />
      <Route path={"/access-request"} component={AccessRequest} />

      {/* Dashboard routes with persistent sidebar */}
      <Route path="/dashboard">
        <DashboardShell>
          <AdminDashboard />
        </DashboardShell>
      </Route>
      <Route path="/dashboard/*">
        <DashboardShell>
          <Switch>
            <Route path={"/dashboard/profile"} component={ProfilePage} />
            <Route path={"/dashboard/management"} component={ManagementPage} />
            <Route path={"/dashboard/content"} component={ContentManagementPage} />
            <Route path={"/dashboard/users"} component={UsersManagementPage} />
            <Route path={"/dashboard/publishing"} component={PublishingPage} />
            <Route path={"/dashboard/whatsapp"} component={WhatsAppPage} />
            <Route path={"/dashboard/whatsapp/templates"} component={WhatsAppTemplatesPage} />
            <Route path={"/dashboard/whatsapp/connection"} component={WhatsAppConnectionPage} />
            <Route path={"/dashboard/whatsapp/analytics"} component={WhatsAppAnalytics} />
            <Route path={"/dashboard/whatsapp/broadcast"} component={WhatsAppBroadcast} />
            <Route path={"/dashboard/whatsapp/auto-reply"} component={WhatsAppAutoReply} />
            <Route path={"/dashboard/whatsapp/compliance"} component={WhatsAppCompliance} />
            <Route path={"/dashboard/whatsapp/appointments"} component={WhatsAppAppointments} />
            <Route path={"/dashboard/whatsapp/integration"} component={WhatsAppIntegration} />
            <Route path={"/dashboard/whatsapp/account-health"} component={WhatsAppAccountHealthPage} />
            <Route path={"/dashboard/whatsapp/phone-quality"} component={WhatsAppPhoneQualityPage} />
            <Route path={"/dashboard/whatsapp/subscriptions"} component={WhatsAppUserSubscriptionsPage} />
            <Route path={"/dashboard/messages"} component={MessagesPage} />
            <Route path={"/dashboard/message-settings"} component={MessageSettingsPage} />
            <Route path={"/dashboard/reports"} component={ReportsPageNew} />
            <Route path={"/dashboard/campaigns"} component={CampaignsPage} />
            <Route path={"/dashboard/analytics"} component={AnalyticsPage} />
            <Route path={"/dashboard/bi"} component={BIPage} />
            <Route path={"/dashboard/tracking-settings"} component={TrackingSettingsPage} />
            <Route path={"/dashboard/camp-stats"} component={CampStatsPage} />
            <Route path={"/dashboard/bookings"} component={BookingsManagementPage} />
            <Route path={"/dashboard/bookings/leads"} component={LeadsManagementPage} />
            <Route path={"/dashboard/bookings/appointments"} component={AppointmentsManagementPage} />
            <Route path={"/dashboard/bookings/offer-leads"} component={OfferLeadsPage} />
            <Route path={"/dashboard/bookings/camp-registrations"} component={CampRegistrationsPage} />
            <Route path={"/dashboard/bookings/customers"} component={CustomersPage} />
            <Route path={"/dashboard/bookings/tasks"} component={TasksPage} />
            <Route path={"/dashboard/teams/digital-marketing"} component={DigitalMarketingTasksPage} />
            <Route path={"/dashboard/teams/media"} component={MediaTeamPage} />
            <Route path={"/dashboard/teams/field-marketing"} component={FieldMarketingTeamPage} />
            <Route path={"/dashboard/teams/customer-service"} component={CustomerServiceTeamPage} />
            <Route path={"/dashboard/projects"} component={CampaignsPage} />
            <Route path={"/dashboard/review-approval"} component={ReviewApprovalPage} />
            <Route path={"/dashboard/pwa-stats"} component={PWAStatsPage} />
            <Route path={"/dashboard/settings"} component={SettingsPage} />
          </Switch>
        </DashboardShell>
      </Route>

      {/* Admin routes with persistent sidebar */}
      <Route path="/admin/*">
        <DashboardShell>
          <Switch>
            <Route path={"/admin"} component={AdminDashboard} />
            <Route path={"/admin/"} component={AdminDashboard} />
            <Route path={"/admin/offline"} component={OfflinePage} />
          </Switch>
        </DashboardShell>
      </Route>

      <Route path={"/patient-portal"} component={PatientPortalLogin} />
      <Route path={"/patient-portal/dashboard"} component={PatientDashboard} />
      <Route path={"/offline"} component={OfflinePage} />
      <Route path={"/settings"} component={SettingsPage} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
      </Switch>
    </Suspense>
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
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <PWAManager />
          <OfflineIndicator />
          <CookieConsentBanner />
          <MetaPixel />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
