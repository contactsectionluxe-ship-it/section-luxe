import { supabase, isSupabaseConfigured } from './client';

function checkSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase non configuré');
  }
  return supabase;
}

/** Raisons de suppression (valeurs stockées en base). */
export const SUPPRESSION_REASONS = ['vendu', 'reserve', 'erreur', 'retire', 'autre'] as const;
export type SuppressionReason = (typeof SUPPRESSION_REASONS)[number];

export interface SellerSalesStats {
  /** Nombre d'annonces encore en ligne créées sur la période (created_at entre dateFrom et dateTo). */
  createdInPeriod: number;
  /** Nombre d'annonces supprimées sur la période, par raison. */
  deletedByReason: Record<SuppressionReason, number>;
  /** Montant total des articles vendus sur la période (somme des amount_cents), en centimes. */
  totalAmountVenduCents: number;
  /** Montant total des articles réservés sur la période (somme des amount_cents), en centimes. */
  totalAmountReserveCents: number;
  /** Annonces actives (créées sur la période, encore actives). */
  activeInPeriod: number;
  /** Total des likes sur les annonces créées sur la période. */
  totalLikesInPeriod: number;
  /** Total des conversations (messages) pour les annonces de la période. */
  totalMessagesInPeriod: number;
  /** Total des révélations de téléphone pour les annonces de la période. */
  totalAppelsInPeriod: number;
}

/**
 * Enregistre une suppression d'annonce (à appeler avant deleteListing pour les stats "Mes ventes").
 * Quand reason = 'vendu' (justificatif "Article vendu"), la suppression est comptabilisée comme vendu
 * dans la page Mes ventes (bloc "Article vendu" + évolution des ventes).
 * amountCents: prix en centimes (vendu/réservé). listingTitle: titre au moment de la suppression (affichage Mes ventes, sans photo).
 */
export async function recordListingDeletion(
  sellerId: string,
  listingId: string,
  reason: string,
  amountCents?: number,
  listingTitle?: string
): Promise<void> {
  const client = checkSupabase();
  const normalizedReason = SUPPRESSION_REASONS.includes(reason as SuppressionReason)
    ? reason
    : 'autre';
  const row: Record<string, unknown> = {
    seller_id: sellerId,
    listing_id: listingId,
    reason: normalizedReason,
  };
  if (amountCents != null && (normalizedReason === 'vendu' || normalizedReason === 'reserve')) {
    row.amount_cents = amountCents;
  }
  if (listingTitle != null && listingTitle !== '') {
    row.listing_title = listingTitle;
  }
  const { error } = await client.from('listing_deletions').insert(row);
  if (error) throw error;
}

export interface DeletionItem {
  id: string;
  listingId: string;
  listingTitle: string | null;
  amountCents: number | null;
  deletedAt: Date;
}

/**
 * Liste des suppressions pour une raison donnée (ex. "vendu") sur la période.
 */
export async function getSellerDeletionsByReason(
  sellerId: string,
  reason: SuppressionReason,
  options?: { dateFrom?: string; dateTo?: string }
): Promise<DeletionItem[]> {
  const client = checkSupabase();
  let q = client
    .from('listing_deletions')
    .select('id, listing_id, listing_title, amount_cents, deleted_at')
    .eq('seller_id', sellerId)
    .eq('reason', reason)
    .order('deleted_at', { ascending: false });
  if (options?.dateFrom) q = q.gte('deleted_at', options.dateFrom);
  if (options?.dateTo) {
    const end = new Date(options.dateTo);
    end.setHours(23, 59, 59, 999);
    q = q.lte('deleted_at', end.toISOString());
  }
  const { data, error } = await q;
  if (error) return [];
  return (data || []).map((row: { id: string; listing_id: string; listing_title?: string | null; amount_cents?: number | null; deleted_at: string }) => ({
    id: row.id,
    listingId: row.listing_id,
    listingTitle: row.listing_title ?? null,
    amountCents: row.amount_cents != null ? Number(row.amount_cents) : null,
    deletedAt: new Date(row.deleted_at),
  }));
}

/**
 * Supprime un enregistrement de vente/réservation (listing_deletion) par son id.
 * Le vendeur ne peut supprimer que ses propres enregistrements (vérifié côté client via sellerId).
 */
export async function deleteListingDeletion(sellerId: string, deletionId: string): Promise<void> {
  const client = checkSupabase();
  const { error } = await client
    .from('listing_deletions')
    .delete()
    .eq('id', deletionId)
    .eq('seller_id', sellerId);
  if (error) throw error;
}

/**
 * Met à jour la raison d'un enregistrement listing_deletion (ex. de 'reserve' à 'vendu').
 * Permet de faire passer un article réservé en "vendu" depuis le popup Articles réservés.
 */
export async function updateListingDeletionReason(
  sellerId: string,
  deletionId: string,
  newReason: SuppressionReason
): Promise<void> {
  const client = checkSupabase();
  const { error } = await client
    .from('listing_deletions')
    .update({ reason: newReason })
    .eq('id', deletionId)
    .eq('seller_id', sellerId);
  if (error) throw error;
}

/**
 * Retourne les stats ventes du vendeur sur une période optionnelle (filtres date comme Mes factures).
 */
