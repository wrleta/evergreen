import { useMemo, useState, type CSSProperties } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bell,
  Filter,
  ChevronRight,
  Info,
  CheckCircle2,
  Calendar,
  User,
  FileText,
} from "lucide-react";

export default function Block(props: any) {
  const user = useCurrentUser();

  const bulletins = Array.isArray(props?.bulletins)
    ? props.bulletins
    : Array.isArray(props?.records)
    ? props.records
    : Array.isArray(props?.items)
    ? props.items
    : [];

  const routes = {
    today: "/today",
    faq: "/faq",
    bulletinDetail: "/bulletins", // keep your current pattern (?id=...)
    reports: "/reports",
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

  const displayName = useMemo(() => {
    const name = toText((user as any)?.name || (user as any)?.fullName);
    if (name) return name;
    const em = toText((user as any)?.email);
    return em ? em.split("@")[0] : "Field Reporter";
  }, [user]);

  const normalizeRead = (b: any) => {
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

  const getDateMs = (b: any) => {
    const d = pick(b, [
      "Published_At_Local",
      "Updated_At_Local",
      "Created_At_Local",
      "Start_At_Local",
      "Posted_At",
      "Created_At",
      "Date",
      "Timestamp",
    ]);
    const t = Date.parse(toText(d));
    return Number.isFinite(t) ? t : 0;
  };

  const [showFilters, setShowFilters] = useState(false);
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
  const [sortDir, setSortDir] = useState<"newest" | "oldest">("newest"); // internal, not shown in Filter label

  const thinGray: CSSProperties = { color: "rgba(229,231,235,0.55)", fontWeight: 500 };
  const esGray: CSSProperties = { ...thinGray, fontStyle: "italic" };

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

  const chipStyle = (kind: "unread" | "total") => {
    if (kind === "unread")
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

  const chipBtn = (active: boolean): CSSProperties => ({
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

  const openDetail = (b: any) => {
    const id = toText(pick(b, ["id", "ID", "Bulletin_ID", "__ROW_NUMBER__"]));
    if (id) return nav(`${routes.bulletinDetail}?id=${encodeURIComponent(id)}`);

    const title = toText(
      pick(b, ["Title", "Title_EN", "Title_ES", "Bulletin_Title", "Subject", "Name"])
    );
    const when = toText(
      pick(b, [
        "Published_At_Local",
        "Updated_At_Local",
        "Created_At_Local",
        "Start_At_Local",
        "Posted_At",
        "Created_At",
        "Date",
        "Timestamp",
      ])
    );
    nav(`${routes.bulletinDetail}?title=${encodeURIComponent(title)}&date=${encodeURIComponent(when)}`);
  };

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 pt-6">
        <Card className="rounded-2xl" style={cardStyle}>
          <CardContent className="py-10 text-center" style={{ color: "#E5E7EB" }}>
            Please log in to view bulletins.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 pt-6 space-y-4" style={{ color: "#E5E7EB" }}>
      {/* Title strip */}
      <div className="space-y-2">
        <div className="min-w-0">
          <div className="text-2xl font-extrabold leading-tight truncate">
            Bulletins <span style={thinGray}>|</span> <span style={thinGray}>boletines</span>
          </div>
        </div>

        {/* Pills under title */}
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
          <button style={linkBtn} onClick={() => setShowFilters((v) => !v)}>
            <Filter className="w-4 h-4" />
            <span style={{ fontWeight: 800 }}>
              Filter <span style={thinGray}>(all)</span>
            </span>
          </button>

          <button style={{ ...linkBtn, justifySelf: "center" as any }} onClick={() => nav(routes.reports)}>
            <FileText className="w-4 h-4" />
            Reports
          </button>

          <button style={{ ...linkBtn, justifySelf: "center" as any }} onClick={() => nav(routes.today)}>
            <Calendar className="w-4 h-4" />
            Today
          </button>

          <button style={{ ...linkBtn, justifySelf: "end" as any }} onClick={() => nav(routes.faq)}>
            <Info className="w-4 h-4" />
            FAQ
          </button>
        </div>

        {/* Filters panel (kept here so it still controls the list) */}
        {showFilters ? (
          <Card className="rounded-2xl" style={cardStyle}>
            <CardContent className="p-4 space-y-4">
              <div className="text-xs uppercase tracking-[0.18em]" style={thinGray}>
                Read status <span style={thinGray}>|</span> <span style={esGray}>lectura</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button style={chipBtn(readFilter === "all")} onClick={() => setReadFilter("all")}>
                  all
                </button>
                <button style={chipBtn(readFilter === "unread")} onClick={() => setReadFilter("unread")}>
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

                const body = toText(
                  pick(b, [
                    "Text_Short",
                    "Text_Short_EN",
                    "Text_Short_ES",
                    "Body_EN",
                    "Body_ES",
                    "Message",
                    "Body",
                    "Summary",
                    "Content",
                    "Text",
                  ])
                );

                const when = toText(
                  pick(b, [
                    "Published_At_Local",
                    "Updated_At_Local",
                    "Created_At_Local",
                    "Start_At_Local",
                    "Posted_At",
                    "Created_At",
                    "Date",
                    "Timestamp",
                  ])
                );

                const unread = !normalizeRead(b);
                const isLast = idx === Math.min(filtered.length, 40) - 1;
                const key = toText(pick(b, ["id", "ID", "Bulletin_ID", "__ROW_NUMBER__"])) || String(idx);

                return (
                  <div
                    key={key}
                    className="py-3"
                    style={{ borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => openDetail(b)}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="text-sm font-semibold truncate text-white" style={{ opacity: unread ? 1 : 0.85 }}>
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
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: "rgba(229,231,235,0.55)" }}>
                              <CheckCircle2 className="w-3 h-3" />
                              Read <span style={thinGray}>|</span> <span style={esGray}>leído</span>
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
                style={{ color: "rgba(0,233,239,0.55)", filter: "drop-shadow(0 0 18px rgba(0,233,239,0.12))" }}
              />
              <div className="text-sm text-white">No bulletins yet</div>
              <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.65)" }}>
                Updates will appear here.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}