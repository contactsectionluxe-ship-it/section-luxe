import { supabase, isSupabaseConfigured } from './client';

const ISSUER = 'Section luxe';

export interface SellerInvoice {
  id: string;
  sellerId: string;
  listingId: string;
  amountCents: number;
  issuedAt: Date;
  invoiceNumber: string;
  issuer: string;
  listingTitle: string | null;
  createdAt: Date;
}

function rowToInvoice(row: any): SellerInvoice {
  return {
    id: row.id,
    sellerId: row.seller_id,
    listingId: row.listing_id,
    amountCents: row.amount_cents ?? 0,
    issuedAt: new Date(row.issued_at),
    invoiceNumber: row.invoice_number ?? '',
    issuer: row.issuer ?? ISSUER,
    listingTitle: row.listing_title ?? null,
    createdAt: new Date(row.created_at),
  };
}

/** Récupère une facture par id (RLS : uniquement le vendeur propriétaire). */
export async function getInvoiceById(invoiceId: string): Promise<SellerInvoice | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from('seller_invoices')
    .select('*')
    .eq('id', invoiceId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToInvoice(data);
}
