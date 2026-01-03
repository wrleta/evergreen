import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ChevronRight, Download, Plus } from "lucide-react";

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
    reportsNew: "/reports",
    reportDetail: "/reports",
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

  const normalizeStatus = (raw: any) => {
    const v = toText(raw).toLowerCase();
    if (!v) return "Pending";
    if (v.includes("insufficient") || v.includes("follow") || v.includes("need")) return "Insufficient";
    if (v.includes("reported") || v.includes("complete") || v.includes("done") || v.includes("submitted"))
      return "Reported";
    if (v.includes("processing")) return "Processing";
    return "Pending";
  };

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

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");

  useEffect(() => {
    const sync = () => {
      const f = readUrlFilters();
      setQ(f.q);
      setStatusFilter(f.statusFilter);
    };
    sync();
    window.addEventListener(FILTER_EVENT, sync as any);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener(FILTER_EVENT, sync as any);
      window.removeEventListener("popstate", sync);
    };
  }, []);

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

  const sorted = useMemo(() => {
    const arr = [...(Array.isArray(reports) ? reports : [])];
    arr.sort((a, b) => getDateMs(b) - getDateMs(a));
    return arr;
  }, [reports]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return sorted.filter((r: any) => {
      const jobsite = toText(pick(r, ["Jobsite_Name", "Site_Name", "Jobsite", "Site"])).toLowerCase();
      const type = toText(pick(r, ["Report_Type", "Type", "Category"])).toLowerCase();
      const when = toText(
        pick(r, ["Submitted_At_Local", "Last_Updated_At_Local", "Manifest_Date", "Submitted_At", "Created_At", "Report_Date", "Date", "Timestamp"])
      ).toLowerCase();
      const notes = toText(
        pick(r, ["Summary_EN", "Report_Text_EN", "Report_Text_Original", "Action_Items_Text", "Office_Notes", "Office_Status", "Summary", "Notes", "Body", "Message"])
      ).toLowerCase();

      const st = normalizeStatus(pick(r, ["Status", "Report_Status"]));
      const statusOk = statusFilter ? st === statusFilter : true;
      const queryOk = !qq ? true : jobsite.includes(qq) || type.includes(qq) || when.includes(qq) || notes.includes(qq);
      return statusOk && queryOk;
    });
  }, [sorted, q, statusFilter]);

  const cardStyle: CSSProperties = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 52px rgba(0,0,0,0.40)",
    backdropFilter: "blur(8px)",
  };

  const thinGray: CSSProperties = { color: "rgba(229,231,235,0.55)", fontWeight: 500 };

  const chipStyle = (kind: "reported" | "insufficient" | "pending" | "total") => {
    if (kind === "reported")
      return { background: "rgba(16,185,129,0.14)", border: "1px solid rgba(16,185,129,0.28)", color: "rgba(16,185,129,0.95)" };
    if (kind === "insufficient")
      return { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.26)", color: "rgba(239,68,68,0.95)" };
    if (kind === "pending")
      return { background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.24)", color: "rgba(251,191,36,0.95)" };
    return { background: "rgba(0,233,239,0.12)", border: "1px solid rgba(0,233,239,0.22)", color: "rgba(0,233,239,0.95)" };
  };

  const openNewReport = (mode: string) => nav(`${routes.reportsNew}?mode=${encodeURIComponent(mode)}`);

  const openDetail = (r: any) => {
    const id = toText(pick(r, ["id", "ID", "Report_ID", "__ROW_NUMBER__"]));
    if (id) return nav(`${routes.reportDetail}?id=${encodeURIComponent(id)}`);
    const jobsiteId = toText(pick(r, ["Jobsite_ID", "Site_ID"]));
    const when = toText(pick(r, ["Submitted_At", "Created_At", "Report_Date", "Date"]));
    nav(`${routes.reportDetail}?jobsiteId=${encodeURIComponent(jobsiteId)}&date=${encodeURIComponent(when)}`);
  };

  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6" style={{ paddingTop: 12, paddingBottom: 12 }}>
      <Card className="rounded-2xl" style={cardStyle}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">
            Recent reports <span style={thinGray}>|</span> <span style={thinGray}>recientes</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          {filtered.length ? (
            <div>
              {filtered.slice(0, 40).map((r: any, idx: number) => {
                const jobsite = toText(pick(r, ["Jobsite_Name", "Site_Name", "Jobsite", "Site"])) || "Report";
                const when = toText(
                  pick(r, ["Submitted_At_Local", "Last_Updated_At_Local", "Manifest_Date", "Submitted_At", "Created_At", "Report_Date", "Date", "Timestamp"])
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
                    : chipStyle("total");

                return (
                  <div
                    key={toText(pick(r, ["id", "ID", "Report_ID", "__ROW_NUMBER__"])) || idx}
                    className="py-3"
                    style={{ borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <div className="flex items-center justify-between gap-3 cursor-pointer" onClick={() => openDetail(r)}>
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
              <FileText className="w-20 h-20 mx-auto mb-3" style={{ color: "rgba(0,233,239,0.55)", filter: "drop-shadow(0 0 18px rgba(0,233,239,0.12))" }} />
              <div className="text-sm text-white">No reports yet</div>
              <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.65)" }}>
                Create your first report to get started.
              </div>

              <Button className="mt-6 gap-2 h-11 rounded-xl font-semibold" style={{ background: "rgba(0,233,239,0.95)", color: "#0b1020" }} onClick={() => openNewReport("general")}>
                <Plus className="w-4 h-4" /> New report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}