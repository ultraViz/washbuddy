"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  LayoutDashboard, Settings2, Users, Plus, DollarSign,
  CarFront, Activity, UserPlus, Pencil, Trash2, Loader2
} from "lucide-react";

type Service = { id: string; name: string; price: number };
type Agent   = { id: string; name: string; phone: string | null; email: string | null };
type Metrics = {
  totalWashes: number; totalRevenue: number;
  todayWashes: number; todayRevenue: number; activeQueueCount: number;
};

export default function AdminPage() {
  const [tab, setTab] = useState<"overview" | "services" | "agents">("overview");
  const [metrics, setMetrics]   = useState<Metrics | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [agents, setAgents]     = useState<Agent[]>([]);
  const [loading, setLoading]   = useState(true);

  // ── Service modal ──────────────────────────────────────────────────────────
  const [sOpen, setSOpen]       = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [sName, setSName]       = useState("");
  const [sPrice, setSPrice]     = useState("");
  const [sSaving, setSSaving]   = useState(false);
  const [deletingService, setDeletingService] = useState<string | null>(null);

  // ── Agent modal ────────────────────────────────────────────────────────────
  const [aOpen, setAOpen]       = useState(false);
  const [aName, setAName]       = useState("");
  const [aPhone, setAPhone]     = useState("");
  const [aEmail, setAEmail]     = useState("");
  const [aPassword, setAPassword] = useState("password123");
  const [aSaving, setASaving]   = useState(false);
  const [deletingAgent, setDeletingAgent] = useState<string | null>(null);

  // ── Confirm delete dialog ──────────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState<{ type: "service" | "agent"; id: string; name: string } | null>(null);

  const load = useCallback(async (t: string) => {
    setLoading(true);
    try {
      if (t === "overview") {
        const r = await fetch("/api/admin/dashboard");
        if (r.ok) setMetrics(await r.json());
      } else if (t === "services") {
        const r = await fetch("/api/admin/services");
        if (r.ok) setServices(await r.json());
      } else if (t === "agents") {
        const r = await fetch("/api/admin/agents");
        if (r.ok) setAgents(await r.json());
      }
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  function openAddService() {
    setEditService(null);
    setSName(""); setSPrice("");
    setSOpen(true);
  }

  function openEditService(s: Service) {
    setEditService(s);
    setSName(s.name); setSPrice(String(s.price));
    setSOpen(true);
  }

  async function saveService(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSSaving(true);
    try {
      const url    = editService ? `/api/admin/services/${editService.id}` : "/api/admin/services";
      const method = editService ? "PATCH" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: sName, price: sPrice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editService ? "Service updated!" : "Service added!");
      setSOpen(false);
      load("services");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally { setSSaving(false); }
  }

  async function deleteService(id: string) {
    setDeletingService(id);
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Service deleted");
      setConfirmDelete(null);
      load("services");
    } catch { toast.error("Failed to delete service"); }
    finally { setDeletingService(null); }
  }

  async function createAgent(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setASaving(true);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: aName, phone: aPhone, email: aEmail, password: aPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Agent created!");
      setAOpen(false);
      setAName(""); setAPhone(""); setAEmail(""); setAPassword("password123");
      load("agents");
    } catch (err: any) {
      toast.error(err.message || "Failed to create agent");
    } finally { setASaving(false); }
  }

  async function deleteAgent(id: string) {
    setDeletingAgent(id);
    try {
      const res = await fetch(`/api/admin/agents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Agent removed");
      setConfirmDelete(null);
      load("agents");
    } catch { toast.error("Failed to delete agent"); }
    finally { setDeletingAgent(null); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Business Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your operations, services, and team.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {([
          { key: "overview",  label: "Overview",  icon: LayoutDashboard },
          { key: "services",  label: "Services",  icon: Settings2 },
          { key: "agents",    label: "Agents",    icon: Users },
        ] as const).map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={tab === key ? "default" : "ghost"}
            onClick={() => setTab(key)}
            className="gap-2 min-h-[44px]"
          >
            <Icon size={16} /> {label}
          </Button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-muted rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* ── OVERVIEW ── */}
            {tab === "overview" && metrics && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: "Today's Revenue",  value: `R ${metrics.todayRevenue.toFixed(0)}`,        icon: DollarSign, color: "bg-green-100 text-green-600" },
                    { label: "Today's Washes",   value: metrics.todayWashes,                           icon: CarFront,   color: "bg-blue-100 text-blue-600"  },
                    { label: "Active in Queue",  value: metrics.activeQueueCount,                      icon: Activity,   color: "bg-amber-100 text-amber-600" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${color}`}><Icon size={20} /></div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{label}</p>
                          <p className="text-2xl font-bold">{value}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-muted/30">
                    <CardContent className="p-6">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Total Revenue (All Time)</p>
                      <p className="text-4xl font-extrabold">R {metrics.totalRevenue.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30">
                    <CardContent className="p-6">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Total Washes (All Time)</p>
                      <p className="text-4xl font-extrabold">{metrics.totalWashes.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ── SERVICES ── */}
            {tab === "services" && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={openAddService} className="gap-2 bg-primary min-h-[44px]">
                    <Plus size={16} /> Add Service
                  </Button>
                </div>
                {services.length === 0 ? (
                  <div className="border-2 border-dashed p-12 text-center rounded-xl text-muted-foreground">
                    No services yet. Add one to get started.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {services.map(s => (
                      <Card key={s.id} className="hover:border-primary/40 transition-colors">
                        <CardContent className="p-4 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{s.name}</p>
                            <Badge variant="outline" className="mt-1 text-primary border-primary/30">R {s.price}</Badge>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost" size="icon"
                              className="h-9 w-9 text-muted-foreground hover:text-primary"
                              onClick={() => openEditService(s)}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="h-9 w-9 text-muted-foreground hover:text-destructive"
                              onClick={() => setConfirmDelete({ type: "service", id: s.id, name: s.name })}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── AGENTS ── */}
            {tab === "agents" && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => setAOpen(true)} className="gap-2 bg-primary min-h-[44px]">
                    <UserPlus size={16} /> Add Agent
                  </Button>
                </div>
                {agents.length === 0 ? (
                  <div className="border-2 border-dashed p-12 text-center rounded-xl text-muted-foreground">
                    No agents registered yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agents.map(a => (
                      <Card key={a.id}>
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="bg-primary/10 text-primary w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                            {a.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground truncate">{a.name}</p>
                            {a.email && <p className="text-xs text-muted-foreground truncate">{a.email}</p>}
                            {a.phone && <p className="text-xs text-muted-foreground">{a.phone}</p>}
                          </div>
                          <Button
                            variant="ghost" size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => setConfirmDelete({ type: "agent", id: a.id, name: a.name })}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Service add/edit modal ── */}
      <Dialog open={sOpen} onOpenChange={setSOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editService ? "Edit Service" : "Add Service"}</DialogTitle>
            <DialogDescription>
              {editService ? `Editing "${editService.name}"` : "Add a new wash service and price."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveService} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Service Name</Label>
              <Input required value={sName} onChange={e => setSName(e.target.value)} placeholder="e.g. Wash & Go" className="min-h-[44px]" />
            </div>
            <div className="space-y-1.5">
              <Label>Price (R)</Label>
              <Input required type="number" min="0" step="0.01" value={sPrice} onChange={e => setSPrice(e.target.value)} placeholder="150" className="min-h-[44px]" />
            </div>
            <Button type="submit" className="w-full min-h-[44px] bg-primary" disabled={sSaving}>
              {sSaving ? <><Loader2 size={16} className="animate-spin mr-2" />Saving...</> : (editService ? "Save Changes" : "Add Service")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Agent add modal ── */}
      <Dialog open={aOpen} onOpenChange={setAOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Agent</DialogTitle>
            <DialogDescription>Create a login account for a new agent.</DialogDescription>
          </DialogHeader>
          <form onSubmit={createAgent} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input required value={aName} onChange={e => setAName(e.target.value)} placeholder="Alice Dlamini" className="min-h-[44px]" />
            </div>
            <div className="space-y-1.5">
              <Label>Email (Login) *</Label>
              <Input required type="email" value={aEmail} onChange={e => setAEmail(e.target.value)} placeholder="alice@washbuddy.com" className="min-h-[44px]" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={aPhone} onChange={e => setAPhone(e.target.value)} placeholder="082 000 0000" className="min-h-[44px]" />
            </div>
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <Input required value={aPassword} onChange={e => setAPassword(e.target.value)} className="min-h-[44px]" />
            </div>
            <Button type="submit" className="w-full min-h-[44px] bg-primary" disabled={aSaving}>
              {aSaving ? <><Loader2 size={16} className="animate-spin mr-2" />Creating...</> : "Create Agent"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Confirm delete ── */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {confirmDelete?.type === "service" ? "Service" : "Agent"}?</DialogTitle>
            <DialogDescription>
              <span className="font-semibold">"{confirmDelete?.name}"</span> will be permanently removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 min-h-[44px]" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 min-h-[44px]"
              disabled={!!deletingService || !!deletingAgent}
              onClick={() => {
                if (!confirmDelete) return;
                if (confirmDelete.type === "service") deleteService(confirmDelete.id);
                else deleteAgent(confirmDelete.id);
              }}
            >
              {(deletingService || deletingAgent)
                ? <Loader2 size={16} className="animate-spin" />
                : "Delete"
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
