import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Bell, Check, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/constants";
import { useCurrentUser } from "@/lib/useCurrentUser";
import EmptyState from "@/components/EmptyState";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const query = filter === "unread" ? { recipientId: user.id, isRead: false } : { recipientId: user.id };
      const page = await base44.entities.Notification.filter(query, { sort: "-created_date", limit: 100 });
      setItems(page.items || page || []);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id, filter]);

  const markRead = async (id) => {
    try { await base44.entities.Notification.update(id, { isRead: true }); } catch (e) {}
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = async () => {
    await base44.entities.Notification.updateMany({ recipientId: user.id, isRead: false }, { $set: { isRead: true } });
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const open = async (n) => {
    if (!n.isRead) await markRead(n.id);
    if (n.relatedComplaintId) navigate(`/complaint/${n.relatedComplaintId}`);
  };

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead} className="gap-2"><Check className="w-4 h-4" /> Mark all read</Button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {["all", "unread"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn("px-4 h-9 rounded-xl text-sm font-medium capitalize transition-colors", filter === f ? "bg-foreground text-primary-foreground" : "bg-card border border-border hover:bg-muted")}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-2xl border border-border bg-card animate-pulse" />)
          : items.length === 0
          ? <EmptyState icon={Inbox} title="No notifications" description="You'll be notified about assignments, status changes, and updates here." />
          : items.map((n) => (
              <button
                key={n.id}
                onClick={() => open(n)}
                className={cn("w-full text-left flex gap-3.5 p-4 rounded-2xl border border-border bg-card hover:shadow-soft transition-all", !n.isRead && "border-l-4 border-l-[hsl(var(--brand-blue))]")}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", n.isRead ? "bg-muted" : "bg-[hsl(var(--brand-blue))]/10")}>
                  <Bell className={cn("w-5 h-5", n.isRead ? "text-muted-foreground" : "text-[hsl(var(--brand-blue))]")} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold truncate">{n.title}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(n.created_date)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  {n.relatedTicketId && <p className="text-xs font-mono text-muted-foreground mt-1">{n.relatedTicketId}</p>}
                </div>
                {!n.isRead && <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--brand-blue))] mt-1.5 shrink-0" />}
              </button>
            ))}
      </div>
    </div>
  );
}
