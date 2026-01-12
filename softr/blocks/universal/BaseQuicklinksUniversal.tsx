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
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/**
 * QUICK LINKS — Header Companion
 * - Dark glass, cyan/copper accents
 * - Mobile: collapsible to save vertical space
 * - Active page styling
 * - Office-only row for elevated roles
 * - Dev override: ?dev_office=1 forces Office row visible
 */
export default function Block() {
  const user = useCurrentUser();

  // ---- routes ----
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

  // ---- path helpers ----
  const cleanPath = (p: string) => (p || "").split("?")[0].split("#")[0].replace(/\/+$/, "");

  const [pathname, setPathname] = useState<string>(() =>
    typeof window === "undefined" ? "" : cleanPath(window.location.pathname || "")
  );

  useEffect(() => {
    const on = () => setPathname(cleanPath(window.location.pathname || ""));
    window.addEventListener("popstate", on);
    return () => window.removeEventListener("popstate", on);
  }, []);

  const isActive = (href: string) => pathname === cleanPath(href);

  // ---- role detection ----
  const roleStrings = useMemo(() => {
    const out: string[] = [];
    const add = (v: any) => {
      if (!v) return;
      if (Array.isArray(v)) return v.forEach(add);
      if (typeof v === "object") {
        if (v?.name) out.push(String(v.name));
        if (v?.title) out.push(String(v.title));
        return;
      }
      out.push(String(v));
    };

    add((user as any)?.UserGroup);
    add((user as any)?.userGroup);
    add((user as any)?.Role);
    add((user as any)?.role);
    add((user as any)?.Auth_Level);
    add((user as any)?.auth_level);
    add((user as any)?.fields?.UserGroup);
    add((user as any)?.fields?.Role);
    add((user as any)?.fields?.Auth_Level);

    try {
      const w: any = window as any;
      add(w?.logged_in_user?.UserGroup);
      add(w?.logged_in_user?.Role);
      add(w?.logged_in_user?.Auth_Level);
      add(w?.logged_in_user?.group_name);
      add(w?.logged_in_user?.groups);
      add(w?.logged_in_user?.user_groups);
    } catch {}

    return out.filter(Boolean);
  }, [user]);

  const isManagerPlus = useMemo(() => {
    const sp =
      typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const devOffice = sp?.get("dev_office") === "1";

    const val = roleStrings.join(" ").toLowerCase();
    if (devOffice) return true;
    return (
      val.includes("manager") ||
      val.includes("office") ||
      val.includes("admin") ||
      val.includes("dispatcher") ||
      val.includes("supervisor") ||
      val.includes("office+")
    );
  }, [roleStrings]);

  // ---- motion window ----
  const ACCENT = "0,233,239";
  const COPPER = "184,115,51";

  const rootRef = useRef<HTMLDivElement | null>(null);
  const [animationsActive, setAnimationsActive] = useState(false);

  useEffect(() => {
    const mq =
      typeof window !== "undefined"
        ? window.matchMedia?.("(prefers-reduced-motion: reduce)")
        : null;
    if (mq?.matches) return;

    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
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
      { threshold: 0.2 }
    );

    io.observe(el);

    const r = el.getBoundingClientRect?.();
    if (r && r.top < window.innerHeight && r.bottom > 0) startWindow();

    return () => {
      if (timer) clearTimeout(timer);
      io.disconnect();
    };
  }, []);

  // ---- mobile collapse ----
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia?.("(max-width: 640px)");
    const apply = () => {
      const m = !!mq?.matches;
      setIsMobile(m);
      setOpen(!m);
    };
    apply();
    if (!mq) return;
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  // ---- visuals ----
  const meshOverlay: CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundImage: `radial-gradient(circle at 50% 18%, rgba(${ACCENT},0.040) 0%, transparent 52%),
      radial-gradient(circle at 25% 70%, rgba(${COPPER},0.026) 0%, transparent 58%),
      radial-gradient(circle at 75% 70%, rgba(${COPPER},0.026) 0%, transparent 58%)`,
    pointerEvents: "none",
  };

  const rail: CSSProperties = {
    height: 3,
    background: `linear-gradient(90deg, rgba(${COPPER},0.95) 0%, rgba(${COPPER},0.35) 32%, rgba(${ACCENT},0.45) 52%, rgba(${COPPER},0.35) 72%, rgba(${COPPER},0.95) 100%)`,
    boxShadow: `0 0 18px rgba(${ACCENT},0.22), 0 0 34px rgba(${COPPER},0.18)`,
  };

  const railHalo: CSSProperties = {
    height: 10,
    background: `linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(${COPPER},0.10) 45%, rgba(${ACCENT},0.14) 100%)`,
    boxShadow: `0 -10px 26px rgba(${ACCENT},0.12), 0 -14px 40px rgba(${COPPER},0.10)`,
    pointerEvents: "none",
  };

  const titlePlate: CSSProperties = {
    position: "relative",
    padding: "10px 16px",
    borderRadius: 18,
    background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 14px 46px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)",
    overflow: "hidden",
  };

  const titleTextEN: CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    background: `linear-gradient(90deg, rgba(${ACCENT},0.92) 0%, rgba(229,231,235,0.86) 55%, rgba(${COPPER},0.90) 100%)`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    whiteSpace: "nowrap",
  };

  const titleTextES: CSSProperties = {
    fontSize: 12,
    fontWeight: 520,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "rgba(229,231,235,0.52)",
    whiteSpace: "nowrap",
  };

  const sep: CSSProperties = { color: "rgba(229,231,235,0.38)", fontWeight: 500 };

  const rowBase = (active?: boolean): CSSProperties => ({
    position: "relative",
    overflow: "hidden",
    background: active ? "rgba(0,0,0,0.74)" : "rgba(0,0,0,0.52)",
    border: active ? `1px solid rgba(${ACCENT},0.30)` : "1px solid rgba(255,255,255,0.10)",
    boxShadow: active
      ? `0 18px 56px rgba(0,0,0,0.78), 0 10px 30px rgba(${ACCENT},0.10), inset 0 1px 0 rgba(255,255,255,0.06)`
      : `0 14px 46px rgba(0,0,0,0.72), inset 0 1px 0 rgba(255,255,255,0.03)`,
    transition:
      "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease",
    textAlign: "left",
  });

  const chip = (rgb: string, aBg: number, aBorder: number): CSSProperties => ({
    width: 36,
    height: 36,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    background: `rgba(${rgb},${aBg})`,
    border: `1px solid rgba(${rgb},${aBorder})`,
  });

  const glowEdge: CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    opacity: 0,
    transition: "opacity 180ms ease",
    background: `linear-gradient(90deg, rgba(${COPPER},0.00) 0%, rgba(${COPPER},0.22) 22%, rgba(${ACCENT},0.28) 50%, rgba(${COPPER},0.18) 78%, rgba(${COPPER},0.00) 100%)`,
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
    labelEN: string;
    labelES: string;
    href: string;
    chipRgb: string;
  }) => {
    const active = isActive(p.href);
    const Icon = p.icon;

    return (
      <button
        type="button"
        aria-label={`${p.labelEN} - ${p.labelES}`}
        aria-current={active ? "page" : undefined}
        className="rk-focus rk-row w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl"
        style={{ cursor: "pointer", ...rowBase(active) }}
        onClick={() => nav(p.href)}
      >
        <div className="rk-glow-edge" style={glowEdge} />

        {animationsActive && active && <div className="rk-accent-swipe" style={swipeOverlay} />}
        {active && (
          <div
            className={`rk-pulse-ring ${animationsActive ? "active" : ""}`}
            style={pulseRing}
          />
        )}

        <div
          className="flex items-center gap-3 min-w-0 flex-1"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div style={chip(p.chipRgb, active ? 0.14 : 0.08, active ? 0.26 : 0.16)}>
            <Icon
              className="w-4 h-4"
              style={{
                color: active ? `rgba(${p.chipRgb},0.95)` : `rgba(${p.chipRgb},0.82)`,
              }}
            />
          </div>

          <div className="truncate">
            <span className="text-sm text-white" style={{ fontWeight: 650 }}>
              {p.labelEN}
            </span>{" "}
            <span style={sep}>|</span>{" "}
            <span
              className="text-sm"
              style={{ color: "rgba(229,231,235,0.52)", fontWeight: 520 }}
            >
              {p.labelES}
            </span>
          </div>
        </div>

        <ChevronRight
          className="w-4 h-4 flex-shrink-0"
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
    ? { icon: Home, labelEN: "Home", labelES: "inicio", href: routes.home, chipRgb: ACCENT }
    : {
        icon: Calendar,
        labelEN: "Today",
        labelES: "hoy",
        href: routes.today,
        chipRgb: "251,191,36",
      };

  return (
    <div
      ref={rootRef}
      style={{
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.00) 55%), rgba(0,0,0,0.70)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(10px)",
      }}
    >
      <style>{`
        @keyframes rkPulse {
          0%, 100% { opacity: 0; transform: scale(1); }
          50% { opacity: 0.50; transform: scale(1.12); }
        }
        @keyframes rkRailShimmer {
          0% { background-position: -180% 0; opacity: 0.65; }
          20% { opacity: 1; }
          100% { background-position: 180% 0; opacity: 0.65; }
        }
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

        .rk-row:hover {
          background: rgba(0,0,0,0.78) !important;
          border-color: rgba(${ACCENT},0.22) !important;
          transform: translateY(-1px);
          box-shadow: 0 20px 62px rgba(0,0,0,0.82), 0 10px 28px rgba(${ACCENT},0.10), inset 0 1px 0 rgba(255,255,255,0.06) !important;
        }
        .rk-row:hover .rk-glow-edge { opacity: 0.85; }

        .rk-focus:focus-visible {
          outline: 2px solid rgba(${ACCENT},0.55);
          outline-offset: 3px;
        }

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

      <div style={{ marginBottom: 10 }}>
        <div style={railHalo} />
        <div style={rail} className={animationsActive ? "rk-rail-shimmer" : ""} />
      </div>

      <div
        className="mx-auto w-full max-w-6xl px-4 sm:px-6"
        style={{ paddingTop: 12, paddingBottom: 14, position: "relative", zIndex: 1 }}
      >
        <div className="flex items-center justify-center mb-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Collapse quick links" : "Expand quick links"}
            className="rk-focus"
            style={{
              ...titlePlate,
              cursor: isMobile ? "pointer" : "default",
              userSelect: "none",
            }}
          >
            {animationsActive && (
              <div className="rk-accent-swipe" style={{ ...swipeOverlay, opacity: 0.26 }} />
            )}

            <div
              className="flex items-center justify-center gap-2"
              style={{ position: "relative", zIndex: 1 }}
            >
              <span style={titleTextEN}>Quick Links</span>
              <span style={sep}>|</span>
              <span style={titleTextES}>accesos</span>

              {isMobile && (
                open ? (
                  <ChevronUp
                    className="w-4 h-4 ml-1"
                    style={{ color: `rgba(${ACCENT},0.78)` }}
                  />
                ) : (
                  <ChevronDown
                    className="w-4 h-4 ml-1"
                    style={{ color: "rgba(229,231,235,0.52)" }}
                  />
                )
              )}
            </div>
          </button>
        </div>

        {open && (
          <div className="grid gap-3">
            <Row icon={FileText} labelEN="Reports" labelES="reportes" href={routes.reports} chipRgb={ACCENT} />
            <Row {...secondRow} />
            <Row icon={Info} labelEN="FAQ" labelES="preguntas frecuentes" href={routes.faq} chipRgb="229,231,235" />
            <Row icon={Bell} labelEN="Bulletins" labelES="boletines" href={routes.bulletins} chipRgb={ACCENT} />
            <Row icon={User} labelEN="Profile" labelES="perfil" href={routes.profile} chipRgb="229,231,235" />
            {isManagerPlus && (
              <Row icon={Shield} labelEN="Office Review" labelES="oficina" href={routes.officeReview} chipRgb="251,191,36" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}