"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { X, CameraOff } from "lucide-react";

interface Props {
  onResult: (text: string) => void;
  onClose: () => void;
}

export function Pdf417Scanner({ onResult, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.PDF_417, BarcodeFormat.QR_CODE, BarcodeFormat.CODE_128]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 200 });
    readerRef.current = reader;

    reader
      .listVideoInputDevices()
      .then(devices => {
        // Prefer back/environment camera
        const back = devices.find(d =>
          /back|rear|environment/i.test(d.label)
        ) ?? devices[devices.length - 1];

        if (!back) {
          setError("No camera found");
          setScanning(false);
          return;
        }

        return reader.decodeFromVideoDevice(back.deviceId, videoRef.current!, (result, err) => {
          if (result) {
            setScanning(false);
            onResult(result.getText());
          }
          if (err && !(err.message?.includes("No MultiFormat"))) {
            // Ignore "not found" errors — they fire every frame
          }
        });
      })
      .catch(e => {
        setError(e?.message ?? "Camera access denied");
        setScanning(false);
      });

    return () => {
      reader.reset();
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <div>
          <p className="font-semibold">Scan Licence Disc Barcode</p>
          <p className="text-xs text-white/60">Point at the PDF417 barcode on the disc</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Video */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />

        {/* Viewfinder overlay */}
        {scanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-72 h-40">
              {/* Corner brackets */}
              <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-sm" />
              <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-sm" />
              <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-sm" />
              <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-sm" />
              {/* Scan line */}
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary/70 animate-pulse" />
            </div>
            <p className="absolute bottom-16 text-white/80 text-sm">Align barcode within the frame</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3">
            <CameraOff size={40} className="text-white/50" />
            <p className="text-sm text-white/70">{error}</p>
            <Button variant="outline" onClick={onClose} className="text-white border-white/30">
              Close
            </Button>
          </div>
        )}
      </div>

      <div className="p-4 text-center">
        <Button
          variant="ghost"
          className="text-white/70 hover:text-white hover:bg-white/10"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
