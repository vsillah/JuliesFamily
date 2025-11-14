import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PersonaProvider } from "@/contexts/PersonaContext";
import PersonaSelectionModal from "@/components/PersonaSelectionModal";
import { ChatbotWidget } from "@/components/ChatbotWidget";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import Home from "@/pages/Home";
import HowItWorks from "@/pages/HowItWorks";
import VirtualTour from "@/pages/VirtualTour";
import Donate from "@/pages/Donate";
import DonateSuccess from "@/pages/DonateSuccess";
import Profile from "@/pages/Profile";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminGuide from "@/pages/AdminGuide";
import AdminImages from "@/pages/AdminImages";
import AdminContentManager from "@/pages/AdminContentManager";
import AdminUserManagement from "@/pages/AdminUserManagement";
import AdminABTesting from "@/pages/AdminABTesting";
import AdminABTestAnalytics from "@/pages/AdminABTestAnalytics";
import AdminBackups from "@/pages/AdminBackups";
import AdminEmailCampaigns from "@/pages/AdminEmailCampaigns";
import AdminEmailCampaignDetails from "@/pages/AdminEmailCampaignDetails";
import AdminEmailReports from "@/pages/AdminEmailReports";
import AdminEmailUnsubscribes from "@/pages/AdminEmailUnsubscribes";
import AdminSmsNotifications from "@/pages/AdminSmsNotifications";
import AdminHormoziEmails from "@/pages/AdminHormoziEmails";
import AdminHormoziSms from "@/pages/AdminHormoziSms";
import AdminDonationCampaigns from "@/pages/AdminDonationCampaigns";
import CampaignDashboard from "@/pages/CampaignDashboard";
import MemberCampaigns from "@/pages/MemberCampaigns";
import MemberCampaignDashboard from "@/pages/MemberCampaignDashboard";
import AdminTasks from "@/pages/AdminTasks";
import AdminPipeline from "@/pages/AdminPipeline";
import AdminPreferences from "@/pages/AdminPreferences";
import AdminLeadSourcing from "@/pages/AdminLeadSourcing";
import AdminCacLtgpDashboard from "@/pages/AdminCacLtgpDashboard";
import AdminCohortAnalysis from "@/pages/AdminCohortAnalysis";
import AdminChannelManagement from "@/pages/AdminChannelManagement";
import AdminDonorLifecycle from "@/pages/AdminDonorLifecycle";
import AdminStudentEnrollments from "@/pages/AdminStudentEnrollments";
import AdminVolunteerManagement from "@/pages/AdminVolunteerManagement";
import AdminFunnelAnalytics from "@/pages/AdminFunnelAnalytics";
import AdminSegments from "@/pages/AdminSegments";
import AdminAutomationRules from "@/pages/AdminAutomationRules";
import AdminAutomationRuns from "@/pages/AdminAutomationRuns";
import AdminAutomationConfig from "@/pages/AdminAutomationConfig";
import AdminRoleProvisioning from "@/pages/AdminRoleProvisioning";
import AppointmentScheduling from "@/pages/AppointmentScheduling";
import ProductLanding from "@/pages/ProductLanding";
import ImageComparison from "@/pages/ImageComparison";
import TechGoesHomeLanding from "@/pages/TechGoesHomeLanding";
import TechGoesHomeStudentDashboard from "@/pages/TechGoesHomeStudentDashboard";
import StudentDashboardPage from "@/pages/StudentDashboard";
import VolunteerEngagement from "@/pages/VolunteerEngagement";
import Unsubscribe from "@/pages/Unsubscribe";
import SmsUnsubscribe from "@/pages/SmsUnsubscribe";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/virtual-tour" component={VirtualTour} />
      <Route path="/donate" component={Donate} />
      <Route path="/donate/success" component={DonateSuccess} />
      <Route path="/profile" component={Profile} />
      <Route path="/dashboard" component={StudentDashboardPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/guide" component={AdminGuide} />
      <Route path="/admin/images" component={AdminImages} />
      <Route path="/admin/content" component={AdminContentManager} />
      <Route path="/admin/users" component={AdminUserManagement} />
      <Route path="/admin/backups" component={AdminBackups} />
      <Route path="/admin/ab-testing" component={AdminABTesting} />
      <Route path="/admin/ab-testing/:id" component={AdminABTestAnalytics} />
      <Route path="/admin/email-campaigns/:id" component={AdminEmailCampaignDetails} />
      <Route path="/admin/email-campaigns" component={AdminEmailCampaigns} />
      <Route path="/admin/email-reports" component={AdminEmailReports} />
      <Route path="/admin/email-unsubscribes" component={AdminEmailUnsubscribes} />
      <Route path="/admin/sms-notifications" component={AdminSmsNotifications} />
      <Route path="/admin/hormozi-emails" component={AdminHormoziEmails} />
      <Route path="/admin/hormozi-sms" component={AdminHormoziSms} />
      <Route path="/admin/donation-campaigns" component={AdminDonationCampaigns} />
      <Route path="/admin/campaigns/:id" component={CampaignDashboard} />
      <Route path="/my-campaigns" component={MemberCampaigns} />
      <Route path="/my-campaigns/:campaignId" component={MemberCampaignDashboard} />
      <Route path="/admin/tasks" component={AdminTasks} />
      <Route path="/admin/pipeline" component={AdminPipeline} />
      <Route path="/admin/lead-sourcing" component={AdminLeadSourcing} />
      <Route path="/admin/cac-ltgp" component={AdminCacLtgpDashboard} />
      <Route path="/admin/cohort-analysis" component={AdminCohortAnalysis} />
      <Route path="/admin/channel-management" component={AdminChannelManagement} />
      <Route path="/admin/donor-lifecycle" component={AdminDonorLifecycle} />
      <Route path="/admin/student-enrollments" component={AdminStudentEnrollments} />
      <Route path="/admin/volunteer-management" component={AdminVolunteerManagement} />
      <Route path="/admin/funnel-analytics" component={AdminFunnelAnalytics} />
      <Route path="/admin/segments" component={AdminSegments} />
      <Route path="/admin/automation-rules" component={AdminAutomationRules} />
      <Route path="/admin/automation-runs" component={AdminAutomationRuns} />
      <Route path="/admin/automation-config" component={AdminAutomationConfig} />
      <Route path="/admin/role-provisioning" component={AdminRoleProvisioning} />
      <Route path="/admin/preferences" component={AdminPreferences} />
      <Route path="/schedule" component={AppointmentScheduling} />
      <Route path="/product" component={ProductLanding} />
      <Route path="/kinflo" component={ProductLanding} />
      <Route path="/comparison" component={ImageComparison} />
      <Route path="/programs/tech-goes-home" component={TechGoesHomeLanding} />
      <Route path="/student/tech-goes-home" component={TechGoesHomeStudentDashboard} />
      <Route path="/volunteer" component={VolunteerEngagement} />
      <Route path="/unsubscribe" component={Unsubscribe} />
      <Route path="/sms-unsubscribe" component={SmsUnsubscribe} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PersonaProvider>
          <ImpersonationBanner />
          <Toaster />
          <PersonaSelectionModal />
          <ChatbotWidget />
          <Router />
        </PersonaProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
