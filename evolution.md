# Évolutions backend à prévoir

Liste des manques identifiés dans l'API (`backend-familleunie`) qui bloqueront certaines actions du futur back-office. Aucun de ces points n'empêche de démarrer le back-office (consultation + actions déjà supportées suffisent pour un premier périmètre), mais ils devront être traités dès que le back-office aura besoin d'éditer/supprimer/récupérer un compte.

## 1. Modifier une cotisation / un mouvement de caisse déjà enregistré
- **État actuel** : aucune route `PATCH`/`PUT` sur `MemberContribution` ni `FundEntry` — seulement `POST` (création)
- **À faire** : nouvelle méthode contrôleur + route `PATCH /contributions/{id}` et `PATCH /fund-entries/{id}`
- **Statut** : non démarré

## 2. Supprimer un membre, un cycle, une sanction, un prêt
- **État actuel** : aucune méthode `destroy()` sur ces contrôleurs (seul `MeetingController::destroy` existe)
- **À faire** : ajouter les routes/méthodes `DELETE` correspondantes — bénéficiera automatiquement du soft delete déjà en place (`HasAuditTrail`)
- **Statut** : non démarré

## 3. Modifier un type de cotisation / caisse existant
- **État actuel** : `AdminController` n'a que `store`/`delete`, pas d'`update`
- **À faire** : ajouter `PATCH /admin/contribution-types/{id}` et `PATCH /admin/fund-types/{id}`
- **Statut** : non démarré

## 4. Mot de passe oublié
- **État actuel** : aucun endpoint — `changePassword` exige déjà d'être connecté
- **À faire** : nouveau flux (demande de réinitialisation par email + confirmation) — nécessite aussi une vraie configuration `MAIL_*` en production (actuellement vide)
- **Statut** : non démarré

## 5. Dashboard admin plus riche
- **État actuel** : `AdminController::dashboard` ne renvoie que 3 chiffres globaux (solde tontine, solde événements, nombre de membres)
- **À faire** : nouvelles requêtes d'agrégation par cycle / par membre / évolution dans le temps
- **Statut** : non démarré

## 6. Liste globale des mouvements de caisse
- **État actuel** : `GET /funds/me` ne renvoie que les mouvements du membre connecté — aucun endpoint n'existe pour lister TOUS les mouvements de caisse (tous membres confondus), utile pour un vrai suivi de caisse côté back-office
- **À faire** : `GET /admin/fund-entries` (ADMIN/TRESORIER), avec filtres par type de caisse / période
- **Statut** : non démarré — découvert en construisant la page "Caisses" du back-office (`backoffice-familleunie/src/pages/Funds.tsx`), actuellement limitée à afficher les types de caisse + enregistrer un mouvement, sans historique

---

## Contexte : architecture du back-office
Décision prise : le back-office sera un **projet séparé** consommant l'API existante (Sanctum), à l'image du frontend membres (`tontinefamilleunie`) — plutôt qu'un paquet Laravel type Filament embarqué dans `backend-familleunie`, qui aurait dupliqué/contourné les règles métier déjà écrites côté API (validations, contrôles de rôle, calculs de rapports).
