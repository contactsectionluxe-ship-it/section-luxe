-- Normalise la colonne category en minuscules pour que le filtre catalogue
-- (ex. catégorie "montres") retrouve bien toutes les annonces (ex. Rolex Submariner).
-- À exécuter une fois dans le SQL Editor Supabase si des annonces ont été créées
-- avec une casse différente (ex. "Montres" au lieu de "montres").

UPDATE public.listings
SET category = LOWER(TRIM(category))
WHERE category IS NOT NULL
  AND category <> LOWER(TRIM(category));
