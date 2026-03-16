'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getInvoiceById, type SellerInvoice } from '@/lib/supabase/invoices';

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(cents / 100);
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
}

function formatDateShort(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

// Informations légales fictives de l'émetteur (Section luxe)
const EMETTEUR = {
  raisonSociale: 'Section luxe',
  formeJuridique: 'SAS',
  capital: '10 000 €',
  siret: '123 456 789 01234',
  rcs: 'Paris B 123 456 789',
  tva: 'FR 12 345678901',
  siege: '123 avenue des Champs-Élysées, 75008 Paris',
  email: 'contact.sectionluxe@gmail.com',
};

export default function FactureViewPage() {
  const router = useRouter();
  const params = useParams();
  const { user, seller, loading: authLoading } = useAuth();
  const [invoice, setInvoice] = useState<SellerInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const id = params?.id as string | undefined;

  useEffect(() => {
    if (!authLoading && (!user || !seller)) {
      router.push('/connexion');
      return;
    }
    if (authLoading || !id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getInvoiceById(id).then((inv) => {
      if (!cancelled) {
        setInvoice(inv);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [authLoading, user, seller, router, id]);

  const handleDownload = () => {
    const el = printRef.current;
    if (!el) return;
    const clone = el.cloneNode(true) as HTMLElement;
    clone.id = 'print-invoice-temp';
    document.body.appendChild(clone);
    const cleanup = () => {
      document.getElementById('print-invoice-temp')?.remove();
      window.onafterprint = null;
    };
    window.onafterprint = cleanup;
    window.print();
    if (!window.matchMedia('print').matches) cleanup();
  };

  if (authLoading || loading) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 15, color: '#6e6e73' }}>Chargement...</p>
      </div>
    );
  }

  if (!user || !seller) return null;

  if (!invoice) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', paddingLeft: 24, paddingRight: 24, paddingBottom: 24 }}>
        <div className="mes-facture-detail-page-inner" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 16, color: '#6e6e73', marginBottom: 24 }}>Facture introuvable.</p>
          <Link href="/vendeur/factures" style={{ fontSize: 15, color: '#1d1d1f', textDecoration: 'underline' }}>
            ← Retour aux factures
          </Link>
        </div>
      </div>
    );
  }

  const clientAddress = [seller.address, seller.postcode, seller.city].filter(Boolean).join(', ') || '—';

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div className="mes-facture-detail-page-inner" style={{ maxWidth: 800, margin: '0 auto', paddingTop: 32, paddingRight: 24, paddingBottom: 60, paddingLeft: 24 }}>
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <Link
            href="/vendeur/factures"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#6e6e73', textDecoration: 'none' }}
          >
            <ArrowLeft size={18} /> Retour aux factures
          </Link>
          <button
            type="button"
            onClick={handleDownload}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              paddingTop: 12,
              paddingRight: 20,
              paddingBottom: 12,
              paddingLeft: 20,
              backgroundColor: '#1d1d1f',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Download size={18} /> Télécharger la facture (PDF)
          </button>
        </div>

        <div ref={printRef} className="print-only-ref mes-facture-detail-invoice-card" style={{ backgroundColor: '#fff', paddingTop: 40, paddingRight: 40, paddingBottom: 40, paddingLeft: 40, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          {/* En-tête : émetteur et client */}
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32, marginBottom: 28 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 22, fontWeight: 600, margin: '0 0 8px', color: '#1d1d1f' }}>
                {EMETTEUR.raisonSociale} {EMETTEUR.formeJuridique}
              </h1>
              <p style={{ fontSize: 12, color: '#333', margin: '2px 0' }}>Siège social : {EMETTEUR.siege}</p>
              <p style={{ fontSize: 12, color: '#333', margin: '2px 0' }}>SIRET : {EMETTEUR.siret}</p>
              <p style={{ fontSize: 12, color: '#333', margin: '2px 0' }}>RCS : {EMETTEUR.rcs}</p>
              <p style={{ fontSize: 12, color: '#333', margin: '2px 0' }}>Capital : {EMETTEUR.capital}</p>
              <p style={{ fontSize: 12, color: '#333', margin: '2px 0' }}>{EMETTEUR.email}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#1d1d1f', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Facturé à
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', margin: '0 0 4px' }}>{seller.companyName}</p>
              <p style={{ fontSize: 12, color: '#333', margin: '2px 0' }}>{clientAddress}</p>
              {seller.siret && <p style={{ fontSize: 12, color: '#333', margin: '2px 0' }}>SIRET : {seller.siret}</p>}
            </div>
          </div>

          {/* Référence facture */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#1d1d1f', margin: '0 0 8px' }}>Facture n° {invoice.invoiceNumber}</p>
            <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
              Date d’émission : {formatDate(invoice.issuedAt)} · Émetteur : {invoice.issuer}
            </p>
          </div>

          {/* Tableau des prestations */}
          <div className="mes-facture-detail-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 24 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e8e6e3' }}>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: '#1d1d1f' }}>Désignation</th>
                <th style={{ textAlign: 'center', padding: '12px 8px', fontWeight: 600, color: '#1d1d1f', width: 80 }}>Quantité</th>
                <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 600, color: '#1d1d1f', width: 100 }}>Prix unitaire HT</th>
                <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 600, color: '#1d1d1f', width: 100 }}>Montant HT</th>
                <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 600, color: '#1d1d1f', width: 90 }}>TVA</th>
                <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 600, color: '#1d1d1f', width: 110 }}>Montant TTC</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e8e6e3' }}>
                <td style={{ padding: '14px 8px', color: '#1d1d1f' }}>Mise en ligne d’annonce — {invoice.listingTitle || 'Annonce'}</td>
                <td style={{ padding: '14px 8px', textAlign: 'center', color: '#333' }}>1</td>
                <td style={{ padding: '14px 8px', textAlign: 'right', color: '#333' }}>{formatPrice(invoice.amountCents)}</td>
                <td style={{ padding: '14px 8px', textAlign: 'right', color: '#333' }}>{formatPrice(invoice.amountCents)}</td>
                <td style={{ padding: '14px 8px', textAlign: 'right', color: '#333' }}>—</td>
                <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 600, color: '#1d1d1f' }}>{formatPrice(invoice.amountCents)}</td>
              </tr>
            </tbody>
          </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 14, margin: '4px 0' }}>Total HT : {formatPrice(invoice.amountCents)}</p>
              <p style={{ fontSize: 14, margin: '4px 0' }}>TVA non applicable, art. 293 B du CGI</p>
              <p style={{ fontSize: 18, fontWeight: 700, margin: '8px 0 0', color: '#1d1d1f' }}>Total TTC : {formatPrice(invoice.amountCents)}</p>
            </div>
          </div>

          {/* Conditions de paiement */}
          <div style={{ marginBottom: 24, paddingTop: 16, paddingRight: 16, paddingBottom: 16, paddingLeft: 16, backgroundColor: '#fafaf9', borderRadius: 8, border: '1px solid #e8e6e3' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#1d1d1f', margin: '0 0 6px' }}>Conditions de paiement</p>
            <p style={{ fontSize: 12, color: '#333', margin: 0 }}>
              Facture à 0 € — Aucune somme à régler. Prestation gratuite (mise en ligne d’annonce).
            </p>
          </div>

          {/* Mentions légales obligatoires (France) */}
          <div style={{ fontSize: 11, color: '#666', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 8px' }}>
              <strong>TVA :</strong> TVA non applicable, article 293 B du Code général des impôts (franchise en base de TVA).
            </p>
            <p style={{ margin: '0 0 8px' }}>
              <strong>Pénalités de retard :</strong> En cas de retard de paiement, des pénalités de retard seront appliquées au taux d’intérêt légal en vigueur, ainsi qu’une indemnité forfaitaire pour frais de recouvrement de 40 € (article D. 441-5 du Code de commerce).
            </p>
            <p style={{ margin: '0 0 8px' }}>
              <strong>Litiges :</strong> En cas de litige, les parties s’efforceront de trouver une solution amiable. À défaut, les tribunaux français seront seuls compétents.
            </p>
            <p style={{ margin: '0 0 8px' }}>
              <strong>Assurance :</strong> Section luxe est couverte par une assurance responsabilité civile professionnelle.
            </p>
            <p style={{ margin: '16px 0 0' }}>
              Document établi le {formatDateShort(invoice.issuedAt)} — {EMETTEUR.raisonSociale} — {EMETTEUR.siege} — SIRET {EMETTEUR.siret}
            </p>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body > *:not(#print-invoice-temp) { display: none !important; }
              #print-invoice-temp {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                background: white !important;
                box-shadow: none !important;
                padding: 40px !important;
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
              }
              #print-invoice-temp table { page-break-inside: avoid !important; }
              #print-invoice-temp tr { page-break-inside: avoid !important; }
            }
          `,
        }}
      />
    </div>
  );
}
