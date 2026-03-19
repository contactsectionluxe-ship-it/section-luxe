# Où trouver les clés Stripe

Ces clés sont **dans ton compte Stripe**. Personne (y compris un assistant) ne peut y accéder à ta place. Il suffit de les copier depuis le Dashboard.

---

## 1. STRIPE_SECRET_KEY et NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

1. Va sur **[dashboard.stripe.com](https://dashboard.stripe.com)** et connecte-toi.
2. Dans le menu de gauche : **Développeurs** → **Clés API** (ou **Developers** → **API keys**).
3. Tu vois deux blocs :
   - **Clé publicable** : commence par `pk_test_` (en test) ou `pk_live_` (en prod).  
     → Copie-la : c’est **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**.
   - **Clé secrète** : clique sur « Afficher la clé de test » (ou *Reveal test key*). Elle commence par `sk_test_` (ou `sk_live_` en prod).  
     → Copie-la : c’est **STRIPE_SECRET_KEY**.
4. Colle chaque valeur dans ton fichier **`.env.local`** à la racine du projet (sans guillemets).

---

## 2. STRIPE_PRICE_DEPOT_ANNONCE

Tu l’as déjà : **`price_1TCTsvHjugWGBqOCJXPJje1h`**.

Sinon : Dashboard → **Produits** → clique sur ton produit « Dépôt d’annonce » → dans la section **Prix**, l’ID s’affiche (ex. `price_xxx`). C’est cette valeur.

Dans `.env.local` :

```env
STRIPE_PRICE_DEPOT_ANNONCE=price_1TCTsvHjugWGBqOCJXPJje1h
```

---

## 3. STRIPE_WEBHOOK_SECRET

### En local (développement)

1. Installe la **Stripe CLI** : [https://stripe.com/docs/stripe-cli#install](https://stripe.com/docs/stripe-cli#install)
2. Ouvre un terminal et lance :
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
3. La CLI affiche une clé qui commence par **`whsec_...`**. Copie-la.
4. Dans `.env.local` :
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
   ```
5. **Garde ce terminal ouvert** pendant que tu testes le paiement, sinon les événements Stripe n’arriveront pas à ton app.

### En production (site en ligne)

1. Dashboard Stripe → **Développeurs** → **Webhooks** → **Ajouter un endpoint**.
2. **URL de l’endpoint** : `https://ton-domaine.com/api/webhooks/stripe` (remplace par ton vrai domaine).
3. **Événements à écouter** : coche **checkout.session.completed**.
4. Clique sur **Ajouter l’endpoint**.
5. Sur la page du webhook créé : **Signing secret** → **Révéler** (*Reveal*) → copie la clé `whsec_...`.
6. Ajoute-la dans les **variables d’environnement** de ton hébergeur (Vercel, Netlify, etc.) sous le nom **STRIPE_WEBHOOK_SECRET**.

---

## Résumé : ton `.env.local` doit contenir

```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
STRIPE_PRICE_DEPOT_ANNONCE=price_1TCTsvHjugWGBqOCJXPJje1h
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
```

Remplace les `xxxx` par les vraies valeurs copiées depuis le Dashboard et la CLI. Redémarre le serveur Next.js après avoir modifié `.env.local`.
