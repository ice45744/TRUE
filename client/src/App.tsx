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
import QrGeneratorPage from "@/pages/QrGeneratorPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminActivities from "@/pages/admin/AdminActivities";
import AdminAnnouncements from "@/pages/admin/AdminAnnouncements";
import AdminReports from "@/pages/admin/AdminReports";

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

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading, isAdmin } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg, #EEF3FB 0%, #E8EFFA 50%, #DDE9F8 100%)" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl animate-pulse" style={{ background: "linear-gradient(135deg, #4F8EF7 0%, #2563EB 100%)" }} />
        <p className="text-gray-400 text-sm">กำลังโหลด...</p>
      </div>
    </div>
  );
  if (!user) return <Redirect to="/auth" />;
  if (!isAdmin) return <Redirect to="/" />;
  return <Component />;
}

function AppShell() {
  const { user, isAdmin } = useAuth();
  const [location] = useLocation();
  const isAuth = location === "/auth";
  const isAdminPage = location.startsWith("/admin");

  return (
    <div className="min-h-screen" style={{ background: "#F0F4FA", fontFamily: "'Sarabun', 'Inter', sans-serif" }}>
      <div className="max-w-lg mx-auto relative min-h-screen bg-transparent">
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <Route path="/" component={() => {
            if (user?.role === "admin") return <Redirect to="/admin" />;
            return <ProtectedRoute component={HomePage} />;
          }} />
          <Route path="/activities" component={() => <ProtectedRoute component={ActivitiesPage} />} />
          <Route path="/announcements" component={() => <ProtectedRoute component={AnnouncementsPage} />} />
          <Route path="/report" component={() => <ProtectedRoute component={ReportPage} />} />
          <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
          <Route path="/qr-generator" component={() => <ProtectedRoute component={QrGeneratorPage} />} />
          <Route path="/admin" component={() => <AdminRoute component={AdminDashboard} />} />
          <Route path="/admin/users" component={() => <AdminRoute component={AdminUsers} />} />
          <Route path="/admin/activities" component={() => <AdminRoute component={AdminActivities} />} />
          <Route path="/admin/announcements" component={() => <AdminRoute component={AdminAnnouncements} />} />
          <Route path="/admin/reports" component={() => <AdminRoute component={AdminReports} />} />
          <Route component={NotFound} />
        </Switch>
        {user && !isAuth && !isAdminPage && !isAdmin && <BottomNav />}
        {user && isAdmin && isAdminPage && <AdminBottomNav />}
      </div>
    </div>
  );
}

function AdminBottomNav() {
  const [location] = useLocation();
  const { logout } = useAuth();

  const tabs = [
    { href: "/admin", label: "แดชบอร์ด", icon: "LayoutDashboard" },
    { href: "/admin/users", label: "นักเรียน", icon: "Users" },
    { href: "/admin/activities", label: "กิจกรรม", icon: "ClipboardList" },
    { href: "/admin/announcements", label: "ประกาศ", icon: "Megaphone" },
    { href: "/admin/reports", label: "รายงาน", icon: "AlertTriangle" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50"
      style={{ boxShadow: "0 -2px 16px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map(({ href, label }) => {
          const active = href === "/admin" ? location === "/admin" : location.startsWith(href);
          return (
            <a key={href} href={href}
              data-testid={`admin-nav-${label}`}
              className={`flex flex-col items-center gap-0.5 py-2 px-2 flex-1 transition-colors text-center ${
                active ? "text-indigo-600" : "text-gray-400"
              }`}>
              <span className="text-[10px] font-medium leading-tight">{label}</span>
            </a>
          );
        })}
      </div>
    </nav>
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
