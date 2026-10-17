import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  ArrowLeft, Loader2, MapPin, Calendar, User, UserCog, AlertTriangle, Clock, CheckCircle2,
  Send, Play, RotateCcw, Star, ImagePlus, X, Wrench, ShieldCheck, MessageSquare, Lock, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CategoryBadge, StatusBadge, PriorityBadge, DemoBadge, CategoryIcon } from "@/components/Badges";
import ActivityTimeline from "@/components/ActivityTimeline";
import PrivateImage from "@/components/PrivateImage";
import { formatDate, formatDateTime, isOverdue, PRIORITIES, PRIORITY_DUE_HOURS } from "@/lib/constants";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role, isAdmin, isStaff, isReporter } = useCurrentUser();
  const [complaint, setComplaint] = useState(null);
  const [activities, setActivities] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // action state
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignStaff, setAssignStaff] = useState("");
  const [assignPriority, setAssignPriority] = useState("");
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveNotes, setResolveNotes] = useState("");
  const [resolvePhoto, setResolvePhoto] = useState("");
  const [uploading, setUploading] = useState(false);
  const [comment, setComment] = useState("");
  const [commentInternal, setCommentInternal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const c = await base44.entities.Complaint.get(id);
      if (!c) { setNotFound(true); return; }
      setComplaint(c);
      const [acts, fb] = await Promise.all([
        base44.entities.ComplaintActivity.filter({ complaintId: id }, { sort: "-created_date", limit: 200 }),
        (isReporter || isAdmin) ? base44.entities.Feedback.filter({ complaintId: id, ...(isReporter ? { reporterId: user.id } : {}) }) : Promise.resolve([]),
      ]);
      setActivities(acts.items || acts || []);
      const fbRows = (fb.items || fb || []);
      setFeedback(fbRows[0] || null);
      if (isAdmin) {
        const staff = await base44.entities.User.filter({ appRole: "staff" });
        setStaffList(staff || []);
      }
    } catch (e) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const refresh = async () => {
    const c = await base44.entities.Complaint.get(id);
    setComplaint(c);
    const acts = await base44.entities.ComplaintActivity.filter({ complaintId: id }, { sort: "-created_date", limit: 200 });
    setActivities(acts.items || acts || []);
    if (isReporter || isAdmin) {
      const fb = await base44.entities.Feedback.filter({ complaintId: id, ...(isReporter ? { reporterId: user.id } : {}) });
      setFeedback((fb.items || fb || [])[0] || null);
    }
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      setResolvePhoto(file_uri);
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const doAssign = async () => {
    if (!assignStaff) { toast({ title: "Select a staff member", variant: "destructive" }); return; }
    setBusy(true);
    try {
      await base44.functions.invoke("assignComplaint", { complaintId: id, staffId: assignStaff, priority: assignPriority || undefined });
      toast({ title: "Complaint assigned", description: "Staff and reporter have been notified." });
      setAssignOpen(false); setAssignStaff(""); setAssignPriority("");
      await refresh();
    } catch (err) {
      toast({ title: "Failed", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const doStatus = async (action, extra = {}) => {
    setBusy(true);
    try {
      await base44.functions.invoke("updateComplaintStatus", { complaintId: id, action, ...extra });
      toast({ title: "Updated", description: "Status changed successfully." });
      setResolveOpen(false); setResolveNotes(""); setResolvePhoto("");
      await refresh();
    } catch (err) {
      toast({ title: "Failed", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const doComment = async () => {
    if (!comment.trim()) return;
    setBusy(true);
    try {
      await base44.functions.invoke("addComplaintComment", { complaintId: id, comment: comment.trim(), visibility: (isAdmin || isStaff) && commentInternal ? "internal" : "public" });
      setComment(""); setCommentInternal(false);
      toast({ title: "Comment added" });
      await refresh();
    } catch (err) {
      toast({ title: "Failed", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const doFeedback = async () => {
    if (!feedbackRating) { toast({ title: "Select a rating", variant: "destructive" }); return; }
    setBusy(true);
    try {
      await base44.functions.invoke("submitFeedback", { complaintId: id, rating: feedbackRating, comment: feedbackComment.trim() });
      toast({ title: "Feedback submitted", description: "Thank you for your feedback!" });
      setFeedbackRating(0); setFeedbackComment("");
      await refresh();
    } catch (err) {
      toast({ title: "Failed", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="w-7 h-7 animate-spin text-muted-foreground" /></div>;
  }
  if (notFound || !complaint) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="font-display font-bold text-xl">Complaint not found</h1>
        <p className="text-muted-foreground mt-2">You may not have access to this complaint, or it doesn't exist.</p>
        <Button onClick={() => navigate(-1)} className="mt-6">Go back</Button>
      </div>
    );
  }

  const overdue = isOverdue(complaint);
  const canAssign = isAdmin;
  const canStart = (isStaff && complaint.assignedStaffId === user.id) || isAdmin;
  const canResolve = (isStaff && complaint.assignedStaffId === user.id) || isAdmin;
  const canReopen = isReporter && complaint.reporterId === user.id;
  const canFeedback = isReporter && complaint.reporterId === user.id && complaint.status === "resolved" && !feedback;

  return (
    <div className="px-5 sm:px-8 py-8 max-w-6xl mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card shadow-soft p-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="font-mono text-sm font-semibold text-muted-foreground">{complaint.ticketId}</span>
              {complaint.isDemo && <DemoBadge />}
              <CategoryBadge category={complaint.category} />
              <PriorityBadge priority={complaint.priority} />
              <StatusBadge status={complaint.status} />
              {overdue && <span className="inline-flex items-center gap-1 text-xs font-bold uppercase text-destructive"><AlertTriangle className="w-3.5 h-3.5" /> Overdue</span>}
            </div>
            <h1 className="font-display font-bold text-2xl tracking-tight">{complaint.title}</h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {complaint.location}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Reported {formatDate(complaint.reportedAt || complaint.created_date)}</span>
              {complaint.dueAt && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Due {formatDateTime(complaint.dueAt)}</span>}
            </div>
            {(canStart || canResolve) && (
              <div className="mt-5 flex flex-wrap gap-2">
                {canStart && (complaint.status === "assigned" || complaint.status === "reopened") && (
                  <Button variant="outline" size="sm" disabled={busy} onClick={() => doStatus("accept")} className="gap-1.5">
                    <Play className="w-4 h-4" /> Mark as In Progress
                  </Button>
                )}
                {canResolve && complaint.status !== "resolved" && (
                  <Button size="sm" disabled={busy} onClick={() => doStatus("resolve", { comment: "Marked as resolved via quick action" })} className="gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Mark as Resolved
                  </Button>
                )}
              </div>
            )}
            <div className="mt-5 pt-5 border-t border-border">
              <p className="text-sm font-semibold text-muted-foreground mb-2">Description</p>
              <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{complaint.description}</p>
            </div>
            {complaint.attachment && (
              <div className="mt-5">
                <p className="text-sm font-semibold text-muted-foreground mb-2">Attachment</p>
                <PrivateImage fileUri={complaint.attachment} alt="complaint attachment" className="w-full max-w-sm h-56 rounded-xl" />
              </div>
            )}
            {complaint.status === "resolved" && complaint.resolutionNotes && (
              <div className="mt-5 p-4 rounded-xl bg-[hsl(var(--brand-teal))]/8 border border-[hsl(var(--brand-teal))]/20">
                <p className="text-sm font-semibold flex items-center gap-1.5 mb-1.5"><CheckCircle2 className="w-4 h-4 text-[hsl(var(--brand-teal))]" /> Resolution notes</p>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{complaint.resolutionNotes}</p>
                {complaint.resolvedAt && <p className="text-xs text-muted-foreground mt-2">Resolved on {formatDateTime(complaint.resolvedAt)}</p>}
                {complaint.completionPhoto && <PrivateImage fileUri={complaint.completionPhoto} alt="completion" className="w-full max-w-sm h-48 rounded-xl mt-3" />}
              </div>
            )}
          </motion.div>

          {/* Activity timeline */}
          <div className="rounded-2xl border border-border bg-card shadow-soft p-6">
            <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[hsl(var(--brand-blue))]" /> Activity timeline</h2>
            <ActivityTimeline activities={activities} />
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {/* People */}
          <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">People</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-foreground text-primary-foreground flex items-center justify-center font-semibold text-sm"><User className="w-4 h-4" /></div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Reporter</p>
                  <p className="text-sm font-medium truncate">{complaint.reporterName || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"><Wrench className="w-4 h-4 text-muted-foreground" /></div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Assigned to</p>
                  <p className="text-sm font-medium truncate">{complaint.assignedStaffName || <span className="text-foreground/40 italic">Unassigned</span>}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Admin actions */}
          {canAssign && (
            <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Admin actions</h3>
              <Button className="w-full h-10 gap-2 mb-2" onClick={() => { setAssignStaff(complaint.assignedStaffId || ""); setAssignPriority(complaint.priority || ""); setAssignOpen(true); }}>
                <UserCog className="w-4 h-4" /> {complaint.assignedStaffId ? "Reassign / adjust" : "Assign to staff"}
              </Button>
              {complaint.status !== "resolved" && (
                <Button variant="outline" className="w-full h-10 gap-2" onClick={() => setResolveOpen(true)}><CheckCircle2 className="w-4 h-4" /> Mark resolved</Button>
              )}
            </div>
          )}

          {/* Staff actions */}
          {canStart && complaint.status !== "resolved" && complaint.status !== "in_progress" && (
            <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Staff actions</h3>
              <Button className="w-full h-10 gap-2" disabled={busy} onClick={() => doStatus("accept")}><Play className="w-4 h-4" /> Start work</Button>
              <p className="text-xs text-muted-foreground mt-2">Acknowledge and change status to In Progress.</p>
            </div>
          )}
          {canResolve && complaint.status !== "resolved" && !canAssign && (
            <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Staff actions</h3>
              <Button className="w-full h-10 gap-2" onClick={() => setResolveOpen(true)}><CheckCircle2 className="w-4 h-4" /> Mark resolved</Button>
            </div>
          )}

          {/* Add comment */}
          {(isReporter || isStaff || isAdmin) && (
            <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Add a comment</h3>
              <Textarea placeholder="Write a comment or progress update…" className="min-h-[80px]" value={comment} onChange={(e) => setComment(e.target.value)} />
              {(isAdmin || isStaff) && (
                <label className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={commentInternal} onChange={(e) => setCommentInternal(e.target.checked)} className="rounded" />
                  <Lock className="w-3.5 h-3.5" /> Internal note (only staff &amp; admins see this)
                </label>
              )}
              <Button className="w-full h-10 mt-3 gap-2" disabled={busy || !comment.trim()} onClick={doComment}><Send className="w-4 h-4" /> Post comment</Button>
            </div>
          )}

          {/* Reopen */}
          {canReopen && complaint.status === "resolved" && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
              <h3 className="font-semibold text-sm text-destructive uppercase tracking-wider mb-2">Not satisfied?</h3>
              <p className="text-sm text-muted-foreground mb-3">If the issue isn't truly fixed, you can reopen this complaint.</p>
              <Button variant="destructive" className="w-full h-10 gap-2" disabled={busy} onClick={() => doStatus("reopen", { comment: "Reporter requested reopening" })}><RotateCcw className="w-4 h-4" /> Reopen complaint</Button>
            </div>
          )}

          {/* Feedback */}
          {complaint.status === "resolved" && (
            <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><Star className="w-4 h-4 text-[hsl(var(--brand-orange))]" /> Resolution feedback</h3>
              {feedback ? (
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn("w-5 h-5", i < feedback.rating ? "fill-[hsl(var(--brand-orange))] text-[hsl(var(--brand-orange))]" : "text-muted-foreground/30")} />)}
                  </div>
                  {feedback.comment && <p className="text-sm text-foreground/80 bg-muted/50 rounded-lg p-3">{feedback.comment}</p>}
                  <p className="text-xs text-muted-foreground mt-2">Submitted {formatDate(feedback.created_date)}</p>
                </div>
              ) : canFeedback ? (
                <div>
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button key={i} onClick={() => setFeedbackRating(i + 1)}><Star className={cn("w-7 h-7 transition-colors", i < feedbackRating ? "fill-[hsl(var(--brand-orange))] text-[hsl(var(--brand-orange))]" : "text-muted-foreground/30 hover:text-muted-foreground")} /></button>
                    ))}
                  </div>
                  <Textarea placeholder="Optional feedback…" className="min-h-[70px]" value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} />
                  <Button className="w-full h-10 mt-3 gap-2" disabled={busy || !feedbackRating} onClick={doFeedback}>Submit feedback</Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Feedback is visible to the reporter and administrators.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Assign dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign complaint</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm font-medium mb-1.5">Maintenance staff</p>
              {staffList.length === 0 ? (
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">No staff members found. Invite staff from the workspace, or assign to yourself by switching your role to staff in Profile.</p>
              ) : (
                <Select value={assignStaff} onValueChange={setAssignStaff}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select staff member" /></SelectTrigger>
                  <SelectContent>
                    {staffList.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name || s.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <p className="text-sm font-medium mb-1.5">Priority</p>
              <Select value={assignPriority} onValueChange={setAssignPriority}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label} · {PRIORITY_DUE_HOURS[p.value]}h target</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={doAssign} disabled={busy || !assignStaff}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve dialog */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark as resolved</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm font-medium mb-1.5">Resolution notes</p>
              <Textarea placeholder="Describe what was done to resolve this complaint…" className="min-h-[100px]" value={resolveNotes} onChange={(e) => setResolveNotes(e.target.value)} />
            </div>
            <div>
              <p className="text-sm font-medium mb-1.5">Completion photo (optional)</p>
              {resolvePhoto ? (
                <div className="relative inline-block">
                  <img src={resolvePhoto} alt="completion" className="w-28 h-28 object-cover rounded-xl border border-border" />
                  <button onClick={() => setResolvePhoto("")} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-foreground text-primary-foreground flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-28 h-28 rounded-xl border-2 border-dashed border-border hover:border-foreground/30 cursor-pointer">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : <ImagePlus className="w-6 h-6 text-muted-foreground" />}
                  <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
                </label>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveOpen(false)}>Cancel</Button>
            <Button onClick={() => doStatus("resolve", { resolutionNotes: resolveNotes.trim(), completionPhoto: resolvePhoto })} disabled={busy}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Resolve"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
