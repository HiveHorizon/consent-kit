# Intégration de consent-kit

Guide pour brancher consent-kit sur un site ou une app. Prévu pour être suivi par
Claude Code ou à la main.

Repo : `github:HiveHorizon/consent-kit`

---

## 1. Installer

```sh
pnpm add github:HiveHorizon/consent-kit#v1.0.0
```

Épingler une version (`#v1.0.0`) évite qu'une mise à jour du kit change le
comportement d'un site sans qu'on l'ait décidé. Pour mettre à jour : bump le tag,
`pnpm install`, vérifier, commit.

Aucune dépendance à l'exécution. Le paquet se compile tout seul à l'installation.

---

## 2. Retirer les scripts existants

**C'est l'étape la plus importante et la plus facile à rater.** Tant qu'un
`<script>` GA4 / GTM / Clarity reste dans le `<head>`, il se charge avant tout
consentement et le kit ne sert à rien.

Chercher et supprimer dans les layouts / `index.html` :

- `googletagmanager.com/gtm.js` et le `<noscript>` GTM associé
- `googletagmanager.com/gtag/js`
- le bloc `window.dataLayer = ... gtag('config', ...)`
- `clarity.ms/tag/`
- tout autre pixel (Meta, LinkedIn, Hotjar…)

Noter les identifiants au passage : ils repartent dans la config.

À **garder** : les analytics auto-hébergés et sans cookie (Umami, Plausible).
Ils se déclarent en `cookieless()` et continuent de tourner pour tout le monde.

---

## 3. Créer la config

Un seul fichier par projet, pour que tout soit au même endroit.

### Site vitrine

`src/lib/consent.ts`

```ts
import { initConsent, ga4, clarity } from "@hivehorizon/consent-kit";

export function setupConsent() {
  return initConsent({
    profile: "site",
    policyVersion: "2026-09",
    cookieDomain: ".exemple.com", // si vitrine + app partagent le domaine
    locale: "fr",
    ui: { privacyUrl: "/confidentialite" },
    vendors: [
      ga4("G-XXXXXXXXXX"),
      clarity("xxxxxxxxxx", { exclude: ["/recherche", "/admin"] }),
    ],
  });
}
```

### Web-app (derrière une connexion)

```ts
import { initConsent, ga4, clarity, accountStorage } from "@hivehorizon/consent-kit";
import { api } from "./api";

export function setupConsent() {
  return initConsent({
    profile: "app",       // floute l'app pour le replay + suit les changements de route
    appRoot: "#app",
    policyVersion: "2026-09",
    cookieDomain: ".exemple.com",
    locale: "fr",
    ui: { privacyUrl: "https://exemple.com/confidentialite" },

    // Le choix suit la personne d'un appareil à l'autre
    storage: accountStorage({
      load: () => api.get("/me/consent"),
      save: (record) => api.put("/me/consent", record),
      cookie: { domain: ".exemple.com" },
    }),

    vendors: [
      ga4("G-XXXXXXXXXX"),
      clarity("xxxxxxxxxx", { maskRoot: "#app" }),
    ],
  });
}
```

Pour `accountStorage`, côté serveur : un champ JSON sur la ligne utilisateur
(`consent`), plus deux routes `GET`/`PUT`. Pas de table ni de service dédié.
Quand les deux copies existent, la plus récente gagne — sans ça, se connecter sur
un second appareil écraserait un choix plus récent.

---

## 4. Appeler au démarrage

**Astro** — dans `BaseLayout.astro`, avant `</body>` :

```astro
<script>
  import { setupConsent } from "../lib/consent";
  setupConsent();
</script>
```

**Vue / React SPA** — dans `main.ts`, après le montage :

```ts
app.mount("#app");
setupConsent();
```

L'ordre compte pour une app : `maskRoot` a besoin que `#app` existe déjà.

---

## 5. Lien « Cookies » dans le pied de page

Obligatoire : il faut pouvoir changer d'avis à tout moment.

```html
<button type="button" id="cookie-settings">Cookies</button>
<script>
  import { openConsentSettings } from "@hivehorizon/consent-kit";
  document.getElementById("cookie-settings")
    ?.addEventListener("click", openConsentSettings);
</script>
```

