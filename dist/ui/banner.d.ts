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
export declare function createBanner(opts: BannerOptions, handlers: BannerHandlers, locale: "fr" | "en" | undefined, enabledCategories: Set<keyof ConsentChoices>): BannerHandle;
