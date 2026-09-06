import type { BannerText } from "../types.js";

export const fr: BannerText = {
  title: "Cookies et mesure d'audience",
  body:
    "Des outils de mesure nous aident à améliorer le site. Rien n'est activé sans " +
    "votre accord.",
  acceptAll: "Tout accepter",
  refuseAll: "Tout refuser",
  customise: "Personnaliser",
  save: "Enregistrer mes choix",
  privacyLink: "Politique de confidentialité",
  necessaryTitle: "Strictement nécessaires",
  necessaryBody:
    "Indispensables au fonctionnement du site, notamment pour retenir votre choix " +
    "ici. Refuser la mesure d'audience ne les désactive pas.",
  alwaysOn: "Toujours actifs",
  analyticsTitle: "Mesure d'audience",
  analyticsBody:
    "Pages consultées, parcours et blocages rencontrés. Nous aide à corriger ce qui " +
    "ne va pas.",
  marketingTitle: "Publicité",
  marketingBody:
    "Permet de mesurer l'efficacité de nos campagnes et de vous proposer des contenus " +
    "adaptés.",
};

export const en: BannerText = {
  title: "Cookies and analytics",
  body:
    "Analytics help us improve this site. Nothing is enabled without your agreement.",
  acceptAll: "Accept all",
  refuseAll: "Refuse all",
  customise: "Customise",
  save: "Save my choices",
  privacyLink: "Privacy policy",
  necessaryTitle: "Strictly necessary",
  necessaryBody:
    "Required for the site to work, including remembering the choice you make here. " +
    "Refusing analytics does not disable them.",
  alwaysOn: "Always on",
  analyticsTitle: "Analytics",
  analyticsBody:
    "Pages viewed, journeys taken and where people get stuck. Helps us fix what is broken.",
  marketingTitle: "Advertising",
  marketingBody:
    "Lets us measure how our campaigns perform and show you more relevant content.",
};

export function pickLocale(explicit?: "fr" | "en"): BannerText {
  if (explicit) return explicit === "fr" ? fr : en;

  // The page's own language wins over the browser's. A French-speaking visitor
  // on an English-only site should read the banner in the site's language —
  // reading navigator.language first shows French copy on an English page.
  const pageLang =
    typeof document !== "undefined"
      ? document.documentElement?.getAttribute("lang")
      : null;
  const browserLang =
    typeof navigator !== "undefined" ? navigator.language : null;

  const lang = (pageLang || browserLang || "").toLowerCase();
  return lang.startsWith("fr") ? fr : en;
}
