import React, { type CSSProperties } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, FileText, Info, Bell, User, Calendar } from "lucide-react";

const RK_BG =
  "radial-gradient(900px 520px at 18% -12%, rgba(0,233,239,0.14), transparent 62%)," +
  "radial-gradient(900px 520px at 88% -6%, rgba(251,191,36,0.10), transparent 60%)," +
  "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.00) 30%)," +
  "#0B1020";

const GLOBAL_CSS = `
:root { --rk-home-bg: ${RK_BG}; --rk-home-fg: #E5E7EB; }
html, body { background: var(--rk-home-bg) !important; color: var(--rk-home-fg) !important; }
nav, section, footer { background: transparent !important; }
`;

export default function Block() {
  const nav = (href: string) => (window.location.href = href);

  const thinGray: CSSProperties = { color: "rgba(229,231,235,0.55)", fontWeight: 500 };

  const cardStyle: CSSProperties = {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 52px rgba(0,0,0,0.40)",
    backdropFilter: "blur(8px)",
  };

  const rowDivider: CSSProperties = { borderTop: "1px solid rgba(255,255,255,0.08)" };

  const iconBox = (variant: "cyan" | "neutral") => ({
    background: variant === "cyan" ? "rgba(0,233,239,0.10)" : "rgba(255,255,255,0.03)",
    border: variant === "cyan" ? "1px solid rgba(0,233,239,0.20)" : "1px solid rgba(255,255,255,0.10)",
  });

  return (
    <div id="rk-home-e">
      {/* If you move background CSS to Page Settings, you can delete this line later */}
      <style>{GLOBAL_CSS}</style>

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6" style={{ paddingTop: 12, paddingBottom: 18 }}>
        <Card className="rounded-2xl" style={cardStyle}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">
              Quick links <span style={thinGray}>|</span> <span style={thinGray}>accesos</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-0">
            <div style={rowDivider} />

            {/* Reports */}
            <button
              type="button"
              className="w-full flex items-center justify-between gap-3 py-3"
              style={{ cursor: "pointer" }}
              onClick={() => nav("/reports")}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={iconBox("cyan")}>
                  <FileText className="w-4 h-4" style={{ color: "rgba(0,233,239,0.96)" }} />
                </div>
                <div className="text-sm font-semibold text-white truncate">
                  Reports <span style={thinGray}>|</span> <span style={thinGray}>reportes</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: "rgba(229,231,235,0.55)" }} />
            </button>

            <div style={rowDivider} />

            {/* Today */}
            <button
              type="button"
              className="w-full flex items-center justify-between gap-3 py-3"
              style={{ cursor: "pointer" }}
              onClick={() => nav("/today")}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={iconBox("neutral")}>
                  <Calendar className="w-4 h-4" style={{ color: "rgba(229,231,235,0.90)" }} />
                </div>
                <div className="text-sm font-semibold text-white truncate">
                  Today <span style={thinGray}>|</span> <span style={thinGray}>hoy</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: "rgba(229,231,235,0.55)" }} />
            </button>

            <div style={rowDivider} />

            {/* FAQ */}
            <button
              type="button"
              className="w-full flex items-center justify-between gap-3 py-3"
              style={{ cursor: "pointer" }}
              onClick={() => nav("/faq")}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={iconBox("neutral")}>
                  <Info className="w-4 h-4" style={{ color: "rgba(229,231,235,0.90)" }} />
                </div>
                <div className="text-sm font-semibold text-white truncate">
                  FAQ <span style={thinGray}>|</span> <span style={thinGray}>ayuda</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: "rgba(229,231,235,0.55)" }} />
            </button>

            <div style={rowDivider} />

            {/* Bulletins */}
            <button
              type="button"
              className="w-full flex items-center justify-between gap-3 py-3"
              style={{ cursor: "pointer" }}
              onClick={() => nav("/bulletins")}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={iconBox("cyan")}>
                  <Bell className="w-4 h-4" style={{ color: "rgba(0,233,239,0.86)" }} />
                </div>
                <div className="text-sm font-semibold text-white truncate">
                  Bulletins <span style={thinGray}>|</span> <span style={thinGray}>boletines</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: "rgba(229,231,235,0.55)" }} />
            </button>

            <div style={rowDivider} />

            {/* Profile */}
            <button
              type="button"
              className="w-full flex items-center justify-between gap-3 py-3"
              style={{ cursor: "pointer" }}
              onClick={() => nav("/profile")}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={iconBox("neutral")}>
                  <User className="w-4 h-4" style={{ color: "rgba(229,231,235,0.90)" }} />
                </div>
                <div className="text-sm font-semibold text-white truncate">
                  Profile <span style={thinGray}>|</span> <span style={thinGray}>perfil</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: "rgba(229,231,235,0.55)" }} />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}