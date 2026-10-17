import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Users, UserPlus, Wrench, Trash2, Loader2, Mail } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import EmptyState from "@/components/EmptyState";
import { useCurrentUser } from "@/lib/useCurrentUser";

export default function MaintenanceTeam() {
  const { user: me, role, isAdmin } = useCurrentUser();
  const [staff, setStaff] = useState([]);
  const [others, setOthers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [staffList, all] = await Promise.all([
        base44.entities.User.filter({ appRole: "staff" }),
        base44.entities.User.list(),
      ]);
      setStaff(staffList.items || staffList || []);
      setOthers((all.items || all || []).filter((u) => u.appRole !== "staff"));
    } finally {
      setLoading(false);
    }
  }, [me?.id]);

  useEffect(() => { load(); }, [load]);

  const addStaff = async () => {
    const clean = email.trim().toLowerCase();
    if (!clean) return;
    setBusy(true);
    try {
      const existing = others.find((u) => (u.email || "").toLowerCase() === clean);
      if (existing && existing.role === "admin") {
        toast({ title: "Not allowed", description: "Administrators cannot be added as maintenance staff.", variant: "destructive" });
        return;
      }
      if (existing) {
        await base44.entities.User.update(existing.id, { appRole: "staff", departmentOrBuilding: department.trim() });
        toast({ title: "Staff member added", description: `${existing.full_name || existing.email} can now handle maintenance tasks.` });
      } else {
        toast({ title: "User not found", description: `No joined user with email ${clean}. Ask them to register first, then add them here.`, variant: "destructive" });
        return;
      }
      setEmail("");
      setDepartment("");
      load();
    } catch (err) {
      toast({ title: "Could not add staff", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const makeStaff = async (u) => {
    await base44.entities.User.update(u.id, { appRole: "staff" });
    toast({ title: "Staff member added", description: `${u.full_name || u.email} can now handle maintenance tasks.` });
    load();
  };

  const removeStaff = async (u) => {
    await base44.entities.User.update(u.id, { appRole: "reporter" });
    toast({ title: "Removed from team", description: `${u.full_name || u.email} is now a regular reporter.` });
    load();
  };

  if (!isAdmin) return <Navigate to="/reporter" replace />;

  return (
    <div className="px-5 sm:px-8 py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl tracking-tight">Maintenance Team</h1>
        <p className="text-muted-foreground mt-1">Add staff who receive and resolve maintenance complaints.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft p-5 sm:p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-[hsl(var(--brand-blue))]" />
          <h2 className="font-display font-semibold">Add a staff member</h2>
        </div>
        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div>
            <Label>Existing user</Label>
            <Select value={email} onValueChange={setEmail}>
              <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="Select a user" /></SelectTrigger>
              <SelectContent>
                {others.map((u) => (
                  <SelectItem key={u.id} value={u.email}>{u.full_name || u.email}{u.role === "admin" ? " (admin)" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="staff-dept">Department / Building (optional)</Label>
            <Input id="staff-dept" className="mt-1.5 h-11" placeholder="e.g. Electrical — Block A" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>
          <Button onClick={addStaff} disabled={busy || !email.trim()} className="h-11 gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Staff are chosen from users who have already registered with the app.</p>
      </div>

      <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
        <Wrench className="w-4 h-4 text-[hsl(var(--brand-orange))]" /> Current team
      </h2>
      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden mb-8">
        {loading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : staff.length === 0 ? (
          <div className="p-2"><EmptyState icon={Users} title="No staff yet" description="Add your first maintenance staff member above." /></div>
        ) : (
          <div className="divide-y divide-border/60">
            {staff.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center font-semibold text-sm shrink-0">
                  {(u.full_name || u.email || "U").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{u.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}{u.departmentOrBuilding ? ` · ${u.departmentOrBuilding}` : ""}</p>
                </div>
                {u.id !== me?.id && (
                  <Button variant="ghost" size="sm" onClick={() => removeStaff(u)} className="gap-1.5 text-destructive hover:text-destructive shrink-0">
                    <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Remove</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
        <Mail className="w-4 h-4 text-muted-foreground" /> Other users
      </h2>
      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : others.length === 0 ? (
          <div className="p-2"><EmptyState icon={Users} title="No other users" description="Users who join without staff access appear here." /></div>
        ) : (
          <div className="divide-y divide-border/60">
            {others.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center font-semibold text-sm shrink-0">
                  {(u.full_name || u.email || "U").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{u.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}{u.role === "admin" ? " · Administrator" : ""}</p>
                </div>
                {u.role !== "admin" && (
                  <Button variant="outline" size="sm" onClick={() => makeStaff(u)} className="shrink-0">Make staff</Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
