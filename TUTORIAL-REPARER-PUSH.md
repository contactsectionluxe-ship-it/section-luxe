# Réparer le push vers GitHub – Tuto simple

## En bref

- **Le problème :** Quand tu tapes `git push`, ça ne marche plus (erreur « Device not configured » ou « Authentication failed »).
- **La cause :** GitHub ne reconnaît plus ton Mac. Il faut lui donner un **mot de passe spécial** (appelé « token »).
- **Ce qu’on va faire :** Créer ce mot de passe spécial sur le site GitHub, puis le mettre dans ton projet pour que le push refonctionne.

---

## C’est quoi « push » ?

**Push** = envoyer le code de ton ordinateur vers GitHub.  
Quand le push marche, ton code est sur GitHub, et Vercel peut le récupérer pour mettre le site à jour.

---

## La méthode en 4 étapes (avec un token)

On va faire **une seule chose** : créer un « token » sur GitHub (un mot de passe à usage unique pour ton ordinateur) et le donner à Git. Après ça, `git push` marchera à nouveau.

---

### Étape 1 – Créer le token sur GitHub

1. Ouvre ton navigateur et va sur **https://github.com**.
2. Clique sur **ta photo** (en haut à droite) → **Settings**.
3. Tout en bas à gauche, clique sur **Developer settings**.
4. Clique sur **Personal access tokens** puis **Tokens (classic)**.
5. Clique sur **Generate new token (classic)**.
6. Donne un nom au token, par exemple : **Push Section Luxe**.
7. Coche la case **repo** (accès aux dépôts).
8. Clique sur **Generate token** en bas de la page.
9. **Important :** Une longue suite de lettres et chiffres s’affiche. **Copie-la tout de suite** et colle-la dans un Bloc-notes ou un endroit sûr. Tu ne pourras plus la revoir après avoir quitté la page.  
   C’est ton **token** : Git l’utilisera comme mot de passe à la place de ton vrai mot de passe GitHub.

---

### Étape 2 – Ouvrir le terminal et aller dans le projet

1. Ouvre **Terminal** (ou le terminal dans Cursor).
2. Copie-colle cette ligne puis appuie sur Entrée :

```bash
cd "/Users/michaellabrador/Library/Mobile Documents/com~apple~CloudDocs/Luxe/luxe-marketplace"
```

Tu es maintenant « dans » le dossier du projet. Les commandes suivantes se font dans ce même terminal.

---

### Étape 3 – Donner le token à Git

Il faut dire à Git : « Quand je push, utilise ce token comme mot de passe ».

**À faire :** Ouvre la commande ci-dessous. Remplace **`COLLE_ICI_TON_TOKEN`** par le token que tu as copié à l’étape 1 (sans espace avant ou après), puis exécute la ligne dans le terminal.

```bash
git remote set-url origin https://contactsectionluxe-ship-it:COLLE_ICI_TON_TOKEN@github.com/contactsectionluxe-ship-it/section-luxe.git
```

**Exemple :** Si ton token est `ghp_abc123xyz`, ta ligne devient :

```bash
git remote set-url origin https://contactsectionluxe-ship-it:ghp_abc123xyz@github.com/contactsectionluxe-ship-it/section-luxe.git
```

*(Si ton dépôt GitHub a un autre nom de compte ou un autre nom de projet, remplace `contactsectionluxe-ship-it` et `section-luxe` par les bons noms.)*

---

### Étape 4 – Tester le push

Dans le même terminal, tape :

```bash
git push origin main
```

- Si tout va bien, tu vois un message du type **main -> main** ou **Everything up-to-date**. **C’est réparé.**
- Si une erreur s’affiche, copie le message exact et tu pourras le partager pour qu’on le corrige.

---

## Après ça

À chaque fois que tu modifies le code et que tu veux mettre à jour le site :

1. `git add .`
2. `git commit -m "Description de ce que tu as fait"`
3. `git push origin main`

Une fois le push fait, Vercel (si ton projet y est connecté) mettra le site à jour tout seul.

---

## En résumé

| Étape | Où | Action |
|-------|-----|--------|
| 1 | Site GitHub | Créer un token (Settings → Developer settings → Personal access tokens) et le copier. |
| 2 | Terminal | Aller dans le dossier du projet avec `cd "...luxe-marketplace"`. |
| 3 | Terminal | Coller le token dans la commande `git remote set-url origin https://...TOKEN...` et l’exécuter. |
| 4 | Terminal | Lancer `git push origin main` pour vérifier que ça marche. |

---

## Si tu veux aller plus loin (optionnel)

La méthode ci-dessus utilise un **token** dans l’URL. Une autre façon de faire est d’utiliser une **clé SSH** : tu la configures une fois, et après tu n’as plus besoin de token. Si un jour tu veux passer à cette méthode, tu peux chercher « GitHub SSH key » ou demander un tuto dédié SSH.

Pour l’instant, le token suffit pour que le push refonctionne.
