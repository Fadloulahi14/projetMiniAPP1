# Concepts des Mini-Programmes pour Développeurs Web

Si vous avez développé des applications web mais que vous n'avez jamais touché à un mini-programme, c'est votre point de départ. Tout ce qui est présenté ici s'applique aux Mini-Programmes WeChat et TCMPP.

## Qu'est-ce qu'un Mini-Programme ?

Un mini-programme est une application dans une application. Il s'exécute à l'intérieur d'une application hôte (comme WeChat ou une application alimentée par TCMPP) et utilise le runtime de l'hôte au lieu d'un navigateur.

| Fonctionnalité | Application Web | Mini-Programme | React Native |
|----------------|-----------------|----------------|--------------|
| S'exécute dans | Navigateur | Application hôte (WeChat, TCMPP) | Shell natif |
| Accès au DOM | Oui | Non | Non |
| Limite de taille de fichier | Aucune | 20 Mo | Aucune |
| Installation | Aucune (URL) | Aucune (scannée/partagée) | App Store |
| API | API Web | API wx.* | Ponts natifs |
| Hors ligne | Service Workers | Cache intégré | Intégré |

## Le Runtime à Deux Threads

C'est le concept le plus important. Les mini-programmes s'exécutent sur **deux threads** :

```
┌─────────────────┐          ┌──────────────────┐
│   Thread JS     │          │   Thread Rendu   │
│   (Logique)     │          │   (Vue)          │
│                 │          │                  │
│  Données page   │──────────│  Modèles WXML    │
│  Gestionnaires  │ setData()│  Styles WXSS     │
│  d'événements   │──────────│  Scripts WXS     │
│  Appels API     │          │                  │
│  Logique métier │          │                  │
└─────────────────┘          └──────────────────┘
```

**Ce que cela signifie :**
- Vous **ne pouvez pas** manipuler le DOM. Il n'y a pas de `document.querySelector`.
- La seule façon de mettre à jour l'UI est `this.setData({ key: value })`.
- `setData()` sérialise les données, les envoie à travers les threads et déclenche un re-rendu.
- Moins d'appels à `setData()` = meilleures performances. Regroupez vos mises à jour.

## Types de Fichiers

Chaque page et composant se compose de jusqu'à 4 fichiers :

| Extension | Purpose | Équivalent Web |
|-----------|---------|---------------|
| `.js` | Logique, données, gestionnaires d'événements | JavaScript |
| `.wxml` | Modèles (balisage basé sur XML) | HTML/JSX |
| `.wxss` | Styles (sous-ensemble de CSS) | CSS |
| `.json` | Configuration (déclarations de composants, paramètres de fenêtre) | N/A |
| `.wxs` | Scripts du thread de rendu (ES5 uniquement, rapide) | N/A (voir ci-dessous) |

### WXML — Modèles

WXML utilise des directives au lieu d'expressions JavaScript :

```xml
<!-- Rendu conditionnel -->
<view wx:if="{{ isLoggedIn }}">Bienvenue, {{ userName }}</view>
<view wx:else>Veuillez vous connecter</view>

<!-- Rendu de liste -->
<view wx:for="{{ items }}" wx:key="id">
  {{ index }}: {{ item.name }}
</view>

<!-- Liaison d'événement -->
<button bind:tap="handleTap">Appuyez ici</button>
```

### WXSS — Styles

CSS standard avec un ajout : `rpx` (pixels responsifs).

- **750rpx = largeur de l'écran** sur n'importe quel appareil
- Sur un iPhone 6 (375pt de large) : `1rpx = 0.5px`
- Utilisez `rpx` pour la mise en page, `px` pour les bordures et les détails fins

```css
.card {
  width: 690rpx;      /* ~92% de la largeur de l'écran */
  padding: 24rpx;
  border: 1px solid #eee;  /* détail fin : utiliser px */
  border-radius: 16rpx;
}
```

### WXS — Scripts du Thread de Rendu

