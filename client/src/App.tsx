import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PersonaProvider } from "@/contexts/PersonaContext";
import PersonaSelectionModal from "@/components/PersonaSelectionModal";
import Home from "@/pages/Home";
import HowItWorks from "@/pages/HowItWorks";
import VirtualTour from "@/pages/VirtualTour";
import Donate from "@/pages/Donate";
import DonateSuccess from "@/pages/DonateSuccess";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminGuide from "@/pages/AdminGuide";
import AdminImages from "@/pages/AdminImages";
import AdminContentManager from "@/pages/AdminContentManager";
import AdminUserManagement from "@/pages/AdminUserManagement";
import AdminABTesting from "@/pages/AdminABTesting";
import AdminABTestAnalytics from "@/pages/AdminABTestAnalytics";
import AdminEmailCampaigns from "@/pages/AdminEmailCampaigns";
import AdminSmsNotifications from "@/pages/AdminSmsNotifications";
import AdminTasks from "@/pages/AdminTasks";
import AdminPipeline from "@/pages/AdminPipeline";
import AdminPreferences from "@/pages/AdminPreferences";
import AppointmentScheduling from "@/pages/AppointmentScheduling";
import ProductLanding from "@/pages/ProductLanding";
import ImageComparison from "@/pages/ImageComparison";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/virtual-tour" component={VirtualTour} />
      <Route path="/donate" component={Donate} />
      <Route path="/donate/success" component={DonateSuccess} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/guide" component={AdminGuide} />
      <Route path="/admin/images" component={AdminImages} />
      <Route path="/admin/content" component={AdminContentManager} />
      <Route path="/admin/users" component={AdminUserManagement} />
      <Route path="/admin/ab-testing" component={AdminABTesting} />
      <Route path="/admin/ab-testing/:id" component={AdminABTestAnalytics} />
      <Route path="/admin/email-campaigns" component={AdminEmailCampaigns} />
      <Route path="/admin/sms-notifications" component={AdminSmsNotifications} />
      <Route path="/admin/tasks" component={AdminTasks} />
      <Route path="/admin/pipeline" component={AdminPipeline} />
      <Route path="/admin/preferences" component={AdminPreferences} />
      <Route path="/schedule" component={AppointmentScheduling} />
      <Route path="/product" component={ProductLanding} />
      <Route path="/comparison" component={ImageComparison} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PersonaProvider>
          <Toaster />
          <PersonaSelectionModal />
          <Router />
        </PersonaProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