---

## 6. Vérifier

Le test qui compte, c'est le comportement réseau. Onglet Réseau des devtools :

| Situation | Attendu |
| --- | --- |
| Depuis la France, sans avoir choisi | Bannière visible. **Aucune** requête vers `googletagmanager.com` ni `clarity.ms`. |
| Clic « Tout refuser » | Bannière disparaît. Toujours aucune requête. Rechargement : pas de bannière, pas de requête. |
| Clic « Tout accepter » | Requêtes GA4 / Clarity qui partent. Rechargement : elles repartent, sans bannière. |
| Depuis les États-Unis (VPN) | Pas de bannière. Requêtes immédiates. |
| Sur une page `exclude` | Le vendor listé ne se charge pas, les autres si. |

Forcer un pays sans VPN, en dev :

```ts
import { staticGeo } from "@hivehorizon/consent-kit";
initConsent({ geo: staticGeo("FR"), debug: true, /* … */ });
```

`debug: true` explique chaque décision dans la console.

Repartir de zéro : supprimer le cookie `consent_prefs`, ou en console
`__consentKit.reset()` si tu l'exposes.

---

## 7. Politique de confidentialité

À citer nommément : Google Analytics 4 (Google Ireland/LLC) et Microsoft Clarity
(Microsoft Corp.), ce qu'ils collectent, la durée de conservation, et comment
retirer son consentement (le lien du point 5).

Bumper `policyVersion` à chaque ajout d'outil : tout le monde est réinterrogé.

---

## Référence des options

| Option | Défaut | Rôle |
| --- | --- | --- |
| `vendors` | — | Ce qui peut être chargé. |
| `regions` | `"eu"` | `"eu"`, `"all"`, ou une liste de codes pays. |
| `policyVersion` | `"1"` | Bump = tout le monde est réinterrogé. |
| `expiryDays` | `180` | Durée de mémorisation. La CNIL recommande 6 mois max. |
| `cookieDomain` | — | `".exemple.com"` pour partager entre sous-domaines. |
| `storage` | cookie | `accountStorage()` pour les apps avec comptes. |
| `geo` | Cloudflare | `staticGeo("FR")` en dev. |
| `profile` | `"site"` | `"app"` = floutage replay + suivi des routes. |
| `appRoot` | `"#app"` | Élément flouté en profil `"app"`. |
| `ui` | bannière | `false` pour piloter l'affichage toi-même. |
| `locale` | navigateur | `"fr"` ou `"en"`. |
| `onChange` | — | Rappelé à chaque état de consentement résolu. |
| `debug` | `false` | Trace les décisions en console. |

### Vendors

| Fonction | Usage |
| --- | --- |
| `ga4(id, { exclude, config })` | Google Analytics 4. |
| `gtm(id, { exclude })` | Google Tag Manager. Soit `gtm`, soit `ga4`, pas les deux. |
| `clarity(id, { exclude, maskRoot })` | Microsoft Clarity. |
| `cookieless({ id, src, attrs })` | Umami / Plausible. Chargé pour tout le monde. |
| `custom({ id, category, load })` | Tout le reste. |

---

## Pièges

**Clarity et les URL.** Clarity enregistre l'URL telle quelle et le masquage de
paramètre n'est pas en libre-service chez Microsoft. Si une valeur sensible passe
en `?param=` (un domaine cherché, un email), mettre la page dans `exclude`.

**`exclude` ne marche pas en SPA.** Une fois Clarity chargé, il continue
d'enregistrer au changement de route côté client. Dans une app : ne jamais mettre
de valeur sensible dans l'URL, et compter sur `maskRoot`, pas sur `exclude`.

**Ne pas maquiller la bannière.** « Tout refuser » doit rester aussi visible que
« Tout accepter » — c'est l'erreur la plus sanctionnée par la CNIL. Les CSS
variables permettent de reskinner sans toucher à cet équilibre.

**Ne jamais identifier avec un email.** `clarity("identify", …)` ou
`gtag('set', {user_id})` : passer un identifiant opaque, jamais une adresse.
