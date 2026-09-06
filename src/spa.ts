/**
 * Client-side route tracking.
 *
 * A single-page app changes the URL without reloading, so analytics would
 * otherwise record one page view per session. This patches the history API once
 * and reports every route change.
 */
export function trackRouteChanges(onChange: (path: string) => void): () => void {
  if (typeof window === "undefined") return () => {};

  let last = location.pathname + location.search;

  const report = () => {
    const current = location.pathname + location.search;
    if (current === last) return;
    last = current;
    onChange(current);
  };

  const origPush = history.pushState;
  const origReplace = history.replaceState;

  history.pushState = function (...args: Parameters<typeof origPush>) {
    const out = origPush.apply(this, args);
    queueMicrotask(report);
    return out;
  };
  history.replaceState = function (...args: Parameters<typeof origReplace>) {
    const out = origReplace.apply(this, args);
    queueMicrotask(report);
    return out;
  };
  window.addEventListener("popstate", report);

  return () => {
    history.pushState = origPush;
    history.replaceState = origReplace;
    window.removeEventListener("popstate", report);
  };
}
