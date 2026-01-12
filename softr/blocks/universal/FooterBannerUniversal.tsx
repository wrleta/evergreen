import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

const RK_FOOT_CSS = `
.rk-foot{
  --rk-bg: #000;
  --rk-glass: linear-gradient(180deg, rgba(255,255,255,.035) 0%, rgba(255,255,255,.010) 55%, rgba(255,255,255,.00) 100%);
  --rk-accent: #00E9EF;
  --rk-text: rgba(255,255,255,.90);
  --rk-muted: rgba(255,255,255,.52);
  --rk-muted-2: rgba(255,255,255,.42);
  --rk-border: rgba(255,255,255,.08);
  --rk-border-2: rgba(255,255,255,.06);
}

.rk-foot-wrap{
  width: 100%;
  background: var(--rk-bg);
  background-image: var(--rk-glass);
  border-top: 1px solid var(--rk-border);
  box-shadow: 0 -10px 38px rgba(0,0,0,.55);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.rk-foot-inner{
  width: 100%;
  max-width: 72rem;
  margin: 0 auto;
  padding: 16px 14px;
}

@media (min-width: 640px){
  .rk-foot-inner{ padding: 24px 24px; }
}

@media (min-width: 1024px){
  .rk-foot-inner{ padding: 28px 32px; }
}

.rk-foot-top{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.rk-brand{
  font-size: 11.5px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: rgba(255,255,255,.58);
  font-weight: 650;
  white-space: nowrap;
}

@media (min-width: 640px){
  .rk-brand{ font-size: 12px; }
}

.rk-year{
  font-size: 12px;
  color: rgba(255,255,255,.38);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.rk-disclaimer{
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--rk-muted);
  text-align: center;
  overflow: hidden;
  transition: max-height .28s ease, opacity .28s ease, margin .28s ease;
  margin: 0 0 12px;
}

@media (min-width: 640px){
  .rk-disclaimer{ font-size: 12px; }
}

@media (min-width: 768px){
  .rk-disclaimer{ font-size: 12.5px; }
}

.rk-disclaimer.collapsed{
  max-height: 0;
  opacity: 0;
  margin: 0;
}

.rk-disclaimer.expanded{
  max-height: 220px;
  opacity: 1;
  margin: 0 0 12px;
}

@media (min-width: 1024px){
  .rk-disclaimer{
    max-height: 220px;
    opacity: 1;
    margin: 0 0 12px;
  }
  .rk-disclaimer.collapsed,
  .rk-disclaimer.expanded{
    max-height: 220px;
    opacity: 1;
    margin: 0 0 12px;
  }
}

.rk-disclaimer .rk-spanish{
  color: rgba(255,255,255,.40);
  font-weight: 300;
  font-style: italic;
}

.rk-toggle{
  appearance: none;
  background: rgba(0,0,0,.35);
  border: 1px solid var(--rk-border-2);
  padding: 8px 10px;
  border-radius: 14px;
  cursor: pointer;
  color: rgba(255,255,255,.46);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
  box-shadow: 0 10px 26px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.05);
  transition: color .2s ease, border-color .2s ease, box-shadow .2s ease, background .2s ease;
}

.rk-toggle:hover{
  color: rgba(255,255,255,.62);
  border-color: rgba(0,233,239,.22);
  background: rgba(0,0,0,.48);
  box-shadow: 0 12px 34px rgba(0,0,0,.55), 0 0 0 2px rgba(0,233,239,.10), inset 0 1px 0 rgba(255,255,255,.06);
}

@media (min-width: 1024px){
  .rk-toggle{ display: none; }
}

.rk-toggle-icon{
  transition: transform .28s ease;
}

.rk-toggle-icon.rotated{
  transform: rotate(180deg);
}

.rk-links{
  display: none;
  gap: 16px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  padding-top: 14px;
  border-top: 1px solid var(--rk-border-2);
}

@media (min-width: 768px){
  .rk-links{ display: flex; }
}

.rk-link{
  appearance: none;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  color: rgba(255,255,255,.52);
  font-size: 12px;
  letter-spacing: .01em;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: color .2s ease, transform .2s ease;
}

.rk-link:hover{
  color: var(--rk-accent);
  transform: translateY(-1px);
}

.rk-dot{
  width: 3px;
  height: 3px;
  border-radius: 999px;
  background: rgba(0,233,239,.65);
  box-shadow: 0 0 10px rgba(0,233,239,.22);
  opacity: .85;
}

.rk-bilingual{
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  white-space: nowrap;
}

.rk-en{ font-weight: 650; color: rgba(255,255,255,.86); }
.rk-sep{ color: rgba(229,231,235,.36); font-weight: 500; }
.rk-es{ font-weight: 450; color: rgba(255,255,255,.46); }
`;

export default function Block() {
  const [isExpanded, setIsExpanded] = useState(false);

  const year = useMemo(() => {
    try {
      return String(new Date().getFullYear());
    } catch {
      return "";
    }
  }, []);

  const nav = (href: string) => {
    if (typeof window !== "undefined") window.location.href = href;
  };

  const focusSearch = () => nav("/home?focus=1");

  const openMap = () => {
    if (typeof window === "undefined") return;
    const q = encodeURIComponent("920 W Jericho Tpke, Smithtown, NY 11787");
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${q}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="rk-foot rk-foot-wrap">
      <style>{RK_FOOT_CSS}</style>

      <div className="rk-foot-inner">
        <div className="rk-foot-top">
          <div className="rk-brand">RK Field Reporting</div>
          <div className="rk-year">© {year}</div>
        </div>

        <button
          className="rk-toggle"
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          aria-expanded={isExpanded}
          aria-label="Toggle disclaimer"
        >
          <svg
            className={`rk-toggle-icon ${isExpanded ? "rotated" : ""}`}
            width="14"
            height="9"
            viewBox="0 0 14 9"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M1 1L7 7L13 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className={`rk-disclaimer ${isExpanded ? "expanded" : "collapsed"}`}>
          Internal tool only. Verify critical details before acting. Counts and previews may lag a few minutes.
          <br />
          <span className="rk-spanish">
            Solo uso interno. Verifica datos críticos antes de actuar. Los conteos y vistas previas pueden retrasarse unos minutos.
          </span>
        </div>

        <div className="rk-links" aria-label="Footer quick links">
          <button className="rk-link" type="button" onClick={() => nav("/faq")}>
            <span className="rk-dot" aria-hidden="true" />
            <span className="rk-bilingual">
              <span className="rk-en">FAQ</span>
              <span className="rk-sep">|</span>
              <span className="rk-es">preguntas</span>
            </span>
          </button>

          <button className="rk-link" type="button" onClick={focusSearch}>
            <span className="rk-dot" aria-hidden="true" />
            <span className="rk-bilingual">
              <span className="rk-en">Focus Search</span>
              <span className="rk-sep">|</span>
              <span className="rk-es">buscar</span>
            </span>
          </button>

          <button className="rk-link" type="button" onClick={openMap}>
            <span className="rk-dot" aria-hidden="true" />
            <span className="rk-bilingual">
              <span className="rk-en">Map</span>
              <span className="rk-sep">|</span>
              <span className="rk-es">mapa</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}