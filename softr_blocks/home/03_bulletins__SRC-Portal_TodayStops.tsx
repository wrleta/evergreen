import React, { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/user";
import { Calendar, ChevronRight, MapPin } from "lucide-react";

type HomeState = { q: string; showStops: boolean; showBulletins: boolean };
const HOME_STATE_KEY = "__RK_HOME_STATE__";
const HOME_EVENT = "rk-home-state";

function toText(v: any) {
  return v === undefined || v === null ? "" : String(v);
}
function pick(obj: any, keys: string[]) {
  for (const k of keys) {
    const v =
      obj?.[k] ??
      obj?.fields?.[k] ??
      obj?.attributes?.[k] ??
      obj?.record?.[k] ??
      obj?.record?.fields?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return "";
}
function getHomeState(): HomeState {
  const w = window as any;
  const cur = (w?.[HOME_STATE_KEY] ?? {}) as Partial<HomeState>;
  return {
    q: toText(cur.q ?? ""),
    showStops: cur.showStops ?? true,
    showBulletins: cur.showBulletins ?? true,
  };
}

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

export default function Block(props: any) {
  useCurrentUser(); // keeps auth consistent
  const [home, setHome] = useState<HomeState>(() => (typeof window !== "undefined" ? getHomeState() : { q: "", showStops: true, showBulletins: true }));

  const stops = Array.isArray(props?.stops)
    ? props.stops
    : Array.isArray(props?.records)
    ? props.records
    : Array.isArray(props?.items)
    ? props.items
    : [];

  useEffect(() => {
    const handler = (e: any) => setHome(e?.detail ?? getHomeState());
    window.addEventListener(HOME_EVENT, handler as any);
    return () => window.removeEventListener(HOME_EVENT, handler as any);
  }, []);

  const q = home.q.trim().toLowerCase();
  const visible = home.showStops;

  const cardStyle: CSSProperties = {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 52px rgba(0,0,0,0.40)",
    backdropFilter: "blur(8px)",
  };

  const thinGray: CSSProperties = { color: "rgba(229,231,235,0.55)", fontWeight: 500 };
  const clamp1: CSSProperties = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
  const clamp2: CSSProperties = {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as any,
    overflow: "hidden",
  };

  const rows = useMemo(() => {
    const base = Array.isArray(stops) ? stops : [];
    const filtered = !q
      ? base
      : base.filter((s: any) => {
          const site = toText(pick(s, ["Site_Name", "Jobsite_Name", "Jobsite", "Site"])).toLowerCase();
          const addr = toText(pick(s, ["Address_1", "Address", "City", "State", "Zip"])).toLowerCase();
          const task = toText(pick(s, ["Stop_Title", "Task_Short", "Task", "Scope_Short"])).toLowerCase();
          return site.includes(q) || addr.includes(q) || task.includes(q);
        });

    const sorted = filtered.slice().sort((a: any, b: any) => {
      const ao = Number(pick(a, ["Stop_Order", "Order"]) || 9999);
      const bo = Number(pick(b, ["Stop_Order", "Order"]) || 9999);
      return ao - bo;
    });

    return sorted.slice(0, 4);
  }, [stops, q]);

  const nav = (href: string) => (window.location.href = href);

  if (!visible) return <style>{GLOBAL_CSS}</style>;

  return (
    <div id="rk-home-b">
      <style>{GLOBAL_CSS}</style>
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6" style={{ paddingTop: 12, paddingBottom: 12 }}>
        <Card className="rounded-3xl" style={cardStyle}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className="w-5 h-5" style={{ color: "rgba(0,233,239,0.96)" }} />
                <CardTitle className="text-lg text-white" style={clamp1}>
                  Today <span style={thinGray}>|</span> <span style={thinGray}>hoy</span>
                </CardTitle>
              </div>

              <Button
                variant="ghost"
                className="h-9 px-2 text-base"
                style={{ color: "rgba(0,233,239,0.96)" }}
                onClick={() => nav("/today")}
              >
                Go <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {rows.length ? (
              <div>
                {rows.map((s: any, idx: number) => {
                  const site = pick(s, ["Site_Name", "Jobsite_Name", "Jobsite", "Site"]);
                  const addr1 = pick(s, ["Address_1", "Address"]);
                  const city = pick(s, ["City"]);
                  const state = pick(s, ["State"]);
                  const zip = pick(s, ["Zip"]);
                  const task = pick(s, ["Stop_Title", "Task_Short", "Task", "Scope_Short"]);
                  const isLast = idx === rows.length - 1;

                  return (
                    <div
                      key={s?.id || s?.Stop_ID || idx}
                      className="py-4"
                      style={{ borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.10)" }}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 mt-1" style={{ color: "rgba(229,231,235,0.55)" }} />
                        <div className="min-w-0 flex-1">
                          <div className="text-base font-semibold text-white" style={clamp1}>
                            {toText(site) || `Stop ${idx + 1}`}
                          </div>

                          {(addr1 || city || state || zip) ? (
                            <div className="text-sm mt-1" style={{ color: "rgba(229,231,235,0.68)", ...clamp1 }}>
                              {toText(addr1)} {toText(city)} {toText(state)} {toText(zip)}
                            </div>
                          ) : null}

                          {task ? (
                            <div className="text-base mt-2" style={{ color: "rgba(229,231,235,0.80)", ...clamp2 }}>
                              {toText(task)}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="text-lg text-white">No stops match</div>
                <div className="text-base mt-2" style={{ color: "rgba(229,231,235,0.65)" }}>
                  Adjust search/filter above.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}