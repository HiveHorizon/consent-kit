/**
 * Client-side route tracking.
 *
 * A single-page app changes the URL without reloading, so analytics would
 * otherwise record one page view per session. This patches the history API once
 * and reports every route change.
 */
export declare function trackRouteChanges(onChange: (path: string) => void): () => void;
