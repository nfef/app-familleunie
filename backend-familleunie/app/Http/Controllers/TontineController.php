<?php

namespace App\Http\Controllers;

use App\Models\TontinePayout;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TontineController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/payouts",
     *     summary="Liste des paiements de la tontine",
     *     tags={"Tontine"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Liste des payouts")
     * )
     */
    public function index(): JsonResponse
    {
        $payouts = TontinePayout::with([
            'beneficiary:id,full_name',
            'meeting:id,meeting_date',
            'contributionType:id,label',
        ])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json($payouts);
    }

    /**
     * @OA\Post(
     *     path="/api/payouts",
     *     summary="Planifier un paiement tontine (ADMIN/TRESORIER)",
     *     tags={"Tontine"},
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             required={"beneficiary_id","meeting_id","contribution_type_id","amount"},
     *             @OA\Property(property="beneficiary_id", type="integer"),
     *             @OA\Property(property="meeting_id", type="integer"),
     *             @OA\Property(property="contribution_type_id", type="integer"),
     *             @OA\Property(property="amount", type="integer")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Paiement planifié")
     * )
     */
    public function store(Request $request): JsonResponse
    {
        $this->requireRole($request, ['ADMIN', 'TRESORIER']);

        $data = $request->validate([
            'beneficiary_id'       => ['required', 'exists:users,id'],
            'meeting_id'           => ['required', 'exists:meetings,id'],
            'contribution_type_id' => ['required', 'exists:contribution_types,id'],
            'amount'               => ['required', 'integer', 'min:1'],
        ]);

        $payout = TontinePayout::create($data);
        $payout->load(['beneficiary:id,full_name', 'meeting:id,meeting_date', 'contributionType:id,label']);

        return response()->json($payout, 201);
    }

    /**
     * @OA\Patch(
     *     path="/api/payouts/{id}/mark-paid",
     *     summary="Marquer un paiement comme payé (ADMIN/TRESORIER)",
     *     tags={"Tontine"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Statut mis à jour")
     * )
     */
    public function markPaid(Request $request, int $id): JsonResponse
    {
        $this->requireRole($request, ['ADMIN', 'TRESORIER']);

        $data = $request->validate([
            'actual_payout_meeting_id' => ['required', 'exists:meetings,id']
        ]);

        $payout = TontinePayout::findOrFail($id);
        $payout->update([
            'status'                    => 'paid',
            'actual_payout_meeting_id' => $data['actual_payout_meeting_id']
        ]);

        return response()->json(['message' => 'Paiement marqué comme effectué.', 'payout' => $payout]);
    }

    private function requireRole(Request $request, array $roles): void
    {
        $userRoles = $request->user()->roles ?? [];
        if (!array_intersect($roles, $userRoles)) {
            abort(403, 'Accès non autorisé.');
        }
    }
}
