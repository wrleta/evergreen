import { useMemo, type CSSProperties } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronRight } from "lucide-react";

export default function Block(props: any) {
  const stops = Array.isArray(props?.stops)
    ? props.stops
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
      row: sp.get("row") || "",
      jobsiteId: sp.get("jobsiteId") || "",
    };
  }, []);

  const stop = useMemo(() => {
    if (!stops.length) return null;

    if (params.stopId) {
      const f = stops.find((s: any) => toText(pick(s, ["Stop_ID"])) === params.stopId);
      if (f) return f;
    }
    if (params.row) {
      const f = stops.find((s: any) => toText(pick(s, ["__ROW_NUMBER__", "Row", "Row_Number"])) === params.row);
      if (f) return f;
    }
    if (params.jobsiteId) {
      const f = stops.find((s: any) => toText(pick(s, ["Jobsite_ID", "Site_ID"])) === params.jobsiteId);
      if (f) return f;
    }
    return stops[0] || null;
  }, [stops, params.stopId, params.row, params.jobsiteId]);

  if (!stop) return null;

  const thinGray: CSSProperties = { color: "rgba(229,231,235,0.55)", fontWeight: 500 };

  const cardStyle: CSSProperties = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 52px rgba(0,0,0,0.40)",
    backdropFilter: "blur(8px)",
  };

  const address1 = toText(pick(stop, ["Address_1"]));
  const city = toText(pick(stop, ["City"]));
  const state = toText(pick(stop, ["State"]));
  const zip = toText(pick(stop, ["Zip"]));
  const site = toText(pick(stop, ["Site_Name", "Jobsite_Name"])) || "Jobsite";
  const addr = [address1, city, state, zip].filter(Boolean).join(", ");
  const query = (addr || site).trim();

  const openMaps = () => {
    if (!query) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank");
  };

  const iframeSrc = query ? `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed` : "";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 pt-4">
      <Card className="rounded-2xl" style={cardStyle}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-5 h-5" style={{ color: "rgba(0,233,239,0.95)" }} />
              <CardTitle className="text-lg text-white">
                Map <span style={thinGray}>|</span> <span style={thinGray}>mapa</span>
              </CardTitle>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              style={{ color: "rgba(0,233,239,0.95)" }}
              onClick={openMaps}
            >
              Open <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {iframeSrc ? (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.20)" }}
            >
              <iframe
                title="Map"
                src={iframeSrc}
                width="100%"
                height="280"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ border: 0 }}
              />
            </div>
          ) : (
            <div className="text-sm" style={{ color: "rgba(229,231,235,0.70)" }}>
              No map address available.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}