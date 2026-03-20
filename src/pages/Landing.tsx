import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  ShieldCheck,
  Brain,
  Zap,
  BarChart3,
  Lock,
  ArrowRight,
  CheckCircle2,
  Eye,
  Database,
  Server,
  ChevronDown,
} from "lucide-react";

// ── Scroll reveal hook ───────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ── Animated counter ─────────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useReveal();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(to / 48);
    const id = setInterval(() => {
      start += step;
      if (start >= to) { setCount(to); clearInterval(id); }
      else setCount(start);
    }, 18);
    return () => clearInterval(id);
  }, [visible, to]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ── Section wrapper with reveal ──────────────────────────────────────
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) blur(0px)" : "translateY(20px) blur(4px)",
        transition: `opacity 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms, filter 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        filter: visible ? "blur(0px)" : "blur(4px)",
      }}
    >
      {children}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Multi-Model Composite Engine",
      desc: "Biometric, neuro-motor, and sport-specific models fused into a single composite talent score — built on peer-reviewed methodology.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Zero Data Access — Guaranteed",
      desc: "Your athlete records never leave your server. We process locally. No PII, no raw metrics, no IDs ever transmitted to SPLINK.",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant AI Query",
      desc: "Ask in plain language: 'Top 10 sprinters aged 14–16' or 'Underweight athletes in football'. Results in under a second.",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Sport-Specific Ranking",
      desc: "Each athlete is ranked across 5 sports simultaneously. Coaches see exactly which talent fits which discipline.",
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Air-Gapped Deployment",
      desc: "Runs fully offline or inside your intranet. Docker-native, zero cloud dependency. Your data stays in your jurisdiction.",
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: "Transparent Methodology",
      desc: "Every score is explainable. Coaches can drill down to the exact metric contributing to each recommendation.",
    },
  ];

  const trustItems = [
    { icon: <Database className="w-5 h-5" />, text: "Athlete data stays in your database — always" },
    { icon: <Server className="w-5 h-5" />, text: "Runs on your own server or airgapped intranet" },
    { icon: <ShieldCheck className="w-5 h-5" />, text: "Only license heartbeat (athlete count, expiry) leaves your network" },
    { icon: <Lock className="w-5 h-5" />, text: "No PII, no raw metrics, no IDs ever transmitted" },
  ];

  const stats = [
    { value: 41, suffix: "+", label: "Athletes Assessed Per Import" },
    { value: 5, suffix: "", label: "Sports Ranked Simultaneously" },
    { value: 12, suffix: "+", label: "Biometric Metrics Analysed" },
    { value: 0, suffix: "%", label: "Data Shared With Vendor" },
  ];

  return (
    <div className="min-h-screen bg-white font-sans antialiased overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#1E3A5F" }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ color: "#1E3A5F" }}>
              Pratibha <span className="font-light text-slate-400">by SPLINK</span>
            </span>
          </div>
          <button
            onClick={() => navigate("/explorer")}
            className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{ background: "#F97316" }}
          >
            Open Platform <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 overflow-hidden">
        {/* Background geometry */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-[0.07]"
            style={{ background: "radial-gradient(circle, #1E3A5F 0%, transparent 70%)" }}
          />
          <div
            className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.06]"
            style={{ background: "radial-gradient(circle, #F97316 0%, transparent 70%)" }}
          />
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: "linear-gradient(#1E3A5F 1px, transparent 1px), linear-gradient(90deg, #1E3A5F 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-8 border"
            style={{
              background: "#FFF7ED",
              borderColor: "#FED7AA",
              color: "#EA580C",
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 0.6s cubic-bezier(0.16,1,0.3,1) 0ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0ms",
            }}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Zero Data Access · Enterprise Security
          </div>

          {/* Headline */}
          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight mb-6"
            style={{
              color: "#1E3A5F",
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(24px)",
              transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1) 100ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) 100ms",
            }}
          >
            Discover Athletic<br />
            <span style={{ color: "#F97316" }}>Talent. Instantly.</span>
          </h1>

          {/* Sub */}
          <p
            className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{
              textWrap: "balance",
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1) 200ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) 200ms",
            }}
          >
            Pratibha combines advanced biometric models, AI-powered querying, and sport-specific ranking — deployed entirely on your infrastructure. We never see your athletes.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1) 320ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) 320ms",
            }}
          >
            <button
              onClick={() => navigate("/explorer")}
              className="group flex items-center gap-3 px-8 py-4 rounded-full text-base font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97] shadow-lg shadow-orange-200"
              style={{ background: "#F97316" }}
            >
              Open Pratibha Platform
              <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => document.getElementById("security")?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center gap-2 px-6 py-4 rounded-full text-base font-semibold border-2 transition-all duration-200 hover:bg-slate-50 active:scale-[0.97]"
              style={{ borderColor: "#1E3A5F", color: "#1E3A5F" }}
            >
              <ShieldCheck className="w-5 h-5" />
              How we protect your data
            </button>
          </div>
        </div>

        {/* Scroll cue */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-300"
          style={{
            opacity: heroVisible ? 1 : 0,
            transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1) 800ms",
          }}
        >
          <span className="text-xs tracking-widest uppercase">Explore</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────── */}
      <section className="py-16 border-y border-slate-100" style={{ background: "#F8FAFC" }}>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <div className="space-y-1">
                <div className="text-4xl font-black" style={{ color: "#1E3A5F" }}>
                  <Counter to={s.value} suffix={s.suffix} />
                </div>
                <div className="text-sm text-slate-500 font-medium">{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#F97316" }}>Platform Capabilities</p>
              <h2 className="text-4xl font-black" style={{ color: "#1E3A5F" }}>Built for serious talent identification</h2>
              <p className="text-slate-500 mt-3 max-w-xl mx-auto" style={{ textWrap: "balance" }}>
                Not a spreadsheet. Not a generic form. A purpose-built talent engine with models that understand sport.
              </p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 70}>
                <div
                  className="group p-7 rounded-2xl border border-slate-100 bg-white transition-all duration-300 hover:border-orange-200 cursor-default"
                  style={{
                    boxShadow: "0 2px 12px 0 rgba(30,58,95,0.06)",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 32px 0 rgba(30,58,95,0.12)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 12px 0 rgba(30,58,95,0.06)")}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105"
                    style={{ background: "#EFF6FF", color: "#1E3A5F" }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-base mb-2" style={{ color: "#1E3A5F" }}>{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY ─────────────────────────────────────────────── */}
      <section id="security" className="py-24 px-6" style={{ background: "#0F2340" }}>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#F97316" }}>Security Architecture</p>
              <h2 className="text-4xl font-black text-white">We see nothing. By design.</h2>
              <p className="text-slate-400 mt-3 max-w-xl mx-auto" style={{ textWrap: "balance" }}>
                Pratibha is engineered so your athlete records are structurally inaccessible to us — not a policy, a hard technical boundary.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {trustItems.map((item, i) => (
              <Reveal key={item.text} delay={i * 90}>
                <div className="flex items-start gap-4 p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(249,115,22,0.15)", color: "#F97316" }}>
                    {item.icon}
                  </div>
                  <span className="text-slate-200 font-medium leading-snug pt-2">{item.text}</span>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Data flow diagram */}
          <Reveal delay={200}>
            <div
              className="rounded-2xl p-8"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 text-center">What leaves your network</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
                {[
                  { label: "Athlete PII", blocked: true },
                  { label: "Raw Scores", blocked: true },
                  { label: "Athlete IDs", blocked: true },
                  { label: "Assessment Data", blocked: true },
                  { label: "License Heartbeat only", blocked: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold"
                    style={{
                      background: item.blocked ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                      color: item.blocked ? "#FCA5A5" : "#86EFAC",
                      border: `1px solid ${item.blocked ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
                    }}
                  >
                    {item.blocked
                      ? <span className="text-red-400">✗</span>
                      : <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                    {item.label}
                  </div>
                ))}
              </div>
              <p className="text-center text-slate-500 text-xs mt-6">
                License heartbeat = instance ID + athlete count + expiry date. Nothing else.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#F97316" }}>Workflow</p>
              <h2 className="text-4xl font-black" style={{ color: "#1E3A5F" }}>From CSV to ranked athletes in minutes</h2>
            </div>
          </Reveal>
          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute left-[calc(50%-1px)] top-8 bottom-8 w-0.5 bg-slate-100" />
            {[
              { step: "01", title: "Import your data", desc: "Upload a CSV or Excel file. Map columns once. Pratibha validates and parses all records instantly.", side: "left" },
              { step: "02", title: "Engine computes scores", desc: "Biometric, neuro-motor, and sport models compute composite scores for every athlete across all sports.", side: "right" },
              { step: "03", title: "Query in plain English", desc: "Ask 'Top sprinters aged 14–16 with high potential' and get a ranked, exportable result table.", side: "left" },
              { step: "04", title: "Export reports", desc: "Generate PDF talent reports per athlete or bulk CSV exports. Everything stays on your machine.", side: "right" },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 100}>
                <div className={`relative md:w-1/2 mb-10 ${item.side === "right" ? "md:ml-auto md:pl-12" : "md:pr-12"}`}>
                  <div
                    className="p-7 rounded-2xl border border-slate-100 bg-white"
                    style={{ boxShadow: "0 2px 16px rgba(30,58,95,0.07)" }}
                  >
                    <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#F97316" }}>Step {item.step}</div>
                    <h3 className="text-lg font-bold mb-2" style={{ color: "#1E3A5F" }}>{item.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: "#1E3A5F" }}>
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight" style={{ textWrap: "balance" }}>
              Ready to find your next champion?
            </h2>
            <p className="text-slate-400 mb-10 text-lg" style={{ textWrap: "balance" }}>
              Your data. Your infrastructure. Our intelligence.
            </p>
            <button
              onClick={() => navigate("/explorer")}
              className="group inline-flex items-center gap-3 px-10 py-5 rounded-full text-lg font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97] shadow-2xl shadow-orange-900/40"
              style={{ background: "#F97316" }}
            >
              Open Pratibha Platform
              <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="py-10 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "#1E3A5F" }}>
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold" style={{ color: "#1E3A5F" }}>Pratibha by SPLINK</span>
          </div>
          <p>© {new Date().getFullYear()} SPLINK Technologies. All rights reserved.</p>
          <div className="flex items-center gap-1 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
            <span className="text-green-600 font-medium">Zero data access architecture</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
