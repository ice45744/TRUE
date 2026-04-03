import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Bell, ChevronRight, ClipboardList, AlertTriangle, BookOpen, Award, Recycle, Star, Sparkles, ShieldCheck, X, Megaphone, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { Announcement, User as UserType } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";
import { th } from "date-fns/locale";
import { useState, useEffect } from "react";

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

function formatFullDate(date: string | Date) {
  try {
    return format(new Date(date), "d MMMM yyyy · HH:mm น.", { locale: th });
  } catch {
    return "";
  }
}

const URL_SPLIT_REGEX = /(https?:\/\/[^\s<>"']+)/g;
const URL_TEST_REGEX = /^https?:\/\/[^\s<>"']+$/;

function renderContent(text: string) {
  return text.split("\n").map((line, lineIdx) => {
    const parts = line.split(URL_SPLIT_REGEX);
    return (
      <span key={lineIdx}>
        {parts.map((part, i) =>
          URL_TEST_REGEX.test(part) ? (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-blue-500 underline underline-offset-2 break-all hover:text-blue-700 transition-colors inline-flex items-center gap-0.5">
              {part}
              <ExternalLink size={11} className="flex-shrink-0 ml-0.5" />
            </a>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
        {lineIdx < text.split("\n").length - 1 && <br />}
      </span>
    );
  });
}

const quickActions = [
  { label: "บันทึกกิจกรรม", icon: ClipboardList, href: "/activities", bg: "bg-blue-50", iconColor: "text-blue-500", border: "border border-blue-100" },
  { label: "แจ้งเรื่องร้องเรียน", icon: AlertTriangle, href: "/report", bg: "bg-orange-50", iconColor: "text-orange-500", border: "border border-orange-100" },
  { label: "สแกนเช็คชื่อ", icon: BookOpen, href: "/activities", bg: "bg-green-50", iconColor: "text-green-600", border: "border border-green-100" },
  { label: "ดูประกาศ", icon: Bell, href: "/announcements", bg: "bg-purple-50", iconColor: "text-purple-500", border: "border border-purple-100" },
];

function AnnouncementModal({ ann, onClose }: { ann: Announcement; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-scale-in"
        style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}
        onClick={e => e.stopPropagation()}>

        {ann.imageUrl && (
          <div className="relative flex-shrink-0">
            <img
              src={ann.imageUrl}
              alt={ann.title}
              className="w-full h-52 object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        )}

        <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
              <Megaphone size={15} className="text-orange-500" />
            </div>
            <span className="text-xs font-semibold text-orange-500 uppercase tracking-wide">ประกาศ</span>
          </div>
          <button
            data-testid="button-close-announcement-modal-home"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="px-5 pb-2 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900 leading-snug">{ann.title}</h2>
          <p className="text-xs text-gray-400 mt-1">{ann.authorName} · {formatFullDate(ann.createdAt)}</p>
        </div>

        <div className="px-5 pb-6 overflow-y-auto flex-1">
          <div className="w-full h-px bg-gray-100 mb-4" />
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
            {renderContent(ann.content)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null);

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
                <button
                  key={ann.id}
                  data-testid={`announcement-card-${ann.id}`}
                  onClick={() => setSelectedAnn(ann)}
                  className={`w-full text-left p-4 animate-fade-in-up stagger-${i + 1} hover:bg-gray-50 active:bg-gray-100 transition-colors`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 flex-shrink-0 flex items-center justify-center border border-orange-100 mt-0.5">
                      <Megaphone size={16} className="text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm leading-tight mb-0.5">{ann.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{ann.content}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-[11px] text-gray-400">{formatDate(ann.createdAt)}</p>
                        <span className="text-[11px] text-primary font-medium">อ่านเพิ่ม →</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedAnn && <AnnouncementModal ann={selectedAnn} onClose={() => setSelectedAnn(null)} />}

      <div className="px-4 mt-5 animate-fade-in-up stagger-4">
        <div className="grid grid-cols-2 responsive-grid-2 gap-3">
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
