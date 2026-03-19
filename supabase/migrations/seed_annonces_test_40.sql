-- Seed : 20 annonces neuf + 20 annonces occasion pour le vendeur "Section Luxe"
-- À exécuter dans Supabase → SQL Editor.
-- Prérequis : un vendeur avec company_name contenant "Section Luxe" (ou "section luxe") et status = 'approved'.

-- 20 annonces NEUF (condition = 'new')
INSERT INTO public.listings (seller_id, seller_name, title, description, price, category, photos, condition, listing_number, is_active)
SELECT s.id, s.company_name,
  'Annonce test neuf ' || n.n,
  'Description test annonce neuf n°' || n.n || '. Article de qualité.',
  100 + (n.n * 15),
  'sacs',
  '{}',
  'new',
  'TEST-N-' || n.n,
  false
FROM (SELECT id, company_name FROM public.sellers WHERE status = 'approved' AND company_name ILIKE '%section luxe%' LIMIT 1) s
CROSS JOIN generate_series(1, 20) AS n(n)
ON CONFLICT (listing_number) DO NOTHING;

-- 20 annonces OCCASION (condition = 'very_good')
INSERT INTO public.listings (seller_id, seller_name, title, description, price, category, photos, condition, listing_number, is_active)
SELECT s.id, s.company_name,
  'Annonce test occasion ' || n.n,
  'Description test annonce occasion n°' || n.n || '. Très bon état.',
  80 + (n.n * 12),
  'sacs',
  '{}',
  'very_good',
  'TEST-O-' || n.n,
  false
FROM (SELECT id, company_name FROM public.sellers WHERE status = 'approved' AND company_name ILIKE '%section luxe%' LIMIT 1) s
CROSS JOIN generate_series(1, 20) AS n(n)
ON CONFLICT (listing_number) DO NOTHING;
