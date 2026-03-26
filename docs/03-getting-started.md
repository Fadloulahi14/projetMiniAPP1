# Premiers Pas

## Prérequis

| Outil | Utilisation |
|-------|-------------|
| [TCMPP Developer Tools](https://cloud.tencent.com/product/tcmpp) | IDE, simulateur, débogueur |
| Git | Contrôle de version |
| Un éditeur de code (VS Code recommandé) | Édition (l'éditeur DevTools fonctionne aussi) |

## Configuration

```bash
git clone <url-du-dépôt>
```

Ouvrez TCMPP Developer Tools → Importer un Projet → Sélectionnez le dossier `tcmpp-boilerplate`.

Le projet se compile automatiquement. Vous devriez voir la page d'accueil avec une barre de navigation et des démos de composants.

## Configuration du Projet

### project.config.json

| Paramètre | Valeur | Ce qu'il fait |
|-----------|--------|---------------|
| `es6` | `true` | Transpile ES2015+ vers ES5 pour la compatibilité |
| `nodeModules` | `true` | Active le support des packages npm |
| `minified` | `true` | Minifie les sorties pour des builds plus petits |
| `uploadWithSourceMap` | `true` | Inclut les source maps pour le débogage |
| `urlCheck` | `false` | Désactive la vérification de liste blanche de domaines (dev uniquement) |
| `TCMPPLibVersion` | `2.2.4` | Version du SDK TCMPP |
| `SASappid` | `mp1vl29c7w1xcmbo` | **Changez ceci** pour votre ID d'application |

### utils/config.js — Configuration de l'Environnement

```javascript
const ENV = 'development'; // Passer à 'production' pour la release

const CONFIG = {
  development: {
    BASE_URL: 'http://localhost:3000/api',    // Votre API dev
    CLIENT_ID: 'your-client-id',              // Identifiants OAuth2
    CLIENT_SECRET: 'your-client-secret',
    // ...
  },
  production: {
    BASE_URL: 'https://api.example.com',      // Votre API prod
    // ...
  },
};
```

**Première chose à faire :** Mettez à jour `config.js` avec vos vraies URLs d'API et identifiants OAuth2.

### utils/constants/index.js

Définissez `__DEV__` à `false` avant le déploiement :
```javascript
export const __DEV__ = true; // Mettre à false pour la production
```

## Premiers Changements

### 1. Changer le titre de l'application

Modifiez `app.json` :
```json
{
  "window": {
    "navigationBarTitleText": "Nom de Votre Application"
  }
}
```

### 2. Mettre à jour votre configuration API

Modifiez `utils/config.js` avec vos vraies URLs d'API et identifiants.

### 3. Ajouter une nouvelle page

Voir [Recettes : Ajouter une Nouvelle Page](14-recipes.md#adding-a-new-page) pour le modèle étape par étape.

## Flux de Travail de Développement

1. **Modifier les fichiers** dans VS Code ou TCMPP DevTools
2. **DevTools recharge automatiquement** à la sauvegarde (hot refresh, pas hot module replacement)
3. **La sortie console** apparaît dans le panneau Console DevTools
4. **Le panneau Debug** montre les requêtes réseau, le stockage et les données de l'application
5. **Le débogage distant** est activé (`remoteDebugLogEnable: true` dans project.config.json)

### Astuces DevTools

- **Bouton Compiler** (Ctrl/Cmd + B) : Forcer la recompilation
- **Bouton Aperçu** : Générer un QR code pour les tests sur appareil réel
- **Panneau Audits** : Vérifications de performance et bonnes pratiques
- **Panneau Stockage** : Voir/modifier les données wx.getStorageSync
- **Panneau Réseau** : Inspecter tous les appels wx.request

## Voir Aussi

- [Concepts des Mini-Programmes](01-mini-program-concepts.md) — Si vous êtes nouveau dans les mini-programmes
- [Architecture du Projet](02-project-architecture.md) — Comprendre comment les pièces se connectent
- [Recettes](14-recipes.md) — Tâches étape par étape
