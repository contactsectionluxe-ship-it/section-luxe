import type { Listing } from '@/types';
import { supabase, isSupabaseConfigured } from './client';
import type { SaleProposalLocationEntry } from '@/lib/saleProposalLocations';

const SALE_PROPOSALS_MIGRATION_HINT =
  'Dans Supabase : SQL → exécuter le fichier du dépôt « supabase/migrations/sale_proposals_and_conversations.sql », puis recharger la page.';

/** True si la table n’est pas dans le cache API / absente (pas une simple erreur RLS). */
function isMissingSaleProposalsTableMessage(msg: string): boolean {
  const m = msg.toLowerCase();
  if (!m.includes('sale_proposal')) return false;
  if (m.includes('schema cache') || m.includes('could not find the table')) return true;
  if (m.includes('does not exist')) return true;
  return false;
}

const RLS_RECURSION_HINT =
  'Exécutez dans Supabase → SQL le fichier « supabase/migrations/fix_sale_proposals_rls_recursion.sql », puis rechargez la page.';

function throwSaleProposalDbError(error: { message?: string } | null | undefined): never {
  const msg = error?.message || 'Erreur Supabase';
  if (isMissingSaleProposalsTableMessage(msg)) {
    throw new Error(`Les tables des propositions de vente ne sont pas installées sur ce projet. ${SALE_PROPOSALS_MIGRATION_HINT}`);
  }
  if (/infinite recursion/i.test(msg) && /sale_proposal/i.test(msg)) {
    throw new Error(`Récursion infinie des politiques RLS sur les propositions de vente. ${RLS_RECURSION_HINT}`);
  }
  throw new Error(msg);
}

function checkClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase non configuré');
  }
  return supabase;
}

/** Saisie finale « Contacter le vendeur » (proposer une pièce, dernière étape). */
export type SaleProposalBuyerContact = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message: string;
};

export type CreateSaleProposalInput = {
  visitorId: string;
  title: string;
  description: string;
  category: string;
  genre: ('homme' | 'femme')[] | null;
  articleType: string | null;
  brand: string | null;
  model: string | null;
  condition: string | null;
  material: string | null;
  color: string | null;
  size: string | null;
  heightCm: number | null;
  widthCm: number | null;
  year: number | null;
  packaging: string[] | null;
  wishPriceCents: number;
  locations: SaleProposalLocationEntry[];
  invitedSellerIds: string[];
  buyerContact: SaleProposalBuyerContact;
};

export async function createSaleProposalWithInvites(input: CreateSaleProposalInput): Promise<string> {
  const client = checkClient();
  const { data: row, error } = await client
    .from('sale_proposals')
    .insert({
      visitor_id: input.visitorId,
      title: input.title,
      description: input.description,
      category: input.category,
      genre: input.genre ?? [],
      article_type: input.articleType,
      brand: input.brand,
      model: input.model,
      condition: input.condition,
      material: input.material,
      color: input.color,
      size: input.size,
      height_cm: input.heightCm,
      width_cm: input.widthCm,
      year: input.year,
      packaging: input.packaging,
      wish_price_cents: input.wishPriceCents,
      locations: input.locations as unknown as Record<string, unknown>,
      photo_urls: [],
      buyer_contact: input.buyerContact as unknown as Record<string, unknown>,
    })
    .select('id')
    .single();

  if (error || !row?.id) {
    if (error) throwSaleProposalDbError(error);
    throw new Error('Création de la proposition impossible');
  }

  const proposalId = row.id as string;
  const uniqueInvitedSellerIds = [...new Set(input.invitedSellerIds)];
  if (uniqueInvitedSellerIds.length > 0) {
    const invites = uniqueInvitedSellerIds.map((seller_id) => ({ proposal_id: proposalId, seller_id }));
    const { error: invErr } = await client.from('sale_proposal_invited_sellers').insert(invites);
    if (invErr) {
      throwSaleProposalDbError(invErr);
    }
  }

  return proposalId;
}

export type UpdateSaleProposalPayload = Omit<CreateSaleProposalInput, 'visitorId'>;

/**
 * Remplace les invitations via l’API serveur (service role) : le DELETE sous RLS client ne supprime souvent aucune ligne
 * sans politique dédiée, ce qui provoquait une erreur de clé dupliquée à l’insert.
 */
