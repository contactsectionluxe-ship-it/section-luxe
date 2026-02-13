-- Créer une fiche seller pour le compte admin (contact.sectionluxe@gmail.com)
-- À exécuter dans Supabase → SQL Editor

-- 1. Vérifier que le compte existe et récupérer son ID
SELECT id, email, role FROM public.users WHERE email = 'contact.sectionluxe@gmail.com';

-- 2. Créer la fiche seller (remplace l'ID par celui affiché ci-dessus)
-- Si tu vois un ID dans le résultat ci-dessus, remplace-le dans la requête suivante :

INSERT INTO public.sellers (
  id, 
  email, 
  company_name, 
  address, 
  phone, 
  description, 
  status, 
  id_card_front_url, 
  kbis_url, 
  created_at, 
  updated_at
)
SELECT 
  id,
  email,
  'Section Luxe',
  'Adresse à compléter',
  'Téléphone à compléter',
  'Compte administrateur',
  'approved',
  '',
  '',
  NOW(),
  NOW()
FROM public.users
WHERE email = 'contact.sectionluxe@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  updated_at = NOW();

-- 3. Vérifier que la fiche a été créée
SELECT * FROM public.sellers WHERE email = 'contact.sectionluxe@gmail.com';
