"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Car, Clock, RefreshCw, ArrowRight, CheckCircle2, Droplets, Sparkles, Info, Phone, User } from "lucide-react";
import Link from "next/link";

type QueueItem = {
  id: string;
  status: string;
  licensePlate: string;
  ownerName: string | null;
  ownerPhone: string | null;
  vehicleType: string | null;
  serviceName: string;
  servicePrice: number;
  totalAmount: number | null;
  paymentMethod: string | null;
  agentName: string | null;
  checkInAt: string;
  completedAt: string | null;
};

const COLUMNS = [
  {
    key: "IN_QUEUE",
    label: "In Queue",
    icon: Clock,
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    action: "Start Wash",
    actionClass: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  {
    key: "WASH_BAY",
    label: "Wash Bay",
    icon: Droplets,
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    action: "Move to Finishing",
    actionClass: "bg-amber-500 hover:bg-amber-600 text-white",
  },
  {
    key: "FINISHING_BAY",
    label: "Finishing",
    icon: Sparkles,
    bg: "bg-purple-50",
    border: "border-purple-200",
    badge: "bg-purple-100 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
    action: "Mark Complete",
    actionClass: "bg-green-600 hover:bg-green-700 text-white",
  },
];

function elapsed(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function AgentPage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingItem, setCompletingItem] = useState<QueueItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [totalAmount, setTotalAmount] = useState("");
  const [advancing, setAdvancing] = useState<string | null>(null);
  const [infoItem, setInfoItem] = useState<QueueItem | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/queue");
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      toast.error("Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const id = setInterval(fetchQueue, 15000);
    return () => clearInterval(id);
  }, [fetchQueue]);

  async function advance(item: QueueItem) {
    if (item.status === "FINISHING_BAY") {
      setCompletingItem(item);
      setTotalAmount(String(item.servicePrice));
      setPaymentMethod("CASH");
      return;
    }
    setAdvancing(item.id);
    try {
      const res = await fetch(`/api/agent/queue/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Status updated");
      await fetchQueue();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setAdvancing(null);
    }
  }

  async function complete() {
    if (!completingItem) return;
    setAdvancing(completingItem.id);
    try {
      const res = await fetch(`/api/agent/queue/${completingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "advance",
          paymentMethod,
          totalAmount: parseFloat(totalAmount) || completingItem.servicePrice,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Vehicle completed!");
      setCompletingItem(null);
      await fetchQueue();
    } catch {
      toast.error("Failed to complete");
    } finally {
      setAdvancing(null);
    }
  }

  const active = items.filter(i => i.status !== "COMPLETED");
  const completed = items.filter(i => i.status === "COMPLETED");
  const todayRevenue = completed.reduce((s, i) => s + (i.totalAmount ?? i.servicePrice), 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Queue</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {active.length} active · {completed.length} completed today
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchQueue} className="gap-1.5 min-h-[44px]">
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Link href="/agent/checkin">
            <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 min-h-[44px]">
              + Check In
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active",    value: active.length,             color: "text-foreground" },
          { label: "In Queue",  value: active.filter(i => i.status === "IN_QUEUE").length,      color: "text-blue-600"   },
          { label: "Washing",   value: active.filter(i => i.status === "WASH_BAY").length,      color: "text-amber-600"  },
          { label: "Today R",   value: `R${todayRevenue.toFixed(0)}`, color: "text-green-600"  },
        ].map(stat => (
          <Card key={stat.label} className="border-[--border]">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kanban columns */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(col => (
            <div key={col.key} className="space-y-3">
              <div className="h-7 w-28 bg-muted rounded-full animate-pulse" />
              {[1, 2].map(i => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(col => {
            const colItems = active.filter(i => i.status === col.key);
            const Icon = col.icon;
            return (
              <div key={col.key} className="space-y-3">
                {/* Column header */}
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className="text-sm font-semibold text-foreground">{col.label}</span>
                  <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full border ${col.badge}`}>
                    {colItems.length}
                  </span>
                </div>

                {/* Empty state */}
                {colItems.length === 0 && (
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center ${col.border}`}>
                    <Icon size={20} className="mx-auto mb-1 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">Empty</p>
                  </div>
                )}

                {/* Cards */}
                {colItems.map(item => (
                  <Card key={item.id} className={`border ${col.border} shadow-sm hover:shadow-md transition-all duration-200`}>
                    <CardContent className="p-4 space-y-3">
                      {/* Plate + price + info */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-md ${col.bg} flex items-center justify-center shrink-0`}>
                            <Car size={14} className="text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground tracking-wider text-sm">{item.licensePlate}</p>
                            <p className="text-xs text-muted-foreground">{item.vehicleType ?? "—"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setInfoItem(item)}
                            className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                            title="Owner info"
                          >
                            <Info size={14} />
                          </button>
                          <Badge variant="outline" className="text-xs font-semibold">
                            R{item.servicePrice}
                          </Badge>
                        </div>
                      </div>

                      {/* Service + owner */}
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-foreground">{item.serviceName}</p>
                        {item.ownerName && (
                          <p className="text-xs text-muted-foreground">{item.ownerName}</p>
                        )}
                      </div>

                      {/* Time + action */}
                      <div className="flex items-center justify-between pt-1 border-t border-[--border]">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock size={10} />
                          {elapsed(item.checkInAt)}
                        </span>
                        <Button
                          size="sm"
                          className={`h-8 text-xs px-3 gap-1 ${col.actionClass}`}
                          disabled={advancing === item.id}
                          onClick={() => advance(item)}
                        >
                          {advancing === item.id
                            ? "..."
                            : <><span>{col.action}</span><ArrowRight size={12} /></>
                          }
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Completed today */}
      {completed.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-500" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Completed Today ({completed.length})
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {completed.slice(0, 10).map(item => (
              <Card key={item.id} className="border-green-100 bg-green-50/50">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-semibold text-sm text-foreground">{item.licensePlate}</p>
                    <button
                      onClick={() => setInfoItem(item)}
                      className="p-0.5 rounded text-muted-foreground hover:text-primary transition-colors shrink-0"
                      title="Owner info"
                    >
                      <Info size={13} />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.serviceName}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-bold text-green-700">R{item.totalAmount ?? item.servicePrice}</p>
                    <span className="text-xs text-muted-foreground">{item.paymentMethod}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Owner info dialog */}
      <Dialog open={!!infoItem} onOpenChange={() => setInfoItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car size={16} className="text-primary" />
              {infoItem?.licensePlate}
            </DialogTitle>
            <DialogDescription>{infoItem?.vehicleType ?? "Unknown vehicle type"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <User size={16} className="text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Owner</p>
                <p className="font-semibold text-foreground">{infoItem?.ownerName ?? "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Phone size={16} className="text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                {infoItem?.ownerPhone
                  ? <a href={`tel:${infoItem.ownerPhone}`} className="font-semibold text-primary">{infoItem.ownerPhone}</a>
                  : <p className="font-semibold text-foreground">—</p>
                }
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Info size={16} className="text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Service</p>
                <p className="font-semibold text-foreground">{infoItem?.serviceName} — <span className="text-primary">R{infoItem?.servicePrice}</span></p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete / payment dialog */}
      <Dialog open={!!completingItem} onOpenChange={() => setCompletingItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-500" />
              Complete Service
            </DialogTitle>
            <DialogDescription>
              {completingItem?.licensePlate} · {completingItem?.serviceName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={val => setPaymentMethod(val || "CASH")}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Total Amount (R)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={totalAmount}
                onChange={e => setTotalAmount(e.target.value)}
                className="min-h-[44px] text-lg font-semibold"
              />
            </div>
            <Button
              className="w-full min-h-[44px] bg-green-600 hover:bg-green-700 text-white font-semibold"
              disabled={!!advancing}
              onClick={complete}
            >
              {advancing ? "Saving..." : "Confirm & Complete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
