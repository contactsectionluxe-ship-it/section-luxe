# LUXE - Marketplace de Luxe B2C

Une marketplace web spécialisée dans les articles de luxe, réservée exclusivement aux vendeurs professionnels. Inspirée de Leboncoin avec un design premium façon Apple.

## Fonctionnalités

### Pour les acheteurs
- Navigation libre sans compte
- Consultation des annonces avec galerie photos
- Système de favoris (compte requis)
- Messagerie intégrée avec les vendeurs
- Filtres par catégorie et tri

### Pour les vendeurs professionnels
- Inscription avec vérification (CNI + KBIS)
- Validation par l'administration
- Création et gestion d'annonces
- Messagerie avec les acheteurs
- Tableau de bord avec statistiques

### Pour l'administration
- Validation des demandes vendeurs
- Consultation des documents justificatifs
- Gestion des statuts (en attente, validé, refusé)

## Stack technique

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Backend**: Supabase (Auth, Database, Storage, Realtime)
- **Icons**: Lucide React

## Installation

### Prérequis
- Node.js 18+
- npm
- Compte Supabase

### Configuration Supabase

1. Créez un projet sur [Supabase](https://supabase.com)

2. Dans l'éditeur SQL, exécutez le script `supabase/schema.sql` pour créer les tables

3. Dans **Authentication > Providers**, activez Email/Password

4. Dans **Storage**, créez deux buckets :
   - `documents` (privé) - pour les CNI et KBIS
   - `listings` (public) - pour les photos des annonces

5. Copiez vos clés depuis **Settings > API**

### Installation du projet

```bash
cd luxe-marketplace
npm install
```

### Configuration des variables d'environnement

```bash
cp .env.local.example .env.local
```

Éditez `.env.local` avec vos clés Supabase :
```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
```

### Lancement

```bash
npm run dev
```

L'application sera accessible sur http://localhost:3000

## Structure du projet

```
luxe-marketplace/
├── src/
│   ├── app/                    # Pages Next.js (App Router)
│   │   ├── (public)/           # Pages publiques
│   │   ├── (auth)/             # Authentification
│   │   ├── (buyer)/            # Espace acheteur
│   │   ├── (seller)/           # Mes annonces
│   │   └── (admin)/            # Administration
│   ├── components/
│   │   ├── ui/                 # Composants UI réutilisables
│   │   ├── layout/             # Header, Footer
│   │   └── products/           # Cartes produits, galerie
│   ├── lib/
│   │   └── supabase/           # Client et services Supabase
│   ├── hooks/                  # Hooks React
│   └── types/                  # Types TypeScript
├── supabase/
│   └── schema.sql              # Script de création des tables
└── package.json
```

## Catégories disponibles

- Sac
- Montres
- Bijoux
- Vêtements
- Chaussures
- Accessoires
- Maroquinerie
- Autre

## Création d'un compte admin

Pour créer un compte administrateur :

1. Créez un compte via l'interface
2. Dans Supabase Dashboard, allez dans **Table Editor > users**
3. Trouvez votre utilisateur et changez le champ `role` en `admin`

## Design

- **Palette** : Noir (#1a1a1a), Blanc, Gris, Beige (#e8e4de), Or (#c9a96e)
- **Typographies** : Inter (corps), Playfair Display (titres)
- **Style** : Minimaliste, premium, inspiré Apple

## Avantages de Supabase

- **Interface simple** : Dashboard intuitif pour gérer les données
- **Auth intégrée** : Authentification email/password prête à l'emploi
- **Realtime** : Messagerie temps réel sans configuration
- **Storage** : Gestion des fichiers simplifiée
- **SQL** : Requêtes PostgreSQL puissantes
- **Gratuit** : Plan gratuit généreux pour le développement

## License

MIT
