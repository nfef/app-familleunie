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

---

## Contexte : architecture du back-office
Décision prise : le back-office sera un **projet séparé** consommant l'API existante (Sanctum), à l'image du frontend membres (`tontinefamilleunie`) — plutôt qu'un paquet Laravel type Filament embarqué dans `backend-familleunie`, qui aurait dupliqué/contourné les règles métier déjà écrites côté API (validations, contrôles de rôle, calculs de rapports).
