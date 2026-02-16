-- Factures vendeur : une facture à 0€ par annonce publiée, émetteur Section luxe
-- À exécuter dans Supabase → SQL Editor

-- Séquence pour numéro de facture (FAC-ANNÉE-NNNN)
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION public.get_next_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n INT;
  y INT;
BEGIN
  n := nextval('public.invoice_number_seq');
  y := EXTRACT(YEAR FROM CURRENT_DATE)::INT;
  RETURN 'FAC-' || y::TEXT || '-' || LPAD(n::TEXT, 5, '0');
END;
$$;

GRANT USAGE ON SEQUENCE public.invoice_number_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.invoice_number_seq TO service_role;
GRANT EXECUTE ON FUNCTION public.get_next_invoice_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_invoice_number() TO service_role;

-- Table des factures (une par annonce publiée)
CREATE TABLE IF NOT EXISTS public.seller_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  listing_id UUID NOT NULL,
  amount_cents INT NOT NULL DEFAULT 0,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invoice_number TEXT NOT NULL,
  issuer TEXT NOT NULL DEFAULT 'Section luxe',
  listing_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(listing_id)
);

-- Index pour lister les factures d'un vendeur
CREATE INDEX IF NOT EXISTS seller_invoices_seller_id_idx ON public.seller_invoices(seller_id);
CREATE INDEX IF NOT EXISTS seller_invoices_issued_at_idx ON public.seller_invoices(issued_at DESC);

-- RLS : le vendeur ne voit et ne crée que ses propres factures
ALTER TABLE public.seller_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendeur peut voir ses factures" ON public.seller_invoices;
CREATE POLICY "Vendeur peut voir ses factures" ON public.seller_invoices
  FOR SELECT USING (seller_id = auth.uid());

DROP POLICY IF EXISTS "Vendeur peut insérer ses factures" ON public.seller_invoices;
CREATE POLICY "Vendeur peut insérer ses factures" ON public.seller_invoices
  FOR INSERT WITH CHECK (seller_id = auth.uid());
