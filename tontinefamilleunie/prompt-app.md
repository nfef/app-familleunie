AGIS COMME :
Un architecte logiciel senior + développeur full-stack expert en Supabase, PostgreSQL, sécurité RLS, React + TypeScript + PWA.

OBJECTIF :
Concevoir et développer une application Web professionnelle de gestion de tontine communautaire, responsive mobile-first, utilisable principalement sur smartphone sous forme de Progressive Web App (PWA), avec Supabase comme backend complet.

STACK TECHNIQUE IMPOSÉE :
- Backend : Supabase (PostgreSQL, Auth, RLS, Storage)
- Authentification : Email/Mot de passe + Social Auth (Google)
- Frontend : React + TypeScript (ou Next.js App Router)
- UI : Responsive, mobile-first, PWA
- Base de données : PostgreSQL normalisé
- Sécurité : Row Level Security strict
- Stockage fichiers : Supabase Storage (photos de profil)
- Déploiement : Vercel / Netlify + Supabase

USAGE :
- Application Web uniquement
- Optimisée pour mobile (80% d’usage)
- Fonctionnement hors-ligne partiel via PWA (cache lecture)

RÈGLES MÉTIER À RESPECTER :

1) UTILISATEURS & RÔLES :
- Chaque membre possède un compte utilisateur Supabase.
- Postes :
  Président, Vice-président, Secrétaire Général, SG adjoint, Trésorier,
  Commissaire aux comptes 1 & 2, 3 Conseillers, Fondateur.
- Rôles techniques :
  ADMIN, TRESORIER, COMMISSAIRE, MEMBRE.
- À l’inscription : paiement initial configurable = 10 000 FCFA.

2) CAISSES :
- Fonds de caisse (objectif 100 000 FCFA)
- Caisse d’assurance (objectif 100 000 FCFA)
- Possibilité d’ajouter d’autres caisses dynamiquement.
- Historique complet de tous les versements.
- Calcul automatique du solde par membre et par caisse.

3) CYCLES & RÉUNIONS :
- 3 à 4 cycles par an.
- Chaque cycle dure 3 à 4 mois.
- Chaque cycle contient plusieurs réunions hebdomadaires.
- Chaque réunion sert de référence aux cotisations.

4) TONTINES & COTISATIONS :
- Tontine principale : 20 000 FCFA la part (configurable).
- Un membre peut avoir plusieurs parts.
- Ration : 2 500 FCFA.
- Tontine Huile/Savon : 2 000 FCFA la part.
- Chaque dimanche :
  - 2 bénéficiaires de la tontine principale.
  - 1 bénéficiaire de la tontine huile/savon.
- Le Trésorier saisit toutes les cotisations par séance.
- Historique complet par membre et par réunion.

5) ÉVÉNEMENTS :
- Heureux : mariage, anniversaire de mariage, naissance.
- Malheureux : décès père, mère, enfants, conjoint.
- Montants :
  - Mariage : 1 000 000 FCFA
  - Décès parent : 600 000 FCFA
  - Naissance : 10 000 FCFA / membre
- Tous les montants doivent être configurables.
- Suivi des contributions par événement.

6) PERMISSIONS :
- MEMBRE :
  - Accès à son profil
  - Accès à ses historiques
  - Lecture des séances collectives
- TRESORIER :
  - Saisie cotisations
  - Saisie caisses
- COMMISSAIRE :
  - Vérification et saisie caisses
- ADMIN :
  - Paramétrage général

FONCTIONNALITÉS À LIVRER :

1) BASE DE DONNÉES SUPABASE :
- Schéma SQL complet avec :
  members, roles, cycles, meetings, fund_types, fund_contributions,
  contribution_types, member_contributions,
  tontine_payouts,
  event_types, events, event_contributions.
- Clés étrangères, index, contraintes.

2) SÉCURITÉ :
- Politiques RLS strictes par rôle
- Protection contre accès illégaux
- Séparation lecture / écriture

3) LOGIQUE MÉTIER :
- RPC SQL pour :
  - Calcul des soldes
  - Génération automatique des bénéficiaires
  - Clôture des cycles
  - Clôture des événements
  - Tableaux de reporting

4) FRONTEND WEB RESPONSIVE :
- Pages :
  - Auth (login, signup, social)
  - Dashboard membre
  - Profil (édition + photo)
  - Saisie cotisations (Trésorier)
  - Historique par séance
  - Historique personnel
  - Gestion des tontines
  - Gestion des événements
  - Administration
- React + TypeScript
- Supabase JS SDK
- Design mobile-first
- Navigation par bottom-bar mobile

5) PWA :
- Manifest.json
- Service Worker
- Cache en lecture seule
- Mode hors-ligne partiel
- Icône d’installation mobile

6) LIVRABLES OBLIGATOIRES :
- SQL complet Supabase
- Politiques RLS détaillées
- Fonctions métiers SQL
- Frontend React complet avec structure de dossiers
- Exemple de composants clés
- README de déploiement production
- Instructions pour transformer en PWA

FORMAT DE RÉPONSE :
Étape 1 : Architecture générale
Étape 2 : Schéma SQL Supabase complet
Étape 3 : Politiques RLS complètes
Étape 4 : Fonctions métiers SQL
Étape 5 : Frontend Web responsive
Étape 6 : PWA
Étape 7 : Sécurité & bonnes pratiques
Étape 8 : Guide de déploiement

CONTRAINTE :
- Aucun pseudo-code vague
- SQL réel uniquement
- TypeScript réel uniquement
- Production-ready

COMMENCE IMMÉDIATEMENT PAR L’ARCHITECTURE.
