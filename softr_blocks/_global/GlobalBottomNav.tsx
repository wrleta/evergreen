import { useMemo, useState, useEffect, useRef, type CSSProperties } from "react";
import { useCurrentUser } from "@/lib/user";
import {
  ChevronRight,
  FileText,
  Calendar,
  Info,
  Bell,
  User,
  Shield,
  Home,
} from "lucide-react";

export default function Block() {
  const user = useCurrentUser();

  const routes = {
    home: "/home",
    reports: "/reports",
    today: "/today",
    faq: "/faq",
    bulletins: "/bulletins",
    profile: "/profile",
    officeReview: "/office-review",
  };

  const nav = (href: string) => (window.location.href = href);
  const toText = (v: any) => (v === undefined || v === null ? "" : String(v));

  const isManagerPlus = useMemo(() => {
    const raw =
      (user as any)?.UserGroup ??
      (user as any)?.userGroup ??
      (user as any)?.Role ??
      (user as any)?.role ??
      (user as any)?.Auth_Level ??
      (user as any)?.auth_level ??
      (user as any)?.fields?.UserGroup ??
      (user as any)?.fields?.Role ??
      (user as any)?.fields?.Auth_Level;

    const val = toText(raw).toLowerCase();
    return (
      val.includes("manager") ||
      val.includes("office") ||
      val.includes("admin") ||
      val.includes("dispatcher") ||
      val.includes("supervisor")
    );
  }, [user]);

  const cleanPath = (p: string) => (p || "").split("?")[0].split("#")[0].replace(/\/+$/, "");
  const pathname = useMemo(
    () => (typeof window === "undefined" ? "" : cleanPath(window.location.pathname || "")),
    []
  );
  const isActive = (href: string) => pathname === cleanPath(href);

  // Palette
  const ACCENT = "0,233,239"; // #00E9EF
  const COPPER = "184,115,51";

  // Visibility-triggered animation window
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [animationsActive, setAnimationsActive] = useState(false);

  useEffect(() => {
    const mq =
      typeof window !== "undefined"
        ? window.matchMedia?.("(prefers-reduced-motion: reduce)")
        : null;

    if (mq?.matches) return; // keep it calm

    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      // fallback: run once
      setAnimationsActive(true);
      const t = setTimeout(() => setAnimationsActive(false), 15000);
      return () => clearTimeout(t);
    }

    let timer: any = null;

    const startWindow = () => {
      setAnimationsActive(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setAnimationsActive(false), 15000);
    };

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e?.isIntersecting) startWindow();
      },
      { threshold: 0.25 }
    );

    io.observe(el);

    // if already visible on load
    const r = el.getBoundingClientRect?.();
    if (r && r.top < window.innerHeight && r.bottom > 0) startWindow();

    return () => {
      if (timer) clearTimeout(timer);
      io.disconnect();
    };
  }, []);

  const meshOverlay: CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundImage: `
      radial-gradient(circle at 50% 18%, rgba(${ACCENT},0.040) 0%, transparent 52%),
      radial-gradient(circle at 25% 70%, rgba(${COPPER},0.026) 0%, transparent 58%),
      radial-gradient(circle at 75% 70%, rgba(${COPPER},0.026) 0%, transparent 58%)
    `,
    pointerEvents: "none",
  };

  // Full-width rail helper (works inside max-w containers)
  const fullBleed: CSSProperties = {
    position: "relative",
    left: "50%",
    right: "50%",
    marginLeft: "-50vw",
    marginRight: "-50vw",
    width: "100vw",
  };

  const rail: CSSProperties = {
    height: 3,
    background: `linear-gradient(
      90deg,
      rgba(${COPPER},0.95) 0%,
      rgba(${COPPER},0.35) 32%,
      rgba(${ACCENT},0.45) 52%,
      rgba(${COPPER},0.35) 72%,
      rgba(${COPPER},0.95) 100%
    )`,
    boxShadow: `0 0 18px rgba(${ACCENT},0.22), 0 0 34px rgba(${COPPER},0.18)`,
  };

  const railHalo: CSSProperties = {
    height: 12,
    background: `linear-gradient(
      180deg,
      rgba(${ACCENT},0.14) 0%,
      rgba(${COPPER},0.10) 55%,
      rgba(0,0,0,0.00) 100%
    )`,
    boxShadow: `0 10px 26px rgba(${ACCENT},0.12), 0 14px 40px rgba(${COPPER},0.10)`,
    pointerEvents: "none",
  };

  const titlePlate: CSSProperties = {
    position: "relative",
    padding: "10px 14px",
    borderRadius: 18,
    background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 14px 46px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)",
    overflow: "hidden",
  };

  const titleText: CSSProperties = {
    fontSize: 14,
    fontWeight: 650,
    letterSpacing: "0.04em",
    background: `linear-gradient(90deg, rgba(${ACCENT},0.92) 0%, rgba(229,231,235,0.88) 50%, rgba(${COPPER},0.90) 100%)`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    whiteSpace: "nowrap",
  };

  const subSep: CSSProperties = { color: "rgba(229,231,235,0.45)", fontWeight: 500 };

  const rowBase = (active?: boolean): CSSProperties => ({
    position: "relative",
    overflow: "hidden",
    background: active ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0.52)",
    border: active ? `1px solid rgba(${ACCENT},0.30)` : "1px solid rgba(255,255,255,0.10)",
    boxShadow: active
      ? `0 18px 56px rgba(0,0,0,0.78), 0 10px 30px rgba(${ACCENT},0.10), inset 0 1px 0 rgba(255,255,255,0.06)`
      : `0 14px 46px rgba(0,0,0,0.72), inset 0 1px 0 rgba(255,255,255,0.03)`,
    transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease",
  });

  const chip = (rgb: string, aBg: number, aBorder: number): CSSProperties => ({
    width: 36,
    height: 36,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: `rgba(${rgb},${aBg})`,
    border: `1px solid rgba(${rgb},${aBorder})`,
  });

  const glowEdge: CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    opacity: 0,
    transition: "opacity 180ms ease",
    background:
      `linear-gradient(90deg,
        rgba(${COPPER},0.00) 0%,
        rgba(${COPPER},0.22) 22%,
        rgba(${ACCENT},0.28) 50%,
        rgba(${COPPER},0.18) 78%,
        rgba(${COPPER},0.00) 100%
      )`,
    mixBlendMode: "screen",
  };

  const pulseRing: CSSProperties = {
    position: "absolute",
    inset: -2,
    borderRadius: "inherit",
    border: `2px solid rgba(${ACCENT},0.34)`,
    opacity: 0,
    pointerEvents: "none",
  };

  const swipeOverlay: CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    opacity: 0.45,
  };

  const Row = (p: {
    icon: any;
    label: string;
    sub: string;
    href: string;
    chipRgb: string;
  }) => {
    const active = isActive(p.href);
    const Icon = p.icon;

    return (
      <button
        type="button"
        aria-current={active ? "page" : undefined}
        className={`rk-focus rk-row w-full flex items-center justify-between px-4 py-3.5 rounded-2xl`}
        style={{ cursor: "pointer", ...rowBase(active) }}
        onClick={() => nav(p.href)}
      >
        {/* hover glow edge */}
        <div className="rk-glow-edge" style={glowEdge} />

        {/* active “wake up” effects (only during animation window) */}
        {animationsActive && active ? <div className="rk-accent-swipe" style={swipeOverlay} /> : null}
        {active ? <div className={`rk-pulse-ring ${animationsActive ? "active" : ""}`} style={pulseRing} /> : null}

        <div className="flex items-center gap-3 min-w-0" style={{ position: "relative", zIndex: 1 }}>
          <div style={chip(p.chipRgb, active ? 0.14 : 0.08, active ? 0.26 : 0.16)}>
            <Icon className="w-4 h-4" style={{ color: active ? `rgba(${p.chipRgb},0.95)` : `rgba(${p.chipRgb},0.82)` }} />
          </div>

          <div className="text-sm font-semibold text-white truncate">
            {p.label} <span style={subSep}>|</span> <span style={subSep}>{p.sub}</span>
          </div>
        </div>

        <ChevronRight
          className="w-4 h-4"
          style={{
            color: active ? `rgba(${ACCENT},0.78)` : "rgba(229,231,235,0.52)",
            position: "relative",
            zIndex: 1,
          }}
        />
      </button>
    );
  };

  if (!user) return null;

  const onToday = pathname === cleanPath(routes.today);

  const secondRow = onToday
    ? { icon: Home, label: "Home", sub: "inicio", href: routes.home, chipRgb: ACCENT }
    : { icon: Calendar, label: "Today", sub: "hoy", href: routes.today, chipRgb: "251,191,36" };

  return (
    <div ref={rootRef} style={{ position: "relative", background: "#000", overflow: "hidden" }}>
      <style>{`
        @keyframes rkPulse {
          0%, 100% { opacity: 0; transform: scale(1); }
          50% { opacity: 0.50; transform: scale(1.12); }
        }

        /* Rail shimmer (first 15s when visible) */
        @keyframes rkRailShimmer {
          0% { background-position: -180% 0; opacity: 0.65; }
          20% { opacity: 1; }
          100% { background-position: 180% 0; opacity: 0.65; }
        }

        /* Accent swipe (active row during window) */
        @keyframes rkAccentSwipe {
          0%   { background-position: -200% 0; opacity: 0.00; }
          15%  { opacity: 0.45; }
          70%  { background-position: 120% 0; opacity: 0.35; }
          100% { background-position: 200% 0; opacity: 0.00; }
        }

        .rk-accent-swipe {
          background: linear-gradient(
            90deg,
            rgba(0,0,0,0.00) 0%,
            rgba(${COPPER},0.00) 30%,
            rgba(${COPPER},0.22) 42%,
            rgba(${ACCENT},0.28) 50%,
            rgba(${COPPER},0.18) 58%,
            rgba(0,0,0,0.00) 70%,
            rgba(0,0,0,0.00) 100%
          );
          background-size: 220% 100%;
          animation: rkAccentSwipe 10s forwards;
          mix-blend-mode: screen;
        }

        .rk-pulse-ring.active { animation: rkPulse 2.8s cubic-bezier(0.4, 0, 0.6, 1) infinite; }

        /* Hover behavior: darker inside + glow edge + slight lift */
        .rk-row:hover {
          background: rgba(0,0,0,0.78) !important;
          border-color: rgba(${ACCENT},0.22) !important;
          transform: translateY(-1px);
          box-shadow: 0 20px 62px rgba(0,0,0,0.82), 0 10px 28px rgba(${ACCENT},0.10), inset 0 1px 0 rgba(255,255,255,0.06) !important;
        }
        .rk-row:hover .rk-glow-edge { opacity: 0.85; }

        /* Focus ring */
        .rk-focus:focus-visible {
          outline: 2px solid rgba(${ACCENT},0.55);
          outline-offset: 3px;
        }

        /* Rail shimmer class (only when window is active) */
        .rk-rail-shimmer {
          background-size: 240% 100% !important;
          animation: rkRailShimmer 12s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .rk-row:hover { transform: none; }
          .rk-pulse-ring, .rk-accent-swipe { animation: none !important; opacity: 0 !important; }
          .rk-rail-shimmer { animation: none !important; }
        }
      `}</style>

      <div style={meshOverlay} />

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6" style={{ paddingTop: 18, paddingBottom: 18, position: "relative", zIndex: 1 }}>
        {/* Title plate */}
        <div className="flex items-center justify-center mb-4">
          <div style={titlePlate}>
            {animationsActive ? <div className="rk-accent-swipe" style={{ ...swipeOverlay, opacity: 0.30 }} /> : null}

            <div className="flex items-center justify-center gap-2" style={{ position: "relative", zIndex: 1 }}>
              <div style={titleText}>
                Quick Links <span style={subSep}>|</span> <span style={subSep}>accesos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width rail + halo */}
        <div style={{ ...fullBleed, paddingBottom: 14 }}>
          <div style={{ ...rail }} className={animationsActive ? "rk-rail-shimmer" : ""} />
          <div style={railHalo} />
        </div>

        {/* Rows */}
        <div className="space-y-3">
          <Row icon={FileText} label="Reports" sub="reportes" href={routes.reports} chipRgb={ACCENT} />
          <Row {...secondRow} />
          <Row icon={Info} label="FAQ" sub="preguntas frecuentes" href={routes.faq} chipRgb={"229,231,235"} />
          <Row icon={Bell} label="Bulletins" sub="boletines" href={routes.bulletins} chipRgb={ACCENT} />
          <Row icon={User} label="Profile" sub="perfil" href={routes.profile} chipRgb={"229,231,235"} />
          {isManagerPlus ? (
            <Row icon={Shield} label="Office review" sub="oficina" href={routes.officeReview} chipRgb={"251,191,36"} />
          ) : null}
        </div>
      </div>
    </div>
  );
}