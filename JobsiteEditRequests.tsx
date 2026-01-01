import { useMemo, useState } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Filter,
  Plus,
  ChevronRight,
  AlertCircle,
  Search,
  Home,
  Info,
  MapPin,
  User,
  Pencil,
  Calendar,
  Bell,
  FileText,
  Shield,
} from "lucide-react";

/**
 * JOBSITE EDIT REQUESTS (Worker+ + Office+)
 * New standard (aligned to latest pages):
 * - Banner matches newest pages (no Home in banner)
 * - Shared bg/banner/accentLine/cardStyle/linkBtn/thinGray
 * - Nav row is 4-col grid: Filter (all) / Home / Today / FAQ
 * - Status naming aligned to: Open / In Progress / Insufficient / Approved / Rejected / Closed
 */
export default function Block(props: any) {
  const user = useCurrentUser();

  // Accept whatever Softr passes (requests / records / items)
  const requests = Array.isArray(props?.requests)
    ? props.requests
    : Array.isArray(props?.records)
    ? props.records
    : Array.isArray(props?.items)
    ? props.items
    : [];

  // 🔧 Align to your Softr slugs
  const routes = {
    home: "/home",
    today: "/today",
    faq: "/faq",
    jobsiteEditRequestsNew: "/jobsite-edit-requests",
    jobsiteEditRequestsDetail: "/jobsite-edit-requests", // Portal_Jobsite_Edit_Requests details
    officeReview: "/office-review",
    reports: "/reports",
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

  const userEmail = useMemo(() => toText(user?.email).toLowerCase(), [user]);

  const displayName = useMemo(() => {
    const name = toText(user?.name || user?.fullName);
    if (name) return name;
    const em = toText(user?.email);
    return em ? em.split("@")[0] : "Field User";
  }, [user]);

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
    const raw =
      user?.UserGroup ??
      user?.userGroup ??
      user?.Role ??
      user?.role ??
      user?.Auth_Level ??
      user?.auth_level ??
      user?.fields?.UserGroup ??
      user?.fields?.Role ??
      user?.fields?.Auth_Level;

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
    if (!v) return "Open";
    if (v.includes("approved")) return "Approved";
    if (v.includes("rejected") || v.includes("denied")) return "Rejected";
    if (v.includes("closed") || v.includes("done") || v.includes("resolved")) return "Closed";
    if (v.includes("in progress") || v.includes("working") || v.includes("triage")) return "In Progress";
    if (v.includes("insufficient") || v.includes("need") || v.includes("info")) return "Insufficient";
    return "Open";
  };

  const chipStyle = (kind: string) => {
    if (kind === "approved")
      return {
        background: "rgba(16,185,129,0.12)",
        border: "1px solid rgba(16,185,129,0.26)",
        color: "rgba(16,185,129,0.95)",
      };
    if (kind === "rejected")
      return {
        background: "rgba(239,68,68,0.12)",
        border: "1px solid rgba(239,68,68,0.26)",
        color: "rgba(239,68,68,0.95)",
      };
    if (kind === "insufficient")
      return {
        background: "rgba(239,68,68,0.12)",
        border: "1px solid rgba(239,68,68,0.26)",
        color: "rgba(239,68,68,0.95)",
      };
    if (kind === "inprogress")
      return {
        background: "rgba(0,233,239,0.12)",
        border: "1px solid rgba(0,233,239,0.22)",
        color: "rgba(0,233,239,0.95)",
      };
    if (kind === "open")
      return {
        background: "rgba(251,191,36,0.12)",
        border: "1px solid rgba(251,191,36,0.24)",
        color: "rgba(251,191,36,0.95)",
      };
    if (kind === "closed")
      return {
        background: "rgba(229,231,235,0.08)",
        border: "1px solid rgba(229,231,235,0.14)",
        color: "rgba(229,231,235,0.72)",
      };
    return {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.10)",
      color: "rgba(229,231,235,0.90)",
    };
  };

  const badgeStyleForStatus = (st: string) => {
    if (st === "Approved") return chipStyle("approved");
    if (st === "Rejected") return chipStyle("rejected");
    if (st === "Closed") return chipStyle("closed");
    if (st === "Insufficient") return chipStyle("insufficient");
    if (st === "In Progress") return chipStyle("inprogress");
    return chipStyle("open");
  };

  // UI controls
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"All" | "Open" | "In Progress" | "Insufficient" | "Approved" | "Rejected" | "Closed">("All");

  // Worker safety filter if Softr accidentally passes all rows
  const visible = useMemo(() => {
    const all = Array.isArray(requests) ? requests : [];
    if (isOffice) return all;
    if (!userEmail) return all;

    const emailKeys = ["Login_Email", "Worker_Email", "Email", "User_Email", "Requester_Email"];
    return all.filter((r: any) => {
      const em = toText(pick(r, emailKeys)).toLowerCase();
      return em ? em === userEmail : true; // keep blanks (legacy)
    });
  }, [requests, isOffice, userEmail]);

  const getDateMs = (r: any) => {
    const d = pick(r, ["Submitted_At", "Created_At", "Request_Date", "Date", "Timestamp"]);
    const t = Date.parse(toText(d));
    return Number.isFinite(t) ? t : 0;
  };

  const sorted = useMemo(() => {
    const arr = [...visible];
    arr.sort((a, b) => getDateMs(b) - getDateMs(a));
    return arr;
  }, [visible]);

  const counts = useMemo(() => {
    let total = sorted.length;
    let open = 0;
    let inProgress = 0;
    let insufficient = 0;
    let approved = 0;
    let rejected = 0;
    let closed = 0;

    for (const r of sorted) {
      const st = normalizeStatus(pick(r, ["Status", "Request_Status"]));
      if (st === "Approved") approved++;
      else if (st === "Rejected") rejected++;
      else if (st === "Closed") closed++;
      else if (st === "Insufficient") insufficient++;
      else if (st === "In Progress") inProgress++;
      else open++;
    }

    return { total, open, inProgress, insufficient, approved, rejected, closed };
  }, [sorted]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return sorted.filter((r: any) => {
      const st = normalizeStatus(pick(r, ["Status", "Request_Status"]));
      if (statusFilter !== "All" && st !== statusFilter) return false;
      if (!qq) return true;

      const jobsite = toText(pick(r, ["Jobsite_Name", "Site_Name", "Jobsite", "Site"]));
      const addr = toText(pick(r, ["Jobsite_Address", "Address"]));
      const jobsiteId = toText(pick(r, ["Jobsite_ID", "Site_ID"]));
      const when = toText(pick(r, ["Submitted_At", "Created_At", "Request_Date", "Date", "Timestamp"]));
      const changes = toText(pick(r, ["Requested_Changes", "Changes", "Notes", "Message", "Details"]));
      const worker = toText(pick(r, ["Worker_Name", "Employee_Name", "Name", "Login_Email", "Email"]));

      const hay = `${jobsite} ${addr} ${jobsiteId} ${when} ${changes} ${st} ${isOffice ? worker : ""}`.toLowerCase();
      return hay.includes(qq);
    });
  }, [sorted, q, statusFilter, isOffice]);

  const openDetail = (r: any) => {
    const id = toText(pick(r, ["id", "ID", "Request_ID", "Jobsite_Edit_Request_ID", "__ROW_NUMBER__"]));
    if (id) return nav(`${routes.jobsiteEditRequestsDetail}?id=${encodeURIComponent(id)}`);

    const jobsiteId = toText(pick(r, ["Jobsite_ID", "Site_ID"]));
    const when = toText(pick(r, ["Submitted_At", "Created_At", "Request_Date", "Date"]));
    nav(`${routes.jobsiteEditRequestsDetail}?jobsiteId=${encodeURIComponent(jobsiteId)}&date=${encodeURIComponent(when)}`);
  };

  const debug =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1";

  // ---------- VISUAL (match newest pages) ----------
  const bg = {
    background:
      "radial-gradient(900px 520px at 18% -12%, rgba(0,233,239,0.14), transparent 62%)," +
      "radial-gradient(900px 520px at 88% -6%, rgba(251,191,36,0.10), transparent 60%)," +
      "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.00) 30%)," +
      "#0B1020",
    color: "#E5E7EB",
    minHeight: "100vh",
  } as const;

  const banner = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.00) 60%), #000",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  } as const;

  const accentLine = {
    height: 2,
    background:
      "linear-gradient(90deg, rgba(0,233,239,0.95), rgba(0,233,239,0.25) 35%, rgba(251,191,36,0.22) 70%, rgba(251,191,36,0.70))",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 6px 20px rgba(0,233,239,0.10)",
  } as const;

  const cardStyle = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 52px rgba(0,0,0,0.40)",
    backdropFilter: "blur(8px)",
  } as const;

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
  } as const;

  const thinGray = { color: "rgba(229,231,235,0.55)", fontWeight: 500 } as const;

  const hoverOn = (e: any) =>(e.currentTarget.style.textDecoration = "underline");
  const hoverOff = (e: any) =>(e.currentTarget.style.textDecoration = "none");

  const filterParen = useMemo(() => {
    if (statusFilter === "All") return "all";
    return String(statusFilter).toLowerCase();
  }, [statusFilter]);

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
                  <div
                    className="text-[12px] uppercase tracking-[0.22em] leading-tight"
                    style={{ color: "rgba(229,231,235,0.86)" }}
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
            </div>
          </div>
          <div style={accentLine} />
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-10">
          <div className="flex flex-col items-center justify-center text-center">
            <Pencil
              className="w-20 h-20"
              style={{
                color: "rgba(0,233,239,0.55)",
                filter: "drop-shadow(0 0 12px rgba(0,233,239,0.30))",
              }}
            />
            <div className="mt-5 text-sm" style={{ color: "rgba(229,231,235,0.75)" }}>
              Please log in to view jobsite edit requests.
            </div>

            <Button
              className="mt-6 h-11 rounded-xl font-semibold"
              style={{ background: "rgba(0,233,239,0.95)", color: "#0b1020" }}
              onClick={() => nav(routes.home)}
            >
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
      {/* Banner (NEW format, no Home here) */}
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
                <div
                  className="text-[12px] uppercase tracking-[0.22em] leading-tight"
                  style={{ color: "rgba(229,231,235,0.86)" }}
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
               onClick={() => nav(routes.profile)}>
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
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
        {/* Title + Search + Pills + Nav row */}
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-2xl font-extrabold leading-tight truncate text-white">Jobsite Edit Requests</div>
              <div className="text-sm font-semibold" style={{ color: "rgba(229,231,235,0.72)" }}>
                Suggested corrections (address, access, notes, contacts)
              </div>

              {debug ? (
                <div className="mt-2 text-xs" style={{ color: "rgba(229,231,235,0.60)" }}>
                  debug roles: {roleStrings.join(" | ") || "(none found)"}
                </div>
              ) : null}
            </div>

            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}
              title="Jobsite Edit Requests"
            >
              <Pencil className="w-5 h-5" style={{ color: "rgba(0,233,239,0.95)" }} />
            </div>
          </div>

          {/* Search */}
          <div className="pt-2">
            <div
              className="flex items-center gap-2 rounded-xl px-3 h-11 w-full"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}
            >
              <Search className="w-4 h-4" style={{ color: "rgba(229,231,235,0.65)" }} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={isOffice ? "Search… (site / reporter / changes / date)" : "Search… (site / changes / date)"}
                className="w-full bg-transparent outline-none text-sm"
                style={{ color: "rgba(229,231,235,0.92)" }}
              />
            </div>
          </div>

          {/* Count chips */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("total")}>
              Total: {counts.total}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("open")}>
              Open: {counts.open}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("inprogress")}>
              In Progress: {counts.inProgress}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("insufficient")}>
              Insufficient: {counts.insufficient}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("approved")}>
              Approved: {counts.approved}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("rejected")}>
              Rejected: {counts.rejected}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("closed")}>
              Closed: {counts.closed}
            </span>
          </div>

          {/* Nav row (4-col) */}
          <div className="grid grid-cols-4 items-center" style={{ paddingTop: 10, gap: 8 }}>
            <button
              style={linkBtn}
              onClick={() => setShowFilters((v) => !v)}
              onMouseEnter={hoverOn}
              onMouseLeave={hoverOff}
            >
              <Filter className="w-4 h-4" />
              <span style={{ fontWeight: 800 }}>
                Filter <span style={thinGray}>({filterParen})</span>
              </span>
            </button>

            <button
              style={{ ...linkBtn, justifySelf: "center" }}
              onClick={() => nav(routes.reports)}
              onMouseEnter={hoverOn}
              onMouseLeave={hoverOff}
            >
              <FileText className="w-4 h-4" />
              Reports
            </button>

            <button
              style={{ ...linkBtn, justifySelf: "center" }}
              onClick={() => nav(routes.today)}
              onMouseEnter={hoverOn}
              onMouseLeave={hoverOff}
            >
              <Calendar className="w-4 h-4" />
              Today
            </button>

            <button
              style={{ ...linkBtn, justifySelf: "end" }}
              onClick={() => nav(routes.faq)}
              onMouseEnter={hoverOn}
              onMouseLeave={hoverOff}
            >
              <Info className="w-4 h-4" />
              FAQ
            </button>
          </div>

          {/* Filters panel */}
          {showFilters ? (
            <Card className="rounded-2xl" style={cardStyle}>
              <CardContent className="p-4 space-y-3">
                <div className="text-xs font-semibold" style={{ color: "rgba(229,231,235,0.70)" }}>
                  Status
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(["All", "Open", "In Progress", "Insufficient", "Approved", "Rejected", "Closed"] as const).map(
                    (st) =>(
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
                    )
                  )}

                  {(statusFilter !== "All" || q.trim()) ? (
                    <button
                      className="px-3 py-2 rounded-xl text-xs font-semibold ml-auto"
                      onClick={() => {
                        setStatusFilter("All");
                        setQ("");
                      }}
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        color: "rgba(229,231,235,0.82)",
                      }}
                    >
                      Reset
                    </button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Actions */}
        <Card className="rounded-2xl" style={cardStyle}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">Actions</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            {!isOffice ? (
              <Button
                className="w-full justify-start gap-3 h-12 rounded-xl font-semibold"
                style={{
                  background: "rgba(0,233,239,0.12)",
                  color: "rgba(0,233,239,0.95)",
                  border: "1px solid rgba(0,233,239,0.20)",
                }}
                onClick={() => nav(routes.jobsiteEditRequestsNew)}
              >
                <Plus className="w-5 h-5" />
                New Jobsite Edit Request
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 rounded-xl"
                style={{ color: "rgba(229,231,235,0.88)" }}
                onClick={() => nav(routes.officeReview)}
              >
                <AlertCircle className="w-5 h-5" />
                Office Review Queue
                <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "rgba(0,233,239,0.95)" }} />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* List (ONE card, divider rows) */}
        <Card className="rounded-2xl" style={cardStyle}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">Requests</CardTitle>
          </CardHeader>

          <CardContent className="pt-0 p-0">
            {filtered.length ? (
              <div>
                {filtered.slice(0, 40).map((r: any, idx: number) => {
                  const jobsite = toText(pick(r, ["Jobsite_Name", "Site_Name", "Jobsite", "Site"])) || "Jobsite";
                  const addr = toText(pick(r, ["Jobsite_Address", "Address"]));
                  const jobsiteId = toText(pick(r, ["Jobsite_ID", "Site_ID"]));
                  const when =
                    toText(pick(r, ["Submitted_At", "Created_At", "Request_Date", "Date", "Timestamp"])) || "—";
                  const changes = toText(pick(r, ["Requested_Changes", "Changes", "Notes", "Message", "Details"]));
                  const st = normalizeStatus(pick(r, ["Status", "Request_Status"]));

                  const workerName =
                    toText(pick(r, ["Worker_Name", "Employee_Name", "Name"])) ||
                    toText(pick(r, ["Login_Email", "Email"])) ||
                    "—";

                  const isLast = idx === Math.min(filtered.length, 40) - 1;
                  const key =
                    toText(pick(r, ["id", "ID", "Request_ID", "Jobsite_Edit_Request_ID", "__ROW_NUMBER__"])) ||
                    String(idx);

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

                            {jobsiteId ? (
                              <span
                                className="px-2 py-1 rounded-full text-[10px] font-semibold"
                                style={{
                                  background: "rgba(0,233,239,0.10)",
                                  border: "1px solid rgba(0,233,239,0.18)",
                                  color: "rgba(0,233,239,0.90)",
                                }}
                              >
                                {jobsiteId}
                              </span>
                            ) : null}

                            <span
                              className="px-3 py-1 rounded-full text-xs font-semibold"
                              style={badgeStyleForStatus(st)}
                            >
                              {st}
                            </span>
                          </div>

                          <div className="text-xs mt-1 truncate" style={{ color: "rgba(229,231,235,0.60)" }}>
                            {when}
                          </div>

                          <div className="flex flex-wrap gap-3 mt-2">
                            {addr ? (
                              <span
                                className="inline-flex items-center gap-1 text-xs truncate"
                                style={{ color: "rgba(229,231,235,0.70)" }}
                              >
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="truncate">{addr}</span>
                              </span>
                            ) : null}

                            {isOffice ? (
                              <span
                                className="inline-flex items-center gap-1 text-xs truncate"
                                style={{ color: "rgba(229,231,235,0.70)" }}
                              >
                                <User className="w-3.5 h-3.5" />
                                <span className="truncate">{workerName}</span>
                              </span>
                            ) : null}
                          </div>

                          {changes ? (
                            <div className="text-sm mt-2 line-clamp-2" style={{ color: "rgba(229,231,235,0.78)" }}>
                              {changes}
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
                <Building2
                  className="w-20 h-20 mx-auto mb-3"
                  style={{
                    color: "rgba(0,233,239,0.55)",
                    filter: "drop-shadow(0 0 18px rgba(0,233,239,0.12))",
                  }}
                />
                <div className="text-sm text-white">No jobsite edit requests yet</div>
                <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.65)" }}>
                  Submit corrections when jobsite details are wrong.
                </div>

                {!isOffice ? (
                  <Button
                    className="mt-6 gap-2 h-11 rounded-xl font-semibold"
                    style={{ background: "rgba(0,233,239,0.95)", color: "#0b1020" }}
                    onClick={() => nav(routes.jobsiteEditRequestsNew)}
                  >
                    <Plus className="w-4 h-4" />
                    New Request
                  </Button>
                ) : null}
              </div>
            )}
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