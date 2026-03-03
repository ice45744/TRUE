import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, ClipboardList, CheckCircle, XCircle, Clock } from "lucide-react";
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

  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/admin/activities"],
  });

  const { data: users } = useQuery<SafeUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const userMap = new Map((users ?? []).map(u => [u.id, u]));

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/admin/activities/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "อัปเดตสถานะสำเร็จ" });
    },
  });

  const filtered = (activities ?? []).filter(a => filter === "all" || a.status === filter);

  return (
    <div className="pb-24 pt-5 px-4">
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
        <div className="space-y-2">
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
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.bg} ${st.color} whitespace-nowrap`}>
                    {st.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{act.description}</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="bg-gray-100 px-2 py-0.5 rounded-md">{typeMap[act.type] ?? act.type}</span>
                    <span>{formatDistanceToNow(new Date(act.createdAt), { addSuffix: true, locale: th })}</span>
                  </div>
                  {act.status === "pending" && (
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="ghost"
                        data-testid={`button-approve-${act.id}`}
                        className="h-7 px-2 text-green-600 text-xs"
                        onClick={() => updateMutation.mutate({ id: act.id, status: "approved" })}>
                        <CheckCircle size={14} className="mr-1" /> อนุมัติ
                      </Button>
                      <Button size="sm" variant="ghost"
                        data-testid={`button-reject-${act.id}`}
                        className="h-7 px-2 text-red-500 text-xs"
                        onClick={() => updateMutation.mutate({ id: act.id, status: "rejected" })}>
                        <XCircle size={14} className="mr-1" /> ปฏิเสธ
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
