import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { LogOut, User, Settings, Award, Recycle, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  return parts.map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    setLocation("/auth");
    toast({ title: "ออกจากระบบแล้ว", description: "ขอบคุณที่ใช้งาน S.T. ก้าวหน้า" });
  };

  if (!user) return null;

  const initials = getInitials(user.name);
  const hue = (user.studentId.charCodeAt(0) * 37) % 360;
  const avatarBg = `hsl(${hue}, 70%, 55%)`;

  const meritProgress = user.merits % 10;
  const trashProgress = user.trashPoints % 10;

  return (
    <div className="pb-24 pt-5 px-4">
      <div className="flex flex-col items-center mb-6 animate-fade-in-up">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-3 animate-bounce-in"
          style={{ background: `linear-gradient(135deg, ${avatarBg}, hsl(${hue + 30}, 70%, 45%))`, boxShadow: `0 4px 20px hsl(${hue}, 70%, 55%, 0.4)`, border: "4px solid white" }}
          data-testid="avatar-profile">
          {initials}
        </div>
        <h2 className="text-xl font-bold text-gray-800" data-testid="text-profile-name">{user.name}</h2>
        <p className="text-sm text-gray-500 mt-0.5">รหัส: {user.studentId}</p>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 animate-fade-in-up stagger-2" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          <div className="flex flex-col items-center gap-1.5 px-2 animate-pop-in stagger-1">
            <div className="w-9 h-9 rounded-full bg-yellow-50 flex items-center justify-center">
              <Award size={18} className="text-yellow-500" />
            </div>
            <p className="text-xl font-bold text-gray-800" data-testid="text-profile-merits">{user.merits}</p>
            <p className="text-[10px] text-gray-500">แต้มความดี</p>
          </div>
          <div className="flex flex-col items-center gap-1.5 px-2 animate-pop-in stagger-2">
            <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center">
              <Recycle size={18} className="text-green-500" />
            </div>
            <p className="text-xl font-bold text-gray-800" data-testid="text-profile-trash">{user.trashPoints}</p>
            <p className="text-[10px] text-gray-500">แต้มขยะ</p>
          </div>
          <div className="flex flex-col items-center gap-1.5 px-2 animate-pop-in stagger-3">
            <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center">
              <Star size={18} className="text-purple-500" />
            </div>
            <p className="text-xl font-bold text-gray-800" data-testid="text-profile-stamps">{user.stamps}</p>
            <p className="text-[10px] text-gray-500">แสตมป์</p>
          </div>
        </div>
        <p className="text-[10px] text-center text-gray-400 mt-3">ทุก 10 แต้มขยะ = 1 แสตมป์</p>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 animate-fade-in-up stagger-3" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <p className="text-xs font-semibold text-gray-600 mb-3">ความคืบหน้าสะสมแต้ม</p>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-gray-500 flex items-center gap-1"><Award size={12} className="text-yellow-500" /> ความดี</span>
              <span className="text-[11px] text-gray-400">{meritProgress}/10</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${(meritProgress / 10) * 100}%`, background: "linear-gradient(90deg, #FBBF24, #F59E0B)" }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-gray-500 flex items-center gap-1"><Recycle size={12} className="text-green-500" /> ขยะ</span>
              <span className="text-[11px] text-gray-400">{trashProgress}/10</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${(trashProgress / 10) * 100}%`, background: "linear-gradient(90deg, #22C55E, #16A34A)" }} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 mb-4 divide-y divide-gray-50 animate-fade-in-up stagger-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <button
          data-testid="button-edit-profile"
          className="w-full flex items-center gap-3 px-4 py-3.5 hover-elevate text-left card-interactive">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <User size={16} className="text-blue-500" />
          </div>
          <span className="flex-1 text-sm font-medium text-gray-700">แก้ไขข้อมูลส่วนตัว</span>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
        <button
          data-testid="button-settings"
          className="w-full flex items-center gap-3 px-4 py-3.5 hover-elevate text-left card-interactive">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
            <Settings size={16} className="text-gray-500" />
          </div>
          <span className="flex-1 text-sm font-medium text-gray-700">ตั้งค่าระบบ</span>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
      </div>

      <button
        data-testid="button-logout"
        onClick={handleLogout}
        className="w-full bg-red-50 border border-red-100 rounded-2xl py-3.5 flex items-center justify-center gap-2 text-red-500 font-semibold text-sm card-interactive hover-elevate animate-fade-in-up stagger-5">
        <LogOut size={16} />
        ออกจากระบบ
      </button>

      <p className="text-center text-xs text-gray-400 mt-6 animate-fade-in stagger-6">
        S.T. Digital System v1.0.0<br />
        พัฒนาโดยสภานักเรียนโรงเรียน
      </p>
    </div>
  );
}
