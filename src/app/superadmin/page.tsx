"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Users, Plus, Star, ShieldCheck } from "lucide-react";

type Admin = {
  id: string;
  name: string | null;
  email: string;
};

type Business = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  admins: Admin[];
};

export default function SuperAdminPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [bName, setBName] = useState("");
  const [bEmail, setBEmail] = useState("");
  const [bPhone, setBPhone] = useState("");
  const [bAddress, setBAddress] = useState("");
  
  const [aName, setAName] = useState("");
  const [aEmail, setAEmail] = useState("");
  const [aPassword, setAPassword] = useState("password123");

  const fetchBusinesses = useCallback(async () => {
    try {
      const res = await fetch("/api/superadmin/businesses");
      if (!res.ok) throw new Error();
      setBusinesses(await res.json());
    } catch {
      toast.error("Failed to load businesses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  async function createBusiness(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/superadmin/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: bName,
          email: bEmail,
          phone: bPhone,
          address: bAddress,
          adminName: aName,
          adminEmail: aEmail,
          adminPassword: aPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      toast.success("Business and Admin created successfully!");
      setIsCreating(false);
      resetForm();
      fetchBusinesses();
    } catch (err: any) {
      toast.error(err.message || "Failed to create business");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setBName("");
    setBEmail("");
    setBPhone("");
    setBAddress("");
    setAName("");
    setAEmail("");
    setAPassword("password123");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl">
            <ShieldCheck size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Super Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage all businesses and platform activity
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus size={16} /> New Business
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[--border]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-full">
              <Building2 className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Total Businesses</p>
              <p className="text-3xl font-bold mt-1">{businesses.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business List */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-32 bg-muted rounded-xl" />
        </div>
      ) : businesses.length === 0 ? (
        <div className="border-2 border-dashed rounded-xl p-12 text-center border-muted">
          <Building2 size={40} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">No businesses registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {businesses.map((b) => (
            <Card key={b.id} className="border-[--border] shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between items-start">
                  <span className="font-bold">{b.name}</span>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted/50">
                    Active
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-1">
                  {b.address && <p>{b.address}</p>}
                  {b.email && <p>{b.email}</p>}
                  {b.phone && <p>{b.phone}</p>}
                </div>
                
                <div className="bg-muted/30 rounded-lg p-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Star size={12} /> Administrators
                  </h4>
                  {b.admins.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No admins</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {b.admins.map(a => (
                        <li key={a.id} className="text-sm flex items-center gap-2">
                          <div className="w-6 h-6 bg-primary/20 text-primary rounded-full flex justify-center items-center font-bold text-xs">
                            {a.name ? a.name[0].toUpperCase() : a.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground leading-none">{a.name || 'Admin'}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{a.email}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Onboard New Business</DialogTitle>
            <DialogDescription>
              Create a new business entity and its primary Admin account.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={createBusiness} className="space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">Business Details</h3>
                <div className="space-y-2">
                  <Label>Business Name *</Label>
                  <Input required value={bName} onChange={e => setBName(e.target.value)} placeholder="e.g. WashBuddy Cape Town" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={bEmail} onChange={e => setBEmail(e.target.value)} placeholder="hello@washbuddy.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={bPhone} onChange={e => setBPhone(e.target.value)} placeholder="+27..." />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={bAddress} onChange={e => setBAddress(e.target.value)} placeholder="123 Wash Street" />
                </div>
              </div>

              {/* Admin Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2 mt-4 md:mt-0">Admin Account</h3>
                <div className="space-y-2">
                  <Label>Admin Name</Label>
                  <Input value={aName} onChange={e => setAName(e.target.value)} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Admin Email (Login) *</Label>
                  <Input required type="email" value={aEmail} onChange={e => setAEmail(e.target.value)} placeholder="john@washbuddy.com" />
                </div>
                <div className="space-y-2">
                  <Label>Initial Password *</Label>
                  <Input required value={aPassword} onChange={e => setAPassword(e.target.value)} />
                  <p className="text-xs text-muted-foreground">They can change this later.</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary" disabled={submitting}>
                {submitting ? "Creating..." : "Create Business & Admin"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
