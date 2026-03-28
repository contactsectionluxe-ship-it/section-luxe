import type { CSSProperties } from 'react';
import type { SubscriptionTier } from '@/lib/subscription';

export type SellerVerifiedSubscriptionBadgeVariant =
  | 'annonce'
  | 'catalogueGrid'
  | 'catalogueLine'
  /** Grille « À la une » : même taille que catalogueGrid, gris plus clair que le libellé vendeur. */
  | 'homeFeatured'
  /** Fiche produit : même gris que les cartes catalogue (#aeaeb2), taille compacte comme `annonce` (0.88em). */
  | 'produit';

type Props = {
  tier: SubscriptionTier;
  /** annonce : compact #86868b. produit : compact #aeaeb2 (comme cartes catalogue). Catalogue : currentColor. homeFeatured : #aeaeb2 + taille grille. */
  variant?: SellerVerifiedSubscriptionBadgeVariant;
};

/** Badge plein + coche blanche (Plus/Pro), même forme que l’icône Lucide badge-check. */
export function SellerVerifiedSubscriptionBadge({ tier, variant = 'annonce' }: Props) {
  if (tier !== 'plus' && tier !== 'pro') return null;

  const isCatalogue = variant === 'catalogueGrid' || variant === 'catalogueLine';
  const isHomeFeatured = variant === 'homeFeatured';
  const isProduit = variant === 'produit';
  const useCatalogueSizing = isCatalogue || isHomeFeatured;
  const catalogueIconEm = variant === 'catalogueLine' ? '1.16em' : '1.22em';

  /**
   * Catalogue : même échelle que le libellé vendeur (hérite du font-size du parent).
   * Alignement vertical avec le nom via flex + line-height sur `.listing-grid-vendeur-nom-badge-row` /
   * `.catalogue-listing-vendeur-nom-row` (globals.css), sans translateY pour rester cohérent toutes tailles d’écran.
   */
  const wrapStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 0,
    padding: 0,
    lineHeight: 0,
    flexShrink: 0,
    ...(useCatalogueSizing ? {} : { transform: 'translateY(0.05em)' }),
  };

  const svgStyle: CSSProperties = useCatalogueSizing
    ? {
        width: catalogueIconEm,
        height: catalogueIconEm,
        flexShrink: 0,
        color: isHomeFeatured ? '#aeaeb2' : 'currentColor',
        display: 'block',
      }
    : {
        width: '0.88em',
        height: '0.88em',
        flexShrink: 0,
        color: isProduit ? '#aeaeb2' : '#86868b',
        display: 'block',
      };

  return (
    <span
      className="seller-verified-subscription-badge"
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
