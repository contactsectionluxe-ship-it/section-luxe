-- Champs supplémentaires pour les annonces (Déposer une annonce)
-- Exécuter dans Supabase → SQL Editor

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS model TEXT,
  ADD COLUMN IF NOT EXISTS condition TEXT,
  ADD COLUMN IF NOT EXISTS material TEXT,
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS height_cm DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS width_cm DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS year INTEGER,
  ADD COLUMN IF NOT EXISTS packaging TEXT[] DEFAULT '{}';
