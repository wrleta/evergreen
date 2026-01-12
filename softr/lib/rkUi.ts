export const nav = (path: string) => { window.location.href = path; };

export const getParam = (k: string) => {
  try { return new URLSearchParams(window.location.search).get(k); }
  catch { return null; }
};

export const shouldShowSpanish = () => false;

export const RGB = {
  accent: [0, 233, 239] as const,
  text: [229, 231, 235] as const,
  white: [255, 255, 255] as const,
};

export const rgba = (r:number,g:number,b:number,a:number) => `rgba(${r},${g},${b},${a})`;
