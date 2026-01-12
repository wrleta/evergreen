import { useMemo, useState, type CSSProperties } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  FileText,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  AlertCircle,
  Clock,
  Home,
  Info,
  Filter,
  Calendar,
  User,
  Bell,
  Shield,
} from "lucide-react";

export default function Block({ stops = [] }: { stops?: any[] }) {
  const user = useCurrentUser();

  // 🔧 Align to your Softr slugs
  const routes = {
    home: "/home",
    today: "/today",
    stopDetail: "/stop-detail",
    faq: "/faq",
    reportsNew: "/reports",
    stopRequestsNew: "/stop-requests",
    jobsiteEditRequestsNew: "/jobsite-edit-requests",
    officeReview: "/office-review",
    reports: "/reports",
    profile: "/profile",
    bulletins: "/bulletins",

  };

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

  // Query params from Today: ?row=...&jobsiteId=...
  const params = useMemo(() => {
    const sp = new URLSearchParams(window.location.search);
    return { row: sp.get("row") || "", jobsiteId: sp.get("jobsiteId") || "" };
  }, []);

  // ---------- Optional filter support ----------
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"" | "Pending" | "Reported" | "Insufficient">("");

  const normalizeStatus = (raw: any) => {
    const v = toText(raw).toLowerCase();
    if (!v) return "Pending";
    if (v.includes("insufficient") || v.includes("follow") || v.includes("need"))
      return "Insufficient";
    if (v.includes("reported") || v.includes("complete") || v.includes("done"))
      return "Reported";
    return "Pending";
  };

  const statusStyle = (st: string) => {
    if (st === "Reported") {
      return {
        background: "rgba(16,185,129,0.10)",
        borderColor: "rgba(16,185,129,0.22)",
        color: "rgba(16,185,129,0.95)",
      };
    }
    if (st === "Insufficient") {
      return {
        background: "rgba(239,68,68,0.10)",
        borderColor: "rgba(239,68,68,0.22)",
        color: "rgba(239,68,68,0.95)",
      };
    }
    return {
      background: "rgba(251,191,36,0.10)",
      borderColor: "rgba(251,191,36,0.22)",
      color: "rgba(251,191,36,0.95)",
    };
  };

  const allStops = Array.isArray(stops) ? stops : [];

  // Detect if filter is meaningful: multiple stops OR varied statuses
  const canFilter = useMemo(() => {
    if (!allStops || allStops.length <= 1) return false;
    const set = new Set<string>();
    for (const s of allStops) {
      const st = normalizeStatus(pick(s, ["Report_Status", "Status"]));
      set.add(st);
      if (set.size >= 2) return true;
    }
    return false;
  }, [allStops]);

  const stopsFiltered = useMemo(() => {
    if (!canFilter) return allStops;
    if (!statusFilter) return allStops;
    return allStops.filter(
      (s) => normalizeStatus(pick(s, ["Report_Status", "Status"])) === statusFilter
    );
  }, [allStops, canFilter, statusFilter]);

  const stop = useMemo(() => {
    if (!stopsFiltered.length) return null;

    if (params.row) {
      const found = stopsFiltered.find((s: any) => {
        const r = toText(pick(s, ["__ROW_NUMBER__", "Row", "Row_Number"]));
        return r === params.row;
      });
      if (found) return found;
    }

    if (params.jobsiteId) {
      const found = stopsFiltered.find((s: any) => {
        const id = toText(pick(s, ["Jobsite_ID", "Site_ID"]));
        return id === params.jobsiteId;
      });
      if (found) return found;
    }

    return stopsFiltered[0] || null;
  }, [stopsFiltered, params.row, params.jobsiteId]);

  const openMaps = (q: string) => {
    const v = (q || "").trim();
    if (!v) return;
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v)}`,
      "_blank"
    );
  };

  const openNewReport = (mode: "stop" | "followup") => {
    if (!stop) return;

    const row = toText(pick(stop, ["__ROW_NUMBER__", "Row", "Row_Number"]));
    const jobsiteId = toText(pick(stop, ["Jobsite_ID", "Site_ID"]));
    const jobsiteName = toText(pick(stop, ["Jobsite_Name", "Site_Name"]));
    const jobsiteAddr = toText(pick(stop, ["Jobsite_Address", "Address"]));
    const assignmentType = toText(pick(stop, ["Assignment_Type", "Task", "Type"]));

    const href =
      routes.reportsNew +
      `?mode=${encodeURIComponent(mode)}` +
      `&manifestRow=${encodeURIComponent(row)}` +
      `&jobsiteId=${encodeURIComponent(jobsiteId)}` +
      `&jobsiteName=${encodeURIComponent(jobsiteName)}` +
      `&jobsiteAddress=${encodeURIComponent(jobsiteAddr)}` +
      `&assignmentType=${encodeURIComponent(assignmentType)}`;

    nav(href);
  };

  const openStopRequest = () => nav(routes.stopRequestsNew);

  const openJobsiteEditRequest = () => {
    if (!stop) return;

    const jobsiteId = toText(pick(stop, ["Jobsite_ID", "Site_ID"]));
    const jobsiteName = toText(pick(stop, ["Jobsite_Name", "Site_Name"]));
    const jobsiteAddr = toText(pick(stop, ["Jobsite_Address", "Address"]));

    const href =
      routes.jobsiteEditRequestsNew +
      `?jobsiteId=${encodeURIComponent(jobsiteId)}` +
      `&jobsiteName=${encodeURIComponent(jobsiteName)}` +
      `&jobsiteAddress=${encodeURIComponent(jobsiteAddr)}`;

    nav(href);
  };

  // Derived display fields
  const jobsiteName = stop
    ? toText(pick(stop, ["Jobsite_Name", "Site_Name"])) || "Jobsite"
    : "";
  const addr = stop ? toText(pick(stop, ["Jobsite_Address", "Address"])) : "";
  const taskShort = stop
    ? toText(pick(stop, ["Task_Short", "Task", "Scope_Short", "Assignment_Type"]))
    : "";
  const startTime = stop
    ? toText(pick(stop, ["Start_Time", "Start", "StartTime", "Time"]))
    : "";
  const rawStatus = stop ? pick(stop, ["Report_Status", "Status"]) : "";
  const status = normalizeStatus(rawStatus);

  // ---------- VISUAL (match TODAY page) ----------
  const bg: CSSProperties = {
    background:
      "radial-gradient(900px 520px at 18% -12%, rgba(0,233,239,0.14), transparent 62%)," +
      "radial-gradient(900px 520px at 88% -6%, rgba(251,191,36,0.10), transparent 60%)," +
      "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.00) 30%)," +
      "#0B1020",
    color: "#E5E7EB",
    minHeight: "100vh",
  };

  const banner: CSSProperties = {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.00) 60%), #000",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  };

  const accentLine: CSSProperties = {
    height: 2,
    background:
      "linear-gradient(90deg, rgba(0,233,239,0.95), rgba(0,233,239,0.25) 35%, rgba(251,191,36,0.22) 70%, rgba(251,191,36,0.70))",
    boxShadow:
      "0 0 0 1px rgba(255,255,255,0.04) inset, 0 6px 20px rgba(0,233,239,0.10)",
  };

  const cardStyle: CSSProperties = {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 52px rgba(0,0,0,0.40)",
    backdropFilter: "blur(8px)",
  };

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

  const thinGray: CSSProperties = {
    color: "rgba(229,231,235,0.55)",
    fontWeight: 500,
  };

  const clamp1: CSSProperties = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  return (
    <div className="min-h-screen" style={bg}>
      {/* Header (match new Today banner) */}
      <header style={banner}>
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3 min-w-0">
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
                title={displayName}
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

      {/* Main */}
      <main
        className="relative mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 space-y-6"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        {/* Title strip (new bilingual formatting + remove "Not found") */}
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-2xl font-extrabold leading-tight truncate">
                Stop detail <span style={thinGray}>|</span>{" "}
                <span style={thinGray}>detalle</span>
              </div>

              {stop && jobsiteName ? (
                <div
                  className="text-sm font-semibold truncate"
                  style={{ color: "rgba(229,231,235,0.72)", marginTop: 6 }}
                >
                  {jobsiteName}
                </div>
              ) : null}
            </div>

            {stop ? (
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap"
                style={statusStyle(status)}
              >
                {status === "Insufficient" ? "Needs follow-up" : status}
              </span>
            ) : null}
          </div>

          {/* Nav row: Filter + Home + Today + FAQ (equidistant) */}
          <div className="grid grid-cols-4 items-center" style={{ paddingTop: 10, gap: 8 }}>
            {/* FIX: no fade/opacity; keep (all) gray; if no filters available, click does nothing */}
            <button
              style={linkBtn}
              onClick={() => {
                if (canFilter) setShowFilters((v) => !v);
              }}
              title={canFilter ? "Toggle filters" : "No filter options"}
            >
              <Filter className="w-4 h-4" />
              <span className="truncate max-w-[22vw]" style={{ fontWeight: 700 }}>
                Filter <span style={thinGray}>(all)</span>
              </span>
            </button>

            <button
              style={{ ...linkBtn, justifySelf: "center" as any }}
              onClick={() => nav(routes.reports)}
            >
              <FileText className="w-4 h-4" />
              Reports
            </button>

            <button
              style={{ ...linkBtn, justifySelf: "center" as any }}
              onClick={() => nav(routes.today)}
            >
              <Calendar className="w-4 h-4" />
              Today
            </button>

            <button
              style={{ ...linkBtn, justifySelf: "end" as any }}
              onClick={() => nav(routes.faq)}
            >
              <Info className="w-4 h-4" />
              FAQ
            </button>
          </div>

          {/* Filter chips (only if applicable + expanded) */}
          {canFilter && showFilters ? (
            <div className="flex flex-wrap items-center gap-2">
              {(["", "Pending", "Reported", "Insufficient"] as const).map((st) =>(
                <button
                  key={st || "all"}
                  className="px-3 py-2 rounded-xl text-xs font-semibold"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    background:
                      statusFilter === st
                        ? "rgba(0,233,239,0.14)"
                        : "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color:
                      statusFilter === st
                        ? "rgba(0,233,239,0.95)"
                        : "rgba(229,231,235,0.82)",
                  }}
                >
                  {st ? st.toLowerCase() : "all"}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Not found state */}
        {!stop ? (
          <Card className="rounded-2xl" style={cardStyle}>
            <CardContent className="py-12 flex flex-col items-center justify-center text-center">
              <AlertCircle
                className="w-20 h-20"
                style={{
                  color: "rgba(0,233,239,0.50)",
                  filter: "drop-shadow(0 0 12px rgba(0,233,239,0.25))",
                }}
              />
              <p className="text-sm mt-4" style={{ color: "rgba(229,231,235,0.75)" }}>
                Stop not found. Go back to Today or submit a request.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  className="gap-2"
                  style={{ background: "#00E9EF", color: "#0B1020" }}
                  onClick={() => nav(routes.today)}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to Today
                </Button>

                <Button
                  variant="outline"
                  className="gap-2"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.12)",
                    color: "#E5E7EB",
                  }}
                  onClick={openStopRequest}
                >
                  <Plus className="w-4 h-4" />
                  Missing stop
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stop info */}
            <Card className="rounded-2xl" style={cardStyle}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-5 h-5" style={{ color: "rgba(0,233,239,0.95)" }} />
                    <CardTitle className="text-lg text-white" style={clamp1}>
                      Jobsite <span style={thinGray}>|</span>{" "}
                      <span style={thinGray}>sitio</span>
                    </CardTitle>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    style={{ color: "rgba(0,233,239,0.95)" }}
                    onClick={() => openMaps(addr || jobsiteName)}
                  >
                    Navigate
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-semibold text-white">{jobsiteName}</div>
                  {addr ? (
                    <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.60)" }}>
                      {addr}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {taskShort ? (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold border"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        borderColor: "rgba(255,255,255,0.10)",
                        color: "rgba(229,231,235,0.85)",
                      }}
                    >
                      {taskShort}
                    </span>
                  ) : null}

                  {startTime ? (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        borderColor: "rgba(255,255,255,0.10)",
                        color: "rgba(229,231,235,0.85)",
                      }}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {startTime}
                    </span>
                  ) : null}
                </div>

                {/* Actions per intent */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <Button
                    className="gap-2"
                    style={{ background: "#00E9EF", color: "#0B1020" }}
                    onClick={() => openNewReport(status === "Insufficient" ? "followup" : "stop")}
                  >
                    <FileText className="w-4 h-4" />
                    {status === "Insufficient" ? "Follow-up report" : "Submit report"}
                  </Button>

                  <Button
                    variant="outline"
                    className="gap-2"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      borderColor: "rgba(255,255,255,0.12)",
                      color: "#E5E7EB",
                    }}
                    onClick={() => openMaps(addr || jobsiteName)}
                  >
                    <MapPin className="w-4 h-4" />
                    Navigate
                  </Button>

                  <Button
                    variant="outline"
                    className="gap-2"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      borderColor: "rgba(255,255,255,0.12)",
                      color: "#E5E7EB",
                    }}
                    onClick={openJobsiteEditRequest}
                  >
                    <Pencil className="w-4 h-4" />
                    Request jobsite edit
                  </Button>

                  <Button
                    variant="outline"
                    className="gap-2"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      borderColor: "rgba(255,255,255,0.12)",
                      color: "#E5E7EB",
                    }}
                    onClick={openStopRequest}
                  >
                    <Plus className="w-4 h-4" />
                    Missing stop
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Office+ shortcut */}
            {isOffice ? (
              <Card className="rounded-2xl" style={cardStyle}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: "#FBBF24" }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white">Office+</div>
                      <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.60)" }}>
                        Quick access to office review queue.
                      </div>

                      <div className="mt-3">
                        <Button
                          variant="outline"
                          className="h-11 rounded-xl"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            borderColor: "rgba(255,255,255,0.12)",
                            color: "rgba(0,233,239,0.95)",
                          }}
                          onClick={() => nav(routes.officeReview)}
                        >
                          Office Review <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </>
        )}
      
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