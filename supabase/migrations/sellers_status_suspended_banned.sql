-- Ajouter les statuts suspended et banned aux vendeurs
-- suspended : ne peut plus déposer d'annonces (annonces existantes conservées)
-- banned : redevient visiteur, annonces supprimées

ALTER TABLE public.sellers
  DROP CONSTRAINT IF EXISTS sellers_status_check;

ALTER TABLE public.sellers
  ADD CONSTRAINT sellers_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'banned'));
