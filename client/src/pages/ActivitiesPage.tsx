import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sun, QrCode, Cloud, CheckCircle, Gift, Package, History } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrScanner } from "@/components/QrScanner";
import { Reward, Redemption } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

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

  const { data: freshUser } = useQuery<{ trashPoints: number; stamps: number; merits: number }>({
    queryKey: ["/api/users", user?.id],
    enabled: !!user?.id,
    refetchInterval: 5000,
    staleTime: 0,
  });

  useEffect(() => {
    if (freshUser && user) {
      if (
        freshUser.trashPoints !== user.trashPoints ||
        freshUser.stamps !== user.stamps ||
        freshUser.merits !== user.merits
      ) {
        updateUser({ ...user, ...freshUser });
      }
    }
  }, [freshUser]);

  const trashPts = freshUser?.trashPoints ?? user?.trashPoints ?? 0;
  const totalStamps = freshUser?.stamps ?? user?.stamps ?? 0;
  const remainder = totalStamps % MAX_STAMPS;
  const displayStamps = remainder === 0 && totalStamps > 0 ? MAX_STAMPS : remainder;

  const scanMutation = useMutation({
    mutationFn: (token: string) => apiRequest("POST", "/api/qr/scan", { token, userId: user!.id }),
    onSuccess: async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      updateUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/activities", user!.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user!.id] });
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
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-500">10 แต้มขยะ = 1 แสตมป์ | แสตมป์รวม: <span className="font-semibold text-green-600">{totalStamps}</span></p>
          <p className="text-xs text-gray-400">♻ {trashPts} แต้ม</p>
        </div>
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

function RewardsTab() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rewards, isLoading } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
  });

  const { data: myRedemptions } = useQuery<Redemption[]>({
    queryKey: ["/api/redemptions"],
    enabled: !!user?.id,
  });

  const redeemMutation = useMutation({
    mutationFn: (rewardId: string) => apiRequest("POST", `/api/rewards/${rewardId}/redeem`, {}),
    onSuccess: async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      updateUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/redemptions"] });
      toast({ title: "แลกรับสำเร็จ!", description: data.message });
    },
    onError: (err: any) => {
      toast({ title: "ไม่สำเร็จ", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-fade-in-up stagger-1" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-sm">แต้มขยะของฉัน</h3>
          <span className="text-green-600 font-bold text-lg">♻ {user?.trashPoints ?? 0}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">ใช้แต้มขยะแลกรับของรางวัลด้านล่าง</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse border border-gray-100">
              <div className="h-32 bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                <div className="h-7 bg-gray-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : (rewards ?? []).length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          <Package size={40} className="mx-auto mb-3 text-gray-300" />
          <p>ยังไม่มีของรางวัล</p>
          <p className="text-xs mt-1">รอการเพิ่มของรางวัลจากสภานักเรียน</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {(rewards ?? []).map((r, i) => {
            const canRedeem = (user?.trashPoints ?? 0) >= r.stampCost && r.stock !== 0;
            const soldOut = r.stock === 0;
            return (
              <div key={r.id}
                data-testid={`reward-item-${r.id}`}
                className={`bg-white rounded-2xl overflow-hidden border flex flex-col animate-fade-in-up stagger-${(i % 4) + 1} ${soldOut ? "border-gray-100 opacity-70" : "border-gray-100"}`}
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                {r.imageUrl ? (
                  <div className="relative">
                    <img src={r.imageUrl} alt={r.title} className="w-full h-32 object-cover" />
                    {soldOut && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-xs font-bold bg-red-500 px-2 py-0.5 rounded-full">หมดแล้ว</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center relative">
                    <Gift size={36} className="text-green-400" />
                    {soldOut && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="text-white text-xs font-bold bg-red-500 px-2 py-0.5 rounded-full">หมดแล้ว</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="p-3 flex flex-col flex-1 gap-1.5">
                  <p className="font-bold text-gray-800 text-xs leading-tight line-clamp-2">{r.title}</p>
                  {r.description && <p className="text-[10px] text-gray-400 line-clamp-1">{r.description}</p>}
                  <div className="flex items-center justify-between mt-auto pt-1">
                    <span className="text-xs font-bold text-green-600">♻ {r.stampCost}</span>
                    {r.stock > 0 && <span className="text-[10px] text-gray-400">เหลือ {r.stock}</span>}
                  </div>
                  <Button
                    data-testid={`button-redeem-${r.id}`}
                    className={`w-full rounded-xl h-8 text-xs font-semibold mt-1 ${
                      canRedeem
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                    disabled={!canRedeem || redeemMutation.isPending}
                    onClick={() => {
                      if (!canRedeem) return;
                      if (confirm(`ยืนยันแลกรับ "${r.title}" ใช้ ${r.stampCost} แต้มขยะ?`)) {
                        redeemMutation.mutate(r.id);
                      }
                    }}>
                    {soldOut ? "หมดแล้ว" : !canRedeem ? "แต้มไม่พอ" : "แลกรับ"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(myRedemptions ?? []).length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-fade-in-up" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center gap-2 mb-3">
            <History size={16} className="text-green-500" />
            <h3 className="font-bold text-gray-800 text-sm">ประวัติการแลกของรางวัล</h3>
          </div>
          <div className="space-y-2">
            {(myRedemptions ?? []).map(r => (
              <div key={r.id} data-testid={`redemption-history-${r.id}`} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Gift size={14} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{r.rewardTitle}</p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: th })}
                  </p>
                </div>
                <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">แลกแล้ว</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ActivitiesPage() {
  const [tab, setTab] = useState<"goodness" | "stamp" | "rewards">("goodness");

  const tabIndex = tab === "goodness" ? 0 : tab === "stamp" ? 1 : 2;

  return (
    <div className="pb-24 px-4 pt-5">
      <div className="mb-5 animate-fade-in-up">
        <h1 className="text-xl font-bold text-gray-800">กิจกรรมสะสมแต้ม</h1>
        <p className="text-sm text-gray-500 mt-0.5">ทำความดีและคัดแยกขยะเพื่อรับของรางวัล</p>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 mb-5 animate-fade-in-up stagger-1 relative">
        <div className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm transition-all duration-300"
          style={{ width: "calc(33.33% - 3px)", left: `calc(${tabIndex * 33.33}% + 4px)` }} />
        <button
          data-testid="tab-goodness"
          onClick={() => setTab("goodness")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors relative z-10 ${
            tab === "goodness" ? "text-gray-800" : "text-gray-500"
          }`}>
          ความดี
        </button>
        <button
          data-testid="tab-stamp"
          onClick={() => setTab("stamp")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors relative z-10 ${
            tab === "stamp" ? "text-gray-800" : "text-gray-500"
          }`}>
          ธนาคารขยะ
        </button>
        <button
          data-testid="tab-rewards"
          onClick={() => setTab("rewards")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors relative z-10 ${
            tab === "rewards" ? "text-gray-800" : "text-gray-500"
          }`}>
          ของรางวัล
        </button>
      </div>

      <div key={tab} className="animate-fade-in">
        {tab === "goodness" ? <GoodnesTab /> : tab === "stamp" ? <StampTab /> : <RewardsTab />}
      </div>
    </div>
  );
}
