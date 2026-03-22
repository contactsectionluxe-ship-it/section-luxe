import type { SupabaseClient } from '@supabase/supabase-js';
import { maxActiveListingsForTier, type SubscriptionTier } from '@/lib/subscription';

const UPDATE_CHUNK = 200;

/**
 * Désactive les annonces actives en trop pour respecter le plafond du tier.
 * Conserve les annonces les plus anciennes (created_at croissant), désactive les plus récentes en excès.
 */
export async function enforceActiveListingsCapForSeller(
  supabase: SupabaseClient,
  sellerId: string,
  tier: SubscriptionTier,
): Promise<{ deactivated: number }> {
  const max = maxActiveListingsForTier(tier);

  const { data: rows, error } = await supabase
    .from('listings')
    .select('id')
    .eq('seller_id', sellerId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`enforceActiveListingsCapForSeller: ${error.message}`);
  }
  if (!rows?.length || rows.length <= max) {
    return { deactivated: 0 };
  }

  const overflowIds = rows.slice(max).map((r) => r.id as string);
  const now = new Date().toISOString();
  let deactivated = 0;

  for (let i = 0; i < overflowIds.length; i += UPDATE_CHUNK) {
    const chunk = overflowIds.slice(i, i + UPDATE_CHUNK);
    const { error: uErr } = await supabase
      .from('listings')
      .update({ is_active: false, updated_at: now })
      .in('id', chunk);
    if (uErr) {
      throw new Error(`enforceActiveListingsCapForSeller update: ${uErr.message}`);
    }
    deactivated += chunk.length;
  }

  if (deactivated > 0) {
    console.info(
      `[sellerListingCap] seller ${sellerId} tier ${tier}: désactivé ${deactivated} annonce(s) (plafond ${max})`,
    );
  }

  return { deactivated };
}
