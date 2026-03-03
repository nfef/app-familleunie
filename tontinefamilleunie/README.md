# Tontine Famille Unie

Application PWA mobile-first pour la gestion d'une tontine communautaire, basée sur Next.js 14, Supabase et Tailwind CSS.

## Sommaire
- [Fonctionnalités](#fonctionnalités)
- [Prérequis](#prérequis)
- [Installation locale](#installation-locale)
- [Configuration Supabase](#configuration-supabase)
- [Développement](#développement)
- [PWA](#pwa)
- [Sécurité & RLS](#sécurité--rls)
- [Déploiement](#déploiement)

## Fonctionnalités
- Authentification email/mot de passe + Google via Supabase Auth
- Rôles (ADMIN, TRESORIER, COMMISSAIRE, MEMBRE) avec RLS strict
- Gestion des cycles, réunions, cotisations, caisses, événements heureux/malheureux
- Pages principales : Dashboard, Historique personnel & collectif, Gestion des tontines, Saisie cotisations/caisses, Événements, Profil, Administration
- RPC Supabase pour calculer les soldes, programmer automatiquement les bénéficiaires, clôturer cycles/événements
- PWA (manifest, service worker) avec cache en lecture seule

## Prérequis
- Node.js >= 18.20.2
- npm ou pnpm
- Compte Supabase (projet configuré en région proche de vos utilisateurs)

## Installation locale
```bash
cp .env.example .env.local
# renseigner les variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

## Configuration Supabase
1. Créez un nouveau projet Supabase.
2. Dans le SQL Editor, exécutez successivement les fichiers :
   - `supabase/schema.sql`
   - `supabase/functions.sql`
   - `supabase/policies.sql`
3. Ajoutez au besoin des membres initiaux dans `members` + `member_roles` pour générer les comptes administrateurs.
4. Activez l'authentification email/password et Google (URL de redirection : `https://votre-domaine.com/dashboard`).
5. Créez un bucket de stockage `avatars` si vous souhaitez gérer des photos (politiques à adapter selon vos besoins).

## Développement
- Le client Supabase se trouve dans `src/lib/supabase`. Utilisez `createSupabaseServerClient` côté Server Components et `useSupabase` côté client.
- Les pages protégées utilisent `requireSession` qui redirige vers `/login` si aucune session n'est trouvée.
- Les formulaires (React Hook Form + Zod) réalisent les insertions/updates autorisées par les politiques RLS.
- Le script SQL fournit les RPC `compute_member_balances`, `schedule_weekly_payouts`, `close_cycle`, `close_event` et les vues de reporting.

## PWA
- `public/manifest.json` décrit l'application (nom, couleurs, icônes). Remplacez les icônes fournies par de véritables PNG 192/512 px.
- `public/sw.js` implémente un cache « network falling back to cache ». Le service worker est enregistré via `PwaRegister` dans le layout.
- Pour tester l'installation : `npm run dev`, ouvrez l'application dans Chrome mobile/desktop et vérifiez l'onglet « Applications ».

## Sécurité & RLS
- Les politiques du dossier `supabase/policies.sql` implémentent les règles métier :
  - lecture profil limitée à soi-même,
  - seules les rôles autorisés peuvent insérer/mettre à jour cotisations, caisses, événements,
  - séparation stricte lecture/écriture pour commissaires/treas.
- Les RPC sont `security definer` et utilisent `auth.uid()` pour accéder aux données.
- Ajoutez une table `audit_logs` (déjà prévue) ou des Edge Functions pour tracer les actions sensibles si nécessaire.

## Déploiement
1. **Supabase** : configurez le domaine personnalisé, les clés API et les backups. Importez les migrations SQL via `supabase db diff` / `supabase db push`.
2. **Frontend** : déployez sur Vercel/Netlify. Variables d'environnement à fournir :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ou `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` selon votre interface)
3. **PWA** : sur Vercel, `public/manifest.json` et `public/sw.js` sont servis automatiquement. Vérifiez que `NEXT_PUBLIC_SITE_URL` pointe vers l'URL finale.
4. **Post-déploiement** : créez les rôles initiaux (ADMIN/TRESORIER/COMMISSAIRE) directement dans Supabase et attribuez-les aux membres correspondants.
