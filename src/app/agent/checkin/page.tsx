"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ScanLine, Loader2, CheckCircle2, ArrowLeft,
  Car, User, Phone, ChevronRight
} from "lucide-react";
import Link from "next/link";

type Service = { id: string; name: string; price: number };

const VEHICLE_TYPES = ["Car", "Bakkies/SUV", "Minibus", "Truck"];

export default function CheckInPage() {
  const router = useRouter();
  const plateInputRef = useRef<HTMLInputElement>(null);
  const [services, setServices] = useState<Service[]>([]);

  const [plate, setPlate] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [carMake, setCarMake] = useState("");
  const [carDescription, setCarDescription] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [isReturning, setIsReturning] = useState(false);

  const [lookingUp, setLookingUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/agent/services")
      .then(r => r.json())
      .then(setServices)
      .catch(() => toast.error("Failed to load services"));
    plateInputRef.current?.focus();
  }, []);

  async function lookupVehicle(licensePlate: string) {
    const p = licensePlate.toUpperCase().trim();
    if (p.length < 3) return;
    setLookingUp(true);
    setIsReturning(false);
    try {
      const res = await fetch(`/api/vehicles?plate=${encodeURIComponent(p)}`);
      if (res.ok) {
        const v = await res.json();
        if (v) {
          setOwnerName(v.ownerName ?? "");
          setOwnerPhone(v.ownerPhone ?? "");
          setVehicleType(v.vehicleType ?? "");
          setCarMake(v.carMake ?? "");
          setCarDescription(v.carDescription ?? "");
          setIsReturning(true);
          toast.info("Returning customer — details loaded");
        } else {
          setOwnerName(""); setOwnerPhone(""); setVehicleType("");
          setCarMake(""); setCarDescription("");
          setIsReturning(false);
        }
      }
    } catch { /* silent */ }
    finally { setLookingUp(false); }
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!plate.trim()) return toast.error("License plate is required");
    if (!serviceId) return toast.error("Please select a service");

    setSubmitting(true);
    try {
      const res = await fetch("/api/agent/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licensePlate: plate.trim().toUpperCase(),
          ownerName: ownerName.trim() || null,
          ownerPhone: ownerPhone.trim() || null,
          vehicleType: vehicleType || null,
          carMake: carMake.trim() || null,
          carDescription: carDescription.trim() || null,
          serviceId,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Vehicle added to queue!");
      router.push("/agent");
    } catch {
      toast.error("Failed to add to queue");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedService = services.find(s => s.id === serviceId);
  const canSubmit = plate.trim().length >= 3 && !!serviceId;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/agent">
          <Button variant="ghost" size="sm" className="gap-1.5 min-h-[44px] text-muted-foreground">
            <ArrowLeft size={16} /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Check In Vehicle</h1>
          <p className="text-xs text-muted-foreground">Scan or enter the licence plate</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Plate ── */}
        <Card className="border-[--border]">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Car size={15} className="text-primary" /> Licence Plate
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="relative">
              <Input
                ref={plateInputRef}
                placeholder="e.g. ABC 123 GP"
                value={plate}
                onChange={e => setPlate(e.target.value.toUpperCase())}
                onBlur={e => lookupVehicle(e.target.value)}
                className="font-mono text-xl tracking-widest uppercase pr-10 min-h-[52px] text-center border-2 focus:border-primary"
                autoComplete="off"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {lookingUp && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
                {isReturning && !lookingUp && <CheckCircle2 size={16} className="text-green-500" />}
              </div>
            </div>

            {/* Scan buttons hidden — not working reliably yet */}

            {isReturning && (
              <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs">
                <CheckCircle2 size={13} />
                Returning customer — details pre-filled below
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Vehicle & Owner ── */}
        <Card className="border-[--border]">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User size={15} className="text-primary" /> Owner & Vehicle
              <span className="ml-auto text-xs text-muted-foreground font-normal">optional</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Vehicle Type</Label>
              <Select value={vehicleType} onValueChange={val => setVehicleType(val || "")}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><User size={11} /> Owner Name</Label>
                <Input
                  placeholder="John Doe"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><Phone size={11} /> Phone</Label>
                <Input
                  placeholder="082 000 0000"
                  type="tel"
                  value={ownerPhone}
                  onChange={e => setOwnerPhone(e.target.value)}
                  className="min-h-[44px]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><Car size={11} /> Car Make</Label>
                <Input
                  placeholder="Toyota, VW, BMW..."
                  value={carMake}
                  onChange={e => setCarMake(e.target.value)}
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Colour / Description</Label>
                <Input
                  placeholder="White Corolla, red..."
                  value={carDescription}
                  onChange={e => setCarDescription(e.target.value)}
                  className="min-h-[44px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Service ── */}
        <Card className="border-[--border]">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ScanLine size={15} className="text-primary" /> Service
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {services.length === 0 && (
              <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">
                <Loader2 size={16} className="animate-spin mr-2" /> Loading...
              </div>
            )}
            {services.map((s, i) => (
              <div key={s.id}>
                <button
                  type="button"
                  onClick={() => setServiceId(s.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all duration-150 min-h-[56px] ${
                    serviceId === s.id
                      ? "border-primary bg-accent"
                      : "border-[--border] hover:border-primary/40 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      serviceId === s.id ? "border-primary" : "border-muted-foreground/30"
                    }`}>
                      {serviceId === s.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span className={`font-medium text-sm ${serviceId === s.id ? "text-primary" : "text-foreground"}`}>
                      {s.name}
                    </span>
                  </div>
                  <Badge variant={serviceId === s.id ? "default" : "outline"} className="text-sm font-bold">
                    R{s.price}
                  </Badge>
                </button>
                {i < services.length - 1 && <Separator className="my-1" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Submit ── */}
        <Button
          type="submit"
          className="w-full min-h-[52px] text-base font-semibold gap-2 bg-primary hover:bg-primary/90"
          disabled={submitting || !canSubmit}
        >
          {submitting ? (
            <><Loader2 size={18} className="animate-spin" /> Adding to Queue...</>
          ) : (
            <>
              Add to Queue
              {selectedService && <Badge variant="secondary" className="ml-1">R{selectedService.price}</Badge>}
              <ChevronRight size={18} className="ml-auto" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
