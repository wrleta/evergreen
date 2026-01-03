import { useMemo } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Plus,
  ChevronRight,
  AlertCircle,
  Home,
  Info,
  User,
  Calendar,
  Filter,
  Shield,
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
    home: "/home",
    today: "/today",
    faq: "/faq",
    jobsiteEditRequestsNew: "/jobsite-edit-requests", // adjust if you have a dedicated "new" page
    officeReview: "/office-review",
    profile: "/profile",
  };

  const logoUrl = ""; // optional
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
    if (v.includes("approved")) return "Approved";
    if (v.includes("rejected") || v.includes("denied")) return "Rejected";
    if (v.includes("closed") || v.includes("done") || v.includes("resolved")) return "Closed";
    if (v.includes("in progress") || v.includes("working") || v.includes("triage")) return "In Progress";
    if (v.includes("insufficient") || v.includes("need") || v.includes("info")) return "Insufficient";
    return "Open";
  };

  const chipStyle = (kind: string) => {
    if (kind === "approved")
      return { background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.26)", color: "rgba(16,185,129,0.95)" };
    if (kind === "rejected" || kind === "insufficient")
      return { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.26)", color: "rgba(239,68,68,0.95)" };
    if (kind === "inprogress")
      return { background: "rgba(0,233,239,0.12)", border: "1px solid rgba(0,233,239,0.22)", color: "rgba(0,233,239,0.95)" };
    if (kind === "open")
      return { background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.24)", color: "rgba(251,191,36,0.95)" };
    if (kind === "closed")
      return { background: "rgba(229,231,235,0.08)", border: "1px solid rgba(229,231,235,0.14)", color: "rgba(229,231,235,0.72)" };
    // total/neutral
    return { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(229,231,235,0.90)" };
  };

  // Worker safety filter (so chips reflect “their” rows if Softr over-shares)
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

  const counts = useMemo(() => {
    const rows = Array.isArray(visible) ? visible : [];
    let total = rows.length,
      open = 0,
      inProgress = 0,
      insufficient = 0,
      approved = 0,
      rejected = 0,
      closed = 0;

    for (const r of rows) {
      const st = normalizeStatus(pick(r, ["Status", "Request_Status"]));
      if (st === "Approved") approved++;
      else if (st === "Rejected") rejected++;
      else if (st === "Closed") closed++;
      else if (st === "Insufficient") insufficient++;
      else if (st === "In Progress") inProgress++;
      else open++;
    }

    return { total, open, inProgress, insufficient, approved, rejected, closed };
  }, [visible]);

  const scrollToFilters = () => {
    try {
      const el = document.getElementById("jobsite-edit-requests-filters");
      if (el) return el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.location.hash = "jobsite-edit-requests-filters";
    } catch (e) {}
  };

  // ---------- VISUAL (content-height; Softr/app handles bg) ----------
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

  const debug =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1";

  // Not logged in
  if (!user) {
    return (
      <div style={{ color: "#E5E7EB" }}>
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
                  <div style={{ marginTop: 6, height: 1, width: 180, background: "linear-gradient(90deg, rgba(0,233,239,0.25), rgba(255,255,255,0.00))", opacity: 0.9 }} />
                </div>
              </div>
            </div>
          </div>
          <div style={accentLine} />
        </header>

        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6" style={{ paddingTop: 12, paddingBottom: 12 }}>
          <Card className="rounded-2xl" style={cardStyle}>
            <CardContent className="py-12 text-center">
              <Pencil className="w-20 h-20 mx-auto" style={{ color: "rgba(0,233,239,0.55)" }} />
              <div className="mt-4 text-sm" style={{ color: "rgba(229,231,235,0.75)" }}>
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
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ color: "#E5E7EB" }}>
      {/* Banner (ONLY in Block A) */}
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
                onClick={() => nav(routes.profile)}
              >
                {user?.avatarUrl ? <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" /> : <User className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        <div style={accentLine} />
      </header>

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6" style={{ paddingTop: 12, paddingBottom: 12 }}>
        {/* Title */}
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

            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}>
              <Pencil className="w-5 h-5" style={{ color: "rgba(0,233,239,0.95)" }} />
            </div>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("total")}>Total: {counts.total}</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("open")}>Open: {counts.open}</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("inprogress")}>In Progress: {counts.inProgress}</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("insufficient")}>Insufficient: {counts.insufficient}</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("approved")}>Approved: {counts.approved}</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("rejected")}>Rejected: {counts.rejected}</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("closed")}>Closed: {counts.closed}</span>
          </div>

          {/* Nav row (4-col): Filter / Home / Today / FAQ */}
          <div className="grid grid-cols-4 items-center" style={{ paddingTop: 10, gap: 8 }}>
            <button style={linkBtn} onClick={scrollToFilters}>
              <Filter className="w-4 h-4" />
              <span style={{ fontWeight: 800 }}>
                Filter <span style={thinGray}>(all)</span>
              </span>
            </button>

            <button style={{ ...linkBtn, justifySelf: "center" }} onClick={() => nav(routes.home)}>
              <Home className="w-4 h-4" />
              Home
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
        </div>

        {/* Actions */}
        <Card className="rounded-2xl mt-4" style={cardStyle}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">Actions</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            {!isOffice ? (
              <Button
                className="w-full justify-start gap-3 h-12 rounded-xl font-semibold"
                style={{ background: "rgba(0,233,239,0.12)", color: "rgba(0,233,239,0.95)", border: "1px solid rgba(0,233,239,0.20)" }}
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
                <Shield className="w-5 h-5" />
                Office Review Queue
                <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "rgba(0,233,239,0.95)" }} />
              </Button>
            )}

            <div className="text-xs" style={thinGray}>
              Search + status filters + list are in the next block.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}