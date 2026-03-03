<?php

namespace App\Http\Controllers;

use App\Models\ContributionType;
use App\Models\FundType;
use App\Models\MemberContribution;
use App\Models\EventContribution;
use App\Models\TontinePayout;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
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

        return response()->json([
            'tontine_balance' => $tontineBalance,
            'events_balance'  => $eventsBalance,
            'members_count'   => $membersCount,
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

        $allowedRoles = ['MEMBRE', 'ADMIN', 'TRESORIER', 'COMMISSAIRE', 'SECRETAIRE', 'CENSEUR'];
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email'     => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'phone'     => ['nullable', 'string', 'max:20'],
            'roles'     => ['required', 'array'],
            'roles.*'   => ['in:' . implode(',', $allowedRoles)],
        ]);

        $user = User::create([
            'full_name'            => $data['full_name'],
            'email'                => $data['email'],
            'phone'                => $data['phone'] ?? null,
            'roles'                => $data['roles'],
            'password'             => \Illuminate\Support\Facades\Hash::make('password123'),
            'must_change_password' => true,
        ]);

        return response()->json([
            'message' => 'Membre créé avec succès. Le mot de passe par défaut est : password123',
            'user'    => $user
        ], 201);
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

        $allowed = ['MEMBRE', 'ADMIN', 'TRESORIER', 'COMMISSAIRE', 'SECRETAIRE', 'CENSEUR'];
        $data    = $request->validate([
            'roles'   => ['required', 'array'],
            'roles.*' => ['in:' . implode(',', $allowed)],
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
