import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/BottomNav";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/AuthPage";
import HomePage from "@/pages/HomePage";
import ActivitiesPage from "@/pages/ActivitiesPage";
import AnnouncementsPage from "@/pages/AnnouncementsPage";
import ReportPage from "@/pages/ReportPage";
import ProfilePage from "@/pages/ProfilePage";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg, #EEF3FB 0%, #E8EFFA 50%, #DDE9F8 100%)" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl animate-pulse" style={{ background: "linear-gradient(135deg, #4F8EF7 0%, #2563EB 100%)" }} />
        <p className="text-gray-400 text-sm">กำลังโหลด...</p>
      </div>
    </div>
  );
  if (!user) return <Redirect to="/auth" />;
  return <Component />;
}

function AppShell() {
  const { user } = useAuth();
  const [location] = useLocation();
  const isAuth = location === "/auth";

  return (
    <div className="min-h-screen" style={{ background: "#F0F4FA", fontFamily: "'Sarabun', 'Inter', sans-serif" }}>
      <div className="max-w-lg mx-auto relative min-h-screen bg-transparent">
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <Route path="/" component={() => <ProtectedRoute component={HomePage} />} />
          <Route path="/activities" component={() => <ProtectedRoute component={ActivitiesPage} />} />
          <Route path="/announcements" component={() => <ProtectedRoute component={AnnouncementsPage} />} />
          <Route path="/report" component={() => <ProtectedRoute component={ReportPage} />} />
          <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
          <Route component={NotFound} />
        </Switch>
        {user && !isAuth && <BottomNav />}
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppShell />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
