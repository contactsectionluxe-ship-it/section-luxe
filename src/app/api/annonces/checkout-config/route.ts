import { NextResponse } from 'next/server';
import { isStripeDepotEnabled } from '@/lib/stripe';

/** Indique si le paiement pour déposer une annonce est activé (Stripe configuré). */
export async function GET() {
  return NextResponse.json({
    stripeDepotEnabled: isStripeDepotEnabled(),
  });
}
