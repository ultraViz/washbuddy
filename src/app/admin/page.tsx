"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  LayoutDashboard, 
  Settings2, 
  Users, 
  Plus, 
  DollarSign, 
  CarFront, 
  Activity, 
  UserPlus
} from "lucide-react";

type Service = {
  id: string;
  name: string;
  price: number;
};

type Agent = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

type Metrics = {
  totalWashes: number;
  totalRevenue: number;
  todayWashes: number;
  todayRevenue: number;
  activeQueueCount: number;
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "services" | "agents">("overview");
  
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  
  const [loading, setLoading] = useState(true);

  // Modals
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);

  // Forms
  const [sName, setSName] = useState("");
  const [sPrice, setSPrice] = useState("");
  const [sSubmitting, setSSubmitting] = useState(false);

  const [aName, setAName] = useState("");
  const [aPhone, setAPhone] = useState("");
  const [aEmail, setAEmail] = useState("");
  const [aPassword, setAPassword] = useState("password123");
  const [aSubmitting, setASubmitting] = useState(false);

  const fetchData = useCallback(async (tab: string) => {
    setLoading(true);
    try {
      if (tab === "overview") {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) setMetrics(await res.json());
      } else if (tab === "services") {
        const res = await fetch("/api/admin/services");
        if (res.ok) setServices(await res.json());
      } else if (tab === "agents") {
        const res = await fetch("/api/admin/agents");
        if (res.ok) setAgents(await res.json());
      }
    } catch {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, fetchData]);

  async function createService(e: React.FormEvent) {
    e.preventDefault();
    setSSubmitting(true);
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: sName, price: sPrice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Service added!");
      setIsServiceModalOpen(false);
      setSName("");
      setSPrice("");
      fetchData("services");
    } catch (err: any) {
      toast.error(err.message || "Failed to add service");
    } finally {
      setSSubmitting(false);
    }
  }

  async function createAgent(e: React.FormEvent) {
    e.preventDefault();
    setASubmitting(true);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: aName, phone: aPhone, email: aEmail, password: aPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Agent user created!");
      setIsAgentModalOpen(false);
      setAName("");
      setAPhone("");
      setAEmail("");
      setAPassword("password123");
      fetchData("agents");
    } catch (err: any) {
      toast.error(err.message || "Failed to create agent");
    } finally {
      setASubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Business Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your operations, services, and team.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        <Button 
          variant={activeTab === "overview" ? "default" : "ghost"} 
          onClick={() => setActiveTab("overview")}
          className="gap-2"
        >
          <LayoutDashboard size={16} /> Overview
        </Button>
        <Button 
          variant={activeTab === "services" ? "default" : "ghost"} 
          onClick={() => setActiveTab("services")}
          className="gap-2"
        >
          <Settings2 size={16} /> Services
        </Button>
        <Button 
          variant={activeTab === "agents" ? "default" : "ghost"} 
          onClick={() => setActiveTab("agents")}
          className="gap-2"
        >
          <Users size={16} /> Agents
        </Button>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
            <div className="h-32 bg-muted rounded-xl" />
            <div className="h-32 bg-muted rounded-xl" />
            <div className="h-32 bg-muted rounded-xl" />
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && metrics && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-xl">
                        <DollarSign className="text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Today's Revenue</p>
                        <p className="text-2xl font-bold text-green-600">R {metrics.todayRevenue.toFixed(0)}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-xl">
                        <CarFront className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Today's Washes</p>
                        <p className="text-2xl font-bold text-blue-600">{metrics.todayWashes}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="bg-amber-100 dark:bg-amber-900/40 p-3 rounded-xl">
                        <Activity className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Active in Queue</p>
                        <p className="text-2xl font-bold text-amber-600">{metrics.activeQueueCount}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* All time stats */}
                <h3 className="text-lg font-bold pt-4">All Time Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-muted/30">
                    <CardContent className="p-6">
                      <p className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-2"><DollarSign size={16}/> Total Collected (ZAR)</p>
                      <p className="text-4xl font-extrabold text-foreground">R {metrics.totalRevenue.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30">
                    <CardContent className="p-6">
                      <p className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-2"><CarFront size={16}/> Total Washes</p>
                      <p className="text-4xl font-extrabold text-foreground">{metrics.totalWashes.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* SERVICES TAB */}
            {activeTab === "services" && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => setIsServiceModalOpen(true)} className="gap-2 bg-primary">
                    <Plus size={16} /> Add Service
                  </Button>
                </div>
                {services.length === 0 ? (
                  <div className="border-2 border-dashed p-12 text-center rounded-xl text-muted-foreground">
                    No services. Add some to get started.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {services.map(s => (
                      <Card key={s.id} className="hover:border-primary/50 transition-colors">
                        <CardContent className="p-4 flex justify-between items-center">
                          <span className="font-semibold text-foreground">{s.name}</span>
                          <Badge variant="outline" className="text-sm border-primary/20 text-primary">R {s.price}</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AGENTS TAB */}
            {activeTab === "agents" && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => setIsAgentModalOpen(true)} className="gap-2 bg-primary">
                    <UserPlus size={16} /> Onboard Agent
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
                        <CardContent className="p-5 flex items-center gap-4">
                          <div className="bg-primary/10 text-primary w-12 h-12 rounded-full flex justify-center items-center font-bold text-lg shrink-0">
                            {a.name?.[0].toUpperCase() || '?'}
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="font-bold text-foreground truncate">{a.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">{a.email}</p>
                            {a.phone && <p className="text-xs text-muted-foreground truncate">{a.phone}</p>}
                          </div>
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

      {/* Service Modal */}
      <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
          </DialogHeader>
          <form onSubmit={createService} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Service Name</Label>
              <Input required value={sName} onChange={e => setSName(e.target.value)} placeholder="e.g. Wash & Go" />
            </div>
            <div className="space-y-2">
              <Label>Price (ZAR)</Label>
              <Input required type="number" min="0" step="0.01" value={sPrice} onChange={e => setSPrice(e.target.value)} placeholder="150" />
            </div>
            <Button type="submit" className="w-full bg-primary" disabled={sSubmitting}>
              {sSubmitting ? "Saving..." : "Save Service"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Agent Modal */}
      <Dialog open={isAgentModalOpen} onOpenChange={setIsAgentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Onboard New Agent</DialogTitle>
          </DialogHeader>
          <form onSubmit={createAgent} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Agent Name *</Label>
              <Input required value={aName} onChange={e => setAName(e.target.value)} placeholder="Alice" />
            </div>
            <div className="space-y-2">
              <Label>Email (Login) *</Label>
              <Input required type="email" value={aEmail} onChange={e => setAEmail(e.target.value)} placeholder="alice@washbuddy.com" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={aPhone} onChange={e => setAPhone(e.target.value)} placeholder="082..." />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input required value={aPassword} onChange={e => setAPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full bg-primary" disabled={aSubmitting}>
              {aSubmitting ? "Creating..." : "Create Agent Profille"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
