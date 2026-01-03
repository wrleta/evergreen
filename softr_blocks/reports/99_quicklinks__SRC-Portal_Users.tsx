import { useMemo, type CSSProperties } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronRight,
  FileText,
  Calendar,
  Info,
  Bell,
  User,
  Shield,
  Home,
} from "lucide-react";

export default function Block(props: any) {
  const user = useCurrentUser();

  const routes = {
    home: "/home",
    today: "/today",
    reports: "/reports",
    faq: "/faq",
    bulletins: "/bulletins",
    profile: "/profile",
    officeReview: "/office-review",
  };

  const nav = (href: string) => (window.location.href = href);
  const toText = (v: any) => (v === undefined || v === null ? "" : String(v));

  // Robust office detection (works even if Softr doesn’t pass a clean “group” field)
  const roleStrings = useMemo(() => {
    const out: string[] = [];
    const add = (v: any) => {
      if (!v) return;
      if (Array.isArray(v)) v.forEach(add);
      else if (typeof v === "object") {
        if (v?.name) out.push(String(v.name));
        if (v?.title) out.push(String(v.title));
      } else out.push(String(v));
    };

    add((user as any)?.UserGroup);
    add((user as any)?.userGroup);
    add((user as any)?.Role);
    add((user as any)?.role);
    add((user as any)?.Auth_Level);
    add((user as any)?.auth_level);
    add((user as any)?.groups);

    // Some Softr builds expose a global user object
    try {
      const w: any = typeof window !== "undefined" ? window : null;
      const lu = w?.logged_in_user;
      add(lu?.UserGroup);
      add(lu?.Role);
      add(lu?.Auth_Level);
      add(lu?.groups);
    } catch {}

    return out.filter(Boolean);
  }, [user]);

  const isOffice = useMemo(() => {
    const val = roleStrings.join(" ").toLowerCase();
    return (
      val.includes("office") ||
      val.includes("admin") ||
      val.includes("manager") ||
      val.includes("dispatcher") ||
      val.includes("supervisor") ||
      val.includes("office+")
    );
  }, [roleStrings]);

  // Visuals (card only; background continuity stays global in Softr/App settings)
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

  // If not logged in, hide footer block quietly
  if (!user) return null;

  return (
    <div
      className="mx-auto w-full max-w-5xl px-4 sm:px-6"
      style={{ paddingTop: 12, paddingBottom: 12 }}
    >
      <Card className="rounded-2xl" style={cardStyle}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">
            Quick actions <span style={thinGray}>|</span>{" "}
            <span style={thinGray}>acciones rápidas</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Home */}
            <button
              type="button"
              className="w-full flex items-center justify-between py-3"
              style={{ cursor: "pointer" }}
              onClick={() => nav(routes.home)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <Home
                    className="w-4 h-4"
                    style={{ color: "rgba(229,231,235,0.92)" }}
                  />
                </div>
                <div className="text-sm font-semibold text-white truncate">
                  Home <span style={thinGray}>|</span>{" "}
                  <span style={thinGray}>inicio</span>
                </div>
              </div>
              <ChevronRight
                className="w-4 h-4"
                style={{ color: "rgba(229,231,235,0.55)" }}
              />
            </button>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

            {/* Reports */}
            <button
              type="button"
              className="w-full flex items-center justify-between py-3"
              style={{ cursor: "pointer" }}
              onClick={() => nav(routes.reports)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: "rgba(0,233,239,0.12)",
                    border: "1px solid rgba(0,233,239,0.22)",
                  }}
                >
                  <FileText
                    className="w-4 h-4"
                    style={{ color: "rgba(0,233,239,0.96)" }}
                  />
                </div>
                <div className="text-sm font-semibold text-white truncate">
                  Reports <span style={thinGray}>|</span>{" "}
                  <span style={thinGray}>reportes</span>
                </div>
              </div>
              <ChevronRight
                className="w-4 h-4"
                style={{ color: "rgba(229,231,235,0.55)" }}
              />
            </button>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

            {/* Today */}
            <button
              type="button"
              className="w-full flex items-center justify-between py-3"
              style={{ cursor: "pointer" }}
              onClick={() => nav(routes.today)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: "rgba(251,191,36,0.10)",
                    border: "1px solid rgba(251,191,36,0.22)",
                  }}
                >
                  <Calendar
                    className="w-4 h-4"
                    style={{ color: "rgba(251,191,36,0.92)" }}
                  />
                </div>
                <div className="text-sm font-semibold text-white truncate">
                  Today <span style={thinGray}>|</span>{" "}
                  <span style={thinGray}>hoy</span>
                </div>
              </div>
              <ChevronRight
                className="w-4 h-4"
                style={{ color: "rgba(229,231,235,0.55)" }}
              />
            </button>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

            {/* FAQ */}
            <button
              type="button"
              className="w-full flex items-center justify-between py-3"
              style={{ cursor: "pointer" }}
              onClick={() => nav(routes.faq)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <Info
                    className="w-4 h-4"
                    style={{ color: "rgba(229,231,235,0.90)" }}
                  />
                </div>
                <div className="text-sm font-semibold text-white truncate">
                  FAQ <span style={thinGray}>|</span>{" "}
                  <span style={thinGray}>ayuda</span>
                </div>
              </div>
              <ChevronRight
                className="w-4 h-4"
                style={{ color: "rgba(229,231,235,0.55)" }}
              />
            </button>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

            {/* Bulletins */}
            <button
              type="button"
              className="w-full flex items-center justify-between py-3"
              style={{ cursor: "pointer" }}
              onClick={() => nav(routes.bulletins)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: "rgba(0,233,239,0.08)",
                    border: "1px solid rgba(0,233,239,0.18)",
                  }}
                >
                  <Bell
                    className="w-4 h-4"
                    style={{ color: "rgba(0,233,239,0.86)" }}
                  />
                </div>
                <div className="text-sm font-semibold text-white truncate">
                  Bulletins <span style={thinGray}>|</span>{" "}
                  <span style={thinGray}>boletines</span>
                </div>
              </div>
              <ChevronRight
                className="w-4 h-4"
                style={{ color: "rgba(229,231,235,0.55)" }}
              />
            </button>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

            {/* Profile */}
            <button
              type="button"
              className="w-full flex items-center justify-between py-3"
              style={{ cursor: "pointer" }}
              onClick={() => nav(routes.profile)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <User
                    className="w-4 h-4"
                    style={{ color: "rgba(229,231,235,0.90)" }}
                  />
                </div>
                <div className="text-sm font-semibold text-white truncate">
                  Profile <span style={thinGray}>|</span>{" "}
                  <span style={thinGray}>perfil</span>
                </div>
              </div>
              <ChevronRight
                className="w-4 h-4"
                style={{ color: "rgba(229,231,235,0.55)" }}
              />
            </button>

            {/* Office-only: Office Review */}
            {isOffice ? (
              <>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />
                <button
                  type="button"
                  className="w-full flex items-center justify-between py-3"
                  style={{ cursor: "pointer" }}
                  onClick={() => nav(routes.officeReview)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{
                        background: "rgba(251,191,36,0.08)",
                        border: "1px solid rgba(251,191,36,0.18)",
                      }}
                    >
                      <Shield
                        className="w-4 h-4"
                        style={{ color: "rgba(251,191,36,0.92)" }}
                      />
                    </div>
                    <div className="text-sm font-semibold text-white truncate">
                      Office review <span style={thinGray}>|</span>{" "}
                      <span style={thinGray}>oficina</span>
                    </div>
                  </div>
                  <ChevronRight
                    className="w-4 h-4"
                    style={{ color: "rgba(229,231,235,0.55)" }}
                  />
                </button>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}