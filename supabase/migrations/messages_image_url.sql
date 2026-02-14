-- Optionnel : ajouter une URL d'image aux messages (pièce jointe)
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS image_url TEXT;
