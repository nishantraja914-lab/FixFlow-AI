import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Database, Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ComplaintTable from "@/components/ComplaintTable";
import BulkActionBar from "@/components/BulkActionBar";
import { CATEGORIES, STATUSES, PRIORITIES } from "@/lib/constants";
import { useCurrentUser, dashboardFor } from "@/lib/useCurrentUser";
import { Navigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

export default function AllComplaints() {
  const { role, isAdmin } = useCurrentUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fCategory, setFCategory] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [fPriority, setFPriority] = useState("all");
  const [fDemo, setFDemo] = useState("all");
  const [seeding, setSeeding] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const query = {};
        if (fCategory !== "all") query.category = fCategory;
        if (fStatus !== "all") query.status = fStatus;
        if (fPriority !== "all") query.priority = fPriority;
        if (fDemo === "demo") query.isDemo = true;
        if (fDemo === "real") query.isDemo = false;
        if (search.trim()) query.title = { $regex: search.trim(), $options: "i" };
        const page = await base44.entities.Complaint.filter(query, { sort: "-created_date", limit: 200 });
        setItems(page.items || page || []);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [search, fCategory, fStatus, fPriority, fDemo]);

  useEffect(() => {
    (async () => {
      try {
        const staff = await base44.entities.User.filter({ appRole: "staff" });
        setStaffList(staff || []);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const toggleSelection = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = (allSelected) => {
    setSelectedIds(allSelected ? [] : items.map((c) => c.id));
  };

  const runBulk = async (payload) => {
    setBulkBusy(true);
    try {
      const res = await base44.functions.invoke("bulkComplaintActions", payload);
      const updated = res?.data?.updated ?? res?.updated;
      toast({ title: "Bulk action applied", description: `${updated} of ${payload.complaintIds.length} complaints updated.` });
      setSelectedIds([]);
      const query = {};
      if (fCategory !== "all") query.category = fCategory;
      if (fStatus !== "all") query.status = fStatus;
      if (fPriority !== "all") query.priority = fPriority;
      if (fDemo === "demo") query.isDemo = true;
      if (fDemo === "real") query.isDemo = false;
      if (search.trim()) query.title = { $regex: search.trim(), $options: "i" };
      const page = await base44.entities.Complaint.filter(query, { sort: "-created_date", limit: 200 });
      setItems(page.items || page || []);
    } catch (err) {
      toast({ title: "Bulk action failed", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkAssign = async (staffId) => {
    if (!staffId) return;
    await runBulk({ action: "assign", staffId, complaintIds: selectedIds });
  };

  const bulkStatus = async (status) => {
    if (!status) return;
    await runBulk({ action: "status", status, complaintIds: selectedIds });
  };

  const seedDemo = async () => {
    setSeeding(true);
    try {
      const res = await base44.functions.invoke("seedDemoData", {});
      toast({ title: res?.data?.message || res?.message || "Demo data ready", description: `${res?.data?.count || res?.count || 0} sample complaints created.` });
      setFDemo("all");
      // trigger reload
      setSearch((s) => s);
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      toast({ title: "Seeding failed", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  if (!isAdmin) return <Navigate to={dashboardFor(role)} replace />;
  return (
    <div className="px-5 sm:px-8 py-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl tracking-tight">All Complaints</h1>
          <p className="text-muted-foreground mt-1">Browse, filter and manage every complaint in the system.</p>
        </div>
        {isAdmin && (
          <Button variant="outline" onClick={seedDemo} disabled={seeding} className="gap-2 h-11 w-full sm:w-auto">
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            {seeding ? "Seeding…" : "Load demo data"}
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by title…" className="pl-9 h-11" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={fCategory} onValueChange={setFCategory}>
          <SelectTrigger className="sm:w-44 h-11"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fStatus} onValueChange={setFStatus}>
          <SelectTrigger className="sm:w-40 h-11"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fPriority} onValueChange={setFPriority}>
          <SelectTrigger className="sm:w-40 h-11"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fDemo} onValueChange={setFDemo}>
          <SelectTrigger className="sm:w-40 h-11"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All records</SelectItem>
            <SelectItem value="real">Real only</SelectItem>
            <SelectItem value="demo">Demo only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.length}
        staffList={staffList}
        onAssign={bulkAssign}
        onStatus={bulkStatus}
        onClear={() => setSelectedIds([])}
        busy={bulkBusy}
      />
      <ComplaintTable
        complaints={items}
        loading={loading}
        showReporter
        showAssignee
        emptyTitle="No complaints found"
        emptyDescription="Try adjusting your filters."
        selectable
        selectedIds={selectedIds}
        onToggleSelection={toggleSelection}
        onToggleAll={toggleAll}
      />
    </div>
  );
}
