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

/**
 * Paiement Stripe au dépôt d'annonce.
 * Désactivé par défaut (publication directe sans paiement).
 * Pour réactiver : `STRIPE_DEPOT_ANNONCE_ENABLED=true` + `STRIPE_SECRET_KEY` + `STRIPE_PRICE_DEPOT_ANNONCE`.
 */
export function isStripeDepotEnabled(): boolean {
  if (process.env.STRIPE_DEPOT_ANNONCE_ENABLED !== 'true') return false;
  return Boolean(stripeServer && STRIPE_PRICE_DEPOT_ANNONCE);
}
