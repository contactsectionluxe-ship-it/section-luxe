# Déployer Section Luxe sur Vercel

## Méthode 1 : Via le site Vercel (recommandé)

1. **Compte**  
   Va sur [vercel.com](https://vercel.com) et connecte-toi (ou crée un compte avec GitHub).

2. **Importer le projet**  
   - Clique sur **Add New…** → **Project**.  
   - Choisis **Import Git Repository** et sélectionne **contactsectionluxe-ship-it/section-luxe**.  
   - Si le repo n’apparaît pas, clique sur **Configure GitHub** et autorise l’accès à l’organisation ou au compte.

3. **Configuration**  
   - **Framework** : Vercel détecte Next.js, tu n’as rien à changer.  
   - **Root Directory** : laisse vide (tout le projet est dans la racine).  
   - **Build Command** : `next build` (par défaut).  
   - **Output Directory** : laisser par défaut.

4. **Variables d’environnement**  
   Dans **Environment Variables**, ajoute (pour **Production**, **Preview** et **Development** si tu veux) :

   | Nom | Valeur | Secret |
   |-----|--------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | ton URL Supabase | Non |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ta clé anon Supabase | Oui |
   | `SUPABASE_SERVICE_ROLE_KEY` | ta clé service_role Supabase | Oui |
   | `SMTP_HOST` | (optionnel) | - |
   | `SMTP_PORT` | `587` (optionnel) | - |
   | `SMTP_USER` | (optionnel) | Oui |
   | `SMTP_PASS` | (optionnel) | Oui |
   | `SMTP_FROM` | (optionnel) | - |

   Copie les valeurs depuis ton fichier `.env.local` (sans le commiter sur GitHub).

5. **Déploiement**  
   Clique sur **Deploy**. À la fin, tu auras une URL du type `section-luxe-xxx.vercel.app`.

6. **Déploiements suivants**  
   À chaque `git push origin main`, Vercel redéploiera automatiquement.

---

## Méthode 2 : Via la ligne de commande (CLI)

1. **Installer Vercel CLI**  
   ```bash
   npm i -g vercel
   ```

2. **Dans le dossier du projet**  
   ```bash
   cd "/Users/michaellabrador/Library/Mobile Documents/com~apple~CloudDocs/Luxe/luxe-marketplace"
   vercel
   ```

3. **Suivre les questions**  
   - Log in avec ton compte Vercel (navigateur).  
   - Link to existing project ou Create new : choisis selon ton cas.  
   - Les variables d’environnement devront être ajoutées dans le dashboard Vercel (Settings → Environment Variables) ou avec `vercel env add`.

4. **Déploiement en production**  
   ```bash
   vercel --prod
   ```

---

## Après le déploiement

- **Supabase** : vérifie que l’URL de ton site est autorisée dans **Authentication → URL Configuration → Redirect URLs** (ajoute `https://ton-site.vercel.app/**`).
- **Stockage / politiques** : si tu utilises des buckets Supabase Storage, les politiques restent gérées côté Supabase ; pas de changement côté Vercel.
