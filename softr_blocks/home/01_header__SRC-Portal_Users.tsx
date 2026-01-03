import React, { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Info, Search, User, Filter, ChevronRight, Shield, MapPin } from "lucide-react";

type HomeState = { q: string; showStops: boolean; showBulletins: boolean };
const HOME_STATE_KEY = "__RK_HOME_STATE__";
const HOME_EVENT = "rk-home-state";

function toText(v: any) {
  return v === undefined || v === null ? "" : String(v);
}
function truthy(v: any) {
  const s = toText(v).trim().toLowerCase();
  return s === "true" || s === "yes" || s === "1" || s === "y";
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
function setHomeState(next: HomeState) {
  const w = window as any;
  w[HOME_STATE_KEY] = next;
  window.dispatchEvent(new CustomEvent(HOME_EVENT, { detail: next }));
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
  const user = useCurrentUser();

  const dashboardRows = Array.isArray(props?.dashboard)
    ? props.dashboard
    : Array.isArray(props?.records)
      ? props.records
      : Array.isArray(props?.items)
        ? props.items
        : [];

  const dash = dashboardRows?.[0] ?? {};

  const initial = typeof window !== "undefined" ? getHomeState() : { q: "", showStops: true, showBulletins: true };
  const [q, setQ] = useState(initial.q);
  const [showFilters, setShowFilters] = useState(false);
  const [showStops, setShowStops] = useState(initial.showStops);
  const [showBulletins, setShowBulletins] = useState(initial.showBulletins);

  useEffect(() => {
    setHomeState({ q, showStops, showBulletins });
  }, [q, showStops, showBulletins]);

  const routes = {
    today: "/today",
    faq: "/faq",
    profile: "/profile",
    officeReview: "/office-review",
  };
  const nav = (href: string) => (window.location.href = href);

  const displayName = useMemo(() => {
    const fromDash = toText(pick(dash, ["Display_Name"]));
    if (fromDash) return fromDash;
    const n = toText((user as any)?.name || (user as any)?.fullName);
    if (n) return n;
    const em = toText((user as any)?.email);
    return em ? em.split("@")[0] : "Reporter";
  }, [dash, user]);

  const isOffice = useMemo(() => {
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
      val.includes("office") ||
      val.includes("admin") ||
      val.includes("manager") ||
      val.includes("dispatcher") ||
      val.includes("supervisor")
    );
  }, [user]);

  const canReviewQueue = useMemo(() => {
    const raw =
      (user as any)?.Can_Review_Queue ??
      (user as any)?.can_review_queue ??
      (user as any)?.fields?.Can_Review_Queue ??
      (user as any)?.fields?.can_review_queue;
    return truthy(raw) || isOffice;
  }, [user, isOffice]);

  const counts = useMemo(() => {
    const stopsToday = Number(pick(dash, ["Stops_Today_Count", "StopsTodayCount"]) || 0) || 0;
    const stopsDone = Number(pick(dash, ["Stops_Completed_Count", "StopsCompletedCount"]) || 0) || 0;
    const reportsToday = Number(pick(dash, ["Reports_Today_Count", "ReportsTodayCount"]) || 0) || 0;
    const unreadBulletins = Number(pick(dash, ["Unread_Bulletins_Count", "UnreadBulletinsCount"]) || 0) || 0;
    return { stopsToday, stopsDone, reportsToday, unreadBulletins };
  }, [dash]);

  const primaryStop = useMemo(() => {
    return {
      site: toText(pick(dash, ["Primary_Site_Name"])),
      addr1: toText(pick(dash, ["Primary_Address_1"])),
      city: toText(pick(dash, ["Primary_City"])),
      state: toText(pick(dash, ["Primary_State"])),
      zip: toText(pick(dash, ["Primary_Zip"])),
    };
  }, [dash]);

  const banner: CSSProperties = {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.00) 60%), #000",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  };

  const accentLine: CSSProperties = {
    height: 2,
    background:
      "linear-gradient(90deg, rgba(0,233,239,0.95), rgba(0,233,239,0.25) 35%, rgba(251,191,36,0.22) 70%, rgba(251,191,36,0.70))",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 6px 20px rgba(0,233,239,0.10)",
  };

  const cardStyle: CSSProperties = {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 52px rgba(0,0,0,0.40)",
    backdropFilter: "blur(8px)",
  };

  const thinGray: CSSProperties = { color: "rgba(229,231,235,0.55)", fontWeight: 500 };
  const clamp1: CSSProperties = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

  const chipStyle = (active: boolean) => ({
    background: active ? "rgba(0,233,239,0.14)" : "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: active ? "rgba(0,233,239,0.95)" : "rgba(229,231,235,0.82)",
  });

  const linkBtn: CSSProperties = {
    background: "transparent",
    border: "none",
    padding: 0,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "rgba(0,233,239,0.96)",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  if (!user) return <div style={{ padding: 16 }}>Please log in.</div>;

  return (
    <div id="rk-home-a">
      {/* If you move background CSS to Page Settings, you can delete this line later */}
      <style>{GLOBAL_CSS}</style>

      {/* Banner (NO Spanish here) */}
      <header style={banner}>
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold tracking-wide"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.05))",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "rgba(0,233,239,0.95)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
                }}
              >
                RK
              </div>

              <div className="min-w-0">
                <div
                  className="text-[12px] uppercase tracking-[0.22em] leading-tight"
                  style={{ color: "rgba(229,231,235,0.86)", ...clamp1 }}
                >
                  FIELD REPORTING SYSTEM
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOffice ? (
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: "rgba(251,191,36,0.14)",
                    border: "1px solid rgba(251,191,36,0.28)",
                    color: "rgba(251,191,36,0.95)",
                  }}
                >
                  Office+
                </span>
              ) : null}

              <button
                type="button"
                className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  boxShadow: "0 12px 34px rgba(0,0,0,0.55)",
                }}
                aria-label="Profile"
                onClick={() => nav(routes.profile)}
              >
                {(user as any)?.avatarUrl ? (
                  <img src={(user as any).avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
        <div style={accentLine} />
      </header>

      {/* Content (tight spacing; no footer here) */}
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6" style={{ paddingTop: 16, paddingBottom: 8 }}>
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-2xl font-extrabold leading-tight truncate">
              Home <span style={thinGray}>|</span> <span style={thinGray}>inicio</span>
            </div>
          </div>

          <div className="min-w-0" style={{ maxWidth: "52%", paddingRight: 6, textAlign: "right" }}>
            <div
              className="text-2xl font-extrabold leading-tight"
              style={{
                color: "rgba(0,233,239,0.96)",
                ...clamp1,
                textShadow: "0 0 18px rgba(0,233,239,0.10)",
              }}
            >
              {displayName}
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ paddingTop: 12 }}>
          <div
            className="flex items-center gap-2 rounded-2xl px-4 h-14 w-full"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 14px 40px rgba(0,0,0,0.30)",
            }}
          >
            <Search className="w-5 h-5" style={{ color: "rgba(229,231,235,0.55)" }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search / Buscar…"
              className="w-full bg-transparent outline-none text-base"
              style={{ color: "rgba(229,231,235,0.95)" }}
            />
          </div>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-3" style={{ paddingTop: 12 }}>
          <span className="px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(229,231,235,0.82)" }}>
            Stops today: {counts.stopsToday}
          </span>
          <span className="px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(229,231,235,0.82)" }}>
            Completed: {counts.stopsDone}
          </span>
          <span className="px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(229,231,235,0.82)" }}>
            Reports: {counts.reportsToday}
          </span>
          <span className="px-4 py-2 rounded-full text-sm font-semibold" style={{ background: counts.unreadBulletins ? "rgba(0,233,239,0.12)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: counts.unreadBulletins ? "rgba(0,233,239,0.95)" : "rgba(229,231,235,0.82)" }}>
            Unread bulletins: {counts.unreadBulletins}
          </span>
        </div>

        {/* Top cyan buttons (no translations here) */}
        <div className="flex items-center justify-between" style={{ paddingTop: 12, gap: 12 }}>
          <button style={linkBtn} onClick={() => setShowFilters((v) => !v)}>
            <Filter className="w-4 h-4" />
            Filter <span style={thinGray}>({showStops && showBulletins ? "all" : "filtered"})</span>
          </button>

          <button style={linkBtn} onClick={() => nav(routes.today)} aria-label="Today">
            <Calendar className="w-4 h-4" />
            Today
          </button>

          <button style={linkBtn} onClick={() => nav(routes.faq)}>
            <Info className="w-4 h-4" />
            FAQ
          </button>
        </div>

        {/* Filter panel (controls other blocks) */}
        {showFilters ? (
          <div style={{ paddingTop: 12 }}>
            <Card className="rounded-2xl" style={cardStyle}>
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button className="px-3 py-2 rounded-xl text-xs font-semibold" onClick={() => setShowBulletins((v) => !v)} style={chipStyle(showBulletins)}>
                    bulletins
                  </button>

                  <button className="px-3 py-2 rounded-xl text-xs font-semibold" onClick={() => setShowStops((v) => !v)} style={chipStyle(showStops)}>
                    stops
                  </button>

                  {(!showBulletins || !showStops) ? (
                    <button
                      className="px-3 py-2 rounded-xl text-xs font-semibold"
                      onClick={() => {
                        setShowBulletins(true);
                        setShowStops(true);
                      }}
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(229,231,235,0.82)" }}
                    >
                      reset
                    </button>
                  ) : null}

                  {canReviewQueue ? (
                    <Button
                      variant="outline"
                      className="h-9 rounded-xl ml-auto"
                      style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.12)", color: "rgba(0,233,239,0.95)" }}
                      onClick={() => nav(routes.officeReview)}
                    >
                      Office Review <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Optional “primary stop” hint (tiny, still content-height) */}
        {primaryStop.site ? (
          <div style={{ paddingTop: 12 }}>
            <Card className="rounded-2xl" style={cardStyle}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-0.5" style={{ color: "rgba(0,233,239,0.86)" }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white" style={clamp1}>
                      Primary stop
                    </div>
                    <div className="text-sm mt-1" style={{ color: "rgba(229,231,235,0.78)" }}>
                      {primaryStop.site}
                    </div>
                    <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.62)" }}>
                      {primaryStop.addr1} • {primaryStop.city} {primaryStop.state} {primaryStop.zip}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}