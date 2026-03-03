import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sun, QrCode, Gift, Cloud } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrScanner } from "@/components/QrScanner";

const MAX_STAMPS = 10;

const rewards = [
  { name: "น้ำดื่ม 1 ขวด", stamps: 10, icon: "🥤" },
  { name: "สมุดโน้ต 1 เล่ม", stamps: 20, icon: "📓" },
  { name: "ปากกา 1 แท่ง", stamps: 15, icon: "✏️" },
  { name: "ถุงผ้า 1 ใบ", stamps: 25, icon: "👜" },
];

function GoodnesTab() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [description, setDescription] = useState("");
  const [imageLink, setImageLink] = useState("");
  const [showScanner, setShowScanner] = useState(false);

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

  const activityMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/activities/${user!.id}`, {
      type: "goodness",
      description,
      imageUrl: imageLink || undefined,
    }),
    onSuccess: async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      updateUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/activities", user!.id] });
      setDescription("");
      setImageLink("");
      toast({ title: "บันทึกสำเร็จ!", description: "กิจกรรมของคุณถูกส่งเพื่อรอการอนุมัติ" });
    },
    onError: (err: any) => {
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

      <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
        <div className="flex items-center gap-2 mb-1">
          <Sun size={18} className="text-yellow-500" />
          <h3 className="font-bold text-gray-800 text-sm">เช็คชื่อยามเข้า</h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">สแกนคิวอาร์โค้ดกิจกรรมหน้าเสาธงเพื่อรับแต้มความดี 1 แต้ม</p>
        <Button
          data-testid="button-checkin-scan"
          className="w-full rounded-xl h-11 font-semibold text-sm"
          style={{ background: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)", color: "white" }}
          onClick={() => setShowScanner(true)}
          disabled={scanMutation.isPending}>
          <QrCode size={16} className="mr-2" />
          {scanMutation.isPending ? "กำลังบันทึก..." : "สแกน QR เพื่อเช็คชื่อ"}
        </Button>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-gray-100" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
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
              className="rounded-xl bg-gray-50 border-gray-200 text-sm min-h-[80px]"
              value={description}
              onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <Label className="text-gray-600 text-xs font-medium mb-1.5 block">หรือวางลิงก์รูปภาพประกอบ</Label>
            <Input
              data-testid="input-activity-imagelink"
              placeholder="https://..."
              className="rounded-xl bg-gray-50 border-gray-200 text-sm h-10"
              value={imageLink}
              onChange={e => setImageLink(e.target.value)} />
          </div>
          <Button
            data-testid="button-submit-activity"
            className="w-full rounded-xl h-11 font-semibold text-sm"
            onClick={() => description.trim() && activityMutation.mutate()}
            disabled={!description.trim() || activityMutation.isPending}>
            {activityMutation.isPending ? "กำลังบันทึก..." : "บันทึกกิจกรรม"}
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

  const stampsCount = user?.stamps ?? 0;
  const displayStamps = stampsCount % MAX_STAMPS;

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

      <div className="bg-white rounded-2xl p-4 border border-gray-100" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-800 text-sm">บัตรสะสมแสตมป์</h3>
          <span className="text-green-500 font-bold text-sm">{displayStamps}<span className="text-gray-400 font-normal">/{MAX_STAMPS}</span></span>
        </div>
        <p className="text-xs text-gray-500 mb-4">สะสมครบ 10 ดวง แลกรับของรางวัล</p>
        <div className="h-1.5 bg-gray-100 rounded-full mb-4">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(displayStamps / MAX_STAMPS) * 100}%`, background: "linear-gradient(90deg, #22C55E, #16A34A)" }} />
        </div>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {Array.from({ length: MAX_STAMPS }).map((_, i) => (
            <div key={i}
              data-testid={`stamp-circle-${i}`}
              className={`aspect-square rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                i < displayStamps
                  ? "border-green-400 bg-green-50 text-green-500"
                  : "border-dashed border-gray-300 text-gray-300"
              }`}>
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
          {scanMutation.isPending ? "กำลังบันทึก..." : "สแกน QR รับแสตมป์"}
        </Button>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Gift size={18} className="text-pink-500" />
          <h3 className="font-bold text-gray-800 text-sm">ของรางวัลที่แลกได้</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {rewards.map(({ name, stamps, icon }) => (
            <div key={name} className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 border border-gray-100"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center text-2xl">
                <span role="img" aria-label={name}>{icon}</span>
              </div>
              <p className="text-xs font-semibold text-gray-700 text-center">{name}</p>
              <p className="text-xs text-green-500 font-bold">ใช้ {stamps} แสตมป์</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ActivitiesPage() {
  const [tab, setTab] = useState<"goodness" | "stamp">("goodness");

  return (
    <div className="pb-24 px-4 pt-5">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">กิจกรรมสะสมแต้ม</h1>
        <p className="text-sm text-gray-500 mt-0.5">ทำความดีและคัดแยกขยะเพื่อรับของรางวัล</p>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
        <button
          data-testid="tab-goodness"
          onClick={() => setTab("goodness")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            tab === "goodness" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
          }`}>
          ความดี
        </button>
        <button
          data-testid="tab-stamp"
          onClick={() => setTab("stamp")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            tab === "stamp" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
          }`}>
          ธนาคารขยะ
        </button>
      </div>

      {tab === "goodness" ? <GoodnesTab /> : <StampTab />}
    </div>
  );
}
