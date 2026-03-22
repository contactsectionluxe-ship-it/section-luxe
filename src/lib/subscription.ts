export type SubscriptionTier = 'start' | 'plus' | 'pro';

export function normalizeSubscriptionTier(raw: string | null | undefined): SubscriptionTier {
  const t = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (t === 'plus' || t === 'pro') return t;
  return 'start';
}

export function maxActiveListingsForTier(tier: SubscriptionTier): number {
  switch (tier) {
    case 'start':
      return 50;
    case 'plus':
      return 200;
    case 'pro':
      return 800;
    default:
      return 50;
  }
}

export class SubscriptionLimitError extends Error {
  readonly code = 'SUBSCRIPTION_LIMIT' as const;

  constructor(
    public readonly tier: SubscriptionTier,
    public readonly max: number,
    public readonly attemptedTotal: number,
  ) {
    const msg =
      tier === 'start'
        ? `Vous avez atteint la limite de ${max} annonces actives. Passez à Plus ou Pro pour en publier davantage.`
        : tier === 'plus'
          ? `Vous avez atteint la limite de ${max} annonces actives. Passez à Pro pour continuer.`
          : `Vous avez atteint la limite de ${max} annonces actives. Contactez-nous pour aller au-delà.`;
    super(msg);
    this.name = 'SubscriptionLimitError';
  }
}

export function isSubscriptionLimitError(e: unknown): e is SubscriptionLimitError {
  return e instanceof SubscriptionLimitError;
}
