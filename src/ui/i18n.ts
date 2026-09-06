import type { BannerText } from "../types.js";

export const fr: BannerText = {
  title: "Cookies et mesure d'audience",
  body:
    "Nous utilisons des outils de mesure pour comprendre comment le site est utilisé " +
    "et l'améliorer. Rien n'est activé sans votre accord, et vous pouvez changer d'avis " +
    "à tout moment.",
  acceptAll: "Tout accepter",
  refuseAll: "Tout refuser",
  customise: "Personnaliser",
  save: "Enregistrer mes choix",
  privacyLink: "Politique de confidentialité",
  necessaryTitle: "Strictement nécessaires",
  necessaryBody:
    "Indispensables au fonctionnement du site, notamment pour retenir votre choix ici.",
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
    "We use analytics to understand how this site is used and improve it. Nothing is " +
    "enabled without your agreement, and you can change your mind at any time.",
  acceptAll: "Accept all",
  refuseAll: "Refuse all",
  customise: "Customise",
  save: "Save my choices",
  privacyLink: "Privacy policy",
  necessaryTitle: "Strictly necessary",
  necessaryBody:
    "Required for the site to work, including remembering the choice you make here.",
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
  if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("fr")) {
    return fr;
  }
  return en;
}
