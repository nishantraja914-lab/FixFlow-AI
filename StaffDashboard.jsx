import { useEffect, useState, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Wrench, Inbox, Activity, CheckCircle2, AlertTriangle, Plus, LayoutList, Columns3, Users } from "lucide-react";
import StatCard from "@/components/StatCard";
import ComplaintTable from "@/components/ComplaintTable";
import ComplaintBoard from "@/components/ComplaintBoard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useCurrentUser, dashboardFor } from "@/lib/useCurrentUser";

export default function StaffDashboard() {
  const { user, role, isStaff, isAdmin } = useCurrentUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ assigned: 0, newA: 0, inProgress: 0, completed: 0, overdue: 0, team: 0 });
  const [items, setItems] = useState([]);
  const [teamItems, setTeamItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("table");
  const { toast } = useToast();

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const now = new Date().toISOString();
      const [agg, overdueCount, page, teamCount, teamPage] = await Promise.all([
        base44.entities.Complaint.aggregate({ query: { assignedStaffId: user.id }, groupBy: "status" }),
        base44.entities.Complaint.count({ assignedStaffId: user.id, dueAt: { $lt: now, $ne: "" }, status: { $ne: "resolved" } }),
        base44.entities.Complaint.filter({ assignedStaffId: user.id }, { sort: "-created_date", limit: 50 }),
        base44.entities.Complaint.count({ assignedStaffId: { $nin: [user.id, ""], $exists: true }, status: { $ne: "resolved" } }),
        base44.entities.Complaint.filter({ assignedStaffId: { $nin: [user.id, ""], $exists: true }, status: { $ne: "resolved" } }, { sort: "-created_date", limit: 50 }),
      ]);
      const rows = agg.rows || [];
      const by = {};
      for (const r of rows) by[r.status] = r.count;
      setStats({
        assigned: rows.reduce((s, r) => s + r.count, 0),
        newA: by.assigned || 0,
        inProgress: by.in_progress || 0,
        completed: by.resolved || 0,
        overdue: typeof overdueCount === "number" ? overdueCount : overdueCount?.count || 0,
        team: typeof teamCount === "number" ? teamCount : teamCount?.count || 0,
      });
      setItems(page.items || page || []);
      setTeamItems(teamPage.items || teamPage || []);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBoardMove = async (complaint, action, errorMessage) => {
    if (errorMessage) {
      toast({ title: "Move not allowed", description: errorMessage, variant: "destructive" });
      return;
    }
    const newStatus = action === "accept" ? "in_progress" : "resolved";
    setItems((prev) => prev.map((c) => (c.id === complaint.id ? { ...c, status: newStatus } : c)));
    try {
      await base44.functions.invoke("updateComplaintStatus", { complaintId: complaint.id, action });
      toast({ title: "Status updated", description: `${complaint.ticketId} moved to ${newStatus === "in_progress" ? "In Progress" : "Resolved"}.` });
      load();
    } catch (e) {
      toast({ title: "Could not update status", description: e?.message || "Please try again.", variant: "destructive" });
      load();
    }
  };

  if (!isStaff && !isAdmin) return <Navigate to={dashboardFor(role)} replace />;
  return (
    <div className="px-5 sm:px-8 py-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl tracking-tight">Staff Dashboard</h1>
        <p className="text-muted-foreground mt-1">Complaints assigned to you and to your team for resolution.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label="My Assigned" value={stats.assigned} icon={Wrench} color="#3b82f6" loading={loading} />
        <StatCard label="New" value={stats.newA} icon={Inbox} color="#6366f1" loading={loading} />
        <StatCard label="In Progress" value={stats.inProgress} icon={Activity} color="#f59e0b" loading={loading} />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} color="#10b981" loading={loading} />
        <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle} color="#ef4444" loading={loading} />
        <StatCard label="Team Open" value={stats.team} icon={Users} color="#8b5cf6" loading={loading} />
      </div>

      <div className="flex items-center justify-between mb-3 gap-3">
        <h2 className="font-display font-semibold text-lg">Assigned to you</h2>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <Button variant={view === "table" ? "secondary" : "ghost"} onClick={() => setView("table")} className="gap-1.5 h-9 px-3 sm:h-8 sm:px-3">
            <LayoutList className="w-4 h-4" /> <span className="hidden sm:inline">List</span>
          </Button>
          <Button variant={view === "board" ? "secondary" : "ghost"} onClick={() => setView("board")} className="gap-1.5 h-9 px-3 sm:h-8 sm:px-3">
            <Columns3 className="w-4 h-4" /> <span className="hidden sm:inline">Board</span>
          </Button>
        </div>
      </div>
      {view === "board" ? (
        <ComplaintBoard complaints={items} loading={loading} onMove={handleBoardMove} emptyTitle="No tasks assigned" emptyDescription="When an administrator assigns a complaint to you, it will appear here." />
      ) : (
        <ComplaintTable complaints={items} loading={loading} showAssignee={false} emptyTitle="No tasks assigned" emptyDescription="When an administrator assigns a complaint to you, it will appear here." />
      )}

      <div className="mt-8 mb-3">
        <h2 className="font-display font-semibold text-lg">Team assignments</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Open complaints assigned to other staff members.</p>
      </div>
      <ComplaintTable complaints={teamItems} loading={loading} showAssignee emptyTitle="No team tasks open" emptyDescription="Open complaints assigned to other staff will appear here." />
    </div>
  );
}
