import { supabase, isSupabaseConfigured } from './client';
import { getListing } from './listings';
import { getSellerListings } from './listings';

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

/**
 * Numéro de facture : année + mois + "-" + numéro d'annonce (ex. 202601-10K2001).
 * Mois = mois de publication de l'annonce.
 */
function buildInvoiceNumber(publishedAt: Date, listingNumber: string | null | undefined, listingId: string): string {
  const year = publishedAt.getFullYear();
  const month = String(publishedAt.getMonth() + 1).padStart(2, '0');
  const num = listingNumber && listingNumber.trim() ? listingNumber.trim() : listingId.slice(0, 8);
  return `${year}${month}-${num}`;
}

/** Crée une facture à 0€ pour une annonce (émetteur Section luxe). Numéro = 2026-mois-numéro annonce. */
export async function createInvoice(params: {
  sellerId: string;
  listingId: string;
  listingTitle?: string | null;
}): Promise<string> {
  const client = supabase;
  if (!isSupabaseConfigured || !client) throw new Error('Supabase non configuré');

  const listing = await getListing(params.listingId);
  const publishedAt = listing?.createdAt ?? new Date();
  const listingNumber = listing?.listingNumber ?? null;
  const invoiceNumber = buildInvoiceNumber(publishedAt, listingNumber, params.listingId);

  const { data, error } = await client
    .from('seller_invoices')
    .insert({
      seller_id: params.sellerId,
      listing_id: params.listingId,
      amount_cents: 0,
      issuer: ISSUER,
      invoice_number: invoiceNumber,
      listing_title: params.listingTitle ?? listing?.title ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

/** Liste les factures du vendeur (plus récentes en premier). */
export async function getSellerInvoices(sellerId: string): Promise<SellerInvoice[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('seller_invoices')
    .select('*')
    .eq('seller_id', sellerId)
    .order('issued_at', { ascending: false });

  if (error) return [];
  return (data || []).map(rowToInvoice);
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

/** Vérifie si une facture existe déjà pour cette annonce. */
export async function hasInvoiceForListing(listingId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { data, error } = await supabase
    .from('seller_invoices')
    .select('id')
    .eq('listing_id', listingId)
    .limit(1)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

/**
 * Crée une facture à 0€ pour cette annonce si elle n'en a pas encore.
 * À appeler à la publication d'une annonce (création ou activation).
 */
export async function ensureInvoiceForListing(listingId: string): Promise<void> {
  const listing = await getListing(listingId);
  if (!listing || listing.sellerId == null) return;
  const exists = await hasInvoiceForListing(listingId);
  if (exists) return;
  try {
    await createInvoice({
      sellerId: listing.sellerId,
      listingId: listing.id,
      listingTitle: listing.title,
    });
  } catch (e) {
    console.error('Création facture pour annonce', listingId, e);
  }
}

/**
 * Rattrapage : crée une facture à 0€ pour chaque annonce active du vendeur qui n'en a pas encore.
 * À appeler au chargement de la page Mes factures.
 */
export async function ensureInvoicesForActiveListings(sellerId: string): Promise<void> {
  const listings = await getSellerListings(sellerId);
  const active = listings.filter((l) => l.isActive);
  for (const listing of active) {
    const exists = await hasInvoiceForListing(listing.id);
    if (!exists) {
      try {
        await createInvoice({
          sellerId: listing.sellerId,
          listingId: listing.id,
          listingTitle: listing.title,
        });
      } catch (e) {
        console.error('Rattrapage facture pour annonce', listing.id, e);
      }
    }
  }
}
