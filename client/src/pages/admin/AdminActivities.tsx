import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, ClipboardList, CheckCircle, XCircle, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Activity } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { useState } from "react";

interface SafeUser {
  id: string;
  studentId: string;
  name: string;
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "รออนุมัติ", color: "text-amber-600", bg: "bg-amber-50" },
  approved: { label: "อนุมัติแล้ว", color: "text-green-600", bg: "bg-green-50" },
  rejected: { label: "ปฏิเสธ", color: "text-red-600", bg: "bg-red-50" },
};

const typeMap: Record<string, string> = {
  goodness: "ความดี",
  checkin: "เช็คชื่อ",
  stamp: "แสตมป์ขยะ",
};

export default function AdminActivities() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const { data: activities, isLoading, error } = useQuery<Activity[]>({
    queryKey: ["/api/admin/activities"],
  });

  const { data: users } = useQuery<SafeUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const userMap = new Map((users ?? []).map(u => [u.id, u]));

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/admin/activities/${id}`, { status }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ 
        title: vars.status === "approved" ? "✅ อนุมัติสำเร็จ - ผู้ใช้ได้รับ 1 แต้มความดี" : "❌ ปฏิเสธกิจกรรมแล้ว"
      });
    },
    onError: (err: any) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    }
  });

  const filtered = (activities ?? []).filter(a => filter === "all" || a.status === filter);

  if (error) {
    return (
      <div className="pb-24 pt-5 px-4">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/admin">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center cursor-pointer">
              <ArrowLeft size={16} className="text-gray-500" />
            </div>
          </Link>
          <h1 className="text-xl font-bold text-gray-800">อนุมัติกิจกรรม</h1>
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
          <ClipboardList size={20} className="text-green-500" />
          <h1 className="text-xl font-bold text-gray-800">อนุมัติกิจกรรม</h1>
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl p-3 mb-4 border border-blue-100">
        <p className="text-xs text-blue-700 font-medium">💡 เฉพาะกิจกรรม "ความดี" เท่านั้นที่ต้องรออนุมัติ เมื่ออนุมัติแล้วผู้ใช้จะได้รับ 1 แต้มความดี</p>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(["all", "pending", "approved", "rejected"] as const).map(f => (
          <button key={f}
            data-testid={`filter-${f}`}
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
          {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">ไม่มีกิจกรรม</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(act => {
            const u = userMap.get(act.userId);
            const st = statusMap[act.status] ?? statusMap.pending;
            return (
              <div key={act.id}
                data-testid={`activity-card-${act.id}`}
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

                <p className="text-sm text-gray-600 mb-2">{act.description}</p>

                {/* รูปภาพประกอบ */}
                {act.imageUrl && (
                  <div 
                    className="mb-3 rounded-xl overflow-hidden border border-gray-100 cursor-pointer"
                    onClick={() => setExpandedImage(act.imageUrl!)}>
                    <img 
                      src={act.imageUrl} 
                      alt="รูปประกอบกิจกรรม"
                      className="w-full max-h-48 object-cover hover:opacity-90 transition-opacity"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <p className="text-[10px] text-gray-400 text-center py-1 bg-gray-50">
                      <ImageIcon size={10} className="inline mr-1" />กดเพื่อดูรูปเต็ม
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                      act.type === "goodness" ? "bg-yellow-50 text-yellow-600" : "bg-gray-100 text-gray-500"
                    }`}>{typeMap[act.type] ?? act.type}</span>
                    <span>{formatDistanceToNow(new Date(act.createdAt), { addSuffix: true, locale: th })}</span>
                  </div>
                  {act.status === "pending" && act.type === "goodness" && (
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="ghost"
                        data-testid={`button-approve-${act.id}`}
                        className="h-7 px-2 text-green-600 text-xs"
                        disabled={updateMutation.isPending}
                        onClick={() => updateMutation.mutate({ id: act.id, status: "approved" })}>
                        <CheckCircle size={14} className="mr-1" /> อนุมัติ (+1 แต้ม)
                      </Button>
                      <Button size="sm" variant="ghost"
                        data-testid={`button-reject-${act.id}`}
                        className="h-7 px-2 text-red-500 text-xs"
                        disabled={updateMutation.isPending}
                        onClick={() => updateMutation.mutate({ id: act.id, status: "rejected" })}>
                        <XCircle size={14} className="mr-1" /> ปฏิเสธ
                      </Button>
                    </div>
                  )}
                  {act.status === "pending" && act.type !== "goodness" && (
                    <span className="text-[10px] text-gray-400 italic">ได้คะแนนอัตโนมัติแล้ว</span>
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
