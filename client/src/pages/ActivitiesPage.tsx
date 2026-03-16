import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sun, QrCode, Cloud, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrScanner } from "@/components/QrScanner";

const MAX_STAMPS = 10;

function GoodnesTab() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [description, setDescription] = useState("");
  const [imageLink, setImageLink] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  const scanMutation = useMutation({
    mutationFn: (token: string) => apiRequest("POST", "/api/qr/scan", { token, userId: user!.id }),
    onSuccess: async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      updateUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/activities", user!.id] });
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 3000);
      toast({ title: "สำเร็จ!", description: data.message });
    },
    onError: (err: any) => {
      toast({ title: "ไม่สำเร็จ", description: err.message, variant: "destructive" });
    },
  });

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

  const activityMutation = useMutation({
    mutationFn: async () => {
      let finalImageUrl = imageLink;
      if (selectedFile) {
        console.log("Activity: Uploading image to ImgBB...");
        finalImageUrl = await uploadImage(selectedFile);
        console.log("Activity: Image uploaded:", finalImageUrl);
      }
      console.log("Activity: Sending request to server...");
      return apiRequest("POST", `/api/activities/${user!.id}`, {
        type: "goodness",
        description,
        imageUrl: finalImageUrl || undefined,
      });
    },
    onSuccess: async (res) => {
      const data = await res.json();
      console.log("Activity: Success:", data);
      updateUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/activities", user!.id] });
      setDescription("");
      setImageLink("");
      setSelectedFile(null);
      toast({ title: "บันทึกสำเร็จ!", description: "กิจกรรมของคุณถูกส่งเพื่อรอการอนุมัติ" });
    },
    onError: (err: any) => {
      console.error("Activity error:", err);
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  const handleScan = (data: string) => {
    setShowScanner(false);
    scanMutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      {showScanner && (
        <QrScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      {scanSuccess && (
        <div className="bg-green-50 rounded-2xl p-4 border border-green-200 flex items-center gap-3 animate-bounce-in">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={20} className="text-green-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-700">สแกนสำเร็จ!</p>
            <p className="text-xs text-green-600">ได้รับแต้มเรียบร้อยแล้ว</p>
          </div>
        </div>
      )}

      <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100 animate-fade-in-up stagger-1">
        <div className="flex items-center gap-2 mb-1">
          <Sun size={18} className="text-yellow-500" />
          <h3 className="font-bold text-gray-800 text-sm">เช็คชื่อยามเข้า</h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">สแกนคิวอาร์โค้ดกิจกรรมหน้าเสาธงเพื่อรับแต้มความดี 1 แต้ม</p>
        <Button
          data-testid="button-checkin-scan"
          className="w-full rounded-xl h-11 font-semibold text-sm relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)", color: "white" }}
          onClick={() => setShowScanner(true)}
          disabled={scanMutation.isPending}>
          <QrCode size={16} className="mr-2" />
          {scanMutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              กำลังบันทึก...
            </span>
          ) : "สแกน QR เพื่อเช็คชื่อ"}
        </Button>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-fade-in-up stagger-2" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Cloud size={18} className="text-blue-400" />
          <h3 className="font-bold text-gray-800 text-sm">บันทึกกิจกรรมความดีอื่นๆ</h3>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-gray-600 text-xs font-medium mb-1.5 block">รายละเอียดความดีที่ทำ</Label>
            <Textarea
              data-testid="input-activity-description"
              placeholder="เช่น ช่วยครูยกของ, ทำความสะอาดห้องเรียน..."
              className="rounded-xl bg-gray-50 border-gray-200 text-sm min-h-[80px] transition-all duration-200 focus:bg-white"
              value={description}
              onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <Label className="text-gray-600 text-xs font-medium mb-1.5 block">อัปโหลดรูปภาพประกอบ (ImgBB)</Label>
            <Input
              type="file"
              accept="image/*"
              className="rounded-xl bg-gray-50 border-gray-200 text-sm h-10 transition-all duration-200 focus:bg-white mb-2"
              onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
            <Label className="text-gray-600 text-xs font-medium mb-1.5 block">หรือวางลิงก์รูปภาพประกอบ</Label>
            <Input
              data-testid="input-activity-imagelink"
              placeholder="https://..."
              className="rounded-xl bg-gray-50 border-gray-200 text-sm h-10 transition-all duration-200 focus:bg-white"
              value={imageLink}
              onChange={e => setImageLink(e.target.value)} />
          </div>
          <Button
            data-testid="button-submit-activity"
            className="w-full rounded-xl h-11 font-semibold text-sm"
            onClick={() => description.trim() && activityMutation.mutate()}
            disabled={!description.trim() || activityMutation.isPending}>
            {activityMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                กำลังบันทึก...
              </span>
            ) : "บันทึกกิจกรรม"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StampTab() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showScanner, setShowScanner] = useState(false);

  const trashPts = user?.trashPoints ?? 0;
  const displayStamps = trashPts % MAX_STAMPS;

  const scanMutation = useMutation({
    mutationFn: (token: string) => apiRequest("POST", "/api/qr/scan", { token, userId: user!.id }),
    onSuccess: async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      updateUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/activities", user!.id] });
      toast({ title: "สำเร็จ!", description: data.message });
    },
    onError: (err: any) => {
      toast({ title: "ไม่สำเร็จ", description: err.message, variant: "destructive" });
    },
  });

  const handleScan = (data: string) => {
    setShowScanner(false);
    scanMutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      {showScanner && (
        <QrScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-fade-in-up stagger-1" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-800 text-sm">บัตรสะสมแสตมป์</h3>
          <span className="text-green-500 font-bold text-sm">{displayStamps}<span className="text-gray-400 font-normal">/{MAX_STAMPS}</span></span>
        </div>
        <p className="text-xs text-gray-500 mb-4">สะสมครบ 10 แต้มขยะ = 1 แสตมป์ (มี {user?.stamps ?? 0} แสตมป์แล้ว)</p>
        <div className="h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${(displayStamps / MAX_STAMPS) * 100}%`, background: "linear-gradient(90deg, #22C55E, #16A34A)" }} />
        </div>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {Array.from({ length: MAX_STAMPS }).map((_, i) => (
            <div key={i}
              data-testid={`stamp-circle-${i}`}
              className={`aspect-square rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i < displayStamps
                  ? "border-green-400 bg-green-50 text-green-500 animate-pop-in"
                  : "border-dashed border-gray-300 text-gray-300"
              }`}
              style={i < displayStamps ? { animationDelay: `${i * 0.05}s` } : {}}>
              {i < displayStamps ? "★" : i + 1}
            </div>
          ))}
        </div>
        <Button
          data-testid="button-scan-stamp"
          className="w-full rounded-xl h-11 font-semibold text-sm bg-gray-900"
          onClick={() => setShowScanner(true)}
          disabled={scanMutation.isPending}>
          <QrCode size={16} className="mr-2" />
          {scanMutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              กำลังบันทึก...
            </span>
          ) : "สแกน QR รับแสตมป์"}
        </Button>
      </div>

    </div>
  );
}

export default function ActivitiesPage() {
  const [tab, setTab] = useState<"goodness" | "stamp">("goodness");

  return (
    <div className="pb-24 px-4 pt-5">
      <div className="mb-5 animate-fade-in-up">
        <h1 className="text-xl font-bold text-gray-800">กิจกรรมสะสมแต้ม</h1>
        <p className="text-sm text-gray-500 mt-0.5">ทำความดีและคัดแยกขยะเพื่อรับของรางวัล</p>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 mb-5 animate-fade-in-up stagger-1 relative">
        <div className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm tab-indicator"
          style={{ width: "calc(50% - 4px)", left: tab === "goodness" ? "4px" : "calc(50%)" }} />
        <button
          data-testid="tab-goodness"
          onClick={() => setTab("goodness")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors relative z-10 ${
            tab === "goodness" ? "text-gray-800" : "text-gray-500"
          }`}>
          ความดี
        </button>
        <button
          data-testid="tab-stamp"
          onClick={() => setTab("stamp")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors relative z-10 ${
            tab === "stamp" ? "text-gray-800" : "text-gray-500"
          }`}>
          ธนาคารขยะ
        </button>
      </div>

      <div key={tab} className="animate-fade-in">
        {tab === "goodness" ? <GoodnesTab /> : <StampTab />}
      </div>
    </div>
  );
}
