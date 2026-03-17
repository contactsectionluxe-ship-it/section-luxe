-- Inscrits newsletter Section Luxe (footer)
-- Exécuter dans Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed')),
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON public.newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed_at ON public.newsletter_subscribers(subscribed_at DESC);

COMMENT ON TABLE public.newsletter_subscribers IS 'Inscriptions newsletter footer : qui est inscrit / désinscrit pour envoi actualités Section Luxe';
