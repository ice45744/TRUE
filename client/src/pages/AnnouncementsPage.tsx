import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Announcement } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { useState } from "react";

function formatDate(date: string | Date) {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: th });
  } catch {
    return "";
  }
}

function AnnouncementCard({ ann, index }: { ann: Announcement; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedImage, setExpandedImage] = useState(false);
  return (
    <>
      {expandedImage && ann.imageUrl && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(false)}>
          <img src={ann.imageUrl} alt={ann.title} className="max-w-full max-h-full rounded-2xl object-contain" />
        </div>
      )}
      <div
        data-testid={`card-announcement-${ann.id}`}
        className={`bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer card-interactive hover-elevate animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        {ann.imageUrl && (
          <div 
            className="w-full overflow-hidden"
            onClick={(e) => { e.stopPropagation(); setExpandedImage(true); }}>
            <img 
              src={ann.imageUrl}
              alt={ann.title}
              className="w-full h-40 object-cover hover:opacity-90 transition-opacity"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
        <div className="p-4" onClick={() => setExpanded(e => !e)}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl bg-orange-50 flex-shrink-0 flex items-center justify-center border border-orange-100 mt-0.5 transition-transform duration-300 ${expanded ? "rotate-6 scale-110" : ""}`}>
              <Megaphone size={18} className="text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-sm leading-tight">{ann.title}</p>
              <div className={`overflow-hidden transition-all duration-300 ${expanded ? "max-h-96" : "max-h-10"}`}>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  {ann.content}
                </p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] text-gray-400">{ann.authorName} · {formatDate(ann.createdAt)}</p>
                <span className={`text-[11px] text-primary font-medium transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
                  {expanded ? "ย่อลง" : "อ่านเพิ่ม"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AnnouncementsPage() {
  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  return (
    <div className="pb-24 pt-5 px-4">
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
              <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
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
          {announcements?.map((ann, i) => <AnnouncementCard key={ann.id} ann={ann} index={i} />)}
        </div>
      )}
    </div>
  );
}
