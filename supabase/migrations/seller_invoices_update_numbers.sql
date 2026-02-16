-- Met à jour les numéros de facture existants au format année+mois-numéro d'annonce
-- (ex. 202601-10K2001). À exécuter une fois dans Supabase → SQL Editor.

UPDATE public.seller_invoices si
SET invoice_number = sub.nr
FROM (
  SELECT
    si2.id AS inv_id,
    TO_CHAR(l.created_at, 'YYYYMM') || '-' || COALESCE(TRIM(l.listing_number), LEFT(si2.listing_id::text, 8)) AS nr
  FROM public.seller_invoices si2
  JOIN public.listings l ON l.id = si2.listing_id
) sub
WHERE si.id = sub.inv_id;
