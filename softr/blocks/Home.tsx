import React, { useMemo, useState } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Calendar,
  FileText,
  Info,
  MapPin,
  Search,
  User,
  Filter,
  ChevronRight,
  AlertCircle,
  Shield,
} from "lucide-react";

/**
 * HOME (Unified, role-tiered)
 *
 * Intent:
 * - One Home layout for all roles (Field/Reporter+, Manager+, Admin+)
 * - Key marker differences render by roleTier (no duplicate pages)
 *
 * Layout rules (per chat history):
 * - Top banner: RK + FIELD REPORTING SYSTEM (left) + avatar (right)
 * - Title: "Home | inicio" on ONE line (inicio gray, lighter)
 * - Reporter name on right: cyan, same size as Home; NO email shown
 * - Search row
 * - Count chips below search (gray when 0)
 * - Row BELOW chips: Filter (all/filtered) • Today (calendar + Today) • FAQ
 * - Reports access included (button in Quick Nav)
 * - Office+ chip shown for office roles
 * - Office/Admin cards appear only for non-field roles (placeholders now; wire data later)
 * - Bulletins preview card
 * - Today preview card (no redundant Open button)
 */
export default function Block({
  bulletins = [],
  stops = [],
  officeTasks = [], // optional (future): office task inbox rows
  approvals = [], // optional (future): pending approvals/requests rows
}: {
  bulletins?: any[];
  stops?: any[];
  officeTasks?: any[];
  approvals?: any[];
}) {
  const user = useCurrentUser();
  const [q, setQ] = useState("");

  // Home filter toggles (lightweight — only affects Home previews)
  const [showFilters, setShowFilters] = useState(false);
  const [showBulletins, setShowBulletins] = useState(true);
  const [showStops, setShowStops] = useState(true);

  // 🔧 Match your Softr slugs
  const routes = {
    bulletins: "/bulletins",
    today: "/today",
    reports: "/reports",
    faq: "/faq",
    profile: "/profile",
    officeReview: "/office-review",
  };

  const logoUrl = ""; // optional later
  const nav = (href: string) => (window.location.href = href);
  const toText = (v: any) => (v === undefined || v === null ? "" : String(v));

  const pick = (obj: any, keys: string[]) => {
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
  };

  const displayName = useMemo(() => {
    const name = toText((user as any)?.name || (user as any)?.fullName);
    if (name) return name;
    const email = toText((user as any)?.email);
    return email ? email.split("@")[0] : "Reporter";
  }, [user]);

  // ✅ Office detection (broad)
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

  // ✅ Role tier (field vs manager vs admin)
  const roleTier = useMemo<"field" | "manager" | "admin">(() => {
    if (!isOffice) return "field";

    const raw =
      (user as any)?.Role ??
      (user as any)?.role ??
      (user as any)?.UserGroup ??
      (user as any)?.userGroup ??
      (user as any)?.Auth_Level ??
      (user as any)?.auth_level ??
      (user as any)?.fields?.Role ??
      (user as any)?.fields?.UserGroup ??
      (user as any)?.fields?.Auth_Level;

    const v = toText(raw).toLowerCase();

    if (v.includes("admin") || v.includes("owner") || v.includes("ceo")) return "admin";
    return "manager";
  }, [user, isOffice]);

  const allBulletins = Array.isArray(bulletins) ? bulletins : [];
  const allStops = Array.isArray(stops) ? stops : [];
  const allOfficeTasks = Array.isArray(officeTasks) ? officeTasks : [];
  const allApprovals = Array.isArray(approvals) ? approvals : [];

  const counts = useMemo(
    () => ({
      bulletins: allBulletins.length,
      stops: allStops.length,
      officeTasks: allOfficeTasks.length,
      approvals: allApprovals.length,
    }),
    [allBulletins.length, allStops.length, allOfficeTasks.length, allApprovals.length]
  );

  // ---------- VISUAL ----------
  const bg = {
    background:
      "radial-gradient(900px 520px at 18% -12%, rgba(0,233,239,0.14), transparent 62%)," +
      "radial-gradient(900px 520px at 88% -6%, rgba(251,191,36,0.10), transparent 60%)," +
      "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.00) 30%)," +
      "#0B1020",
    color: "#E5E7EB",
  };

  const banner = {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.00) 60%), #000",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  };

  const accentLine = {
    height: 2,
    background:
      "linear-gradient(90deg, rgba(0,233,239,0.95), rgba(0,233,239,0.25) 35%, rgba(251,191,36,0.22) 70%, rgba(251,191,36,0.70))",
    boxShadow:
      "0 0 0 1px rgba(255,255,255,0.04) inset, 0 6px 20px rgba(0,233,239,0.10)",
  };

  const cardStyle = {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 52px rgba(0,0,0,0.40)",
    backdropFilter: "blur(8px)",
  };

  const chipStyle = (n: number) => ({
    background: n ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.03)",
    border: `1px solid ${n ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.09)"}`,
    color: n ? "rgba(229,231,235,0.82)" : "rgba(229,231,235,0.60)",
  });

  const officeChipStyle = {
    background: "rgba(251,191,36,0.14)",
    border: "1px solid rgba(251,191,36,0.28)",
    color: "rgba(251,191,36,0.95)",
  };

  const linkBtn: React.CSSProperties = {
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

  const thinGray: React.CSSProperties = {
    color: "rgba(229,231,235,0.55)",
    fontWeight: 500,
  };

  const clamp1: React.CSSProperties = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const clamp2: React.CSSProperties = {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as any,
    overflow: "hidden",
  };

  const qq = q.trim().toLowerCase();

  const bulletinsFiltered = useMemo(() => {
    if (!qq) return allBulletins;
    return allBulletins.filter((b) => {
      const title = toText(pick(b, ["Title", "Bulletin_Title", "Subject", "Name"])).toLowerCase();
      const body = toText(pick(b, ["Message", "Body", "Summary", "Content"])).toLowerCase();
      return title.includes(qq) || body.includes(qq);
    });
  }, [allBulletins, qq]);

  const stopsFiltered = useMemo(() => {
    if (!qq) return allStops;
    return allStops.filter((s) => {
      const site = toText(pick(s, ["Site_Name", "Jobsite", "Jobsite_Name", "Site"])).toLowerCase();
      const addr = toText(pick(s, ["Address", "Site_Address", "Jobsite_Address"])).toLowerCase();
      const task = toText(pick(s, ["Task_Short", "Task", "Scope_Short"])).toLowerCase();
      return site.includes(qq) || addr.includes(qq) || task.includes(qq);
    });
  }, [allStops, qq]);

  const bulletinsTop = useMemo(() => bulletinsFiltered.slice(0, 3), [bulletinsFiltered]);
  const stopsTop = useMemo(() => stopsFiltered.slice(0, 4), [stopsFiltered]);

  const homeFilterLabel = useMemo(() => {
    if (showBulletins && showStops) return "all";
    return "filtered";
  }, [showBulletins, showStops]);

  if (!user) {
    return (
      <div className="min-h-screen" style={{ background: "#0B1020", color: "#E5E7EB" }}>
        <div className="p-6 text-sm" style={{ color: "rgba(229,231,235,0.80)" }}>
          Please log in.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={bg}>
      {/* Top banner */}
      <header style={banner}>
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3 min-w-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="RK"
                  className="w-11 h-11 rounded-2xl object-contain"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
                  }}
                />
              ) : (
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold tracking-wide"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.05))",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "rgba(0,233,239,0.95)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
                  }}
                >
                  RK
                </div>
              )}

              <div className="min-w-0">
                <div
                  className="text-[12px] uppercase tracking-[0.22em] leading-tight"
                  style={{ color: "rgba(229,231,235,0.86)", ...clamp1 }}
                >
                  FIELD REPORTING SYSTEM
                </div>
                <div
                  style={{
                    marginTop: 6,
                    height: 1,
                    width: 180,
                    background: "linear-gradient(90deg, rgba(0,233,239,0.25), rgba(255,255,255,0.00))",
                    opacity: 0.9,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {roleTier !== "field" ? (
                <span className="px-3 py-1 rounded-full text-xs font-semibold" style={officeChipStyle}>
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

      <main
        className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 space-y-5"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        {/* Title row + reporter name */}
        <div className="space-y-2">
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
          <div className="pt-2">
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
          <div className="flex flex-wrap gap-3 pt-2">
            <span className="px-4 py-2 rounded-full text-sm font-semibold" style={chipStyle(counts.bulletins)}>
              Bulletins: {counts.bulletins}
            </span>
            <span className="px-4 py-2 rounded-full text-sm font-semibold" style={chipStyle(counts.stops)}>
              Stops: {counts.stops}
            </span>

            {roleTier !== "field" ? (
              <>
                <span className="px-4 py-2 rounded-full text-sm font-semibold" style={chipStyle(counts.officeTasks)}>
                  Tasks: {counts.officeTasks}
                </span>
                <span className="px-4 py-2 rounded-full text-sm font-semibold" style={chipStyle(counts.approvals)}>
                  Approvals: {counts.approvals}
                </span>
              </>
            ) : null}
          </div>

          {/* Row BELOW chips: Filter (all/filtered) • Today (calendar + Today) • FAQ */}
          <div className="flex items-center justify-between" style={{ paddingTop: 10, gap: 12 }}>
            <button style={linkBtn} onClick={() => setShowFilters((v) => !v)}>
              <Filter className="w-4 h-4" />
              <span className="truncate max-w-[46vw]" style={{ fontWeight: 700 }}>
                Filter <span style={thinGray}>({homeFilterLabel})</span>
                {!showBulletins || !showStops ? <span style={thinGray}> *</span> : null}
              </span>
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

          {/* Filter panel */}
          {showFilters ? (
            <Card className="rounded-2xl" style={cardStyle}>
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className="px-3 py-2 rounded-xl text-xs font-semibold"
                    onClick={() => setShowBulletins((v) => !v)}
                    style={{
                      background: showBulletins ? "rgba(0,233,239,0.14)" : "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: showBulletins ? "rgba(0,233,239,0.95)" : "rgba(229,231,235,0.82)",
                    }}
                  >
                    bulletins
                  </button>

                  <button
                    className="px-3 py-2 rounded-xl text-xs font-semibold"
                    onClick={() => setShowStops((v) => !v)}
                    style={{
                      background: showStops ? "rgba(0,233,239,0.14)" : "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: showStops ? "rgba(0,233,239,0.95)" : "rgba(229,231,235,0.82)",
                    }}
                  >
                    stops
                  </button>

                  {(!showBulletins || !showStops) ? (
                    <button
                      className="px-3 py-2 rounded-xl text-xs font-semibold"
                      onClick={() => {
                        setShowBulletins(true);
                        setShowStops(true);
                      }}
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        color: "rgba(229,231,235,0.82)",
                      }}
                    >
                      reset
                    </button>
                  ) : null}

                  {roleTier !== "field" ? (
                    <Button
                      variant="outline"
                      className="h-9 rounded-xl ml-auto"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        borderColor: "rgba(255,255,255,0.12)",
                        color: "rgba(0,233,239,0.95)",
                      }}
                      onClick={() => nav(routes.officeReview)}
                    >
                      Office Review <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Office lane placeholders */}
        {roleTier === "admin" ? (
          <Card className="rounded-2xl" style={{ ...cardStyle, border: "1px solid rgba(251,191,36,0.22)" }}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: "rgba(251,191,36,0.95)" }} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white">
                    Admin queue <span style={thinGray}>|</span> <span style={thinGray}>Cola</span>
                  </div>
                  <div className="text-xs mt-1" style={thinGray}>
                    Approvals, overrides, sensitive pickups (connect data next).
                  </div>
                  <div className="mt-3">
                    <Button
                      className="h-10 px-4 rounded-xl font-semibold"
                      style={{ background: "rgba(251,191,36,0.95)", color: "#0b1020" }}
                      onClick={() => nav(routes.officeReview)}
                    >
                      Open Office Review
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {roleTier !== "field" ? (
          <Card className="rounded-2xl" style={cardStyle}>
            <CardContent className="p-4">
              <div className="text-sm font-semibold text-white">
                Office inbox <span style={thinGray}>|</span> <span style={thinGray}>Bandeja</span>
              </div>
              <div className="text-xs mt-1" style={thinGray}>
                Unclaimed tasks + pending requests (connect data next).
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle(counts.officeTasks)}>
                  tasks: {counts.officeTasks}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle(counts.approvals)}>
                  approvals: {counts.approvals}
                </span>
              </div>

              <div className="mt-3">
                <Button
                  variant="outline"
                  className="h-10 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.12)",
                    color: "rgba(229,231,235,0.92)",
                  }}
                  onClick={() => nav(routes.officeReview)}
                >
                  Go to Office Review <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Bulletins */}
        {showBulletins ? (
          <Card className="rounded-3xl" style={cardStyle}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Bell className="w-5 h-5" style={{ color: "rgba(0,233,239,0.96)" }} />
                  <CardTitle className="text-lg text-white" style={clamp1}>
                    Bulletins <span style={thinGray}>|</span> <span style={thinGray}>Boletines</span>
                  </CardTitle>
                </div>

                <Button
                  variant="ghost"
                  className="h-9 px-2 text-base"
                  style={{ color: "rgba(0,233,239,0.96)" }}
                  onClick={() => nav(routes.bulletins)}
                >
                  View all <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {bulletinsTop.length ? (
                <div>
                  {bulletinsTop.map((b: any, idx: number) => {
                    const title =
                      pick(b, ["Title", "Bulletin_Title", "Subject", "Name"]) || `Bulletin ${idx + 1}`;
                    const body = pick(b, ["Message", "Body", "Summary", "Content"]);
                    const isLast = idx === bulletinsTop.length - 1;

                    return (
                      <div
                        key={b?.id || idx}
                        className="py-4"
                        style={{ borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.10)" }}
                      >
                        <div className="text-base font-semibold text-white" style={clamp1}>
                          {toText(title)}
                        </div>
                        {body ? (
                          <div className="text-base mt-2" style={{ color: "rgba(229,231,235,0.78)", ...clamp2 }}>
                            {toText(body)}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Bell
                    className="w-24 h-24 mx-auto mb-4"
                    style={{
                      color: "rgba(0,233,239,0.50)",
                      filter: "drop-shadow(0 0 18px rgba(0,233,239,0.14))",
                    }}
                  />
                  <div className="text-lg text-white">No bulletins yet</div>
                  <div className="text-base mt-2" style={{ color: "rgba(229,231,235,0.65)" }}>
                    Bulletins will appear here.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {/* Today preview */}
        {showStops ? (
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
                  onClick={() => nav(routes.today)}
                >
                  Go <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {stopsTop.length ? (
                <div>
                  {stopsTop.map((s: any, idx: number) => {
                    const site = pick(s, ["Site_Name", "Jobsite", "Jobsite_Name", "Site"]);
                    const addr = pick(s, ["Address", "Site_Address", "Jobsite_Address"]);
                    const task = pick(s, ["Task_Short", "Task", "Scope_Short"]);
                    const isLast = idx === stopsTop.length - 1;

                    return (
                      <div
                        key={s?.id || idx}
                        className="py-4"
                        style={{ borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.10)" }}
                      >
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 mt-1" style={{ color: "rgba(229,231,235,0.55)" }} />
                          <div className="min-w-0 flex-1">
                            <div className="text-base font-semibold text-white" style={clamp1}>
                              {toText(site) || `Stop ${idx + 1}`}
                            </div>

                            {addr ? (
                              <div className="text-sm mt-1" style={{ color: "rgba(229,231,235,0.68)", ...clamp1 }}>
                                {toText(addr)}
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
                <div className="text-center py-16">
                  <MapPin
                    className="w-24 h-24 mx-auto mb-4"
                    style={{
                      color: "rgba(0,233,239,0.46)",
                      filter: "drop-shadow(0 0 18px rgba(0,233,239,0.14))",
                    }}
                  />
                  <div className="text-lg text-white">No stops scheduled</div>
                  <div className="text-base mt-2" style={{ color: "rgba(229,231,235,0.65)" }}>
                    Your schedule will appear here.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}


{/* Quick actions (must be LAST card) */}
<Card className="rounded-2xl" style={cardStyle}>
  <CardHeader className="pb-3">
    <CardTitle className="text-base text-white">
      Quick actions <span style={thinGray}>|</span>{" "}
      <span style={thinGray}>acciones rápidas</span>
    </CardTitle>
  </CardHeader>

  <CardContent className="pt-0">
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 py-3"
        style={{ cursor: "pointer" }}
        onClick={() => nav(routes.reports)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(0,233,239,0.12)",
              border: "1px solid rgba(0,233,239,0.22)",
            }}
          >
            <FileText className="w-4 h-4" style={{ color: "rgba(0,233,239,0.96)" }} />
          </div>
          <div className="text-sm font-semibold text-white truncate">
            Reports <span style={thinGray}>|</span> <span style={thinGray}>reportes</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4" style={{ color: "rgba(229,231,235,0.55)" }} />
      </button>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 py-3"
        style={{ cursor: "pointer" }}
        onClick={() => nav(routes.faq)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <Info className="w-4 h-4" style={{ color: "rgba(229,231,235,0.90)" }} />
          </div>
          <div className="text-sm font-semibold text-white truncate">
            FAQ <span style={thinGray}>|</span> <span style={thinGray}>ayuda</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4" style={{ color: "rgba(229,231,235,0.55)" }} />
      </button>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 py-3"
        style={{ cursor: "pointer" }}
        onClick={() => nav(routes.bulletins)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(0,233,239,0.08)",
              border: "1px solid rgba(0,233,239,0.18)",
            }}
          >
            <Bell className="w-4 h-4" style={{ color: "rgba(0,233,239,0.86)" }} />
          </div>
          <div className="text-sm font-semibold text-white truncate">
            Bulletins <span style={thinGray}>|</span> <span style={thinGray}>boletines</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4" style={{ color: "rgba(229,231,235,0.55)" }} />
      </button>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 py-3"
        style={{ cursor: "pointer" }}
        onClick={() => nav(routes.profile)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <User className="w-4 h-4" style={{ color: "rgba(229,231,235,0.90)" }} />
          </div>
          <div className="text-sm font-semibold text-white truncate">
            Profile <span style={thinGray}>|</span> <span style={thinGray}>perfil</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4" style={{ color: "rgba(229,231,235,0.55)" }} />
      </button>

      {isOffice ? (
        <>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

          <button
            type="button"
            className="w-full flex items-center justify-between gap-3 py-3"
            style={{ cursor: "pointer" }}
            onClick={() => nav(routes.officeReview)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(251,191,36,0.08)",
                  border: "1px solid rgba(251,191,36,0.18)",
                }}
              >
                <Shield className="w-4 h-4" style={{ color: "rgba(251,191,36,0.92)" }} />
              </div>
              <div className="text-sm font-semibold text-white truncate">
                Office review <span style={thinGray}>|</span> <span style={thinGray}>oficina</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: "rgba(229,231,235,0.55)" }} />
          </button>
        </>
      ) : null}
    </div>
  </CardContent>
</Card>
      </main>
    </div>
  );
}