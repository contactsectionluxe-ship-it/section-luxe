# Pousser le code vers GitHub (pour que Vercel puisse importer)

L’erreur **« The provided GitHub repository does not contain the requested branch or commit reference »** signifie que le dépôt GitHub est encore vide. Il faut **pousser** le code depuis ton Mac.

## 1. Ouvrir un terminal

Ouvre l’application **Terminal** (ou le terminal dans Cursor) et va dans le projet :

```bash
cd "/Users/michaellabrador/Library/Mobile Documents/com~apple~CloudDocs/Luxe/luxe-marketplace"
```

## 2. Utiliser le bon compte GitHub (important si tu as plusieurs comptes)

L’erreur **« Permission denied to PerfSales »** signifie que Git pousse avec le compte **PerfSales** alors que le dépôt est sur **contactsectionluxe-ship-it**. Il faut forcer le bon compte.

Dans le terminal, configure l’URL du dépôt avec le bon utilisateur :

```bash
git remote set-url origin https://contactsectionluxe-ship-it@github.com/contactsectionluxe-ship-it/section-luxe.git
```

(Si tu préfères que Git te redemande identifiant et mot de passe au lieu d’utiliser un compte enregistré sur le Mac, tu peux aussi aller dans **Keychain Access** (Trousseau d’accès), chercher **github.com**, et supprimer l’entrée pour que Git redemande les identifiants.)

## 3. Pousser vers GitHub

Tape :

```bash
git push -u origin main
```

Quand Git demande un **mot de passe**, colle le **Personal Access Token** du compte **contactsectionluxe-ship-it** (pas le mot de passe du compte, et pas un token du compte PerfSales).

### Créer un token GitHub (compte contactsectionluxe-ship-it)

1. Va sur https://github.com → clique sur ta photo (en haut à droite) → **Settings**.
2. En bas à gauche : **Developer settings** → **Personal access tokens** → **Tokens (classic)**.
3. **Generate new token (classic)**. Donne un nom (ex. « Vercel Section Luxe »), coche **repo** (accès aux dépôts).
4. **Generate token**. Copie le token affiché (tu ne pourras plus le revoir).
5. Quand le terminal demande **Password**, colle ce **token** (et non ton mot de passe). Utilise un token créé **dans le compte contactsectionluxe-ship-it**, pas PerfSales.

## 5. Après un push réussi

Tu devrais voir quelque chose comme : `main -> main` ou `Branch 'main' set up to track 'origin/main'.`

Ensuite, sur **Vercel** : **Add New** → **Project** → réimporte le dépôt **contactsectionluxe-ship-it/section-luxe**. La branche **main** sera bien là et l’import fonctionnera.
