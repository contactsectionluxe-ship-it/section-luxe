import Stripe from 'stripe';

/** Instance Stripe côté serveur (clé secrète). Ne pas utiliser côté client. */
function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith('sk_')) return null;
  return new Stripe(key);
}

export const stripeServer = getStripe();

/** ID du prix Stripe pour « Dépôt d'annonce » (ex. price_xxx). */
export const STRIPE_PRICE_DEPOT_ANNONCE = process.env.STRIPE_PRICE_DEPOT_ANNONCE || '';

/** Prix récurrents abonnement vendeur (formules Plus / Pro), mode subscription Checkout. */
export const STRIPE_PRICE_SUBSCRIPTION_PLUS =
  process.env.STRIPE_PRICE_SUBSCRIPTION_PLUS || '';
export const STRIPE_PRICE_SUBSCRIPTION_PRO =
  process.env.STRIPE_PRICE_SUBSCRIPTION_PRO || '';

/** Clés Stripe + prix Plus et Pro renseignés (pour une future session Checkout abonnement). */
/** Clé publique pour Stripe.js (Checkout intégré, etc.). */
export function isStripePublishableKeyConfigured(): boolean {
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  return pk.startsWith('pk_');
}

export function isStripeSellerSubscriptionsConfigured(): boolean {
  return Boolean(
    stripeServer &&
      STRIPE_PRICE_SUBSCRIPTION_PLUS.startsWith('price_') &&
      STRIPE_PRICE_SUBSCRIPTION_PRO.startsWith('price_'),
  );
}

/**
 * Paiement Stripe au dépôt d'annonce.
 * Désactivé par défaut (publication directe sans paiement).
 * Pour réactiver : `STRIPE_DEPOT_ANNONCE_ENABLED=true` + `STRIPE_SECRET_KEY` + `STRIPE_PRICE_DEPOT_ANNONCE`.
 */
export function isStripeDepotEnabled(): boolean {
  if (process.env.STRIPE_DEPOT_ANNONCE_ENABLED !== 'true') return false;
  return Boolean(stripeServer && STRIPE_PRICE_DEPOT_ANNONCE);
}
