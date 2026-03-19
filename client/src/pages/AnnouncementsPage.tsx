import { useQuery } from "@tanstack/react-query";
import { Megaphone, X, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Announcement } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";
import { th } from "date-fns/locale";
import { useState, useEffect } from "react";

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
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
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
            data-testid="button-close-announcement-modal"
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

function AnnouncementCard({ ann, index, onClick }: { ann: Announcement; index: number; onClick: () => void }) {
  return (
    <div
      data-testid={`card-announcement-${ann.id}`}
      className={`bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer card-interactive hover-elevate animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
      onClick={onClick}>
      {ann.imageUrl && (
        <img
          src={ann.imageUrl}
          alt={ann.title}
          className="w-full h-36 object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex-shrink-0 flex items-center justify-center border border-orange-100 mt-0.5">
            <Megaphone size={16} className="text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 text-sm leading-snug line-clamp-2">{ann.title}</p>
            <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{ann.content}</p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[11px] text-gray-400">{ann.authorName} · {formatDate(ann.createdAt)}</p>
              <span className="text-[11px] text-orange-500 font-semibold">อ่านเพิ่ม →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const [selected, setSelected] = useState<Announcement | null>(null);

  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  return (
    <div className="pb-24 pt-5 px-4">
      {selected && (
        <AnnouncementModal ann={selected} onClose={() => setSelected(null)} />
      )}

      <div className="flex items-center gap-3 mb-5 animate-fade-in-up">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
          <Megaphone size={20} className="text-orange-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">ประกาศจากสภานักเรียน</h1>
          {!isLoading && <p className="text-xs text-gray-400 mt-0.5">{announcements?.length ?? 0} ประกาศ</p>}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className={`bg-white rounded-2xl p-4 flex gap-3 animate-fade-in stagger-${i}`}>
              <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : announcements?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-4 animate-float">
            <Megaphone size={28} className="text-orange-300" />
          </div>
          <p className="text-gray-500 font-medium">ยังไม่มีประกาศ</p>
          <p className="text-gray-400 text-sm mt-1">ติดตามประกาศใหม่ๆ ได้ที่นี่</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements?.map((ann, i) => (
            <AnnouncementCard
              key={ann.id}
              ann={ann}
              index={i}
              onClick={() => setSelected(ann)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
