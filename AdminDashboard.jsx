import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import {
  FileText, Inbox, Activity, CheckCircle2, AlertTriangle, Database, Loader2, ArrowRight, Flame, Star,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import ComplaintTable from "@/components/ComplaintTable";
import { Button } from "@/components/ui/button";
import { StatusBadge, PriorityBadge, CategoryBadge, DemoBadge } from "@/components/Badges";
import { STATUSES, CATEGORIES, statusLabel, categoryLabel, statusColor, categoryColor, formatDate, isOverdue } from "@/lib/constants";
import { useCurrentUser, dashboardFor } from "@/lib/useCurrentUser";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/components/ui/use-toast";
import ExportComplaintsButton from "@/components/ExportComplaintsButton";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { role, isAdmin } = useCurrentUser();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, unassigned: 0, inProgress: 0, resolved: 0, overdue: 0 });
  const [statusData, setStatusData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [recent, setRecent] = useState([]);
  const [urgent, setUrgent] = useState([]);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const now = new Date().toISOString();
        const [statusAgg, categoryAgg, trendAgg, workloadAgg, ratingsAgg, unassignedCount, overdueCount, recentPage, urgentPage] = await Promise.all([
          base44.entities.Complaint.aggregate({ groupBy: "status" }),
          base44.entities.Complaint.aggregate({ groupBy: "category" }),
          base44.entities.Complaint.aggregate({ dateBucket: { field: "reportedAt", unit: "day" } }),
          base44.entities.Complaint.aggregate({ query: { status: { $ne: "resolved" } }, groupBy: "assignedStaffName" }),
          base44.entities.Complaint.aggregate({ query: { status: "resolved", feedbackRating: { $exists: true, $ne: null }, assignedStaffName: { $exists: true, $ne: "" } }, groupBy: "assignedStaffName", avg: ["feedbackRating"] }),
          base44.entities.Complaint.count({ assignedStaffId: "" }),
          base44.entities.Complaint.count({ dueAt: { $lt: now, $ne: "" }, status: { $ne: "resolved" } }),
          base44.entities.Complaint.filter({}, { sort: "-created_date", limit: 5 }),
          base44.entities.Complaint.filter({ status: { $ne: "resolved" }, priority: { $in: ["critical", "high"] } }, { sort: "-created_date", limit: 6 }),
        ]);

        const sRows = statusAgg.rows || [];
        const by = {};
        let total = 0;
        for (const r of sRows) { by[r.status] = r.count; total += r.count; }
        setStats({
          total,
          unassigned: typeof unassignedCount === "number" ? unassignedCount : unassignedCount?.count || 0,
          inProgress: by.in_progress || 0,
          resolved: by.resolved || 0,
          overdue: typeof overdueCount === "number" ? overdueCount : overdueCount?.count || 0,
        });
        setStatusData(sRows.map((r) => ({ name: statusLabel(r.status), value: r.count, color: statusColor(r.status) })).filter((d) => d.value > 0));

        setCategoryData((categoryAgg.rows || []).map((r) => ({ name: categoryLabel(r.category), value: r.count, color: categoryColor(r.category) })).sort((a, b) => b.value - a.value));

        const trendRows = (trendAgg.rows || []).map((r) => ({ date: r.reportedAt || r.created_date || r._id || r.date, count: r.count }));
        trendRows.sort((a, b) => (a.date > b.date ? 1 : -1));
        setTrendData(trendRows.slice(-7).map((d) => ({ ...d, label: new Date(d.date).toLocaleDateString("en-US", { weekday: "short", day: "numeric" }) })));

        setWorkload((workloadAgg.rows || []).filter((r) => r.assignedStaffName).map((r) => ({ name: r.assignedStaffName, open: r.count })).sort((a, b) => b.open - a.open).slice(0, 8));

        setRatings((ratingsAgg.rows || []).filter((r) => r.assignedStaffName).map((r) => ({
          name: r.assignedStaffName,
          avg: Math.round((r.avg_feedbackRating || 0) * 10) / 10,
          rated: r.count,
        })).sort((a, b) => b.avg - a.avg));

        setRecent(recentPage.items || recentPage || []);
        setUrgent(urgentPage.items || urgentPage || []);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const seedDemo = async () => {
    setSeeding(true);
    try {
      const res = await base44.functions.invoke("seedDemoData", {});
      toast({ title: res?.data?.message || res?.message || "Demo data ready", description: `${res?.data?.count || res?.count || 0} sample complaints created.` });
      setTimeout(() => window.location.reload(), 900);
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
          <h1 className="font-display font-bold text-2xl tracking-tight">Administrator Dashboard</h1>
          <p className="text-muted-foreground mt-1">System-wide overview of complaints, staff workload and performance.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <ExportComplaintsButton />
          <Button variant="outline" onClick={seedDemo} disabled={seeding} className="gap-2 h-11 w-full sm:w-auto">
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            {seeding ? "Seeding…" : "Load demo data"}
          </Button>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="rounded-2xl border border-border bg-card shadow-soft p-4 sm:p-5 mb-6">
        <h3 className="font-semibold mb-4">Complaints by category</h3>
        {loading ? <div className="h-56 bg-muted/40 rounded-xl animate-pulse" /> : categoryData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-16 text-center">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: isMobile ? 10 : 11 }} width={isMobile ? 80 : 120} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Count">
                {categoryData.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <StatCard label="Total" value={stats.total} icon={FileText} color="#3b82f6" loading={loading} />
        <StatCard label="Unassigned" value={stats.unassigned} icon={Inbox} color="#6366f1" loading={loading} />
        <StatCard label="In Progress" value={stats.inProgress} icon={Activity} color="#f59e0b" loading={loading} />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} color="#10b981" loading={loading} />
        <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle} color="#ef4444" loading={loading} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        {/* Status distribution */}
        <div className="rounded-2xl border border-border bg-card shadow-soft p-4 sm:p-5">
          <h3 className="font-semibold mb-4">Status distribution</h3>
          {loading ? <div className="h-56 bg-muted/40 rounded-xl animate-pulse" /> : statusData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-16 text-center">No data yet</p>
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {statusData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-2">
                {statusData.map((d) => (
                  <span key={d.name} className="flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} /> {d.name} ({d.value})</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Weekly trend */}
        <div className="rounded-2xl border border-border bg-card shadow-soft p-4 sm:p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4">Weekly complaint trend</h3>
          {loading ? <div className="h-56 bg-muted/40 rounded-xl animate-pulse" /> : trendData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-16 text-center">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: "#3b82f6" }} name="Complaints" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        {/* Staff workload */}
        <div className="rounded-2xl border border-border bg-card shadow-soft p-4 sm:p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4">Staff workload (open tasks)</h3>
          {loading ? <div className="h-56 bg-muted/40 rounded-xl animate-pulse" /> : workload.length === 0 ? (
            <p className="text-sm text-muted-foreground py-16 text-center">No assigned tasks yet. Assign complaints to staff to see workload.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={workload} margin={{ left: -20, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" interval={0} angle={-12} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="open" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Open tasks" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Average staff ratings */}
      <div className="rounded-2xl border border-border bg-card shadow-soft p-4 sm:p-5 mb-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-[hsl(var(--brand-orange))]" /> Average staff rating (resolved complaints)</h3>
        {loading ? <div className="h-56 bg-muted/40 rounded-xl animate-pulse" /> : ratings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-16 text-center">No rated resolutions yet. Ratings appear after reporters rate resolved complaints.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, 60 + ratings.length * 50)}>
            <BarChart data={ratings} layout="vertical" margin={{ left: 20, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey="name" tickFormatter={isMobile ? (v) => (v.length > 10 ? v.slice(0, 10) + "…" : v) : undefined} tick={{ fontSize: isMobile ? 10 : 11 }} width={isMobile ? 100 : 190} stroke="hsl(var(--muted-foreground))" />
              <Tooltip formatter={(value, name, entry) => [`${value} ★ (from ${entry?.payload?.rated} rated)`, "Avg rating"]} />
              <Bar dataKey="avg" fill="#f59e0b" radius={[0, 6, 6, 0]} name="Avg rating" maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Urgent / overdue */}
      <div className="rounded-2xl border border-border bg-card shadow-soft p-4 sm:p-5 mb-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Flame className="w-5 h-5 text-[hsl(var(--brand-orange))]" /> High priority &amp; overdue</h3>
        {loading ? <div className="h-20 bg-muted/40 rounded-xl animate-pulse" /> : urgent.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No high-priority or overdue complaints. 🎉</p>
        ) : (
          <div className="space-y-2.5 sm:space-y-2">
            {urgent.map((c) => {
              const od = isOverdue(c);
              return (
                <button key={c.id} onClick={() => navigate(`/complaint/${c.id}`)} className="w-full flex flex-col gap-2 px-3.5 py-4 rounded-xl border border-border hover:bg-muted/40 active:bg-muted/60 transition-colors text-left sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:p-3">
                  <span className="font-mono text-xs font-semibold text-muted-foreground">{c.ticketId}</span>
                  <span className="font-medium text-sm flex-1 min-w-0 truncate">{c.title}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryBadge category={c.category} />
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                  </div>
                  {od && <span className="text-[10px] font-bold uppercase text-destructive">Overdue</span>}
                  {c.isDemo && <DemoBadge />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-lg">Recent complaints</h2>
        <Button variant="ghost" onClick={() => navigate("/complaints")} className="gap-1.5 text-sm h-10 px-3">View all <ArrowRight className="w-4 h-4" /></Button>
      </div>
      <ComplaintTable complaints={recent} loading={loading} showReporter showAssignee />
    </div>
  );
}
