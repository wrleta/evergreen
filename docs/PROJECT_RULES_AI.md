# FILE: docs/PROJECT_RULES_AI.md

PROJECT RULES — RK Field Reporting Portal (Softr TSX Blocks)

You are writing or refactoring TSX for the RK Field Reporting Portal in Softr Custom Code blocks.
These are PROJECT RULES. Apply them to the script you generate unless clearly not applicable.

CANONICAL BASE TOKENS (do not change unless asked)
- Background (global Softr/app): #0B1020
- Accent: #00E9EF
- Text: #E5E7EB
- Use rgba() alpha variants for glass + chips (do not invent a new palette).

A) MULTI-BLOCK SKELETON (CRITICAL)
- Block 0 = Global Top Banner (TSX) only. No other block renders banner/breadcrumb.
- Block 1 = Page Header (TSX; bilingual for Reporter, English-only for Manager+)
- Block 2 = Main Content (TSX list/detail OR Softr native Form/List)
- Block Z = Global Bottom Nav (TSX) only. Quicklinks live here (not inside content blocks).

B) BACKGROUND OWNERSHIP
- The page background is set globally in Softr (dark navy #0B1020).
- TSX blocks must default to transparent surfaces; DO NOT paint full-page backgrounds.
- Never use min-h-screen / minHeight:100vh / height:100vh in blocks.

C) GLASS UI RULES
- One main card per block, avoid nested cards.
- Use translucent card surfaces (white @ 0.03–0.05), hairline borders, blur, deep soft shadow.
- Use divider rows inside cards rather than card-in-card.

D) BILINGUAL RULES
- No Spanish in the top banner.
- Title format: English first, then “ | español” as secondary.
- Spanish is muted gray + thinner weight.
- Italic is ONLY for Spanish translation when it is muted/gray and follows English.
- Do not italicize punctuation (parentheses “(All)” remain normal).

E) COUNTERS / CHIPS (NOT A SKITTLES BAG)
- All counters keep their status tint (translucent) so meaning is consistent.
- If count = 0: same tint but very low opacity; border/text muted.
- If count > 0: higher opacity + brighter border + status-color text; optional subtle glow.
- Use the canonical helper: counterChipStyle(kind, n). Do not hand-roll new chip logic.

F) DATA SHAPE ROBUSTNESS (SOFTR REALITY)
- Lists can come as props.items / props.records / page-specific props.
- Records can store fields in obj / obj.fields / obj.attributes / obj.record / obj.record.fields.
- Implement a tolerant pick() and safe toText().

G) PERMISSIONS
- If user is NOT office/admin, filter lists to their own (logged-in email). Keep blank-email legacy rows visible.
- Office/admin can see full queues/lists.

H) NAV + URL PARAMS
- Use window.location.href for navigation.
- Use URL params for context/prefill when applicable (stop_id, jobsite_id, etc.).
- Bottom nav hides the current page slug.

OUTPUT
- Provide copy/paste-ready TSX for Softr.
- If building a page, output blocks explicitly: Block 0, Block 1, Block 2, Block Z.
- Reuse rkUi.snippet.ts tokens/helpers (do not create a new token system).


# FILE: docs/UI_TOKENS.md

RK UI TOKENS + CONTRAST + COUNTER CHIPS (CANONICAL)

Base:
- BG: #0B1020
- Accent: #00E9EF (RGB 0,233,239)
- Text: #E5E7EB (RGB 229,231,235)

Contrast ladder (dark → light) on BG #0B1020:
- Page bg: #0B1020
- Card surface: rgba(255,255,255,0.03–0.05)
- Divider: rgba(255,255,255,0.08)
- Muted text: rgba(229,231,235,0.55–0.70)
- Primary text: rgba(229,231,235,0.82–0.92)
- Accent/status text (active chips): status color @ ~0.95
Note: The lightest elements are text and borders, not chip fills.

Status palette (fixed):
- Cyan (Total / In Progress): 0,233,239
- Amber (Open / Pending / Unread): 251,191,36
- Red (Insufficient / Rejected / Follow-up): 239,68,68
- Green (Reported / Approved): 16,185,129
- Closed: neutral (255,255,255) — preferred for “archived/done” vs “approved=green”

Counter chip rule:
- Always tinted (legend consistency).
- count=0 (quiet): bgA 0.06, brA 0.14, text muted gray rgba(229,231,235,0.62)
- count>0 (active): bgA 0.14, brA 0.30, text status color @0.95, optional glow 0 0 0 2px rgba(status,0.10)

