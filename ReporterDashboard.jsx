import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { FileText, FolderOpen, Activity, CheckCircle2, Plus, ArrowRight } from "lucide-react";
import StatCard from "@/components/StatCard";
import ComplaintTable from "@/components/ComplaintTable";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/useCurrentUser";

export default function ReporterDashboard() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [agg, page] = await Promise.all([
          base44.entities.Complaint.aggregate({ query: { reporterId: user.id }, groupBy: "status" }),
          base44.entities.Complaint.filter({ reporterId: user.id }, { sort: "-created_date", limit: 5 }),
        ]);
        const rows = agg.rows || [];
        const byStatus = {};
        let total = 0;
        for (const r of rows) { byStatus[r.status] = r.count; total += r.count; }
        setStats({
          total,
          open: total - (byStatus.resolved || 0),
          inProgress: byStatus.in_progress || 0,
          resolved: byStatus.resolved || 0,
        });
        setRecent(page.items || page || []);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  return (
    <div className="px-5 sm:px-8 py-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl tracking-tight">Welcome back, {user?.full_name?.split(" ")[0] || "there"} 👋</h1>
          <p className="text-muted-foreground mt-1">Here's the status of your reported complaints.</p>
        </div>
        <Button onClick={() => navigate("/report")} className="gap-2 h-11 px-5"><Plus className="w-4 h-4" /> Report a Problem</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Submitted" value={stats.total} icon={FileText} color="#3b82f6" loading={loading} />
        <StatCard label="Open" value={stats.open} icon={FolderOpen} color="#f59e0b" loading={loading} />
        <StatCard label="In Progress" value={stats.inProgress} icon={Activity} color="#6366f1" loading={loading} />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} color="#10b981" loading={loading} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-lg">Recent complaints</h2>
        <Button variant="ghost" onClick={() => navigate("/my-complaints")} className="gap-1.5 text-sm">View all <ArrowRight className="w-4 h-4" /></Button>
      </div>
      <ComplaintTable complaints={recent} loading={loading} showAssignee emptyTitle="No complaints yet" emptyDescription="Report your first problem to see it tracked here." />
    </div>
  );
}
