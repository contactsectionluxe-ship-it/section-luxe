# Créer les 2 buckets Storage (RGPD‑compatible)

À faire **une seule fois** dans ton projet Supabase.

## 1. Créer les buckets

1. Ouvre ton projet : https://supabase.com/dashboard  
2. Menu de gauche → **Storage** → **New bucket**.

### Bucket `documents` (CNI, KBIS – **données personnelles**)
- **Name:** `documents`
- **Ne pas cocher** « Public bucket » → le bucket reste **privé**. Seuls les admins (et le vendeur concerné) pourront accéder aux fichiers, conformément à la RGPD.
- Clique **Create bucket**.

### Bucket `listings` (photos d’annonces – publiques)
- **New bucket** à nouveau.
- **Name:** `listings`
- Coche **Public bucket** (les photos des produits sont visibles par tous sur le site).
- Clique **Create bucket**.
- **Limite de taille par fichier :** l’application autorise jusqu’à **10 Mo** par photo (`src/lib/file-validation.ts`). Dans Supabase, ouvre **Storage** → bucket **listings** → menu **…** → **Edit bucket** et règle la limite à **au moins 10 Mo**, ou exécute la migration **`supabase/migrations/storage_listings_bucket_file_size_10mb.sql`** (sinon erreur *The object exceeded the maximum allowed size* à l’upload).

## 2. Politiques d’accès pour `documents` (obligatoire)

Sans cette étape, les uploads « Devenir vendeur » peuvent échouer et la lecture des pièces serait mal sécurisée.

1. Dans Supabase : **SQL Editor** → New query.
2. Ouvre le fichier **`supabase/storage-policies.sql`** du projet, copie tout son contenu, colle dans l’éditeur.
3. Clique **Run**.

Résultat :
- Seuls les **admins** (et le vendeur propriétaire) peuvent **voir** les documents (CNI, KBIS).
- Les **visiteurs** du site peuvent **envoyer** des fichiers lors de l’inscription vendeur (upload autorisé), mais ne peuvent pas les consulter après.

En résumé : documents = **privé** + politiques RLS ; listings = **public**.
