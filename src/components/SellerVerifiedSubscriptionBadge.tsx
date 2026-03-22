import type { CSSProperties } from 'react';
import type { SubscriptionTier } from '@/lib/subscription';

export type SellerVerifiedSubscriptionBadgeVariant = 'annonce' | 'catalogueGrid' | 'catalogueLine';

type Props = {
  tier: SubscriptionTier;
  /** annonce : taille relative. Catalogue : MapPin + currentColor. Même gris #86868b partout (ligne vendeur catalogue). */
  variant?: SellerVerifiedSubscriptionBadgeVariant;
};

/** Badge plein + coche blanche (Plus/Pro), même forme que l’icône Lucide badge-check. */
export function SellerVerifiedSubscriptionBadge({ tier, variant = 'annonce' }: Props) {
  if (tier !== 'plus' && tier !== 'pro') return null;

  const isCatalogue = variant === 'catalogueGrid' || variant === 'catalogueLine';
  const iconPx = isCatalogue ? 15 : null;

  const wrapStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    margin: 0,
    padding: 0,
    lineHeight: 1,
    verticalAlign: 'middle',
    flexShrink: 0,
    marginTop: 0,
    ...(isCatalogue
      ? { transform: 'translateY(-0.95px)' }
      : { transform: 'translateY(0.75px)' }),
  };

  const svgStyle: CSSProperties =
    iconPx != null
      ? {
          width: iconPx,
          height: iconPx,
          flexShrink: 0,
          color: 'currentColor',
          display: 'block',
        }
      : {
          width: '0.88em',
          height: '0.88em',
          flexShrink: 0,
          color: '#86868b',
          display: 'block',
        };

  return (
    <span
      aria-label={tier === 'pro' ? 'Vendeur abonnement Pro' : 'Vendeur abonnement Plus'}
      title={tier === 'pro' ? 'Abonnement Pro' : 'Abonnement Plus'}
      style={wrapStyle}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden style={svgStyle}>
        <path
          fill="currentColor"
          d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        />
        <path
          d="m8.03 11.18 3.2 3.2 5.15 -5.15"
          fill="none"
          stroke="#fff"
          strokeWidth={1.55}
          strokeLinecap="butt"
          strokeLinejoin="miter"
          strokeMiterlimit={4}
        />
      </svg>
    </span>
  );
}
