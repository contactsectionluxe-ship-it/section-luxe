-- Politiques Storage pour la RGPD : bucket "documents" privé, accès réservé aux admins
-- À exécuter dans Supabase SQL Editor APRÈS avoir créé le bucket "documents" (en privé).

-- Supprimer l'ancienne politique si elle existe (pour pouvoir réexécuter ce script)
DROP POLICY IF EXISTS "Upload documents inscription vendeur" ON storage.objects;

-- Permettre l'upload des pièces jointes lors de l'inscription vendeur (anon = pas encore connecté)
CREATE POLICY "Upload documents inscription vendeur"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND name LIKE 'sellers/%'
);

-- Seuls les admins peuvent lire les documents (CNI, KBIS) pour les traiter
CREATE POLICY "Lecture documents par les admins"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Optionnel : le vendeur peut lire ses propres documents
CREATE POLICY "Lecture documents par le propriétaire"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND owner_id = auth.uid()::text
);
