import React, { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight, Clock, FileText, MapPin, Plus } from "lucide-react";

type ViewMode = "my" | "crew";
type StatusFilter = "All" | "Pending" | "Reported" | "Insufficient";

const EVT = "rk_today_state_v1";
const KEY = "__rk_today_state_v1";
const DEFAULT_STATE = { q: "", viewMode: "my" as ViewMode, crewFilter: "All", statusFilter: "All" as StatusFilter };

function readState() {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  const w = window as any;
  return { ...DEFAULT_STATE, ...(w[KEY] || {}) };
}

export default function Block({ stops = [] }: { stops?: any[] }) {
  const user = useCurrentUser();

  const routes = {
    stopDetails: "/stop-detail",
    reports: "/reports",
    stopRequests: "/stop-requests",
    today: "/today?view=timelog",
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

  const [state, setState] = useState(readState());
  useEffect(() => {
    const h = () => setState(readState());
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, []);

  const allStops = useMemo(() => (Array.isArray(stops) ? stops : []), [stops]);

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
    const base = isOffice && state.viewMode === "crew" ? allStops : myStops;
    const qq = state.q.trim().toLowerCase();

    const filtered = base.filter((s) => {
      const c = toText(pick(s, ["Crew_ID", "CrewId", "Crew"]));
      const st = normalizeStatus(pick(s, ["Report_Status", "Status"]));
      const job = toText(pick(s, ["Jobsite_Name", "Site_Name"]));
      const addr = toText(pick(s, ["Jobsite_Address", "Address"]));
      const task = toText(pick(s, ["Assignment_Type", "Task", "Type"]));

      if (isOffice && state.viewMode === "crew" && state.crewFilter !== "All" && c !== state.crewFilter) return false;
      if (state.statusFilter !== "All" && st !== state.statusFilter) return false;

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
  }, [allStops, myStops, isOffice, state]);

  const openMaps = (q: string) => {
    const v = (q || "").trim();
    if (!v) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v)}`, "_blank");
  };

  const openStopDetails = (s: any) => {
    const row = toText(pick(s, ["__ROW_NUMBER__", "Row", "Row_Number"]));
    const jobsiteId = toText(pick(s, ["Jobsite_ID", "Site_ID"]));
    nav(`${routes.stopDetails}?row=${encodeURIComponent(row)}&jobsiteId=${encodeURIComponent(jobsiteId)}`);
  };

  const openNewReport = (s: any, mode: "stop" | "followup" | "general" | "other") => {
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
  const cardStyle: CSSProperties = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 52px rgba(0,0,0,0.40)",
    backdropFilter: "blur(8px)",
  };
  const thinGray: CSSProperties = { color: "rgba(229,231,235,0.55)", fontWeight: 500 };
  const esGray: CSSProperties = { ...thinGray, fontStyle: "italic" };

  const statusPill = (st: string): CSSProperties => {
    if (st === "Reported") return { background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.22)", color: "rgba(16,185,129,0.95)" };
    if (st === "Insufficient") return { background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.22)", color: "rgba(239,68,68,0.95)" };
    return { background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.22)", color: "rgba(251,191,36,0.95)" };
  };

  const listTitle = isOffice && state.viewMode === "crew" ? "Crew Stops" : "My Stops";
  const listEs = isOffice && state.viewMode === "crew" ? "paradas del equipo" : "mis paradas";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6" style={wrap}>
      {/* Stops list */}
      <Card className="rounded-2xl" style={cardStyle}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="w-5 h-5" style={{ color: "rgba(0,233,239,0.95)" }} />
            <CardTitle className="text-base text-white truncate">
              {listTitle} <span style={thinGray}>|</span> <span style={esGray}>{listEs}</span>
            </CardTitle>
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

                const isLast = idx === displayedStops.length - 1;
                const key = toText(pick(s, ["id", "__ROW_NUMBER__"])) || idx;

                return (
                  <div key={key} className="py-4 px-4" style={{ borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 mt-0.5" style={{ color: "rgba(229,231,235,0.60)" }} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white truncate">{jobsiteName}</div>
                            {addr ? <div className="text-xs mt-0.5 truncate" style={thinGray}>{addr}</div> : null}
                          </div>
                          {start ? <div className="text-xs whitespace-nowrap" style={thinGray}>{start}</div> : null}
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

                        {(status === "Pending" || status === "Insufficient") ? (
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
              <Calendar className="w-20 h-20 mx-auto mb-3" style={{ color: "rgba(0,233,239,0.55)" }} />
              <div className="text-sm text-white">No stops scheduled for today</div>
              <div className="text-xs mt-1" style={thinGray}>
                Use “Report a different site” if you worked somewhere else.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Can't find your site */}
      <Card className="rounded-2xl mt-5" style={cardStyle}>
        <CardContent className="p-4">
          <div className="text-sm font-semibold text-white">
            Can’t find your site <span style={thinGray}>|</span> <span style={esGray}>¿no ves tu sitio?</span>
          </div>
          <div className="text-xs mt-1" style={thinGray}>
            Add a missing stop request or report a different jobsite.
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-11 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.12)", color: "rgba(229,231,235,0.92)" }}
              onClick={() => nav(routes.stopRequests)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add missing stop
            </Button>

            <Button
              variant="outline"
              className="h-11 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.12)", color: "rgba(229,231,235,0.92)" }}
              onClick={() => openNewReport({}, "other")}
            >
              <FileText className="w-4 h-4 mr-2" />
              Report a different site
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Day actions */}
      <Card className="rounded-2xl mt-5" style={cardStyle}>
        <CardContent className="p-4">
          <div className="text-sm font-semibold text-white">
            Day actions <span style={thinGray}>|</span> <span style={esGray}>acciones del día</span>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button
              variant="outline"
              className="h-11 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.12)", color: "rgba(229,231,235,0.92)" }}
              onClick={() => openNewReport({}, "general")}
            >
              <Plus className="w-4 h-4 mr-2" />
              New general note
            </Button>

            <Button
              variant="outline"
              className="h-11 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.12)", color: "rgba(229,231,235,0.92)" }}
              onClick={() => nav(routes.today)}
            >
              <Clock className="w-4 h-4 mr-2" />
              Add time log
            </Button>

            <Button
              variant="outline"
              className="h-11 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.12)", color: "rgba(229,231,235,0.92)" }}
              onClick={() => nav(routes.reports)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Reports history
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}