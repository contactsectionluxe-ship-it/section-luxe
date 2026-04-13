-- Image de couverture (liste Actualités + en-tête article), URL publique bucket « blog ».
ALTER TABLE public.blog_articles
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT NULL;

COMMENT ON COLUMN public.blog_articles.cover_image_url IS 'URL publique Storage bucket blog ; saisie admin uniquement.';
