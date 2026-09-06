/**
 * Bundled stylesheet, injected once.
 *
 * Everything is driven by CSS variables under .ck-root so a site can restyle it
 * without forking. Colours default to a neutral dark surface that reads on both
 * light and dark pages.
 *
 * Deliberate compliance choices, do not "improve" them:
 * - "Refuse all" and "Accept all" are the same size, weight and prominence.
 *   Making refusal harder than acceptance is the single most fined mistake.
 * - No close/dismiss cross: dismissing is not consent.
 * - Category toggles default to off, never pre-ticked.
 */
export const CSS = `
.ck-root{
  --ck-bg:#14141a; --ck-fg:#f2f1f4; --ck-muted:#a8a6b3; --ck-border:#2a2a33;
  --ck-accent:#5b5ef0; --ck-accent-fg:#fff; --ck-btn-bg:#23232c; --ck-radius:14px;
  --ck-max:min(560px, calc(100vw - 32px)); --ck-shadow:0 16px 48px rgba(0,0,0,.42);
  position:fixed; z-index:2147483000; left:16px; bottom:16px; width:var(--ck-max);
  font-family:system-ui,-apple-system,"Segoe UI",sans-serif; color:var(--ck-fg);
  background:var(--ck-bg); border:1px solid var(--ck-border);
  border-radius:var(--ck-radius); box-shadow:var(--ck-shadow);
  padding:20px; box-sizing:border-box; line-height:1.5;
  animation:ck-in .22s ease-out;
}
@media (prefers-reduced-motion:reduce){ .ck-root{animation:none} }
@keyframes ck-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.ck-root *,.ck-root *::before,.ck-root *::after{box-sizing:inherit}
.ck-title{margin:0 0 6px;font-size:15px;font-weight:650;letter-spacing:-.01em}
.ck-body{margin:0 0 14px;font-size:13.5px;color:var(--ck-muted)}
.ck-actions{display:flex;gap:8px;flex-wrap:wrap}
.ck-btn{
  flex:1 1 auto; min-width:132px; appearance:none; cursor:pointer;
  font:inherit; font-size:13.5px; font-weight:600; padding:10px 16px;
  border-radius:9px; border:1px solid var(--ck-border); background:var(--ck-btn-bg);
  color:var(--ck-fg); transition:filter .15s ease, background .15s ease;
}
.ck-btn:hover{filter:brightness(1.18)}
.ck-btn:focus-visible{outline:2px solid var(--ck-accent);outline-offset:2px}
.ck-btn--primary{background:var(--ck-accent);border-color:var(--ck-accent);color:var(--ck-accent-fg)}
.ck-btn--link{
  flex:0 0 100%; min-width:0; background:none; border:none; color:var(--ck-muted);
  text-decoration:underline; font-weight:500; padding:6px 0; text-align:left;
}
.ck-privacy{display:inline-block;margin-top:10px;font-size:12.5px;color:var(--ck-muted)}
.ck-panel{margin:4px 0 14px;display:flex;flex-direction:column;gap:10px}
.ck-cat{
  display:flex;gap:12px;align-items:flex-start;padding:12px;
  border:1px solid var(--ck-border);border-radius:10px;background:rgba(255,255,255,.02);
}
.ck-cat-txt{flex:1;min-width:0}
.ck-cat-title{font-size:13.5px;font-weight:600;margin:0 0 2px}
.ck-cat-body{font-size:12.5px;color:var(--ck-muted);margin:0}
.ck-always{font-size:12px;color:var(--ck-muted);white-space:nowrap;padding-top:2px}
.ck-switch{position:relative;flex:0 0 auto;width:42px;height:24px;margin-top:1px}
.ck-switch input{position:absolute;opacity:0;width:100%;height:100%;margin:0;cursor:pointer}
.ck-track{
  position:absolute;inset:0;border-radius:999px;background:var(--ck-btn-bg);
  border:1px solid var(--ck-border);transition:background .18s ease;pointer-events:none;
}
.ck-track::after{
  content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;
  background:var(--ck-muted);transition:transform .18s ease,background .18s ease;
}
.ck-switch input:checked + .ck-track{background:var(--ck-accent);border-color:var(--ck-accent)}
.ck-switch input:checked + .ck-track::after{transform:translateX(18px);background:#fff}
.ck-switch input:focus-visible + .ck-track{outline:2px solid var(--ck-accent);outline-offset:2px}
@media (max-width:520px){
  .ck-root{left:8px;right:8px;bottom:8px;width:auto;padding:16px}
  .ck-btn{flex:1 1 100%}
}
`;

let injected = false;

export function injectStyles(): void {
  if (injected || typeof document === "undefined") return;
  if (document.getElementById("consent-kit-styles")) {
    injected = true;
    return;
  }
  const el = document.createElement("style");
  el.id = "consent-kit-styles";
  el.textContent = CSS;
  document.head.appendChild(el);
  injected = true;
}
