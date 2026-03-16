-- Date de fin de suspension (pour affichage et éventuelle levée automatique future)
ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.sellers.suspended_until IS 'Fin de la suspension (null si non suspendu ou suspension illimitée)';
