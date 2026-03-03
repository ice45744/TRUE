import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QrScanner({ onScan, onClose }: QrScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<string>("qr-reader-" + Date.now());
  const scannedRef = useRef(false);

  const startScanner = async () => {
    setError(null);
    setIsStarting(true);
    scannedRef.current = false;

    try {
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch {}
      }

      const scanner = new Html5Qrcode(containerRef.current);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (!scannedRef.current) {
            scannedRef.current = true;
            onScan(decodedText);
            try { scanner.stop(); } catch {}
          }
        },
        () => {}
      );
      setIsStarting(false);
    } catch (err: any) {
      setIsStarting(false);
      if (err?.toString?.().includes("NotAllowedError")) {
        setError("กรุณาอนุญาตให้เข้าถึงกล้อง");
      } else if (err?.toString?.().includes("NotFoundError")) {
        setError("ไม่พบกล้องบนอุปกรณ์นี้");
      } else {
        setError("ไม่สามารถเปิดกล้องได้: " + (err?.message || err?.toString?.() || "Unknown error"));
      }
    }
  };

  useEffect(() => {
    startScanner();
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch {}
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-primary" />
            <h3 className="font-bold text-gray-800 text-sm">สแกน QR Code</h3>
          </div>
          <button
            data-testid="button-close-scanner"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center card-interactive">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="relative bg-black" style={{ minHeight: 300 }}>
          <div id={containerRef.current} className="w-full" />
          {isStarting && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900">
              <div className="w-10 h-10 rounded-full border-3 border-white/30 border-t-white animate-spin" />
              <p className="text-white/70 text-sm">กำลังเปิดกล้อง...</p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 text-center animate-fade-in-up">
            <p className="text-red-500 text-sm mb-3">{error}</p>
            <Button
              data-testid="button-retry-scanner"
              variant="outline"
              size="sm"
              onClick={startScanner}
              className="rounded-xl">
              <RefreshCw size={14} className="mr-1.5" />
              ลองอีกครั้ง
            </Button>
          </div>
        )}

        <div className="px-4 py-3 bg-gray-50 text-center">
          <p className="text-xs text-gray-500">เล็งกล้องไปที่ QR Code เพื่อสแกน</p>
        </div>
      </div>
    </div>
  );
}
