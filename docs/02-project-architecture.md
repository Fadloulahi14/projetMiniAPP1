# Architecture du Projet

## Vue d'Ensemble

```
┌──────────────────────────────────────────────────────────────┐
│                          app.js                               │
│  EventBus (Bus) · initPromise · Gestionnaires d'Erreurs · Réseau │
└──────────────┬───────────────────────────────┬───────────────┘
                │                               │
     ┌──────────▼──────────┐         ┌──────────▼──────────┐
     │       Pages          │         │     Composants       │
     │  pages/index/        │         │  components/ui/      │
     │  pages/demo/         │         │  button, modal,      │
     │                      │         │  nav-bar, stepper... │
     └──────────┬───────────┘         └─────────────────────┘
                │
     ┌──────────▼──────────────────────────────────────────┐
     │                    Couche Utils                       │
     │                                                      │
     │  ┌─────────┐  ┌──────────┐  ┌────────────────────┐  │
     │  │ EventBus │  │ BackendAPI│  │  JSON Sculpt       │  │
     │  │ (état)   │  │ (service) │  │  (transformation)  │  │
     │  └─────────┘  └─────┬─────┘  └────────────────────┘  │
     │                      │                                │
     │            ┌─────────┼─────────┐                      │
     │            │         │         │                      │
     │      ┌─────▼───┐ ┌──▼────┐ ┌──▼──────────┐          │
     │      │ auth.js  │ │http.js│ │ native.js   │          │
     │      │ (OAuth2) │ │(HTTP)  │ │ (plugins)  │          │
     │      └──────────┘ └───────┘ └─────────────┘          │
     │                                                      │
     │  storage.js · formatters/ · helpers/ · behaviors/    │
     │  wxs/ · constants/ · config.js                       │
     └──────────────────────────────────────────────────────┘
```

## Flux de Données : Lancement de l'App → Premier Rendu

```
1. Constructeur App()
   └─► onLaunch()
       ├─► checkForUpdates()              // wx.getUpdateManager
       ├─► setupNetworkListener()          // wx.onNetworkStatusChange
       │   └─► Bus.setState('network.connected', true/false)
       │
       └─► initializeApp()  ──stocké comme──► globalData.initPromise
           ├─► nativeService.getUserInfos()   // avec retry + backoff
           │   └─► invokePlugin('userInfos')  // wx.invokeNativePlugin
           ├─► Bus.setState('user.data', { msisdn, fullName })
           └─► Bus.emit('user.loaded')

2. Page.onLoad()
   └─► await app.globalData.initPromise   // bloque jusqu'à la fin de l'init
       └─► Bus.getState('user.data')      // lit l'état actuel
       └─► Bus.onState('user.data', cb)   // s'abonne aux changements
       └─► this.setData({ ... })          // rend
```

## Flux de Données : Appel API

```
Méthode Page
   └─► backendAPI.getItems()
       ├─► authenticate()
       │   ├─► Vérifier le token en cache dans wx.getStorageSync
       │   │   └─► Valide ? Retourner le token en cache
       │   └─► Expiré ? POST vers AUTH_URL
       │       └─► Mettre en cache le nouveau token + définir expiration
       │       └─► httpClient.setToken(token)
       │
       ├─► httpClient.get('/items', { query })
       │   └─► wx.request({
       │         headers: {
       │           Authorization: 'Bearer <token>',
       │           X-Client-Ref: '<session-id>',
       │           X-Request-Id: '<session-id>-<count>'
       │         }
       │       })
       │   └─► Retourne { success, data, error, headers, status }
       │
       └─► sculpt.data({ data: res.data, to: Schema })
           └─► Objets de domaine transformés et typés
```

## Gestion d'État : EventBus

L'EventBus (singletons `Bus`) est la source unique de vérité pour l'état partagé de l'application.

```
┌─────────────┐                    ┌──────────────┐
│   app.js    │                    │   page.js    │
│             │  Bus.setState()    │              │
│ initializeApp──────────────────►│  Bus.onState()│
│             │  'user.data'       │  ↓           │
│             │                    │  setData()   │
└─────────────┘                    └──────────────┘
                                          │
               Bus.emit('user.loaded')     │
               ─────────────────────►  Gestionnaire Bus.on()
```

**Deux modèles d'abonnement dans ce boilerplate :**

1. **Manuel** (pages/index) — `Bus.onState()` direct + nettoyage dans `onUnload`
2. **Basé sur l'aide** (pages/demo) — `createPageHelpers(this, bindings)` auto-abonne

## Graphe de Dépendances des Modules

```
app.js
  ├── utils/event/index.js          (Bus singleton)
  └── utils/apis/native.js          (nativeService)

pages/*
  ├── utils/helpers/page.js          (createPageHelpers, showToast)
  └── utils/behaviors/loading.js     (loadingBehavior)

utils/apis/index.js (BackendAPI)
  ├── utils/apis/auth.js             (authenticate)
  ├── utils/apis/http.js             (httpClient)
  ├── utils/json-sculpt/sculpt.js    (sculpt)
  └── utils/mappers/*.sculpt.js      (schémas)

utils/apis/auth.js
  ├── utils/apis/http.js             (httpClient)
  ├── utils/config.js                (config)
  └── utils/constants/index.js       (STORAGE_KEYS, AUTH_CONFIG)

utils/apis/http.js
  ├── utils/config.js                (config.BASE_URL)
  └── utils/constants/index.js       (HTTP_CONFIG)
```

## Stratégie de Gestion des Erreurs

| Couche | Mécanisme | Attrape |
|--------|-----------|---------|
| `app.js onError` | Gestionnaire synchrone global | Erreurs non catchées de toute page |
| `app.js onUnhandledRejection` | Gestionnaire asynchrone global | `.catch()` oublié sur les Promises |
| `app.js onPageNotFound` | Gestionnaire 404 | Navigation vers des pages inexistantes |
| `loadingBehavior.withLoading()` | try/catch au niveau page | Opérations asynchrones avec retour UI |
| `retryAsync()` | Retry avec backoff | Appels API instables |
| `withRetry()` | Retry de plugin natif | Problèmes de timing des plugins natifs |
| `httpClient` | Format de réponse unifié | Erreurs HTTP → `{ success: false, error }` |
| `storage.js` | try/catch silencieux | Quota de stockage et corruption |

## Conventions de Nommage de Fichiers

| Modèle | Exemple | Utilisé Pour |
|--------|---------|--------------|
| `index.js` dans dossier | `components/ui/button/index.js` | Composants, modules |
| Ensemble de 4 fichiers | `.js`, `.wxml`, `.wxss`, `.json` | Pages et composants |
| `*.sculpt.js` | `mappers/example.sculpt.js` | Schémas de transformation Sculpt |
| `.wxs` | `wxs/filters.wxs` | Scripts WXS du thread de rendu |

## Voir Aussi

- [Cycle de Vie de l'App](04-app-lifecycle.md) — Visite détaillée de app.js
- [Guide EventBus](05-eventbus-guide.md) — API complète de gestion d'état
- [Couche API](06-api-layer.md) — Détails HTTP, auth et service natif
