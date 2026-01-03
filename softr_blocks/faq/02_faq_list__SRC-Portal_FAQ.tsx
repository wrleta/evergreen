import { useMemo, useState } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, Search, Filter, ChevronRight, Info } from "lucide-react";

export default function Block(props: any) {
  const user = useCurrentUser();
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [cat, setCat] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);

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
    stopRequests: "/stop-requests",
    jobsiteEditRequests: "/jobsite-edit-requests",
    userUpdateRequests: "/user-update-requests",
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

  const roleStrings = useMemo(() => {
    const vals = [
      (user as any)?.UserGroup,
      (user as any)?.userGroup,
      (user as any)?.Role,
      (user as any)?.role,
      (user as any)?.Auth_Level,
      (user as any)?.auth_level,
      (user as any)?.fields?.UserGroup,
      (user as any)?.fields?.Role,
      (user as any)?.fields?.Auth_Level,
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

  const thinGray = { color: "rgba(229,231,235,0.55)", fontWeight: 500 } as const;
  const esGray = { ...thinGray, fontStyle: "italic" as const };

  const cardStyle = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 52px rgba(0,0,0,0.40)",
    backdropFilter: "blur(8px)",
  } as const;

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#E5E7EB",
  } as const;

  const rowDivider = { borderTop: "1px solid rgba(255,255,255,0.08)" } as const;

  const filterParen = useMemo(() => (cat === "all" ? "all" : String(cat).toLowerCase()), [cat]);

  const normalized = useMemo(() => {
    const list = Array.isArray(faqs) ? faqs : [];
    return list
      .map((r: any, i: number) => {
        const id =
          toText(pick(r, ["FAQ_ID", "faq_id", "Softr_Record_ID", "🔐 Softr Record ID"])) ||
          toText(pick(r, ["id", "ID"])) ||
          String(i);

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

  if (!user) return null;

  return (
    <div
      id="faq-filters"
      className="mx-auto w-full max-w-5xl px-4 sm:px-6"
      style={{ paddingTop: 12, paddingBottom: 12, color: "#E5E7EB" }}
    >
      {/* Search */}
      <div className="space-y-3">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(229,231,235,0.60)" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search FAQ… / Buscar…"
            className="w-full h-11 rounded-xl pl-9 pr-3 text-sm outline-none"
            style={inputStyle}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          style={{
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
          }}
        >
          <Filter className="w-4 h-4" />
          <span>
            Filter <span style={thinGray}>({filterParen})</span>
          </span>
        </button>

        {/* Categories panel */}
        {showFilters ? (
          <Card className="rounded-2xl" style={cardStyle}>
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
                    border: cat === "all" ? "1px solid rgba(0,233,239,0.22)" : "1px solid rgba(255,255,255,0.10)",
                    color: cat === "all" ? "rgba(0,233,239,0.95)" : "rgba(229,231,235,0.82)",
                  }}
                  onClick={() => setCat("all")}
                >
                  All
                </button>

                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="px-3 py-2 rounded-xl text-xs font-semibold"
                    style={{
                      background: cat === c ? "rgba(0,233,239,0.12)" : "rgba(255,255,255,0.03)",
                      border: cat === c ? "1px solid rgba(0,233,239,0.22)" : "1px solid rgba(255,255,255,0.10)",
                      color: cat === c ? "rgba(0,233,239,0.95)" : "rgba(229,231,235,0.82)",
                    }}
                    onClick={() => setCat(c)}
                  >
                    {c}
                  </button>
                ))}

                {(cat !== "all" || q.trim()) ? (
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl text-xs font-semibold ml-auto"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(229,231,235,0.82)" }}
                    onClick={() => {
                      setCat("all");
                      setQ("");
                      setOpenId(null);
                    }}
                  >
                    Reset
                  </button>
                ) : null}
              </div>

              <div className="mt-3 text-xs" style={{ color: "rgba(229,231,235,0.60)" }}>
                Showing {filtered.length} item(s)
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* One-card list with divider rows */}
      <Card className="rounded-2xl mt-4" style={cardStyle}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold" style={{ color: "rgba(229,231,235,0.88)" }}>
            Help topics
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0 p-0">
          {filtered.length === 0 ? (
            <div className="py-10 text-center px-6">
              <Info className="w-16 h-16 mx-auto" style={{ color: "rgba(0,233,239,0.55)", filter: "drop-shadow(0 0 12px rgba(0,233,239,0.22))" }} />
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
                    setOpenId(null);
                  }}
                >
                  Clear
                </Button>

                <Button
                  variant="outline"
                  className="h-10 rounded-xl"
                  style={{ borderColor: "rgba(255,255,255,0.14)", color: "rgba(229,231,235,0.85)", background: "rgba(255,255,255,0.03)" }}
                  onClick={() => nav(routes.stopRequests)}
                >
                  Open Stop Request
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {filtered.map((x, idx) => {
                const isOpen = openId === x.id;
                const isLast = idx === filtered.length - 1;

                return (
                  <div key={x.id} className="px-4 py-4" style={{ borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.08)" }}>
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => setOpenId(isOpen ? null : x.id)}
                      style={{ background: "transparent" }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: "rgba(0,233,239,0.10)", border: "1px solid rgba(0,233,239,0.16)", color: "rgba(0,233,239,0.95)" }}
                        >
                          <HelpCircle className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(229,231,235,0.82)" }}
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
                            style={{ borderColor: "rgba(255,255,255,0.14)", color: "rgba(229,231,235,0.85)", background: "rgba(255,255,255,0.03)" }}
                            onClick={() => nav(routes.stopRequests)}
                          >
                            Stop Request
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>

                          <Button
                            variant="outline"
                            className="h-9 rounded-xl"
                            style={{ borderColor: "rgba(255,255,255,0.14)", color: "rgba(229,231,235,0.85)", background: "rgba(255,255,255,0.03)" }}
                            onClick={() => nav(routes.jobsiteEditRequests)}
                          >
                            Jobsite Edit
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>

                          <Button
                            variant="outline"
                            className="h-9 rounded-xl"
                            style={{ borderColor: "rgba(255,255,255,0.14)", color: "rgba(229,231,235,0.85)", background: "rgba(255,255,255,0.03)" }}
                            onClick={() => nav(routes.userUpdateRequests)}
                          >
                            User Update
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>

                          {isOffice ? (
                            <Button
                              variant="outline"
                              className="h-9 rounded-xl"
                              style={{ borderColor: "rgba(251,191,36,0.26)", color: "rgba(251,191,36,0.92)", background: "rgba(251,191,36,0.10)" }}
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
    </div>
  );
}