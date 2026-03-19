-- Code court unique pour les URLs catalogue vendeur : /catalogue/seller/{seller_code}/{slug-nom}
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS seller_code TEXT;

-- Remplir les lignes existantes (8 caractères hex dérivés de l'id, stables)
UPDATE public.sellers
SET seller_code = lower(substring(md5(id::text), 1, 8))
WHERE seller_code IS NULL OR trim(seller_code) = '';

ALTER TABLE public.sellers ALTER COLUMN seller_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS sellers_seller_code_lower_key ON public.sellers (lower(seller_code));

COMMENT ON COLUMN public.sellers.seller_code IS 'Identifiant court pour URL /catalogue/seller/{code}/{slug}';

-- Nouveaux vendeurs : code auto si non fourni
CREATE OR REPLACE FUNCTION public.sellers_set_seller_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.seller_code IS NULL OR trim(NEW.seller_code) = '' THEN
    NEW.seller_code := lower(substring(md5(random()::text || NEW.id::text), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sellers_seller_code ON public.sellers;
CREATE TRIGGER trg_sellers_seller_code
  BEFORE INSERT ON public.sellers
  FOR EACH ROW
  EXECUTE FUNCTION public.sellers_set_seller_code();
