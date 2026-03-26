// On récupère l'instance de app.js
// getApp() = accès au globalData et à l'EventBus
const app = getApp()

// On récupère les clés d'état depuis app.js
// Pour éviter les fautes de frappe dans les noms d'état
const { STATE_KEYS } = app.globalData
const Bus = app.globalData.eventBus
// Données fictives — simule une réponse API
// En vrai, ces données viendraient de ton API
const PRODUITS_MOCK = [
  {
    id: '1',
    nom: 'T-Shirt Premium',
    prix: 15000,
    description: 'T-shirt 100% coton, très confortable',
    image: 'https://via.placeholder.com/400x300',
  },
  {
    id: '2',
    nom: 'Jean Slim',
    prix: 35000,
    description: 'Jean slim fit, taille normale',
    image: 'https://via.placeholder.com/400x300',
  },
  {
    id: '3',
    nom: 'Sneakers Blanc',
    prix: 45000,
    description: 'Sneakers légères et confortables',
    image: 'https://via.placeholder.com/400x300',
  },
]

Page({
  // ===== DATA =====
  // État initial de la page
  // Le Thread Rendu lit ça au démarrage
  data: {
    produits: [],       // liste des produits à afficher
    panierCount: 0,     // nombre d'articles dans le panier
    isLoading: true,    // true = on affiche "Chargement..."
    hasError: false,    // true = on affiche l'erreur
  },

  // ===== CYCLE DE VIE =====

  async onLoad() {
    // 1. TOUJOURS attendre que app.js finisse son initialisation
    // Sans ça → les données du Bus sont undefined → crash
    await app.globalData.initPromise

    // 2. S'abonner aux changements du panier
    // Chaque fois que panier.items change → on met à jour panierCount
    this._unsubPanier = Bus.onState('panier.items', (change) => {
      // change.value = la nouvelle valeur du panier
      const items = change.value || []
      this.setData({ panierCount: items.length })
    })

    // 3. Lire l'état actuel du panier (valeur déjà existante)
    const panierActuel = Bus.getState('panier.items') || []
    this.setData({ panierCount: panierActuel.length })

    // 4. Charger les produits
    await this.chargerProduits()
  },

  onUnload() {
    // OBLIGATOIRE — se désabonner quand la page se ferme
    // Sinon le Bus continue d'appeler une page qui n'existe plus
    // → fuite mémoire
    if (this._unsubPanier) {
      this._unsubPanier()
    }
  },

  // ===== METHODES =====

  async chargerProduits() {
    // On commence le chargement
    // isLoading: true → affiche "Chargement..." dans le WXML
    this.setData({
      isLoading: true,
      hasError: false,
    })

    try {
      // Simule un appel API avec un délai de 1 seconde
      // En vrai : const produits = await backendAPI.getProduits()
      await new Promise(resolve => setTimeout(resolve, 1000))
      const produits = PRODUITS_MOCK

      // Succès — on envoie les données au Thread Rendu
      // Un seul setData() pour tout → un seul voyage entre threads
      this.setData({
        produits: produits,
        isLoading: false,  // fin du chargement
        hasError: false,
      })

    } catch (err) {
      // Erreur — on affiche le message d'erreur
      console.error('Erreur chargement produits:', err)

      this.setData({
        isLoading: false,
        hasError: true,   // → affiche le bouton "Réessayer"
      })
    }
  },

  ajouterAuPanier(event) {
    // event.currentTarget.dataset → récupère les data-* du WXML
    // Ex: data-id="{{ item.id }}" → dataset.id
    const { id, nom, prix } = event.currentTarget.dataset

    // 1. Lire le panier actuel depuis le Bus
    const panierActuel = Bus.getState('panier.items') || []

    // 2. Vérifier si le produit est déjà dans le panier
    const dejaPresent = panierActuel.find(p => p.id === id)

    if (dejaPresent) {
      // Produit déjà dans le panier → juste une notification
      wx.showToast({
        title: 'Déjà dans le panier !',
        icon: 'none',
        duration: 2000,
      })
      return
    }

    // 3. Ajouter le produit au panier
    const nouveauPanier = [...panierActuel, { id, nom, prix }]

    // 4. Mettre à jour l'état dans le Bus
    // Toutes les pages abonnées à 'panier.items' seront notifiées
    Bus.setState('panier.items', nouveauPanier)

    // 5. Notification de succès
    wx.showToast({
      title: '✅ Ajouté au panier !',
      icon: 'none',
      duration: 2000,
    })
  },
})