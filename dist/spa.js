/**
 * Client-side route tracking.
 *
 * A single-page app changes the URL without reloading, so analytics would
 * otherwise record one page view per session. This patches the history API once
 * and reports every route change.
 */
export function trackRouteChanges(onChange) {
    if (typeof window === "undefined")
        return () => { };
    let last = location.pathname + location.search;
    const report = () => {
        const current = location.pathname + location.search;
        if (current === last)
            return;
        last = current;
        onChange(current);
    };
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = function (...args) {
        const out = origPush.apply(this, args);
        queueMicrotask(report);
        return out;
    };
    history.replaceState = function (...args) {
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
//# sourceMappingURL=spa.js.map