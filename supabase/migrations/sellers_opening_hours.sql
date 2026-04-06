-- Horaires d'ouverture vendeur (JSON : jours + plages, option fermé / double plage)
ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT NULL;

COMMENT ON COLUMN public.sellers.opening_hours IS
  'Horaires hebdo : { monday: { closed?: true } | { slots: [{open,close}] } }, … (max 2 plages/jour)';
