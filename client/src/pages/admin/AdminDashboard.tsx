import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, ClipboardList, Megaphone, AlertTriangle, Award, Clock, ChevronRight, LayoutDashboard, LogOut, QrCode, Star, Settings, ShieldOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SystemSettings } from "@shared/schema";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

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
  const { toast } = useToast();
  const [mUntil, setMUntil] = useState("");
  const [mMessage, setMMessage] = useState("");

  const { data: settings } = useQuery<SystemSettings>({
    queryKey: ["/api/system/settings"],
  });

  useEffect(() => {
    if (settings) {
      setMMessage(settings.maintenanceMessage);
      if (settings.maintenanceUntil) {
        try {
          const date = new Date(settings.maintenanceUntil);
          const formatted = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          setMUntil(formatted);
        } catch (e) {
          console.error("Invalid date from settings", e);
        }
      }
    }
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: async (vars: Partial<SystemSettings>) => {
      // Create a clean object with only necessary fields
      const payload: any = {};
      if (vars.maintenanceMode !== undefined) payload.maintenanceMode = vars.maintenanceMode;
      if (vars.maintenanceMessage !== undefined) payload.maintenanceMessage = vars.maintenanceMessage;
      if (vars.maintenanceUntil !== undefined) payload.maintenanceUntil = vars.maintenanceUntil;

      console.log("Mutation: Sending payload:", payload);
      const res = await apiRequest("PATCH", "/api/system/settings", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/settings"] });
      toast({ title: "อัปเดตการตั้งค่าสำเร็จ" });
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      let errorMsg = error.message;
      if (errorMsg.includes("401") || errorMsg.includes("403")) {
        errorMsg = "เซสชันหมดอายุหรือไม่มีสิทธิ์แอดมิน กรุณาเข้าสู่ระบบใหม่";
      }
      toast({ 
        title: "อัปเดตการตั้งค่าไม่สำเร็จ", 
        description: errorMsg, 
        variant: "destructive" 
      });
    },
  });

  const toggleMaintenance = (checked: boolean) => {
    if (checked && !mUntil) {
      toast({
        title: "ต้องตั้งเวลาก่อน",
        description: "กรุณากรอกวันและเวลาที่คาดว่าจะเสร็จก่อนเปิดโหมดปรับปรุง",
        variant: "destructive"
      });
      return;
    }
    const newMode = checked ? 1 : 0;
    updateSettings.mutate({ 
      maintenanceMode: newMode,
      maintenanceMessage: mMessage || undefined,
      maintenanceUntil: checked && mUntil ? mUntil : null
    } as any);
  };

  const handleSaveSettings = () => {
    updateSettings.mutate({
      maintenanceMessage: mMessage,
      maintenanceUntil: mUntil ? mUntil : null
    } as any);
  };

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

      {settings?.maintenanceMode === 1 && (
        <div className="bg-red-500 rounded-2xl p-4 mb-5 animate-bounce-in" style={{ boxShadow: "0 4px 20px rgba(239,68,68,0.4)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <ShieldOff size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">โหมดปรับปรุงเปิดอยู่!</p>
                <p className="text-red-100 text-xs">นักเรียนเข้าระบบไม่ได้ในขณะนี้</p>
              </div>
            </div>
            <button
              data-testid="button-emergency-maintenance-off"
              onClick={() => updateSettings.mutate({ maintenanceMode: 0, maintenanceUntil: null } as any)}
              disabled={updateSettings.isPending}
              className="bg-white text-red-500 font-bold text-xs px-4 py-2 rounded-xl flex-shrink-0 active:scale-95 transition-transform">
              {updateSettings.isPending ? "..." : "ปิดทันที"}
            </button>
          </div>
        </div>
      )}

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

      {/* Maintenance Section */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-5 animate-fade-in-up stagger-2" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
              <Settings className="text-orange-600 w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">โหมดปิดปรับปรุง</h3>
              <p className="text-[10px] text-gray-400">จัดการการเข้าถึงเว็บไซต์</p>
            </div>
          </div>
          <Switch 
            data-testid="switch-maintenance"
            checked={settings?.maintenanceMode === 1}
            onCheckedChange={toggleMaintenance}
            disabled={updateSettings.isPending || !settings}
          />
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
              ข้อความแจ้งเตือน
            </label>
            <Input 
              value={mMessage}
              onChange={(e) => setMMessage(e.target.value)}
              placeholder="กรุณารอสักครู่ขณะนี้เซิร์ฟเวอร์เว็บไซต์กำลังปรับปรุง"
              className="bg-gray-50 border-none rounded-xl text-sm h-9 mb-2"
            />
          </div>
          <div>
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
              เวลาที่คาดว่าจะเสร็จ (จำเป็นต้องกรอกก่อนเปิด)
            </label>
            <div className="flex gap-2">
              <Input 
                type="datetime-local"
                value={mUntil}
                onChange={(e) => setMUntil(e.target.value)}
                className="bg-gray-50 border-none rounded-xl text-sm h-9 flex-1"
              />
            </div>
          </div>
          <Button 
            size="sm"
            onClick={handleSaveSettings}
            disabled={updateSettings.isPending || !settings}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 h-9 text-xs"
          >
            {updateSettings.isPending ? "กำลังบันทึก..." : "บันทึกข้อความและเวลา"}
          </Button>
        </div>
      </div>

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
