import { useMemo, useState } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Filter,
  ChevronRight,
  ClipboardList,
  Pencil,
  User,
  FileText,
  Inbox,
  Search,
  Info,
  Shield,
  Home,
  Calendar,
  AlertCircle,
  Bell,
} from "lucide-react";

/**
 * OFFICE REVIEW QUEUE (Office+)
 * Key fix:
 * - Do NOT hard-block the page with isOffice by default (Softr should control access).
 * - If role fields are missing from useCurrentUser, isOffice would be false for everyone.
 */

export default function Block(props) {
  const user = useCurrentUser();

  // Accept whatever Softr passes (queue / records / items)
  const queue = Array.isArray(props?.queue)
    ? props.queue
    : Array.isArray(props?.records)
    ? props.records
    : Array.isArray(props?.items)
    ? props.items
    : [];

  // 🔧 Align slugs to your Softr pages
  const routes = {
    home: "/home",
    today: "/today",
    faq: "/faq",
    officeReviewDetail: "/office-review",
    stopRequests: "/stop-requests",
    jobsiteEditRequests: "/jobsite-edit-requests",
    userUpdateRequests: "/user-update-requests",
    reports: "/reports",
    profile: "/profile",
    bulletins: "/bulletins",
    officeReview: "/office-review",

  };

  const logoUrl = ""; // optional
  const nav = (href) =>(window.location.href = href);
  const toText = (v) =>(v === undefined || v === null ? "" : String(v));

  const pick = (obj, keys) => {
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
    const name = toText(user?.name || user?.fullName);
    if (name) return name;
    const em = toText(user?.email);
    return em ? em.split("@")[0] : "Reporter";
  }, [user]);

  // ---- Role detection (best-effort / cosmetic only) ----
  const roleStrings = useMemo(() => {
    const out = [];
    const add = (v) => {
      if (!v) return;
      if (Array.isArray(v)) v.forEach(add);
      else if (typeof v === "object") {
        // common group shapes: {name}, {title}
        if (v?.name) out.push(String(v.name));
        if (v?.title) out.push(String(v.title));
      } else out.push(String(v));
    };

    // user object guesses
    add(user?.UserGroup);
    add(user?.userGroup);
    add(user?.Role);
    add(user?.role);
    add(user?.Auth_Level);
    add(user?.auth_level);
    add(user?.group);
    add(user?.group_name);
    add(user?.groupName);
    add(user?.groups);
    add(user?.user_groups);

    // sometimes Softr exposes this globally
    try {
      const w = typeof window !== "undefined" ? window : null;
      const lu = w?.logged_in_user;
      add(lu?.UserGroup);
      add(lu?.userGroup);
      add(lu?.Role);
      add(lu?.role);
      add(lu?.Auth_Level);
      add(lu?.auth_level);
      add(lu?.group_name);
      add(lu?.groups);
      add(lu?.user_groups);
    } catch (e) {}

    return out.filter(Boolean);
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

  // If you REALLY want the script to hard-block (not recommended), flip to true.
  const ENFORCE_OFFICE_GATE = false;

  const normalizeStatus = (raw) => {
    const v = toText(raw).toLowerCase();
    if (!v) return "Open";
    if (v.includes("closed") || v.includes("done") || v.includes("resolved")) return "Closed";
    if (v.includes("in progress") || v.includes("working") || v.includes("assigned")) return "In Progress";
    if (v.includes("insufficient") || v.includes("follow") || v.includes("need")) return "Insufficient";
    return "Open";
  };

  const normalizeType = (raw) => {
    const v = toText(raw).toLowerCase();
    if (!v) return "Queue Item";
    if (v.includes("stop")) return "Stop Request";
    if (v.includes("jobsite") || v.includes("site edit")) return "Jobsite Edit";
    if (v.includes("user") || v.includes("profile")) return "User Update";
    if (v.includes("report")) return "Report";
    return "Queue Item";
  };

  const typeIcon = (t) => {
    if (t === "Stop Request") return <ClipboardList className="w-4 h-4" />;
    if (t === "Jobsite Edit") return <Pencil className="w-4 h-4" />;
    if (t === "User Update") return <User className="w-4 h-4" />;
    if (t === "Report") return <FileText className="w-4 h-4" />;
    return <Inbox className="w-4 h-4" />;
  };

  const chipStyle = (kind) => {
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

  const badgeStyleForStatus = (st) => {
    if (st === "Closed") return chipStyle("closed");
    if (st === "Insufficient") return chipStyle("insufficient");
    if (st === "In Progress") return chipStyle("inprogress");
    return chipStyle("open");
  };

  const all = Array.isArray(queue) ? queue : [];

  const sorted = useMemo(() => {
    const arr = [...all];
    const getDate = (x) => {
      const d = pick(x, ["Submitted_At_Local", "Last_Updated_At_Local", "Created_At_Local", "Manifest_Date", "Created_At", "Submitted_At", "Date", "Timestamp"]);
      const t = Date.parse(toText(d));
      return Number.isFinite(t) ? t : 0;
    };
    arr.sort((a, b) => getDate(b) - getDate(a));
    return arr;
  }, [all]);

  const counts = useMemo(() => {
    let total = sorted.length;
    let open = 0;
    let inProgress = 0;
    let insufficient = 0;
    let closed = 0;

    for (const item of sorted) {
      const st = normalizeStatus(pick(item, ["Status", "Queue_Status", "Review_Status"]));
      if (st === "Closed") closed++;
      else if (st === "Insufficient") insufficient++;
      else if (st === "In Progress") inProgress++;
      else open++;
    }

    return { total, open, inProgress, insufficient, closed };
  }, [sorted]);

  const openDetail = (item) => {
    const id = toText(pick(item, ["id", "ID", "Queue_ID", "Review_ID", "__ROW_NUMBER__"]));
    if (id) return nav(`${routes.officeReviewDetail}?id=${encodeURIComponent(id)}`);

    const type = toText(pick(item, ["Type", "Request_Type", "Item_Type"]));
    const when = toText(pick(item, ["Created_At", "Submitted_At", "Date", "Timestamp"]));
    nav(`${routes.officeReviewDetail}?type=${encodeURIComponent(type)}&date=${encodeURIComponent(when)}`);
  };

  // UI controls
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState("All"); // All | Stop Request | Jobsite Edit | User Update | Report
  const [statusFilter, setStatusFilter] = useState("All"); // All | Open | In Progress | Insufficient | Closed

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return sorted.filter((item) => {
      const type = normalizeType(pick(item, ["Type", "Request_Type", "Item_Type"]));
      const st = normalizeStatus(pick(item, ["Status", "Queue_Status", "Review_Status"]));

      if (typeFilter !== "All" && type !== typeFilter) return false;
      if (statusFilter !== "All" && st !== statusFilter) return false;
      if (!qq) return true;

      const title =
        toText(pick(item, ["Title", "Subject", "Summary"])) ||
        toText(pick(item, ["Jobsite_Name", "Site_Name"])) ||
        type;

      const meta1 = toText(
        pick(item, ["Reporter_Name", "Employee_Name", "Worker_Name", "Login_Email", "Reporter_Email", "Worker_Email"])
      );
      const meta2 = toText(pick(item, ["Jobsite_Name", "Site_Name", "Address", "Jobsite_Address"]));
      const when = toText(pick(item, ["Created_At", "Submitted_At", "Date", "Timestamp"]));

      const hay = `${title} ${meta1} ${meta2} ${when} ${type} ${st}`.toLowerCase();
      return hay.includes(qq);
    });
  }, [sorted, q, typeFilter, statusFilter]);

  // ---- Visuals (match newest pages) ----
  const bg = {
    background:
      "radial-gradient(900px 520px at 18% -12%, rgba(0,233,239,0.14), transparent 62%)," +
      "radial-gradient(900px 520px at 88% -6%, rgba(251,191,36,0.10), transparent 60%)," +
      "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.00) 30%)," +
      "#0B1020",
    color: "#E5E7EB",
    minHeight: "100vh",
  };

  const banner = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.00) 60%), #000",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  };

  const accentLine = {
    height: 2,
    background:
      "linear-gradient(90deg, rgba(0,233,239,0.95), rgba(0,233,239,0.25) 35%, rgba(251,191,36,0.22) 70%, rgba(251,191,36,0.70))",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 6px 20px rgba(0,233,239,0.10)",
  };

  const cardStyle = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 52px rgba(0,0,0,0.40)",
    backdropFilter: "blur(8px)",
  };

  const linkBtn = {
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

  const thinGray = { color: "rgba(229,231,235,0.55)", fontWeight: 500 };

  const debug =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1";

  // Not logged in guard
  if (!user) {
    return (
      <div className="min-h-screen" style={bg}>
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
            </div>
          </div>
          <div style={accentLine} />
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-10">
          <div className="flex flex-col items-center justify-center text-center">
            <Shield className="w-20 h-20" style={{ color: "rgba(0,233,239,0.55)", filter: "drop-shadow(0 0 12px rgba(0,233,239,0.30))" }} />
            <div className="mt-5 text-sm" style={{ color: "rgba(229,231,235,0.75)" }}>
              Please log in to view the office review queue.
            </div>
            <Button className="mt-6 h-11 rounded-xl font-semibold" style={{ background: "rgba(0,233,239,0.95)", color: "#0b1020" }} onClick={() => nav(routes.home)}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={bg}>
      {/* Banner */}
      <header style={banner}>
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3 min-w-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="RK"
                  className="w-11 h-11 rounded-2xl object-contain"
                  style={{ background: "rgba(255,255,255,0.06)", boxShadow: "0 10px 30px rgba(0,0,0,0.45)" }}
                />
              ) : (
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
              )}

              <div className="min-w-0">
                <div className="text-[12px] uppercase tracking-[0.22em] leading-tight" style={{ color: "rgba(229,231,235,0.86)" }}>
                  FIELD REPORTING SYSTEM
                </div>
                <div style={{ marginTop: 6, height: 1, width: 180, background: "linear-gradient(90deg, rgba(0,233,239,0.25), rgba(255,255,255,0.00))", opacity: 0.9 }} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOffice ? (
                <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(251,191,36,0.14)", border: "1px solid rgba(251,191,36,0.28)", color: "rgba(251,191,36,0.95)" }}>
                  Office+
                </span>
              ) : null}

              <button
                type="button"
                className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden"
                style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 12px 34px rgba(0,0,0,0.55)" }}
                aria-label="Profile"
                title={displayName}
               onClick={() => nav(routes.profile)}>
                {user?.avatarUrl ? <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" /> : <User className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        <div style={accentLine} />
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 space-y-5" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}>
        {/* OPTIONAL hard gate (off by default) */}
        {ENFORCE_OFFICE_GATE && !isOffice ? (
          <Card className="rounded-2xl" style={cardStyle}>
            <CardContent className="py-14 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-20 h-20" style={{ color: "rgba(251, 191, 36, 0.75)", filter: "drop-shadow(0 0 12px rgba(251, 191, 36, 0.18))" }} />
              <div className="mt-6 font-semibold" style={{ color: "#E5E7EB" }}>
                Permission required
              </div>
              <div className="text-sm mt-2" style={{ color: "rgba(229, 231, 235, 0.6)" }}>
                This page is available to Office+ users only.
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Title + Search + Pills + Nav row */}
            <div className="space-y-2">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-2xl font-extrabold leading-tight truncate text-white">Office Review Queue</div>
                  <div className="text-sm font-semibold" style={{ color: "rgba(229,231,235,0.72)" }}>
                    Triage + resolve requests
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }} title="Office Review">
                  <Shield className="w-5 h-5" style={{ color: "rgba(0,233,239,0.95)" }} />
                </div>
              </div>

              {/* Search */}
              <div className="pt-2">
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
              </div>

              {/* Count chips */}
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("total")}>Total: {counts.total}</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("open")}>Open: {counts.open}</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("inprogress")}>In Progress: {counts.inProgress}</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("insufficient")}>Insufficient: {counts.insufficient}</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("closed")}>Closed: {counts.closed}</span>
              </div>

              {/* Nav row */}
              <div className="grid grid-cols-4 items-center" style={{ paddingTop: 10, gap: 8 }}>
                <button style={linkBtn} onClick={() => setShowFilters((v) => !v)}>
                  <Filter className="w-4 h-4" />
                  <span style={{ fontWeight: 800 }}>
                    Filter <span style={thinGray}>(all)</span>
                  </span>
                </button>

                <button style={{ ...linkBtn, justifySelf: "center" }} onClick={() => nav(routes.reports)}>
                  <FileText className="w-4 h-4" />
                  Reports
                </button>

                <button style={{ ...linkBtn, justifySelf: "center" }} onClick={() => nav(routes.today)}>
                  <Calendar className="w-4 h-4" />
                  Today
                </button>

                <button style={{ ...linkBtn, justifySelf: "end" }} onClick={() => nav(routes.faq)}>
                  <Info className="w-4 h-4" />
                  FAQ
                </button>
              </div>

              {/* Filters panel */}
              {showFilters ? (
                <Card className="rounded-2xl" style={cardStyle}>
                  <CardContent className="p-4 space-y-3">
                    <div className="text-xs font-semibold" style={{ color: "rgba(229,231,235,0.70)" }}>Type</div>
                    <div className="flex flex-wrap items-center gap-2">
                      {["All", "Stop Request", "Jobsite Edit", "User Update", "Report"].map((t) =>(
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
                      {["All", "Open", "In Progress", "Insufficient", "Closed"].map((st) =>(
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

              {debug ? (
                <div className="mt-2 text-xs" style={{ color: "rgba(229,231,235,0.60)" }}>
                  debug roles: {roleStrings.join(" | ") || "(none found)"}
                </div>
              ) : null}
            </div>

            {/* Lanes */}
            <Card className="rounded-2xl" style={cardStyle}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white">Lanes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {[
                  { label: "Stop Requests", icon: <ClipboardList className="w-5 h-5" />, href: routes.stopRequests },
                  { label: "Jobsite Edit Requests", icon: <Pencil className="w-5 h-5" />, href: routes.jobsiteEditRequests },
                  { label: "User Update Requests", icon: <User className="w-5 h-5" />, href: routes.userUpdateRequests },
                  { label: "Reports", icon: <FileText className="w-5 h-5" />, href: routes.reports },
                ].map((x, i) =>(
                  <div key={x.label}>
                    <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-xl" style={{ color: "rgba(229,231,235,0.88)" }} onClick={() => nav(x.href)}>
                      {x.icon}
                      {x.label}
                      <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "rgba(0,233,239,0.95)" }} />
                    </Button>
                    {i !== 3 ? <div className="h-px" style={{ background: "rgba(255,255,255,0.08)" }} /> : null}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Queue list */}
            <Card className="rounded-2xl" style={cardStyle}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white">Review Queue</CardTitle>
              </CardHeader>

              <CardContent className="pt-0 p-0">
                {filtered.length ? (
                  <div>
                    {filtered.slice(0, 40).map((item, idx) => {
                      const type = normalizeType(pick(item, ["Type", "Request_Type", "Item_Type"]));
                      const st = normalizeStatus(pick(item, ["Status", "Queue_Status", "Review_Status"]));

                      const title =
                        toText(pick(item, ["Title", "Subject", "Summary"])) ||
                        toText(pick(item, ["Jobsite_Name", "Site_Name"])) ||
                        type;

                      const meta1 = toText(
                        pick(item, ["Reporter_Name", "Employee_Name", "Worker_Name", "Login_Email", "Reporter_Email", "Worker_Email"])
                      );
                      const meta2 = toText(pick(item, ["Jobsite_Name", "Site_Name", "Address", "Jobsite_Address"]));
                      const when = toText(pick(item, ["Created_At", "Submitted_At", "Date", "Timestamp"]));

                      const isLast = idx === Math.min(filtered.length, 40) - 1;
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
