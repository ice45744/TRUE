import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Bell, ChevronRight, ClipboardList, AlertTriangle, BookOpen, Award, Recycle, Star, Sparkles, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { Announcement, User as UserType } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  return parts.map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

function formatDate(date: string | Date) {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: th });
  } catch {
    return "";
  }
}

const quickActions = [
  { label: "บันทึกกิจกรรม", icon: ClipboardList, href: "/activities", bg: "bg-blue-50", iconColor: "text-blue-500", border: "border border-blue-100" },
  { label: "แจ้งเรื่องร้องเรียน", icon: AlertTriangle, href: "/report", bg: "bg-orange-50", iconColor: "text-orange-500", border: "border border-orange-100" },
  { label: "สแกนเช็คชื่อ", icon: BookOpen, href: "/activities", bg: "bg-green-50", iconColor: "text-green-600", border: "border border-green-100" },
  { label: "ดูประกาศ", icon: Bell, href: "/announcements", bg: "bg-purple-50", iconColor: "text-purple-500", border: "border border-purple-100" },
];

export default function HomePage() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const { data: liveUser } = useQuery<Omit<UserType, "password">>({
    queryKey: ["/api/users", user?.id],
    enabled: !!user?.id,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  const displayed = liveUser ?? user;

  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const recent = announcements?.slice(0, 2) ?? [];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "สวัสดีตอนเช้า";
    if (h < 17) return "สวัสดีตอนบ่าย";
    return "สวัสดีตอนเย็น";
  };

  return (
    <div className="pb-20">
      <div className="relative overflow-hidden rounded-b-[2rem] animate-fade-in"
        style={{ background: "linear-gradient(135deg, #4F8EF7 0%, #1D4ED8 100%)" }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: "white", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10"
          style={{ background: "white", transform: "translate(-30%, 40%)" }} />
        <div className="absolute top-6 right-6 animate-float">
          <Sparkles size={20} className="text-white/20" />
        </div>
        <div className="relative px-5 pt-12 pb-8 flex items-start justify-between">
          <div className="animate-fade-in-up">
            <p className="text-blue-100 text-sm font-medium mb-1">{greeting()} 👋</p>
            <h2 className="text-white text-xl font-bold leading-tight" data-testid="text-username">{displayed?.name}</h2>
            <p className="text-blue-200 text-sm mt-1">รหัสนักเรียน: {displayed?.studentId}</p>
          </div>
          <Link href="/profile">
            <div className="w-12 h-12 rounded-full border-2 border-white/60 animate-bounce-in stagger-2 overflow-hidden flex-shrink-0 cursor-pointer">
              {displayed?.avatarUrl ? (
                <img src={displayed.avatarUrl} alt={displayed.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/20 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{getInitials(displayed?.name ?? "")}</span>
                </div>
              )}
            </div>
          </Link>
        </div>

        <div className="relative px-5 pb-6 animate-fade-in-up stagger-2">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 flex items-center justify-around">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <Award size={14} className="text-yellow-300" />
                <span className="text-white font-bold text-lg" data-testid="stat-home-merits">{displayed?.merits ?? 0}</span>
              </div>
              <span className="text-blue-200 text-[10px]">ความดี</span>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <Recycle size={14} className="text-green-300" />
                <span className="text-white font-bold text-lg" data-testid="stat-home-trash">{displayed?.trashPoints ?? 0}</span>
              </div>
              <span className="text-blue-200 text-[10px]">แต้มขยะ</span>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <Star size={14} className="text-purple-300" />
                <span className="text-white font-bold text-lg" data-testid="stat-home-stamps">{displayed?.stamps ?? 0}</span>
              </div>
              <span className="text-blue-200 text-[10px]">แสตมป์</span>
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="px-4 mt-5 animate-fade-in-up stagger-2">
          <Link href="/admin">
            <div className="rounded-2xl p-4 flex items-center gap-4 cursor-pointer card-interactive"
              style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)", boxShadow: "0 4px 16px rgba(79,70,229,0.35)" }}>
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={22} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">แผงควบคุม Admin</p>
                <p className="text-indigo-200 text-xs mt-0.5">จัดการนักเรียน กิจกรรม และของรางวัล</p>
              </div>
              <ChevronRight size={18} className="text-white/70" />
            </div>
          </Link>
        </div>
      )}

      <div className="px-4 mt-5 animate-fade-in-up stagger-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-primary" />
            <h3 className="font-bold text-gray-800 text-base">ประกาศจากสภานักเรียน</h3>
          </div>
          <Link href="/announcements" className="text-xs text-primary font-semibold flex items-center gap-0.5">
            ดูทั้งหมด <ChevronRight size={14} />
          </Link>
        </div>

        <div className="bg-white rounded-2xl" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          {isLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ) : recent.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              ยังไม่มีประกาศใหม่
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.map((ann, i) => (
                <div key={ann.id} className={`p-4 animate-fade-in-up stagger-${i + 1}`}>
                  <p className="font-semibold text-gray-800 text-sm leading-tight mb-1">{ann.title}</p>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">{ann.content}</p>
                  <p className="text-[11px] text-gray-400">{formatDate(ann.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mt-5 animate-fade-in-up stagger-4">
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(({ label, icon: Icon, href, bg, iconColor, border }, i) => (
            <Link key={label} href={href}>
              <div className={`${bg} ${border} rounded-2xl p-4 flex flex-col gap-3 cursor-pointer card-interactive hover-elevate animate-fade-in-up stagger-${i + 1}`}>
                <Icon size={26} className={`${iconColor} transition-transform`} />
                <p className="text-sm font-semibold text-gray-700 leading-tight">{label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
