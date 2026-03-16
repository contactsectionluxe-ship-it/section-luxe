-- À exécuter dans Supabase : SQL Editor → New query → Coller ce script → Run
-- Cela autorise les statuts "suspended" et "banned" pour la table sellers.

-- 1. Supprimer l’ancienne contrainte
ALTER TABLE public.sellers
  DROP CONSTRAINT IF EXISTS sellers_status_check;

-- Si l’étape 2 échoue avec "relation already has a check constraint", exécuter d’abord :
-- SELECT conname FROM pg_constraint WHERE conrelid = 'public.sellers'::regclass AND contype = 'c';
-- Puis : ALTER TABLE public.sellers DROP CONSTRAINT "le_nom_affiché";

-- 2. Recréer la contrainte avec tous les statuts
ALTER TABLE public.sellers
  ADD CONSTRAINT sellers_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'banned'));
