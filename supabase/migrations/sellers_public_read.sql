-- Permettre à tout le monde (y compris non connecté) de lire les infos vendeur
-- pour afficher la page produit (bloc vendeur, téléphone, carte, etc.)
CREATE POLICY "Sellers are viewable by everyone" ON public.sellers FOR SELECT USING (true);
