import { Switch, Route, useLocation, Redirect, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Home, ClipboardList, Megaphone, AlertTriangle, User, LayoutDashboard, Users, ShieldCheck } from "lucide-react";
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
          <Route path="/" component={() => <ProtectedRoute component={HomePage} />} />
          <Route path="/activities" component={() => <ProtectedRoute component={ActivitiesPage} />} />
          <Route path="/announcements" component={() => <ProtectedRoute component={AnnouncementsPage} />} />
          <Route path="/report" component={() => <ProtectedRoute component={ReportPage} />} />
          <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
          <Route path="/admin" component={() => <AdminRoute component={AdminDashboard} />} />
          <Route path="/admin/users" component={() => <AdminRoute component={AdminUsers} />} />
          <Route path="/admin/activities" component={() => <AdminRoute component={AdminActivities} />} />
          <Route path="/admin/announcements" component={() => <AdminRoute component={AdminAnnouncements} />} />
          <Route path="/admin/reports" component={() => <AdminRoute component={AdminReports} />} />
          <Route path="/admin/qr" component={() => <AdminRoute component={QrGeneratorPage} />} />
          <Route component={NotFound} />
        </Switch>
        {user && !isAuth && !isAdminPage && <StudentBottomNav />}
        {user && isAdmin && isAdminPage && <AdminBottomNav />}
      </div>
    </div>
  );
}

function StudentBottomNav() {
  const { isAdmin } = useAuth();
  const [location] = useLocation();

  const tabs = [
    { href: "/", label: "หน้าหลัก", icon: Home },
    { href: "/activities", label: "กิจกรรม", icon: ClipboardList },
    { href: "/announcements", label: "ประกาศ", icon: Megaphone },
    { href: "/report", label: "แจ้งปัญหา", icon: AlertTriangle },
    ...(isAdmin
      ? [{ href: "/admin", label: "แอดมิน", icon: ShieldCheck }]
      : [{ href: "/profile", label: "โปรไฟล์", icon: User }]
    ),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-bottom"
      style={{ boxShadow: "0 -2px 16px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link key={href} href={href}
              data-testid={`nav-${label}`}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 flex-1 transition-colors ${
                active ? "text-blue-600" : "text-gray-400"
              }`}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function AdminBottomNav() {
  const [location] = useLocation();

  const tabs = [
    { href: "/admin", label: "แดชบอร์ด", icon: LayoutDashboard },
    { href: "/admin/users", label: "นักเรียน", icon: Users },
    { href: "/admin/activities", label: "กิจกรรม", icon: ClipboardList },
    { href: "/admin/announcements", label: "ประกาศ", icon: Megaphone },
    { href: "/", label: "แอป", icon: Home },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-bottom"
      style={{ boxShadow: "0 -2px 16px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isExact = href === "/admin" || href === "/";
          const active = isExact ? location === href : location.startsWith(href);
          return (
            <Link key={href} href={href}
              data-testid={`admin-nav-${label}`}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 flex-1 transition-colors ${
                active ? "text-indigo-600" : "text-gray-400"
              }`}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
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
