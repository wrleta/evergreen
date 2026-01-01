import { useMemo, useState, type CSSProperties } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Filter,
  Plus,
  ChevronRight,
  AlertCircle,
  Search,
  Download,
  Info,
  Home,
  Calendar,
  User,
  Bell,
  FileText,
  Shield,
} from "lucide-react";

/**
 * REPORTS / REPORTES (Worker+)
 * Updates per chat history:
 * - Banner matches newest format (FIELD REPORTING SYSTEM + avatar, no Home in banner)
 * - Remove redundant "SYSTEM" label above title
 * - Title uses new bilingual formatting: "Reports | reportes"
 * - Removed "History | historial" (was not a button)
 * - Nav row is: Filter + Home + Today + FAQ (equidistant)
 * - Keep "(all)" gray (lowercase), but Filter is not faded vs others
 * - One-card list w/ divider rows (no nested cards)
 */
export default function Block(props: any) {
  const user = useCurrentUser();

  // Accept whatever Softr passes (reports / records / items)
  const reports = Array.isArray(props?.reports)
    ? props.reports
    : Array.isArray(props?.records)
    ? props.records
    : Array.isArray(props?.items)
    ? props.items
    : [];

  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"" | "Pending" | "Reported" | "Insufficient">("");

  // 🔧 Align these slugs to your Softr pages
  const routes = {
    home: "/home",
    today: "/today",
    faq: "/faq",
    reportsNew: "/reports",
    reportDetail: "/reports",
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

  const userEmail = useMemo(() => toText((user as any)?.email).toLowerCase(), [user]);

  const displayName = useMemo(() => {
    const name = toText((user as any)?.name || (user as any)?.fullName);
    if (name) return name;
    const em = toText((user as any)?.email);
    return em ? em.split("@")[0] : "Field Employee";
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
    if (v.includes("processing")) return "Processing";
    return "Pending";
  };

  // ---------- VISUAL (match newest pages) ----------
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

  const chipStyle = (kind: "reported" | "insufficient" | "pending" | "total") => {
    if (kind === "reported")
      return {
        background: "rgba(16,185,129,0.14)",
        border: "1px solid rgba(16,185,129,0.28)",
        color: "rgba(16,185,129,0.95)",
      };
    if (kind === "insufficient")
      return {
        background: "rgba(239,68,68,0.12)",
        border: "1px solid rgba(239,68,68,0.26)",
        color: "rgba(239,68,68,0.95)",
      };
    if (kind === "pending")
      return {
        background: "rgba(251,191,36,0.12)",
        border: "1px solid rgba(251,191,36,0.24)",
        color: "rgba(251,191,36,0.95)",
      };
    return {
      background: "rgba(0,233,239,0.12)",
      border: "1px solid rgba(0,233,239,0.22)",
      color: "rgba(0,233,239,0.95)",
    };
  };

  const allReports = Array.isArray(reports) ? reports : [];

  // If Softr didn’t filter by user, try to do it safely here
  const myReports = useMemo(() => {
    if (!userEmail) return allReports;

    const emailKeys = ["Login_Email", "Worker_Email", "Email", "User_Email", "Reporter_Email"];
    return allReports.filter((r: any) => {
      const em = toText(pick(r, emailKeys)).toLowerCase();
      return em ? em === userEmail : true; // keep blanks (won't hide legacy rows)
    });
  }, [allReports, userEmail]);

  const getDateMs = (r: any) => {
    const d = pick(r, ["Submitted_At", "Created_At", "Report_Date", "Date", "Timestamp"]);
    const t = Date.parse(toText(d));
    return Number.isFinite(t) ? t : 0;
  };

  const sorted = useMemo(() => {
    const arr = [...myReports];
    arr.sort((a, b) => getDateMs(b) - getDateMs(a));
    return arr;
  }, [myReports]);

  const counts = useMemo(() => {
    let pending = 0;
    let insufficient = 0;
    let reported = 0;

    for (const r of sorted) {
      const st = normalizeStatus(pick(r, ["Status", "Report_Status"]));
      if (st === "Reported") reported++;
      else if (st === "Insufficient") insufficient++;
      else pending++;
    }

    return { total: sorted.length, pending, insufficient, reported };
  }, [sorted]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return sorted.filter((r: any) => {
      const jobsite = toText(
        pick(r, ["Jobsite_Name", "Site_Name", "Jobsite", "Site"])
      ).toLowerCase();
      const type = toText(pick(r, ["Report_Type", "Type", "Category"])).toLowerCase();
      const when = toText(
        pick(r, ["Submitted_At", "Created_At", "Report_Date", "Date", "Timestamp"])
      ).toLowerCase();
      const notes = toText(pick(r, ["Summary", "Notes", "Body", "Message"])).toLowerCase();

      const st = normalizeStatus(pick(r, ["Status", "Report_Status"]));
      const statusOk = statusFilter ? st === statusFilter : true;

      const queryOk = !qq
        ? true
        : jobsite.includes(qq) || type.includes(qq) || when.includes(qq) || notes.includes(qq);

      return statusOk && queryOk;
    });
  }, [sorted, q, statusFilter]);

  const openNewReport = (mode: string) =>
    nav(`${routes.reportsNew}?mode=${encodeURIComponent(mode)}`);

  const openDetail = (r: any) => {
    const id = toText(pick(r, ["id", "ID", "Report_ID", "__ROW_NUMBER__"]));
    if (id) return nav(`${routes.reportDetail}?id=${encodeURIComponent(id)}`);

    const jobsiteId = toText(pick(r, ["Jobsite_ID", "Site_ID"]));
    const when = toText(pick(r, ["Submitted_At", "Created_At", "Report_Date", "Date"]));
    nav(
      `${routes.reportDetail}?jobsiteId=${encodeURIComponent(jobsiteId)}&date=${encodeURIComponent(when)}`
    );
  };

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
            </div>
          </div>
          <div style={accentLine} />
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-10">
          <div className="flex flex-col items-center justify-center text-center">
            <FileText
              className="w-20 h-20"
              style={{
                color: "rgba(0,233,239,0.55)",
                filter: "drop-shadow(0 0 12px rgba(0,233,239,0.30))",
              }}
            />
            <div className="mt-5 text-sm" style={{ color: "rgba(229,231,235,0.75)" }}>
              Please log in to view reports.
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
      {/* Banner (NEW format, no Home button here) */}
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

      <main
        className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 space-y-5"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        {/* Title strip (NEW format; no "History" line) */}
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-2xl font-extrabold leading-tight truncate">
                Reports <span style={thinGray}>|</span>{" "}
                <span style={thinGray}>reportes</span>
              </div>
            </div>

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
          </div>

          {/* Search row */}
          <div className="pt-2">
            <div
              className="flex items-center gap-2 rounded-xl px-3 h-11 w-full"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <Search className="w-4 h-4" style={{ color: "rgba(229,231,235,0.65)" }} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search jobsite / type / notes…"
                className="w-full bg-transparent outline-none text-sm"
                style={{ color: "rgba(229,231,235,0.92)" }}
              />
            </div>
          </div>

          {/* Count chips BELOW search */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("total")}>
              Total: {counts.total}
            </span>
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

          {/* Nav row: Filter + Home + Today + FAQ (equidistant) */}
          <div className="grid grid-cols-4 items-center" style={{ paddingTop: 10, gap: 8 }}>
            <button
              style={linkBtn}
              onClick={() => setShowFilters((v) => !v)}
              onMouseEnter={(e) =>(e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) =>(e.currentTarget.style.textDecoration = "none")}
            >
              <Filter className="w-4 h-4" />
              <span style={{ fontWeight: 800 }}>
                Filter{" "}
                <span style={thinGray}>(
                  {statusFilter ? statusFilter.toLowerCase() : "all"}
                  )
                </span>
              </span>
            </button>

            <button
              style={{ ...linkBtn, justifySelf: "center" as any }}
              onClick={() => nav(routes.reports)}
              onMouseEnter={(e) =>(e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) =>(e.currentTarget.style.textDecoration = "none")}
            >
              <FileText className="w-4 h-4" />
              Reports
            </button>

            <button
              style={{ ...linkBtn, justifySelf: "center" as any }}
              onClick={() => nav(routes.today)}
              onMouseEnter={(e) =>(e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) =>(e.currentTarget.style.textDecoration = "none")}
            >
              <Calendar className="w-4 h-4" />
              Today
            </button>

            <button
              style={{ ...linkBtn, justifySelf: "end" as any }}
              onClick={() => nav(routes.faq)}
              onMouseEnter={(e) =>(e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) =>(e.currentTarget.style.textDecoration = "none")}
            >
              <Info className="w-4 h-4" />
              FAQ
            </button>
          </div>

          {/* Filters panel */}
          {showFilters ? (
            <Card className="rounded-2xl" style={cardStyle}>
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {(["", "Pending", "Reported", "Insufficient"] as const).map((st) =>(
                    <button
                      key={st || "all"}
                      className="px-3 py-2 rounded-xl text-xs font-semibold"
                      onClick={() => setStatusFilter(st)}
                      style={{
                        background:
                          statusFilter === st ? "rgba(0,233,239,0.14)" : "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        color:
                          statusFilter === st ? "rgba(0,233,239,0.95)" : "rgba(229,231,235,0.82)",
                      }}
                    >
                      {st ? st.toLowerCase() : "all"}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Reports list (ONE card, divider rows) */}
        <Card className="rounded-2xl" style={cardStyle}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">
              Recent reports <span style={thinGray}>|</span>{" "}
              <span style={thinGray}>recientes</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-0">
            {filtered.length ? (
              <div>
                {filtered.slice(0, 40).map((r: any, idx: number) => {
                  const jobsite =
                    toText(pick(r, ["Jobsite_Name", "Site_Name", "Jobsite", "Site"])) || "Report";
                  const when = toText(
                    pick(r, ["Submitted_At", "Created_At", "Report_Date", "Date", "Timestamp"])
                  );
                  const type = toText(pick(r, ["Report_Type", "Type", "Category"])) || "Field";
                  const st = normalizeStatus(pick(r, ["Status", "Report_Status"]));

                  const isLast = idx === Math.min(filtered.length, 40) - 1;

                  const badge =
                    st === "Reported"
                      ? chipStyle("reported")
                      : st === "Insufficient"
                      ? chipStyle("insufficient")
                      : st === "Pending"
                      ? chipStyle("pending")
                      : {
                          background: "rgba(0,233,239,0.10)",
                          border: "1px solid rgba(0,233,239,0.18)",
                          color: "rgba(0,233,239,0.90)",
                        };

                  return (
                    <div
                      key={toText(pick(r, ["id", "ID", "Report_ID", "__ROW_NUMBER__"])) || idx}
                      className="py-3"
                      style={{
                        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        className="flex items-center justify-between gap-3 cursor-pointer"
                        onClick={() => openDetail(r)}
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate text-white">{jobsite}</div>
                          <div className="text-xs mt-1 truncate" style={{ color: "rgba(229,231,235,0.60)" }}>
                            {when ? when : "—"} • {type}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold" style={badge}>
                            {st}
                          </span>

                          {st === "Reported" ? (
                            <Button
                              variant="ghost"
                              className="h-9 w-9 p-0"
                              style={{ color: "rgba(0,233,239,0.95)" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: wire download/attachments later
                              }}
                              aria-label="Download"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          ) : null}

                          <ChevronRight className="w-4 h-4" style={{ color: "rgba(229,231,235,0.55)" }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 px-6">
                <FileText
                  className="w-20 h-20 mx-auto mb-3"
                  style={{
                    color: "rgba(0,233,239,0.55)",
                    filter: "drop-shadow(0 0 18px rgba(0,233,239,0.12))",
                  }}
                />
                <div className="text-sm text-white">No reports yet</div>
                <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.65)" }}>
                  Create your first report to get started.
                </div>

                <Button
                  className="mt-6 gap-2 h-11 rounded-xl font-semibold"
                  style={{ background: "rgba(0,233,239,0.95)", color: "#0b1020" }}
                  onClick={() => openNewReport("general")}
                >
                  <Plus className="w-4 h-4" />
                  New report
                </Button>
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