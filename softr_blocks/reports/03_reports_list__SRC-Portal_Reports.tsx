import { useMemo, useState, type CSSProperties } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Shield, ChevronRight } from "lucide-react";

export default function Block(props: any) {
  const user = useCurrentUser();

  const reports = Array.isArray(props?.reports)
    ? props.reports
    : Array.isArray(props?.records)
    ? props.records
    : Array.isArray(props?.items)
    ? props.items
    : [];

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

  const userEmail = useMemo(
    () => toText((user as any)?.email).toLowerCase(),
    [user]
  );

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

  const cardStyle: CSSProperties = {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 52px rgba(0,0,0,0.40)",
    backdropFilter: "blur(8px)",
  };

  const thinGray: CSSProperties = {
    color: "rgba(229,231,235,0.55)",
    fontWeight: 500,
  };

  // Hard hide if not logged in or not office
  if (!user || !isOffice) return null;

  const otherCrewReports = useMemo(() => {
    const emailKeys = ["Login_Email", "Worker_Email", "Email", "User_Email", "Reporter_Email"];
    const dateKeys = ["Submitted_At_Local", "Last_Updated_At_Local", "Manifest_Date", "Submitted_At", "Created_At"];

    const getDateMs = (r: any) => {
      const d = pick(r, dateKeys);
      const t = Date.parse(toText(d));
      return Number.isFinite(t) ? t : 0;
    };

    const arr = (Array.isArray(reports) ? reports : [])
      .filter((r: any) => {
        const em = toText(pick(r, emailKeys)).toLowerCase();
        // Only “other crew”: must have email and not equal current user
        return em && userEmail ? em !== userEmail : false;
      })
      .sort((a: any, b: any) => getDateMs(b) - getDateMs(a));

    return arr;
  }, [reports, userEmail]);

  // Auto-hide if nothing beyond the user
  if (!otherCrewReports.length) return null;

  const [open, setOpen] = useState(false);

  return (
    <div
      className="mx-auto w-full max-w-5xl px-4 sm:px-6"
      style={{ paddingTop: 12, paddingBottom: 12 }}
    >
      <Card className="rounded-2xl" style={cardStyle}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: "rgba(251,191,36,0.92)" }} />
              All crews <span style={thinGray}>|</span>{" "}
              <span style={thinGray}>equipo</span>
              <span
                className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  background: "rgba(251,191,36,0.12)",
                  border: "1px solid rgba(251,191,36,0.22)",
                  color: "rgba(251,191,36,0.95)",
                }}
              >
                {otherCrewReports.length}
              </span>
            </CardTitle>

            <Button
              variant="ghost"
              className="h-9 px-3 rounded-xl"
              style={{ color: "rgba(0,233,239,0.95)" }}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Expand
                </>
              )}
            </Button>
          </div>

          <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.60)" }}>
            Auto-hidden unless there are reports from other crews.
          </div>
        </CardHeader>

        {open ? (
          <CardContent className="pt-0">
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              {otherCrewReports.slice(0, 12).map((r: any, idx: number) => {
                const when = toText(
                  pick(r, ["Submitted_At_Local", "Last_Updated_At_Local", "Manifest_Date"])
                );
                const type = toText(pick(r, ["Report_Type"])) || "Report";
                const summary =
                  toText(pick(r, ["Summary_EN", "Report_Text_EN"])) ||
                  toText(pick(r, ["Summary_ES"])) ||
                  "—";
                const crew = toText(pick(r, ["Crew_ID"])) || "—";

                const key =
                  toText(pick(r, ["Report_ID", "id", "ID", "__ROW_NUMBER__"])) || `${idx}`;

                return (
                  <div
                    key={key}
                    className="py-3"
                    style={{
                      borderBottom:
                        idx === Math.min(otherCrewReports.length, 12) - 1
                          ? "none"
                          : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">
                          {type} <span style={thinGray}>•</span>{" "}
                          <span style={thinGray}>Crew</span>{" "}
                          <span className="text-white">{crew}</span>
                        </div>
                        <div
                          className="text-xs mt-1 truncate"
                          style={{ color: "rgba(229,231,235,0.60)" }}
                        >
                          {when || "—"}
                        </div>
                        <div
                          className="text-xs mt-2"
                          style={{ color: "rgba(229,231,235,0.78)" }}
                        >
                          {summary}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="h-9 px-3 rounded-xl text-xs font-semibold inline-flex items-center"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.10)",
                          color: "rgba(0,233,239,0.92)",
                          whiteSpace: "nowrap",
                        }}
                        onClick={() => nav("/reports")}
                        title="Open Reports"
                      >
                        Open
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4">
              <Button
                className="h-11 rounded-xl font-semibold w-full"
                style={{ background: "rgba(251,191,36,0.95)", color: "#0b1020" }}
                onClick={() => nav("/office-review")}
              >
                Go to Office review
              </Button>
            </div>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}