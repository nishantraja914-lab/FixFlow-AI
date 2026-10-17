import { useMemo, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, ArrowRight, ImagePlus, Loader2, X, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryBadge, PriorityBadge } from "@/components/Badges";
import { CATEGORIES, PRIORITIES, suggestPriority } from "@/lib/constants";
import { useCurrentUser, dashboardFor } from "@/lib/useCurrentUser";
import PrivateImage from "@/components/PrivateImage";
import { toast } from "@/components/ui/use-toast";

export default function ReportProblem() {
  const navigate = useNavigate();
  const { role } = useCurrentUser();
  const [form, setForm] = useState({ title: "", category: "", location: "", description: "", priority: "" });
  const [attachment, setAttachment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  const suggested = useMemo(() => (form.category ? suggestPriority(form.category, form.description) : null), [form.category, form.description]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      setAttachment(file_uri);
      toast({ title: "Photo attached", description: "Stored privately with your complaint." });
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.category) e.category = "Please choose a category";
    if (!form.location.trim()) e.location = "Location is required";
    if (!form.description.trim()) e.description = "Please describe the problem";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("submitComplaint", {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        location: form.location.trim(),
        priority: form.priority || suggested || "medium",
        attachment,
      });
      const complaint = res?.data?.complaint || res?.complaint;
      setSuccess(complaint);
    } catch (err) {
      toast({ title: "Submission failed", description: err.message || "Could not submit complaint", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (role === "staff") return <Navigate to={dashboardFor(role)} replace />;
  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-card shadow-card p-8 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--brand-teal))]/12 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-[hsl(var(--brand-teal))]" />
          </div>
          <h2 className="font-display font-bold text-2xl">Complaint submitted</h2>
          <p className="text-muted-foreground mt-2">Your complaint has been recorded and administrators have been notified.</p>
          <div className="mt-6 inline-flex flex-col items-center gap-1 px-6 py-4 rounded-2xl bg-muted/50">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Your ticket ID</span>
            <span className="font-mono text-2xl font-bold text-[hsl(var(--brand-blue))]">{success.ticketId}</span>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate(`/complaint/${success.id}`)} className="gap-2">View details <ArrowRight className="w-4 h-4" /></Button>
            <Button variant="outline" onClick={() => { setSuccess(null); setForm({ title: "", category: "", location: "", description: "", priority: "" }); setAttachment(""); }}>Report another</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl tracking-tight">Report a Problem</h1>
        <p className="text-muted-foreground mt-1">Fill in the details below. A unique ticket ID is generated automatically.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft p-6 sm:p-8 space-y-5">
        <div>
          <Label htmlFor="title">Complaint title <span className="text-destructive">*</span></Label>
          <Input id="title" className="mt-1.5 h-11" placeholder="e.g. Fan not working in Classroom 204" value={form.title} onChange={(e) => set("title", e.target.value)} />
          {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <Label>Category <span className="text-destructive">*</span></Label>
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    <span className="flex items-center gap-2"><CategoryBadge category={c.value} /> </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
          </div>
          <div>
            <Label htmlFor="location">Location / Building <span className="text-destructive">*</span></Label>
            <Input id="location" className="mt-1.5 h-11" placeholder="e.g. Hostel Block A — Floor 2" value={form.location} onChange={(e) => set("location", e.target.value)} />
            {errors.location && <p className="text-xs text-destructive mt-1">{errors.location}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="description">Detailed description <span className="text-destructive">*</span></Label>
          <Textarea id="description" className="mt-1.5 min-h-[120px]" placeholder="Describe the problem in detail — what's wrong, when it started, and any safety concerns." value={form.description} onChange={(e) => set("description", e.target.value)} />
          {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
        </div>

        <div>
          <Label>Priority</Label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => set("priority", p.value)}
                className={`px-3.5 py-2 rounded-xl border-2 transition-all ${form.priority === p.value ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/30"}`}
              >
                <PriorityBadge priority={p.value} />
              </button>
            ))}
          </div>
          {suggested && !form.priority && (
            <div className="mt-2.5 flex items-center gap-2 text-sm text-muted-foreground">
              <Wand2 className="w-4 h-4 text-[hsl(var(--brand-blue))]" />
              <span>Suggested priority:</span>
              <PriorityBadge priority={suggested} />
              <button type="button" onClick={() => set("priority", suggested)} className="text-[hsl(var(--brand-blue))] font-medium hover:underline">Apply</button>
              <span className="text-xs">(based on category &amp; description)</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">Priority is a suggestion based on transparent rules — administrators can adjust it.</p>
        </div>

        <div>
          <Label>Photo attachment (optional)</Label>
          <div className="mt-1.5">
            {attachment ? (
              <div className="relative inline-block">
                <PrivateImage fileUri={attachment} alt="attachment" className="w-32 h-32 rounded-xl border border-border" fittingType="fit" />
                <button onClick={() => setAttachment("")} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-foreground text-primary-foreground flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-32 h-32 rounded-xl border-2 border-dashed border-border hover:border-foreground/30 cursor-pointer transition-colors">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : <ImagePlus className="w-6 h-6 text-muted-foreground" />}
                <span className="text-xs text-muted-foreground mt-1.5">{uploading ? "Uploading" : "Add photo"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </label>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">Stored privately — only authorized staff and admins can view it.</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={submit} disabled={submitting} className="h-11 px-6 gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><Sparkles className="w-4 h-4" /> Submit complaint</>}
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
