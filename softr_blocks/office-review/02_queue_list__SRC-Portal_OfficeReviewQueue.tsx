import { useMemo, useState } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ChevronRight, Inbox, ClipboardList, Pencil, User, FileText } from "lucide-react";

export default function Block(props: any) {
  const user = useCurrentUser();

  const queue = Array.isArray(props?.queue)
    ? props.queue
    : Array.isArray(props?.records)
    ? props.records
    : Array.isArray(props?.items)
    ? props.items
    : [];

  const routes = {
    officeReviewDetail: "/office-review",
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

  const normalizeStatus = (raw: any) => {
    const v = toText(raw).toLowerCase();
    if (!v) return "Open";
    if (v.includes("closed") || v.includes("done") || v.includes("resolved")) return "Closed";
    if (v.includes("in progress") || v.includes("working") || v.includes("assigned")) return "In Progress";
    if (v.includes("insufficient") || v.includes("follow") || v.includes("need")) return "Insufficient";
    return "Open";
  };

  const normalizeType = (raw: any) => {
    const v = toText(raw).toLowerCase();
    if (!v) return "Queue Item";
    if (v.includes("stop")) return "Stop Request";
    if (v.includes("jobsite") || v.includes("site edit")) return "Jobsite Edit";
    if (v.includes("user") || v.includes("profile")) return "User Update";
    if (v.includes("report")) return "Report";
    return "Queue Item";
  };

  const typeIcon = (t: string) => {
    if (t === "Stop Request") return <ClipboardList className="w-4 h-4" />;
    if (t === "Jobsite Edit") return <Pencil className="w-4 h-4" />;
    if (t === "User Update") return <User className="w-4 h-4" />;
    if (t === "Report") return <FileText className="w-4 h-4" />;
    return <Inbox className="w-4 h-4" />;
  };

  const urgencyScore = (raw: any) => {
    const v = toText(raw).toLowerCase();
    if (!v) return 0;
    if (v.includes("critical") || v.includes("urgent") || v.includes("p0")) return 4;
    if (v.includes("high") || v.includes("p1")) return 3;
    if (v.includes("medium") || v.includes("normal") || v.includes("p2")) return 2;
    if (v.includes("low") || v.includes("p3")) return 1;
    return 0;
  };

  const getDateMs = (x: any) => {
    const d = pick(x, ["Submitted_At_Local","Submitted_At","Last_Updated_At_Local","Created_At_Local","Created_At","Date","Timestamp"]);
    const t = Date.parse(toText(d));
    return Number.isFinite(t) ? t : 0;
  };

  const all = Array.isArray(queue) ? queue : [];

  const sorted = useMemo(() => {
    const arr = [...all];
    arr.sort((a, b) => {
      const ua = urgencyScore(pick(a, ["Urgency", "Priority", "Severity"]));
      const ub = urgencyScore(pick(b, ["Urgency", "Priority", "Severity"]));
      if (ub !== ua) return ub - ua;
      return getDateMs(b) - getDateMs(a);
    });
    return arr;
  }, [all]);

  const chipStyle = (kind: "closed" | "insufficient" | "inprogress" | "open") => {
    if (kind === "closed")
      return { background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.26)", color: "rgba(16,185,129,0.95)" };
    if (kind === "insufficient")
      return { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.26)", color: "rgba(239,68,68,0.95)" };
    if (kind === "inprogress")
      return { background: "rgba(0,233,239,0.12)", border: "1px solid rgba(0,233,239,0.22)", color: "rgba(0,233,239,0.95)" };
    return { background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.24)", color: "rgba(251,191,36,0.95)" };
  };

  const badgeStyleForStatus = (st: string) => {
    if (st === "Closed") return chipStyle("closed");
    if (st === "Insufficient") return chipStyle("insufficient");
    if (st === "In Progress") return chipStyle("inprogress");
    return chipStyle("open");
  };

  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState("All"); // All | Stop Request | Jobsite Edit | User Update | Report
  const [statusFilter, setStatusFilter] = useState("All"); // All | Open | In Progress | Insufficient | Closed

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return sorted.filter((item) => {
      const type = normalizeType(pick(item, ["Type", "Request_Type", "Item_Type", "Entity_Type"]));
      const st = normalizeStatus(pick(item, ["Status", "Queue_Status", "Review_Status"]));

      if (typeFilter !== "All" && type !== typeFilter) return false;
      if (statusFilter !== "All" && st !== statusFilter) return false;
      if (!qq) return true;

      const title =
        toText(pick(item, ["Title", "Subject", "Summary"])) ||
        toText(pick(item, ["Jobsite_Name", "Site_Name"])) ||
        type;

      const meta1 = toText(pick(item, ["Reporter_Name", "Employee_Name", "Worker_Name", "Login_Email", "Reporter_Email", "Worker_Email"]));
      const meta2 = toText(pick(item, ["Jobsite_Name", "Site_Name", "Address", "Jobsite_Address"]));
      const when = toText(pick(item, ["Submitted_At_Local","Submitted_At","Created_At_Local","Created_At","Date","Timestamp"]));

      const hay = `${title} ${meta1} ${meta2} ${when} ${type} ${st}`.toLowerCase();
      return hay.includes(qq);
    });
  }, [sorted, q, typeFilter, statusFilter]);

  const openDetail = (item: any) => {
    const id = toText(pick(item, ["id", "ID", "Queue_ID", "Review_ID", "__ROW_NUMBER__"]));
    if (id) return nav(`${routes.officeReviewDetail}?id=${encodeURIComponent(id)}`);

    const type = toText(pick(item, ["Type", "Request_Type", "Item_Type", "Entity_Type"]));
    const when = toText(pick(item, ["Submitted_At", "Created_At", "Date", "Timestamp"]));
    nav(`${routes.officeReviewDetail}?type=${encodeURIComponent(type)}&date=${encodeURIComponent(when)}`);
  };

  // ---------- VISUAL (no bg/minHeight) ----------
  const cardStyle = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 52px rgba(0,0,0,0.40)",
    backdropFilter: "blur(8px)",
  };

  if (!user) {
    return (
      <Card className="rounded-2xl" style={cardStyle}>
        <CardContent className="py-10 text-center" style={{ color: "rgba(229,231,235,0.85)" }}>
          Please log in.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6" style={{ paddingTop: 12, paddingBottom: 12 }}>
      {/* Search + filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-xl px-3 h-11 w-full" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <Search className="w-4 h-4" style={{ color: "rgba(229,231,235,0.65)" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search queue… (site / reporter / type / date)"
            className="w-full bg-transparent outline-none text-sm"
            style={{ color: "rgba(229,231,235,0.92)" }}
          />
        </div>

        <button
          onClick={() => setShowFilters((v) => !v)}
          className="inline-flex items-center gap-2 text-sm font-semibold"
          style={{ color: "rgba(0,233,239,0.96)" }}
        >
          <Filter className="w-4 h-4" />
          Filter <span style={{ color: "rgba(229,231,235,0.55)", fontWeight: 500 }}>(all)</span>
        </button>

        {showFilters ? (
          <Card className="rounded-2xl" style={cardStyle}>
            <CardContent className="p-4 space-y-3">
              <div className="text-xs font-semibold" style={{ color: "rgba(229,231,235,0.70)" }}>Type</div>
              <div className="flex flex-wrap items-center gap-2">
                {["All", "Stop Request", "Jobsite Edit", "User Update", "Report"].map((t) => (
                  <button
                    key={t}
                    className="px-3 py-2 rounded-xl text-xs font-semibold"
                    onClick={() => setTypeFilter(t)}
                    style={{
                      background: typeFilter === t ? "rgba(0,233,239,0.14)" : "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: typeFilter === t ? "rgba(0,233,239,0.95)" : "rgba(229,231,235,0.82)",
                    }}
                  >
                    {t === "All" ? "all" : t}
                  </button>
                ))}
              </div>

              <div className="text-xs font-semibold pt-2" style={{ color: "rgba(229,231,235,0.70)" }}>Status</div>
              <div className="flex flex-wrap items-center gap-2">
                {["All", "Open", "In Progress", "Insufficient", "Closed"].map((st) => (
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

                {(typeFilter !== "All" || statusFilter !== "All" || q.trim()) ? (
                  <button
                    className="px-3 py-2 rounded-xl text-xs font-semibold ml-auto"
                    onClick={() => { setTypeFilter("All"); setStatusFilter("All"); setQ(""); }}
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

      {/* Queue list */}
      <Card className="rounded-2xl mt-4" style={cardStyle}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">Review Queue</CardTitle>
        </CardHeader>

        <CardContent className="pt-0 p-0">
          {filtered.length ? (
            <div>
              {filtered.slice(0, 60).map((item, idx) => {
                const type = normalizeType(pick(item, ["Type", "Request_Type", "Item_Type", "Entity_Type"]));
                const st = normalizeStatus(pick(item, ["Status", "Queue_Status", "Review_Status"]));

                const title =
                  toText(pick(item, ["Title", "Subject", "Summary"])) ||
                  toText(pick(item, ["Jobsite_Name", "Site_Name"])) ||
                  type;

                const meta1 = toText(pick(item, ["Reporter_Name", "Employee_Name", "Worker_Name", "Login_Email", "Reporter_Email", "Worker_Email"]));
                const meta2 = toText(pick(item, ["Jobsite_Name", "Site_Name", "Address", "Jobsite_Address"]));
                const when = toText(pick(item, ["Submitted_At_Local","Submitted_At","Created_At_Local","Created_At","Date","Timestamp"]));

                const isLast = idx === Math.min(filtered.length, 60) - 1;
                const key = toText(pick(item, ["id", "ID", "Queue_ID", "Review_ID", "__ROW_NUMBER__"])) || idx;

                const stStyle = badgeStyleForStatus(st);

                return (
                  <div key={key}>
                    <div className="flex items-center justify-between py-4 px-4 cursor-pointer" onClick={() => openDetail(item)}>
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(0,233,239,0.95)" }}>
                          {typeIcon(type)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="font-semibold truncate text-white">{title}</div>
                            <Badge variant="outline" className="text-[10px]" style={{ borderColor: "rgba(0,233,239,0.25)", color: "rgba(0,233,239,0.95)" }}>
                              {type}
                            </Badge>
                          </div>

                          <div className="text-sm mt-1 truncate" style={{ color: "rgba(229,231,235,0.60)" }}>
                            {(meta1 ? meta1 + " • " : "") + (meta2 || "—")}
                          </div>

                          <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.45)" }}>
                            {when || "—"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            background: stStyle.background,
                            borderColor: String(stStyle.border).replace("1px solid ", ""),
                            color: stStyle.color,
                          }}
                        >
                          {st}
                        </Badge>

                        <ChevronRight className="w-5 h-5" style={{ color: "rgba(0,233,239,0.95)" }} />
                      </div>
                    </div>

                    {!isLast ? <div className="h-px" style={{ background: "rgba(255,255,255,0.08)" }} /> : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-14 px-6 text-center">
              <Inbox className="w-20 h-20 mx-auto mb-3" style={{ color: "rgba(0,233,239,0.55)", filter: "drop-shadow(0 0 18px rgba(0,233,239,0.12))" }} />
              <div className="text-sm text-white">Queue is clear</div>
              <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.65)" }}>
                New requests will appear here automatically.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}