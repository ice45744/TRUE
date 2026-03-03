import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Copy, Check, RefreshCw, ArrowLeft, Clock, Shield, Recycle, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function QrGeneratorPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"checkin" | "stamp">("checkin");
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiryMinutes, setExpiryMinutes] = useState(5);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isPermanent, setIsPermanent] = useState(false);
  const [existingCheckin, setExistingCheckin] = useState<{ token: string; usedCount: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadExistingCheckin();
  }, []);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!expiresAt) { setTimeLeft(null); return; }
    const update = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setTimeLeft(0);
        setQrToken(null);
        setExpiresAt(null);
        toast({ title: "QR Code หมดอายุ", description: "กรุณาสร้าง QR Code ใหม่", variant: "destructive" });
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setTimeLeft(Math.ceil(ms / 1000));
      }
    };
    update();
    timerRef.current = setInterval(update, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [expiresAt]);

  const loadExistingCheckin = async () => {
    try {
      const res = await apiRequest("GET", "/api/qr/checkin");
      const data = await res.json();
      if (data.exists) {
        setExistingCheckin({ token: data.token, usedCount: data.usedCount });
      }
    } catch {}
  };

  const generateQr = async () => {
    setIsGenerating(true);
    try {
      const body: any = { type: tab };
      if (tab === "stamp") body.expiryMinutes = expiryMinutes;
      const res = await apiRequest("POST", "/api/qr/generate", body);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setQrToken(data.token);
      setIsPermanent(data.permanent);
      setExpiresAt(data.expiresAt);
      if (tab === "checkin") {
        setExistingCheckin({ token: data.token, usedCount: 0 });
      }
    } catch (err: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const showExistingCheckin = () => {
    if (existingCheckin) {
      setQrToken(existingCheckin.token);
      setIsPermanent(true);
      setExpiresAt(null);
    }
  };

  const copyToken = () => {
    if (qrToken) {
      navigator.clipboard.writeText(qrToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="pb-24 pt-5 px-4">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/admin">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center cursor-pointer hover-elevate" data-testid="button-back-admin">
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
          onClick={() => { setTab("checkin"); setQrToken(null); setExpiresAt(null); }}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            tab === "checkin" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
          }`}>
          <Shield size={14} />
          เช็คชื่อ
        </button>
        <button
          data-testid="tab-qr-stamp"
          onClick={() => { setTab("stamp"); setQrToken(null); setExpiresAt(null); }}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            tab === "stamp" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
          }`}>
          <Recycle size={14} />
          ธนาคารขยะ
        </button>
      </div>

      {tab === "checkin" && (
        <div className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-100">
          <div className="flex items-start gap-2">
            <Clock size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-700">QR ถาวร · ใช้ได้ 06:00 - 08:00 น.</p>
              <p className="text-xs text-blue-500 mt-1">QR Code นี้ใช้ได้ตลอด ไม่หมดอายุ แต่นักเรียนสแกนได้เฉพาะเวลา 6 โมงเช้าถึง 8 โมงเช้า สแกนได้คนละ 1 ครั้ง/วัน</p>
            </div>
          </div>
        </div>
      )}

      {tab === "stamp" && (
        <>
          <div className="bg-green-50 rounded-2xl p-4 mb-4 border border-green-100">
            <div className="flex items-start gap-2">
              <Timer size={16} className="text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-700">QR ใช้ครั้งเดียว · มีเวลาจำกัด</p>
                <p className="text-xs text-green-600 mt-1">QR Code นี้ใช้ได้แค่ 1 คน ต้องสร้างใหม่ทุกครั้ง และจะหมดอายุตามเวลาที่กำหนด</p>
              </div>
            </div>
          </div>

          {!qrToken && (
            <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <p className="text-sm font-semibold text-gray-700 mb-3">เวลาหมดอายุ</p>
              <div className="flex gap-2">
                {[1, 2, 5].map((m) => (
                  <button
                    key={m}
                    data-testid={`button-expiry-${m}`}
                    onClick={() => setExpiryMinutes(m)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                      expiryMinutes === m
                        ? "bg-green-500 text-white border-green-500"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}>
                    {m} นาที
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="bg-white rounded-2xl p-6 border border-gray-100 flex flex-col items-center"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>

        {qrToken ? (
          <>
            {!isPermanent && timeLeft !== null && (
              <div className={`w-full rounded-xl px-4 py-2 mb-4 flex items-center justify-center gap-2 ${
                timeLeft <= 30 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
              }`}>
                <Timer size={14} />
                <span className="text-sm font-bold" data-testid="text-countdown">{formatTime(timeLeft)}</span>
                <span className="text-xs">เหลือ</span>
              </div>
            )}

            {isPermanent && (
              <div className="w-full rounded-xl px-4 py-2 mb-4 flex items-center justify-center gap-2 bg-blue-50 text-blue-600">
                <Shield size={14} />
                <span className="text-xs font-semibold">QR ถาวร · ใช้ได้ 06:00 - 08:00 น.</span>
              </div>
            )}

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
              {tab === "checkin" ? "QR เช็คชื่อ - แต้มความดี" : "QR ธนาคารขยะ"}
            </p>
            <p className="text-xs text-gray-400 mb-4 text-center">
              {tab === "checkin"
                ? "นักเรียนสแกนเพื่อเช็คชื่อ +1 แต้มความดี"
                : "ให้นักเรียนสแกน QR Code นี้ (ใช้ได้ 1 คน)"}
            </p>

            <div className="flex gap-2 w-full">
              <Button
                data-testid="button-copy-token"
                variant="outline"
                className="flex-1 rounded-xl text-sm"
                onClick={copyToken}>
                {copied ? <Check size={14} className="mr-1.5 text-green-500" /> : <Copy size={14} className="mr-1.5" />}
                {copied ? "คัดลอกแล้ว" : "คัดลอกโค้ด"}
              </Button>
              {tab === "stamp" && (
                <Button
                  data-testid="button-regenerate-qr"
                  className="flex-1 rounded-xl text-sm"
                  style={{ background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)" }}
                  onClick={generateQr}
                  disabled={isGenerating}>
                  <RefreshCw size={14} className="mr-1.5" />
                  สร้างใหม่
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 ${
              tab === "checkin" ? "bg-blue-50" : "bg-green-50"
            }`}>
              {tab === "checkin"
                ? <Shield size={36} className="text-blue-300" />
                : <Recycle size={36} className="text-green-300" />}
            </div>

            {tab === "checkin" && existingCheckin ? (
              <>
                <p className="text-sm text-gray-600 mb-1 text-center font-semibold">มี QR เช็คชื่อถาวรอยู่แล้ว</p>
                <p className="text-xs text-gray-400 mb-4 text-center">ถูกใช้ไปแล้ว {existingCheckin.usedCount} ครั้ง</p>
                <Button
                  data-testid="button-show-existing-qr"
                  className="w-full rounded-xl h-11 font-semibold text-sm mb-2"
                  style={{ background: "linear-gradient(135deg, #4F8EF7 0%, #2563EB 100%)" }}
                  onClick={showExistingCheckin}>
                  <QrCode size={16} className="mr-2" />
                  แสดง QR Code
                </Button>
                <Button
                  data-testid="button-generate-new-checkin"
                  variant="outline"
                  className="w-full rounded-xl h-11 font-semibold text-sm"
                  onClick={generateQr}
                  disabled={isGenerating}>
                  <RefreshCw size={16} className="mr-2" />
                  {isGenerating ? "กำลังสร้าง..." : "สร้าง QR ใหม่ (แทนอันเก่า)"}
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4 text-center">
                  {tab === "checkin"
                    ? "สร้าง QR Code ถาวรสำหรับเช็คชื่อ นักเรียนสแกนได้เฉพาะ 06:00-08:00 น. ได้รับ 1 แต้มความดี"
                    : `สร้าง QR Code ธนาคารขยะ ใช้ได้ 1 คน หมดอายุใน ${expiryMinutes} นาที ได้รับ 1 แต้มขยะ`}
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
          </>
        )}
      </div>

      <div className={`rounded-2xl p-4 mt-4 border ${tab === "checkin" ? "bg-blue-50 border-blue-100" : "bg-green-50 border-green-100"}`}>
        <p className={`text-xs leading-relaxed ${tab === "checkin" ? "text-blue-700" : "text-green-700"}`}>
          {tab === "checkin"
            ? "💡 QR เช็คชื่อเป็นแบบถาวร ใช้ได้ทุกวัน เฉพาะ 06:00-08:00 น. นักเรียนแต่ละคนสแกนได้ 1 ครั้ง ทุก 10 แต้มความดี = 1 แสตมป์"
            : "💡 QR ธนาคารขยะใช้ได้แค่ 1 คน ต้องสร้างใหม่ทุกครั้ง ทุก 10 แต้มขยะ = 1 แสตมป์"}
        </p>
      </div>
    </div>
  );
}
