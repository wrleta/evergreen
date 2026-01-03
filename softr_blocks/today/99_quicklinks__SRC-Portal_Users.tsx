import React, { useMemo, type CSSProperties } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, Home, Calendar, FileText, Info, Bell, User as UserIcon, Shield } from "lucide-react";

export default function Block() {
  const user = useCurrentUser();
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

  const routes = {
    home: "/home",
    today: "/today",
    reports: "/reports",
    faq: "/faq",
    bulletins: "/bulletins",
    profile: "/profile",
    officeReview: "/office-review",
  };

  const wrap: CSSProperties = { paddingTop: 12, paddingBottom: 12 };
  const cardStyle: CSSProperties = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 52px rgba(0,0,0,0.40)",
    backdropFilter: "blur(8px)",
  };
  const thinGray: CSSProperties = { color: "rgba(229,231,235,0.55)", fontWeight: 500 };
  const esGray: CSSProperties = { ...thinGray, fontStyle: "italic" };

  const Row = ({
    icon,
    title,
    es,
    onClick,
    tone,
  }: {
    icon: React.ReactNode;
    title: string;
    es: string;
    onClick: () => void;
    tone: "cyan" | "amber" | "neutral";
  }) => {
    const box =
      tone === "cyan"
        ? { background: "rgba(0,233,239,0.12)", border: "1px solid rgba(0,233,239,0.22)" }
        : tone === "amber"
        ? { background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.22)" }
        : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" };

    return (
      <>
        <button type="button" className="w-full flex items-center justify-between py-3" style={{ cursor: "pointer" }} onClick={onClick}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={box}>
              {icon}
            </div>
            <div className="text-sm font-semibold text-white truncate">
              {title} <span style={thinGray}>|</span> <span style={esGray}>{es}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4" style={{ color: "rgba(229,231,235,0.55)" }} />
        </button>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />
      </>
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6" style={wrap}>
      <Card className="rounded-2xl" style={cardStyle}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">
            Quick Links <span style={thinGray}>|</span> <span style={esGray}>enlaces</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

          <Row icon={<Home className="w-4 h-4" style={{ color: "rgba(0,233,239,0.96)" }} />} title="Home" es="inicio" onClick={() => nav(routes.home)} tone="cyan" />
          <Row icon={<FileText className="w-4 h-4" style={{ color: "rgba(0,233,239,0.96)" }} />} title="Reports" es="reportes" onClick={() => nav(routes.reports)} tone="cyan" />
          <Row icon={<Calendar className="w-4 h-4" style={{ color: "rgba(251,191,36,0.92)" }} />} title="Today" es="hoy" onClick={() => nav(routes.today)} tone="amber" />
          <Row icon={<Info className="w-4 h-4" style={{ color: "rgba(229,231,235,0.90)" }} />} title="FAQ" es="ayuda" onClick={() => nav(routes.faq)} tone="neutral" />
          <Row icon={<Bell className="w-4 h-4" style={{ color: "rgba(0,233,239,0.86)" }} />} title="Bulletins" es="boletines" onClick={() => nav(routes.bulletins)} tone="cyan" />
          <Row icon={<UserIcon className="w-4 h-4" style={{ color: "rgba(229,231,235,0.90)" }} />} title="Profile" es="perfil" onClick={() => nav(routes.profile)} tone="neutral" />

          {isOffice ? (
            <>
              <Row icon={<Shield className="w-4 h-4" style={{ color: "rgba(251,191,36,0.92)" }} />} title="Office review" es="oficina" onClick={() => nav(routes.officeReview)} tone="amber" />
            </>
          ) : null}

          {/* remove trailing divider line */}
          <div style={{ borderTop: "none" }} />
        </CardContent>
      </Card>
    </div>
  );
}