Use counterChipStyle(kind,n) everywhere for pills/counters.


# FILE: softr_blocks/_shared/rkUi.snippet.ts
// RK UI SNIPPET (copy/paste into Softr TSX blocks)
// BG #0B1020 | Accent #00E9EF | Text #E5E7EB

import type { CSSProperties } from "react";

export const RK_BG = "#0B1020";
export const RK_ACCENT = "#00E9EF";
export const RK_TEXT = "#E5E7EB";

export const RGB = {
  accent: [0, 233, 239] as const,
  text: [229, 231, 235] as const,
  white: [255, 255, 255] as const,
  pending: [251, 191, 36] as const,
  reported: [16, 185, 129] as const,
  insufficient: [239, 68, 68] as const,
} as const;

export const rgba = (rgb: readonly [number, number, number], a: number) =>
  `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;

export const toText = (v: any) => (v === undefined || v === null ? "" : String(v));

export const pick = (obj: any, ...keys: string[]) => {
  const o = obj || {};
  const candidates = [o, o.fields, o.attributes, o.record, o.record?.fields].filter(Boolean);
  for (const k of keys) {
    for (const c of candidates) {
      if (c && c[k] !== undefined && c[k] !== null) return c[k];
    }
  }
  return undefined;
};

export const nav = (href: string) => (window.location.href = href);

export const getParam = (name: string) =>
  new URLSearchParams(window.location.search).get(name) || "";

export const pageSurface: CSSProperties = {
  background: "transparent",
  color: RK_TEXT,
};

export const cardStyle: CSSProperties = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.028) 100%)",
  border: `1px solid ${rgba(RGB.white, 0.10)}`,
  boxShadow: "0 18px 52px rgba(0,0,0,0.40)",
  backdropFilter: "blur(8px)",
};

export const rowDivider: CSSProperties = { borderTop: `1px solid ${rgba(RGB.white, 0.08)}` };

export const thinGray: CSSProperties = { color: rgba(RGB.text, 0.55), fontWeight: 500 };
export const esGrayItalic: CSSProperties = { ...thinGray, fontStyle: "italic" };

export const primaryBtn: CSSProperties = {
  background: RK_ACCENT,
  color: RK_BG,
  boxShadow: `0 0 0 2px ${rgba(RGB.accent, 0.10)}, 0 10px 30px rgba(0,0,0,0.35)`,
};

export const outlineBtn: CSSProperties = {
  background: rgba(RGB.white, 0.03),
  border: `1px solid ${rgba(RGB.white, 0.12)}`,
  color: RK_TEXT,
};

export type ChipKind =
  | "total"
  | "pending"
  | "inprogress"
  | "reported"
  | "insufficient"
  | "closed";

export const CHIP_RGB: Record<ChipKind, readonly [number, number, number]> = {
  total: RGB.accent,
  pending: RGB.pending,
  inprogress: RGB.accent,
  reported: RGB.reported,
  insufficient: RGB.insufficient,
  closed: RGB.white,
};

export const counterChipStyle = (kind: ChipKind, n: number): CSSProperties => {
  const rgb = CHIP_RGB[kind];
  const active = Number(n) > 0;
  const bgA = active ? 0.14 : 0.06;
  const brA = active ? 0.30 : 0.14;
  const text = active ? rgba(rgb, 0.95) : "rgba(229,231,235,0.62)";
  return {
    background: rgba(rgb, bgA),
    border: `1px solid ${rgba(rgb, brA)}`,
    color: text,
    boxShadow: active ? `0 0 0 2px ${rgba(rgb, 0.10)}` : undefined,
  };
};

// Role helpers (tolerant; adjust keywords if your roles are named differently)
export type RoleTier = "field" | "manager" | "office" | "admin";

export const roleTier = (user: any): RoleTier => {
  const raw =
    (user?.roleTier || user?.role || user?.title || "")
      .toString()
      .toLowerCase();

  const roles: string[] = Array.isArray(user?.roles)
    ? user.roles.map((r: any) => (r?.name || r?.title || r).toString().toLowerCase())
    : [];

  const hay = [raw, ...roles].join(" ");

  if (hay.includes("admin")) return "admin";
  if (hay.includes("office")) return "office";
  if (hay.includes("manager") || hay.includes("lead") || hay.includes("super")) return "manager";
  return "field";
};

export const isManagerPlus = (user: any) => {
  const t = roleTier(user);
  return t === "manager" || t === "office" || t === "admin";
};

export const isOfficePlus = (user: any) => {
  const t = roleTier(user);
  return t === "office" || t === "admin";
};
