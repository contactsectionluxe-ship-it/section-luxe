import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getAuthUserFromBearer } from '@/lib/api/getAuthUserFromBearer';
import { getSupabaseServer } from '@/lib/supabase/server';
import { stripeServer } from '@/lib/stripe';

function productTitleFromStripeInvoice(inv: Stripe.Invoice): string | null {
  const lines = inv.lines?.data;
  if (!lines?.length) return null;

  for (const line of lines) {
    const price = line.pricing?.price_details?.price;
    if (price && typeof price === 'object' && 'product' in price) {
      const prod = (price as Stripe.Price).product;
      if (typeof prod === 'object' && prod !== null && 'name' in prod) {
        const name = String((prod as { name?: string }).name || '').trim();
        if (name) return name;
      }
    }
  }

  return lines[0].description?.trim() || null;
}

/**
 * Liste les factures Stripe du client associé au vendeur (abonnements, prorata, etc.).
 */
export async function GET(request: NextRequest) {
  if (!stripeServer) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 });
  }

  const auth = await getAuthUserFromBearer(request);
  if (!auth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data: row, error } = await supabase
    .from('sellers')
    .select('stripe_customer_id')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: 'Vendeur introuvable' }, { status: 404 });
  }

  const customerId = (row as { stripe_customer_id: string | null }).stripe_customer_id;
  if (!customerId?.startsWith('cus_')) {
    return NextResponse.json({ invoices: [] as unknown[] });
  }

  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 40, 100);

  let list: Awaited<ReturnType<typeof stripeServer.invoices.list>>;
  try {
    list = await stripeServer.invoices.list({
      customer: customerId,
      limit,
      expand: ['data.lines.data.pricing.price_details.price.product'],
    });
  } catch {
    try {
      list = await stripeServer.invoices.list({
        customer: customerId,
        limit,
      });
    } catch (e) {
      const msg =
        e && typeof e === 'object' && 'message' in e && typeof (e as Error).message === 'string'
          ? (e as Error).message
          : 'Impossible de charger les factures Stripe';
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  const invoices = list.data.map((inv) => ({
    id: inv.id,
    number: inv.number,
    status: inv.status,
    created: inv.created,
    total: inv.total,
    currency: inv.currency,
    hostedInvoiceUrl: inv.hosted_invoice_url,
    invoicePdf: inv.invoice_pdf,
    productTitle: productTitleFromStripeInvoice(inv),
  }));

  return NextResponse.json({ invoices });
}
