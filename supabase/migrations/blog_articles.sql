-- Articles du blog « Actualités » : lecture publique une fois la date de mise en ligne atteinte ;
-- écriture uniquement via API admin (service_role).
CREATE TABLE IF NOT EXISTS public.blog_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  body TEXT NOT NULL,
  body_format TEXT NOT NULL DEFAULT 'text',
  cover_image_url TEXT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_articles_published_at ON public.blog_articles (published_at DESC);

COMMENT ON TABLE public.blog_articles IS 'Actualités Section Luxe : visibles quand published_at <= now() ; gestion admin uniquement';

ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Articles publiés visibles par tous" ON public.blog_articles;
CREATE POLICY "Articles publiés visibles par tous"
  ON public.blog_articles
  FOR SELECT
  TO anon, authenticated
  USING (published_at <= NOW());

-- Tables déjà créées sans body_format : ajout idempotent (voir aussi blog_articles_body_format.sql).
ALTER TABLE public.blog_articles
  ADD COLUMN IF NOT EXISTS body_format TEXT NOT NULL DEFAULT 'text';

ALTER TABLE public.blog_articles
  DROP CONSTRAINT IF EXISTS blog_articles_body_format_check;

ALTER TABLE public.blog_articles
  ADD CONSTRAINT blog_articles_body_format_check
  CHECK (body_format IN ('text', 'html'));

COMMENT ON COLUMN public.blog_articles.body_format IS 'text = brut + {{IMG}} ; html = balises HTML sanitisées. Rédaction admin uniquement.';

ALTER TABLE public.blog_articles
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT NULL;

COMMENT ON COLUMN public.blog_articles.cover_image_url IS 'URL publique Storage bucket blog (vignette liste + bannière article).';
