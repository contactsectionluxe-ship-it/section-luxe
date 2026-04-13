-- =============================================================================
-- Test manuel : blog Actualités (à coller dans Supabase → SQL → Run)
-- Prérequis : table public.blog_articles (migration blog_articles.sql).
-- La section 0 ajoute body_format si elle manque (équivalent blog_articles_body_format.sql).
-- =============================================================================

-- 0) Colonne body_format (ignorez si vous l’avez déjà exécutée — idempotent)
ALTER TABLE public.blog_articles
  ADD COLUMN IF NOT EXISTS body_format TEXT NOT NULL DEFAULT 'text';

ALTER TABLE public.blog_articles
  DROP CONSTRAINT IF EXISTS blog_articles_body_format_check;

ALTER TABLE public.blog_articles
  ADD CONSTRAINT blog_articles_body_format_check
  CHECK (body_format IN ('text', 'html'));

ALTER TABLE public.blog_articles
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT NULL;

-- 1) La table existe et contient les colonnes attendues
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'blog_articles'
ORDER BY ordinal_position;

-- 2) Politiques RLS sur blog_articles
SELECT polname AS policy_name, polcmd AS command, polroles::regrole[] AS roles
FROM pg_policy
WHERE polrelid = 'public.blog_articles'::regclass;

-- 3) Nombre d’articles (vue « postgres » dans l’éditeur SQL : pas soumis à RLS)
SELECT count(*) AS total_articles FROM public.blog_articles;

-- 4) Insérer ou mettre à jour un article de test (visible tout de suite : published_at = now)
INSERT INTO public.blog_articles (
  title,
  slug,
  excerpt,
  body,
  body_format,
  cover_image_url,
  published_at,
  updated_at
)
VALUES (
  'Article de test Section Luxe',
  'article-test-section-luxe',
  'Si vous voyez ce chapô sur le site, la liste Actualités lit bien Supabase.',
  E'Corps en mode texte : première ligne.\n\nDeuxième bloc de texte. (Vous pourrez supprimer cet article depuis l’admin.)\n\nPour un test HTML, repassez body_format à html et mettez du HTML dans body.',
  'text',
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title       = EXCLUDED.title,
  excerpt     = EXCLUDED.excerpt,
  body        = EXCLUDED.body,
  body_format = EXCLUDED.body_format,
  cover_image_url = COALESCE(EXCLUDED.cover_image_url, public.blog_articles.cover_image_url),
  published_at = EXCLUDED.published_at,
  updated_at   = NOW();

-- 5) Relire l’article de test
SELECT id, title, slug, body_format, published_at, created_at
FROM public.blog_articles
WHERE slug = 'article-test-section-luxe';

-- 6) (Optionnel) Test HTML : décommentez et exécutez pour remplacer le corps par du HTML
/*
UPDATE public.blog_articles
SET
  body_format = 'html',
  body = '<p>Paragraphe <strong>gras</strong> et <em>italique</em>.</p><p>Deuxième paragraphe.</p>',
  updated_at = NOW()
WHERE slug = 'article-test-section-luxe';
*/

-- 7) (Optionnel) Supprimer uniquement l’article de test
-- DELETE FROM public.blog_articles WHERE slug = 'article-test-section-luxe';
