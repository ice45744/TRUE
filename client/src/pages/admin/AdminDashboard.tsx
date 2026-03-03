import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, ClipboardList, Megaphone, AlertTriangle, Award, Recycle, Clock, ChevronRight, LayoutDashboard, LogOut, QrCode, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

interface Stats {
  totalStudents: number;
  totalActivities: number;
  pendingActivities: number;
  totalReports: number;
  pendingReports: number;
  totalAnnouncements: number;
  totalMerits: number;
  totalStamps: number;
}

const menuItems = [
  { label: "จัดการนักเรียน", href: "/admin/users", icon: Users, bg: "bg-blue-50", iconColor: "text-blue-500", border: "border-blue-100" },
  { label: "อนุมัติกิจกรรม", href: "/admin/activities", icon: ClipboardList, bg: "bg-green-50", iconColor: "text-green-500", border: "border-green-100" },
  { label: "จัดการประกาศ", href: "/admin/announcements", icon: Megaphone, bg: "bg-orange-50", iconColor: "text-orange-500", border: "border-orange-100" },
  { label: "ดูรายงานปัญหา", href: "/admin/reports", icon: AlertTriangle, bg: "bg-red-50", iconColor: "text-red-500", border: "border-red-100" },
  { label: "สร้าง QR Code", href: "/admin/qr", icon: QrCode, bg: "bg-purple-50", iconColor: "text-purple-500", border: "border-purple-100" },
];

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/admin/stats"],
  });
  const { user, logout } = useAuth();

  return (
    <div className="pb-24 pt-5 px-4">
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center border border-indigo-200">
            <LayoutDashboard size={20} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">แผงควบคุม</h1>
            <p className="text-xs text-gray-400">{user?.name ?? "Admin"}</p>
          </div>
        </div>
        <button
          data-testid="button-admin-logout"
          onClick={logout}
          className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center border border-red-100 text-red-400 card-interactive">
          <LogOut size={16} />
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[1,2,3,4].map(i => <Skeleton key={i} className={`h-24 rounded-2xl animate-fade-in stagger-${i}`} />)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 card-interactive animate-fade-in-up stagger-1" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <Users size={20} className="text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-gray-800" data-testid="stat-students">{stats.totalStudents}</p>
            <p className="text-xs text-gray-500">นักเรียนทั้งหมด</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 card-interactive animate-fade-in-up stagger-2" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <Clock size={20} className="text-amber-500 mb-2" />
            <p className="text-2xl font-bold text-gray-800" data-testid="stat-pending">{stats.pendingActivities}</p>
            <p className="text-xs text-gray-500">รอนุมัติกิจกรรม</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 card-interactive animate-fade-in-up stagger-3" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <AlertTriangle size={20} className="text-red-500 mb-2" />
            <p className="text-2xl font-bold text-gray-800" data-testid="stat-reports">{stats.pendingReports}</p>
            <p className="text-xs text-gray-500">รายงานรอดำเนินการ</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 card-interactive animate-fade-in-up stagger-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <Megaphone size={20} className="text-orange-500 mb-2" />
            <p className="text-2xl font-bold text-gray-800" data-testid="stat-announcements">{stats.totalAnnouncements}</p>
            <p className="text-xs text-gray-500">ประกาศทั้งหมด</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 mb-5 divide-y divide-gray-50 animate-fade-in-up stagger-3" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ภาพรวมคะแนน</p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-gray-50 px-4 py-3">
          <div className="flex items-center gap-3 pr-4">
            <Award size={20} className="text-yellow-500" />
            <div>
              <p className="text-lg font-bold text-gray-800">{stats?.totalMerits ?? 0}</p>
              <p className="text-xs text-gray-500">แต้มความดีรวม</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pl-4">
            <Star size={20} className="text-purple-500" />
            <div>
              <p className="text-lg font-bold text-gray-800">{stats?.totalStamps ?? 0}</p>
              <p className="text-xs text-gray-500">แสตมป์รวม</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {menuItems.map(({ label, href, icon: Icon, bg, iconColor, border }, i) => (
          <Link key={href} href={href}>
            <div className={`bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 border border-gray-100 cursor-pointer card-interactive hover-elevate animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}
              style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center border ${border}`}>
                <Icon size={16} className={iconColor} />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-700">{label}</span>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
