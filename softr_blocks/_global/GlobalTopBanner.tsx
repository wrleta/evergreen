import React, { useMemo, useEffect, useState, type CSSProperties } from "react";
import { useCurrentUser } from "@/lib/user";
import { User, Zap } from "lucide-react";

export default function RkTopBanner() {
  const user = useCurrentUser();

  // time-boxed motion: lively on load, then settles (no visible buttons)
  const [animationsActive, setAnimationsActive] = useState(true);
  const [logoOk, setLogoOk] = useState(true);

  useEffect(() => {
    const mq =
      typeof window !== "undefined"
        ? window.matchMedia?.("(prefers-reduced-motion: reduce)")
        : null;

    if (mq?.matches) {
      setAnimationsActive(false);
      return;
    }

    const t = setTimeout(() => setAnimationsActive(false), 15000);
    return () => clearTimeout(t);
  }, []);

  const routes = { home: "/home", profile: "/profile" };
  const nav = (href: string) => (window.location.href = href);

  const logoUrl = useMemo(() => {
    const w: any = typeof window !== "undefined" ? window : null;
    const fromGlobal = w?.__RK_ASSETS__?.logoSquare;
    if (fromGlobal && typeof fromGlobal === "string") return fromGlobal;
    return "https://raw.githubusercontent.com/wrleta/evergreen/main/assets/rk_logo_square.png";
  }, []);

  // palette
  const BG = "#000000";
  const TEXT = "#E5E7EB";
  const ACCENT = "0,233,239"; // #00E9EF
  const COPPER = "184,115,51";

  const wrap: CSSProperties = {
    background: BG,
    position: "relative",
    overflow: "hidden",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  };

  const meshOverlay: CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundImage: `
      radial-gradient(circle at 50% 50%, rgba(${ACCENT},0.040) 0%, transparent 55%),
      radial-gradient(circle at 28% 55%, rgba(${COPPER},0.026) 0%, transparent 60%),
      radial-gradient(circle at 72% 55%, rgba(${COPPER},0.026) 0%, transparent 60%)
    `,
    pointerEvents: "none",
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

  // “visible tile” while animationsActive
  const btnLive: CSSProperties = {
    width: 52,
    height: 52,
    borderRadius: 20,
    display: "grid",
    placeItems: "center",
    background: `linear-gradient(135deg, rgba(${ACCENT},0.12) 0%, rgba(${COPPER},0.08) 100%)`,
    border: `1.5px solid rgba(${ACCENT},0.25)`,
    boxShadow: `0 8px 32px rgba(${ACCENT},0.16), inset 0 1px 0 rgba(255,255,255,0.08)`,
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
    padding: 0,
    transition: "all 260ms cubic-bezier(0.4, 0, 0.2, 1)",
  };

  const avatarLive: CSSProperties = {
    ...btnLive,
    width: 48,
    height: 48,
    borderRadius: 24,
    border: `1.5px solid rgba(${ACCENT},0.30)`,
    boxShadow: `0 7px 28px rgba(${ACCENT},0.20), inset 0 1px 0 rgba(255,255,255,0.10)`,
  };

  // “invisible button” after settle — black banner only (still clickable)
  const btnStealth: CSSProperties = {
    width: 52,
    height: 52,
    borderRadius: 20,
    display: "grid",
    placeItems: "center",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.00)",
    boxShadow: "none",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
    padding: 0,
  };

  const avatarStealth: CSSProperties = {
    ...btnStealth,
    width: 48,
    height: 48,
    borderRadius: 24,
  };

  const pulseRing: CSSProperties = {
    position: "absolute",
    inset: -2,
    borderRadius: "inherit",
    border: `2px solid rgba(${ACCENT},0.40)`,
    opacity: 0,
    pointerEvents: "none",
  };

  const swipeOverlay: CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    opacity: 0.55,
    transform: "translateZ(0)",
    willChange: "background-position, opacity",
  };

  const titleStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    background: `linear-gradient(
      90deg,
      rgba(${ACCENT},0.95) 0%,
      rgba(229,231,235,0.84) 50%,
      rgba(${COPPER},0.92) 100%
    )`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const accentDot: CSSProperties = {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: `rgba(${ACCENT},0.80)`,
    boxShadow: `0 0 12px rgba(${ACCENT},0.55)`,
    flex: "0 0 auto",
  };

  if (!user) return null;

  const rkBtnStyle = animationsActive ? btnLive : btnStealth;
  const avatarBtnStyle = animationsActive ? avatarLive : avatarStealth;

  return (
    <div style={{ color: TEXT }}>
      <style>{`
        @keyframes rkPulse {
          0%, 100% { opacity: 0; transform: scale(1); }
          50% { opacity: 0.60; transform: scale(1.15); }
        }

        /* Blink/glow on the actual icon/image (what you asked for) */
        @keyframes rkIconBlink {
          0%, 100% {
            filter: drop-shadow(0 0 8px rgba(${ACCENT},0.35));
            opacity: 0.92;
          }
          50% {
            filter: drop-shadow(0 0 16px rgba(${ACCENT},0.70)) drop-shadow(0 0 24px rgba(${COPPER},0.40));
            opacity: 1;
          }
        }

        /* Swipe hit (once) */
        @keyframes rkAccentSwipeLanding {
          0%   { background-position: -220% 0; opacity: 0.00; }
          10%  { opacity: 0.55; }
          70%  { background-position: 120% 0; opacity: 0.40; }
          85%  { background-position: 170% 0; opacity: 0.22; }
          100% { background-position: 220% 0; opacity: 0.00; }
        }

        .rk-accent-swipe {
          background: linear-gradient(
            90deg,
            rgba(0,0,0,0.00) 0%,
            rgba(${COPPER},0.00) 35%,
            rgba(${COPPER},0.28) 45%,
            rgba(${ACCENT},0.34) 52%,
            rgba(${COPPER},0.22) 60%,
            rgba(0,0,0,0.00) 75%,
            rgba(0,0,0,0.00) 100%
          );
          background-size: 240% 100%;
          animation: rkAccentSwipeLanding 12s forwards;
          mix-blend-mode: screen;
        }

        .rk-pulse-ring.active { animation: rkPulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .rk-icon-blink.active { animation: rkIconBlink 3s ease-in-out infinite; }

        /* Hover lift ONLY while live (doesn't reveal tiles after settle) */
        .rk-live:hover { transform: translateY(-2px) scale(1.05); }
        .rk-live-avatar:hover { transform: scale(1.08); }

        /* Keyboard focus only */
        .rk-focus:focus-visible {
          outline: 2px solid rgba(${ACCENT},0.55);
          outline-offset: 3px;
        }

        @media (prefers-reduced-motion: reduce) {
          .rk-live:hover, .rk-live-avatar:hover { transform: none; }
          .rk-pulse-ring, .rk-icon-blink, .rk-accent-swipe { animation: none !important; opacity: 0 !important; }
        }
      `}</style>

      <header style={wrap}>
        <div style={meshOverlay} />

        {/* No “box island” — just a clean row */}
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6" style={{ position: "relative", zIndex: 1 }}>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-4 min-w-0">
              {/* RK button */}
              <button
                type="button"
                className={`rk-focus ${animationsActive ? "rk-live" : ""}`}
                style={rkBtnStyle}
                aria-label="Home"
                title="Home"
                onClick={() => nav(routes.home)}
              >
                {animationsActive ? <div className="rk-accent-swipe" style={swipeOverlay} /> : null}
                <div className={`rk-pulse-ring ${animationsActive ? "active" : ""}`} style={pulseRing} />

                {logoOk ? (
                  <img
                    src={logoUrl}
                    alt="RK"
                    className={`rk-icon-blink ${animationsActive ? "active" : ""}`}
                    style={{ width: 38, height: 38, objectFit: "contain", display: "block" }}
                    onError={() => setLogoOk(false)}
                  />
                ) : (
                  <span
                    className={`rk-icon-blink ${animationsActive ? "active" : ""}`}
                    style={{ fontSize: 12, letterSpacing: "0.18em", color: "rgba(229,231,235,0.86)" }}
                  >
                    RK
                  </span>
                )}
              </button>

              {/* Title (kept) */}
              <div className="hidden sm:flex items-center gap-3 min-w-0">
                <div style={accentDot} />
                <div style={{ minWidth: 0 }}>
                  <div style={titleStyle}>FIELD REPORTING SYSTEM</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Zap className="w-3 h-3" style={{ color: `rgba(${ACCENT},0.70)` }} />
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.08em",
                        color: "rgba(229,231,235,0.60)",
                        textTransform: "uppercase",
                      }}
                    >
                      Live System
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile button (same motion as RK) */}
            <button
              type="button"
              className={`rk-focus ${animationsActive ? "rk-live-avatar" : ""}`}
              style={avatarBtnStyle}
              aria-label="Profile"
              title="Profile"
              onClick={() => nav(routes.profile)}
            >
              {animationsActive ? <div className="rk-accent-swipe" style={swipeOverlay} /> : null}
              <div className={`rk-pulse-ring ${animationsActive ? "active" : ""}`} style={pulseRing} />

              {(user as any)?.avatarUrl ? (
                <img
                  src={(user as any).avatarUrl}
                  alt="Profile"
                  className={`rk-icon-blink ${animationsActive ? "active" : ""}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <User
                  className={`w-5 h-5 rk-icon-blink ${animationsActive ? "active" : ""}`}
                  style={{ color: `rgba(${ACCENT},0.90)` }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Rail + halo (kept) */}
        <div style={rail} />
        <div style={railHalo} />
      </header>
    </div>
  );
}