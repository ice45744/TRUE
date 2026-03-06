import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Info, MapPin, Camera, Link as LinkIcon, CheckCircle } from "lucide-react";
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=baf409d03cf4975986f6d44b5a1a2919`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.success) {
      return data.data.url;
    }
    throw new Error("อัปโหลดรูปภาพไม่สำเร็จ");
  };

  const mutation = useMutation({
    mutationFn: async () => {
      let finalImageUrl = imageLink;
      if (selectedFile) {
        console.log("Report: Uploading image to ImgBB...");
        finalImageUrl = await uploadImage(selectedFile);
        console.log("Report: Image uploaded:", finalImageUrl);
      }
      console.log("Report: Sending request to server...");
      return apiRequest("POST", `/api/reports/${user!.id}`, {
        category,
        details,
        imageLink: finalImageUrl || undefined,
      });
    },
    onSuccess: async (res) => {
      const data = await res.json();
      console.log("Report: Success:", data);
      setCategory("");
      setDetails("");
      setImageLink("");
      setSelectedFile(null);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
      toast({ title: "ส่งเรื่องร้องเรียนสำเร็จ!", description: "สภานักเรียนจะตรวจสอบและดำเนินการโดยเร็ว" });
    },
    onError: (err: any) => {
      console.error("Report error:", err);
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  const canSubmit = category && details.trim().length >= 10 && !mutation.isPending;

  return (
    <div className="pb-24 pt-5 px-4">
      <div className="flex items-center gap-3 mb-5 animate-fade-in-up">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
          <AlertTriangle size={20} className="text-orange-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">แจ้งปัญหา</h1>
          <p className="text-xs text-gray-400 mt-0.5">พบปัญหาหรือมีข้อเสนอแนะ แจ้งสภานักเรียนได้ที่นี่</p>
        </div>
      </div>

      {submitted && (
        <div className="bg-green-50 rounded-2xl p-4 flex items-center gap-3 mb-5 border border-green-200 animate-bounce-in">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={20} className="text-green-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-700">ส่งสำเร็จ!</p>
            <p className="text-xs text-green-600">สภานักเรียนจะตรวจสอบและดำเนินการ</p>
          </div>
        </div>
      )}

      <div className="bg-orange-50 rounded-2xl p-4 flex gap-3 mb-5 border border-orange-100 animate-fade-in-up stagger-1">
        <Info size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-orange-700 leading-relaxed">
          ข้อมูลของคุณจะถูกเก็บเป็นความลับ สภานักเรียนจะตรวจสอบและดำเนินการแก้ไขปัญหาอย่างเร็วที่สุด
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-4 animate-fade-in-up stagger-2" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MapPin size={14} className="text-gray-400" />
              <Label className="text-gray-700 text-sm font-semibold">ประเภทของปัญหา</Label>
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger
                data-testid="select-category"
                className="rounded-xl bg-gray-50 border-gray-200 h-11 text-sm transition-all duration-200 focus:bg-white">
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
              className="rounded-xl bg-gray-50 border-gray-200 text-sm min-h-[100px] transition-all duration-200 focus:bg-white"
              value={details}
              onChange={e => setDetails(e.target.value)} />
            <div className="flex items-center justify-between mt-1">
              <div className={`h-1 flex-1 mr-4 rounded-full bg-gray-100 overflow-hidden`}>
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((details.length / 10) * 100, 100)}%`, background: details.length >= 10 ? "linear-gradient(90deg, #22C55E, #16A34A)" : "linear-gradient(90deg, #F59E0B, #FBBF24)" }} />
              </div>
              <p className={`text-xs ${details.length >= 10 ? "text-green-500" : "text-gray-400"}`}>{details.length}/10+</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Camera size={14} className="text-gray-400" />
              <Label className="text-gray-700 text-sm font-semibold">อัปโหลดรูปภาพประกอบ (ImgBB)</Label>
            </div>
            <Input
              type="file"
              accept="image/*"
              className="rounded-xl bg-gray-50 border-gray-200 text-sm h-11 transition-all duration-200 focus:bg-white"
              onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <LinkIcon size={14} className="text-gray-400" />
              <Label className="text-gray-700 text-sm font-semibold">หรือวางลิงก์รูปภาพประกอบ</Label>
            </div>
            <Input
              data-testid="input-report-imagelink"
              placeholder="https://..."
              className="rounded-xl bg-gray-50 border-gray-200 text-sm h-11 transition-all duration-200 focus:bg-white"
              value={imageLink}
              onChange={e => setImageLink(e.target.value)} />
          </div>
        </div>

        <div className="animate-fade-in-up stagger-3">
          <Button
            data-testid="button-submit-report"
            size="lg"
            className="w-full rounded-xl h-12 font-semibold text-sm bg-gray-900"
            onClick={() => mutation.mutate()}
            disabled={!canSubmit}>
            {mutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                กำลังส่ง...
              </span>
            ) : "ส่งเรื่องร้องเรียน"}
          </Button>
        </div>
      </div>
    </div>
  );
}
