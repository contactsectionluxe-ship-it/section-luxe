-- Limite d’objet du bucket « listings » (photos annonces + propositions de vente).
-- Sans cette mise à jour, Supabase peut refuser l’upload au‑delà de la limite du bucket
-- (ex. erreur « The object exceeded the maximum allowed size ») alors que l’app autorise 10 Mo
-- (voir src/lib/file-validation.ts, MAX_FILE_SIZE_BYTES).
--
-- À appliquer après création du bucket « listings » (Dashboard → SQL ou supabase db push).

UPDATE storage.buckets
SET file_size_limit = 10485760
WHERE id = 'listings' OR name = 'listings';
