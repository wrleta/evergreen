import { useMemo, useState } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  Search,
  Filter,
  ChevronRight,
  Home,
  Calendar,
  FileText,
  Info,
  User,
  Bell,
  Shield,
} from "lucide-react";

/**
 * FAQ / AYUDA (Worker+ + Office+)
 * Intent:
 * - One-card list with divider rows (no nested card-in-card)
 * - Search + Category filter
 * - Bilingual display (Spanish muted => italic)
 * - Banner + pills + nav row aligned with your newest pages
 *
 * Slugs aligned to your app:
 * /home /today /stop-detail /reports /profile /bulletins /office-review
 * /stop-requests /jobsite-edit-requests /user-update-requests /faq
 */
export default function Block(props: any) {
  const user = useCurrentUser();
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [cat, setCat] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  // Accept whatever Softr passes (faq / records / items)
  const faqs = Array.isArray(props?.faq)
    ? props.faq
    : Array.isArray(props?.records)
    ? props.records
    : Array.isArray(props?.items)
    ? props.items
    : Array.isArray(props?.faqItems)
    ? props.faqItems
    : [];

  const routes = {
    home: "/home",
    today: "/today",
    reports: "/reports",
    profile: "/profile",
    bulletins: "/bulletins",
    officeReview: "/office-review",
    stopRequests: "/stop-requests",
    jobsiteEditRequests: "/jobsite-edit-requests",
    userUpdateRequests: "/user-update-requests",
    faq: "/faq",
  };

  const logoUrl = ""; // optional later
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

  const clamp1 = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  };

  const displayName = useMemo(() => {
    const name = toText((user as any)?.name || (user as any)?.fullName);
    if (name) return name;
    const em = toText((user as any)?.email);
    return em ? em.split("@")[0] : "Field Reporter";
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
    whiteSpace: "nowrap" as const,
  };

  const thinGray = {
    color: "rgba(229,231,235,0.55)",
    fontWeight: 500,
  };

  const esGray = {
    ...thinGray,
    fontStyle: "italic" as const,
  };

  const chipStyle = (kind: "total" | "cats") => {
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

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#E5E7EB",
  };

  const rowDivider = { borderTop: "1px solid rgba(255,255,255,0.08)" };

  // ---------- DATA ----------
  const normalized = useMemo(() => {
    const list = Array.isArray(faqs) ? faqs : [];
    return list
      .map((r: any) => {
        const id =
          toText(pick(r, ["FAQ_ID", "faq_id", "Softr_Record_ID", "🔐 Softr Record ID"])) ||
          toText(pick(r, ["id", "ID"])) ||
          `${Math.random()}`;

        const category = toText(pick(r, ["Category", "category"])) || "General";
        const qEN = toText(pick(r, ["Question_EN", "question_en", "Question"])) || "";
        const aEN = toText(pick(r, ["Answer_EN", "answer_en", "Answer"])) || "";
        const qES = toText(pick(r, ["Question_ES", "question_es"])) || "";
        const aES = toText(pick(r, ["Answer_ES", "answer_es"])) || "";

        const activeRaw = pick(r, ["Active", "active"]);
        const active = String(activeRaw).toLowerCase() !== "false" && String(activeRaw) !== "0";

        const sort = Number(pick(r, ["Sort_Order", "sort_order"])) || 9999;

        return { id, category, qEN, aEN, qES, aES, active, sort };
      })
      .filter((x) => x.active)
      .sort((a, b) => a.sort - b.sort || a.category.localeCompare(b.category));
  }, [faqs]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    normalized.forEach((x) => s.add(x.category));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [normalized]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return normalized.filter((x) => {
      const catOk = cat === "all" ? true : x.category === cat;
      if (!catOk) return false;
      if (!needle) return true;
      const blob = `${x.category} ${x.qEN} ${x.aEN} ${x.qES} ${x.aES}`.toLowerCase();
      return blob.includes(needle);
    });
  }, [normalized, q, cat]);

  const counts = useMemo(() => {
    return {
      total: normalized.length,
      cats: categories.length,
      showing: filtered.length,
    };
  }, [normalized.length, categories.length, filtered.length]);

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
            <HelpCircle
              className="w-20 h-20"
              style={{
                color: "rgba(0,233,239,0.55)",
                filter: "drop-shadow(0 0 12px rgba(0,233,239,0.30))",
              }}
            />
            <div className="mt-5 text-sm" style={{ color: "rgba(229,231,235,0.75)" }}>
              Please log in to view FAQ.
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
                onClick={() => nav(routes.profile)}
              >
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
        className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 space-y-4"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        {/* Title strip */}
        <div className="space-y-2">
          <div className="min-w-0">
            <div className="text-2xl font-extrabold leading-tight truncate">
              FAQ <span style={thinGray}>|</span> <span style={thinGray}>ayuda</span>
            </div>
          </div>

          {/* Pills under title */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("total")}>
              Total: {counts.total}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipStyle("cats")}>
              Categories: {counts.cats}
            </span>
          </div>

          {/* Search row */}
          <div className="flex gap-2 items-center pt-2">
            <div className="relative w-full">
              <Search
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "rgba(229,231,235,0.60)" }}
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search FAQ… / Buscar…"
                className="w-full h-11 rounded-xl pl-9 pr-3 text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Nav row (below pills) */}
          <div className="grid grid-cols-4 items-center" style={{ paddingTop: 10, gap: 8 }}>
            <button style={linkBtn} onClick={() => setShowFilters((v) => !v)}>
              <Filter className="w-4 h-4" />
              <span>
                Filter <span style={{ color: "rgba(229,231,235,0.55)", fontWeight: 500 }}>(all)</span>
              </span>
            </button>

            <button style={linkBtn} onClick={() => nav(routes.reports)}>
              <FileText className="w-4 h-4" />
              Reports
            </button>

            <button style={linkBtn} onClick={() => nav(routes.today)}>
              <Calendar className="w-4 h-4" />
              Today
            </button>

            <button style={linkBtn} onClick={() => nav(routes.faq)}>
              <Info className="w-4 h-4" />
              FAQ
            </button>
          </div>

          {/* Filter panel */}
          {showFilters ? (
            <Card style={cardStyle}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold" style={{ color: "rgba(229,231,235,0.88)" }}>
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl text-xs font-semibold"
                    style={{
                      background: cat === "all" ? "rgba(0,233,239,0.12)" : "rgba(255,255,255,0.03)",
                      border:
                        cat === "all"
                          ? "1px solid rgba(0,233,239,0.22)"
                          : "1px solid rgba(255,255,255,0.10)",
                      color: cat === "all" ? "rgba(0,233,239,0.95)" : "rgba(229,231,235,0.82)",
                    }}
                    onClick={() => setCat("all")}
                  >
                    All
                  </button>

                  {categories.map((c) =>(
                    <button
                      key={c}
                      type="button"
                      className="px-3 py-2 rounded-xl text-xs font-semibold"
                      style={{
                        background: cat === c ? "rgba(0,233,239,0.12)" : "rgba(255,255,255,0.03)",
                        border:
                          cat === c
                            ? "1px solid rgba(0,233,239,0.22)"
                            : "1px solid rgba(255,255,255,0.10)",
                        color: cat === c ? "rgba(0,233,239,0.95)" : "rgba(229,231,235,0.82)",
                      }}
                      onClick={() => setCat(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div className="mt-3 text-xs" style={{ color: "rgba(229,231,235,0.60)" }}>
                  Showing {counts.showing} item(s)
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* FAQ list */}
        <Card style={cardStyle}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold" style={{ color: "rgba(229,231,235,0.88)" }}>
              Help topics
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-0">
            {filtered.length === 0 ? (
              <div className="py-10 text-center">
                <Info
                  className="w-16 h-16 mx-auto"
                  style={{
                    color: "rgba(0,233,239,0.55)",
                    filter: "drop-shadow(0 0 12px rgba(0,233,239,0.22))",
                  }}
                />
                <div className="mt-4 text-sm" style={{ color: "rgba(229,231,235,0.70)" }}>
                  No FAQ matches that search.
                </div>
                <div className="mt-1 text-xs" style={{ color: "rgba(229,231,235,0.55)" }}>
                  Try a different keyword or clear filters.
                </div>

                <div className="mt-5 flex flex-wrap gap-2 justify-center">
                  <Button
                    className="h-10 rounded-xl font-semibold"
                    style={{ background: "rgba(0,233,239,0.95)", color: "#0b1020" }}
                    onClick={() => {
                      setQ("");
                      setCat("all");
                      setShowFilters(false);
                    }}
                  >
                    Clear
                  </Button>

                  <Button
                    variant="outline"
                    className="h-10 rounded-xl"
                    style={{
                      borderColor: "rgba(255,255,255,0.14)",
                      color: "rgba(229,231,235,0.85)",
                      background: "rgba(255,255,255,0.03)",
                    }}
                    onClick={() => nav(routes.stopRequests)}
                  >
                    Open Stop Request
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                {filtered.map((x, idx) => {
                  const isOpen = openId === x.id;
                  return (
                    <div key={x.id} className="py-4" style={idx === 0 ? {} : rowDivider}>
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => setOpenId(isOpen ? null : x.id)}
                        style={{ background: "transparent" }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{
                              background: "rgba(0,233,239,0.10)",
                              border: "1px solid rgba(0,233,239,0.16)",
                              color: "rgba(0,233,239,0.95)",
                            }}
                          >
                            <HelpCircle className="w-4 h-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                                style={{
                                  background: "rgba(255,255,255,0.03)",
                                  border: "1px solid rgba(255,255,255,0.10)",
                                  color: "rgba(229,231,235,0.82)",
                                }}
                              >
                                {x.category}
                              </span>
                              <span style={{ color: "rgba(229,231,235,0.50)", fontSize: 11 }}>
                                {isOpen ? "Hide" : "Open"}
                              </span>
                            </div>

                            <div className="mt-2 font-semibold" style={{ color: "rgba(229,231,235,0.92)" }}>
                              {x.qEN || "—"}
                            </div>

                            {x.qES ? (
                              <div className="mt-1 text-sm" style={esGray}>
                                {x.qES}
                              </div>
                            ) : null}
                          </div>

                          <ChevronRight
                            className="w-5 h-5 mt-2"
                            style={{
                              color: "rgba(229,231,235,0.55)",
                              transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                              transition: "transform 160ms ease",
                            }}
                          />
                        </div>
                      </button>

                      {isOpen ? (
                        <div className="mt-3 pl-12 space-y-2">
                          {x.aEN ? (
                            <div className="text-sm" style={{ color: "rgba(229,231,235,0.80)", lineHeight: 1.55 }}>
                              {x.aEN}
                            </div>
                          ) : null}

                          {x.aES ? (
                            <div className="text-sm" style={{ ...esGray, lineHeight: 1.55 }}>
                              {x.aES}
                            </div>
                          ) : null}

                          <div className="pt-2 flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              className="h-9 rounded-xl"
                              style={{
                                borderColor: "rgba(255,255,255,0.14)",
                                color: "rgba(229,231,235,0.85)",
                                background: "rgba(255,255,255,0.03)",
                              }}
                              onClick={() => nav(routes.stopRequests)}
                            >
                              Stop Request
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>

                            <Button
                              variant="outline"
                              className="h-9 rounded-xl"
                              style={{
                                borderColor: "rgba(255,255,255,0.14)",
                                color: "rgba(229,231,235,0.85)",
                                background: "rgba(255,255,255,0.03)",
                              }}
                              onClick={() => nav(routes.jobsiteEditRequests)}
                            >
                              Jobsite Edit
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>

                            <Button
                              variant="outline"
                              className="h-9 rounded-xl"
                              style={{
                                borderColor: "rgba(255,255,255,0.14)",
                                color: "rgba(229,231,235,0.85)",
                                background: "rgba(255,255,255,0.03)",
                              }}
                              onClick={() => nav(routes.userUpdateRequests)}
                            >
                              User Update
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>

                            {isOffice ? (
                              <Button
                                variant="outline"
                                className="h-9 rounded-xl"
                                style={{
                                  borderColor: "rgba(251,191,36,0.26)",
                                  color: "rgba(251,191,36,0.92)",
                                  background: "rgba(251,191,36,0.10)",
                                }}
                                onClick={() => nav(routes.officeReview)}
                              >
                                Office Review
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
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
