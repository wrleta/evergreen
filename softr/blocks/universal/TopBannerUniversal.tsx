import { useCurrentUser } from "@/lib/user";
import { User, Zap } from "lucide-react";
import { useMemo, useEffect, useState } from "react";

export default function Block() {
  const user = useCurrentUser();
  const [animationsActive, setAnimationsActive] = useState(true);
  const [logoOk, setLogoOk] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (mq?.matches) {
      setAnimationsActive(false);
      return;
    }
    const t = setTimeout(() => setAnimationsActive(false), 15000);
    return () => clearTimeout(t);
  }, []);

  const logoUrl = useMemo(() => {
    const w = window as Window & { __RK_ASSETS__?: { logoSquare?: string } };
    return w.__RK_ASSETS__?.logoSquare || "https://raw.githubusercontent.com/wrleta/evergreen/main/assets/brand/rk_logo_square.png";
  }, []);

  const nav = (href: string) => window.location.href = href;
  const routes = { home: "/home", profile: "/profile" };

  if (!user) return null;

  const userAvatarUrl = (user as any)?.avatarUrl;

  return (
    <div className="text-foreground">
      <style>{
        `@keyframes rkPulse {
          0%, 100% { opacity: 0; transform: scale(1); }
          50% { opacity: 0.50; transform: scale(1.12); }
        }
        @keyframes rkIconBlink {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(0,233,239,0.35)); opacity: 0.92; }
          50% { filter: drop-shadow(0 0 16px rgba(0,233,239,0.70)) drop-shadow(0 0 24px rgba(184,115,51,0.40)); opacity: 1; }
        }
         rkAccentSwipe {
          0%   { background-position: -200% 0; opacity: 0.00; }
          15%  { opacity: 0.45; }
          70%  { background-position: 120% 0; opacity: 0.35; }
          100% { background-position: 200% 0; opacity: 0.00; }
        }

10% { opacity: 0.55; }
          70% { background-position: 120% 0; opacity: 0.40; }
          85% { background-position: 170% 0; opacity: 0.22; }
          100% { background-position: 220% 0; opacity: 0; }
        }
        .rk-accent-swipe {
          background: linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(184,115,51,0) 35%, rgba(184,115,51,0.28) 45%, rgba(0,233,239,0.34) 52%, rgba(184,115,51,0.22) 60%, rgba(0,0,0,0) 75%, rgba(0,0,0,0) 100%);
          background-size: 220% 100%;
          animation: rkAccentSwipe 10s forwards;
          mix-blend-mode: screen;
        }
        .rk-pulse-ring.active { animation: rkPulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .rk-icon-blink.active { animation: rkIconBlink 3s ease-in-out infinite; }
        .rk-live:hover { transform: translateY(-2px) scale(1.05); }
        .rk-live-avatar:hover { transform: scale(1.08); }
        @media (prefers-reduced-motion: reduce) {
          .rk-live:hover, .rk-live-avatar:hover { transform: none; }
          .rk-pulse-ring, .rk-icon-blink, .rk-accent-swipe { animation: none !important; opacity: 0 !important; }
        }`
      }</style>

      <header className="sticky top-0 z-50 w-full bg-black border-b border-white/[0.06] backdrop-blur-sm">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 50% 50%, rgba(0,233,239,0.040) 0%, transparent 55%), radial-gradient(circle at 28% 55%, rgba(184,115,51,0.026) 0%, transparent 60%), radial-gradient(circle at 72% 55%, rgba(184,115,51,0.026) 0%, transparent 60%)"
          }}
        />

        <div className="container mx-auto relative z-10">
          <div className="content">
            <div className="flex items-center justify-between h-16 sm:h-[72px] gap-3">
              {/* Logo Section */}
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <button
                  type="button"
                  className={`w-11 h-11 sm:w-[52px] sm:h-[52px] rounded-2xl sm:rounded-[20px] grid place-items-center relative overflow-hidden p-0 transition-all duration-[260ms] focus-visible:outline-2 focus-visible:outline-[rgba(0,233,239,0.55)] focus-visible:outline-offset-[3px] flex-shrink-0 ${
                    animationsActive
                      ? "rk-live bg-gradient-to-br from-[rgba(0,233,239,0.12)] to-[rgba(184,115,51,0.08)] border-[1.5px] border-[rgba(0,233,239,0.25)] shadow-[0_8px_32px_rgba(0,233,239,0.16),inset_0_1px_0_rgba(255,255,255,0.08)]"
                      : "bg-transparent border border-transparent"
                  }`}
                  onClick={() => nav(routes.home)}
                  aria-label="Navigate to home page"
                >
                  {animationsActive && <div className="rk-accent-swipe absolute inset-0 pointer-events-none opacity-55" />}
                  {animationsActive && <div className="rk-pulse-ring active absolute inset-[-2px] rounded-[inherit] border-2 border-[rgba(0,233,239,0.40)] opacity-0 pointer-events-none" />}
                  {logoOk && logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="RK Logo"
                      className={`w-8 h-8 sm:w-[38px] sm:h-[38px] object-contain block ${
                        animationsActive ? "rk-icon-blink active" : ""
                      }`}
                      onError={() => setLogoOk(false)}
                    />
                  ) : (
                    <div
                      className={`w-8 h-8 sm:w-[38px] sm:h-[38px] rounded-xl sm:rounded-2xl bg-gradient-to-br from-[rgba(0,233,239,0.85)] to-[rgba(0,233,239,0.65)] grid place-items-center ${
                        animationsActive ? "rk-icon-blink active" : ""
                      }`}
                    >
                      <span className="text-xs sm:text-sm tracking-[0.18em] text-black font-bold">RK</span>
                    </div>
                  )}
                </button>

                {/* Title Section - Hidden on mobile, visible on tablet+ */}
                <div className="hidden md:flex items-center gap-2 lg:gap-3 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[rgba(0,233,239,0.80)] shadow-[0_0_12px_rgba(0,233,239,0.55)] flex-shrink-0" />
                  <div className="min-w-0">
                    <h1 className="text-[10px] lg:text-xs font-semibold tracking-[0.14em] lg:tracking-[0.18em] uppercase bg-gradient-to-r from-[rgba(0,233,239,0.95)] via-[rgba(229,231,235,0.84)] to-[rgba(184,115,51,0.92)] bg-clip-text text-transparent whitespace-nowrap overflow-hidden text-ellipsis">
                      Field Reporting System
                    </h1>
                    <div className="flex items-center gap-1.5 lg:gap-2 mt-1">
                      <Zap className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-[rgba(0,233,239,0.70)] flex-shrink-0" />
                      <div className="text-[9px] lg:text-[10px] tracking-[0.08em] text-[rgba(229,231,235,0.60)] uppercase whitespace-nowrap">Live System</div>
                    </div>
                  </div>
                </div>

                {/* Mobile Title - Visible only on mobile */}
                <div className="flex md:hidden items-center gap-2 min-w-0">
                  <div className="w-1 h-1 rounded-full bg-[rgba(0,233,239,0.80)] shadow-[0_0_8px_rgba(0,233,239,0.55)] flex-shrink-0" />
                  <h1 className="text-[10px] font-semibold tracking-[0.12em] uppercase bg-gradient-to-r from-[rgba(0,233,239,0.95)] to-[rgba(184,115,51,0.92)] bg-clip-text text-transparent whitespace-nowrap overflow-hidden text-ellipsis">
                    Field Reports
                  </h1>
                </div>
              </div>

              {/* User Avatar */}
              <button
                type="button"
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl sm:rounded-3xl grid place-items-center relative overflow-hidden p-0 transition-all duration-[260ms] focus-visible:outline-2 focus-visible:outline-[rgba(0,233,239,0.55)] focus-visible:outline-offset-[3px] flex-shrink-0 ${
                  animationsActive
                    ? "rk-live-avatar bg-gradient-to-br from-[rgba(0,233,239,0.12)] to-[rgba(184,115,51,0.08)] border-[1.5px] border-[rgba(0,233,239,0.30)] shadow-[0_7px_28px_rgba(0,233,239,0.20),inset_0_1px_0_rgba(255,255,255,0.10)]"
                    : "bg-transparent border border-transparent"
                }`}
                onClick={() => nav(routes.profile)}
                aria-label={`Navigate to profile page${(user as any)?.name ? ` for ${(user as any)?.name}` : ""}`}
              >
                {animationsActive && <div className="rk-accent-swipe absolute inset-0 pointer-events-none opacity-55" />}
                {animationsActive && <div className="rk-pulse-ring active absolute inset-[-2px] rounded-[inherit] border-2 border-[rgba(0,233,239,0.40)] opacity-0 pointer-events-none" />}
                {userAvatarUrl ? (
                  <img
                    src={userAvatarUrl}
                    alt={(user as any)?.name || "User profile"}
                    className={`w-full h-full object-cover rounded-[inherit] ${
                      animationsActive ? "rk-icon-blink active" : ""
                    }`}
                  />
                ) : (
                  <User
                    className={`w-4 h-4 sm:w-5 sm:h-5 text-[rgba(0,233,239,0.90)] ${
                      animationsActive ? "rk-icon-blink active" : ""
                    }`}
                  />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          className="h-[2px] sm:h-[3px]"
          style={{
            background: "linear-gradient(90deg, rgba(184,115,51,0.95) 0%, rgba(184,115,51,0.35) 32%, rgba(0,233,239,0.45) 52%, rgba(184,115,51,0.35) 72%, rgba(184,115,51,0.95) 100%)",
            boxShadow: "0 0 18px rgba(0,233,239,0.22), 0 0 34px rgba(184,115,51,0.18)"
          }}
        />
        <div
          className="h-2 sm:h-3 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(0,233,239,0.14) 0%, rgba(184,115,51,0.10) 55%, rgba(0,0,0,0.00) 100%)",
            boxShadow: "0 10px 26px rgba(0,233,239,0.12), 0 14px 40px rgba(184,115,51,0.10)"
          }}
        />
      </header>
    </div>
  );
}