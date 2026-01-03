import { useMemo, type CSSProperties } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar, Info, Bell, User, Shield, ChevronRight } from "lucide-react";

export default function Block(props: any) {
  const user = useCurrentUser();

  const rows = Array.isArray(props?.users)
    ? props.users
    : Array.isArray(props?.records)
    ? props.records
    : Array.isArray(props?.items)
    ? props.items
    : [];

  const routes = {
    reports: "/reports",
    today: "/today",
    faq: "/faq",
    bulletins: "/bulletins",
    profile: "/profile",
    officeReview: "/office-review",
  };

  const nav = (href: string) => (window.location.href = href);
  const toText = (v: any) => (v === undefined || v === null ? "" : String(v));
  const pick = (obj: any, keys: string[]) => {
    for (const k of keys) {
      const v = obj?.[k] ?? obj?.fields?.[k] ?? obj?.attributes?.[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") return v;
    }
    return "";
  };

  const email = useMemo(() => toText((user as any)?.email).toLowerCase(), [user]);

  const userRow = useMemo(() => {
    if (!rows?.length) return null;
    if (!email) return rows[0];
    const found = rows.find((r: any) => toText(pick(r, ["Login_Email", "Email"])).toLowerCase() === email);
    return found || rows[0];
  }, [rows, email]);

  const canReview = useMemo(() => {
    const raw = pick(userRow, ["Can_Review_Queue"]);
    return raw === true || toText(raw).toLowerCase() === "true";
  }, [userRow]);

  const thinGray: CSSProperties = { color: "rgba(229,231,235,0.55)", fontWeight: 500 };
  const esGray: CSSProperties = { ...thinGray, fontStyle: "italic" };

  const cardStyle: CSSProperties = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 52px rgba(0,0,0,0.40)",
    backdropFilter: "blur(8px)",
  };

  const here = typeof window !== "undefined" ? window.location.pathname : "";
  const onProfile = here === routes.profile;

  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6" style={{ paddingTop: 12, paddingBottom: 0 }}>
      <Card className="rounded-2xl" style={cardStyle}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">
            Quick actions <span style={thinGray}>|</span> <span style={esGray}>acciones rápidas</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              {
                key: "reports",
                show: true,
                href: routes.reports,
                icon: <FileText className="w-4 h-4" style={{ color: "rgba(0,233,239,0.96)" }} />,
                label: (
                  <>
                    Reports <span style={thinGray}>|</span> <span style={esGray}>reportes</span>
                  </>
                ),
                bg: "rgba(0,233,239,0.12)",
                border: "rgba(0,233,239,0.22)",
              },
              {
                key: "today",
                show: true,
                href: routes.today,
                icon: <Calendar className="w-4 h-4" style={{ color: "rgba(251,191,36,0.92)" }} />,
                label: (
                  <>
                    Today <span style={thinGray}>|</span> <span style={esGray}>hoy</span>
                  </>
                ),
                bg: "rgba(251,191,36,0.10)",
                border: "rgba(251,191,36,0.22)",
              },
              {
                key: "faq",
                show: true,
                href: routes.faq,
                icon: <Info className="w-4 h-4" style={{ color: "rgba(229,231,235,0.90)" }} />,
                label: (
                  <>
                    FAQ <span style={thinGray}>|</span> <span style={esGray}>ayuda</span>
                  </>
                ),
                bg: "rgba(255,255,255,0.03)",
                border: "rgba(255,255,255,0.10)",
              },
              {
                key: "bulletins",
                show: true,
                href: routes.bulletins,
                icon: <Bell className="w-4 h-4" style={{ color: "rgba(0,233,239,0.86)" }} />,
                label: (
                  <>
                    Bulletins <span style={thinGray}>|</span> <span style={esGray}>boletines</span>
                  </>
                ),
                bg: "rgba(0,233,239,0.08)",
                border: "rgba(0,233,239,0.18)",
              },
              {
                key: "profile",
                show: !onProfile,
                href: routes.profile,
                icon: <User className="w-4 h-4" style={{ color: "rgba(229,231,235,0.90)" }} />,
                label: (
                  <>
                    Profile <span style={thinGray}>|</span> <span style={esGray}>perfil</span>
                  </>
                ),
                bg: "rgba(255,255,255,0.03)",
                border: "rgba(255,255,255,0.10)",
              },
              {
                key: "officeReview",
                show: canReview,
                href: routes.officeReview,
                icon: <Shield className="w-4 h-4" style={{ color: "rgba(251,191,36,0.92)" }} />,
                label: (
                  <>
                    Office review <span style={thinGray}>|</span> <span style={esGray}>oficina</span>
                  </>
                ),
                bg: "rgba(251,191,36,0.08)",
                border: "rgba(251,191,36,0.18)",
              },
            ]
              .filter((x) => x.show)
              .map((x, idx, arr) => (
                <div key={x.key}>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between py-3"
                    style={{ cursor: "pointer" }}
                    onClick={() => nav(x.href)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: x.bg, border: `1px solid ${x.border}` }}
                      >
                        {x.icon}
                      </div>
                      <div className="text-sm font-semibold text-white truncate">{x.label}</div>
                    </div>
                    <ChevronRight className="w-4 h-4" style={{ color: "rgba(229,231,235,0.55)" }} />
                  </button>
                  {idx < arr.length - 1 ? <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} /> : null}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}