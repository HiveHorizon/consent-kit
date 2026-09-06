import type { BannerOptions, ConsentChoices } from "../types.js";
export interface BannerHandlers {
    onAcceptAll: () => void;
    onRefuseAll: () => void;
    onSave: (choices: ConsentChoices) => void;
}
export interface BannerHandle {
    /** Shows the first-level banner. */
    open(): void;
    /** Shows the banner opened straight onto the preferences panel. */
    openSettings(): void;
    close(): void;
    destroy(): void;
}
export declare function createBanner(opts: BannerOptions, handlers: BannerHandlers, locale: "fr" | "en" | undefined, enabledCategories: Set<keyof ConsentChoices>, 
/**
 * Current choices, or null when nothing has been decided yet. Reopening the
 * panel must show what is actually stored: leaving the toggles off would both
 * look like the choice was lost and, on save, silently revoke it.
 */
getChoices?: () => ConsentChoices | null): BannerHandle;
