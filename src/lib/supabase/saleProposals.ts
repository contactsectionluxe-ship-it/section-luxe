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
    })
    .select('id')
    .single();

  if (error || !row?.id) {
    if (error) throwSaleProposalDbError(error);
    throw new Error('Création de la proposition impossible');
  }

  const proposalId = row.id as string;
  if (input.invitedSellerIds.length > 0) {
    const invites = input.invitedSellerIds.map((seller_id) => ({ proposal_id: proposalId, seller_id }));
    const { error: invErr } = await client.from('sale_proposal_invited_sellers').insert(invites);
    if (invErr) {
      throwSaleProposalDbError(invErr);
    }
  }

  return proposalId;
}

export type SaleProposalRow = {
  id: string;
  visitor_id: string;
  title: string;
  description: string;
  category: string;
  wish_price_cents: number;
  locations: SaleProposalLocationEntry[];
  photo_urls: string[];
  created_at: string;
  invites?: {
    seller_id: string;
    estimated_price_cents: number | null;
    seller_note: string | null;
    updated_at: string | null;
  }[];
};

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
      id, visitor_id, title, description, category, wish_price_cents, locations, photo_urls, created_at,
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
        id, visitor_id, title, description, category, wish_price_cents, locations, photo_urls, created_at
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
