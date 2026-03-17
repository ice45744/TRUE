import { Switch, Route, useLocation, Redirect, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Home, ClipboardList, Megaphone, AlertTriangle, User, LayoutDashboard, Users, ShieldCheck, Clock, Settings, Gift, House } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SystemSettings } from "@shared/schema";
import { useState, useEffect } from "react";

function MaintenanceOverlay() {
  const { isAdmin } = useAuth();
  const [location, setLocation] = useLocation();
  const { data: settings } = useQuery<SystemSettings>({
    queryKey: ["/api/system/settings"],
    refetchInterval: 10000,
  });

  const [timeLeft, setTimeLeft] = useState<string>("");
  const [showAdminBox, setShowAdminBox] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [codeError, setCodeError] = useState(false);

  const ADMIN_CODE = "สภานักเรียนปี2569/1_2";

  const handleAdminCodeSubmit = () => {
    if (adminCode === ADMIN_CODE) {
      setShowAdminBox(false);
      setAdminCode("");
      setCodeError(false);
      setLocation("/auth");
    } else {
      setCodeError(true);
      setAdminCode("");
    }
  };

  useEffect(() => {
    if (!settings?.maintenanceUntil) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(settings.maintenanceUntil!).getTime();
      const distance = target - now;

      if (distance < 0) {
        setTimeLeft("");
        clearInterval(timer);
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [settings?.maintenanceUntil]);

  if (!settings || settings.maintenanceMode === 0 || isAdmin) return null;
  if (!settings.maintenanceUntil) return null;
  if (location === "/auth") return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="w-24 h-24 mb-6 rounded-full bg-red-50 flex items-center justify-center animate-pulse">
        <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center">
          <Settings className="text-white w-8 h-8 animate-spin-slow" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">ปิดปรับปรุงเซิร์ฟเวอร์</h1>
      <p className="text-gray-600 mb-8 max-w-xs mx-auto leading-relaxed">
        {settings.maintenanceMessage}
      </p>

      {timeLeft && (
        <div className="flex flex-col items-center gap-2 mb-8 bg-gray-50 p-6 rounded-3xl w-full max-w-[200px]">
          <Clock className="text-blue-600 w-5 h-5" />
          <span className="text-3xl font-mono font-bold text-gray-900 tracking-wider">
            {timeLeft}
          </span>
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Estimated Time Left</span>
        </div>
      )}

      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
        </div>
      </div>

      <a href="/auth" className="mt-10 text-xs text-gray-300 hover:text-gray-400 transition-colors underline underline-offset-2">
        สำหรับเจ้าหน้าที่เท่านั้น
      </a>
    </div>
  );
}

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
import AdminRewards from "@/pages/admin/AdminRewards";

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-md w-full text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">404 Page Not Found</h1>
        <p className="text-gray-600 mb-6">ขออภัย ไม่พบหน้าที่คุณกำลังมองหา</p>
        <Link href="/">
          <a className="inline-flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            กลับหน้าหลัก
          </a>
        </Link>
      </div>
    </div>
  );
}

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
          <Route path="/admin/rewards" component={() => <AdminRoute component={AdminRewards} />} />
          <Route component={NotFound} />
        </Switch>
        {user && !isAuth && !isAdminPage && <StudentBottomNav />}
        {user && isAdmin && isAdminPage && <AdminBottomNav />}
      </div>
    </div>
  );
}

function StudentBottomNav() {
  const [location] = useLocation();

  const tabs = [
    { href: "/", label: "หน้าหลัก", icon: Home },
    { href: "/activities", label: "กิจกรรม", icon: ClipboardList },
    { href: "/announcements", label: "ประกาศ", icon: Megaphone },
    { href: "/report", label: "แจ้งปัญหา", icon: AlertTriangle },
    { href: "/profile", label: "โปรไฟล์", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-50 safe-bottom animate-nav-slide"
      style={{ boxShadow: "0 -2px 16px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link key={href} href={href}
              data-testid={`nav-${label}`}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 flex-1 transition-colors duration-200 ${
                active ? "text-blue-600" : "text-gray-400"
              }`}>
              <div className={`transition-transform duration-200 ${active ? "scale-110 -translate-y-0.5" : ""}`}>
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span className="text-[10px] font-medium">{label}</span>
              <div className={`nav-dot ${active ? "nav-dot-active bg-blue-600" : ""}`} />
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
    { href: "/admin/rewards", label: "ของรางวัล", icon: Gift },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-50 safe-bottom animate-nav-slide"
      style={{ boxShadow: "0 -2px 16px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isExact = href === "/admin";
          const active = isExact ? location === href : location.startsWith(href);
          return (
            <Link key={href} href={href}
              data-testid={`admin-nav-${label}`}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 flex-1 transition-colors duration-200 ${
                active ? "text-indigo-600" : "text-gray-400"
              }`}>
              <div className={`transition-transform duration-200 ${active ? "scale-110 -translate-y-0.5" : ""}`}>
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span className="text-[10px] font-medium">{label}</span>
              <div className={`nav-dot ${active ? "nav-dot-active bg-indigo-600" : ""}`} />
            </Link>
          );
        })}
        <Link href="/"
          data-testid="admin-nav-exit"
          className="flex flex-col items-center gap-0.5 py-2 px-3 flex-1 transition-colors duration-200 text-rose-400 hover:text-rose-500">
          <div className="transition-transform duration-200">
            <House size={22} strokeWidth={1.8} />
          </div>
          <span className="text-[10px] font-medium">ออก Admin</span>
          <div className="nav-dot" />
        </Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <MaintenanceOverlay />
          <AppShell />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
