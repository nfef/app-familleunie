<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use App\Models\Cycle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeetingController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/meetings",
     *     summary="Liste des réunions",
     *     tags={"Réunions"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Liste des réunions")
     * )
     */
    public function index(): JsonResponse
    {
        $meetings = Meeting::with('cycle:id,label')
            ->orderBy('meeting_date', 'desc')
            ->limit(20)
            ->get();

        return response()->json($meetings);
    }

    /**
     * @OA\Post(
     *     path="/api/meetings",
     *     summary="Créer une réunion (ADMIN/TRESORIER)",
     *     tags={"Réunions"},
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             required={"cycle_id","meeting_date"},
     *             @OA\Property(property="cycle_id", type="integer"),
     *             @OA\Property(property="meeting_date", type="string", format="date")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Réunion créée")
     * )
     */
    public function store(Request $request): JsonResponse
    {
        $this->requireRole($request, ['ADMIN', 'TRESORIER']);

        $data = $request->validate([
            'cycle_id'     => ['required', 'exists:cycles,id'],
            'meeting_date' => ['required', 'date'],
            'notes'        => ['nullable', 'string'],
        ]);

        $meeting = Meeting::create($data);
        $meeting->load('cycle:id,label');

        return response()->json($meeting, 201);
    }

    /**
     * @OA\Get(
     *     path="/api/cycles",
     *     summary="Liste des cycles",
     *     tags={"Réunions"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Liste des cycles")
     * )
     */
    public function cycles(): JsonResponse
    {
        return response()->json(Cycle::orderBy('start_date', 'desc')->get());
    }

    /**
     * @OA\Post(
     *     path="/api/cycles",
     *     summary="Créer un cycle (ADMIN)",
     *     tags={"Réunions"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=201, description="Cycle créé")
     * )
     */
    public function storeCycle(Request $request): JsonResponse
    {
        $this->requireRole($request, ['ADMIN']);

        $data = $request->validate([
            'label'      => ['required', 'string'],
            'start_date' => ['required', 'date'],
            'end_date'   => ['nullable', 'date'],
        ]);

        return response()->json(Cycle::create($data), 201);
    }

    /**
     * @OA\Patch(
     *     path="/api/cycles/{id}",
     *     summary="Modifier un cycle (ADMIN)",
     *     tags={"Réunions"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Cycle modifié")
     * )
     */
    public function updateCycle(Request $request, int $id): JsonResponse
    {
        $this->requireRole($request, ['ADMIN']);

        $cycle = Cycle::findOrFail($id);
        $data = $request->validate([
            'label'      => ['sometimes', 'string'],
            'start_date' => ['sometimes', 'date'],
            'end_date'   => ['nullable', 'date'],
            'is_active'  => ['sometimes', 'boolean'],
        ]);

        $cycle->update($data);

        return response()->json($cycle);
    }

    /**
     * @OA\Delete(
     *     path="/api/meetings/{id}",
     *     summary="Supprimer une réunion (ADMIN/TRESORIER)",
     *     tags={"Réunions"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Réunion supprimée")
     * )
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->requireRole($request, ['ADMIN', 'TRESORIER']);
        
        $meeting = Meeting::findOrFail($id);
        $meeting->delete();

        return response()->json(['message' => 'Réunion supprimée avec succès.']);
    }

    private function requireRole(Request $request, array $roles): void
    {
        $userRoles = $request->user()->roles ?? [];
        if (!array_intersect($roles, $userRoles)) {
            abort(403, 'Accès non autorisé.');
        }
    }
}
