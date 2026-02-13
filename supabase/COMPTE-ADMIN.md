# Compte administrateur (contact.sectionluxe@gmail.com)

Seul le compte **contact.sectionluxe@gmail.com** peut voir le menu **Administration** dans le header et accéder à la page `/admin` pour valider ou refuser les demandes « Devenir vendeur ». Le statut (validé/refusé) se met à jour en temps réel côté vendeur.

## 1. Créer le compte

1. Sur le site : va sur **Connexion** (ou Inscription si besoin).
2. Crée un compte avec l’email **contact.sectionluxe@gmail.com** (inscription acheteur ou connexion classique).
3. Si tu n’as pas encore de compte, utilise **Inscription** avec cet email et un mot de passe.

## 2. Donner le rôle admin

Dans **Supabase** → **SQL Editor**, exécute (une seule fois) :

```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'contact.sectionluxe@gmail.com';
```

Vérifie qu’une ligne a été mise à jour. Si aucun compte n’existe encore avec cet email, crée d’abord le compte (étape 1) puis relance cette requête.

## 2b. Créer une fiche vendeur pour l’admin (pour voir l’icône Store)

Pour que l’icône **Store** s’affiche au lieu de l’icône personnage dans le header, crée une entrée dans `sellers` :

```sql
-- Récupère l'ID du compte admin
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id FROM public.users WHERE email = 'contact.sectionluxe@gmail.com';
  
  IF admin_user_id IS NOT NULL THEN
    -- Crée une fiche seller avec status 'approved' (l'admin est automatiquement validé)
    INSERT INTO public.sellers (
      id, email, company_name, address, phone, description, 
      status, id_card_front_url, kbis_url, created_at, updated_at
    )
    VALUES (
      admin_user_id,
      'contact.sectionluxe@gmail.com',
      'Section Luxe',
      'Adresse à compléter',
      'Téléphone à compléter',
      'Compte administrateur',
      'approved',
      '',
      '',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
```

Après ça, reconnecte-toi : tu verras l’icône **Store** avec « Section Luxe » (ou le nom que tu as mis dans `company_name`).

## 3. (Optionnel) Realtime pour le statut vendeur

Pour que le vendeur voie son statut (Validé / Refusé) se mettre à jour sans recharger la page quand tu valides ou refuses :

Dans **Supabase** → **SQL Editor**, exécute :

```sql
-- Voir le fichier supabase/realtime-sellers.sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.sellers;
```

Si cette table est déjà dans la publication, Supabase indiquera une erreur « already exists » : tu peux l’ignorer.

## 4. Utilisation

- Connecte-toi avec **contact.sectionluxe@gmail.com**.
- Le menu **Administration** apparaît dans le header (icône utilisateur → Administration).
- Sur `/admin` tu vois les demandes vendeurs, les documents (CNI, KBIS) et tu peux **Valider** ou **Refuser**.
- Le vendeur voit son statut se mettre à jour en temps réel (si l’étape 3 a été faite) ou après un rechargement de la page.
