'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { LISTING_CARACTERISTIQUES_COMPACT_TEXT_STYLE } from '@/components/ListingCaracteristiques';

const CARAC_TYPO = LISTING_CARACTERISTIQUES_COMPACT_TEXT_STYLE;
const ICON_SIZE = 13.5;
const ICON_COLOR = '#6e6e73';

const PACKAGING_INCLUDED_LABELS: Record<string, string> = {
  box: 'Boîte',
  certificat: 'Certificat',
  facture: 'Facture',
};

function packagingIncludedKeys(packaging: string[] | null | undefined): string[] {
  const raw = Array.isArray(packaging) ? packaging : [];
  return raw.filter((key) => PACKAGING_INCLUDED_LABELS[key]);
}

/** Grille « Suivre mes offres » / Sourcing : description + contenu inclus (fiche produit). */
export function SaleProposalGridDescriptionAccordion({
  proposalId,
  description,
  packaging,
}: {
  proposalId: string;
  description: string | null | undefined;
  packaging?: string[] | null;
}) {
  const [open, setOpen] = useState(false);
  const text = (description ?? '').trim();
  const hasDescriptionText = text.length > 0;
  const includedPackagingKeys = packagingIncludedKeys(packaging);
  const hasPackaging = includedPackagingKeys.length > 0;
  const canExpand = hasDescriptionText || hasPackaging;

  const regionId = `proposal-grid-desc-${proposalId}`;
  const labelId = `${regionId}-label`;

  return (
    <div style={{ width: '100%', minWidth: 0, marginTop: 2 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 3,
          minWidth: 0,
        }}
      >
        <span id={labelId} style={{ ...CARAC_TYPO, flexShrink: 0 }}>
          Description
        </span>
        <button
          type="button"
          className="suivre-mes-offres-desc-toggle"
          aria-disabled={!canExpand}
          tabIndex={canExpand ? undefined : -1}
          aria-expanded={canExpand ? open : false}
          aria-controls={canExpand ? regionId : undefined}
          aria-label={
            !canExpand
              ? 'Aucun détail à afficher'
              : open
                ? 'Masquer la description'
                : 'Afficher la description'
          }
          onClick={() => {
            if (!canExpand) return;
            setOpen((o) => !o);
          }}
          onKeyDown={(e) => {
            if (!canExpand && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            padding: 2,
            margin: 0,
            border: 'none',
            borderRadius: 4,
            background: 'transparent',
            cursor: canExpand ? 'pointer' : 'default',
            color: ICON_COLOR,
            lineHeight: 0,
          }}
        >
          <ChevronDown
            size={ICON_SIZE}
            strokeWidth={2}
            aria-hidden
            style={{
              display: 'block',
              transition: 'transform 0.18s ease',
              transform: canExpand && open ? 'rotate(180deg)' : undefined,
            }}
          />
        </button>
      </div>
      {canExpand && open ? (
        <div
          id={regionId}
          role="region"
          aria-labelledby={labelId}
          style={{ marginTop: 6, minWidth: 0 }}
        >
          {hasPackaging ? (
            <div style={{ marginBottom: hasDescriptionText ? 10 : 0 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {includedPackagingKeys.map((key) => (
                  <span
                    key={key}
                    style={{
                      display: 'inline-block',
                      padding: '5px 10px',
                      backgroundColor: '#e8f5e9',
                      fontSize: 12,
                      fontWeight: 500,
                      color: '#2e7d32',
                      borderRadius: 4,
                    }}
                  >
                    {PACKAGING_INCLUDED_LABELS[key]} : Oui
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {hasDescriptionText ? (
            <div
              style={{
                ...CARAC_TYPO,
                whiteSpace: 'pre-wrap',
                wordBreak: 'normal',
                overflowWrap: 'normal',
                textAlign: 'justify',
                hyphens: 'none',
              }}
            >
              {text}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
