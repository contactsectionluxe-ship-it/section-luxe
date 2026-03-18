-- Supprimer les annonces de test (TEST-N-1..20 et TEST-O-1..20)
-- À exécuter dans Supabase → SQL Editor.

DELETE FROM public.listings
WHERE listing_number LIKE 'TEST-N-%' OR listing_number LIKE 'TEST-O-%';
