import { useMemo, type CSSProperties } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ChevronRight } from "lucide-react";

export default function Block(props: any) {
  const user = useCurrentUser();

  const rows = Array.isArray(props?.users)
    ? props.users
    : Array.isArray(props?.records)
    ? props.records
    : Array.isArray(props?.items)
    ? props.items
    : [];

  const routes = { officeReview: "/office-review" };
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

  if (!user) return null;
  if (!canReview) return null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6" style={{ paddingTop: 12, paddingBottom: 12 }}>
      <Card className="rounded-2xl" style={cardStyle}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white truncate">
            Office tools <span style={thinGray}>|</span> <span style={esGray}>oficina</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <button
            type="button"
            className="w-full flex items-center justify-between py-3"
            style={{ cursor: "pointer", borderTop: "1px solid rgba(255,255,255,0.08)" }}
            onClick={() => nav(routes.officeReview)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.18)" }}
              >
                <Shield className="w-4 h-4" style={{ color: "rgba(251,191,36,0.92)" }} />
              </div>
              <div className="text-sm font-semibold text-white truncate">Office review queue</div>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: "rgba(229,231,235,0.55)" }} />
          </button>
        </CardContent>
      </Card>
    </div>
  );
}