import { useState } from "react";
import { Link } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Copy, Check, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function QrGeneratorPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"checkin" | "stamp">("checkin");
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateQr = async () => {
    setIsGenerating(true);
    try {
      const res = await apiRequest("POST", "/api/qr/generate", { type: tab });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setQrToken(data.token);
    } catch (err: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToken = () => {
    if (qrToken) {
      navigator.clipboard.writeText(qrToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="pb-24 pt-5 px-4">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/admin">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center cursor-pointer hover-elevate">
            <ArrowLeft size={16} className="text-gray-500" />
          </div>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-800">สร้าง QR Code</h1>
          <p className="text-xs text-gray-400 mt-0.5">สร้าง QR Code สำหรับให้นักเรียนสแกน</p>
        </div>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
        <button
          data-testid="tab-qr-checkin"
          onClick={() => { setTab("checkin"); setQrToken(null); }}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            tab === "checkin" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
          }`}>
          เช็คชื่อ (แต้มความดี)
        </button>
        <button
          data-testid="tab-qr-stamp"
          onClick={() => { setTab("stamp"); setQrToken(null); }}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            tab === "stamp" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
          }`}>
          แสตมป์ขยะ
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 flex flex-col items-center"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>

        {qrToken ? (
          <>
            <div className="p-4 bg-white rounded-xl border-2 border-gray-100 mb-4">
              <QRCodeSVG
                value={qrToken}
                size={220}
                level="H"
                bgColor="#ffffff"
                fgColor="#1a1a1a"
                data-testid="qr-code-display"
              />
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-1">
              {tab === "checkin" ? "QR เช็คชื่อ - แต้มความดี" : "QR แสตมป์ขยะ"}
            </p>
            <p className="text-xs text-gray-400 mb-4 text-center">ให้นักเรียนสแกน QR Code นี้</p>

            <div className="flex gap-2 w-full">
              <Button
                data-testid="button-copy-token"
                variant="outline"
                className="flex-1 rounded-xl text-sm"
                onClick={copyToken}>
                {copied ? <Check size={14} className="mr-1.5 text-green-500" /> : <Copy size={14} className="mr-1.5" />}
                {copied ? "คัดลอกแล้ว" : "คัดลอกโค้ด"}
              </Button>
              <Button
                data-testid="button-regenerate-qr"
                className="flex-1 rounded-xl text-sm"
                onClick={generateQr}
                disabled={isGenerating}>
                <RefreshCw size={14} className="mr-1.5" />
                สร้างใหม่
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <QrCode size={36} className="text-gray-300" />
            </div>
            <p className="text-sm text-gray-500 mb-4 text-center">
              {tab === "checkin"
                ? "สร้าง QR Code สำหรับเช็คชื่อ นักเรียนที่สแกนจะได้รับ 1 แต้มความดี"
                : "สร้าง QR Code สำหรับธนาคารขยะ นักเรียนที่สแกนจะได้รับ 1 แสตมป์"}
            </p>
            <Button
              data-testid="button-generate-qr"
              className="w-full rounded-xl h-11 font-semibold text-sm"
              style={{ background: tab === "checkin" ? "linear-gradient(135deg, #4F8EF7 0%, #2563EB 100%)" : "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)" }}
              onClick={generateQr}
              disabled={isGenerating}>
              <QrCode size={16} className="mr-2" />
              {isGenerating ? "กำลังสร้าง..." : "สร้าง QR Code"}
            </Button>
          </>
        )}
      </div>

      <div className="bg-purple-50 rounded-2xl p-4 mt-4 border border-purple-100">
        <p className="text-xs text-purple-700 leading-relaxed">
          QR Code แต่ละอันสามารถใช้ได้หลายครั้ง แต่นักเรียนคนเดียวกันสแกนได้เพียง 1 ครั้งต่อ QR Code
        </p>
      </div>
    </div>
  );
}
