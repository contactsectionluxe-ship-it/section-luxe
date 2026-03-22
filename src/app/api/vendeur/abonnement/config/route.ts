import { NextResponse } from 'next/server';
import {
  isStripePublishableKeyConfigured,
  isStripeSellerSubscriptionsConfigured,
} from '@/lib/stripe';

/** Indique si le parcours d’abonnement Stripe (Plus/Pro) est utilisable (sans exposer de secrets). */
export async function GET() {
  return NextResponse.json({
    subscriptionsEnabled: isStripeSellerSubscriptionsConfigured(),
    publishableKeyConfigured: isStripePublishableKeyConfigured(),
  });
}
