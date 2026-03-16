import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Gift, ArrowLeft, Trash2, Plus, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Reward } from "@shared/schema";

export default function AdminRewards() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stampCost, setStampCost] = useState("");
  const [stock, setStock] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: rewards, isLoading } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
  });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/rewards", {
      title,
      description,
      stampCost: Number(stampCost),
      stock: stock === "" || stock === "-1" ? -1 : Number(stock),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      toast({ title: "เพิ่มของรางวัลสำเร็จ" });
      setTitle(""); setDescription(""); setStampCost(""); setStock("");
      setShowForm(false);
    },
    onError: (err: any) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/rewards/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      toast({ title: "ลบของรางวัลสำเร็จ" });
    },
    onError: (err: any) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    if (!title || !stampCost) {
      toast({ title: "กรุณากรอกชื่อและจำนวนแสตมป์", variant: "destructive" });
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="pb-24 pt-5 px-4">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/admin">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center cursor-pointer hover-elevate">
            <ArrowLeft size={16} className="text-gray-500" />
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Gift size={20} className="text-green-500" />
          <h1 className="text-xl font-bold text-gray-800">จัดการของรางวัล</h1>
        </div>
        <Button
          data-testid="button-toggle-add-reward"
          size="sm"
          className="ml-auto rounded-xl text-xs bg-green-600 hover:bg-green-700"
          onClick={() => setShowForm(v => !v)}>
          <Plus size={14} className="mr-1" />
          เพิ่มของรางวัล
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-4 border border-green-100 mb-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          <h3 className="font-bold text-gray-800 text-sm mb-3">เพิ่มของรางวัลใหม่</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">ชื่อของรางวัล *</label>
              <Input
                data-testid="input-reward-title"
                placeholder="เช่น ดินสอ, ยางลบ"
                className="rounded-xl h-10 text-sm"
                value={title}
                onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">รายละเอียด</label>
              <Input
                data-testid="input-reward-description"
                placeholder="รายละเอียดเพิ่มเติม (ไม่จำเป็น)"
                className="rounded-xl h-10 text-sm"
                value={description}
                onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">แสตมป์ที่ต้องใช้ *</label>
                <Input
                  data-testid="input-reward-stamp-cost"
                  type="number"
                  min="1"
                  placeholder="จำนวนแสตมป์"
                  className="rounded-xl h-10 text-sm"
                  value={stampCost}
                  onChange={e => setStampCost(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">จำนวนคลัง (-1 = ไม่จำกัด)</label>
                <Input
                  data-testid="input-reward-stock"
                  type="number"
                  min="-1"
                  placeholder="-1"
                  className="rounded-xl h-10 text-sm"
                  value={stock}
                  onChange={e => setStock(e.target.value)} />
              </div>
            </div>
            <Button
              data-testid="button-create-reward"
              className="w-full rounded-xl h-10 text-sm bg-green-600 hover:bg-green-700"
              onClick={handleCreate}
              disabled={createMutation.isPending}>
              {createMutation.isPending ? "กำลังบันทึก..." : "บันทึกของรางวัล"}
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 mb-3">{(rewards ?? []).length} รายการ</p>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : (rewards ?? []).length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          <Package size={40} className="mx-auto mb-3 text-gray-300" />
          <p>ยังไม่มีของรางวัล</p>
          <p className="text-xs mt-1">กดปุ่ม "เพิ่มของรางวัล" เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(rewards ?? []).map(r => (
            <div key={r.id}
              data-testid={`reward-card-${r.id}`}
              className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3"
              style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <Gift size={18} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{r.title}</p>
                {r.description && <p className="text-xs text-gray-400 truncate">{r.description}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-purple-600 font-bold">★ {r.stampCost} แสตมป์</span>
                  <span className="text-xs text-gray-400">
                    คลัง: {r.stock === -1 ? "ไม่จำกัด" : `${r.stock} ชิ้น`}
                  </span>
                </div>
              </div>
              <Button
                data-testid={`button-delete-reward-${r.id}`}
                size="icon"
                variant="ghost"
                className="text-red-400 flex-shrink-0"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (confirm(`ยืนยันลบ "${r.title}"?`)) deleteMutation.mutate(r.id);
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
