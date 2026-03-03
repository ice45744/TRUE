import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Megaphone, Plus, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { Announcement } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

export default function AdminAnnouncements() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/announcements", { title, content, authorName: "สภานักเรียน" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setTitle("");
      setContent("");
      setShowForm(false);
      toast({ title: "สร้างประกาศสำเร็จ" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "ลบประกาศสำเร็จ" });
    },
  });

  return (
    <div className="pb-24 pt-5 px-4">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center cursor-pointer hover-elevate">
              <ArrowLeft size={16} className="text-gray-500" />
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Megaphone size={20} className="text-orange-500" />
            <h1 className="text-xl font-bold text-gray-800">จัดการประกาศ</h1>
          </div>
        </div>
        <Button
          data-testid="button-new-announcement"
          size="sm"
          className="rounded-xl text-xs"
          onClick={() => setShowForm(!showForm)}>
          {showForm ? <X size={14} className="mr-1" /> : <Plus size={14} className="mr-1" />}
          {showForm ? "ยกเลิก" : "สร้างใหม่"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-4 space-y-3"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          <div>
            <Label className="text-gray-600 text-xs font-medium mb-1.5 block">หัวข้อ</Label>
            <Input
              data-testid="input-ann-title"
              placeholder="หัวข้อประกาศ"
              className="rounded-xl bg-gray-50 border-gray-200 text-sm h-10"
              value={title}
              onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <Label className="text-gray-600 text-xs font-medium mb-1.5 block">เนื้อหา</Label>
            <Textarea
              data-testid="input-ann-content"
              placeholder="รายละเอียดประกาศ..."
              className="rounded-xl bg-gray-50 border-gray-200 text-sm min-h-[80px]"
              value={content}
              onChange={e => setContent(e.target.value)} />
          </div>
          <Button
            data-testid="button-create-announcement"
            className="w-full rounded-xl h-10 text-sm font-semibold"
            onClick={() => title.trim() && content.trim() && createMutation.mutate()}
            disabled={!title.trim() || !content.trim() || createMutation.isPending}>
            {createMutation.isPending ? "กำลังสร้าง..." : "สร้างประกาศ"}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1,2].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (announcements ?? []).length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">ยังไม่มีประกาศ</div>
      ) : (
        <div className="space-y-2">
          {(announcements ?? []).map(ann => (
            <div key={ann.id}
              data-testid={`ann-card-${ann.id}`}
              className="bg-white rounded-2xl p-4 border border-gray-100 flex gap-3"
              style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm">{ann.title}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ann.content}</p>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  {formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true, locale: th })}
                </p>
              </div>
              <Button
                data-testid={`button-delete-ann-${ann.id}`}
                size="icon"
                variant="ghost"
                className="text-red-400 flex-shrink-0"
                onClick={() => {
                  if (confirm("ยืนยันลบประกาศนี้?")) deleteMutation.mutate(ann.id);
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
