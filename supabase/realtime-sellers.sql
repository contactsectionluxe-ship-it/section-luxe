-- Activer Realtime sur la table sellers pour que le vendeur voie son statut (validé/refusé) en temps réel
-- À exécuter une fois dans Supabase → SQL Editor
ALTER PUBLICATION supabase_realtime ADD TABLE public.sellers;
