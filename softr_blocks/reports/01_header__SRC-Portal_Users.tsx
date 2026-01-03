import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent } from "@/components/ui/card";
import { Filter, Search, Home, Calendar, Info, User } from "lucide-react";

type StatusFilter = "" | "Pending" | "Reported" | "Insufficient";
const FILTER_EVENT = "rk:reportsFiltersChanged";

export default function Block(props: any) {
  const user = useCurrentUser();

  const reports = Array.isArray(props?.reports)
    ? props.reports
    : Array.isArray(props?.records)
    ? props.records
    : Array.isArray(props?.items)
    ? props.items
    : [];

  const routes = {
    home: "/home",
    today: "/today",
    faq: "/faq",
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
    const em = toText((user as any)?.email);
    return em ? em.split("@")[0] : "Field Employee";
  }, [user]);

  const roleStrings = useMemo(() => {
    const out: string[] = [];
    const add = (v: any) => {
      if (!v) return;
      if (Array.isArray(v)) v.forEach(add);
      else if (typeof v === "object") {
        if (v?.name) out.push(String(v.name));
        if (v?.title) out.push(String(v.title));
      } else out.push(String(v));
    };
    add((user as any)?.UserGroup);
    add((user as any)?.userGroup);
    add((user as any)?.Role);
    add((user as any)?.role);
    add((user as any)?.Auth_Level);
    add((user as any)?.auth_level);
    add((user as any)?.groups);
    try {
      const w: any = typeof window !== "undefined" ? window : null;
      const lu = w?.logged_in_user;
      add(lu?.UserGroup);
      add(lu?.Role);
      add(lu?.Auth_Level);
      add(lu?.groups);
    } catch {}
    return out.filter(Boolean);
  }, [user]);

  const isOffice = useMemo(() => {
    const val = roleStrings.join(" ").toLowerCase();
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
    if (!v) return "Pending";
    if (v.includes("insufficient") || v.includes("follow") || v.includes("need")) return "Insufficient";
    if (v.includes("reported") || v.includes("complete") || v.includes("done") || v.includes("submitted"))
      return "Reported";
    if (v.includes("processing")) return "Processing";
    return "Pending";
  };

  // ---- URL filter sync (so Block B/C can read) ----
  const readUrlFilters = () => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const q = sp.get("q") || "";
      const st = (sp.get("st") || "") as StatusFilter;
      const statusFilter: StatusFilter = st === "Pending" || st === "Reported" || st === "Insufficient" ? st : "";
      return { q, statusFilter };
    } catch {
      return { q: "", statusFilter: "" as StatusFilter };
    }
  };

  const writeUrlFilters = (next: { q: string; statusFilter: StatusFilter }) => {
    try {
      const url = new URL(window.location.href);
      if (next.q) url.searchParams.set("q", next.q);
      else url.searchParams.delete("q");
      if (next.statusFilter) url.searchParams.set("st", next.statusFilter);
      else url.searchParams.delete("st");
      window.history.replaceState({}, "", url.toString());
      window.dispatchEvent(new Event(FILTER_EVENT));
    } catch {}
  };

  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");

  useEffect(() => {
    const f = readUrlFilters();
    setQ(f.q);
    setStatusFilter(f.statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    writeUrlFilters({ q, statusFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, statusFilter]);

  // ---- counts (on MY reports; Softr should already filter, but we guard) ----
  const myReports = useMemo(() => {
    const all = Array.isArray(reports) ? reports : [];
    if (!userEmail) return all;
    const emailKeys = ["Login_Email", "Worker_Email", "Email", "User_Email", "Reporter_Email"];
    return all.filter((r: any) => {
      const em = toText(pick(r, emailKeys)).toLowerCase();
      return em ? em === userEmail : true;
    });
  }, [reports, userEmail]);

  const getDateMs = (r: any) => {
    const d = pick(r, [
      "Submitted_At_Local",
      "Last_Updated_At_Local",
      "Manifest_Date",
      "Submitted_At",
      "Created_At",
      "Report_Date",
      "Date",
      "Timestamp",
    ]);
    const t = Date.parse(toText(d));
    return Number.isFinite(t) ? t : 0;
  };

  const sorted = useMemo(() => [...myReports].sort((a, b) => getDateMs(b) - getDateMs(a)), [myReports]);

  const counts = useMemo(() => {
    let pending = 0,
      insufficient = 0,
      reported = 0;
    for (const r of sorted) {
      const st = normalizeStatus(pick(r, ["Status", "Report_Status"]));
      if (st === "Reported") reported++;
      else if (st === "Insufficient") insufficient++;
      else pending++;
    }
    return { total: sorted.length, pending, insufficient, reported };
  }, [sorted]);

  // ---- visuals (NO page bg / NO min-h-screen; Softr handles spacing) ----
  const banner: CSSProperties = {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.00) 60%), #000",
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

  const thinGray: CSSProperties = { color: "rgba(229,231,235,0.55)", fontWeight: 500 };
  const clamp1: CSSProperties = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

  const chipStyle = (kind: "reported" | "insufficient" | "pending" | "total") => {
    if (kind === "reported")
      return { background: "rgba(16,185,129,0.14)", border: "1px solid rgba(16,185,129,0.28)", color: "rgba(16,185,129,0.95)" };
    if (kind === "insufficient")
      return { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.26)", color: "rgba(239,68,68,0.95)" };
    if (kind === "pending")
      return { background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.24)", color: "rgba(251,191,36,0.95)" };
    return { background: "rgba(0,233,239,0.12)", border: "1px solid rgba(0,233,239,0.22)", color: "rgba(0,233,239,0.95)" };
  };

  if (!user) {
    return (
      <div className="w-full">
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
                  <div className="text-[12px] uppercase tracking-[0.22em] leading-tight" style={{ color: "rgba(229,231,235,0.86)", ...clamp1 }}>
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

        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6" style={{ paddingTop: 14, paddingBottom: 12 }}>
          <div className="text-sm" style={{ color: "rgba(229,231,235,0.75)" }}>
            Please log in to view reports.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Banner ONLY here (Block A) */}
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
                <div className="text-[12px] uppercase tracking-[0.22em] leading-tight" style={{ color: "rgba(229,231,235,0.86)", ...clamp1 }}>
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
        <div style={accentLine} />
      </header>

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6" style={{ paddingTop: 14, paddingBottom: 12 }}>
        {/* Title */}
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-2xl font-extrabold leading-tight truncate">
                Reports <span style={thinGray}>|</span> <span style={thinGray}>reportes</span>
              </div>
            </div>

            {isOffice ? (
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: "rgba(251,191,36,0.14)", border: "1px solid rgba(251,191,36,0.28)", color: "rgba(251,191,36,0.95)" }}
              >
                Office+
              </span>
            ) : null}
          </div>

          {/* Search */}
          <div className="pt-2">
            <div className="flex items-center gap-2 rounded-xl px-3 h-11 w-full" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
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

          {/* Chips */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("total")}>Total: {counts.total}</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("reported")}>Reported: {counts.reported}</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("pending")}>Pending: {counts.pending}</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("insufficient")}>Follow-up: {counts.insufficient}</span>
          </div>

          {/* Nav row: Filter + Home + Today + FAQ */}
          <div className="grid grid-cols-4 items-center" style={{ paddingTop: 10, gap: 8 }}>
            <button style={linkBtn} onClick={() => setShowFilters((v) => !v)}>
              <Filter className="w-4 h-4" />
              <span style={{ fontWeight: 800 }}>
                Filter <span style={thinGray}>({statusFilter ? statusFilter.toLowerCase() : "all"})</span>
              </span>
            </button>

            <button style={{ ...linkBtn, justifySelf: "center" as any }} onClick={() => nav(routes.home)}>
              <Home className="w-4 h-4" /> Home
            </button>

            <button style={{ ...linkBtn, justifySelf: "center" as any }} onClick={() => nav(routes.today)}>
              <Calendar className="w-4 h-4" /> Today
            </button>

            <button style={{ ...linkBtn, justifySelf: "end" as any }} onClick={() => nav(routes.faq)}>
              <Info className="w-4 h-4" /> FAQ
            </button>
          </div>

          {/* Filters panel */}
          {showFilters ? (
            <Card className="rounded-2xl" style={cardStyle}>
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {(["", "Pending", "Reported", "Insufficient"] as const).map((st) => (
                    <button
                      key={st || "all"}
                      className="px-3 py-2 rounded-xl text-xs font-semibold"
                      onClick={() => setStatusFilter(st as StatusFilter)}
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
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}