import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LogOut, User, Settings, Award, Recycle, ChevronRight, Star, Camera, Pencil, X, Check, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

const IMGBB_KEY = "baf409d03cf4975986f6d44b5a1a2919";

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  return parts.map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

async function uploadToImgBB(file: File): Promise<string> {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: "POST", body: form });
  const data = await res.json();
  if (!data.success) throw new Error("อัปโหลดรูปไม่สำเร็จ");
  return data.data.url as string;
}

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: liveUser } = useQuery<Omit<UserType, "password">>({
    queryKey: ["/api/users", user?.id],
    enabled: !!user?.id,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  const displayed = liveUser ?? user;

  const updateMutation = useMutation({
    mutationFn: async (body: { name?: string; avatarUrl?: string | null }) => {
      const res = await apiRequest("PATCH", `/api/users/${user!.id}`, body);
      return res.json();
    },
    onSuccess: (updated) => {
      updateUser({ ...user!, ...updated });
      toast({ title: "บันทึกเรียบร้อย" });
      setEditOpen(false);
    },
    onError: () => {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถบันทึกได้", variant: "destructive" });
    },
  });

  const handleLogout = () => {
    logout();
    setLocation("/auth");
    toast({ title: "ออกจากระบบแล้ว", description: "ขอบคุณที่ใช้งาน S.T. ก้าวหน้า" });
  };

  const handleOpenEdit = () => {
    setEditName(displayed?.name ?? "");
    setEditOpen(true);
  };

  const handleSaveName = () => {
    if (!editName.trim()) return;
    updateMutation.mutate({ name: editName.trim() });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToImgBB(file);
      updateMutation.mutate({ avatarUrl: url });
    } catch {
      toast({ title: "อัปโหลดรูปไม่สำเร็จ", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!displayed) return null;

  const initials = getInitials(displayed.name);
  const hue = (displayed.studentId.charCodeAt(0) * 37) % 360;
  const avatarBg = `hsl(${hue}, 70%, 55%)`;

  const merits = liveUser?.merits ?? displayed.merits;
  const trashPoints = liveUser?.trashPoints ?? displayed.trashPoints;
  const stamps = liveUser?.stamps ?? displayed.stamps;

  const meritProgress = merits % 10;
  const trashRemainder = stamps % 10;
  const trashProgress = trashRemainder === 0 && stamps > 0 ? 10 : trashRemainder;

  return (
    <div className="pb-24 pt-5 px-4">
      <div className="flex flex-col items-center mb-6 animate-fade-in-up">
        <div className="relative mb-3">
          {displayed.avatarUrl ? (
            <img
              src={displayed.avatarUrl}
              alt={displayed.name}
              className="w-24 h-24 rounded-full object-cover animate-bounce-in"
              style={{ border: "4px solid white", boxShadow: `0 4px 20px hsl(${hue}, 70%, 55%, 0.4)` }}
              data-testid="avatar-profile"
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold animate-bounce-in"
              style={{ background: `linear-gradient(135deg, ${avatarBg}, hsl(${hue + 30}, 70%, 45%))`, boxShadow: `0 4px 20px hsl(${hue}, 70%, 55%, 0.4)`, border: "4px solid white" }}
              data-testid="avatar-profile">
              {initials}
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            data-testid="button-change-avatar"
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg border-2 border-white">
            {uploading ? <Loader2 size={14} className="text-white animate-spin" /> : <Camera size={14} className="text-white" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <h2 className="text-xl font-bold text-gray-800" data-testid="text-profile-name">{displayed.name}</h2>
        <p className="text-sm text-gray-500 mt-0.5">รหัส: {displayed.studentId}</p>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 animate-fade-in-up stagger-2" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          <div className="flex flex-col items-center gap-1.5 px-2 animate-pop-in stagger-1">
            <div className="w-9 h-9 rounded-full bg-yellow-50 flex items-center justify-center">
              <Award size={18} className="text-yellow-500" />
            </div>
            <p className="text-xl font-bold text-gray-800" data-testid="text-profile-merits">{merits}</p>
            <p className="text-[10px] text-gray-500">แต้มความดี</p>
          </div>
          <div className="flex flex-col items-center gap-1.5 px-2 animate-pop-in stagger-2">
            <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center">
              <Recycle size={18} className="text-green-500" />
            </div>
            <p className="text-xl font-bold text-gray-800" data-testid="text-profile-trash">{trashPoints}</p>
            <p className="text-[10px] text-gray-500">แต้มขยะ</p>
          </div>
          <div className="flex flex-col items-center gap-1.5 px-2 animate-pop-in stagger-3">
            <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center">
              <Star size={18} className="text-purple-500" />
            </div>
            <p className="text-xl font-bold text-gray-800" data-testid="text-profile-stamps">{stamps}</p>
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
              <span className="text-[11px] text-gray-500 flex items-center gap-1"><Recycle size={12} className="text-green-500" /> แสตมป์ขยะ</span>
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
          onClick={handleOpenEdit}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover-elevate text-left card-interactive">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <User size={16} className="text-blue-500" />
          </div>
          <span className="flex-1 text-sm font-medium text-gray-700">แก้ไขข้อมูลส่วนตัว</span>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
        <button
          data-testid="button-manual"
          onClick={() => setLocation("/manual")}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover-elevate text-left card-interactive">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
            <BookOpen size={16} className="text-indigo-500" />
          </div>
          <span className="flex-1 text-sm font-medium text-gray-700">คู่มือการใช้งาน</span>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
        <button
          data-testid="button-settings"
          onClick={() => toast({ title: "🚧 เร็วๆ นี้", description: "ฟีเจอร์ตั้งค่าระบบกำลังพัฒนา รอติดตามการอัพเดทได้เลย!" })}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover-elevate text-left card-interactive">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
            <Settings size={16} className="text-gray-500" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-700">ตั้งค่าระบบ</span>
            <span className="ml-2 text-[10px] bg-gray-100 text-gray-400 rounded-full px-2 py-0.5 font-medium">เร็วๆ นี้</span>
          </div>
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

      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => setEditOpen(false)}>
          <div
            className="bg-white rounded-3xl w-full max-w-sm p-6"
            style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.22)" }}
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Pencil size={16} className="text-primary" /> แก้ไขข้อมูลส่วนตัว
              </h3>
              <button
                onClick={() => setEditOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            <div className="flex flex-col items-center mb-5">
              <div className="relative mb-2">
                {displayed.avatarUrl ? (
                  <img src={displayed.avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
                ) : (
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-md"
                    style={{ background: `linear-gradient(135deg, ${avatarBg}, hsl(${hue + 30}, 70%, 45%))` }}>
                    {initials}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow border-2 border-white">
                  {uploading ? <Loader2 size={12} className="text-white animate-spin" /> : <Camera size={12} className="text-white" />}
                </button>
              </div>
              <p className="text-xs text-gray-400">แตะกล้องเพื่อเปลี่ยนรูปโปรไฟล์</p>
            </div>

            <label className="block text-xs font-semibold text-gray-600 mb-1.5">ชื่อ-นามสกุล</label>
            <input
              data-testid="input-edit-name"
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSaveName()}
              placeholder="กรอกชื่อของคุณ"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
            />

            <Button
              data-testid="button-save-name"
              onClick={handleSaveName}
              disabled={updateMutation.isPending || !editName.trim()}
              className="w-full rounded-xl py-3 flex items-center justify-center gap-2">
              {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              บันทึก
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
