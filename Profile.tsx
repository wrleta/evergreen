import { useMemo, type CSSProperties } from "react";
import { useCurrentUser } from "@/lib/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  Globe,
  Shield,
  Pencil,
  ChevronRight,
  Home,
  Info,
  Calendar,
  Bell,
  FileText,
  User,
} from "lucide-react";

/**
 * PROFILE / PERFIL (Reporter+)
 * Updates per newest intent:
 * - Banner matches newest format (FIELD REPORTING SYSTEM + avatar, no Home in banner)
 * - Title uses bilingual formatting: "Profile | perfil" (Spanish muted + italic)
 * - Nav row is: Edit (name) + Home + Today + FAQ (equidistant)
 * - Worker term updated to Reporter (labels + fallback role)
 * - Direct edit lane for Display Name only via routes.profileEdit
 * - All other edits go through User Update Requests
 * - Divider rows (no nested cards)
 */
export default function Block(props: any) {
  const user = useCurrentUser();

  // Accept whatever Softr passes (users / records / items)
  const users = Array.isArray(props?.users)
    ? props.users
    : Array.isArray(props?.records)
    ? props.records
    : Array.isArray(props?.items)
    ? props.items
    : [];

  // 🔧 Align these slugs to your Softr pages
  const routes = {
    home: "/home",
    today: "/today",
    faq: "/faq",

    // Softr page that edits ONLY Display_Name (lock all other fields)
    profileEdit: "/user-update-requests",

    userUpdateNew: "/user-update-requests",
    officeReview: "/office-review",
    reports: "/reports",
    profile: "/profile",
    bulletins: "/bulletins",

  };

  const logoUrl = ""; // optional

  const nav = (href: string) =>(window.location.href = href);
  const toText = (v: any) =>(v === undefined || v === null ? "" : String(v));

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

  const userEmail = useMemo(
    () => toText((user as any)?.email).toLowerCase(),
    [user]
  );

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

  // ---------- VISUAL (match newest pages) ----------
  const bg: CSSProperties = {
    background:
      "radial-gradient(900px 520px at 18% -12%, rgba(0,233,239,0.14), transparent 62%)," +
      "radial-gradient(900px 520px at 88% -6%, rgba(251,191,36,0.10), transparent 60%)," +
      "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.00) 30%)," +
      "#0B1020",
    color: "#E5E7EB",
    minHeight: "100vh",
  };

  const banner: CSSProperties = {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.00) 60%), #000",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  };

  const accentLine: CSSProperties = {
    height: 2,
    background:
      "linear-gradient(90deg, rgba(0,233,239,0.95), rgba(0,233,239,0.25) 35%, rgba(251,191,36,0.22) 70%, rgba(251,191,36,0.70))",
    boxShadow:
      "0 0 0 1px rgba(255,255,255,0.04) inset, 0 6px 20px rgba(0,233,239,0.10)",
  };

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

  // Spanish when muted/gray => italic (per your rule)
  const esGray: CSSProperties = {
    ...thinGray,
    fontStyle: "italic",
  };

  const clamp1: CSSProperties = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

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

  // ---------- DATA (Portal_Users row) ----------
  const userRow = useMemo(() => {
    if (!users?.length) return null;
    if (!userEmail) return users[0];

    const emailKeys = ["Login_Email", "Email", "User_Email", "Reporter_Email", "Worker_Email"];
    const found = users.find(
      (r: any) => toText(pick(r, emailKeys)).toLowerCase() === userEmail
    );
    return found || users[0];
  }, [users, userEmail]);

  const reporterId = userRow
    ? toText(pick(userRow, ["Reporter_ID", "Worker_ID", "Employee_ID", "ID"]))
    : "";

  const displayNameOnFile = userRow
    ? toText(
        pick(userRow, [
          "Display_Name",
          "Reporter_Name",
          "Worker_Name",
          "Name",
          "Full_Name",
        ])
      )
    : "";

  const phoneFromUsers = userRow
    ? toText(pick(userRow, ["Phone", "Phone_E164", "Mobile", "Phone_Number"]))
    : "";

  const roleFromUsers = userRow
    ? toText(pick(userRow, ["Role", "UserGroup", "Auth_Level"]))
    : "";

  const crewId = userRow ? toText(pick(userRow, ["Crew_ID", "Crew", "CrewId"])) : "";
  const language = userRow
    ? toText(pick(userRow, ["Language", "Lang", "Preferred_Language"]))
    : "";

  const email = toText((user as any)?.email);
  const phoneFallback = toText(
    (user as any)?.phone || (user as any)?.phoneNumber || (user as any)?.mobile
  );
  const phone = phoneFromUsers || phoneFallback;

  const role = roleFromUsers || (isOffice ? "Office+" : "Reporter");

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
    return (email?.[0] || "R").toUpperCase();
  }, [displayNameOnFile, user, email]);

  // Direct edit for Display Name only
  const openEditName = () => {
    const id = toText(pick(userRow, ["id", "ID", "User_ID", "__ROW_NUMBER__"]));
    const href =
      routes.profileEdit +
      `?id=${encodeURIComponent(id || "")}` +
      `&loginEmail=${encodeURIComponent(email || "")}` +
      `&reporterId=${encodeURIComponent(reporterId || "")}`;
    nav(href);
  };

  // Request change for anything else
  const openUserUpdateRequest = () => {
    const href =
      routes.userUpdateNew +
      `?loginEmail=${encodeURIComponent(email || "")}` +
      `&reporterId=${encodeURIComponent(reporterId || "")}` +
      `&reporterName=${encodeURIComponent(displayNameOnFile || displayName || "")}` +
      `&crewId=${encodeURIComponent(crewId || "")}` +
      `&role=${encodeURIComponent(role || "")}` +
      `&phone=${encodeURIComponent(phone || "")}` +
      `&language=${encodeURIComponent(language || "")}`;
    nav(href);
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

  // Not logged in guard
  if (!user) {
    return (
      <div className="min-h-screen" style={bg}>
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
            </div>
          </div>
          <div style={accentLine} />
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-10">
          <div className="flex flex-col items-center justify-center text-center">
            <UserIcon
              className="w-20 h-20"
              style={{
                color: "rgba(0,233,239,0.55)",
                filter: "drop-shadow(0 0 12px rgba(0,233,239,0.30))",
              }}
            />
            <div className="mt-5 text-sm" style={{ color: "rgba(229,231,235,0.75)" }}>
              Please log in to view your profile.
            </div>

            <Button
              className="mt-6 h-11 rounded-xl font-semibold"
              style={{ background: "rgba(0,233,239,0.95)", color: "#0b1020" }}
              onClick={() => nav(routes.home)}
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={bg}>
      {/* Banner (NEW format, no Home button here) */}
      <header style={banner}>
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3 min-w-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="RK"
                  className="w-11 h-11 rounded-2xl object-contain"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
                  }}
                />
              ) : (
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
              )}

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
               onClick={() => nav(routes.profile)}>
                {(user as any)?.avatarUrl ? (
                  <img
                    src={(user as any).avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div style={accentLine} />
      </header>

      <main
        className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 space-y-5"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        {/* Title strip (match Reports style) */}
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-2xl font-extrabold leading-tight truncate">
                Profile <span style={thinGray}>|</span>{" "}
                <span style={thinGray}>perfil</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              {reporterId ? (
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "rgba(229,231,235,0.85)",
                  }}
                >
                  Reporter ID: {reporterId}
                </span>
              ) : null}
              {crewId ? (
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "rgba(229,231,235,0.85)",
                  }}
                >
                  Crew: {crewId}
                </span>
              ) : null}
            </div>
          </div>

          {/* Nav row: Edit (name) + Home + Today + FAQ (equidistant) */}
          <div className="grid grid-cols-4 items-center" style={{ paddingTop: 10, gap: 8 }}>
            <button
              style={linkBtn}
              onClick={openEditName}
              onMouseEnter={(e) =>(e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) =>(e.currentTarget.style.textDecoration = "none")}
              title="Edit display name"
            >
              <Pencil className="w-4 h-4" />
              <span style={{ fontWeight: 800 }}>
                Edit <span style={thinGray}>(name)</span>
              </span>
            </button>

            <button
              style={{ ...linkBtn, justifySelf: "center" as any }}
              onClick={() => nav(routes.reports)}
              onMouseEnter={(e) =>(e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) =>(e.currentTarget.style.textDecoration = "none")}
            >
              <FileText className="w-4 h-4" />
              Reports
            </button>

            <button
              style={{ ...linkBtn, justifySelf: "center" as any }}
              onClick={() => nav(routes.today)}
              onMouseEnter={(e) =>(e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) =>(e.currentTarget.style.textDecoration = "none")}
            >
              <Calendar className="w-4 h-4" />
              Today
            </button>

            <button
              style={{ ...linkBtn, justifySelf: "end" as any }}
              onClick={() => nav(routes.faq)}
              onMouseEnter={(e) =>(e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) =>(e.currentTarget.style.textDecoration = "none")}
            >
              <Info className="w-4 h-4" />
              FAQ
            </button>
          </div>
        </div>

        {/* Account */}
        <Card className="rounded-2xl" style={cardStyle}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white truncate">
              Account <span style={thinGray}>|</span>{" "}
              <span style={thinGray}>cuenta</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="flex items-start gap-3 py-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-lg"
                style={{
                  background: "rgba(0,233,239,0.12)",
                  border: "1px solid rgba(0,233,239,0.20)",
                  color: "rgba(0,233,239,0.95)",
                }}
              >
                {initials}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate text-white">
                  {displayNameOnFile || displayName}
                </div>
                <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.60)" }}>
                  Display name
                </div>
              </div>

              <Button
                variant="outline"
                className="h-10 px-3 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.12)",
                  color: "rgba(229,231,235,0.92)",
                }}
                onClick={openEditName}
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
                <div className="text-sm truncate text-white">{email || "—"}</div>
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
                  Phone <span style={thinGray}>|</span>{" "}
                  <span style={esGray}>teléfono</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work info */}
        <Card className="rounded-2xl" style={cardStyle}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white truncate">
              Work info <span style={thinGray}>|</span>{" "}
              <span style={esGray}>trabajo</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="py-4 flex items-start gap-3">
              <Shield className="w-5 h-5 mt-0.5" style={{ color: "rgba(251,191,36,0.90)" }} />
              <div className="min-w-0">
                <div className="text-sm text-white">Role: {role || "—"}</div>
                <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.55)" }}>
                  Office+ unlocks admin tools.
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
                  Language preference.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="rounded-2xl" style={cardStyle}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white truncate">
              Actions <span style={thinGray}>|</span>{" "}
              <span style={thinGray}>acciones</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-0">
            <div
              style={{ ...rowStyle, borderBottom: "1px solid rgba(255,255,255,0.08)" }}
              onClick={openEditName}
              onMouseEnter={(e) => rowHover(e, true)}
              onMouseLeave={(e) => rowHover(e, false)}
              title="Edit display name only"
            >
              <div className="flex items-start gap-3 min-w-0">
                <Pencil className="w-5 h-5 mt-0.5" style={{ color: "rgba(0,233,239,0.95)" }} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate text-white">
                    Edit display name <span style={thinGray}>|</span>{" "}
                    <span style={thinGray}>editar nombre</span>
                  </div>
                  <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.55)" }}>
                    Quick change (name only).
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: "rgba(0,233,239,0.95)" }} />
            </div>

            <div
              style={{
                ...rowStyle,
                borderBottom: isOffice ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}
              onClick={openUserUpdateRequest}
              onMouseEnter={(e) => rowHover(e, true)}
              onMouseLeave={(e) => rowHover(e, false)}
              title="Request changes for phone, role, crew, language, etc."
            >
              <div className="flex items-start gap-3 min-w-0">
                <UserIcon className="w-5 h-5 mt-0.5" style={{ color: "rgba(229,231,235,0.80)" }} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate text-white">
                    Request update <span style={thinGray}>|</span>{" "}
                    <span style={thinGray}>solicitar cambio</span>
                  </div>
                  <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.55)" }}>
                    For anything other than your name.
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: "rgba(0,233,239,0.95)" }} />
            </div>

            {isOffice ? (
              <div
                style={rowStyle}
                onClick={() => nav(routes.officeReview)}
                onMouseEnter={(e) => rowHover(e, true)}
                onMouseLeave={(e) => rowHover(e, false)}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <Shield className="w-5 h-5 mt-0.5" style={{ color: "rgba(251,191,36,0.95)" }} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate text-white">
                      Office Review Queue
                    </div>
                    <div className="text-xs mt-1" style={{ color: "rgba(229,231,235,0.55)" }}>
                      Review pending edits and submissions.
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5" style={{ color: "rgba(0,233,239,0.95)" }} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      
        {/* Quick actions (must be LAST card) */}
        <Card className="rounded-2xl" style={cardStyle}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">
              Quick actions <span style={thinGray}>|</span>{" "}
              <span style={thinGray}>acciones rápidas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div style={{borderTop: "1px solid rgba(255,255,255,0.08)"}}>
              <button
                type="button"
                className="w-full flex items-center justify-between py-3"
                style={{cursor: "pointer"}}
                onClick={() => nav(routes.reports)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{background: "rgba(0,233,239,0.12)", border: "1px solid rgba(0,233,239,0.22)"}}
                  >
                    <FileText className="w-4 h-4" style={{color: "rgba(0,233,239,0.96)"}} />
                  </div>
                  <div className="text-sm font-semibold text-white truncate">
                    Reports <span style={thinGray}>|</span>{" "}
                    <span style={thinGray}>reportes</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" style={{color: "rgba(229,231,235,0.55)"}} />
              </button>

              <div style={{borderTop: "1px solid rgba(255,255,255,0.08)"}} />

              <button
                type="button"
                className="w-full flex items-center justify-between py-3"
                style={{cursor: "pointer"}}
                onClick={() => nav(routes.today)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.22)"}}
                  >
                    <Calendar className="w-4 h-4" style={{color: "rgba(251,191,36,0.92)"}} />
                  </div>
                  <div className="text-sm font-semibold text-white truncate">
                    Today <span style={thinGray}>|</span>{" "}
                    <span style={thinGray}>hoy</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" style={{color: "rgba(229,231,235,0.55)"}} />
              </button>

              <div style={{borderTop: "1px solid rgba(255,255,255,0.08)"}} />

              <button
                type="button"
                className="w-full flex items-center justify-between py-3"
                style={{cursor: "pointer"}}
                onClick={() => nav(routes.faq)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)"}}
                  >
                    <Info className="w-4 h-4" style={{color: "rgba(229,231,235,0.90)"}} />
                  </div>
                  <div className="text-sm font-semibold text-white truncate">
                    FAQ <span style={thinGray}>|</span>{" "}
                    <span style={thinGray}>ayuda</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" style={{color: "rgba(229,231,235,0.55)"}} />
              </button>

              <div style={{borderTop: "1px solid rgba(255,255,255,0.08)"}} />

              <button
                type="button"
                className="w-full flex items-center justify-between py-3"
                style={{cursor: "pointer"}}
                onClick={() => nav(routes.bulletins)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{background: "rgba(0,233,239,0.08)", border: "1px solid rgba(0,233,239,0.18)"}}
                  >
                    <Bell className="w-4 h-4" style={{color: "rgba(0,233,239,0.86)"}} />
                  </div>
                  <div className="text-sm font-semibold text-white truncate">
                    Bulletins <span style={thinGray}>|</span>{" "}
                    <span style={thinGray}>boletines</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" style={{color: "rgba(229,231,235,0.55)"}} />
              </button>

              <div style={{borderTop: "1px solid rgba(255,255,255,0.08)"}} />

              <button
                type="button"
                className="w-full flex items-center justify-between py-3"
                style={{cursor: "pointer"}}
                onClick={() => nav(routes.profile)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)"}}
                  >
                    <User className="w-4 h-4" style={{color: "rgba(229,231,235,0.90)"}} />
                  </div>
                  <div className="text-sm font-semibold text-white truncate">
                    Profile <span style={thinGray}>|</span>{" "}
                    <span style={thinGray}>perfil</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" style={{color: "rgba(229,231,235,0.55)"}} />
              </button>

              {isOffice ? (
                <>
                  <div style={{borderTop: "1px solid rgba(255,255,255,0.08)"}} />
                  <button
                    type="button"
                    className="w-full flex items-center justify-between py-3"
                    style={{cursor: "pointer"}}
                    onClick={() => nav(routes.officeReview)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.18)"}}
                      >
                        <Shield className="w-4 h-4" style={{color: "rgba(251,191,36,0.92)"}} />
                      </div>
                      <div className="text-sm font-semibold text-white truncate">
                        Office review <span style={thinGray}>|</span>{" "}
                        <span style={thinGray}>oficina</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4" style={{color: "rgba(229,231,235,0.55)"}} />
                  </button>
                </>
              ) : null}
            </div>
          </CardContent>
        </Card>

</main>
    </div>
  );
}