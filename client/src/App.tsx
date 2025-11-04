import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PersonaProvider } from "@/contexts/PersonaContext";
import PersonaSelectionModal from "@/components/PersonaSelectionModal";
import Home from "@/pages/Home";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminImages from "@/pages/AdminImages";
import AdminContentManager from "@/pages/AdminContentManager";
import ImageComparison from "@/pages/ImageComparison";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/images" component={AdminImages} />
      <Route path="/admin/content" component={AdminContentManager} />
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
