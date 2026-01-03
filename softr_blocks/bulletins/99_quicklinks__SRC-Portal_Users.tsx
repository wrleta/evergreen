import { useMemo, type CSSProperties } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, FileText, Calendar, Info, Bell, User, Shield } from "lucide-react";

export default function Block(props: any) {
  const user = useCurrentUser();

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

  const thinGray: CSSProperties = { color: "rgba(229,231,235,0.55)", fontWeight: 500 };

  const cardStyle: CSSProperties = {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 52px rgba(0,0,0,0.40)",
    backdropFilter: "blur(8px)",
    color: "#E5E7EB",
  };

  const Row = (p: {
    icon: any;
    label: string;
    sub: string;
    onClick: () => void;
    chipBg: string;
    chipBorder: string;
    iconColor: string;
  }) => {
    const Icon = p.icon;
    return (
      <button type="button" className="w-full flex items-center justify-between py-3" style={{ cursor: "pointer" }} onClick={p.onClick}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: p.chipBg, border: `1px solid ${p.chipBorder}` }}>
            <Icon className="w-4 h-4" style={{ color: p.iconColor }} />
          </div>
          <div className="text-sm font-semibold text-white truncate">
            {p.label} <span style={thinGray}>|</span> <span style={thinGray}>{p.sub}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4" style={{ color: "rgba(229,231,235,0.55)" }} />
      </button>
    );
  };

  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 pt-4 pb-6">
      <Card className="rounded-2xl" style={cardStyle}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">
            Quick links <span style={thinGray}>|</span> <span style={thinGray}>accesos</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <Row icon={FileText} label="Reports" sub="reportes" onClick={() => nav(routes.reports)}
              chipBg="rgba(0,233,239,0.12)" chipBorder="rgba(0,233,239,0.22)" iconColor="rgba(0,233,239,0.96)" />
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

            <Row icon={Calendar} label="Today" sub="hoy" onClick={() => nav(routes.today)}
              chipBg="rgba(251,191,36,0.10)" chipBorder="rgba(251,191,36,0.22)" iconColor="rgba(251,191,36,0.92)" />
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

            <Row icon={Info} label="FAQ" sub="ayuda" onClick={() => nav(routes.faq)}
              chipBg="rgba(255,255,255,0.03)" chipBorder="rgba(255,255,255,0.10)" iconColor="rgba(229,231,235,0.90)" />
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

            <Row icon={Bell} label="Bulletins" sub="boletines" onClick={() => nav(routes.bulletins)}
              chipBg="rgba(0,233,239,0.08)" chipBorder="rgba(0,233,239,0.18)" iconColor="rgba(0,233,239,0.86)" />
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

            <Row icon={User} label="Profile" sub="perfil" onClick={() => nav(routes.profile)}
              chipBg="rgba(255,255,255,0.03)" chipBorder="rgba(255,255,255,0.10)" iconColor="rgba(229,231,235,0.90)" />

            {isOffice ? (
              <>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />
                <Row icon={Shield} label="Office review" sub="oficina" onClick={() => nav(routes.officeReview)}
                  chipBg="rgba(251,191,36,0.08)" chipBorder="rgba(251,191,36,0.18)" iconColor="rgba(251,191,36,0.92)" />
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}