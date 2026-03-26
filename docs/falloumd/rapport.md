# Rapport d'analyse du projet (A a Z)

## 1. Resume executif
Ce projet est un boilerplate TCMPP (Tencent Cloud Mini Program Platform) pour mini-apps. Il fournit une architecture complete : gestion d'etat via EventBus, couche API (HTTP + OAuth2 + plugins natifs), transformation JSON (Sculpt), systeme de composants UI, styles globaux utilitaires, filtres WXS, comportements (Behaviors), navigation securisee et stockage local robuste. L'objectif est d'accelerer le demarrage et de garder une structure propre et scalable.

## 2. Type d'application et runtime
- Type: Mini-program (WeChat/TCMPP)
- Runtime: double thread (JS thread + render thread)
- UI: WXML + WXSS + WXS (ES5 uniquement)
- Mise a jour: via update manager (cache mini-program)

## 3. Structure du projet (vue globale)
- `app.js` : entree app, init, EventBus, erreurs, reseau
- `app.json` : routes, fenetre, permissions
- `app.wxss` : styles globaux + utilities
- `project.config.json` : config DevTools/SDK
- `pages/` : pages de l'app
- `components/` : composants UI reutilisables
- `utils/` : event bus, api, storage, helpers, behaviors, formatters, wxs
- `docs/` : documentation complete (16 fichiers)
- `types/`, `typings/` : definitions JSDoc/WeChat

## 4. Flux principal de l'application
### 4.1 Lancement
1. `onLaunch()` definit `APP_LOADING=true` puis lance:
   - `checkForUpdates()`
   - `setupNetworkListener()`
2. `initializeApp()` est stocke dans `globalData.initPromise`
3. Les pages attendent `await initPromise` avant de lire l'etat

### 4.2 Initialisation utilisateur
- `nativeService.getUserInfos()` (retry + backoff)
- Stockage dans EventBus : `USER_DATA`, `USER_NAME`
- Emission event `USER_LOADED`

### 4.3 Reseau & Erreurs
- Reseau: `NETWORK_CONNECTED` + `NETWORK_TYPE`
- Erreurs globales: `onError`, `onUnhandledRejection`, `onPageNotFound`

## 5. Gestion d'etat: EventBus
- Singleton `Bus` partage via `globalData.eventBus`
- Distinction: **events** (one-shot) vs **state** (persistant)
- APIs cle:
  - `setState / getState / onState / removeState`
  - `emit / on / once / offNamespace`
  - `use` (middleware), `replay`, `history`
- Patterns proposes:
  - Subscription manuelle dans `pages/index`
  - Helpers auto-subscription dans `pages/demo`

## 6. Couche API
### 6.1 HttpClient
- Singleton `httpClient` (GET/POST/PUT/PATCH/DELETE)
- Format de reponse unifie: `{ success, data, error, status, headers }`
- Session tracking: `X-Client-Ref` + `X-Request-Id`

### 6.2 Auth OAuth2
- `authenticate()` : cache token dans storage, refresh auto
- Config via `utils/config.js`

### 6.3 Native Plugins
- `invokePlugin()` + `withRetry()`
- `nativeService.getUserInfos()`

### 6.4 BackendAPI
- Service layer qui combine auth + http + sculpt

## 7. JSON Sculpt (transformation)
- Schema declaratif: `@link.path` + casts `::number` etc.
- Operators: `toTitleCase`, `formatCurrency`, `timeAgo`, etc.
- Support arrays (`$map`, `$spread`) et structures recursives
- Schemas dans `utils/mappers/*.sculpt.js`

## 8. Composants UI
- Convention: prefix `app-`
- Architecture 4 fichiers: `index.js/json/wxml/wxss`
- Catalogues:
  - Layout: card, center, nav-bar
  - Input: button, input, input-spinner, radio-group
  - Display: typography, image, icons, stepper, tab-bar
  - Overlay: modal
- Style isolation: `isolated`, `apply-shared`, `shared`

## 9. Styles et design system
- `app.wxss` contient un systeme utilitaire (flex, spacing, etc.)
- Variables CSS: `--bs-primary`, `--bs-secondary`, etc.
- Unites: `rpx` (750rpx = largeur ecran)
- Convention BEM: `osn-` (ex: `.osn-button__text`)

## 10. WXS Filters
- Module: `utils/wxs/filters.wxs`
- Usage dans WXML: `<wxs src=... module="f" />`
- Filtres: `formatDate`, `formatPrice`, `truncate`, `statusClass`, `timeAgo`, etc.
- Contraintes: ES5 only, pas de `wx.*`, pas d'import JS

## 11. Behaviors (mixins)
- `loadingBehavior` offre:
  - `isLoading`, `hasError`, `errorMessage`
  - `withLoading(fn, { loadingText })`
- Utile pour factoriser logique de pages

## 12. Navigation
- Helpers: `navigateTo`, `redirectTo`, `switchTab`, `reLaunch`, `navigateBack`, `getStackInfo`
- Protection contre limite stack (10 pages)
- Data passing: query params ou EventBus state

## 13. Storage
- Wrapper `utils/storage.js` pour eviter exceptions
- Methods: `get`, `set`, `remove`, `clear`, `info`, `getOrSet`
- Convention keys: prefix `app_`

## 14. Recettes (cookbook)
- Ajouter page
- Ajouter composant
- Ajouter API call
- Creer schema Sculpt
- Ajouter plugin natif
- Ajouter middleware EventBus
- Creer un Behavior
- Ajouter filtre WXS
- Offline support

## 15. Troubleshooting + perf
- Erreurs courantes: page limit, component not found, page not found
- Conseils: `await initPromise`, `Bus.setDebug(true)`
- Perf: batch `setData`, utiliser WXS pour formatage

## 16. Glossaire
- Definitions mini-program: WXML, WXSS, WXS, rpx, etc.
- Definitions boilerplate: EventBus, Sculpt, BackendAPI, initPromise, etc.

## 17. Points de config a verifier avant rendu
1. `utils/config.js` : BASE_URL + credentials OAuth2
2. `utils/constants/index.js` : `__DEV__ = false` en prod
3. `project.config.json` : `SASappid` a changer
4. `app.json` : titre + pages declarees

## 18. Recommandations pour livraison (dossier falloumd)
- Ce fichier est le rapport principal: `falloumd/rapport.md`
- Ajouter si besoin:
  - `falloumd/checklist.txt` (tests, config, build)
  - `falloumd/architecture.png` (schema) si demande client

---

### Rappel: documentation source
Les fichiers consultes sont dans `docs/`:
01 a 16 (concepts, architecture, getting started, lifecycle, eventbus, api, sculpt, components, styling, wxs, behaviors, navigation, storage, recipes, troubleshooting, glossary).
