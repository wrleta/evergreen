import React, { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

type ViewMode = "my" | "crew";
type StatusFilter = "All" | "Pending" | "Reported" | "Insufficient";

const EVT = "rk_today_state_v1";
const KEY = "__rk_today_state_v1";
const DEFAULT_STATE = { q: "", viewMode: "my" as ViewMode, crewFilter: "All", statusFilter: "All" as StatusFilter };

function readState() {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  const w = window as any;
  return { ...DEFAULT_STATE, ...(w[KEY] || {}) };
}

export default function Block({ stops = [] }: { stops?: any[] }) {
  const user = useCurrentUser();

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

  const userWorkerId = useMemo(
    () =>
      toText(
        (user as any)?.Worker_ID ||
          (user as any)?.workerId ||
          (user as any)?.fields?.Worker_ID ||
          (user as any)?.fields?.workerId
      ),
    [user]
  );
  const userEmail = useMemo(
    () => toText((user as any)?.email || (user as any)?.fields?.email),
    [user]
  );

  const normalizeStatus = (raw: any) => {
    const v = toText(raw).toLowerCase();
    if (!v) return "Pending";
    if (v.includes("insufficient") || v.includes("follow") || v.includes("need")) return "Insufficient";
    if (v.includes("reported") || v.includes("complete") || v.includes("done") || v.includes("submitted"))
      return "Reported";
    return "Pending";
  };

  const [state, setState] = useState(readState());
  useEffect(() => {
    const h = () => setState(readState());
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, []);

  const allStops = useMemo(() => (Array.isArray(stops) ? stops : []), [stops]);

  const myStops = useMemo(() => {
    return allStops.filter((s) => {
      const wid = toText(pick(s, ["Worker_ID", "WorkerId", "Assigned_Worker_ID"]));
      const eml = toText(pick(s, ["Login_Email", "Email", "Worker_Email"]));
      if (userWorkerId && wid) return wid === userWorkerId;
      if (userEmail && eml) return eml.toLowerCase() === userEmail.toLowerCase();
      return true;
    });
  }, [allStops, userWorkerId, userEmail]);

  const filteredStops = useMemo(() => {
    const base = isOffice && state.viewMode === "crew" ? allStops : myStops;
    const qq = state.q.trim().toLowerCase();

    const filtered = base.filter((s) => {
      const c = toText(pick(s, ["Crew_ID", "CrewId", "Crew"]));
      const st = normalizeStatus(pick(s, ["Report_Status", "Status"]));
      const job = toText(pick(s, ["Jobsite_Name", "Site_Name"]));
      const addr = toText(pick(s, ["Jobsite_Address", "Address"]));

      if (isOffice && state.viewMode === "crew" && state.crewFilter !== "All" && c !== state.crewFilter) return false;
      if (state.statusFilter !== "All" && st !== state.statusFilter) return false;

      if (qq) {
        const hay = `${job} ${addr} ${c} ${st}`.toLowerCase();
        if (!hay.includes(qq)) return false;
      }

      return true;
    });

    return filtered;
  }, [allStops, myStops, isOffice, state]);

  const stopsWithCoords = useMemo(() => {
    const parse = (v: any) => {
      const n = Number(toText(v));
      return Number.isFinite(n) ? n : null;
    };

    return filteredStops
      .map((s) => {
        const lat = parse(pick(s, ["Lat", "Latitude", "lat", "latitude", "Jobsite_Lat"]));
        const lng = parse(pick(s, ["Lng", "Long", "Longitude", "lng", "longitude", "Jobsite_Lng", "Lon"]));
        return { s, lat, lng };
      })
      .filter((x) => x.lat !== null && x.lng !== null) as Array<{ s: any; lat: number; lng: number }>;
  }, [filteredStops]);

  const [selectedIdx, setSelectedIdx] = useState(0);
  useEffect(() => {
    // reset selection if filters changed
    setSelectedIdx(0);
  }, [state.q, state.viewMode, state.crewFilter, state.statusFilter, stopsWithCoords.length]);

  const selected = stopsWithCoords[selectedIdx];

  const openMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`, "_blank");
  };

  // ---------- VISUAL ----------
  const wrap: CSSProperties = { paddingTop: 12, paddingBottom: 12 };
  const cardStyle: CSSProperties = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 52px rgba(0,0,0,0.40)",
    backdropFilter: "blur(8px)",
  };
  const thinGray: CSSProperties = { color: "rgba(229,231,235,0.55)", fontWeight: 500 };
  const esGray: CSSProperties = { ...thinGray, fontStyle: "italic" };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6" style={wrap}>
      <Card className="rounded-2xl" style={cardStyle}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-5 h-5" style={{ color: "rgba(0,233,239,0.95)" }} />
            <CardTitle className="text-base text-white truncate">
              Map <span style={thinGray}>|</span> <span style={esGray}>mapa</span>
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {!stopsWithCoords.length ? (
            <div className="py-10 text-center">
              <MapPin className="w-16 h-16 mx-auto mb-3" style={{ color: "rgba(0,233,239,0.55)" }} />
              <div className="text-sm text-white">No map data for today</div>
              <div className="text-xs mt-1" style={thinGray}>
                Add lat/long to Portal_Stops (or Jobsite master) to enable pins.
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <select
                  value={String(selectedIdx)}
                  onChange={(e) => setSelectedIdx(Number(e.target.value))}
                  className="h-10 px-3 rounded-xl text-sm"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(229,231,235,0.92)",
                  }}
                >
                  {stopsWithCoords.map((x, idx) => {
                    const name = toText(pick(x.s, ["Jobsite_Name", "Site_Name"])) || `Stop ${idx + 1}`;
                    return (
                      <option key={toText(pick(x.s, ["id", "__ROW_NUMBER__"])) || idx} value={String(idx)}>
                        {name}
                      </option>
                    );
                  })}
                </select>

                <Button
                  variant="outline"
                  className="h-10 rounded-xl sm:ml-auto"
                  style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.12)", color: "rgba(229,231,235,0.92)" }}
                  onClick={() => openMaps(selected.lat, selected.lng)}
                >
                  Open in Maps
                </Button>
              </div>

              <div
                className="w-full rounded-2xl overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 18px 52px rgba(0,0,0,0.35)" }}
              >
                <iframe
                  title="map"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(`${selected.lat},${selected.lng}`)}&z=14&output=embed`}
                  width="100%"
                  height="320"
                  loading="lazy"
                  style={{ border: 0 }}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}