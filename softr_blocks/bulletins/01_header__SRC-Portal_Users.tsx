import { useMemo, type CSSProperties } from "react";
import { useCurrentUser } from "@/lib/user";
import { User } from "lucide-react";

export default function Block(props: any) {
  const user = useCurrentUser();

  const routes = {
    profile: "/profile",
  };

  const nav = (href: string) => (window.location.href = href);
  const toText = (v: any) => (v === undefined || v === null ? "" : String(v));

  const displayName = useMemo(() => {
    const name = toText((user as any)?.name || (user as any)?.fullName);
    if (name) return name;
    const em = toText((user as any)?.email);
    return em ? em.split("@")[0] : "Field Reporter";
  }, [user]);

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

  const clamp1: CSSProperties = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const banner: CSSProperties = {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.00) 60%), #000",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    color: "#E5E7EB",
  };

  const accentLine: CSSProperties = {
    height: 2,
    background:
      "linear-gradient(90deg, rgba(0,233,239,0.95), rgba(0,233,239,0.25) 35%, rgba(251,191,36,0.22) 70%, rgba(251,191,36,0.70))",
    boxShadow:
      "0 0 0 1px rgba(255,255,255,0.04) inset, 0 6px 20px rgba(0,233,239,0.10)",
  };

  if (!user) return null;

  return (
    <header style={banner}>
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold tracking-wide"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.05))",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "rgba(0,233,239,0.95)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
              }}
            >
              RK
            </div>

            <div className="min-w-0">
              <div
                className="text-[12px] uppercase tracking-[0.22em] leading-tight"
                style={{ color: "rgba(229,231,235,0.86)", ...clamp1 }}
              >
                FIELD REPORTING SYSTEM
              </div>
              <div
                style={{
                  marginTop: 6,
                  height: 1,
                  width: 180,
                  background:
                    "linear-gradient(90deg, rgba(0,233,239,0.25), rgba(255,255,255,0.00))",
                  opacity: 0.9,
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOffice ? (
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: "rgba(251,191,36,0.14)",
                  border: "1px solid rgba(251,191,36,0.28)",
                  color: "rgba(251,191,36,0.95)",
                }}
              >
                Office+
              </span>
            ) : null}

            <button
              type="button"
              className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "0 12px 34px rgba(0,0,0,0.55)",
              }}
              aria-label="Profile"
              title={displayName}
              onClick={() => nav(routes.profile)}
            >
              {(user as any)?.avatarUrl ? (
                <img
                  src={(user as any).avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div style={accentLine} />
    </header>
  );
}