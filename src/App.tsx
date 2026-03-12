import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Eager load critical pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Lazy load dashboard pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardUpload = lazy(() => import("./pages/DashboardUpload"));
const DashboardClips = lazy(() => import("./pages/DashboardClips"));
const DashboardEditor = lazy(() => import("./pages/DashboardEditor"));
const DashboardAnalytics = lazy(() => import("./pages/DashboardAnalytics"));
const DashboardCredits = lazy(() => import("./pages/DashboardCredits"));
const DashboardLibrary = lazy(() => import("./pages/DashboardLibrary"));
const DashboardBrandKit = lazy(() => import("./pages/DashboardBrandKit"));
const DashboardAdmin = lazy(() => import("./pages/DashboardAdmin"));
const DashboardImport = lazy(() => import("./pages/DashboardImport"));
const DashboardScriptGenerator = lazy(() => import("./pages/DashboardScriptGenerator"));
const DashboardTrends = lazy(() => import("./pages/DashboardTrends"));
const DashboardHooks = lazy(() => import("./pages/DashboardHooks"));
const DashboardNotifications = lazy(() => import("./pages/DashboardNotifications"));
const DashboardSettings = lazy(() => import("./pages/DashboardSettings"));
const DashboardSocialTools = lazy(() => import("./pages/DashboardSocialTools"));
const DashboardIdeas = lazy(() => import("./pages/DashboardIdeas"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const Demo = lazy(() => import("./pages/Demo"));
const Contact = lazy(() => import("./pages/Contact"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 size={28} className="animate-spin text-muted-foreground" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min cache
      gcTime: 1000 * 60 * 10, // 10 min garbage collection
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/upload" element={<ProtectedRoute><DashboardUpload /></ProtectedRoute>} />
            <Route path="/dashboard/import" element={<ProtectedRoute><DashboardImport /></ProtectedRoute>} />
            <Route path="/dashboard/clips" element={<ProtectedRoute><DashboardClips /></ProtectedRoute>} />
            <Route path="/dashboard/editor" element={<ProtectedRoute><DashboardEditor /></ProtectedRoute>} />
            <Route path="/dashboard/analytics" element={<ProtectedRoute><DashboardAnalytics /></ProtectedRoute>} />
            <Route path="/dashboard/credits" element={<ProtectedRoute><DashboardCredits /></ProtectedRoute>} />
            <Route path="/dashboard/library" element={<ProtectedRoute><DashboardLibrary /></ProtectedRoute>} />
            <Route path="/dashboard/brand-kit" element={<ProtectedRoute><DashboardBrandKit /></ProtectedRoute>} />
            <Route path="/dashboard/admin" element={<ProtectedRoute><DashboardAdmin /></ProtectedRoute>} />
            <Route path="/dashboard/script" element={<ProtectedRoute><DashboardScriptGenerator /></ProtectedRoute>} />
            <Route path="/dashboard/trends" element={<ProtectedRoute><DashboardTrends /></ProtectedRoute>} />
            <Route path="/dashboard/hooks" element={<ProtectedRoute><DashboardHooks /></ProtectedRoute>} />
            <Route path="/dashboard/transcripts" element={<ProtectedRoute><DashboardLibrary /></ProtectedRoute>} />
            <Route path="/dashboard/notifications" element={<ProtectedRoute><DashboardNotifications /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><DashboardSettings /></ProtectedRoute>} />
            <Route path="/dashboard/social-tools" element={<ProtectedRoute><DashboardSocialTools /></ProtectedRoute>} />
            <Route path="/dashboard/ideas" element={<ProtectedRoute><DashboardIdeas /></ProtectedRoute>} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
