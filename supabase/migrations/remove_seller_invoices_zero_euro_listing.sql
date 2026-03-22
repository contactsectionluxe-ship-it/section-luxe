-- Supprime les factures automatiques « dépôt annonce » à 0 € (publication d’annonce).
-- Ne touche pas aux lignes avec amount_cents > 0 si elles existent un jour.
-- Appliquer : Supabase → SQL Editor, ou `supabase db push` si les migrations sont suivies.

DELETE FROM public.seller_invoices
WHERE amount_cents = 0;
