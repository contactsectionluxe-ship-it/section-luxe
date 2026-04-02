-- Coordonnées + message (équivalent « Contacter le vendeur ») pour les propositions de vente
ALTER TABLE public.sale_proposals
  ADD COLUMN IF NOT EXISTS buyer_contact jsonb DEFAULT NULL;
