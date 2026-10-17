import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, ListChecks, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ComplaintTable from "@/components/ComplaintTable";
import { CATEGORIES, STATUSES, PRIORITIES } from "@/lib/constants";
import { useCurrentUser } from "@/lib/useCurrentUser";

export default function MyComplaints() {
  const { user, role } = useCurrentUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fCategory, setFCategory] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [fPriority, setFPriority] = useState("all");

  // Staff see complaints assigned to them; reporters see their own.
  const baseQuery = useMemo(() => {
    if (role === "staff") return { assignedStaffId: user.id };
    return { reporterId: user.id };
  }, [user?.id, role]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const query = { ...baseQuery };
        if (fCategory !== "all") query.category = fCategory;
        if (fStatus !== "all") query.status = fStatus;
        if (fPriority !== "all") query.priority = fPriority;
        if (search.trim()) query.title = { $regex: search.trim(), $options: "i" };
        const page = await base44.entities.Complaint.filter(query, { sort: "-created_date", limit: 100 });
        setItems(page.items || page || []);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, baseQuery, fCategory, fStatus, fPriority, search]);

  const title = role === "staff" ? "My Tasks" : "My Complaints";
  const emptyTitle = role === "staff" ? "No tasks assigned" : "No complaints found";
  const emptyDesc = role === "staff" ? "Complaints assigned to you will appear here." : "Try adjusting your filters or report a new problem.";

  return (
    <div className="px-5 sm:px-8 py-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1">{role === "staff" ? "Complaints assigned to you for resolution." : "All complaints you have submitted."}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
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
      </div>

      <ComplaintTable complaints={items} loading={loading} showAssignee={role !== "staff"} emptyTitle={emptyTitle} emptyDescription={emptyDesc} />
    </div>
  );
}