async function replaceSaleProposalInvitesViaApi(proposalId: string, sellerIds: string[]): Promise<void> {
  const { supabase, isSupabaseConfigured } = await import('@/lib/supabase/client');
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase non configuré');
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Session expirée. Reconnectez-vous.');
  }
  const base =
    typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
  if (!base) {
    throw new Error("Impossible de joindre l'API (origine inconnue).");
  }
  const uniqueSellerIds = [...new Set(sellerIds)];
  const res = await fetch(`${base}/api/replace-sale-proposal-invites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ proposalId, sellerIds: uniqueSellerIds }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || `Mise à jour des vendeurs invités impossible (${res.status})`);
  }
}

/**
 * Met à jour une proposition du visiteur, supprime toutes les lignes d’invitation (offres vendeurs)
 * puis réinsère les vendeurs sélectionnés (sans estimation).
 */
export async function updateVisitorSaleProposalWithInvites(
  proposalId: string,
  visitorId: string,
  input: UpdateSaleProposalPayload,
): Promise<void> {
  const client = checkClient();
  const { error: updErr } = await client
    .from('sale_proposals')
    .update({
      title: input.title,
      description: input.description,
      category: input.category,
      genre: input.genre ?? [],
      article_type: input.articleType,
      brand: input.brand,
      model: input.model,
      condition: input.condition,
      material: input.material,
      color: input.color,
      size: input.size,
      height_cm: input.heightCm,
      width_cm: input.widthCm,
      year: input.year,
      packaging: input.packaging,
      wish_price_cents: input.wishPriceCents,
      locations: input.locations as unknown as Record<string, unknown>,
      buyer_contact: input.buyerContact as unknown as Record<string, unknown>,
    })
    .eq('id', proposalId)
    .eq('visitor_id', visitorId);

  if (updErr) throwSaleProposalDbError(updErr);

  await replaceSaleProposalInvitesViaApi(proposalId, input.invitedSellerIds);
}

export type SaleProposalRow = {
  id: string;
  visitor_id: string;
  title: string;
  description: string;
  category: string;
  genre?: ('homme' | 'femme')[] | string[] | null;
  article_type?: string | null;
  brand?: string | null;
  model?: string | null;
  condition?: string | null;
  material?: string | null;
  color?: string | null;
  size?: string | null;
  height_cm?: number | null;
  width_cm?: number | null;
  year?: number | null;
  packaging?: string[] | null;
  wish_price_cents: number;
  locations: SaleProposalLocationEntry[];
  photo_urls: string[];
  buyer_contact?: SaleProposalBuyerContact | null;
  created_at: string;
  invites?: {
    seller_id: string;
    estimated_price_cents: number | null;
    seller_note: string | null;
    updated_at: string | null;
  }[];
};

/** Pour réutiliser `ListingCaracteristiques` (vue ligne catalogue) sur une proposition de vente. */
export function saleProposalRowToListing(p: SaleProposalRow): Listing {
  const created = new Date(p.created_at);
  const rawGenre = p.genre;
  const genre =
    Array.isArray(rawGenre) && rawGenre.length > 0
      ? (rawGenre.filter((x): x is 'homme' | 'femme' => x === 'homme' || x === 'femme') as ('homme' | 'femme')[])
      : null;
  return {
    id: p.id,
    sellerId: '',
    sellerName: '',
    title: p.title,
    description: p.description ?? '',
    price: Number(p.wish_price_cents) / 100,
    category: p.category as Listing['category'],
    genre: genre?.length ? genre : null,
    photos: p.photo_urls ?? [],
    likesCount: 0,
    isActive: true,
    createdAt: created,
    updatedAt: created,
    brand: p.brand ?? null,
    model: p.model ?? null,
    condition: p.condition ?? null,
    material: p.material ?? null,
    color: p.color ?? null,
    heightCm: p.height_cm ?? null,
    widthCm: p.width_cm ?? null,
    year: p.year ?? null,
    packaging: p.packaging ?? null,
    size: p.size ?? null,
    articleType: p.article_type ?? null,
  };
}

/** Supprime une proposition créée par l’acheteur (invitations et conversations liées en cascade). */
export async function deleteVisitorSaleProposal(visitorId: string, proposalId: string): Promise<void> {
  const client = checkClient();
  const { error } = await client.from('sale_proposals').delete().eq('id', proposalId).eq('visitor_id', visitorId);
  if (error) throwSaleProposalDbError(error);
}

export async function fetchVisitorSaleProposals(visitorId: string): Promise<SaleProposalRow[]> {
  const client = checkClient();
  const { data, error } = await client
    .from('sale_proposals')
    .select(
      `
      id, visitor_id, title, description, category, genre, article_type, brand, model, condition, material, color, size, height_cm, width_cm, year, packaging,
      wish_price_cents, locations, photo_urls, buyer_contact, created_at,
      sale_proposal_invited_sellers(seller_id, estimated_price_cents, seller_note, updated_at)
    `,
    )
    .eq('visitor_id', visitorId)
    .order('created_at', { ascending: false });

  if (error) throwSaleProposalDbError(error);
  const raw = (data || []) as unknown as (SaleProposalRow & {
    sale_proposal_invited_sellers?: SaleProposalRow['invites'];
  })[];
  return raw.map(({ sale_proposal_invited_sellers, ...rest }) => ({
    ...rest,
    invites: sale_proposal_invited_sellers,
  }));
}

/** Une proposition du visiteur (pour préremplir « Proposer une pièce » depuis Suivre mes offres). */
export async function fetchVisitorSaleProposalById(visitorId: string, proposalId: string): Promise<SaleProposalRow | null> {
  const client = checkClient();
  const { data, error } = await client
    .from('sale_proposals')
    .select(
      `
      id, visitor_id, title, description, category, genre, article_type, brand, model, condition, material, color, size, height_cm, width_cm, year, packaging,
      wish_price_cents, locations, photo_urls, buyer_contact, created_at,
      sale_proposal_invited_sellers(seller_id, estimated_price_cents, seller_note, updated_at)
    `,
    )
    .eq('id', proposalId)
    .eq('visitor_id', visitorId)
    .maybeSingle();

  if (error) throwSaleProposalDbError(error);
  if (!data) return null;
  const raw = data as unknown as SaleProposalRow & { sale_proposal_invited_sellers?: SaleProposalRow['invites'] };
  const { sale_proposal_invited_sellers, ...rest } = raw;
  return {
    ...rest,
    invites: sale_proposal_invited_sellers,
  };
}

export type InvitedProposalRow = {
  proposal_id: string;
  seller_id: string;
  estimated_price_cents: number | null;
  seller_note: string | null;
  updated_at: string | null;
  proposal: SaleProposalRow;
};

export async function fetchSellerInvitedProposals(sellerId: string): Promise<InvitedProposalRow[]> {
  const client = checkClient();
  const { data, error } = await client
    .from('sale_proposal_invited_sellers')
    .select(
      `
      proposal_id,
      seller_id,
      estimated_price_cents,
      seller_note,
      updated_at,
      sale_proposals(
        id, visitor_id, title, description, category, genre, article_type, brand, model, condition, material, color, size, height_cm, width_cm, year, packaging,
        wish_price_cents, locations, photo_urls, buyer_contact, created_at
      )
    `,
    )
    .eq('seller_id', sellerId);

  if (error) throwSaleProposalDbError(error);
  const raw = (data || []) as unknown as (Omit<InvitedProposalRow, 'proposal'> & {
    sale_proposals: SaleProposalRow | null;
  })[];
  return raw
    .filter((r) => r.sale_proposals != null)
    .map((r) => ({
      proposal_id: r.proposal_id,
      seller_id: r.seller_id,
      estimated_price_cents: r.estimated_price_cents,
      seller_note: r.seller_note,
      updated_at: r.updated_at,
      proposal: r.sale_proposals as SaleProposalRow,
    }));
}

export async function updateSellerProposalOffer(
  sellerId: string,
  proposalId: string,
  payload: { estimatedPriceCents: number | null; sellerNote: string | null },
): Promise<void> {
  const client = checkClient();
  const { error } = await client
    .from('sale_proposal_invited_sellers')
    .update({
      estimated_price_cents: payload.estimatedPriceCents,
      seller_note: payload.sellerNote,
      updated_at: new Date().toISOString(),
    })
    .eq('proposal_id', proposalId)
    .eq('seller_id', sellerId);

  if (error) throwSaleProposalDbError(error);
}

/** Retire l’invitation pour ce vendeur uniquement (Sourcing) ; la proposition reste pour l’acheteur et les autres vendeurs. */
export async function deleteSellerOwnProposalInvite(sellerId: string, proposalId: string): Promise<void> {
  const client = checkClient();
  const { error } = await client
    .from('sale_proposal_invited_sellers')
    .delete()
    .eq('proposal_id', proposalId)
    .eq('seller_id', sellerId);

  if (error) throwSaleProposalDbError(error);
}

