import { useMemo, useState } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  Filter,
  ChevronRight,
  AlertCircle,
  Search,
  MapPin,
  User,
  Plus,
} from "lucide-react";

export default function Block(props: any) {
  const user = useCurrentUser();

  const requests = Array.isArray(props?.requests)
    ? props.requests
    : Array.isArray(props?.records)
    ? props.records
    : Array.isArray(props?.items)
    ? props.items
    : [];

  const routes = {
    stopRequestsNew: "/stop-requests", // change if you have a dedicated "new" page
    stopRequestsDetail: "/stop-requests",
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

  const userEmail = useMemo(() => toText(user?.email).toLowerCase(), [user]);

  const roleStrings = useMemo(() => {
    const vals = [
      user?.UserGroup,
      user?.userGroup,
      user?.Role,
      user?.role,
      user?.Auth_Level,
      user?.auth_level,
      user?.fields?.UserGroup,
      user?.fields?.Role,
      user?.fields?.Auth_Level,
    ]
      .map(toText)
      .map((x) => x.trim())
      .filter(Boolean);
    return Array.from(new Set(vals));
  }, [user]);

  const isOffice = useMemo(() => {
    const val = roleStrings.join(" ").toLowerCase();
    if (!val) return false;
    return (
      val.includes("office") ||
      val.includes("admin") ||
      val.includes("manager") ||
      val.includes("dispatcher") ||
      val.includes("supervisor") ||
      val.includes("office+")
    );
  }, [roleStrings]);

  const normalizeStatus = (raw: any) => {
    const v = toText(raw).toLowerCase();
    if (!v) return "Open";
    if (v.includes("closed") || v.includes("done") || v.includes("resolved")) return "Closed";
    if (v.includes("in progress") || v.includes("working") || v.includes("triage")) return "In Progress";
    if (v.includes("insufficient") || v.includes("needs info") || v.includes("need info") || v.includes("follow") || v.includes("need"))
      return "Insufficient";
    return "Open";
  };

  const chipStyle = (kind: string) => {
    if (kind === "closed")
      return { background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.26)", color: "rgba(16,185,129,0.95)" };
    if (kind === "insufficient")
      return { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.26)", color: "rgba(239,68,68,0.95)" };
    if (kind === "inprogress")
      return { background: "rgba(0,233,239,0.12)", border: "1px solid rgba(0,233,239,0.22)", color: "rgba(0,233,239,0.95)" };
    if (kind === "open")
      return { background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.24)", color: "rgba(251,191,36,0.95)" };
    return { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(229,231,235,0.90)" };
  };

  const badgeStyleForStatus = (st: string) => {
    if (st === "Closed") return chipStyle("closed");
    if (st === "Insufficient") return chipStyle("insufficient");
    if (st === "In Progress") return chipStyle("inprogress");
    return chipStyle("open");
  };

  // Worker safety filter
  const visible = useMemo(() => {
    const all = Array.isArray(requests) ? requests : [];
    if (isOffice) return all;
    if (!userEmail) return all;

    const emailKeys = ["Login_Email", "Worker_Email", "Email", "User_Email", "Requester_Email"];
    return all.filter((r: any) => {
      const em = toText(pick(r, emailKeys)).toLowerCase();
      return em ? em === userEmail : true;
    });
  }, [requests, isOffice, userEmail]);

  const getDateMs = (r: any) => {
    const d = pick(r, ["Submitted_At_Local", "Reviewed_At_Local", "Manifest_Date", "Submitted_At", "Created_At", "Request_Date", "Date", "Timestamp"]);
    const t = Date.parse(toText(d));
    return Number.isFinite(t) ? t : 0;
  };

  const sorted = useMemo(() => {
    const arr = [...visible];
    arr.sort((a, b) => getDateMs(b) - getDateMs(a));
    return arr;
  }, [visible]);

  // UI controls (live here; can’t share state across blocks)
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"All" | "Open" | "In Progress" | "Insufficient" | "Closed">("All");

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return sorted.filter((r: any) => {
      const st = normalizeStatus(pick(r, ["Status", "Request_Status"]));
      if (statusFilter !== "All" && st !== statusFilter) return false;
      if (!qq) return true;

      const jobsite = toText(pick(r, ["Jobsite_Name", "Site_Name", "Jobsite", "Site"]));
      const addr = toText(pick(r, ["Jobsite_Address", "Address"]));
      const when = toText(pick(r, ["Submitted_At_Local", "Reviewed_At_Local", "Manifest_Date", "Submitted_At", "Created_At", "Request_Date", "Date", "Timestamp"]));
      const note = toText(pick(r, ["Reason_Text", "Requested_Change_Type", "Requested_Change_JSON", "Office_Notes", "Notes", "Message", "Reason", "Request_Text", "Details"]));
      const worker = toText(pick(r, ["Worker_Name", "Employee_Name", "Name", "Login_Email", "Email"]));

      const hay = `${jobsite} ${addr} ${when} ${note} ${isOffice ? worker : ""} ${st}`.toLowerCase();
      return hay.includes(qq);
    });
  }, [sorted, q, statusFilter, isOffice]);

  const openDetail = (r: any) => {
    const id = toText(pick(r, ["id", "ID", "Request_ID", "Stop_Request_ID", "__ROW_NUMBER__"]));
    if (id) return nav(`${routes.stopRequestsDetail}?id=${encodeURIComponent(id)}`);

    const jobsiteId = toText(pick(r, ["Jobsite_ID", "Site_ID"]));
    const when = toText(pick(r, ["Submitted_At_Local", "Reviewed_At_Local", "Submitted_At", "Created_At", "Request_Date", "Date"]));
    nav(`${routes.stopRequestsDetail}?jobsiteId=${encodeURIComponent(jobsiteId)}&date=${encodeURIComponent(when)}`);
  };

  const cardStyle = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 52px rgba(0,0,0,0.40)",
    backdropFilter: "blur(8px)",
  } as const;

  if (!user) return null;

  return (
    <div id="stop-requests-filters" className="mx-auto w-full max-w-5xl px-4 sm:px-6" style={{ paddingTop: 12, paddingBottom: 12, color: "#E5E7EB" }}>
      {/* Search */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-xl px-3 h-11 w-full" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <Search className="w-4 h-4" style={{ color: "rgba(229,231,235,0.65)" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={isOffice ? "Search… (site / reporter / notes / date)" : "Search… (site / notes / date)"}
            className="w-full bg-transparent outline-none text-sm"
            style={{ color: "rgba(229,231,235,0.92)" }}
          />
        </div>

        {/* Filter toggle */}
        <button
          style={{ background: "transparent", border: "none", padding: 0, color: "rgba(0,233,239,0.96)", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}
          onClick={() => setShowFilters((v) => !v)}
        >
          <Filter className="w-4 h-4" />
          Filter
        </button>

        {/* Filters panel */}
        {showFilters ? (
          <Card className="rounded-2xl" style={cardStyle}>
            <CardContent className="p-4 space-y-3">
              <div className="text-xs font-semibold" style={{ color: "rgba(229,231,235,0.70)" }}>
                Status
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(["All", "Open", "In Progress", "Insufficient", "Closed"] as const).map((st) => (
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
                    {st === "All" ? "all" : st}
                  </button>
                ))}

                {(statusFilter !== "All" || q.trim()) ? (
                  <button
                    className="px-3 py-2 rounded-xl text-xs font-semibold ml-auto"
                    onClick={() => { setStatusFilter("All"); setQ(""); }}
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(229,231,235,0.82)" }}
                  >
                    Reset
                  </button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* List */}
      <Card className="rounded-2xl mt-4" style={cardStyle}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">Requests</CardTitle>
        </CardHeader>

        <CardContent className="pt-0 p-0">
          {filtered.length ? (
            <div>
              {filtered.slice(0, 40).map((r: any, idx: number) => {
                const jobsite = toText(pick(r, ["Jobsite_Name", "Site_Name", "Jobsite", "Site"])) || "Jobsite";
                const addr = toText(pick(r, ["Jobsite_Address", "Address"]));
                const when =
                  toText(pick(r, ["Submitted_At_Local", "Reviewed_At_Local", "Manifest_Date", "Submitted_At", "Created_At", "Request_Date", "Date", "Timestamp"])) || "—";
                const note = toText(
                  pick(r, ["Reason_Text", "Requested_Change_Type", "Requested_Change_JSON", "Office_Notes", "Notes", "Message", "Reason", "Request_Text", "Details"])
                );
                const st = normalizeStatus(pick(r, ["Status", "Request_Status"]));

                const workerName =
                  toText(pick(r, ["Worker_Name", "Employee_Name", "Name"])) ||
                  toText(pick(r, ["Login_Email", "Email"])) ||
                  "—";

                const isLast = idx === Math.min(filtered.length, 40) - 1;
                const key = toText(pick(r, ["id", "ID", "Request_ID", "Stop_Request_ID", "__ROW_NUMBER__"])) || String(idx);

                return (
                  <div
                    key={key}
                    className="px-4 py-3 cursor-pointer"
                    style={{ borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.08)" }}
                    onClick={() => openDetail(r)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="text-sm font-semibold truncate text-white">{jobsite}</div>
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{
                              background: badgeStyleForStatus(st).background,
                              borderColor: String(badgeStyleForStatus(st).border).replace("1px solid ", ""),
                              color: badgeStyleForStatus(st).color,
                            }}
                          >
                            {st}
                          </Badge>
                        </div>

                        <div className="text-xs mt-1 truncate" style={{ color: "rgba(229,231,235,0.60)" }}>
                          {when}
                        </div>

                        <div className="flex flex-wrap gap-3 mt-2">
                          {addr ? (
                            <span className="inline-flex items-center gap-1 text-xs truncate" style={{ color: "rgba(229,231,235,0.70)" }}>
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="truncate">{addr}</span>
                            </span>
                          ) : null}

                          {isOffice ? (
                            <span className="inline-flex items-center gap-1 text-xs truncate" style={{ color: "rgba(229,231,235,0.70)" }}>
                              <User className="w-3.5 h-3.5" />
                              <span className="truncate">{workerName}</span>
                            </span>
                          ) : null}
                        </div>

                        {note ? (
                          <div className="text-sm mt-2 line-clamp-2" style={{ color: "rgba(229,231,235,0.78)" }}>
                            {note}
                          </div>
                        ) : null}
                      </div>

                      <ChevronRight className="w-4 h-4" style={{ color: "rgba(229,231,235,0.55)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 px-6">
              <AlertCircle className="w-20 h-20 mx-auto mb-3" style={{ color: "rgba(0,233,239,0.55)", filter: "drop-shadow(0 0 18px rgba(0,233,239,0.12))" }} />
              <div className="text-sm text-white">No stop requests yet</div>
              <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.65)" }}>
                If a stop is missing from Today, submit a request.
              </div>

              {!isOffice ? (
                <Button className="mt-6 gap-2 h-11 rounded-xl font-semibold" style={{ background: "rgba(0,233,239,0.95)", color: "#0b1020" }} onClick={() => nav(routes.stopRequestsNew)}>
                  <Plus className="w-4 h-4" />
                  New Stop Request
                </Button>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optional: office shortcut (only shows to office) */}
      {isOffice ? (
        <Card className="rounded-2xl mt-4" style={cardStyle}>
          <CardContent className="py-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 rounded-xl"
              style={{ color: "rgba(229,231,235,0.88)" }}
              onClick={() => nav(routes.officeReview)}
            >
              <ClipboardList className="w-5 h-5" />
              Go to Office Review Queue
              <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "rgba(0,233,239,0.95)" }} />
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}