# Évolutions backend à prévoir

Liste des manques identifiés dans l'API (`backend-familleunie`) qui bloqueront certaines actions du futur back-office. Aucun de ces points n'empêche de démarrer le back-office (consultation + actions déjà supportées suffisent pour un premier périmètre), mais ils devront être traités dès que le back-office aura besoin d'éditer/supprimer/récupérer un compte.

## 1. Modifier une cotisation / un mouvement de caisse déjà enregistré
- **Statut** : fait — `PATCH /contributions/{id}` et `PATCH /fund-entries/{id}` (`ContributionController`)

## 2. Supprimer un membre, un cycle, une sanction, un prêt
- **Statut** : fait — `DELETE /admin/members/{id}` (avec garde-fou anti-auto-suppression), `DELETE /cycles/{id}`, `DELETE /sanctions/{id}`, `DELETE /loans/{id}` — tous en soft delete via `HasAuditTrail`

## 3. Modifier un type de cotisation / caisse existant
- **Statut** : fait — `PATCH /admin/contribution-types/{id}` et `PATCH /admin/fund-types/{id}`

## 4. Mot de passe oublié
- **Décision** : pas de flux self-service par email. En cas d'oubli, le membre contacte l'administrateur, qui régénère un mot de passe via l'action "Réinitialiser le mot de passe" du back-office (`PATCH /admin/members/{id}/reset-password`) et le communique hors plateforme.
- **Statut** : résolu autrement (pas de développement supplémentaire prévu)

## 5. Dashboard admin plus riche
- **Statut** : fait — `AdminController::dashboard` renvoie maintenant aussi `by_cycle` (total des cotisations par cycle) et `monthly_trend` (6 derniers mois). Reste à brancher côté back-office (pas encore fait).

## 6. Liste globale des mouvements de caisse
- **Statut** : fait — `GET /admin/fund-entries` (ADMIN/TRESORIER/COMMISSAIRE), paginé, filtrable par `fund_type_id`/`direction`/`from`/`to`. Reste à brancher côté back-office (page "Caisses" toujours limitée à afficher les types + enregistrer un mouvement, sans historique affiché).

## 7. Rôles manquants (CENSEUR, PRESIDENT, FONDATEUR, VICE_PRESIDENT, SECRETAIRE_ADJOINT)
- **Statut** : fait — `AdminController::ALLOWED_ROLES` complété, back-office mis à jour, déployé

## 8. Générer un nouveau mot de passe pour un membre
- **Statut** : fait — `PATCH /admin/members/{id}/reset-password`, action "Mot de passe" dans le back-office, déployé

## 9. Prêts : date d'emprunt et reconduction
- **Statut** : fait — `contracted_at`, reconduction (`POST /loans/{id}/renew`, 2 scénarios), traçabilité `parent_loan_id`, `due_date` accepte désormais une date passée

## 10. Gestion des types d'événements
- **Statut** : fait — `POST`/`PATCH`/`DELETE /admin/event-types`, catégorie (heureux/malheureux), mode de calcul (montant fixe par membre ou enveloppe divisée par le nombre de membres avec `computed_share`)

## 11. Enregistrer la contribution de chaque membre à un événement
- **État actuel** : `GET /events/{id}` renvoie le détail de l'événement (part attendue, total collecté, contributions déjà enregistrées, membres actifs n'ayant pas encore contribué). Écran back-office (`Events.tsx`) avec bouton « Voir » ouvrant le détail : progression collecté/attendu, liste des contributeurs, et enregistrement en un clic par membre en attente (montant pré-rempli via `expected_share`).
- **Bug corrigé au passage** : `EventController::storeContribution` plantait (500, `meeting_id` non défini) quand la contribution était enregistrée sans `meeting_id`.
- **Statut** : fait

## 12. Suivi des cotisations par séance (qui a payé / qui manque)
- **État actuel** : `GET /contributions/report/{meetingId}` existait déjà côté API (détail par type de cotisation + caisses, avec statut payé/échec par membre) mais n'était consommé nulle part côté back-office — seul un résumé agrégé par réunion était visible. Écran back-office (`Contributions.tsx`) avec bouton « Voir » par réunion, ouvrant le détail par type de cotisation avec la liste des membres payés/en attente.
- **Bug corrigé au passage** : `MemberController::updateSubscriptions` plantait (500, `suspension_reason` non défini) quand l'abonnement était mis à jour sans motif de suspension.
- **Statut** : fait

---

## Contexte : architecture du back-office
Décision prise : le back-office sera un **projet séparé** consommant l'API existante (Sanctum), à l'image du frontend membres (`tontinefamilleunie`) — plutôt qu'un paquet Laravel type Filament embarqué dans `backend-familleunie`, qui aurait dupliqué/contourné les règles métier déjà écrites côté API (validations, contrôles de rôle, calculs de rapports).
