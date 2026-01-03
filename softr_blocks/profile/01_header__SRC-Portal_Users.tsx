import { useMemo, type CSSProperties } from "react";
import { useCurrentUser } from "@/lib/user";
import { FileText, Calendar, Info, Pencil, User as UserIcon } from "lucide-react";

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
    profile: "/profile",
    // create a dedicated Softr page for editing Display_Name only (recommended)
    editName: "/edit-name",
  };

  const nav = (href: string) => (window.location.href = href);
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

  const email = useMemo(() => toText((user as any)?.email).toLowerCase(), [user]);

  const userRow = useMemo(() => {
    if (!rows?.length) return null;
    if (!email) return rows[0];
    const found = rows.find((r: any) => toText(pick(r, ["Login_Email", "Email"])).toLowerCase() === email);
    return found || rows[0];
  }, [rows, email]);

  const reporterId = userRow ? toText(pick(userRow, ["Worker_ID", "Reporter_ID", "Employee_ID", "ID"])) : "";
  const crewId = userRow ? toText(pick(userRow, ["Crew_ID", "Crew"])) : "";

  const isOffice = useMemo(() => {
    const raw =
      pick(userRow, ["UserGroup", "Role", "Auth_Level"]) ||
      (user as any)?.UserGroup ||
      (user as any)?.Role ||
      (user as any)?.role;
    const v = toText(raw).toLowerCase();
    return v.includes("office") || v.includes("admin") || v.includes("manager") || v.includes("dispatcher") || v.includes("supervisor");
  }, [userRow, user]);

  const displayName = useMemo(() => {
    const fromUserRow = toText(pick(userRow, ["Display_Name", "Legal_Name", "Name", "Full_Name"]));
    if (fromUserRow) return fromUserRow;
    const fromAuth = toText((user as any)?.name || (user as any)?.fullName);
    if (fromAuth) return fromAuth;
    const em = toText((user as any)?.email);
    return em ? em.split("@")[0] : "Field Reporter";
  }, [userRow, user]);

  // styles (no page background here — that stays global in Softr)
  const banner: CSSProperties = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.00) 60%), #000",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  };

  const accentLine: CSSProperties = {
    height: 2,
    background:
      "linear-gradient(90deg, rgba(0,233,239,0.95), rgba(0,233,239,0.25) 35%, rgba(251,191,36,0.22) 70%, rgba(251,191,36,0.70))",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 6px 20px rgba(0,233,239,0.10)",
  };

  const clamp1: CSSProperties = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
  const thinGray: CSSProperties = { color: "rgba(229,231,235,0.55)", fontWeight: 500 };
  const esGray: CSSProperties = { ...thinGray, fontStyle: "italic" };

  const linkBtn: CSSProperties = {
    background: "transparent",
    border: "none",
    padding: 0,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "rgba(0,233,239,0.96)",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  if (!user) return null;

  return (
    <div style={{ paddingTop: 0, paddingBottom: 12 }}>
      <header style={banner}>
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold tracking-wide"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.05))",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "rgba(0,233,239,0.95)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
                }}
              >
                RK
              </div>

              <div className="min-w-0">
                <div className="text-[12px] uppercase tracking-[0.22em] leading-tight" style={{ color: "rgba(229,231,235,0.86)", ...clamp1 }}>
                  FIELD REPORTING SYSTEM
                </div>
                <div
                  style={{
                    marginTop: 6,
                    height: 1,
                    width: 180,
                    background: "linear-gradient(90deg, rgba(0,233,239,0.25), rgba(255,255,255,0.00))",
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
                  <img src={(user as any).avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div style={accentLine} />
      </header>

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6" style={{ paddingTop: 14 }}>
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-2xl font-extrabold leading-tight truncate" style={{ color: "#E5E7EB" }}>
                Profile <span style={thinGray}>|</span> <span style={esGray}>perfil</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              {reporterId ? (
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(229,231,235,0.85)" }}
                >
                  Reporter ID: {reporterId}
                </span>
              ) : null}
              {crewId ? (
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(229,231,235,0.85)" }}
                >
                  Crew: {crewId}
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center" style={{ paddingTop: 10, gap: 8 }}>
            <button style={linkBtn} onClick={() => nav(routes.editName)} title="Edit display name">
              <Pencil className="w-4 h-4" />
              <span style={{ fontWeight: 800 }}>
                Edit <span style={thinGray}>(name)</span>
              </span>
            </button>

            <button style={{ ...linkBtn, justifySelf: "center" as any }} onClick={() => nav(routes.reports)}>
              <FileText className="w-4 h-4" />
              Reports
            </button>

            <button style={{ ...linkBtn, justifySelf: "center" as any }} onClick={() => nav(routes.today)}>
              <Calendar className="w-4 h-4" />
              Today
            </button>

            <button style={{ ...linkBtn, justifySelf: "end" as any }} onClick={() => nav(routes.faq)}>
              <Info className="w-4 h-4" />
              FAQ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}