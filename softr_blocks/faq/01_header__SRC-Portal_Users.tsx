import { useMemo } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, Home, Calendar, Info, User as UserIcon, Filter } from "lucide-react";

export default function Block(props: any) {
  const user = useCurrentUser();

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
    faq: "/faq",
    profile: "/profile",
  };

  const logoUrl = ""; // optional later
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

  const displayName = useMemo(() => {
    const name = toText((user as any)?.name || (user as any)?.fullName);
    if (name) return name;
    const em = toText((user as any)?.email);
    return em ? em.split("@")[0] : "Field Reporter";
  }, [user]);

  // counts (recomputed in Block B too — ok, blocks don’t share state)
  const counts = useMemo(() => {
    const list = Array.isArray(faqs) ? faqs : [];
    const normalized = list
      .map((r: any) => {
        const activeRaw = pick(r, ["Active", "active"]);
        const active = String(activeRaw).toLowerCase() !== "false" && String(activeRaw) !== "0";
        const category = toText(pick(r, ["Category", "category"])) || "General";
        return { active, category };
      })
      .filter((x) => x.active);

    const cats = new Set<string>();
    normalized.forEach((x) => cats.add(x.category));

    return { total: normalized.length, cats: cats.size };
  }, [faqs]);

  const scrollToFilters = () => {
    try {
      const el = document.getElementById("faq-filters");
      if (el) return el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.location.hash = "faq-filters";
    } catch (e) {}
  };

  // visuals (content-height only)
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
  const esGray = { ...thinGray, fontStyle: "italic" as const };

  const chipTotal = {
    background: "rgba(0,233,239,0.12)",
    border: "1px solid rgba(0,233,239,0.22)",
    color: "rgba(0,233,239,0.95)",
  } as const;

  const chipMuted = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "rgba(229,231,235,0.85)",
  } as const;

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
              <HelpCircle className="w-20 h-20 mx-auto" style={{ color: "rgba(0,233,239,0.55)" }} />
              <div className="mt-4 text-sm" style={{ color: "rgba(229,231,235,0.75)" }}>
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
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ color: "#E5E7EB" }}>
      {/* Banner ONLY here (Block A) */}
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
                {(user as any)?.avatarUrl ? (
                  <img src={(user as any).avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div style={accentLine} />
      </header>

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6" style={{ paddingTop: 12, paddingBottom: 12 }}>
        {/* Title + pills */}
        <div className="space-y-2">
          <div className="min-w-0">
            <div className="text-2xl font-extrabold leading-tight truncate">
              FAQ <span style={thinGray}>|</span> <span style={esGray}>ayuda</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipTotal}>
              Total: {counts.total}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={chipMuted}>
              Categories: {counts.cats}
            </span>
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

          <div className="text-xs" style={thinGray}>
            Search + category filters + topics are in the next block.
          </div>
        </div>
      </div>
    </div>
  );
}