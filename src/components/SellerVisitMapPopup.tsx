'use client';

import Link from 'next/link';
import { ArrowLeft, X, Plus, Minus } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { Seller } from '@/types';
import { sellerCataloguePath } from '@/lib/sellerCatalogueUrl';
import { SellerVisitDescriptionInfo } from '@/components/SellerVisitDescriptionInfo';
import { SellerVisitOpeningHoursBlock } from '@/components/SellerVisitOpeningHoursBlock';

const CARD_SHADOW = '0 8px 32px rgba(0,0,0,0.12)';

type Props = {
  seller: Seller;
  open: boolean;
  onClose: () => void;
  mapZoom: number;
  setMapZoom: Dispatch<SetStateAction<number>>;
  /** Flèche retour + titre + X (catalogue, messages). Sinon titre centré + X seul (fiche annonce). */
  showBackButton?: boolean;
  /** Bouton « Contacter le vendeur » sous la carte */
  showContactButton?: boolean;
  onContactClick?: () => void;
};

/** Popup « Rendre visite au vendeur » : même structure partout (liste vendeur, annonce, messages). */
export function SellerVisitMapPopup({
  seller,
  open,
  onClose,
  mapZoom,
  setMapZoom,
  showBackButton = true,
  showContactButton = false,
  onContactClick,
}: Props) {
  if (!open) return null;

  const addrLine = [seller.address, seller.postcode, seller.city].filter(Boolean).join(', ');
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(addrLine)}&z=${mapZoom}&output=embed`;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          overflow: 'auto',
          backgroundColor: '#fff',
          borderRadius: 18,
          boxShadow: CARD_SHADOW,
          border: '1px solid #e8e6e3',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: 24 }}>
          {showBackButton ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e5e5e7' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  position: 'absolute',
                  left: 0,
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  background: '#f5f5f7',
                  borderRadius: 10,
                  cursor: 'pointer',
                }}
                aria-label="Retour"
              >
                <ArrowLeft size={20} />
              </button>
              <h2
                style={{
                  fontFamily: 'var(--font-inter), var(--font-sans)',
                  fontSize: 19,
                  fontWeight: 600,
                  margin: 0,
                  color: '#0a0a0a',
                  textAlign: 'center',
                }}
              >
                Rendre visite au vendeur
              </h2>
              <button
                type="button"
                onClick={onClose}
                style={{
                  position: 'absolute',
                  right: 0,
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  background: '#f5f5f7',
                  borderRadius: 10,
                  cursor: 'pointer',
                }}
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 16, paddingRight: 36 }}>
              <h2
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontFamily: 'var(--font-inter), var(--font-sans)',
                  fontSize: 19,
                  fontWeight: 600,
                  margin: 0,
                  color: '#0a0a0a',
                  textAlign: 'center',
                  paddingBottom: 16,
                  borderBottom: '1px solid #e5e5e7',
                }}
              >
                Rendre visite au vendeur
              </h2>
              <button
                type="button"
                onClick={onClose}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: -6,
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  background: '#f5f5f7',
                  borderRadius: 10,
                  cursor: 'pointer',
                }}
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>
          )}

          <SellerVisitDescriptionInfo description={seller.description} rowStyle={sellerVisitTitleRowStyle}>
            <Link href={sellerCataloguePath(seller)} style={{ color: 'inherit', textDecoration: 'none' }}>
              {seller.companyName}
            </Link>
          </SellerVisitDescriptionInfo>
          <SellerVisitOpeningHoursBlock hours={seller.openingHours} />
          <p style={{ fontSize: 14, fontWeight: 500, color: '#1d1d1f', margin: 0, marginBottom: 16 }}>{addrLine}</p>
          <div
            style={{
              position: 'relative',
              zIndex: 0,
              width: '100%',
              height: 220,
              borderRadius: 12,
              overflow: 'hidden',
              marginBottom: showContactButton ? 20 : 0,
            }}
          >
            <iframe
              title="Carte du vendeur"
              src={mapSrc}
              style={{ width: '100%', height: '100%', border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMapZoom((z) => Math.min(20, z + 1));
                }}
                style={{
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#fff',
                  border: '1px solid #d2d2d7',
                  borderRadius: 10,
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                }}
                title="Zoom avant"
              >
                <Plus size={18} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMapZoom((z) => Math.max(10, z - 1));
                }}
                style={{
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#fff',
                  border: '1px solid #d2d2d7',
                  borderRadius: 10,
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                }}
                title="Zoom arrière"
              >
                <Minus size={18} />
              </button>
            </div>
          </div>
          {showContactButton && onContactClick && (
            <button
              type="button"
              onClick={onContactClick}
              style={{
                width: '100%',
                height: 48,
                backgroundColor: '#1d1d1f',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Contacter le vendeur
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const sellerVisitTitleRowStyle = {
  fontFamily: 'var(--font-inter), var(--font-sans)',
  fontSize: 18,
  fontWeight: 600,
  color: '#1d1d1f',
} as const;
