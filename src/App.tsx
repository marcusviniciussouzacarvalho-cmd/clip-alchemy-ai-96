import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/ProtectedRoute";
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
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/upload" element={<ProtectedRoute><DashboardUpload /></ProtectedRoute>} />
          <Route path="/dashboard/clips" element={<ProtectedRoute><DashboardClips /></ProtectedRoute>} />
          <Route path="/dashboard/editor" element={<ProtectedRoute><DashboardEditor /></ProtectedRoute>} />
          <Route path="/dashboard/analytics" element={<ProtectedRoute><DashboardAnalytics /></ProtectedRoute>} />
          <Route path="/dashboard/credits" element={<ProtectedRoute><DashboardCredits /></ProtectedRoute>} />
          <Route path="/dashboard/library" element={<ProtectedRoute><DashboardLibrary /></ProtectedRoute>} />
          <Route path="/dashboard/brand-kit" element={<ProtectedRoute><DashboardBrandKit /></ProtectedRoute>} />
          <Route path="/dashboard/admin" element={<ProtectedRoute><DashboardAdmin /></ProtectedRoute>} />
          <Route path="/dashboard/transcripts" element={<ProtectedRoute><DashboardLibrary /></ProtectedRoute>} />
          <Route path="/dashboard/settings" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
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
