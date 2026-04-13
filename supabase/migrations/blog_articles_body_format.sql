-- Format du corps : texte (retours à la ligne + {{IMG:…}}) ou HTML (sanitisé à l’affichage).
-- Si vous avez déjà exécuté blog_articles.sql à jour (fin de fichier inclut body_format), ce script est redondant mais reste idempotent.
ALTER TABLE public.blog_articles
  ADD COLUMN IF NOT EXISTS body_format TEXT NOT NULL DEFAULT 'text';

ALTER TABLE public.blog_articles
  DROP CONSTRAINT IF EXISTS blog_articles_body_format_check;

ALTER TABLE public.blog_articles
  ADD CONSTRAINT blog_articles_body_format_check
  CHECK (body_format IN ('text', 'html'));

COMMENT ON COLUMN public.blog_articles.body_format IS 'text = brut + marqueurs image ; html = balises HTML (nettoyées côté site)';
