-- =============================================================================
-- Bucket « blog » : images des articles Actualités (upload via API admin).
-- =============================================================================
-- À exécuter UNE FOIS sur le projet Supabase concerné.
--
-- Option A — SQL (recommandé) :
--   1. Ouvrir https://supabase.com/dashboard → votre projet
--   2. Menu SQL → New query
--   3. Coller tout ce fichier → Run
--
-- Option B — Interface Storage :
--   1. Storage → New bucket → id et nom : blog
--   2. Cocher « Public bucket »
--   3. Limite fichier 10 Mo, MIME image/jpeg et image/png si proposé
--   4. Puis exécuter quand même la partie POLICY ci-dessous (à partir de DROP POLICY)
--      pour la lecture publique, ou ajouter une policy SELECT équivalente sur storage.objects
--
-- Vérification : SELECT id, public FROM storage.buckets WHERE id = 'blog';
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog',
  'blog',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Lecture publique images blog" ON storage.objects;
CREATE POLICY "Lecture publique images blog"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog');
