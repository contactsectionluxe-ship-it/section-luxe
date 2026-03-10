# Sécurité – Section Luxe

Ce document décrit les mesures de sécurité en place pour un déploiement professionnel (visiteurs, vendeurs, données).

## Headers HTTP

- **Strict-Transport-Security (HSTS)** : force le HTTPS (2 ans, preload).
- **X-Frame-Options: DENY** : empêche l’inclusion du site dans une iframe (clickjacking).
- **X-Content-Type-Options: nosniff** : empêche le MIME sniffing.
- **Content-Security-Policy (CSP)** : limite les sources de scripts, styles, images et connexions (XSS).
- **Referrer-Policy** : limite les informations envoyées en referrer.
- **Permissions-Policy** : désactive caméra, micro, géolocalisation.
- **X-Powered-By** : désactivé (next.config) pour ne pas exposer la stack.

## Rate limiting (middleware)

- **Routes `/api/*`** : 60 requêtes/minute par IP.
- **Route `/api/contact`** : 5 envois/minute par IP (formulaire contact et signalements).
- En déploiement multi-instance, prévoir un rate limit partagé (ex. Redis/Upstash) pour une limite globale cohérente.

## API

- **Contact** : validation et sanitisation des champs (email, nom, sujet, message), limite de taille du body (100 Ko), pas d’injection dans les en-têtes email.
- **Upload photos** : types MIME et extension autorisés (JPEG, PNG uniquement), 5 Mo max par fichier, 12 photos max par requête, vérification que l’annonce appartient à l’utilisateur (JWT + BDD).
- **Upload documents vendeur** : validation par `validateDocumentFile` (images + PDF, 5 Mo max).
- **Authentification** : les routes sensibles (upload, suppression compte, etc.) exigent un JWT Supabase valide ; la clé `service_role` n’est utilisée que côté serveur (API routes) et ne doit jamais être exposée au client.

## Données et déploiement

- **Variables d’environnement** : `SUPABASE_SERVICE_ROLE_KEY` et `SMTP_PASS` ne doivent jamais être commitées ni exposées côté client. Seules les variables `NEXT_PUBLIC_*` sont exposées au client.
- **Erreurs** : en production (`NODE_ENV=production`), les réponses d’erreur API ne doivent pas exposer de stack trace ni de détails internes (messages génériques uniquement).
- **HTTPS** : en production, le site doit être servi uniquement en HTTPS (HSTS + configuration du reverse proxy / hébergeur).

## Recommandations

- Activer les politiques RLS (Row Level Security) sur Supabase pour toutes les tables sensibles.
- Auditer régulièrement les dépendances (`npm audit`) et mettre à jour les paquets.
- Sauvegardes régulières de la base Supabase et des fichiers stockage.
- En cas de déploiement à très grande échelle : rate limiting distribué (Redis), WAF, et revue de la CSP selon les besoins (analytics, etc.).
