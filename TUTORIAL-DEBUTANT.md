# Tuto débutant – Section Luxe (marketplace)

Ce guide explique comment faire tourner le site et recevoir les emails « Devenir vendeur » sur ton Gmail.  
**Option simple : publier sur Vercel** → pas besoin d’installer Node.js sur ton Mac.

---

# Option simple : publier sur Vercel

Comme ça, le site est en ligne et les emails partent vers ton Gmail sans rien installer sur ton Mac (sauf un compte GitHub pour héberger le code).

## A. Préparer le code sur GitHub

1. Créez un compte sur **https://github.com** si ce n’est pas déjà fait.
2. Créez un **nouveau dépôt** (New repository), nommez-le par ex. `section-luxe`, ne cochez pas « Initialize with README ».
3. Sur votre Mac, ouvrez le dossier du projet dans le terminal, puis :

```bash
cd "/Users/michaellabrador/Library/Mobile Documents/com~apple~CloudDocs/Luxe/luxe-marketplace"
git init
git add .
git commit -m "Premier commit"
git branch -M main
git remote add origin https://github.com/VOTRE_PSEUDO/section-luxe.git
git push -u origin main
```

*(Remplacez `VOTRE_PSEUDO` et `section-luxe` par votre compte GitHub et le nom du dépôt.)*

Si Git vous demande de vous connecter, suivez les instructions (token ou mot de passe).

## B. Créer le projet Supabase (une seule fois)

1. Allez sur **https://supabase.com** → créez un compte → **New project**.
2. Nom du projet (ex. `section-luxe`), mot de passe pour la base, région → **Create project**.
3. Une fois créé : **Project Settings** (engrenage) → **API**.
4. Notez **Project URL** et la clé **anon public** (qui commence par `eyJ...`).
5. Dans le menu de gauche : **SQL Editor** → New query. Ouvrez le fichier `supabase/schema.sql` du projet, copiez tout le contenu, collez dans l’éditeur Supabase → **Run**. Les tables sont créées.

6. **Créer les espaces de stockage (Storage)** : menu **Storage** → **New bucket**. Créez deux buckets :
   - **documents** (CNI, KBIS) : **ne pas cocher** Public → bucket **privé** (RGPD). Puis dans **SQL Editor**, exécutez le fichier **`supabase/storage-policies.sql`** pour que seuls les admins puissent lire ces pièces.
   - **listings** (photos d’annonces) : cochez **Public bucket**.  
   Détail : voir **`supabase/storage-buckets.md`**.

## C. Publier sur Vercel

1. Allez sur **https://vercel.com** → créez un compte (vous pouvez « Continue with GitHub »).
2. **Add New** → **Project**.
3. Importez le dépôt GitHub `section-luxe` (ou le nom que vous avez choisi). Cliquez **Import**.
4. Avant de déployer, il faut ajouter les **variables d’environnement** (les « clés » que le site utilise en ligne).

#### Étape 4a – Ouvrir les variables
- Sur la page du projet Vercel, avant de cliquer sur **Deploy**, repérez la section **Environment Variables** (souvent sous le nom du dépôt).
- Cliquez sur **Environment Variables** (ou **Add** à côté) pour ajouter des variables.

#### Étape 4b – Ajouter chaque variable une par une
Pour **chaque ligne** du tableau ci‑dessous :
1. Dans le champ **Key** (ou **Name**), tapez **exactement** le nom indiqué (copier-coller pour éviter les fautes).
2. Dans le champ **Value**, tapez la valeur (sans guillemets, sans espace avant/après).
3. Cliquez sur **Add** (ou **Save**), puis recommencez pour la ligne suivante.

| Key (nom) | Value (valeur) |
|-----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | L’URL de ton projet Supabase. Ex. : `https://jlfbzhlxqdtlhkvonzqg.supabase.co` (à récupérer dans Supabase → Project Settings → API → Project URL). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | La clé « anon public » de Supabase (longue chaîne qui commence par `eyJ...`). Même endroit : Project Settings → API → anon public. |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Ton adresse Gmail qui enverra les emails, ex. : `contact.sectionluxe@gmail.com` |
| `SMTP_PASS` | Le **mot de passe d’application** Gmail (pas le mot de passe du compte). Voir ci‑dessous comment l’obtenir. |
| `SMTP_FROM` | La même adresse Gmail, ex. : `contact.sectionluxe@gmail.com` |

#### Obtenir le mot de passe d’application Gmail (SMTP_PASS)
1. Va sur ton compte Google : https://myaccount.google.com  
2. **Sécurité** → section « Connexion à Google » → **Mots de passe des applications** (ou « Validation en 2 étapes » d’abord si demandé).  
3. Choisis « Autre » ou « Mail », nomme (ex. « Section Luxe »), puis **Générer**.  
4. Google affiche un mot de passe à **16 caractères**. Copie-le et colle-le dans **Value** pour `SMTP_PASS` (sans espace).

#### Étape 5 – Déployer
- Cliquez sur **Deploy** (en bas de la page ou à côté du dépôt).
- Attendez 1 à 2 minutes. Un cercle ou une barre de progression s’affiche.

#### Étape 6 – Ouvrir le site
- Quand le statut est **vert** (Ready / Déployé), cliquez sur **Visit** (ou sur l’URL affichée, ex. `section-luxe.vercel.app`).
- Votre site est en ligne. Les demandes « Devenir vendeur » enverront un email à l’adresse indiquée dans `SMTP_USER` / `SMTP_FROM`.

Dès qu’un visiteur remplit « Devenir vendeur » sur ce site, l’email part vers `contact.sectionluxe@gmail.com` avec les infos et les pièces jointes. **Aucune installation de Node.js sur votre Mac n’est nécessaire.**

