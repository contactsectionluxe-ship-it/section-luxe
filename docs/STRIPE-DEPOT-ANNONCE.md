# Intégration Stripe : paiement pour déposer une annonce

## Vue d’ensemble

Le vendeur **paie un montant** (ex. 2 €) **avant** que son annonce soit publiée.  
Flux recommandé (Stripe Checkout) :

1. Le vendeur remplit le formulaire « Déposer une annonce » comme aujourd’hui.
2. Au clic sur « Publier », l’annonce est créée en **brouillon** (`is_active: false`).
3. Redirection vers **Stripe Checkout** (page de paiement hébergée par Stripe).
4. Après paiement réussi :
   - Stripe redirige vers une page **succès** de ton site.
   - Un **webhook** Stripe reçoit `checkout.session.completed` et active l’annonce (`is_active: true`).
5. L’annonce apparaît alors dans le catalogue.

## Prérequis

- Compte [Stripe](https://dashboard.stripe.com) (mode test pour commencer).
- Clés API : **Clé secrète** et **Clé publicable** (Dashboard → Développeurs → Clés API).
- Pour le webhook en local : [Stripe CLI](https://stripe.com/docs/stripe-cli) pour recevoir les événements.

## Variables d’environnement

À définir dans `.env.local` (et sur ton hébergeur) :

```env
# Stripe (obligatoire pour le paiement dépôt d’annonce)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Webhook : à remplir après avoir créé le webhook dans le Dashboard Stripe
# En local, la CLI Stripe fournit une clé temporaire (stripe listen --forward-to ...)
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Création du produit Stripe

Dans le Dashboard Stripe : **Produits** → **Ajouter un produit**  
- Nom : ex. « Dépôt d’annonce »
- Prix : montant unique (ex. 2,00 €)  
Récupère l’**ID du prix** (ex. `price_xxx`) et mets-le dans une variable d’env ou en constante :

```env
STRIPE_PRICE_DEPOT_ANNONCE=price_xxx
```

## Flux technique

| Étape | Où | Action |
|-------|-----|--------|
| 1 | Client (`/vendeur/annonces/nouvelle`) | Soumission du formulaire → création annonce en brouillon (`createListing` avec `isActive: false`) + upload photos. |
| 2 | Client | Appel `POST /api/annonces/checkout-session` avec `listingId` (et `sellerId` pour vérif). |
| 3 | API | Vérification que l’annonce existe, appartient au vendeur, et est bien en brouillon. Création d’une **Checkout Session** Stripe (mode payment) avec `client_reference_id: listingId`, `success_url`, `cancel_url`. Retour de `{ url }`. |
| 4 | Client | Redirection `window.location.href = url` vers Stripe Checkout. |
| 5 | Stripe | Paiement par le vendeur. |
| 6 | Stripe | Redirection vers ta `success_url` (ex. `/vendeur/annonces/nouvelle/success?session_id=...`) + envoi du webhook `checkout.session.completed`. |
| 7 | API webhook `POST /api/webhooks/stripe` | Vérification de la signature Stripe, lecture `client_reference_id` = `listingId`, activation de l’annonce (`is_active: true`). |
| 8 | Page succès | Optionnel : appeler une API ou le même backend pour « confirmer » l’annonce (idempotent) si le webhook n’a pas encore été traité. Puis redirection vers l’annonce ou « Mes annonces ». |

## Sécurité

- Ne jamais créer ou activer une annonce côté client sans vérifier le paiement.
- Vérifier dans le webhook que `payment_status === 'paid'` et que `client_reference_id` correspond à une annonce en brouillon du bon vendeur.
- Utiliser `STRIPE_WEBHOOK_SECRET` pour valider la signature des requêtes webhook (voir [Stripe – Vérifier les webhooks](https://docs.stripe.com/webhooks/signatures)).

## Résumé

- **Stripe Checkout** : page de paiement hébergée par Stripe, conforme PCI, pas de carte à gérer côté front.
- **Brouillon puis paiement** : l’annonce est créée en base en brouillon, puis activée uniquement après réception du paiement (webhook + éventuellement page succès).
- **Prix** : défini dans le Dashboard Stripe (produit « Dépôt d’annonce ») et référencé par `STRIPE_PRICE_DEPOT_ANNONCE`.

Une fois ces éléments en place (API checkout, webhook, page succès, adaptation du formulaire), le vendeur pourra payer pour déposer son annonce.
