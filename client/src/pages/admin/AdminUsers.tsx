import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, ArrowLeft, Trash2, Award, Recycle, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface SafeUser {
  id: string;
  studentId: string;
  name: string;
  role: string;
  merits: number;
  trashPoints: number;
  stamps: number;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: users, isLoading } = useQuery<SafeUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "ลบผู้ใช้สำเร็จ" });
    },
    onError: (err: any) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  const students = (users ?? []).filter(u => u.role === "student");
  const filtered = students.filter(u =>
    u.name.includes(search) || u.studentId.includes(search)
  );

  return (
    <div className="pb-24 pt-5 px-4">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/admin">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center cursor-pointer hover-elevate">
            <ArrowLeft size={16} className="text-gray-500" />
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Users size={20} className="text-blue-500" />
          <h1 className="text-xl font-bold text-gray-800">จัดการนักเรียน</h1>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          data-testid="input-search-users"
          placeholder="ค้นหาชื่อหรือรหัสนักเรียน..."
          className="pl-9 rounded-xl bg-white border-gray-200 h-10 text-sm"
          value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      <p className="text-xs text-gray-400 mb-3">{filtered.length} คน</p>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">ไม่พบนักเรียน</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => (
            <div key={u.id}
              data-testid={`user-card-${u.id}`}
              className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3"
              style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                {u.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{u.name}</p>
                <p className="text-xs text-gray-400">รหัส: {u.studentId}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-yellow-600" title="แต้มความดี">
                    <Award size={12} /> {u.merits}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-green-600" title="แต้มขยะ">
                    <Recycle size={12} /> {u.trashPoints}
                  </span>
                  <span className="text-xs text-purple-500 font-semibold" title="แสตมป์">
                    ★{u.stamps}
                  </span>
                </div>
              </div>
              <Button
                data-testid={`button-delete-user-${u.id}`}
                size="icon"
                variant="ghost"
                className="text-red-400 flex-shrink-0"
                onClick={() => {
                  if (confirm(`ยืนยันลบ ${u.name}?`)) deleteMutation.mutate(u.id);
                }}>
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
