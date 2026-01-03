import { useMemo, type CSSProperties } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function Block(props: any) {
  const requests = Array.isArray(props?.requests)
    ? props.requests
    : Array.isArray(props?.records)
    ? props.records
    : Array.isArray(props?.items)
    ? props.items
    : [];

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

  const params = useMemo(() => {
    const sp = new URLSearchParams(window.location.search);
    return {
      stopId: sp.get("stopId") || sp.get("Stop_ID") || "",
    };
  }, []);

  const thinGray: CSSProperties = { color: "rgba(229,231,235,0.55)", fontWeight: 500 };

  const cardStyle: CSSProperties = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 52px rgba(0,0,0,0.40)",
    backdropFilter: "blur(8px)",
  };

  const rows = useMemo(() => {
    const stopId = params.stopId.trim();
    const base = stopId ? requests.filter((r: any) => toText(pick(r, ["Stop_ID"])) === stopId) : requests;

    const getMs = (r: any) => {
      const d = pick(r, ["Submitted_At_Local", "Reviewed_At_Local", "Manifest_Date"]);
      const ms = Date.parse(toText(d));
      return Number.isFinite(ms) ? ms : 0;
    };
    return [...base].sort((a, b) => getMs(b) - getMs(a));
  }, [requests, params.stopId]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 pt-4">
      <Card className="rounded-2xl" style={cardStyle}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-5 h-5" style={{ color: "rgba(251,191,36,0.92)" }} />
              <CardTitle className="text-lg text-white">
                Related requests <span style={thinGray}>|</span> <span style={thinGray}>solicitudes</span>
              </CardTitle>
            </div>

            <div
              className="text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(229,231,235,0.80)" }}
            >
              {rows.length}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {rows.length === 0 ? (
            <div className="text-sm" style={{ color: "rgba(229,231,235,0.70)" }}>
              No requests found for this stop.
            </div>
          ) : (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              {rows.map((r: any, idx: number) => {
                const typ = toText(pick(r, ["Requested_Change_Type"])) || "Request";
                const when = toText(pick(r, ["Submitted_At_Local", "Manifest_Date"]));
                const st = toText(pick(r, ["Status"])) || "";
                const reason = toText(pick(r, ["Reason_Text"]));
                return (
                  <div key={idx} style={{ padding: "12px 0" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{typ}</div>
                        <div className="text-xs mt-1 truncate" style={{ color: "rgba(229,231,235,0.60)" }}>
                          {when}{st ? ` • ${st}` : ""}
                        </div>
                        {reason ? (
                          <div className="text-xs mt-2" style={{ color: "rgba(229,231,235,0.70)" }}>
                            {reason}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    {idx < rows.length - 1 ? <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 12 }} /> : null}
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