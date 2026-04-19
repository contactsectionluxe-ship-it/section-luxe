'use client';

import { useEffect, useRef, useState } from 'react';
import { useMatchMaxWidth } from '@/hooks/useMatchMaxWidth';
import {
  Tag,
  Award,
  Package,
  Calendar,
  CheckCircle,
  Layers,
  Palette,
  Ruler,
  Info,
} from 'lucide-react';
import type { Listing } from '@/types';
import { TruncatedInfoValue } from '@/components/TruncatedInfoValue';
import { CATEGORIES } from '@/lib/utils';
import { CONDITIONS, getColorLabel, MATERIALS, CLOTHING_SIZES } from '@/lib/constants';

/** Largeur × hauteur (cm) — aligné page produit */
function formatDimensionsCmValue(widthCm: number | null | undefined, heightCm: number | null | undefined): string {
  if (widthCm == null && heightCm == null) return ' ';
  if (widthCm != null && heightCm != null) return `${widthCm} × ${heightCm} cm`;
  if (widthCm != null) return `${widthCm} cm`;
  return `${heightCm} cm`;
}

const ETAT_DEFINITIONS: { title: string; text: string }[] = [
  { title: 'Neuf', text: "Article jamais porté en parfait état. Aucun signe d'utilisation." },
  { title: 'Très bon état', text: 'Article peu porté et soigneusement conservé. Peut présenter de très légers signes d\'usage à peine perceptibles.' },
  { title: 'Bon état', text: 'Article porté et bien entretenu. Peut présenter des traces d\'usage visibles liées à une utilisation normale.' },
  { title: 'État correct', text: 'Article régulièrement porté. Présente des signes d\'usure visibles liés à l\'usage, sans défaut majeur ni détérioration importante.' },
];

/** Même `gap` que la grille 2 colonnes du composant (pour le positionnement mobile comme page produit). */
const GRID_COL_GAP_PX = 32;

function EtatTooltipBody({ variant }: { variant: 'desktop' | 'mobile' }) {
  const isMobile = variant === 'mobile';
  return (
    <>
      {ETAT_DEFINITIONS.map((item) => (
        <div key={item.title} style={{ marginBottom: item.title === 'État correct' ? 0 : isMobile ? 10 : 12 }}>
          <strong style={{ display: 'block', marginBottom: isMobile ? 2 : 4 }}>{item.title}</strong>
          <span style={{ color: '#6e6e73' }}>{item.text}</span>
        </div>
      ))}
      <p
        style={{
          margin: 0,
          marginTop: isMobile ? 10 : 12,
          paddingTop: isMobile ? 8 : 10,
          borderTop: '1px solid #eee',
          fontSize: 12,
          color: '#6e6e73',
          lineHeight: 1.5,
        }}
      >
        L&apos;article est montré tel qu&apos;il est sur les photos. La description sert uniquement de repère.
      </p>
    </>
  );
}

/**
 * Grille « Informations » comme sur la fiche produit (/annonce/[id]) : libellés #555,
 * valeurs TruncatedInfoValue, bulle d’aide sur État, même logique taille / dimensions.
 */
