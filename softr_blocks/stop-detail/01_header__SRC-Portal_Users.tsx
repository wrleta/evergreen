import { useMemo, useState, type CSSProperties } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  FileText,
  ChevronRight,
  Pencil,
  Plus,
  AlertCircle,
  Clock,
  Filter,
  Calendar,
  Info,
  User,
  Shield,
} from "lucide-react";

export default function Block(props: any) {
  const user = useCurrentUser();

  const stops = Array.isArray(props?.stops)
    ? props.stops
    : Array.isArray(props?.records)
    ? props.records
    : Array.isArray(props?.items)
    ? props.items
    : [];

  const routes = {
    today: "/today",
    faq: "/faq",
    reports: "/reports",
    reportsNew: "/reports",
    stopRequestsNew: "/stop-requests",
    jobsiteEditRequestsNew: "/jobsite-edit-requests",
    officeReview: "/office-review",
    profile: "/profile",
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

  const userEmail = useMemo(() => toText((user as any)?.email).toLowerCase(), [user]);

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

  const params = useMemo(() => {
    const sp = new URLSearchParams(window.location.search);
    return {
      stopId: sp.get("stopId") || sp.get("Stop_ID") || "",
      row: sp.get("row") || "",
      jobsiteId: sp.get("jobsiteId") || "",
    };
  }, []);

  const normalizeStatus = (raw: any) => {
    const v = toText(raw).toLowerCase();
    if (!v) return "Pending";
    if (v.includes("insufficient") || v.includes("follow") || v.includes("need")) return "Insufficient";
    if (v.includes("reported") || v.includes("complete") || v.includes("done") || v.includes("submitted"))
      return "Reported";
    return "Pending";
  };

  const statusStyle = (st: string) => {
    if (st === "Reported")
      return { background: "rgba(16,185,129,0.10)", borderColor: "rgba(16,185,129,0.22)", color: "rgba(16,185,129,0.95)" };
    if (st === "Insufficient")
      return { background: "rgba(239,68,68,0.10)", borderColor: "rgba(239,68,68,0.22)", color: "rgba(239,68,68,0.95)" };
    return { background: "rgba(251,191,36,0.10)", borderColor: "rgba(251,191,36,0.22)", color: "rgba(251,191,36,0.95)" };
  };

  // Optional filter UI (only meaningful if Softr ever sends multiple rows)
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"" | "Pending" | "Reported" | "Insufficient">("");

  const canFilter = useMemo(() => {
    if (!stops || stops.length <= 1) return false;
    const set = new Set<string>();
    for (const s of stops) {
      set.add(normalizeStatus(pick(s, ["Status", "Report_Status"])));
      if (set.size >= 2) return true;
    }
    return false;
  }, [stops]);

  const stopsFiltered = useMemo(() => {
    if (!canFilter) return stops;
    if (!statusFilter) return stops;
    return stops.filter((s: any) => normalizeStatus(pick(s, ["Status", "Report_Status"])) === statusFilter);
  }, [stops, canFilter, statusFilter]);

  const stop = useMemo(() => {
    if (!stopsFiltered.length) return null;

    if (params.stopId) {
      const f = stopsFiltered.find((s: any) => toText(pick(s, ["Stop_ID"])) === params.stopId);
      if (f) return f;
    }
    if (params.row) {
      const f = stopsFiltered.find((s: any) => toText(pick(s, ["__ROW_NUMBER__", "Row", "Row_Number"])) === params.row);
      if (f) return f;
    }
    if (params.jobsiteId) {
      const f = stopsFiltered.find((s: any) => toText(pick(s, ["Jobsite_ID", "Site_ID"])) === params.jobsiteId);
      if (f) return f;
    }
    return stopsFiltered[0] || null;
  }, [stopsFiltered, params.stopId, params.row, params.jobsiteId]);

  const stopLoginEmail = stop ? toText(pick(stop, ["Login_Email"])).toLowerCase() : "";
  const allowed = !!stop && (isOffice || !stopLoginEmail || !userEmail || stopLoginEmail === userEmail);

  const openMaps = (q: string) => {
    const v = (q || "").trim();
    if (!v) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v)}`, "_blank");
  };

  const openNewReport = (mode: "stop" | "followup") => {
    if (!stop) return;

    const stopId = toText(pick(stop, ["Stop_ID"]));
    const jobsiteId = toText(pick(stop, ["Jobsite_ID"]));
    const jobsiteName = toText(pick(stop, ["Site_Name", "Jobsite_Name"]));
    const address1 = toText(pick(stop, ["Address_1"]));
    const city = toText(pick(stop, ["City"]));
    const state = toText(pick(stop, ["State"]));
    const zip = toText(pick(stop, ["Zip"]));
    const jobsiteAddr = [address1, city, state, zip].filter(Boolean).join(", ");

    const href =
      routes.reportsNew +
      `?mode=${encodeURIComponent(mode)}` +
      `&stopId=${encodeURIComponent(stopId)}` +
      `&jobsiteId=${encodeURIComponent(jobsiteId)}` +
      `&jobsiteName=${encodeURIComponent(jobsiteName)}` +
      `&jobsiteAddress=${encodeURIComponent(jobsiteAddr)}`;

    nav(href);
  };

  const openStopRequest = () => nav(routes.stopRequestsNew);

  const openJobsiteEditRequest = () => {
    if (!stop) return;
    const jobsiteId = toText(pick(stop, ["Jobsite_ID"]));
    const jobsiteName = toText(pick(stop, ["Site_Name", "Jobsite_Name"]));
    const address1 = toText(pick(stop, ["Address_1"]));
    const city = toText(pick(stop, ["City"]));
    const state = toText(pick(stop, ["State"]));
    const zip = toText(pick(stop, ["Zip"]));
    const jobsiteAddr = [address1, city, state, zip].filter(Boolean).join(", ");

    nav(
      routes.jobsiteEditRequestsNew +
        `?jobsiteId=${encodeURIComponent(jobsiteId)}` +
        `&jobsiteName=${encodeURIComponent(jobsiteName)}` +
        `&jobsiteAddress=${encodeURIComponent(jobsiteAddr)}`
    );
  };

  const thinGray: CSSProperties = { color: "rgba(229,231,235,0.55)", fontWeight: 500 };
  const clamp1: CSSProperties = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

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

  const jobsiteName = stop ? toText(pick(stop, ["Site_Name", "Jobsite_Name"])) || "Jobsite" : "";
  const address1 = stop ? toText(pick(stop, ["Address_1"])) : "";
  const city = stop ? toText(pick(stop, ["City"])) : "";
  const state = stop ? toText(pick(stop, ["State"])) : "";
  const zip = stop ? toText(pick(stop, ["Zip"])) : "";
  const addr = [address1, city, state, zip].filter(Boolean).join(", ");

  const taskShort = stop ? toText(pick(stop, ["Stop_Title", "Task_Instructions"])) : "";
  const startTime = stop ? toText(pick(stop, ["Scheduled_Time_Local"])) : "";
  const status = stop ? normalizeStatus(pick(stop, ["Status"])) : "Pending";

  return (
    <div style={{ color: "#E5E7EB" }}>
      {/* Banner (ONLY here) */}
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
                title={displayName}
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

      {/* Content (content-height, no full-screen wrappers) */}
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 pt-4 space-y-6">
        {/* Title strip */}
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-2xl font-extrabold leading-tight truncate">
                Stop detail <span style={thinGray}>|</span> <span style={thinGray}>detalle</span>
              </div>

              {stop && jobsiteName ? (
                <div className="text-sm font-semibold truncate" style={{ color: "rgba(229,231,235,0.72)", marginTop: 6 }}>
                  {jobsiteName}
                </div>
              ) : null}
            </div>

            {stop ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap" style={statusStyle(status)}>
                {status === "Insufficient" ? "Needs follow-up" : status}
              </span>
            ) : null}
          </div>

          {/* Nav row: Filter + Reports + Today + FAQ */}
          <div className="grid grid-cols-4 items-center" style={{ paddingTop: 10, gap: 8 }}>
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

            <button style={{ ...linkBtn, justifySelf: "center" as any }} onClick={() => nav(routes.reports)}>
              <FileText className="w-4 h-4" />
              Reports
            </button>

            <button style={{ ...linkBtn, justifySelf: "center" as any }} onClick={() => nav(routes.today)}>
              <Calendar className="w-4 h-4" />
              Today
            </button>

            <button style={{ ...linkBtn, justifySelf: "end" as any }} onClick={() => nav(routes.faq)}>
              <Info className="w-4 h-4" />
              FAQ
            </button>
          </div>

          {canFilter && showFilters ? (
            <div className="flex flex-wrap items-center gap-2">
              {(["", "Pending", "Reported", "Insufficient"] as const).map((st) => (
                <button
                  key={st || "all"}
                  className="px-3 py-2 rounded-xl text-xs font-semibold"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    background: statusFilter === st ? "rgba(0,233,239,0.14)" : "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: statusFilter === st ? "rgba(0,233,239,0.95)" : "rgba(229,231,235,0.82)",
                  }}
                >
                  {st ? st.toLowerCase() : "all"}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {!stop ? (
          <Card className="rounded-2xl" style={cardStyle}>
            <CardContent className="py-10 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-14 h-14" style={{ color: "rgba(0,233,239,0.50)" }} />
              <p className="text-sm mt-4" style={{ color: "rgba(229,231,235,0.75)" }}>
                Stop not found. Go back to Today.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button className="gap-2" style={{ background: "#00E9EF", color: "#0B1020" }} onClick={() => nav(routes.today)}>
                  Back to Today
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.12)", color: "#E5E7EB" }}
                  onClick={openStopRequest}
                >
                  <Plus className="w-4 h-4" />
                  Missing stop
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : !allowed ? (
          <Card className="rounded-2xl" style={cardStyle}>
            <CardContent className="py-8 flex items-center gap-3">
              <AlertCircle className="w-6 h-6" style={{ color: "rgba(251,191,36,0.95)" }} />
              <div className="text-sm" style={{ color: "rgba(229,231,235,0.80)" }}>
                This stop isn’t assigned to your account.
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Jobsite card + actions */}
            <Card className="rounded-2xl" style={cardStyle}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-5 h-5" style={{ color: "rgba(0,233,239,0.95)" }} />
                    <CardTitle className="text-lg text-white" style={clamp1}>
                      Jobsite <span style={thinGray}>|</span> <span style={thinGray}>sitio</span>
                    </CardTitle>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    style={{ color: "rgba(0,233,239,0.95)" }}
                    onClick={() => openMaps(addr || jobsiteName)}
                  >
                    Navigate <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-semibold text-white">{jobsiteName}</div>
                  {addr ? <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.60)" }}>{addr}</div> : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {taskShort ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.10)", color: "rgba(229,231,235,0.85)" }}>
                      {taskShort}
                    </span>
                  ) : null}

                  {startTime ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.10)", color: "rgba(229,231,235,0.85)" }}>
                      <Clock className="w-3.5 h-3.5" />
                      {startTime}
                    </span>
                  ) : null}
                </div>

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
                    style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.12)", color: "#E5E7EB" }}
                    onClick={() => openMaps(addr || jobsiteName)}
                  >
                    <MapPin className="w-4 h-4" />
                    Navigate
                  </Button>

                  <Button
                    variant="outline"
                    className="gap-2"
                    style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.12)", color: "#E5E7EB" }}
                    onClick={openJobsiteEditRequest}
                  >
                    <Pencil className="w-4 h-4" />
                    Request jobsite edit
                  </Button>

                  <Button
                    variant="outline"
                    className="gap-2"
                    style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.12)", color: "#E5E7EB" }}
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
                          style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.12)", color: "rgba(0,233,239,0.95)" }}
                          onClick={() => nav(routes.officeReview)}
                        >
                          <Shield className="w-4 h-4 mr-2" />
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
      </div>
    </div>
  );
}