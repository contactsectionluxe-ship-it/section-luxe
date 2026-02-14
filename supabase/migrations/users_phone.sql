-- Téléphone optionnel pour les utilisateurs (profil)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