export function ListingCharacteristicsProductStyle({ listing }: { listing: Listing }) {
  const [etatInfoClicked, setEtatInfoClicked] = useState(false);
  const [etatInfoHover, setEtatInfoHover] = useState(false);
  const isMobileLayout = useMatchMaxWidth(1023);
  const etatRowRef = useRef<HTMLDivElement>(null);

  const categoryLabel = CATEGORIES.find((c) => c.value === listing.category)?.label ?? listing.category;
  const etatTipOpen = etatInfoClicked || etatInfoHover;

  // Fermer le tooltip État au clic ailleurs — aligné page produit (/annonce/[id])
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(etatInfoClicked || etatInfoHover)) return;
      const row = etatRowRef.current;
      const target = e.target as Node;
      if (row && !row.contains(target)) {
        setEtatInfoClicked(false);
        setEtatInfoHover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [etatInfoClicked, etatInfoHover]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px', minWidth: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <Tag size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
            <span style={{ color: '#555', fontSize: 14 }}>Catégorie</span>
          </div>
          {listing.category ? (
            <TruncatedInfoValue text={categoryLabel || listing.category} fontSize={14} />
          ) : (
            <span style={{ fontWeight: 400, color: '#555', fontSize: 14 }}> </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <Award size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
            <span style={{ color: '#555', fontSize: 14 }}>Marque</span>
          </div>
          {listing.brand ? (
            <TruncatedInfoValue text={listing.brand} fontSize={14} />
          ) : (
            <span style={{ fontWeight: 400, color: '#555', fontSize: 14 }}> </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <Package size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
            <span style={{ color: '#555', fontSize: 14 }}>Modèle</span>
          </div>
          <TruncatedInfoValue text={listing.model ?? ''} fontSize={14} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <Calendar size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
            <span style={{ color: '#555', fontSize: 14 }}>Année</span>
          </div>
          <TruncatedInfoValue text={listing.year != null ? String(listing.year) : ' '} fontSize={14} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <div
          ref={etatRowRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: isMobileLayout ? 8 : 12,
            minWidth: 0,
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobileLayout ? 8 : 10,
              flexShrink: 0,
              position: isMobileLayout ? undefined : 'relative',
            }}
          >
            <CheckCircle size={isMobileLayout ? 16 : 18} color="#6e6e73" style={{ flexShrink: 0 }} />
            <span style={{ color: '#555', fontSize: isMobileLayout ? 13 : 14 }}>État</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                const visible = etatInfoClicked || etatInfoHover;
                if (visible) {
                  setEtatInfoClicked(false);
                  setEtatInfoHover(false);
                } else {
                  setEtatInfoClicked(true);
                  setEtatInfoHover(false);
                }
              }}
              onMouseEnter={() => setEtatInfoHover(true)}
              onMouseLeave={() => setEtatInfoHover(false)}
              aria-label="Informations sur les états"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                padding: 0,
                lineHeight: 0,
                fontSize: 0,
                boxSizing: 'border-box',
                border: '1px solid #d2d2d7',
                borderRadius: '50%',
                backgroundColor: etatInfoClicked ? '#1d1d1f' : etatInfoHover ? '#1d1d1f' : '#fff',
                color: etatInfoClicked ? '#fff' : etatInfoHover ? '#fff' : '#6e6e73',
                cursor: 'pointer',
                transition: 'background-color 0.2s, color 0.2s',
                boxShadow: etatInfoClicked ? '0 1px 3px rgba(0,0,0,0.12)' : etatInfoHover ? '0 1px 3px rgba(0,0,0,0.12)' : '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <Info size={13} strokeWidth={2.2} style={{ display: 'block', flexShrink: 0 }} aria-hidden />
            </button>
            {!isMobileLayout && etatTipOpen && (
              <div
                role="tooltip"
                onMouseEnter={() => setEtatInfoHover(true)}
                onMouseLeave={() => setEtatInfoHover(false)}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '100%',
                  marginTop: 6,
                  zIndex: 20,
                  minWidth: 320,
                  maxWidth: 360,
                  padding: 16,
                  backgroundColor: '#fff',
                  border: '1px solid #e8e6e3',
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: '#1d1d1f',
                }}
              >
                <EtatTooltipBody variant="desktop" />
              </div>
            )}
          </div>
          <TruncatedInfoValue
            text={listing.condition ? (CONDITIONS.find((c) => c.value === listing.condition)?.label ?? listing.condition) : ' '}
            fontSize={isMobileLayout ? 13 : 14}
          />
          {isMobileLayout && etatTipOpen && (
            <div
              role="tooltip"
              onMouseEnter={() => setEtatInfoHover(true)}
              onMouseLeave={() => setEtatInfoHover(false)}
              style={{
                position: 'absolute',
                left: `calc(-100% - ${GRID_COL_GAP_PX}px)`,
                right: 'auto',
                width: `calc(200% + ${GRID_COL_GAP_PX}px)`,
                top: '100%',
                marginTop: 6,
                zIndex: 20,
                maxWidth: 'none',
                boxSizing: 'border-box',
                wordBreak: 'break-word',
                padding: 16,
                backgroundColor: '#fff',
                border: '1px solid #e8e6e3',
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                fontSize: 13,
                lineHeight: 1.5,
                color: '#1d1d1f',
              }}
            >
              <EtatTooltipBody variant="mobile" />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <Layers size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
            <span style={{ color: '#555', fontSize: 14 }}>Matière</span>
          </div>
          <TruncatedInfoValue
            text={listing.material ? (MATERIALS.find((m) => m.value === listing.material)?.label ?? listing.material) : ' '}
            fontSize={14}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <Palette size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
            <span style={{ color: '#555', fontSize: 14 }}>Couleur</span>
          </div>
          <TruncatedInfoValue
            text={listing.color ? getColorLabel(listing.color) : ' '}
            fontSize={14}
          />
        </div>
        {(listing.category === 'chaussures' || listing.category === 'vetements' || listing.category === 'montres') && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <Ruler size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
              <span style={{ color: '#555', fontSize: 14 }}>
                {listing.category === 'chaussures' ? 'Pointure' : listing.category === 'montres' ? 'Dimension' : 'Taille'}
              </span>
            </div>
            <TruncatedInfoValue
              text={
                !listing.size
                  ? ' '
                  : listing.category === 'chaussures' ||
                      (listing.category === 'vetements' &&
                        listing.size != null &&
                        !CLOTHING_SIZES.includes(listing.size as (typeof CLOTHING_SIZES)[number]))
                    ? `${listing.size} EU`
                    : listing.category === 'montres'
                      ? `${listing.size} mm`
                      : String(listing.size)
              }
              fontSize={14}
            />
          </div>
        )}
        {listing.category !== 'chaussures' && listing.category !== 'vetements' && listing.category !== 'montres' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <Ruler size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
              <span style={{ color: '#555', fontSize: 14 }}>Dimension</span>
            </div>
            <TruncatedInfoValue text={formatDimensionsCmValue(listing.widthCm, listing.heightCm)} fontSize={14} />
          </div>
        )}
      </div>
    </div>
  );
}
