import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MessageSquareWarning, EyeOff, Clock, ArrowRight, FileText, UserCheck, CheckCircle2,
  Zap, BarChart3, Bell, ShieldCheck, Camera, History, Star, Users, Wrench, Crown,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, delay },
});

function Problem() {
  const items = [
    { icon: MessageSquareWarning, title: "Scattered reports", text: "Complaints buried in WhatsApp chats, phone calls, and verbal notes — impossible to track." },
    { icon: EyeOff, title: "Zero visibility", text: "No one knows the status. Reporters follow up repeatedly; managers guess at workload." },
    { icon: Clock, title: "Forgotten & overdue", text: "Without targets and reminders, urgent issues slip through the cracks for weeks." },
  ];
  return (
    <section id="problem" className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div {...fadeUp()} className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--brand-orange))]">The problem</span>
          <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl tracking-tight text-balance">
            Complaints disappear into chaos
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-balance">
            In colleges, hostels, residential societies, and offices, maintenance issues are reported
            informally — and quietly forgotten.
          </p>
        </motion.div>
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {items.map((it, i) => (
            <motion.div key={it.title} {...fadeUp(0.05 * i)} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="w-11 h-11 rounded-xl bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center mb-4">
                <it.icon className="w-5 h-5 text-[hsl(var(--brand-orange))]" />
              </div>
              <h3 className="font-semibold text-lg">{it.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{it.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  const steps = [
    { n: "01", icon: FileText, title: "Submit", text: "Anyone reports a problem in seconds — category, location, priority, and an optional photo.", color: "var(--brand-blue)" },
    { n: "02", icon: UserCheck, title: "Assign", text: "Administrators assign it to the right staff member with a clear resolution target.", color: "var(--brand-teal)" },
    { n: "03", icon: CheckCircle2, title: "Resolve", text: "Staff updates progress, adds notes, and marks it resolved. The reporter rates the outcome.", color: "var(--brand-orange)" },
  ];
  return (
    <section id="workflow" className="py-20 sm:py-28 bg-foreground text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 bg-grid [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div {...fadeUp()} className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--brand-blue))]">How it works</span>
          <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl tracking-tight text-balance">
            Three steps from complaint to closure
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/70 text-balance">
            A transparent workflow everyone can trust — every action tracked, every status timestamped.
          </p>
        </motion.div>
        <div className="mt-14 grid md:grid-cols-3 gap-6 relative">
          {steps.map((s, i) => (
            <motion.div key={s.n} {...fadeUp(0.08 * i)} className="relative">
              <div className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-7 h-full backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `hsl(${s.color})` }}>
                    <s.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-mono text-3xl font-bold text-primary-foreground/15">{s.n}</span>
                </div>
                <h3 className="mt-5 font-semibold text-xl">{s.title}</h3>
                <p className="mt-2 text-sm text-primary-foreground/70 leading-relaxed">{s.text}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 z-10 w-6 h-6 -translate-y-1/2 rounded-full bg-foreground border-2 border-primary-foreground/20 flex items-center justify-center">
                  <ArrowRight className="w-3 h-3 text-primary-foreground/50" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: Zap, title: "Smart priority suggestions", text: "Deterministic rules suggest Low → Critical based on category and description.", color: "var(--brand-orange)" },
    { icon: BarChart3, title: "Live analytics", text: "Status distribution, category breakdown, weekly trends, and staff workload — at a glance.", color: "var(--brand-blue)" },
    { icon: Bell, title: "In-app notifications", text: "Assignment, status change, progress, resolution, and overdue alerts with unread badges.", color: "var(--brand-teal)" },
    { icon: History, title: "Full activity timeline", text: "Every status change, assignment, comment, and resolution note — chronologically logged.", color: "var(--brand-blue)" },
    { icon: ShieldCheck, title: "Role-based access", text: "Reporters, staff, and admins each see only what they're allowed to — enforced on the backend.", color: "var(--brand-teal)" },
    { icon: Camera, title: "Photo attachments", text: "Attach evidence on submission and a completion photo on resolution.", color: "var(--brand-orange)" },
    { icon: Star, title: "Resolution feedback", text: "Reporters rate 1–5 stars, leave feedback, confirm, or dispute and reopen.", color: "var(--brand-orange)" },
    { icon: Clock, title: "Overdue escalation", text: "Resolution targets per priority with overdue flags so nothing is forgotten.", color: "var(--brand-blue)" },
  ];
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div {...fadeUp()} className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--brand-blue))]">Features</span>
          <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl tracking-tight text-balance">
            Everything needed to close the loop
          </h2>
        </motion.div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div key={f.title} {...fadeUp(0.04 * i)} className="group rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-200">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ background: `hsl(${f.color} / 0.12)` }}>
                <f.icon className="w-5 h-5" style={{ color: `hsl(${f.color})` }} />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Roles() {
  const roles = [
    { icon: Users, title: "Reporter", text: "Submit complaints, track progress, view timelines, confirm or dispute resolutions, and leave feedback.", color: "var(--brand-blue)" },
    { icon: Wrench, title: "Maintenance Staff", text: "Accept assignments, update status, add progress notes, upload completion photos, and mark resolved.", color: "var(--brand-teal)" },
    { icon: Crown, title: "Administrator", text: "Review everything, assign staff, set priority, manage the system, and monitor performance analytics.", color: "var(--brand-orange)" },
  ];
  return (
    <section id="roles" className="py-20 sm:py-28 bg-muted/40">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div {...fadeUp()} className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--brand-teal))]">Built for everyone</span>
          <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl tracking-tight text-balance">
            One platform, three perspectives
          </h2>
        </motion.div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {roles.map((r, i) => (
            <motion.div key={r.title} {...fadeUp(0.08 * i)} className="rounded-2xl border border-border bg-card p-7 shadow-soft text-center">
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-5" style={{ background: `hsl(${r.color} / 0.12)` }}>
                <r.icon className="w-7 h-7" style={{ color: `hsl(${r.color})` }} />
              </div>
              <h3 className="font-semibold text-xl">{r.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{r.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <motion.div {...fadeUp()} className="relative overflow-hidden rounded-3xl bg-brand-gradient p-10 sm:p-16 text-center">
          <div className="absolute inset-0 opacity-20 bg-grid [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
          <div className="relative">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight text-balance">
              Ready to fix the flow?
            </h2>
            <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto text-balance">
              Give every complaint the accountability it deserves. Start in minutes — no setup headaches.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" variant="secondary" className="h-12 px-7 text-base gap-2 group" onClick={() => navigate(isAuthenticated ? "/app" : "/register")}>
                {isAuthenticated ? "Open Dashboard" : "Get Started Free"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-7 text-base bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white" onClick={() => navigate("/login")}>
                Log in
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Logo size={28} />
          <span className="font-display font-bold tracking-tight">FixFlow<span className="text-[hsl(var(--brand-blue))]"> AI</span></span>
        </div>
        <p className="text-sm text-muted-foreground">Every complaint deserves a solution.</p>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} FixFlow AI. Built for accountability.</p>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Workflow />
        <Features />
        <Roles />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
