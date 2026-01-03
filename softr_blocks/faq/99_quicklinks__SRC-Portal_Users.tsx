import { useMemo } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, FileText, Calendar, Info, Bell, User, Shield, Home } from "lucide-react";

export default function Block() {
  const user = useCurrentUser();

  const routes = {
    home: "/home",
    reports: "/reports",
    today: "/today",
    faq: "/faq",
    bulletins: "/bulletins",
    profile: "/profile",
    officeReview: "/office-review",
  };

  const nav = (href: string) => (window.location.href = href);
  const toText = (v: any) => (v === undefined || v === null ? "" : String(v));

  const roleStrings = useMemo(() => {
    const vals = [
      user?.UserGroup,
      user?.userGroup,
      user?.Role,
      user?.role,
      user?.Auth_Level,
      user?.auth_level,
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
    return (
      val.includes("office") ||
      val.includes("admin") ||
      val.includes("manager") ||
      val.includes("dispatcher") ||
      val.includes("supervisor")
    );
  }, [roleStrings]);

  const cardStyle = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 52px rgba(0,0,0,0.40)",
    backdropFilter: "blur(8px)",
  };

  const thinGray = { color: "rgba(229,231,235,0.55)", fontWeight: 500, fontStyle: "italic" as const };

  const Row = ({
    icon,
    label,
    es,
    onClick,
    tone,
  }: {
    icon: React.ReactNode;
    label: string;
    es?: string;
    onClick: () => void;
    tone?: "cyan" | "amber" | "gray";
  }) => {
    const bg =
      tone === "amber"
        ? { background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.22)" }
        : tone === "cyan"
        ? { background: "rgba(0,233,239,0.10)", border: "1px solid rgba(0,233,239,0.22)" }
        : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" };

    return (
      <>
        <button type="button" className="w-full flex items-center justify-between py-3" style={{ cursor: "pointer" }} onClick={onClick}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={bg}>
              {icon}
            </div>
            <div className="text-sm font-semibold text-white truncate">
              {label} {es ? <span style={thinGray}>| {es}</span> : null}
            </div>
          </div>
          <ChevronRight className="w-4 h-4" style={{ color: "rgba(229,231,235,0.55)" }} />
        </button>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />
      </>
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6" style={{ paddingTop: 12, paddingBottom: 12 }}>
      <Card className="rounded-2xl" style={cardStyle}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">Quick links</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <Row icon={<Home className="w-4 h-4" style={{ color: "rgba(229,231,235,0.92)" }} />} label="Home" es="inicio" tone="gray" onClick={() => nav(routes.home)} />
            <Row icon={<FileText className="w-4 h-4" style={{ color: "rgba(0,233,239,0.96)" }} />} label="Reports" es="reportes" tone="cyan" onClick={() => nav(routes.reports)} />
            <Row icon={<Calendar className="w-4 h-4" style={{ color: "rgba(251,191,36,0.92)" }} />} label="Today" es="hoy" tone="amber" onClick={() => nav(routes.today)} />
            <Row icon={<Info className="w-4 h-4" style={{ color: "rgba(229,231,235,0.92)" }} />} label="FAQ" es="ayuda" tone="gray" onClick={() => nav(routes.faq)} />
            <Row icon={<Bell className="w-4 h-4" style={{ color: "rgba(0,233,239,0.86)" }} />} label="Bulletins" es="boletines" tone="cyan" onClick={() => nav(routes.bulletins)} />
            <Row icon={<User className="w-4 h-4" style={{ color: "rgba(229,231,235,0.92)" }} />} label="Profile" es="perfil" tone="gray" onClick={() => nav(routes.profile)} />

            {isOffice ? (
              <Row icon={<Shield className="w-4 h-4" style={{ color: "rgba(251,191,36,0.92)" }} />} label="Office review" es="oficina" tone="amber" onClick={() => nav(routes.officeReview)} />
            ) : (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}