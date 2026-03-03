import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Info, MapPin, Camera, Link as LinkIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const categories = [
  "ความสะอาดและสิ่งแวดล้อม",
  "อุปกรณ์และสิ่งอำนวยความสะดวก",
  "ความปลอดภัย",
  "การบริการ",
  "ข้อเสนอแนะ",
  "อื่นๆ",
];

export default function ReportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [category, setCategory] = useState("");
  const [details, setDetails] = useState("");
  const [imageLink, setImageLink] = useState("");

  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/reports/${user!.id}`, {
      category,
      details,
      imageLink: imageLink || undefined,
    }),
    onSuccess: async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCategory("");
      setDetails("");
      setImageLink("");
      toast({ title: "ส่งเรื่องร้องเรียนสำเร็จ!", description: "สภานักเรียนจะตรวจสอบและดำเนินการโดยเร็ว" });
    },
    onError: (err: any) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  const canSubmit = category && details.trim().length >= 10 && !mutation.isPending;

  return (
    <div className="pb-24 pt-5 px-4">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
          <AlertTriangle size={20} className="text-orange-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">แจ้งปัญหา</h1>
          <p className="text-xs text-gray-400 mt-0.5">พบปัญหาหรือมีข้อเสนอแนะ แจ้งสภานักเรียนได้ที่นี่</p>
        </div>
      </div>

      <div className="bg-orange-50 rounded-2xl p-4 flex gap-3 mb-5 border border-orange-100">
        <Info size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-orange-700 leading-relaxed">
          ข้อมูลของคุณจะถูกเก็บเป็นความลับ สภานักเรียนจะตรวจสอบและดำเนินการแก้ไขปัญหาอย่างเร็วที่สุด
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MapPin size={14} className="text-gray-400" />
              <Label className="text-gray-700 text-sm font-semibold">ประเภทของปัญหา</Label>
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger
                data-testid="select-category"
                className="rounded-xl bg-gray-50 border-gray-200 h-11 text-sm">
                <SelectValue placeholder="เลือกหมวดหมู่..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle size={14} className="text-gray-400" />
              <Label className="text-gray-700 text-sm font-semibold">รายละเอียด</Label>
            </div>
            <Textarea
              data-testid="input-report-details"
              placeholder="อธิบายสถานที่และปัญหาที่พบอย่างละเอียด..."
              className="rounded-xl bg-gray-50 border-gray-200 text-sm min-h-[100px]"
              value={details}
              onChange={e => setDetails(e.target.value)} />
            <p className="text-xs text-gray-400 mt-1 text-right">{details.length} ตัวอักษร (ขั้นต่ำ 10)</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Camera size={14} className="text-gray-400" />
              <Label className="text-gray-700 text-sm font-semibold">อัปโหลดรูปภาพประกอบ (ImgBB)</Label>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-400 cursor-pointer hover:bg-gray-100 transition-colors">
              เลือกไฟล์  ไม่ได้เลือกไฟลใด
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <LinkIcon size={14} className="text-gray-400" />
              <Label className="text-gray-700 text-sm font-semibold">หรือวางลิงก์รูปภาพประกอบ</Label>
            </div>
            <Input
              data-testid="input-report-imagelink"
              placeholder="https://..."
              className="rounded-xl bg-gray-50 border-gray-200 text-sm h-11"
              value={imageLink}
              onChange={e => setImageLink(e.target.value)} />
          </div>
        </div>

        <Button
          data-testid="button-submit-report"
          size="lg"
          className="w-full rounded-xl h-12 font-semibold text-sm bg-gray-900"
          onClick={() => mutation.mutate()}
          disabled={!canSubmit}>
          {mutation.isPending ? "กำลังส่ง..." : "ส่งเรื่องร้องเรียน"}
        </Button>
      </div>
    </div>
  );
}
