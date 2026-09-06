import { pickLocale } from "./i18n.js";
import { injectStyles } from "./styles.js";
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className)
        node.className = className;
    if (text)
        node.textContent = text;
    return node;
}
export function createBanner(opts, handlers, locale, enabledCategories) {
    const t = { ...pickLocale(locale), ...opts.text };
    if (opts.styles !== false)
        injectStyles();
    let root = null;
    let expanded = false;
    let lastFocused = null;
    const rows = [];
    if (enabledCategories.has("analytics")) {
        rows.push({ key: "analytics", title: t.analyticsTitle, body: t.analyticsBody });
    }
    if (enabledCategories.has("marketing")) {
        rows.push({ key: "marketing", title: t.marketingTitle, body: t.marketingBody });
    }
    function buildCategoryRow(row) {
        const wrap = el("div", "ck-cat");
        const label = el("label", "ck-switch");
        const input = el("input");
        input.type = "checkbox";
        input.checked = false; // never pre-ticked
        input.setAttribute("aria-label", row.title);
        const track = el("span", "ck-track");
        label.append(input, track);
        row.input = input;
        const txt = el("div", "ck-cat-txt");
        txt.append(el("p", "ck-cat-title", row.title), el("p", "ck-cat-body", row.body));
        wrap.append(label, txt);
        return wrap;
    }
    function buildNecessaryRow() {
        const wrap = el("div", "ck-cat");
        const txt = el("div", "ck-cat-txt");
        txt.append(el("p", "ck-cat-title", t.necessaryTitle), el("p", "ck-cat-body", t.necessaryBody));
        wrap.append(txt, el("span", "ck-always", t.alwaysOn));
        return wrap;
    }
    function render() {
        if (root)
            root.remove();
        root = el("div", `ck-root${opts.className ? ` ${opts.className}` : ""}`);
        root.setAttribute("role", "dialog");
        root.setAttribute("aria-modal", "false");
        root.setAttribute("aria-label", t.title);
        root.append(el("h2", "ck-title", t.title), el("p", "ck-body", t.body));
        if (expanded) {
            const panel = el("div", "ck-panel");
            panel.append(buildNecessaryRow());
            for (const row of rows)
                panel.append(buildCategoryRow(row));
            root.append(panel);
        }
        const actions = el("div", "ck-actions");
        // Refuse first and visually equal to accept: refusing must never be the
        // harder path.
        const refuse = el("button", "ck-btn", t.refuseAll);
        refuse.type = "button";
        refuse.addEventListener("click", () => handlers.onRefuseAll());
        const accept = el("button", "ck-btn ck-btn--primary", t.acceptAll);
        accept.type = "button";
        accept.addEventListener("click", () => handlers.onAcceptAll());
        actions.append(refuse, accept);
        if (expanded) {
            const save = el("button", "ck-btn", t.save);
            save.type = "button";
            save.addEventListener("click", () => {
                const choices = { analytics: false, marketing: false };
                for (const row of rows)
                    choices[row.key] = !!row.input?.checked;
                handlers.onSave(choices);
            });
            actions.append(save);
        }
        root.append(actions);
        // Secondary row, so the collapsed card stays compact: the two decisions keep
        // the button row to themselves.
        const foot = el("div", "ck-foot");
        if (!expanded && rows.length > 0) {
            const more = el("button", "ck-link", t.customise);
            more.type = "button";
            more.addEventListener("click", () => {
                expanded = true;
                render();
            });
            foot.append(more);
        }
        if (opts.privacyUrl) {
            const link = el("a", "ck-link", t.privacyLink);
            link.href = opts.privacyUrl;
            foot.append(link);
        }
        if (foot.children.length > 0)
            root.append(foot);
        document.body.appendChild(root);
        root.querySelector("button")?.focus({ preventScroll: true });
    }
    return {
        open() {
            if (root)
                return;
            lastFocused = document.activeElement;
            expanded = false;
            render();
        },
        openSettings() {
            lastFocused = document.activeElement;
            expanded = true;
            render();
        },
        close() {
            root?.remove();
            root = null;
            expanded = false;
            if (lastFocused instanceof HTMLElement)
                lastFocused.focus({ preventScroll: true });
        },
        destroy() {
            root?.remove();
            root = null;
        },
    };
}
//# sourceMappingURL=banner.js.map