WXS s'exécute dans le **thread de rendu** (pas le thread JS), ce qui le rend plus rapide pour la logique d'affichage seule comme le formatage de dates ou le calcul de classes CSS.

**Contraintes :**
- ES5 uniquement (pas de fonctions fléchées, pas de `let`/`const`, pas de littéraux de modèle)
- Impossible d'appeler les API `wx.*`
- Impossible d'importer des modules `.js`
- Lecture seule — ne peut pas modifier les données de la page

Voir [Guide des Filtres WXS](10-wxs-filters.md) pour les détails.

## Cycle de Vie d'une Page

```
onLoad(options)     Appelé une fois lors de la création de la page (reçoit les paramètres de requête URL)
    │
    ▼
onShow()            Appelé chaque fois que la page devient visible (aussi lors du retour d'onglet)
    │
    ▼
onReady()           Appelé une fois lorsque le premier rendu est terminé (équivalent DOM prêt)
    │
    ▼
onHide()            Appelé lorsque la page est masquée (navigation, changement d'onglet)
    │
    ▼
onUnload()          Appelé une fois lorsque la page est détruite (navigateBack, redirectTo)
```

**Points clés :**
- `onLoad` reçoit les paramètres de requête : `onLoad(options)` → `options.id` pour `/pages/detail/index?id=42`
- `onShow` se déclenche chaque fois que vous revenez sur la page (bouton retour, changement d'onglet)
- `onUnload` est l'endroit où vous nettoyez les abonnements et les minuteurs
- `onHide` se déclenche lors de la navigation vers l'avant (page reste dans la pile) ou du changement d'onglets

## Cycle de Vie d'un Composant

```
created()           Instance créée (pas encore de setData, propriétés non disponibles)
    │
    ▼
attached()          Inséré dans la page (propriétés disponibles, peut utiliser setData)
    │
    ▼
ready()             Premier rendu terminé
    │
    ▼
detached()          Retiré de la page (nettoyage ici)
```

### Composant vs Page

```javascript
// Page — utilise le constructeur Page()
Page({
  data: { count: 0 },
  onLoad() { /* cycle de vie */ },
  handleTap() { /* gestionnaire d'événement */ },
});

// Composant — utilise le constructeur Component()
Component({
  properties: {
    title: { type: String, value: '' },    // props externes
  },
  data: { internal: false },                // état interne
  methods: {
    handleTap() { /* doit être dans methods */ },
  },
  lifetimes: {
    attached() { /* les hooks de cycle de vie sont dans lifetimes */ },
  },
});
```

### Slots

Les composants peuvent accepter du contenu enfant via des slots :

```xml
<!-- Modèle du composant (my-card.wxml) -->
<view class="card">
  <slot name="header"></slot>
  <slot></slot>  <!-- slot par défaut -->
</view>

<!-- Utilisation -->
<my-card>
  <view slot="header">Titre</view>
  <text>Contenu du corps de la carte</text>
</my-card>
```

Activez les slots nommés dans le JSON du composant : `"options": { "multipleSlots": true }`

### Behavior() — Mixins

Les behaviors vous permettent de partager des données, des méthodes et des hooks de cycle de vie entre les pages et les composants :

```javascript
// Behavior partagé
const myBehavior = Behavior({
  data: { shared: true },
  methods: { sharedMethod() { /* ... */ } },
});

// Utiliser dans une page ou un composant
Page({
  behaviors: [myBehavior],
  // Maintenant a accès à this.data.shared et this.sharedMethod()
});
```

Voir [Guide des Behaviors](11-behaviors-guide.md) pour les détails.

## La Surface API wx.*

| Catégorie | Exemples |
|-----------|----------|
| **Navigation** | `wx.navigateTo`, `wx.redirectTo`, `wx.switchTab`, `wx.navigateBack`, `wx.reLaunch` |
| **Stockage** | `wx.getStorageSync`, `wx.setStorageSync`, `wx.removeStorageSync`, `wx.clearStorageSync` |
| **Réseau** | `wx.request`, `wx.uploadFile`, `wx.downloadFile`, `wx.connectSocket` |
| **UI** | `wx.showToast`, `wx.showLoading`, `wx.showModal`, `wx.showActionSheet` |
| **Appareil** | `wx.getSystemInfoSync`, `wx.getNetworkType`, `wx.onNetworkStatusChange` |
| **Médias** | `wx.chooseImage`, `wx.previewImage`, `wx.createCameraContext` |
| **Localisation** | `wx.getLocation`, `wx.openLocation`, `wx.chooseLocation` |

La plupart des API `wx.*` utilisent un modèle de callback :
```javascript
wx.request({
  url: 'https://api.example.com/data',
  method: 'GET',
  success(res) { console.log(res.data); },
  fail(err) { console.error(err); },
});
```

Ce boilerplate enveloppe les callbacks en Promises (voir [Couche API](06-api-layer.md)).

## TCMPP vs WeChat Standard

TCMPP (Tencent Cloud Mini Program Platform) étend les Mini-Programmes WeChat standard :

| Fonctionnalité | WeChat | TCMPP |
|----------------|--------|-------|
| Application hôte | WeChat uniquement | Toute application utilisant le SDK TCMPP |
| Plugins natifs | Limités | `wx.invokeNativePlugin` pour un accès natif profond |
| Distribution | Écosystème WeChat | Votre propre écosystème d'applications |
| Outils de développement | WeChat DevTools | TCMPP Developer Tools |
| Fichier de configuration | `project.config.json` | Identique, avec les champs `TCMPPLibVersion` et `SASappid` |

## Tableau de Traduction Web → Mini-Programme

| Concept Web | Équivalent Mini-Programme |
|-------------|--------------------------|
| `document.querySelector` | `this.selectComponent('#id')` ou `wx.createSelectorQuery()` |
| `window.location` | `getCurrentPages()` |
| `window.addEventListener` | `wx.onNetworkStatusChange`, etc. |
| `localStorage` | `wx.getStorageSync` / `wx.setStorageSync` (limite de 10 Mo) |
| `fetch` / `XMLHttpRequest` | `wx.request` |
| `<a href>` | `wx.navigateTo({ url: '...' })` |
| React Context / Redux | EventBus (ce boilerplate) ou `getApp().globalData` |
| Modules CSS | Option `styleIsolation` dans Component |
| `npm install` | Supporté (activer `nodeModules: true` dans project.config.json) |
| Service Worker | Cache intégré (les mini-programmes sont mis en cache sur l'appareil) |
| `<img>` | `<image>` (nom de balise différent !) |
| `onclick` | `bind:tap` (nommage d'événement différent !) |
| `className` | `class` (pas de JSX ici) |

## Pièges Courants

1. **Limite de pile de 10 pages** — `navigateTo` échoue silencieusement après 10 pages. Les [helpers de navigation](12-navigation-guide.md) de ce boilerplate gèrent cela automatiquement.
2. **Limite de stockage de 10 Mo** — `wx.setStorageSync` lève une exception quand le quota est dépassé. Le [wrapper de stockage](13-storage-guide.md) de ce boilerplate capture ces erreurs.
3. **Performance de setData()** — L'envoi d'objets volumineux à travers les threads est coûteux. Envoyez uniquement ce qui a changé.
4. **Pas de hot module replacement** — Le simulateur DevTools fait un auto-refresh, mais la page entière se recharge.
5. **`<image>` pas `<img>`** — Nom de balise différent de HTML.
6. **`bind:tap` pas `onclick`** — Syntaxe d'événement différente.
7. **rpx pas px** — Utilisez `rpx` pour les mises en page responsives.

## Voir Aussi

- [Architecture du Projet](02-project-architecture.md) — Comment les pièces de ce boilerplate s'assemblent
- [Premiers Pas](03-getting-started.md) — Configuration et premier lancement
- [Glossaire](16-glossary.md) — Définitions des termes
