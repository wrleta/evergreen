import { useMemo } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  User as UserIcon,
  ClipboardList,
  Pencil,
  FileText,
  Calendar,
  Info,
  Home,
  ChevronRight,
} from "lucide-react";

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
    home: "/home",
    today: "/today",
    faq: "/faq",
    reports: "/reports",
    profile: "/profile",
    stopRequests: "/stop-requests",
    jobsiteEditRequests: "/jobsite-edit-requests",
    userUpdateRequests: "/user-update-requests",
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

  const displayName = useMemo(() => {
    const name = toText(user?.name || user?.fullName);
    if (name) return name;
    const em = toText(user?.email);
    return em ? em.split("@")[0] : "Reporter";
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
    add(user?.UserGroup);
    add(user?.userGroup);
    add(user?.Role);
    add(user?.role);
    add(user?.Auth_Level);
    add(user?.auth_level);
    add(user?.group);
    add(user?.group_name);
    add(user?.groups);
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

  const normalizeStatus = (raw: any) => {
    const v = toText(raw).toLowerCase();
    if (!v) return "Open";
    if (v.includes("closed") || v.includes("done") || v.includes("resolved")) return "Closed";
    if (v.includes("in progress") || v.includes("working") || v.includes("assigned")) return "In Progress";
    if (v.includes("insufficient") || v.includes("follow") || v.includes("need")) return "Insufficient";
    return "Open";
  };

  const chipStyle = (kind: "total" | "open" | "inprogress" | "insufficient" | "closed") => {
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

  const counts = useMemo(() => {
    const rows = Array.isArray(queue) ? queue : [];
    let total = rows.length, open = 0, inProgress = 0, insufficient = 0, closed = 0;
    for (const item of rows) {
      const st = normalizeStatus(pick(item, ["Status", "Queue_Status", "Review_Status"]));
      if (st === "Closed") closed++;
      else if (st === "Insufficient") insufficient++;
      else if (st === "In Progress") inProgress++;
      else open++;
    }
    return { total, open, inProgress, insufficient, closed };
  }, [queue]);

  // ---------- VISUAL (no full-page bg here; Softr/app provides it) ----------
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
    whiteSpace: "nowrap" as const,
  };

  const thinGray = { color: "rgba(229,231,235,0.55)", fontWeight: 500 };

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
    <div style={{ color: "#E5E7EB" }}>
      {/* Banner (ONLY in Block A) */}
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
                {user?.avatarUrl ? <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        <div style={accentLine} />
      </header>

      {/* Content-height wrapper */}
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6" style={{ paddingTop: 12, paddingBottom: 12 }}>
        {/* Title + chips */}
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

          <div className="flex flex-wrap gap-2 pt-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("total")}>Total: {counts.total}</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("open")}>Open: {counts.open}</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("inprogress")}>In Progress: {counts.inProgress}</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("insufficient")}>Insufficient: {counts.insufficient}</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("closed")}>Closed: {counts.closed}</span>
          </div>

          {/* Nav row (no filter toggle here; filters live in Block B) */}
          <div className="grid grid-cols-4 items-center" style={{ paddingTop: 10, gap: 8 }}>
            <button style={linkBtn} onClick={() => nav(routes.home)}>
              <Home className="w-4 h-4" />
              <span style={{ fontWeight: 800 }}>Home</span>
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
        </div>

        {/* Lanes */}
        <Card className="rounded-2xl mt-4" style={cardStyle}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">Lanes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              { label: "Stop Requests", icon: <ClipboardList className="w-5 h-5" />, href: routes.stopRequests },
              { label: "Jobsite Edit Requests", icon: <Pencil className="w-5 h-5" />, href: routes.jobsiteEditRequests },
              { label: "User Update Requests", icon: <UserIcon className="w-5 h-5" />, href: routes.userUpdateRequests },
              { label: "Reports", icon: <FileText className="w-5 h-5" />, href: routes.reports },
            ].map((x, i) => (
              <div key={x.label}>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 rounded-xl"
                  style={{ color: "rgba(229,231,235,0.88)" }}
                  onClick={() => nav(x.href)}
                >
                  {x.icon}
                  {x.label}
                  <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "rgba(0,233,239,0.95)" }} />
                </Button>
                {i !== 3 ? <div className="h-px" style={{ background: "rgba(255,255,255,0.08)" }} /> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="mt-2 text-xs" style={thinGray}>
          List + filters are in the next block.
        </div>
      </div>
    </div>
  );
}