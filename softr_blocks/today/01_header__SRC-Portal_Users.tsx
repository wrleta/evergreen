import React, { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Filter,
  FileText,
  Info,
  Users,
  Building2,
  User as UserIcon,
  Search,
  Shield,
} from "lucide-react";

type ViewMode = "my" | "crew";
type StatusFilter = "All" | "Pending" | "Reported" | "Insufficient";

const EVT = "rk_today_state_v1";
const KEY = "__rk_today_state_v1";

const DEFAULT_STATE = {
  q: "",
  viewMode: "my" as ViewMode,
  crewFilter: "All",
  statusFilter: "All" as StatusFilter,
};

function readState() {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  const w = window as any;
  return { ...DEFAULT_STATE, ...(w[KEY] || {}) };
}
function writeState(patch: Partial<typeof DEFAULT_STATE>) {
  if (typeof window === "undefined") return;
  const w = window as any;
  w[KEY] = { ...readState(), ...patch };
  window.dispatchEvent(new Event(EVT));
}

export default function Block({ stops = [] }: { stops?: any[] }) {
  const user = useCurrentUser();

  const routes = {
    reports: "/reports",
    faq: "/faq",
    today: "/today",
    profile: "/profile",
    officeReview: "/office-review",
  };

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

  const displayName = useMemo(() => {
    const name = toText((user as any)?.name || (user as any)?.fullName);
    if (name) return name;
    const email = toText((user as any)?.email);
    return email ? email.split("@")[0] : "Field Employee";
  }, [user]);

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

  const normalizeStatus = (raw: any) => {
    const v = toText(raw).toLowerCase();
    if (!v) return "Pending";
    if (v.includes("insufficient") || v.includes("follow") || v.includes("need")) return "Insufficient";
    if (v.includes("reported") || v.includes("complete") || v.includes("done") || v.includes("submitted"))
      return "Reported";
    return "Pending";
  };

  const allStops = useMemo(() => (Array.isArray(stops) ? stops : []), [stops]);

  const [showFilters, setShowFilters] = useState(false);
  const [q, setQ] = useState(() => readState().q);
  const [viewMode, setViewMode] = useState<ViewMode>(() => readState().viewMode);
  const [crewFilter, setCrewFilter] = useState<string>(() => readState().crewFilter);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => readState().statusFilter);

  // sync in from other blocks (if any)
  useEffect(() => {
    const h = () => {
      const s = readState();
      setQ(s.q);
      setViewMode(s.viewMode);
      setCrewFilter(s.crewFilter);
      setStatusFilter(s.statusFilter);
    };
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, []);

  // push changes out
  useEffect(() => {
    writeState({ q, viewMode, crewFilter, statusFilter });
  }, [q, viewMode, crewFilter, statusFilter]);

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
    const qq = q.trim().toLowerCase();

    const filtered = base.filter((s) => {
      const c = toText(pick(s, ["Crew_ID", "CrewId", "Crew"]));
      const st = normalizeStatus(pick(s, ["Report_Status", "Status"]));
      const job = toText(pick(s, ["Jobsite_Name", "Site_Name"]));
      const addr = toText(pick(s, ["Jobsite_Address", "Address"]));
      const task = toText(pick(s, ["Assignment_Type", "Task", "Type"]));

      if (isOffice && viewMode === "crew" && crewFilter !== "All" && c !== crewFilter) return false;
      if (statusFilter !== "All" && st !== statusFilter) return false;

      if (qq) {
        const hay = `${job} ${addr} ${task} ${c} ${st}`.toLowerCase();
        if (!hay.includes(qq)) return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      const ta = toText(pick(a, ["Scheduled_Time_Local", "Start_Time", "Start", "Time"]));
      const tb = toText(pick(b, ["Scheduled_Time_Local", "Start_Time", "Start", "Time"]));
      return ta.localeCompare(tb);
    });

    return filtered;
  }, [allStops, myStops, isOffice, viewMode, crewFilter, statusFilter, q]);

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

  const followUps = useMemo(
    () => displayedStops.filter((s) => normalizeStatus(pick(s, ["Report_Status", "Status"])) === "Insufficient"),
    [displayedStops]
  );

  const openNewReport = (s: any, mode: "followup") => {
    const row = toText(pick(s, ["__ROW_NUMBER__", "Row", "Row_Number"]));
    const jobsiteId = toText(pick(s, ["Jobsite_ID", "Site_ID"]));
    const jobsiteName = toText(pick(s, ["Jobsite_Name", "Site_Name"]));
    const jobsiteAddr = toText(pick(s, ["Jobsite_Address", "Address"]));
    const assignmentType = toText(pick(s, ["Assignment_Type", "Task", "Type"]));

    nav(
      routes.reports +
        `?mode=${encodeURIComponent(mode)}` +
        `&manifestRow=${encodeURIComponent(row)}` +
        `&jobsiteId=${encodeURIComponent(jobsiteId)}` +
        `&jobsiteName=${encodeURIComponent(jobsiteName)}` +
        `&jobsiteAddress=${encodeURIComponent(jobsiteAddr)}` +
        `&assignmentType=${encodeURIComponent(assignmentType)}`
    );
  };

  // ---------- VISUAL ----------
  const wrap: CSSProperties = { paddingTop: 12, paddingBottom: 12 };
  const banner: CSSProperties = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.00) 60%), #000",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  };
  const accentLine: CSSProperties = {
    height: 2,
    background:
      "linear-gradient(90deg, rgba(0,233,239,0.95), rgba(0,233,239,0.25) 35%, rgba(251,191,36,0.22) 70%, rgba(251,191,36,0.70))",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 6px 20px rgba(0,233,239,0.10)",
  };
  const cardStyle: CSSProperties = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 52px rgba(0,0,0,0.40)",
    backdropFilter: "blur(8px)",
  };
  const thinGray: CSSProperties = { color: "rgba(229,231,235,0.55)", fontWeight: 500 };
  const esGray: CSSProperties = { ...thinGray, fontStyle: "italic" };

  const chipStyle = (kind: "pending" | "reported" | "insufficient") => {
    if (kind === "pending")
      return { background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.22)", color: "rgba(251,191,36,0.95)" };
    if (kind === "reported")
      return { background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.22)", color: "rgba(16,185,129,0.95)" };
    return { background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.22)", color: "rgba(239,68,68,0.95)" };
  };

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }, []);

  return (
    <div style={{ background: "transparent" }}>
      {/* BANNER (ONLY in first block on page) */}
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
                <div className="text-[12px] uppercase tracking-[0.22em] leading-tight" style={{ color: "rgba(229,231,235,0.86)" }}>
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
                  <UserIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
        <div style={accentLine} />
      </header>

      {/* CONTENT (content-height) */}
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6" style={wrap}>
        <div className="space-y-2">
          <div className="min-w-0">
            <div className="text-2xl font-extrabold leading-tight truncate">
              Today <span style={thinGray}>|</span> <span style={esGray}>hoy</span>
            </div>
            <div className="text-sm font-semibold" style={{ color: "rgba(229,231,235,0.72)", marginTop: 6 }}>
              {todayLabel}
            </div>
          </div>

          {/* chips */}
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

          {/* search */}
          <div className="flex items-center gap-2 pt-1">
            <div
              className="flex items-center gap-2 w-full rounded-xl px-3 h-11"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <Search className="w-4 h-4" style={{ color: "rgba(229,231,235,0.65)" }} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search stops (site, address, task…) "
                className="w-full bg-transparent outline-none text-sm"
                style={{ color: "rgba(229,231,235,0.92)" }}
              />
            </div>
          </div>

          {/* nav row */}
          <div className="grid grid-cols-4 gap-2" style={{ marginTop: 10 }}>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="h-10 rounded-xl flex items-center justify-center gap-2 hover:bg-white/5"
              style={{
                color: "rgba(0,233,239,0.96)",
                fontWeight: 800,
                fontSize: 13,
                border: showFilters ? "1px solid rgba(0,233,239,0.28)" : "1px solid rgba(255,255,255,0.10)",
                background: showFilters ? "rgba(0,233,239,0.10)" : "transparent",
              }}
            >
              <Filter className="w-4 h-4" />
              Filter <span style={thinGray}>(all)</span>
            </button>

            <button
              type="button"
              onClick={() => nav(routes.reports)}
              className="h-10 rounded-xl flex items-center justify-center gap-2 hover:bg-white/5"
              style={{ color: "rgba(0,233,239,0.96)", fontWeight: 800, fontSize: 13, border: "1px solid rgba(255,255,255,0.10)" }}
            >
              <FileText className="w-4 h-4" />
              Reports
            </button>

            <button
              type="button"
              onClick={() => nav(routes.today)}
              className="h-10 rounded-xl flex items-center justify-center gap-2 hover:bg-white/5"
              style={{ color: "rgba(0,233,239,0.96)", fontWeight: 800, fontSize: 13, border: "1px solid rgba(255,255,255,0.10)" }}
            >
              <Calendar className="w-4 h-4" />
              Today
            </button>

            <button
              type="button"
              onClick={() => nav(routes.faq)}
              className="h-10 rounded-xl flex items-center justify-center gap-2 hover:bg-white/5"
              style={{ color: "rgba(0,233,239,0.96)", fontWeight: 800, fontSize: 13, border: "1px solid rgba(255,255,255,0.10)" }}
            >
              <Info className="w-4 h-4" />
              FAQ
            </button>
          </div>

          {/* filter panel */}
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
                        {crewIds.map((c) => (
                          <option key={c} value={c}>
                            crew: {c}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  {(["All", "Pending", "Reported", "Insufficient"] as const).map((st) => (
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
                      {st === "All" ? "all" : st === "Insufficient" ? "follow-up" : st.toLowerCase()}
                    </button>
                  ))}

                  <button
                    className="px-3 py-2 rounded-xl text-xs font-semibold"
                    onClick={() => {
                      setStatusFilter("All");
                      setCrewFilter("All");
                      setViewMode("my");
                      setQ("");
                    }}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "rgba(229,231,235,0.82)",
                    }}
                  >
                    reset
                  </button>

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

        {/* pinned follow-up */}
        {followUps.length ? (
          <Card className="rounded-2xl mt-4" style={{ ...cardStyle, border: "1px solid rgba(251,191,36,0.26)" }}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: "rgba(251,191,36,0.95)" }} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white">Needs follow-up:</div>

                  <div className="mt-2 space-y-1">
                    {followUps.slice(0, 3).map((s, idx) => {
                      const nm = toText(pick(s, ["Jobsite_Name", "Site_Name"])) || `Site ${idx + 1}`;
                      return (
                        <div key={toText(pick(s, ["id", "__ROW_NUMBER__"])) || idx} className="text-sm" style={{ color: "rgba(251,191,36,0.90)" }}>
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
      </div>
    </div>
  );
}