-- Photo de profil vendeur
-- À exécuter dans Supabase SQL Editor

ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;
