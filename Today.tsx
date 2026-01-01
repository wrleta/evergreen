import { useMemo, useState } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  MapPin,
  FileText,
  Plus,
  Clock,
  Building2,
  Users,
  Filter,
  Info,
  Home,
  User,
  Bell,
  Shield,
} from "lucide-react";

/**
 * TODAY / HOY
 * Intent (per project):
 * - Show today's stops for logged-in worker (Login_Email and/or Worker_ID)
 * - Office+ can toggle "My" vs "Crew" view + apply Crew/Status filters
 * - Pinned follow-up when any stop is "Insufficient"
 * - “Missing stop” + “Report different site”
 * - Day actions: general note, time log, reports history
 *
 * Layout alignment:
 * - Filter + Home + FAQ row is BELOW the colored pills (chips)
 */
export default function Block({ stops = [] }: { stops?: any[] }) {
  const user = useCurrentUser();

  const routes = {
    home: "/home",
    faq: "/faq",
    stopDetails: "/stop-detail",
    reportsNew: "/reports",
    reports: "/reports",
    timeLogsNew: "/today?view=timelog",
    stopRequestsNew: "/stop-requests",
    officeReview: "/office-review",
    today: "/today",
    profile: "/profile",
    bulletins: "/bulletins",

  };

  const logoUrl = ""; // optional
  const nav = (href: string) =>(window.location.href = href);
  const toText = (v: any) =>(v === undefined || v === null ? "" : String(v));

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
    return email ? email.split("@")[0] : "Field Employee";
  }, [user]);

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

  const normalizeStatus = (raw: any) => {
    const v = toText(raw).toLowerCase();
    if (!v) return "Pending";
    if (v.includes("insufficient") || v.includes("follow") || v.includes("need"))
      return "Insufficient";
    if (
      v.includes("reported") ||
      v.includes("complete") ||
      v.includes("done") ||
      v.includes("submitted")
    )
      return "Reported";
    return "Pending";
  };

  const parseDateAny = (raw: any) => {
    const s = toText(raw).trim();
    if (!s) return null;
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d;

    const m = s.match(
      /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/
    );
    if (m) {
      const [_, Y, Mo, D, H, Mi, S] = m;
      const dt = new Date(
        Number(Y),
        Number(Mo) - 1,
        Number(D),
        Number(H),
        Number(Mi),
        Number(S || "0")
      );
      if (!Number.isNaN(dt.getTime())) return dt;
    }
    return null;
  };

  const fmtTime = (raw: any) => {
    const d = parseDateAny(raw);
    if (!d) return toText(raw);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const userWorkerId = useMemo(
    () =>
      toText(
        (user as any)?.Worker_ID ||
        (user as any)?.workerId ||
        (user as any)?.fields?.Worker_ID ||
        (user as any)?.fields?.workerId
      ),
    [user]
  );

  const userEmail = useMemo(
    () => toText((user as any)?.email || (user as any)?.fields?.email),
    [user]
  );

  const allStops = useMemo(() =>(Array.isArray(stops) ? stops : []), [stops]);

  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"my" | "crew">("my");
  const [crewFilter, setCrewFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Reported" | "Insufficient">("All");

  const crewIds = useMemo(() => {
    const set = new Set<string>();
    allStops.forEach((s) => {
      const c = toText(pick(s, ["Crew_ID", "CrewId", "Crew"]));
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [allStops]);

  const myStops = useMemo(() => {
    return allStops.filter((s) => {
      const wid = toText(pick(s, ["Worker_ID", "WorkerId", "Assigned_Worker_ID"]));
      const eml = toText(pick(s, ["Login_Email", "Email", "Worker_Email"]));
      if (userWorkerId && wid) return wid === userWorkerId;
      if (userEmail && eml) return eml.toLowerCase() === userEmail.toLowerCase();
      return true;
    });
  }, [allStops, userWorkerId, userEmail]);

  const displayedStops = useMemo(() => {
    const base = isOffice && viewMode === "crew" ? allStops : myStops;

    const filtered = base.filter((s) => {
      const c = toText(pick(s, ["Crew_ID", "CrewId", "Crew"]));
      const st = normalizeStatus(pick(s, ["Report_Status", "Status"]));

      if (isOffice && viewMode === "crew" && crewFilter !== "All" && c !== crewFilter)
        return false;

      if (statusFilter !== "All" && st !== statusFilter) return false;

      return true;
    });

    filtered.sort((a, b) => {
      const ta = toText(pick(a, ["Scheduled_Time_Local", "Start_Time", "Start", "Time"]));
      const tb = toText(pick(b, ["Scheduled_Time_Local", "Start_Time", "Start", "Time"]));
      return ta.localeCompare(tb);
    });

    return filtered;
  }, [allStops, myStops, isOffice, viewMode, crewFilter, statusFilter]);

  const counts = useMemo(() => {
    let pending = 0,
      reported = 0,
      insufficient = 0;
    displayedStops.forEach((s) => {
      const st = normalizeStatus(pick(s, ["Report_Status", "Status"]));
      if (st === "Reported") reported++;
      else if (st === "Insufficient") insufficient++;
      else pending++;
    });
    return { pending, reported, insufficient };
  }, [displayedStops]);

  const followUps = useMemo(() => {
    return displayedStops.filter(
      (s) => normalizeStatus(pick(s, ["Report_Status", "Status"])) === "Insufficient"
    );
  }, [displayedStops]);

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

  const chipStyle = (kind: "pending" | "reported" | "insufficient") => {
    if (kind === "pending")
      return {
        background: "rgba(251,191,36,0.10)",
        border: "1px solid rgba(251,191,36,0.22)",
        color: "rgba(251,191,36,0.95)",
      };
    if (kind === "reported")
      return {
        background: "rgba(16,185,129,0.10)",
        border: "1px solid rgba(16,185,129,0.22)",
        color: "rgba(16,185,129,0.95)",
      };
    return {
      background: "rgba(239,68,68,0.10)",
      border: "1px solid rgba(239,68,68,0.22)",
      color: "rgba(239,68,68,0.95)",
    };
  };

  const statusPill = (st: string) => {
    if (st === "Reported") return chipStyle("reported");
    if (st === "Insufficient") return chipStyle("insufficient");
    return chipStyle("pending");
  };

  const openMaps = (q: string) => {
    const v = (q || "").trim();
    if (!v) return;
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v)}`,
      "_blank"
    );
  };

  const openStopDetails = (s: any) => {
    const row = toText(pick(s, ["__ROW_NUMBER__", "Row", "Row_Number"]));
    const jobsiteId = toText(pick(s, ["Jobsite_ID", "Site_ID"]));
    nav(
      `${routes.stopDetails}?row=${encodeURIComponent(row)}&jobsiteId=${encodeURIComponent(
        jobsiteId
      )}`
    );
  };

  const openNewReport = (s: any, mode: "stop" | "followup" | "general" | "other") => {
    const row = toText(pick(s, ["__ROW_NUMBER__", "Row", "Row_Number"]));
    const jobsiteId = toText(pick(s, ["Jobsite_ID", "Site_ID"]));
    const jobsiteName = toText(pick(s, ["Jobsite_Name", "Site_Name"]));
    const jobsiteAddr = toText(pick(s, ["Jobsite_Address", "Address"]));
    const assignmentType = toText(pick(s, ["Assignment_Type", "Task", "Type"]));

    nav(
      routes.reportsNew +
      `?mode=${encodeURIComponent(mode)}` +
      `&manifestRow=${encodeURIComponent(row)}` +
      `&jobsiteId=${encodeURIComponent(jobsiteId)}` +
      `&jobsiteName=${encodeURIComponent(jobsiteName)}` +
      `&jobsiteAddress=${encodeURIComponent(jobsiteAddr)}` +
      `&assignmentType=${encodeURIComponent(assignmentType)}`
    );
  };

  const crewFilterApplied = isOffice && viewMode === "crew" && crewFilter !== "All";
  const filtersActive =
    statusFilter !== "All" || crewFilterApplied || (isOffice && viewMode === "crew");

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

  return (
    <div className="min-h-screen" style={bg}>
      {/* Header: remove Home button from banner */}
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
                    background:
                      "linear-gradient(90deg, rgba(0,233,239,0.25), rgba(255,255,255,0.00))",
                    opacity: 0.9,
                  }}
                />
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
              
                onClick={() => nav(routes.profile)}>
                {(user as any)?.avatarUrl ? (
                  <img
                    src={(user as any).avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
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
        {/* Title + date (fix spacing so y doesn't eat padding; make Today | hoy same size) */}
        <div className="space-y-2">
          <div className="min-w-0" style={{ paddingTop: 2 }}>
            <div className="text-2xl font-extrabold leading-tight truncate" style={{ paddingBottom: 4 }}>
              Today <span style={thinGray}>|</span>{" "}
              <span style={thinGray}>hoy</span>
            </div>
            <div
              className="text-sm font-semibold"
              style={{ color: "rgba(229,231,235,0.72)", marginTop: 6 }}
            >
              {todayLabel}
            </div>
          </div>

          {/* Colored pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("reported")}>
              Reported: {counts.reported}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("pending")}>
              Pending: {counts.pending}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("insufficient")}>
              Follow-up: {counts.insufficient}
            </span>
          </div>

                  {/* Top link row (grid): Filter (all), Reports, Today, FAQ */}
          <div className="grid grid-cols-4 gap-2" style={{ marginTop: 10 }}>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = showFilters ? "rgba(0,233,239,0.10)" : linkBtn.background as any)}
              className="flex items-center justify-center gap-2 w-full"
              style={{
                ...linkBtn,
                ...(showFilters
                  ? { background: "rgba(0,233,239,0.10)", border: "1px solid rgba(0,233,239,0.28)" }
                  : {}),
              }}
            >
              <Filter className="w-4 h-4" />
              Filter
              <span style={{ color: "rgba(229,231,235,0.55)", fontWeight: 500 }}>(all)</span>
            </button>

            <button
              type="button"
              onClick={() => nav(routes.reports)}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = linkBtn.background as any)}
              className="flex items-center justify-center gap-2 w-full"
              style={linkBtn}
            >
              <FileText className="w-4 h-4" />
              Reports
            </button>

            <button
              type="button"
              onClick={() => nav(routes.today)}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = linkBtn.background as any)}
              className="flex items-center justify-center gap-2 w-full"
              style={linkBtn}
            >
              <Calendar className="w-4 h-4" />
              Today
            </button>

            <button
              type="button"
              onClick={() => nav(routes.faq)}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = linkBtn.background as any)}
              className="flex items-center justify-center gap-2 w-full"
              style={linkBtn}
            >
              <Info className="w-4 h-4" />
              FAQ
            </button>
          </div>

{/* Filter panel */}
          {showFilters ? (
            <Card className="rounded-2xl" style={cardStyle}>
              <CardContent className="p-4 space-y-3">
                {isOffice ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="px-3 py-2 rounded-xl text-xs font-semibold"
                      onClick={() => {
                        setViewMode("my");
                        setCrewFilter("All");
                      }}
                      style={{
                        background: viewMode === "my" ? "rgba(0,233,239,0.14)" : "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        color: viewMode === "my" ? "rgba(0,233,239,0.95)" : "rgba(229,231,235,0.82)",
                      }}
                    >
                      <Users className="w-4 h-4 inline-block mr-1" />
                      My
                    </button>

                    <button
                      className="px-3 py-2 rounded-xl text-xs font-semibold"
                      onClick={() => setViewMode("crew")}
                      style={{
                        background: viewMode === "crew" ? "rgba(0,233,239,0.14)" : "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        color: viewMode === "crew" ? "rgba(0,233,239,0.95)" : "rgba(229,231,235,0.82)",
                      }}
                    >
                      <Building2 className="w-4 h-4 inline-block mr-1" />
                      Crew
                    </button>

                    {viewMode === "crew" ? (
                      <select
                        value={crewFilter}
                        onChange={(e) => setCrewFilter(e.target.value)}
                        className="h-9 px-3 rounded-xl text-xs"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: "rgba(229,231,235,0.90)",
                        }}
                      >
                        <option value="All">crew: all</option>
                        {crewIds.map((c) =>(
                          <option key={c} value={c}>
                            crew: {c}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  {(["All", "Pending", "Reported", "Insufficient"] as const).map((st) =>(
                    <button
                      key={st}
                      className="px-3 py-2 rounded-xl text-xs font-semibold"
                      onClick={() => setStatusFilter(st)}
                      style={{
                        background: statusFilter === st ? "rgba(0,233,239,0.14)" : "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        color: statusFilter === st ? "rgba(0,233,239,0.95)" : "rgba(229,231,235,0.82)",
                      }}
                    >
                      {st === "All"
                        ? "all"
                        : st === "Insufficient"
                          ? "follow-up"
                          : st.toLowerCase()}
                    </button>
                  ))}

                  {filtersActive ? (
                    <button
                      className="px-3 py-2 rounded-xl text-xs font-semibold"
                      onClick={() => {
                        setStatusFilter("All");
                        setCrewFilter("All");
                        setViewMode("my");
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

                  {isOffice ? (
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

        {/* Pinned follow-up */}
        {followUps.length ? (
          <Card className="rounded-2xl" style={{ ...cardStyle, border: "1px solid rgba(251,191,36,0.26)" }}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: "rgba(251,191,36,0.95)" }} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white">Needs follow-up:</div>

                  <div className="mt-2 space-y-1">
                    {followUps.slice(0, 3).map((s, idx) => {
                      const nm = toText(pick(s, ["Jobsite_Name", "Site_Name"])) || `Site ${idx + 1}`;
                      return (
                        <div
                          key={toText(pick(s, ["id", "__ROW_NUMBER__"])) || idx}
                          className="text-sm"
                          style={{ color: "rgba(251,191,36,0.90)", ...clamp1 }}
                        >
                          • {nm}
                        </div>
                      );
                    })}
                    {followUps.length > 3 ? (
                      <div className="text-xs" style={{ color: "rgba(229,231,235,0.65)" }}>
                        + {followUps.length - 3} more
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3">
                    <Button
                      className="h-10 px-4 rounded-xl font-semibold"
                      style={{ background: "rgba(251,191,36,0.95)", color: "#0b1020" }}
                      onClick={() => openNewReport(followUps[0], "followup")}
                    >
                      Complete follow-up
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Stops list */}
        <Card className="rounded-2xl" style={cardStyle}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className="w-5 h-5" style={{ color: "rgba(0,233,239,0.95)" }} />
                <CardTitle className="text-base text-white truncate">
                  My Stops <span style={thinGray}>|</span>{" "}
                  <span style={thinGray}>Mis Paradas</span>
                </CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0 p-0">
            {displayedStops.length ? (
              <div>
                {displayedStops.map((s, idx) => {
                  const jobsiteName = toText(pick(s, ["Jobsite_Name", "Site_Name"])) || `Stop ${idx + 1}`;
                  const addr = toText(pick(s, ["Jobsite_Address", "Address"]));
                  const assignment = toText(pick(s, ["Assignment_Type", "Task", "Type"]));
                  const start = toText(pick(s, ["Scheduled_Time_Local", "Start_Time", "Start", "Time"]));
                  const status = normalizeStatus(pick(s, ["Report_Status", "Status"]));
                  const lastAt = toText(pick(s, ["Last_Report_At", "LastReportAt"]));

                  const isLast = idx === displayedStops.length - 1;
                  const key = toText(pick(s, ["id", "__ROW_NUMBER__"])) || idx;

                  return (
                    <div
                      key={key}
                      className="py-4 px-4"
                      style={{ borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 mt-0.5" style={{ color: "rgba(229,231,235,0.60)" }} />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white" style={clamp1}>
                                {jobsiteName}
                              </div>
                              {addr ? (
                                <div className="text-xs mt-0.5" style={{ ...thinGray, ...clamp1 }}>
                                  {addr}
                                </div>
                              ) : null}
                            </div>

                            {start ? (
                              <div className="text-xs whitespace-nowrap" style={thinGray}>
                                {start}
                              </div>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            {assignment ? (
                              <span
                                className="px-2.5 py-1 rounded-full text-xs font-semibold"
                                style={{
                                  background: "rgba(255,255,255,0.05)",
                                  border: "1px solid rgba(255,255,255,0.10)",
                                  color: "rgba(229,231,235,0.90)",
                                }}
                              >
                                {assignment}
                              </span>
                            ) : null}

                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={statusPill(status)}>
                              {status === "Insufficient" ? "Follow-up" : status}
                            </span>

                            {lastAt ? (
                              <span className="text-xs" style={thinGray}>
                                Last: {fmtTime(lastAt)}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            className="h-9 w-9 p-0"
                            style={{ color: "rgba(229,231,235,0.92)" }}
                            onClick={() => openStopDetails(s)}
                            aria-label="Open details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            className="h-9 w-9 p-0"
                            style={{ color: "rgba(229,231,235,0.92)" }}
                            onClick={() => openMaps(addr || jobsiteName)}
                            aria-label="Navigate"
                          >
                            <MapPin className="w-4 h-4" />
                          </Button>

                          {status === "Pending" || status === "Insufficient" ? (
                            <Button
                              className="h-9 w-9 p-0 rounded-xl"
                              style={{ background: "rgba(0,233,239,0.95)", color: "#0b1020" }}
                              onClick={() => openNewReport(s, status === "Insufficient" ? "followup" : "stop")}
                              aria-label="Submit report"
                              title="Submit report"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 px-6">
                <Calendar
                  className="w-20 h-20 mx-auto mb-3"
                  style={{
                    color: "rgba(0,233,239,0.55)",
                    filter: "drop-shadow(0 0 18px rgba(0,233,239,0.12))",
                  }}
                />
                <div className="text-sm text-white">No stops scheduled for today</div>
                <div className="text-xs mt-1" style={thinGray}>
                  Use “Report a different site” if you worked somewhere else.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Can't find your site */}
        <Card className="rounded-2xl" style={cardStyle}>
          <CardContent className="p-4">
            <div className="text-sm font-semibold text-white">
              Can’t find your site <span style={thinGray}>|</span>{" "}
              <span style={thinGray}>¿No ves tu sitio?</span>
            </div>
            <div className="text-xs mt-1" style={thinGray}>
              Add a missing stop request or report a different jobsite.
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-11 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.12)",
                  color: "rgba(229,231,235,0.92)",
                }}
                onClick={() => nav(routes.stopRequestsNew)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add missing stop
              </Button>

              <Button
                variant="outline"
                className="h-11 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.12)",
                  color: "rgba(229,231,235,0.92)",
                }}
                onClick={() => openNewReport({}, "other")}
              >
                <FileText className="w-4 h-4 mr-2" />
                Report a different site
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Day actions */}
        <Card className="rounded-2xl" style={cardStyle}>
          <CardContent className="p-4">
            <div className="text-sm font-semibold text-white">
              Day actions <span style={thinGray}>|</span>{" "}
              <span style={thinGray}>Acciones del día</span>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="h-11 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.12)",
                  color: "rgba(229,231,235,0.92)",
                }}
                onClick={() => openNewReport({}, "general")}
              >
                <Plus className="w-4 h-4 mr-2" />
                New general note
              </Button>

              <Button
                variant="outline"
                className="h-11 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.12)",
                  color: "rgba(229,231,235,0.92)",
                }}
                onClick={() => nav(routes.timeLogsNew)}
              >
                <Clock className="w-4 h-4 mr-2" />
                Add time log
              </Button>

              <Button
                variant="outline"
                className="h-11 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.12)",
                  color: "rgba(229,231,235,0.92)",
                }}
                onClick={() => nav(routes.reports)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Reports history
              </Button>
            </div>
          </CardContent>
        </Card>
      
        {/* Quick actions (must be LAST card) */}
        <Card className="rounded-2xl" style={cardStyle}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">
              Quick actions <span style={thinGray}>|</span>{" "}
              <span style={thinGray}>acciones rápidas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div style={{borderTop: "1px solid rgba(255,255,255,0.08)"}}>
              <button
                type="button"
                className="w-full flex items-center justify-between py-3"
                style={{cursor: "pointer"}}
                onClick={() => nav(routes.reports)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{background: "rgba(0,233,239,0.12)", border: "1px solid rgba(0,233,239,0.22)"}}
                  >
                    <FileText className="w-4 h-4" style={{color: "rgba(0,233,239,0.96)"}} />
                  </div>
                  <div className="text-sm font-semibold text-white truncate">
                    Reports <span style={thinGray}>|</span>{" "}
                    <span style={thinGray}>reportes</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" style={{color: "rgba(229,231,235,0.55)"}} />
              </button>

              <div style={{borderTop: "1px solid rgba(255,255,255,0.08)"}} />

              <button
                type="button"
                className="w-full flex items-center justify-between py-3"
                style={{cursor: "pointer"}}
                onClick={() => nav(routes.today)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.22)"}}
                  >
                    <Calendar className="w-4 h-4" style={{color: "rgba(251,191,36,0.92)"}} />
                  </div>
                  <div className="text-sm font-semibold text-white truncate">
                    Today <span style={thinGray}>|</span>{" "}
                    <span style={thinGray}>hoy</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" style={{color: "rgba(229,231,235,0.55)"}} />
              </button>

              <div style={{borderTop: "1px solid rgba(255,255,255,0.08)"}} />

              <button
                type="button"
                className="w-full flex items-center justify-between py-3"
                style={{cursor: "pointer"}}
                onClick={() => nav(routes.faq)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)"}}
                  >
                    <Info className="w-4 h-4" style={{color: "rgba(229,231,235,0.90)"}} />
                  </div>
                  <div className="text-sm font-semibold text-white truncate">
                    FAQ <span style={thinGray}>|</span>{" "}
                    <span style={thinGray}>ayuda</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" style={{color: "rgba(229,231,235,0.55)"}} />
              </button>

              <div style={{borderTop: "1px solid rgba(255,255,255,0.08)"}} />

              <button
                type="button"
                className="w-full flex items-center justify-between py-3"
                style={{cursor: "pointer"}}
                onClick={() => nav(routes.bulletins)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{background: "rgba(0,233,239,0.08)", border: "1px solid rgba(0,233,239,0.18)"}}
                  >
                    <Bell className="w-4 h-4" style={{color: "rgba(0,233,239,0.86)"}} />
                  </div>
                  <div className="text-sm font-semibold text-white truncate">
                    Bulletins <span style={thinGray}>|</span>{" "}
                    <span style={thinGray}>boletines</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" style={{color: "rgba(229,231,235,0.55)"}} />
              </button>

              <div style={{borderTop: "1px solid rgba(255,255,255,0.08)"}} />

              <button
                type="button"
                className="w-full flex items-center justify-between py-3"
                style={{cursor: "pointer"}}
                onClick={() => nav(routes.profile)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)"}}
                  >
                    <User className="w-4 h-4" style={{color: "rgba(229,231,235,0.90)"}} />
                  </div>
                  <div className="text-sm font-semibold text-white truncate">
                    Profile <span style={thinGray}>|</span>{" "}
                    <span style={thinGray}>perfil</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" style={{color: "rgba(229,231,235,0.55)"}} />
              </button>

              {isOffice ? (
                <>
                  <div style={{borderTop: "1px solid rgba(255,255,255,0.08)"}} />
                  <button
                    type="button"
                    className="w-full flex items-center justify-between py-3"
                    style={{cursor: "pointer"}}
                    onClick={() => nav(routes.officeReview)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.18)"}}
                      >
                        <Shield className="w-4 h-4" style={{color: "rgba(251,191,36,0.92)"}} />
                      </div>
                      <div className="text-sm font-semibold text-white truncate">
                        Office review <span style={thinGray}>|</span>{" "}
                        <span style={thinGray}>oficina</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4" style={{color: "rgba(229,231,235,0.55)"}} />
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