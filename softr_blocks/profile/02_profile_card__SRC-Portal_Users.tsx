import { useMemo, type CSSProperties } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Building2, Globe, Pencil, ChevronRight, User as UserIcon } from "lucide-react";

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
    // dedicated Softr page: edit form bound to Portal_Users, only Display_Name editable
    editName: "/edit-name",
    // Softr create-form page bound to Portal_User_Update_Requests
    userUpdateNew: "/user-update-requests",
    officeReview: "/office-review",
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

  const displayNameOnFile = userRow ? toText(pick(userRow, ["Display_Name", "Legal_Name", "Name", "Full_Name"])) : "";
  const role = userRow ? toText(pick(userRow, ["Role", "UserGroup", "Auth_Level"])) : "";
  const crewId = userRow ? toText(pick(userRow, ["Crew_ID", "Crew"])) : "";
  const language = userRow ? toText(pick(userRow, ["Preferred_Language", "Language", "Lang"])) : "";
  const phoneFromUsers = userRow ? toText(pick(userRow, ["Phone_E164", "Phone", "Mobile", "Phone_Number"])) : "";
  const phoneFallback = toText((user as any)?.phone || (user as any)?.phoneNumber || (user as any)?.mobile);
  const phone = phoneFromUsers || phoneFallback;

  const initials = useMemo(() => {
    const n = displayNameOnFile || toText((user as any)?.name || (user as any)?.fullName);
    if (n) {
      return n
        .split(" ")
        .filter(Boolean)
        .map((x) => x[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }
    const em = toText((user as any)?.email);
    return (em?.[0] || "R").toUpperCase();
  }, [displayNameOnFile, user]);

  const thinGray: CSSProperties = { color: "rgba(229,231,235,0.55)", fontWeight: 500 };
  const esGray: CSSProperties = { ...thinGray, fontStyle: "italic" };

  const cardStyle: CSSProperties = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 52px rgba(0,0,0,0.40)",
    backdropFilter: "blur(8px)",
  };

  const rowStyle: CSSProperties = {
    padding: "14px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    cursor: "pointer",
    borderRadius: 14,
  };

  const rowHover = (e: any, on: boolean) => {
    e.currentTarget.style.background = on ? "rgba(255,255,255,0.03)" : "transparent";
  };

  const openUserUpdateRequest = () => {
    const em = toText((user as any)?.email);
    const href =
      routes.userUpdateNew +
      `?loginEmail=${encodeURIComponent(em || "")}` +
      `&crewId=${encodeURIComponent(crewId || "")}` +
      `&role=${encodeURIComponent(role || "")}` +
      `&phone=${encodeURIComponent(phone || "")}` +
      `&language=${encodeURIComponent(language || "")}`;
    nav(href);
  };

  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6" style={{ paddingTop: 12, paddingBottom: 12 }}>
      {/* Account */}
      <Card className="rounded-2xl" style={cardStyle}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white truncate">
            Account <span style={thinGray}>|</span> <span style={esGray}>cuenta</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-start gap-3 py-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-lg"
              style={{ background: "rgba(0,233,239,0.12)", border: "1px solid rgba(0,233,239,0.20)", color: "rgba(0,233,239,0.95)" }}
            >
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate text-white">{displayNameOnFile || "—"}</div>
              <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.60)" }}>
                Display name
              </div>
            </div>

            <Button
              variant="outline"
              className="h-10 px-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.12)", color: "rgba(229,231,235,0.92)" }}
              onClick={() => nav(routes.editName)}
              title="Edit display name"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>

          <div className="h-px" style={{ background: "rgba(255,255,255,0.08)" }} />

          <div className="py-4 flex items-start gap-3">
            <Mail className="w-5 h-5 mt-0.5" style={{ color: "rgba(229,231,235,0.75)" }} />
            <div className="min-w-0">
              <div className="text-sm truncate text-white">{toText((user as any)?.email) || "—"}</div>
              <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.55)" }}>
                Login email
              </div>
            </div>
          </div>

          <div className="h-px" style={{ background: "rgba(255,255,255,0.08)" }} />

          <div className="py-4 flex items-start gap-3">
            <Phone className="w-5 h-5 mt-0.5" style={{ color: "rgba(229,231,235,0.75)" }} />
            <div className="min-w-0">
              <div className="text-sm truncate text-white">{phone || "—"}</div>
              <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.55)" }}>
                Phone <span style={thinGray}>|</span> <span style={esGray}>teléfono</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work info */}
      <div style={{ height: 14 }} />

      <Card className="rounded-2xl" style={cardStyle}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white truncate">
            Work info <span style={thinGray}>|</span> <span style={esGray}>trabajo</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="py-4 flex items-start gap-3">
            <UserIcon className="w-5 h-5 mt-0.5" style={{ color: "rgba(229,231,235,0.80)" }} />
            <div className="min-w-0">
              <div className="text-sm text-white">Role: {role || "—"}</div>
              <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.55)" }}>
                Permissions derive from your role + flags.
              </div>
            </div>
          </div>

          <div className="h-px" style={{ background: "rgba(255,255,255,0.08)" }} />

          <div className="py-4 flex items-start gap-3">
            <Building2 className="w-5 h-5 mt-0.5" style={{ color: "rgba(0,233,239,0.75)" }} />
            <div className="min-w-0">
              <div className="text-sm text-white">Crew: {crewId || "—"}</div>
              <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.55)" }}>
                Used for Today/Stops routing.
              </div>
            </div>
          </div>

          <div className="h-px" style={{ background: "rgba(255,255,255,0.08)" }} />

          <div className="py-4 flex items-start gap-3">
            <Globe className="w-5 h-5 mt-0.5" style={{ color: "rgba(229,231,235,0.75)" }} />
            <div className="min-w-0">
              <div className="text-sm text-white">Language: {language || "—"}</div>
              <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.55)" }}>
                Preferred language.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div style={{ height: 14 }} />

      <Card className="rounded-2xl" style={cardStyle}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white truncate">
            Actions <span style={thinGray}>|</span> <span style={esGray}>acciones</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          <div
            style={{ ...rowStyle, borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            onClick={() => nav(routes.editName)}
            onMouseEnter={(e) => rowHover(e, true)}
            onMouseLeave={(e) => rowHover(e, false)}
            title="Edit display name only"
          >
            <div className="flex items-start gap-3 min-w-0">
              <Pencil className="w-5 h-5 mt-0.5" style={{ color: "rgba(0,233,239,0.95)" }} />
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate text-white">Edit display name</div>
                <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.55)" }}>
                  Quick change (name only).
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5" style={{ color: "rgba(0,233,239,0.95)" }} />
          </div>

          <div
            style={rowStyle}
            onClick={openUserUpdateRequest}
            onMouseEnter={(e) => rowHover(e, true)}
            onMouseLeave={(e) => rowHover(e, false)}
            title="Request changes for phone, role, crew, language, etc."
          >
            <div className="flex items-start gap-3 min-w-0">
              <UserIcon className="w-5 h-5 mt-0.5" style={{ color: "rgba(229,231,235,0.80)" }} />
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate text-white">Request update</div>
                <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.55)" }}>
                  For anything other than your name.
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5" style={{ color: "rgba(0,233,239,0.95)" }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}