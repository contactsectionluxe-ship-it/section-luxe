-- Taille (vêtements) / Pointure (chaussures)
-- Exécuter dans Supabase → SQL Editor

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS size TEXT;
