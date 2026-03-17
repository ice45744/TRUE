import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, ArrowLeft, Trash2, Award, Recycle, Search, ShieldCheck, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useRef, useEffect } from "react";

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
  const { user: currentUser, updateUser } = useAuth();
  const [search, setSearch] = useState("");
  const [showTrashForm, setShowTrashForm] = useState(false);
  const [trashStudentId, setTrashStudentId] = useState("");
  const [trashAmount, setTrashAmount] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const trashMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/trash-points", {
      studentId: trashStudentId,
      amount: Number(trashAmount),
    }),
    onSuccess: async (res) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      if (currentUser && data.user && data.user.id === currentUser.id) {
        updateUser(data.user);
      }
      toast({ title: "สำเร็จ!", description: data.message });
      setTrashStudentId(""); setTrashAmount(""); setShowTrashForm(false);
    },
    onError: (err: any) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  const { data: users, isLoading, error } = useQuery<SafeUser[]>({
    queryKey: ["/api/admin/users"],
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    staleTime: 20000,
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

  if (error) {
    return (
      <div className="pb-24 pt-5 px-4">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/admin">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center cursor-pointer">
              <ArrowLeft size={16} className="text-gray-500" />
            </div>
          </Link>
          <h1 className="text-xl font-bold text-gray-800">จัดการนักเรียน</h1>
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

  const allUsers = users ?? [];
  const filtered = allUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.studentId.includes(search)
  );
  const studentCount = allUsers.filter(u => u.role === "student").length;
  const adminCount = allUsers.filter(u => u.role === "admin").length;

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
          <h1 className="text-xl font-bold text-gray-800">จัดการผู้ใช้งาน</h1>
        </div>
        <Button
          data-testid="button-toggle-trash-form"
          size="sm"
          className="ml-auto rounded-xl text-xs bg-green-600 hover:bg-green-700"
          onClick={() => setShowTrashForm(v => !v)}>
          <Recycle size={14} className="mr-1" />
          เพิ่มแต้มขยะ
        </Button>
      </div>

      {showTrashForm && (
        <div className="bg-white rounded-2xl p-4 border border-green-100 mb-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Recycle size={14} className="text-green-500" />
              เพิ่มแต้มขยะ Manual
            </h3>
            <button onClick={() => { setShowTrashForm(false); setShowSuggestions(false); }} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-2">
            <div className="relative" ref={suggestRef}>
              <Input
                data-testid="input-trash-student-id"
                placeholder="พิมพ์รหัสหรือชื่อนักเรียน..."
                className="rounded-xl h-10 text-sm"
                value={trashStudentId}
                autoComplete="off"
                onChange={e => {
                  setTrashStudentId(e.target.value);
                  setShowSuggestions(e.target.value.length > 0);
                }}
                onFocus={() => trashStudentId.length > 0 && setShowSuggestions(true)} />
              {showSuggestions && (() => {
                const term = trashStudentId.toLowerCase();
                const matches = (allUsers ?? []).filter(u =>
                  u.studentId.includes(term) || u.name.toLowerCase().includes(term)
                ).slice(0, 5);
                return matches.length > 0 ? (
                  <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 overflow-hidden">
                    {matches.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0"
                        onMouseDown={() => {
                          setTrashStudentId(u.studentId);
                          setShowSuggestions(false);
                        }}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          u.role === "admin" ? "bg-purple-100 text-purple-600" : "bg-green-100 text-green-600"
                        }`}>
                          {u.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{u.name}</p>
                          <p className="text-xs text-gray-400">รหัส: {u.studentId} · แต้มขยะ: {u.trashPoints}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
            <Input
              data-testid="input-trash-amount"
              type="number"
              min="10"
              step="10"
              placeholder="จำนวนแต้มขยะ (10 แต้ม = 1 แสตมป์)"
              className="rounded-xl h-10 text-sm"
              value={trashAmount}
              onChange={e => setTrashAmount(e.target.value)} />
            <Button
              data-testid="button-add-trash-points"
              className="w-full rounded-xl h-10 text-sm bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (!trashStudentId || !trashAmount) {
                  toast({ title: "กรุณากรอกข้อมูลให้ครบ", variant: "destructive" });
                  return;
                }
                trashMutation.mutate();
              }}
              disabled={trashMutation.isPending}>
              {trashMutation.isPending ? "กำลังบันทึก..." : "เพิ่มแต้มขยะ"}
            </Button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-blue-50 rounded-xl p-3 border border-blue-100 text-center">
          <p className="text-xl font-bold text-blue-600">{studentCount}</p>
          <p className="text-[10px] text-blue-500">นักเรียน</p>
        </div>
        <div className="flex-1 bg-purple-50 rounded-xl p-3 border border-purple-100 text-center">
          <p className="text-xl font-bold text-purple-600">{adminCount}</p>
          <p className="text-[10px] text-purple-500">ผู้ดูแล</p>
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
        <div className="text-center py-12 text-gray-400 text-sm">ไม่พบผู้ใช้งาน</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => (
            <div key={u.id}
              data-testid={`user-card-${u.id}`}
              className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3"
              style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                u.role === "admin" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
              }`}>
                {u.role === "admin" ? <ShieldCheck size={18} /> : u.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800 text-sm truncate">{u.name}</p>
                  {u.role === "admin" && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 flex-shrink-0">ADMIN</span>
                  )}
                </div>
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
                disabled={deleteMutation.isPending}
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
