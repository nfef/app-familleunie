<?php

namespace App\Http\Controllers;

use App\Models\MemberContribution;
use App\Models\FundEntry;
use App\Models\Meeting;
use App\Models\ContributionType;
use App\Models\ContributionSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContributionController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/contributions/me",
     *     summary="Contributions de l'utilisateur connecté (Paginé + Filtres)",
     *     tags={"Cotisations"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="filter", in="query", required=false, @OA\Schema(type="string", enum={"default", "3months", "6months", "all"})),
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Historique des cotisations paginé")
     * )
     */
    public function myContributions(Request $request): JsonResponse
    {
        $query = MemberContribution::with([
            'contributionType:id,label',
            'meeting:id,meeting_date',
        ])
            ->where('user_id', $request->user()->id)
            ->orderBy('paid_at', 'desc');

        if ($request->has('filter')) {
            $filter = $request->filter;
            if ($filter === '3months') {
                $query->where('paid_at', '>=', now()->subMonths(3));
            } elseif ($filter === '6months') {
                $query->where('paid_at', '>=', now()->subMonths(6));
            } elseif ($filter === 'default') {
                $latestMeetingIds = \App\Models\Meeting::orderBy('meeting_date', 'desc')
                    ->limit(4)
                    ->pluck('id');
                $query->whereIn('meeting_id', $latestMeetingIds);
            }
        }

        return response()->json($query->paginate($request->input('per_page', 15)));
    }

    /**
     * @OA\Get(
     *     path="/api/funds/me",
     *     summary="Participations aux fonds de l'utilisateur connecté",
     *     tags={"Cotisations"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Historique des fonds")
     * )
     */
    public function myFunds(Request $request): JsonResponse
    {
        $query = FundEntry::with(['fundType:id,label', 'meeting:id,meeting_date'])
            ->where('member_id', $request->user()->id)
            ->orderBy('created_at', 'desc');

        if ($request->has('filter')) {
            $filter = $request->filter;
            if ($filter === '3months') {
                $query->where('created_at', '>=', now()->subMonths(3));
            } elseif ($filter === '6months') {
                $query->where('created_at', '>=', now()->subMonths(6));
            }
        }

        return response()->json($query->paginate($request->input('per_page', 15)));
    }

    /**
     * @OA\Get(
     *     path="/api/contributions/summary",
     *     summary="Résumé des cotisations par réunion",
     *     tags={"Cotisations"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Résumé par réunion")
     * )
     */
    public function summary(): JsonResponse
    {
        $summary = MemberContribution::selectRaw('
            meeting_id,
            SUM(total_amount) as total_amount,
            COUNT(DISTINCT user_id) as members_count
        ')
            ->with('meeting:id,meeting_date')
            ->groupBy('meeting_id')
            ->orderByDesc('meeting_id')
            ->limit(10)
            ->get();

        return response()->json($summary);
    }

    /**
     * @OA\Post(
     *     path="/api/contributions",
     *     summary="Enregistrer une cotisation (ADMIN/TRESORIER)",
     *     tags={"Cotisations"},
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             required={"user_id","contribution_type_id","meeting_id","parts"},
     *             @OA\Property(property="user_id", type="integer"),
     *             @OA\Property(property="contribution_type_id", type="integer"),
     *             @OA\Property(property="meeting_id", type="integer"),
     *             @OA\Property(property="parts", type="integer", example=1)
     *         )
     *     ),
     *     @OA\Response(response=201, description="Cotisation enregistrée")
     * )
     */
    public function store(Request $request): JsonResponse
    {
        $this->requireRole($request, ['ADMIN', 'TRESORIER']);

        $data = $request->validate([
            'user_id'               => ['required', 'exists:users,id'],
            'contribution_type_id'  => ['required', 'exists:contribution_types,id'],
            'meeting_id'            => ['required', 'exists:meetings,id'],
            'collection_meeting_id' => ['nullable', 'exists:meetings,id'],
            'parts'                 => ['required', 'numeric', 'min:0'],
        ]);

        // Check for duplicates (same member, same type, same meeting)
        $exists = MemberContribution::where('user_id', $data['user_id'])
            ->where('contribution_type_id', $data['contribution_type_id'])
            ->where('meeting_id', $data['meeting_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Une cotisation pour ce membre, ce type et cette séance existe déjà.'
            ], 422);
        }

        $type = \App\Models\ContributionType::findOrFail($data['contribution_type_id']);
        $unitAmount  = $type->amount;
        $totalAmount = $unitAmount * $data['parts'];

        $contribution = MemberContribution::create([
            ...$data,
            'collection_meeting_id' => $data['collection_meeting_id'] ?? $data['meeting_id'],
            'unit_amount'  => $unitAmount,
            'total_amount' => $totalAmount,
        ]);

        return response()->json($contribution->load(['contributionType', 'meeting']), 201);
    }

    /**
     * @OA\Patch(
     *     path="/api/contributions/{id}",
     *     summary="Modifier une cotisation déjà enregistrée (ADMIN/TRESORIER)",
     *     tags={"Cotisations"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             @OA\Property(property="contribution_type_id", type="integer"),
     *             @OA\Property(property="meeting_id", type="integer"),
     *             @OA\Property(property="parts", type="integer")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Cotisation mise à jour")
     * )
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $this->requireRole($request, ['ADMIN', 'TRESORIER']);

        $contribution = MemberContribution::findOrFail($id);

        $data = $request->validate([
            'contribution_type_id' => ['sometimes', 'exists:contribution_types,id'],
            'meeting_id'           => ['sometimes', 'exists:meetings,id'],
            'parts'                => ['sometimes', 'numeric', 'min:0'],
        ]);

        $typeId = $data['contribution_type_id'] ?? $contribution->contribution_type_id;
        $parts  = $data['parts'] ?? $contribution->parts;
        $unitAmount = \App\Models\ContributionType::findOrFail($typeId)->amount;

        $contribution->update([
            ...$data,
            'unit_amount'  => $unitAmount,
            'total_amount' => $unitAmount * $parts,
        ]);

        return response()->json($contribution->load(['contributionType', 'meeting']));
    }

    /**
     * @OA\Post(
     *     path="/api/fund-entries",
     *     summary="Enregistrer un dépôt dans une caisse (ADMIN/TRESORIER/COMMISSAIRE)",
     *     tags={"Cotisations"},
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             required={"fund_type_id","amount"},
     *             @OA\Property(property="fund_type_id", type="integer"),
     *             @OA\Property(property="amount", type="integer"),
     *             @OA\Property(property="meeting_id", type="integer"),
     *             @OA\Property(property="direction", type="string", enum={"in","out"}),
     *             @OA\Property(property="note", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Dépôt enregistré")
     * )
     */
    public function storeFundEntry(Request $request): JsonResponse
    {
        $this->requireRole($request, ['ADMIN', 'TRESORIER', 'COMMISSAIRE']);

        $data = $request->validate([
            'fund_type_id' => ['required', 'exists:fund_types,id'],
            'member_id'    => ['nullable', 'exists:users,id'],
            'amount'       => ['required', 'integer', 'min:1'],
            'meeting_id'   => ['nullable', 'exists:meetings,id'],
            'direction'    => ['in:in,out'],
            'note'         => ['nullable', 'string'],
        ]);

        $entry = FundEntry::create([
            ...$data,
            'user_id'   => $request->user()->id, // The person recording the entry
            'direction' => $data['direction'] ?? 'in',
        ]);

        return response()->json($entry->load(['fundType', 'meeting', 'member', 'user']), 201);
    }

    /**
     * @OA\Patch(
     *     path="/api/fund-entries/{id}",
     *     summary="Modifier un mouvement de caisse déjà enregistré (ADMIN/TRESORIER/COMMISSAIRE)",
     *     tags={"Cotisations"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             @OA\Property(property="fund_type_id", type="integer"),
     *             @OA\Property(property="member_id", type="integer"),
     *             @OA\Property(property="amount", type="integer"),
     *             @OA\Property(property="direction", type="string", enum={"in","out"}),
     *             @OA\Property(property="note", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Mouvement mis à jour")
     * )
     */
    public function updateFundEntry(Request $request, int $id): JsonResponse
    {
        $this->requireRole($request, ['ADMIN', 'TRESORIER', 'COMMISSAIRE']);

        $entry = FundEntry::findOrFail($id);

        $data = $request->validate([
            'fund_type_id' => ['sometimes', 'exists:fund_types,id'],
            'member_id'    => ['sometimes', 'nullable', 'exists:users,id'],
            'amount'       => ['sometimes', 'integer', 'min:1'],
            'direction'    => ['sometimes', 'in:in,out'],
            'note'         => ['sometimes', 'nullable', 'string'],
        ]);

        $entry->update($data);

        return response()->json($entry->load(['fundType', 'meeting', 'member', 'user']));
    }

    /**
     * @OA\Get(
     *     path="/api/admin/fund-entries",
     *     summary="Liste de tous les mouvements de caisse (ADMIN/TRESORIER/COMMISSAIRE)",
     *     tags={"Admin"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="fund_type_id", in="query", required=false, @OA\Schema(type="integer")),
     *     @OA\Parameter(name="direction", in="query", required=false, @OA\Schema(type="string", enum={"in","out"})),
     *     @OA\Parameter(name="from", in="query", required=false, @OA\Schema(type="string", format="date")),
     *     @OA\Parameter(name="to", in="query", required=false, @OA\Schema(type="string", format="date")),
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Mouvements de caisse paginés")
     * )
     */
    public function adminFundEntries(Request $request): JsonResponse
    {
        $this->requireRole($request, ['ADMIN', 'TRESORIER', 'COMMISSAIRE']);

        $query = FundEntry::query()->with(['fundType', 'meeting', 'member', 'user']);

        if ($request->filled('fund_type_id')) {
            $query->where('fund_type_id', $request->input('fund_type_id'));
        }
        if ($request->filled('direction')) {
            $query->where('direction', $request->input('direction'));
        }
        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->input('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->input('to'));
        }

        return response()->json($query->orderByDesc('created_at')->paginate(20));
    }

    /**
     * @OA\Get(
     *     path="/api/contributions/report/{meetingId}",
     *     summary="Rapport des cotisations manquantes par réunion (ADMIN/TRESORIER)",
     *     tags={"Cotisations"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(
     *         name="meetingId",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Rapport des cotisations manquantes")
     * )
     */
    public function meetingReport(int $meetingId): JsonResponse
    {
        $meeting = Meeting::findOrFail($meetingId);

        // Types de cotisations
        $types = ContributionType::where('is_active', true)->get();

        $report = [];
        foreach ($types as $type) {
            $subscribers = ContributionSubscription::where('contribution_type_id', $type->id)
                ->where('is_active', true)
                ->with('user')
                ->get();

            $payments = MemberContribution::where('meeting_id', $meetingId)
                ->where('contribution_type_id', $type->id)
                ->get()
                ->keyBy('user_id');

            $list = $subscribers->map(function($sub) use ($payments, $type) {
                $hasPaid = $payments->has($sub->user_id);
                return [
                    'user_id'   => $sub->user_id,
                    'full_name' => $sub->user->full_name,
                    'parts'     => $sub->parts,
                    'amount'    => $sub->parts * $type->amount,
                    'status'    => $hasPaid ? 'paid' : 'failure',
                    'paid_at'   => $hasPaid ? $payments[$sub->user_id]->paid_at : null,
                ];
            });

            $report[] = [
                'type'    => 'contribution',
                'label'   => $type->label,
                'details' => $list,
                'stats'   => [
                    'paid'    => $list->where('status', 'paid')->count(),
                    'failure' => $list->where('status', 'failure')->count(),
                    'total'   => $list->count(),
                ]
            ];
        }

        // Fonds (Ration, Huile, Savon...)
        $fundTypes = \App\Models\FundType::all();
        foreach ($fundTypes as $ft) {
            $entries = \App\Models\FundEntry::where('meeting_id', $meetingId)
                ->where('fund_type_id', $ft->id)
                ->with('user')
                ->get();

            if ($entries->count() > 0) {
                $report[] = [
                    'type'    => 'fund',
                    'label'   => $ft->label,
                    'details' => $entries->map(fn($e) => [
                        'user_id'   => $e->user_id,
                        'full_name' => $e->user->full_name ?? 'Inconnu',
                        'amount'    => $e->amount,
                        'status'    => 'paid',
                    ]),
                    'stats'   => [
                        'paid'  => $entries->count(),
                        'total' => $entries->sum('amount'),
                    ]
                ];
            }
        }

        return response()->json([
            'meeting' => $meeting,
            'report'  => $report,
        ]);
    }

    private function requireRole(Request $request, array $roles): void
    {
        $userRoles = $request->user()->roles ?? [];
        if (!array_intersect($roles, $userRoles)) {
            abort(403, 'Accès non autorisé.');
        }
    }
}
