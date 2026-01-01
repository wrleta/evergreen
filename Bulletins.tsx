import { useMemo, useState } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Filter,
  ChevronRight,
  Home,
  Info,
  CheckCircle2,
  Calendar,
  User,
  FileText,
  Shield
} from "lucide-react";

/**
 * BULLETINS / BOLETINES (Reporter+)
 * Updates per your latest notes:
 * - Removed "Updates | avisos"
 * - Pills moved UNDER the main title
 * - Filter label simplified to: Filter (all)  (no newest/oldest shown)
 * - Keeps Spanish-muted = italic rule where used
 * - Banner + nav row match newest format
 */
export default function Block(props) {
  const user = useCurrentUser();

  // Accept whatever Softr passes (bulletins / records / items)
  const bulletins = Array.isArray(props?.bulletins)
    ? props.bulletins
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
    bulletinDetail: "/bulletins",
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
    return em ? em.split("@")[0] : "Field Reporter";
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

  const normalizeRead = (b) => {
    const v = toText(
      pick(b, ["Is_Read", "Read", "Read_Status", "Bulletin_Read", "Has_Read", "Read_Flag"])
    )
      .toLowerCase()
      .trim();

    if (!v) return false;
    if (v === "true" || v === "yes" || v === "1" || v === "read") return true;
    if (v.includes("read")) return true;
    return false;
  };

  const getDateMs = (b) => {
    const d = pick(b, ["Published_At_Local", "Updated_At_Local", "Created_At_Local", "Start_At_Local", "Posted_At", "Created_At", "Date", "Timestamp"]);
    const t = Date.parse(toText(d));
    return Number.isFinite(t) ? t : 0;
  };

  const [showFilters, setShowFilters] = useState(false);
  const [readFilter, setReadFilter] = useState("all"); // all | unread | read
  const [sortDir, setSortDir] = useState("newest"); // still used internally, not displayed

  // ---------- VISUAL (match newest pages) ----------
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
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.00) 60%), #000",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  };

  const accentLine = {
    height: 2,
    background:
      "linear-gradient(90deg, rgba(0,233,239,0.95), rgba(0,233,239,0.25) 35%, rgba(251,191,36,0.22) 70%, rgba(251,191,36,0.70))",
    boxShadow:
      "0 0 0 1px rgba(255,255,255,0.04) inset, 0 6px 20px rgba(0,233,239,0.10)",
  };

  const cardStyle = {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
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

  const thinGray = {
    color: "rgba(229,231,235,0.55)",
    fontWeight: 500,
  };

  // Spanish when muted/gray => italic (per your rule)
  const esGray = {
    ...thinGray,
    fontStyle: "italic",
  };

  const clamp1 = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const chipStyle = (kind) => {
    if (kind === "unread")
      return {
        background: "rgba(251,191,36,0.12)",
        border: "1px solid rgba(251,191,36,0.24)",
        color: "rgba(251,191,36,0.95)",
      };
    if (kind === "total")
      return {
        background: "rgba(0,233,239,0.12)",
        border: "1px solid rgba(0,233,239,0.22)",
        color: "rgba(0,233,239,0.95)",
      };
    return {
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.10)",
      color: "rgba(229,231,235,0.85)",
    };
  };

  const chipBtn = (active) =>({
    padding: "8px 12px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 800,
    background: active ? "rgba(0,233,239,0.12)" : "rgba(255,255,255,0.03)",
    border: active ? "1px solid rgba(0,233,239,0.22)" : "1px solid rgba(255,255,255,0.10)",
    color: active ? "rgba(0,233,239,0.95)" : "rgba(229,231,235,0.82)",
    cursor: "pointer",
  });

  const sorted = useMemo(() => {
    const arr = Array.isArray(bulletins) ? [...bulletins] : [];
    arr.sort((a, b) => {
      const diff = getDateMs(b) - getDateMs(a);
      return sortDir === "newest" ? diff : -diff;
    });
    return arr;
  }, [bulletins, sortDir]);

  const filtered = useMemo(() => {
    if (readFilter === "unread") return sorted.filter((b) => !normalizeRead(b));
    if (readFilter === "read") return sorted.filter((b) => normalizeRead(b));
    return sorted;
  }, [sorted, readFilter]);

  const counts = useMemo(() => {
    let unread = 0;
    for (const b of sorted) if (!normalizeRead(b)) unread++;
    return { total: sorted.length, unread };
  }, [sorted]);

  const openDetail = (b) => {
    const id = toText(pick(b, ["id", "ID", "Bulletin_ID", "__ROW_NUMBER__"]));
    if (id) return nav(`${routes.bulletinDetail}?id=${encodeURIComponent(id)}`);

    const title = toText(pick(b, ["Title", "Title_EN", "Title_ES", "Bulletin_Title", "Subject", "Name"]));
    const when = toText(pick(b, ["Published_At_Local", "Updated_At_Local", "Created_At_Local", "Start_At_Local", "Posted_At", "Created_At", "Date", "Timestamp"]));
    nav(`${routes.bulletinDetail}?title=${encodeURIComponent(title)}&date=${encodeURIComponent(when)}`);
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
            <Bell
              className="w-20 h-20"
              style={{
                color: "rgba(0,233,239,0.55)",
                filter: "drop-shadow(0 0 12px rgba(0,233,239,0.30))",
              }}
            />
            <div className="mt-5 text-sm" style={{ color: "rgba(229,231,235,0.75)" }}>
              Please log in to view bulletins.
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
        className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 space-y-4"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        {/* Title strip */}
        <div className="space-y-2">
          <div className="min-w-0">
            <div className="text-2xl font-extrabold leading-tight truncate">
              Bulletins <span style={thinGray}>|</span>{" "}
              <span style={thinGray}>boletines</span>
            </div>
          </div>

          {/* Pills moved UNDER title */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("total")}>
              Total: {counts.total}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("unread")}>
              Unread: {counts.unread}
            </span>
          </div>

          {/* Nav row */}
          <div className="grid grid-cols-4 items-center" style={{ paddingTop: 10, gap: 8 }}>
            <button
              style={linkBtn}
              onClick={() => setShowFilters((v) => !v)}
              onMouseEnter={(e) =>(e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) =>(e.currentTarget.style.textDecoration = "none")}
            >
              <Filter className="w-4 h-4" />
              <span style={{ fontWeight: 800 }}>
                Filter <span style={thinGray}>(all)</span>
              </span>
            </button>

            <button
              style={{ ...linkBtn, justifySelf: "center" }}
              onClick={() => nav(routes.reports)}
              onMouseEnter={(e) =>(e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) =>(e.currentTarget.style.textDecoration = "none")}
            >
              <FileText className="w-4 h-4" />
              Reports
            </button>

            <button
              style={{ ...linkBtn, justifySelf: "center" }}
              onClick={() => nav(routes.today)}
              onMouseEnter={(e) =>(e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) =>(e.currentTarget.style.textDecoration = "none")}
            >
              <Calendar className="w-4 h-4" />
              Today
            </button>

            <button
              style={{ ...linkBtn, justifySelf: "end" }}
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
              <CardContent className="p-4 space-y-4">
                <div className="text-xs uppercase tracking-[0.18em]" style={thinGray}>
                  Read status <span style={thinGray}>|</span>{" "}
                  <span style={esGray}>lectura</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button style={chipBtn(readFilter === "all")} onClick={() => setReadFilter("all")}>
                    all
                  </button>
                  <button
                    style={chipBtn(readFilter === "unread")}
                    onClick={() => setReadFilter("unread")}
                  >
                    unread
                  </button>
                  <button style={chipBtn(readFilter === "read")} onClick={() => setReadFilter("read")}>
                    read
                  </button>
                </div>

                <div className="text-xs uppercase tracking-[0.18em]" style={thinGray}>
                  Sort <span style={thinGray}>|</span> <span style={esGray}>orden</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button style={chipBtn(sortDir === "newest")} onClick={() => setSortDir("newest")}>
                    newest
                  </button>
                  <button style={chipBtn(sortDir === "oldest")} onClick={() => setSortDir("oldest")}>
                    oldest
                  </button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* List (ONE card, divider rows) */}
        <Card className="rounded-2xl" style={cardStyle}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white truncate">
              Latest <span style={thinGray}>|</span> <span style={thinGray}>recientes</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-0">
            {filtered.length ? (
              <div>
                {filtered.slice(0, 40).map((b, idx) => {
                  const title =
                    toText(pick(b, ["Title", "Title_EN", "Title_ES", "Bulletin_Title", "Subject", "Name"])) ||
                    `Bulletin ${idx + 1}`;

                  const body = toText(pick(b, ["Text_Short", "Text_Short_EN", "Text_Short_ES", "Body_EN", "Body_ES", "Message", "Body", "Summary", "Content", "Text"]));
                  const when = toText(pick(b, ["Published_At_Local", "Updated_At_Local", "Created_At_Local", "Start_At_Local", "Posted_At", "Created_At", "Date", "Timestamp"]));
                  const unread = !normalizeRead(b);

                  const isLast = idx === Math.min(filtered.length, 40) - 1;
                  const key = toText(pick(b, ["id", "ID", "Bulletin_ID", "__ROW_NUMBER__"])) || idx;

                  return (
                    <div
                      key={key}
                      className="py-3"
                      style={{
                        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        className="flex items-start justify-between gap-3 cursor-pointer"
                        onClick={() => openDetail(b)}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="text-sm font-semibold truncate text-white"
                              style={{ opacity: unread ? 1 : 0.85 }}
                            >
                              {title}
                            </div>

                            {unread ? (
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{
                                  background: "rgba(0,233,239,0.12)",
                                  border: "1px solid rgba(0,233,239,0.22)",
                                  color: "rgba(0,233,239,0.95)",
                                }}
                              >
                                NEW
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-semibold"
                                style={{ color: "rgba(229,231,235,0.55)" }}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Read <span style={thinGray}>|</span>{" "}
                                <span style={esGray}>leído</span>
                              </span>
                            )}
                          </div>

                          <div className="text-xs mt-1 truncate" style={{ color: "rgba(229,231,235,0.60)" }}>
                            {when || "—"}
                          </div>

                          {body ? (
                            <div
                              className="text-sm mt-2"
                              style={{
                                color: "rgba(229,231,235,0.72)",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {body}
                            </div>
                          ) : null}
                        </div>

                        <ChevronRight className="w-5 h-5 mt-1" style={{ color: "rgba(0,233,239,0.95)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 px-6">
                <Bell
                  className="w-20 h-20 mx-auto mb-3"
                  style={{
                    color: "rgba(0,233,239,0.55)",
                    filter: "drop-shadow(0 0 18px rgba(0,233,239,0.12))",
                  }}
                />
                <div className="text-sm text-white">No bulletins yet</div>
                <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.65)" }}>
                  Updates will appear here.
                </div>
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