export async function getSellerSalesStats(
  sellerId: string,
  options?: { dateFrom?: string; dateTo?: string }
): Promise<SellerSalesStats> {
  const client = checkSupabase();

  let listingsQuery = client
    .from('listings')
    .select('id, is_active, likes_count, phone_reveals_count')
    .eq('seller_id', sellerId);

  if (options?.dateFrom) {
    listingsQuery = listingsQuery.gte('created_at', options.dateFrom);
  }
  if (options?.dateTo) {
    const endOfDay = new Date(options.dateTo);
    endOfDay.setHours(23, 59, 59, 999);
    listingsQuery = listingsQuery.lte('created_at', endOfDay.toISOString());
  }

  const { data: listingsInPeriod, error: errListings } = await listingsQuery;
  if (errListings) throw errListings;

  const list = listingsInPeriod || [];
  const createdInPeriod = list.length;
  const activeInPeriod = list.filter((r: { is_active: boolean }) => r.is_active).length;
  const totalLikesInPeriod = list.reduce((sum: number, r: { likes_count?: number }) => sum + (Number(r.likes_count) || 0), 0);
  const totalAppelsInPeriod = list.reduce((sum: number, r: { phone_reveals_count?: number }) => sum + (Number(r.phone_reveals_count) || 0), 0);

  let totalMessagesInPeriod = 0;
  if (list.length > 0) {
    const listingIds = list.map((r: { id: string }) => r.id);
    const { count, error: errConv } = await client
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .in('listing_id', listingIds);
    if (!errConv) totalMessagesInPeriod = count ?? 0;
  }

  let deletionsQuery = client
    .from('listing_deletions')
    .select('reason, amount_cents')
    .eq('seller_id', sellerId);

  if (options?.dateFrom) {
    deletionsQuery = deletionsQuery.gte('deleted_at', options.dateFrom);
  }
  if (options?.dateTo) {
    const endOfDay = new Date(options.dateTo);
    endOfDay.setHours(23, 59, 59, 999);
    deletionsQuery = deletionsQuery.lte('deleted_at', endOfDay.toISOString());
  }

  const { data: deletions, error: errDeletions } = await deletionsQuery;
  if (errDeletions) {
    console.warn('listing_deletions non disponible:', errDeletions.message || errDeletions);
  }

  const deletedByReason: Record<SuppressionReason, number> = {
    vendu: 0,
    reserve: 0,
    erreur: 0,
    retire: 0,
    autre: 0,
  };
  let totalAmountVenduCents = 0;
  let totalAmountReserveCents = 0;
  for (const row of deletions || []) {
    const r = row.reason as SuppressionReason;
    if (SUPPRESSION_REASONS.includes(r)) {
      deletedByReason[r]++;
    } else {
      deletedByReason.autre++;
    }
    if (r === 'vendu' && row.amount_cents != null) {
      totalAmountVenduCents += Number(row.amount_cents);
    }
    if (r === 'reserve' && row.amount_cents != null) {
      totalAmountReserveCents += Number(row.amount_cents);
    }
  }

  return {
    createdInPeriod,
    deletedByReason,
    totalAmountVenduCents,
    totalAmountReserveCents,
    activeInPeriod,
    totalLikesInPeriod,
    totalMessagesInPeriod,
    totalAppelsInPeriod,
  };
}

export interface MonthEvolution {
  year: number;
  month: number;
  /** Nombre d'articles vendus sur le mois (hors réservés). */
  volume: number;
  /** Montant total des ventes (vendu uniquement, hors réservé) en centimes. */
  amountCents: number;
}

const MOIS_LABELS = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];

/**
 * Retourne l'évolution des ventes (volume + montant) pour chacun des 12 derniers mois.
 * Seules les suppressions avec reason = 'vendu' sont comptées ; les articles réservés (reserve) ne sont pas inclus.
 */
export async function getSellerSalesEvolution(sellerId: string): Promise<MonthEvolution[]> {
  const client = checkSupabase();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0, 0);

  const { data: deletions, error } = await client
    .from('listing_deletions')
    .select('reason, amount_cents, deleted_at')
    .eq('seller_id', sellerId)
    .eq('reason', 'vendu')
    .gte('deleted_at', start.toISOString());

  if (error) {
    console.warn('getSellerSalesEvolution:', error.message);
    return buildEmptyEvolution();
  }

  const byKey: Record<string, { volume: number; amountCents: number }> = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    byKey[key] = { volume: 0, amountCents: 0 };
  }

  for (const row of deletions || []) {
    const dt = new Date(row.deleted_at);
    const key = `${dt.getFullYear()}-${dt.getMonth()}`;
    if (!byKey[key]) byKey[key] = { volume: 0, amountCents: 0 };
    byKey[key].volume += 1;
    byKey[key].amountCents += Number(row.amount_cents) || 0;
  }

  const result: MonthEvolution[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const data = byKey[key] || { volume: 0, amountCents: 0 };
    result.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      volume: data.volume,
      amountCents: data.amountCents,
    });
  }
  return result;
}

export function getMonthLabel(evolution: MonthEvolution): string {
  return `${MOIS_LABELS[evolution.month]} ${String(evolution.year).slice(2)}`;
}

function buildEmptyEvolution(): MonthEvolution[] {
  const now = new Date();
  const result: MonthEvolution[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    result.push({ year: d.getFullYear(), month: d.getMonth(), volume: 0, amountCents: 0 });
  }
  return result;
}
