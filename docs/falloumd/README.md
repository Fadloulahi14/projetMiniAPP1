# README – Corrections appliquees

Ce document resume **toutes les corrections effectuees**, avec le **probleme** et la **solution**, ainsi que le **pourquoi**.

## 1) Compatibilite WXSS (WeChat)

### 1.1 Variables CSS non supportees
- **Probleme**: WXSS ne supporte pas les variables CSS (`var(--x)`) ni les declarations `--bs-*`.
- **Correction**:
  - Suppression du bloc de variables dans `app.wxss`.
  - Remplacement de tous les `var(--x)` par des valeurs fixes.
- **Pourquoi**: Evite les erreurs de compilation WXSS.

**Fichiers modifies**:
- `app.wxss`
- `components/ui/button/index.wxss`
- `components/ui/stepper/index.wxss`

### 1.2 Selecteurs et pseudo-elements non supportes
- **Probleme**: WXSS ne supporte pas `:root`, `::before`, `::after` et certains selecteurs globaux.
- **Corrections**:
  - `:root` remplace par `page`.
  - `*::before` / `*::after` supprimes.
  - Suppression des pseudo-elements `:after` dans les boutons.
- **Pourquoi**: Evite les erreurs WXSS dues a des selecteurs non supportes.

**Fichiers modifies**:
- `app.wxss`
- `components/ui/button/index.wxss`

### 1.3 Balises globales interdites dans app.wxss
- **Probleme**: `scroll-view { ... }` dans `app.wxss` peut provoquer des erreurs de compilation.
- **Correction**: suppression du bloc `scroll-view` global.
- **Pourquoi**: WeChat peut refuser des selecteurs de balises WXML globaux dans `app.wxss`.

**Fichier modifie**:
- `app.wxss`

### 1.4 Proprietes non standards
- **Probleme**: `scrollbar-width` et `cursor` ne sont pas supportes en WXSS.
- **Correction**: suppression de ces proprietes.
- **Pourquoi**: evite les erreurs de compilation.

**Fichiers modifies**:
- `app.wxss` (scrollbar-width)
- `components/ui/stepper/index.wxss` (cursor)
- `components/ui/tab-bar/index.wxss` (cursor)

### 1.5 Unites non supportees
- **Probleme**: certaines unites comme `ch` et `em` ne sont pas supportees en WXSS.
- **Corrections**:
  - Suppression de `max-width: 30ch;`.
  - Remplacement de `letter-spacing: 0.02em;` par `1rpx`.
- **Pourquoi**: WXSS accepte surtout `rpx` et `%`.

**Fichiers modifies**:
- `app.wxss` (ch)
- `components/ui/button/index.wxss` (em)

### 1.6 Proprietes non compatibles dans @font-face
- **Probleme**: `font-display: swap;` n’est pas supporte en WXSS.
- **Correction**: suppression de la propriete.
- **Pourquoi**: evite les erreurs WXSS.

**Fichier modifie**:
- `app.wxss`

### 1.7 Couleurs hex sur 8 chiffres
- **Probleme**: `#RRGGBBAA` peut etre refuse selon les versions WXSS.
- **Correction**: remplacement par `rgba(...)`.
- **Pourquoi**: meilleure compatibilite WXSS.

**Fichier modifie**:
- `app.wxss`

---

## 2) Permissions invalides dans app.json

- **Probleme**: `permission.scope.camera` et `permission.scope.album` ont ete rejectees par WeChat.
- **Correction**: suppression du bloc `permission` dans `app.json`.
- **Pourquoi**: WeChat Mini Program n’accepte pas ces permissions via `app.json`.

**Fichier modifie**:
- `app.json`

---

## 3) Erreurs en mode simulateur (DevTools)

### 3.1 wx.invokeNativePlugin non disponible
- **Probleme**: en simulateur, `wx.invokeNativePlugin` n’existe pas et provoque des erreurs.
- **Correction**:
  - Ajout d’un guard avant appel.
  - Fallback dev propre pour ne pas casser l’init.
- **Pourquoi**: l’app doit demarrer sans erreurs en mode DevTools.

**Fichier modifie**:
- `utils/apis/native.js`

### 3.2 Detection DevTools modernisee
- **Probleme**: `wx.getSystemInfoSync()` est deprecie.
- **Correction**: utilisation de `wx.getDeviceInfo()` + `wx.getAppBaseInfo()`.
- **Pourquoi**: compatibilite future et suppression des warnings.

**Fichier modifie**:
- `utils/apis/native.js`

### 3.3 Erreur interne SDK (webapi_getwxaasyncsecinfo)
- **Note**: cet avertissement vient du simulateur et ne peut pas etre supprime par le code.
- **Action**: aucune modification demandee (comportement conserve).

---

## 4) Liste complete des fichiers modifies

- `app.wxss`
- `components/ui/button/index.wxss`
- `components/ui/stepper/index.wxss`
- `components/ui/tab-bar/index.wxss`
- `app.json`
- `utils/apis/native.js`

---

## 5) Etat attendu apres corrections

- Compilation WXSS sans erreur.
- Lancement app OK en simulateur (sans crash).
- Logs `[DEV]` clairs au lieu d’erreurs brutales.

