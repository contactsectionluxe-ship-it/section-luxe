-- Politiques Storage pour la RGPD : bucket "documents" privé, accès réservé aux admins
-- À exécuter dans Supabase SQL Editor APRÈS avoir créé le bucket "documents" (en privé).

-- Permettre l'upload des pièces jointes lors de l'inscription vendeur (anon = pas encore connecté)
CREATE POLICY "Upload documents inscription vendeur"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'sellers'
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