---

# Option locale : faire tourner le site sur votre Mac

Si vous voulez tester le site chez vous avant de le publier, suivez les étapes ci‑dessous (il faut alors installer Node.js).

---

## 1. Installer Node.js

Le projet a besoin de **Node.js** (version 18 ou plus récente).

- Allez sur : https://nodejs.org  
- Téléchargez la version **LTS** et installez-la.  
- Vérifiez dans un terminal :

```bash
node -v
npm -v
```

Vous devez voir des numéros de version (ex. `v20.x.x` et `10.x.x`).

---

## 2. Ouvrir le projet et installer les dépendances

1. Ouvrez un terminal (Terminal, iTerm, ou le terminal intégré de Cursor/VS Code).
2. Allez dans le dossier du projet :

```bash
cd "chemin/vers/luxe-marketplace"
```

*(Remplacez par le vrai chemin du dossier, par exemple :*  
*`cd "/Users/michaellabrador/Library/Mobile Documents/com~apple~CloudDocs/Luxe/luxe-marketplace"`)*

3. Installez les paquets du projet :

```bash
npm install
```

Attendez la fin sans erreur.

---

## 3. Créer un projet Supabase (base de données)

Le site utilise **Supabase** pour les comptes, les annonces, les messages, etc.

1. Allez sur : https://supabase.com  
2. Créez un compte (ou connectez-vous).  
3. Cliquez sur **New project**.  
4. Choisissez un nom (ex. `section-luxe`), un mot de passe pour la base, une région, puis **Create project**.  
5. Une fois le projet créé, allez dans **Project Settings** (icône engrenage) → **API**.  
6. Notez :
   - **Project URL** (ex. `https://xxxxx.supabase.co`)
   - **anon public** key (longue clé qui commence par `eyJ...`)

---

## 4. Configurer le fichier `.env.local`

Ce fichier contient vos clés (Supabase + email). Il ne doit **jamais** être mis sur GitHub.

1. Dans le dossier du projet, copiez le fichier d’exemple :

```bash
cp .env.local.example .env.local
```

2. Ouvrez `.env.local` avec un éditeur de texte.

3. Remplissez les lignes **Supabase** avec les valeurs notées à l’étape 3 :

```env
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...votre_cle_longue...
```

4. *(Optionnel pour l’instant)* Pour que les demandes « Devenir vendeur » soient envoyées par email à `contact.sectionluxe@gmail.com`, ajoutez les lignes **Email** (ex. avec Gmail) :

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=contact.sectionluxe@gmail.com
SMTP_PASS=votre_mot_de_passe_application
SMTP_FROM=contact.sectionluxe@gmail.com
```

Pour Gmail, il faut un **mot de passe d’application** :  
Google Account → Sécurité → Mots de passe des applications → en créer un et le coller dans `SMTP_PASS`.

Sauvegardez le fichier.

---

## 5. Créer les tables dans Supabase

Pour que le site puisse enregistrer les utilisateurs, vendeurs, annonces, etc., il faut exécuter le schéma SQL une fois.

1. Dans Supabase, ouvrez **SQL Editor**.  
2. Ouvrez le fichier `supabase/schema.sql` du projet dans votre éditeur.  
3. Copiez **tout** son contenu.  
4. Collez-le dans l’éditeur SQL Supabase.  
5. Cliquez sur **Run** (ou Exécuter).

Vous ne devez pas avoir d’erreur. Les tables sont créées.

---

## 6. Lancer le site

Dans le terminal (toujours dans le dossier du projet) :

```bash
npm run dev
```

Quand vous voyez quelque chose comme :

```
▲ Next.js 16.x.x
- Local: http://localhost:3000
```

1. Ouvrez votre navigateur.  
2. Allez sur : **http://localhost:3000**

Vous devriez voir la page d’accueil de Section Luxe.

---

## Récap option Vercel (sans Node sur le Mac)

| Étape | Action |
|-------|--------|
| A | Mettre le code sur GitHub (`git init`, `git add .`, `git commit`, `git push`) |
| B | Créer un projet Supabase, noter URL + clé anon, exécuter `supabase/schema.sql` |
| C | Sur Vercel : importer le dépôt, ajouter les variables d’environnement (Supabase + SMTP), Deploy |

→ Le site est en ligne et les emails « Devenir vendeur » arrivent sur votre Gmail.

## Récap option locale (avec Node sur le Mac)

| Étape | Action |
|-------|--------|
| 1 | Installer Node.js |
| 2 | `npm install` dans le projet |
| 3 | Créer un projet Supabase et noter URL + clé anon |
| 4 | Copier `.env.local.example` en `.env.local` et remplir les clés |
| 5 | Exécuter `supabase/schema.sql` dans Supabase (SQL Editor) |
| 6 | `npm run dev` puis ouvrir http://localhost:3000 |

---

## En cas de problème

- **Le site ne s’ouvre pas**  
  Vérifiez que vous êtes bien dans le dossier du projet et que `npm install` a réussi. Relancez `npm run dev`.

- **Erreur de connexion / Supabase**  
  Vérifiez que `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans `.env.local` sont exactement ceux de Supabase (sans espace, sans guillemet en trop).

- **Les demandes « Devenir vendeur » ne partent pas par email**  
  C’est normal si vous n’avez pas rempli `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`. Le compte vendeur est quand même créé dans Supabase ; seul l’envoi d’email à `contact.sectionluxe@gmail.com` ne se fera pas.

- **Changer le port**  
  Si le port 3000 est déjà utilisé, vous pouvez lancer :  
  `npm run dev -- -p 3001`  
  puis ouvrir http://localhost:3001.

---

Bon courage.
