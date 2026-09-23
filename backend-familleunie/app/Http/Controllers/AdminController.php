<?php

namespace App\Http\Controllers;

use App\Models\ContributionType;
use App\Models\FundType;
use App\Models\EventType;
use App\Models\MemberContribution;
use App\Models\EventContribution;
use App\Models\TontinePayout;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    private const ALLOWED_ROLES = [
        'MEMBRE', 'ADMIN', 'TRESORIER', 'COMMISSAIRE', 'SECRETAIRE', 'CENSEUR',
        'PRESIDENT', 'VICE_PRESIDENT', 'SECRETAIRE_ADJOINT', 'FONDATEUR',
    ];

    /**
     * @OA\Get(
     *     path="/api/admin/dashboard",
     *     summary="Statistiques globales du dashboard (ADMIN/TRESORIER)",
     *     tags={"Admin"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Stats globales")
     * )
     */
    public function dashboard(Request $request): JsonResponse
    {
        $this->requireRole($request, ['ADMIN', 'TRESORIER', 'COMMISSAIRE']);

        $tontineBalance = MemberContribution::sum('total_amount') - TontinePayout::where('status', 'paid')->sum('amount');
        $eventsBalance  = EventContribution::sum('amount');
        $membersCount   = User::count();
        $activeMembersCount = User::active()->count();

        // Répartition des cotisations par cycle
        $byCycle = \App\Models\Cycle::orderByDesc('start_date')->get(['id', 'label', 'is_active'])
            ->map(function ($cycle) {
                $total = MemberContribution::whereHas('meeting', fn ($q) => $q->where('cycle_id', $cycle->id))
                    ->sum('total_amount');
                return [
                    'cycle_id'             => $cycle->id,
                    'label'                => $cycle->label,
                    'is_active'            => $cycle->is_active,
                    'total_contributions'  => (int) $total,
                ];
            });

        // Évolution des cotisations sur les 6 derniers mois (indépendant du moteur de BDD)
        $monthlyTrend = collect(range(0, 5))->map(function ($i) {
            $month = now()->subMonths(5 - $i);
            $total = MemberContribution::whereBetween('paid_at', [
                $month->copy()->startOfMonth(),
                $month->copy()->endOfMonth(),
            ])->sum('total_amount');

            return [
                'month'                => $month->format('Y-m'),
                'total_contributions'  => (int) $total,
            ];
        });

        return response()->json([
            'tontine_balance' => $tontineBalance,
            'events_balance'  => $eventsBalance,
            'members_count'   => $membersCount,
            'active_members_count' => $activeMembersCount,
            'by_cycle'        => $byCycle,
            'monthly_trend'   => $monthlyTrend,
        ]);
    }

    // ─── ContributionTypes ──────────────────────────────────────────────────

    /**
     * @OA\Get(
     *     path="/api/admin/contribution-types",
     *     summary="Liste des types de cotisations (ADMIN)",
     *     tags={"Admin"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Liste des types")
     * )
     */
    public function contributionTypes(): JsonResponse
    {
        return response()->json(ContributionType::orderBy('label')->get());
    }

    /**
     * @OA\Post(
     *     path="/api/admin/contribution-types",
     *     summary="Créer un type de cotisation (ADMIN)",
     *     tags={"Admin"},
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             required={"label","amount"},
     *             @OA\Property(property="label", type="string"),
     *             @OA\Property(property="amount", type="integer"),
     *             @OA\Property(property="frequency", type="string", enum={"weekly","monthly"})
     *         )
     *     ),
     *     @OA\Response(response=201, description="Type créé")
     * )
     */
    public function storeContributionType(Request $request): JsonResponse
    {
        $this->requireRole($request, ['ADMIN']);

        $data = $request->validate([
            'label'        => ['required', 'string', 'max:255', 'unique:contribution_types,label'],
            'amount'       => ['required', 'integer', 'min:1'],
            'frequency'    => ['in:weekly,monthly'],
            'has_parts'    => ['boolean'],
            'is_mandatory' => ['boolean'],
        ]);

        return response()->json(ContributionType::create($data), 201);
    }

    /**
     * @OA\Delete(
     *     path="/api/admin/contribution-types/{id}",
     *     summary="Supprimer un type de cotisation (ADMIN)",
     *     tags={"Admin"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Type supprimé")
     * )
     */
    public function deleteContributionType(Request $request, int $id): JsonResponse
    {
        $this->requireRole($request, ['ADMIN']);

        $type = ContributionType::findOrFail($id);
        $type->delete();

        return response()->json(['message' => 'Type de cotisation supprimé avec succès.']);
    }

    /**
     * @OA\Patch(
     *     path="/api/admin/contribution-types/{id}",
     *     summary="Modifier un type de cotisation (ADMIN)",
     *     tags={"Admin"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Type modifié")
     * )
     */
    public function updateContributionType(Request $request, int $id): JsonResponse
    {
        $this->requireRole($request, ['ADMIN']);

        $type = ContributionType::findOrFail($id);

        $data = $request->validate([
            'label'        => ['sometimes', 'string', 'max:255', 'unique:contribution_types,label,' . $type->id],
            'amount'       => ['sometimes', 'integer', 'min:1'],
            'frequency'    => ['sometimes', 'in:weekly,monthly'],
            'has_parts'    => ['sometimes', 'boolean'],
            'is_mandatory' => ['sometimes', 'boolean'],
            'is_active'    => ['sometimes', 'boolean'],
        ]);

        $type->update($data);

        return response()->json($type);
    }

    // ─── FundTypes ──────────────────────────────────────────────────────────

    /**
     * @OA\Get(
     *     path="/api/admin/fund-types",
     *     summary="Liste des types de caisses (ADMIN)",
     *     tags={"Admin"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Liste des caisses")
     * )
     */
    public function fundTypes(): JsonResponse
    {
        $types = FundType::orderBy('label')->get()->map(function($type) {
            $in = \App\Models\FundEntry::where('fund_type_id', $type->id)->where('direction', 'in')->sum('amount');
            $out = \App\Models\FundEntry::where('fund_type_id', $type->id)->where('direction', 'out')->sum('amount');
            $type->current_balance = (int)($in - $out);
            return $type;
        });
        return response()->json($types);
    }

    /**
     * @OA\Post(
     *     path="/api/admin/fund-types",
     *     summary="Créer une caisse (ADMIN)",
     *     tags={"Admin"},
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             required={"label"},
     *             @OA\Property(property="label", type="string"),
     *             @OA\Property(property="target_amount", type="integer")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Caisse créée")
     * )
     */
    public function storeFundType(Request $request): JsonResponse
    {
        $this->requireRole($request, ['ADMIN']);

        $data = $request->validate([
            'label'         => ['required', 'string', 'max:255', 'unique:fund_types,label'],
            'target_amount' => ['nullable', 'integer', 'min:1'],
        ]);

        return response()->json(FundType::create($data), 201);
    }

    /**
     * @OA\Delete(
     *     path="/api/admin/fund-types/{id}",
     *     summary="Supprimer une caisse (ADMIN)",
     *     tags={"Admin"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Caisse supprimée")
     * )
     */
    public function deleteFundType(Request $request, int $id): JsonResponse
    {
        $this->requireRole($request, ['ADMIN']);

        $type = FundType::findOrFail($id);
        $type->delete();

        return response()->json(['message' => 'Caisse supprimée avec succès.']);
    }

    /**
     * @OA\Patch(
     *     path="/api/admin/fund-types/{id}",
     *     summary="Modifier une caisse (ADMIN)",
     *     tags={"Admin"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Caisse modifiée")
     * )
     */
    public function updateFundType(Request $request, int $id): JsonResponse
    {
        $this->requireRole($request, ['ADMIN']);

        $type = FundType::findOrFail($id);

        $data = $request->validate([
            'label'         => ['sometimes', 'string', 'max:255', 'unique:fund_types,label,' . $type->id],
            'target_amount' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'is_active'     => ['sometimes', 'boolean'],
        ]);

        $type->update($data);

        return response()->json($type);
    }

    // ─── EventTypes ─────────────────────────────────────────────────────────

    /**
     * @OA\Post(
     *     path="/api/admin/event-types",
     *     summary="Créer un type d'événement (ADMIN)",
     *     tags={"Admin"},
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             required={"label"},
     *             @OA\Property(property="label", type="string"),
     *             @OA\Property(property="default_amount", type="integer")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Type créé")
     * )
     */
    public function storeEventType(Request $request): JsonResponse
    {
        $this->requireRole($request, ['ADMIN']);

        $data = $request->validate([
            'label'          => ['required', 'string', 'max:255', 'unique:event_types,label'],
            'category'       => ['nullable', 'in:heureux,malheureux'],
            'amount_mode'    => ['nullable', 'in:per_member,envelope'],
            'default_amount' => ['nullable', 'integer', 'min:0'],
        ]);

        return response()->json(EventType::create($data), 201);
    }

    /**
     * @OA\Patch(
     *     path="/api/admin/event-types/{id}",
     *     summary="Modifier un type d'événement (ADMIN)",
     *     tags={"Admin"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Type modifié")
     * )
     */
    public function updateEventType(Request $request, int $id): JsonResponse
    {
        $this->requireRole($request, ['ADMIN']);

        $type = EventType::findOrFail($id);

        $data = $request->validate([
            'label'          => ['sometimes', 'string', 'max:255', 'unique:event_types,label,' . $type->id],
            'category'       => ['sometimes', 'nullable', 'in:heureux,malheureux'],
            'amount_mode'    => ['sometimes', 'in:per_member,envelope'],
            'default_amount' => ['sometimes', 'nullable', 'integer', 'min:0'],
        ]);

        $type->update($data);

        return response()->json($type);
    }

    /**
     * @OA\Delete(
     *     path="/api/admin/event-types/{id}",
     *     summary="Supprimer un type d'événement (ADMIN)",
     *     tags={"Admin"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Type supprimé")
     * )
     */
    public function deleteEventType(Request $request, int $id): JsonResponse
    {
        $this->requireRole($request, ['ADMIN']);

        EventType::findOrFail($id)->delete();

        return response()->json(['message' => 'Type d\'événement supprimé avec succès.']);
    }

    // ─── Role management ────────────────────────────────────────────────────

    /**
     * @OA\Post(
     *     path="/api/admin/members",
     *     summary="Créer un nouveau membre (ADMIN)",
     *     tags={"Admin"},
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             required={"full_name","email","roles"},
     *             @OA\Property(property="full_name", type="string"),
     *             @OA\Property(property="email", type="string"),
     *             @OA\Property(property="username", type="string"),
     *             @OA\Property(property="phone", type="string"),
     *             @OA\Property(property="roles", type="array", @OA\Items(type="string"))
     *         )
     *     ),
     *     @OA\Response(response=201, description="Membre créé")
     * )
     */
    public function storeMember(Request $request): JsonResponse
    {
        $this->requireRole($request, ['ADMIN']);

        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email'     => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'username'  => ['nullable', 'string', 'max:255', 'unique:users,username'],
            'phone'     => ['nullable', 'string', 'max:20'],
            'roles'     => ['required', 'array'],
            'roles.*'   => ['in:' . implode(',', self::ALLOWED_ROLES)],
        ]);

        $temporaryPassword = \Illuminate\Support\Str::password(12);

        $user = User::create([
            'full_name'            => $data['full_name'],
            'email'                => $data['email'],
            'username'             => $data['username'] ?? null,
            'phone'                => $data['phone'] ?? null,
            'roles'                => $data['roles'],
            'password'             => \Illuminate\Support\Facades\Hash::make($temporaryPassword),
            'must_change_password' => true,
        ]);

        return response()->json([
            'message'             => 'Membre créé avec succès.',
            'temporary_password'  => $temporaryPassword,
            'user'                => $user,
        ], 201);
    }

    /**
     * @OA\Patch(
     *     path="/api/admin/members/{id}/reset-password",
     *     summary="Réinitialiser le mot de passe d'un membre (ADMIN)",
     *     tags={"Admin"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Mot de passe réinitialisé")
     * )
     */
    public function resetMemberPassword(Request $request, int $id): JsonResponse
    {
        $this->requireRole($request, ['ADMIN']);

        $member = User::findOrFail($id);

        $temporaryPassword = \Illuminate\Support\Str::password(12);

        $member->update([
            'password'             => \Illuminate\Support\Facades\Hash::make($temporaryPassword),
            'must_change_password' => true,
        ]);

        // Déconnecte toutes les sessions actives de ce membre (l'ancien mot de passe n'est plus valable).
        $member->tokens()->delete();

        return response()->json([
            'message'             => 'Mot de passe réinitialisé avec succès.',
            'temporary_password'  => $temporaryPassword,
            'user'                => $member,
        ]);
    }

    /**
     * @OA\Delete(
     *     path="/api/admin/members/{id}",
     *     summary="Supprimer un membre (ADMIN)",
     *     tags={"Admin"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Membre supprimé")
     * )
     */
    public function destroyMember(Request $request, int $id): JsonResponse
    {
        $this->requireRole($request, ['ADMIN']);

        if ($request->user()->id === $id) {
            abort(422, 'Vous ne pouvez pas supprimer votre propre compte.');
        }

        $member = User::findOrFail($id);
        $member->tokens()->delete();
        $member->delete();

        return response()->json(['message' => 'Membre supprimé.']);
    }

    /**
     * @OA\Patch(
     *     path="/api/admin/members/{id}/status",
     *     summary="Changer le statut d'un membre (actif/pause/exclu/démissionnaire) (ADMIN)",
     *     tags={"Admin"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             required={"member_status"},
     *             @OA\Property(property="member_status", type="string", enum={"active","pause","exclu","demissionnaire"}),
     *             @OA\Property(property="status_note", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Statut mis à jour")
     * )
     */
    public function updateMemberStatus(Request $request, int $id): JsonResponse
    {
        $this->requireRole($request, ['ADMIN']);

        $member = User::findOrFail($id);

        $data = $request->validate([
            'member_status' => ['required', 'in:' . implode(',', User::MEMBER_STATUSES)],
            'status_note'   => ['nullable', 'string'],
        ]);

        $member->update($data);

        return response()->json(['message' => 'Statut mis à jour.', 'user' => $member]);
    }

    /**
     * @OA\Patch(
     *     path="/api/admin/members/{id}",
     *     summary="Modifier les informations d'un membre (ADMIN)",
     *     tags={"Admin"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             @OA\Property(property="full_name", type="string"),
     *             @OA\Property(property="email", type="string"),
     *             @OA\Property(property="username", type="string"),
     *             @OA\Property(property="phone", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Membre mis à jour")
     * )
     */
    public function updateMember(Request $request, int $id): JsonResponse
    {
        $this->requireRole($request, ['ADMIN']);

        $member = User::findOrFail($id);

        $data = $request->validate([
            'full_name' => ['sometimes', 'string', 'max:255'],
            'email'     => ['sometimes', 'string', 'email', 'max:255', 'unique:users,email,' . $member->id],
            'username'  => ['sometimes', 'nullable', 'string', 'max:255', 'unique:users,username,' . $member->id],
            'phone'     => ['sometimes', 'nullable', 'string', 'max:20'],
        ]);

        $member->update($data);

        return response()->json(['message' => 'Membre mis à jour.', 'user' => $member]);
    }

    /**
     * @OA\Patch(
     *     path="/api/admin/members/{id}/roles",
     *     summary="Modifier les rôles d'un membre (ADMIN)",
     *     tags={"Admin"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             required={"roles"},
     *             @OA\Property(property="roles", type="array", @OA\Items(type="string"))
     *         )
     *     ),
     *     @OA\Response(response=200, description="Rôles mis à jour")
     * )
     */
    public function updateMemberRoles(Request $request, int $id): JsonResponse
    {
        $this->requireRole($request, ['ADMIN']);

        $data = $request->validate([
            'roles'   => ['required', 'array'],
            'roles.*' => ['in:' . implode(',', self::ALLOWED_ROLES)],
        ]);

        $member = User::findOrFail($id);
        $member->update(['roles' => $data['roles']]);

        return response()->json(['message' => 'Rôles mis à jour.', 'user' => $member]);
    }

    private function requireRole(Request $request, array $roles): void
    {
        $userRoles = $request->user()->roles ?? [];
        if (!array_intersect($roles, $userRoles)) {
            abort(403, 'Accès non autorisé.');
        }
    }
}
