# consent-kit

Bannière de consentement cookies, auto-hébergée, partagée entre tous mes sites et
apps. Pas de prestataire tiers, pas de service à héberger, aucune dépendance à
l'exécution.

**→ [INTEGRATION.md](./INTEGRATION.md) pour brancher le kit sur un projet.**

## Ce que ça fait

```
                          Visiteur
                             │
              ┌──────────────┴──────────────┐
              │   choix déjà enregistré ?   │
              └──────────────┬──────────────┘
                   oui │              │ non
                       │              │
              on applique      pays via /cdn-cgi/trace
                                      │
                       ┌──────────────┴──────────────┐
                  Europe / inconnu              reste du monde
                       │                              │
                  bannière                    tout démarre,
              rien n'est chargé              aucune bannière
                       │
              ┌────────┴────────┐
          Accepter          Refuser
              │                 │
        GA4 + Clarity      rien, jamais
```

Le pays vient de `/cdn-cgi/trace`, servi par toute zone proxifiée par Cloudflare :
même origine, pas de clé, pas de cookie, rien envoyé à un tiers. Si l'appel
échoue — bloqueur, réseau, domaine non proxifié — la bannière s'affiche. **En cas
de doute, on protège.**

En Europe, tant que la personne n'a pas accepté, aucun `<script>` vendeur n'est
inséré dans la page. Pas « chargé mais en veille » : absent.

## Utilisation

```sh
pnpm add github:arnauddsj/consent-kit#v1.0.0
```

```ts
import { initConsent, ga4, clarity } from "consent-kit";

initConsent({
  policyVersion: "2026-09",
  locale: "fr",
  ui: { privacyUrl: "/confidentialite" },
  vendors: [
    ga4("G-XXXXXXXXXX"),
    clarity("xxxxxxxxxx", { exclude: ["/search", "/admin"] }),
  ],
});
```

Pour une app derrière un login, `profile: "app"` floute l'écran vis-à-vis du
session replay et enregistre le choix sur le compte plutôt que dans le navigateur.
Détails dans [INTEGRATION.md](./INTEGRATION.md).

## Choix de conception

**Pas de Worker Cloudflare.** Une requête même-origine vers `/cdn-cgi/trace` suffit
et évite de faire varier le cache par pays, ou de mettre du code entre chaque
visiteur et chaque page.

**Pas de « consent mode avancé ».** Le mode avancé de Google charge quand même
gtag.js et envoie des pings avant tout accord. Ici le script n'existe pas tant que
l'accord n'est pas donné : plus simple à expliquer, plus simple à défendre.

**Pas de serveur de consentement.** Un cookie propriétaire suffit pour un site.
Pour une app, le choix va dans la ligne utilisateur de sa propre base — pas dans
un service séparé de plus à maintenir.

**Repli fermé.** Toute incertitude sur le pays mène à la bannière.

## Conformité

Le kit implémente les règles que la CNIL sanctionne le plus :

- « Tout refuser » de même taille et même poids visuel que « Tout accepter »
- pas de croix de fermeture — fermer n'est pas consentir
- cases décochées par défaut
- refus mémorisé aussi longtemps qu'une acceptation (180 jours par défaut)
- `openConsentSettings()` pour changer d'avis à tout moment

Ce sont des choix techniques, pas un avis juridique. Reste à ta charge : la
politique de confidentialité, et l'arbitrage sur les outils que tu déclares.

## Développement

```sh
pnpm install
pnpm test        # 16 tests de comportement, sans navigateur
pnpm build
pnpm typecheck
```

Toute modification de la logique de décision doit être couverte par un test dans
`test/run.mjs`.

## Licence

MIT
