import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import DashboardUpload from "./pages/DashboardUpload";
import DashboardClips from "./pages/DashboardClips";
import DashboardEditor from "./pages/DashboardEditor";
import DashboardAnalytics from "./pages/DashboardAnalytics";
import DashboardCredits from "./pages/DashboardCredits";
import DashboardLibrary from "./pages/DashboardLibrary";
import DashboardBrandKit from "./pages/DashboardBrandKit";
import DashboardAdmin from "./pages/DashboardAdmin";
import PricingPage from "./pages/PricingPage";
import Demo from "./pages/Demo";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/upload" element={<DashboardUpload />} />
          <Route path="/dashboard/clips" element={<DashboardClips />} />
          <Route path="/dashboard/editor" element={<DashboardEditor />} />
          <Route path="/dashboard/analytics" element={<DashboardAnalytics />} />
          <Route path="/dashboard/credits" element={<DashboardCredits />} />
          <Route path="/dashboard/library" element={<DashboardLibrary />} />
          <Route path="/dashboard/brand-kit" element={<DashboardBrandKit />} />
          <Route path="/dashboard/admin" element={<DashboardAdmin />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
