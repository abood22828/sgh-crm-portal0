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
import SocialMediaReports from "./pages/SocialMediaReports";
import VisitingDoctors from "./pages/VisitingDoctors";

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
      <Route path={"/dashboard/*"} component={AdminDashboard} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/reports/social-media"} component={SocialMediaReports} />
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
