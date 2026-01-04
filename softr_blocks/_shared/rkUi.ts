// softr_blocks/_shared/rkUi.ts
// Canonical UI tokens + helpers for RK Field Reporting Portal
// BG #0B1020 | Accent #00E9EF | Text #E5E7EB

export const RK_BG = "#0B1020";
export const RK_ACCENT = "#00E9EF";
export const RK_TEXT = "#E5E7EB";

// rgb helpers (for alpha variants)
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

// ---- data helpers ----
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

// ---- chips (your reconciled system) ----
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

export const counterChipStyle = (kind: ChipKind, n: number) => {
  const rgb = CHIP_RGB[kind];
  const active = Number(n) > 0;
  const bgA = active ? 0.14 : 0.06;
  const brA = active ? 0.30 : 0.14;
  const text = active ? rgba(rgb, 0.95) : rgba(RGB.text, 0.62);
  return {
    background: rgba(rgb, bgA),
    border: `1px solid ${rgba(rgb, brA)}`,
    color: text,
    boxShadow: active ? `0 0 0 2px ${rgba(rgb, 0.10)}` : undefined,
  } as const;
};
