"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, BrowserCodeReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { X, CameraOff } from "lucide-react";

interface Props {
  onResult: (text: string) => void;
  onClose: () => void;
}

export function Pdf417Scanner({ onResult, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.PDF_417,
          BarcodeFormat.QR_CODE,
          BarcodeFormat.CODE_128,
          BarcodeFormat.DATA_MATRIX,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 150,
        });

        // List devices and pick the rear camera
        const devices = await BrowserCodeReader.listVideoInputDevices();
        if (cancelled) return;

        if (!devices.length) {
          setError("No camera found on this device");
          return;
        }

        const back =
          devices.find(d => /back|rear|environment/i.test(d.label)) ??
          devices[devices.length - 1];

        const controls = await reader.decodeFromVideoDevice(
          back.deviceId,
          videoRef.current!,
          (result, err) => {
            if (result) {
              controls.stop();
              onResult(result.getText());
            }
            // NotFoundException fires every frame when nothing is found — ignore it
            if (err && err.name !== "NotFoundException") {
              console.warn("ZXing:", err.message);
            }
          }
        );

        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      } catch (e: any) {
        if (!cancelled) {
          const msg = e?.message ?? String(e);
          setError(
            msg.includes("Permission") || msg.includes("NotAllowed")
              ? "Camera permission denied — allow camera access and try again"
              : msg.includes("NotFound") || msg.includes("DevicesNotFound")
              ? "No camera found on this device"
              : `Camera error: ${msg}`
          );
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white shrink-0">
        <div>
          <p className="font-semibold">Scan Licence Disc Barcode</p>
          <p className="text-xs text-white/60">
            Hold the PDF417 barcode steady inside the frame
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Camera feed */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />

        {/* Viewfinder — only shown when camera is live */}
        {!error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {/* Dark surround */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Clear window */}
            <div className="relative z-10 w-80 h-44 bg-transparent">
              {/* Corners */}
              <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary" />
              <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary" />
              <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary" />
              <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary" />
              {/* Animated scan line */}
              <div className="absolute inset-x-2 top-1/2 h-0.5 bg-primary animate-pulse" />
            </div>

            <p className="relative z-10 mt-4 text-white/80 text-sm text-center px-6">
              Align the barcode with the frame — keep it flat and in good light
            </p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4 px-6">
            <CameraOff size={44} className="text-white/40" />
            <p className="text-sm text-white/70 text-center">{error}</p>
            <Button
              variant="outline"
              onClick={onClose}
              className="text-white border-white/30 bg-transparent"
            >
              Close
            </Button>
          </div>
        )}
      </div>

      <div className="p-4 text-center shrink-0">
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
