import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, Loader2, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type Report } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { useState } from "react";

interface SafeUser {
  id: string;
  studentId: string;
  name: string;
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "รอดำเนินการ", color: "text-amber-600", bg: "bg-amber-50" },
  in_progress: { label: "กำลังดำเนินการ", color: "text-blue-600", bg: "bg-blue-50" },
  resolved: { label: "แก้ไขแล้ว", color: "text-green-600", bg: "bg-green-50" },
  rejected: { label: "ปฏิเสธ", color: "text-red-600", bg: "bg-red-50" },
};

export default function AdminReports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "resolved" | "rejected">("all");
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const { data: reports, isLoading, error } = useQuery<Report[]>({
    queryKey: ["/api/admin/reports"],
  });

  const { data: users } = useQuery<SafeUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const userMap = new Map((users ?? []).map(u => [u.id, u]));

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/admin/reports/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "อัปเดตสถานะสำเร็จ" });
    },
    onError: (err: any) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    }
  });

  const filtered = (reports ?? []).filter(r => filter === "all" || r.status === filter);

  if (error) {
    return (
      <div className="pb-24 pt-5 px-4">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/admin">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center cursor-pointer">
              <ArrowLeft size={16} className="text-gray-500" />
            </div>
          </Link>
          <h1 className="text-xl font-bold text-gray-800">รายงานปัญหา</h1>
        </div>
        <div className="bg-red-50 rounded-2xl p-5 border border-red-100 text-center">
          <p className="text-red-600 font-semibold text-sm mb-1">เซสชันหมดอายุ</p>
          <p className="text-red-500 text-xs">กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่</p>
          <Link href="/auth">
            <Button size="sm" className="mt-3 rounded-xl text-xs bg-red-500 hover:bg-red-600">เข้าสู่ระบบใหม่</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-5 px-4">
      {/* Image Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}>
          <img src={expandedImage} alt="รูปประกอบ" className="max-w-full max-h-full rounded-2xl object-contain" />
        </div>
      )}

      <div className="flex items-center gap-3 mb-5">
        <Link href="/admin">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center cursor-pointer hover-elevate">
            <ArrowLeft size={16} className="text-gray-500" />
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-500" />
          <h1 className="text-xl font-bold text-gray-800">รายงานปัญหา</h1>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(["all", "pending", "in_progress", "resolved", "rejected"] as const).map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
              filter === f ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500"
            }`}>
            {f === "all" ? "ทั้งหมด" : statusMap[f]?.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 mb-3">{filtered.length} รายการ</p>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">ไม่มีรายงาน</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(rpt => {
            const u = userMap.get(rpt.userId);
            const st = statusMap[rpt.status] ?? statusMap.pending;
            const imageToShow = rpt.imageUrl || rpt.imageLink;
            return (
              <div key={rpt.id}
                data-testid={`report-card-${rpt.id}`}
                className="bg-white rounded-2xl p-4 border border-gray-100"
                style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{u?.name ?? "ไม่ทราบ"}</p>
                    <p className="text-xs text-gray-400">รหัส: {u?.studentId ?? "-"}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.bg} ${st.color} whitespace-nowrap flex-shrink-0`}>
                    {st.label}
                  </span>
                </div>
                <span className="inline-block text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md mb-1.5">{rpt.category}</span>
                <p className="text-sm text-gray-600 mb-2">{rpt.details}</p>

                {/* รูปภาพประกอบ */}
                {imageToShow && (
                  <div 
                    className="mb-3 rounded-xl overflow-hidden border border-gray-100 cursor-pointer"
                    onClick={() => setExpandedImage(imageToShow)}>
                    <img 
                      src={imageToShow} 
                      alt="รูปประกอบการรายงาน"
                      className="w-full max-h-48 object-cover hover:opacity-90 transition-opacity"
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.style.display = 'none';
                        // Show link fallback
                        el.parentElement!.innerHTML = `<a href="${imageToShow}" target="_blank" class="flex items-center gap-1 p-2 text-xs text-blue-500 hover:underline"><span>🔗 ดูรูปภาพ</span></a>`;
                      }}
                    />
                    <p className="text-[10px] text-gray-400 text-center py-1 bg-gray-50">
                      <ImageIcon size={10} className="inline mr-1" />กดเพื่อดูรูปเต็ม
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-gray-400">
                    {formatDistanceToNow(new Date(rpt.createdAt), { addSuffix: true, locale: th })}
                  </p>
                  {(rpt.status === "pending" || rpt.status === "in_progress") && (
                    <div className="flex gap-1">
                      {rpt.status === "pending" && (
                        <Button size="sm" variant="ghost"
                          className="h-7 px-2 text-blue-600 text-xs"
                          disabled={updateMutation.isPending}
                          onClick={() => updateMutation.mutate({ id: rpt.id, status: "in_progress" })}>
                          <Loader2 size={12} className="mr-1" /> ดำเนินการ
                        </Button>
                      )}
                      <Button size="sm" variant="ghost"
                        className="h-7 px-2 text-green-600 text-xs"
                        disabled={updateMutation.isPending}
                        onClick={() => updateMutation.mutate({ id: rpt.id, status: "resolved" })}>
                        <CheckCircle size={12} className="mr-1" /> แก้ไขแล้ว
                      </Button>
                      <Button size="sm" variant="ghost"
                        className="h-7 px-2 text-red-500 text-xs"
                        disabled={updateMutation.isPending}
                        onClick={() => updateMutation.mutate({ id: rpt.id, status: "rejected" })}>
                        <XCircle size={12} className="mr-1" /> ปฏิเสธ
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
