<?php

namespace App\Http\Controllers;

use App\Models\AssociationConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssociationConfigController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/admin/configs",
     *     summary="Liste des configurations de l'association",
     *     tags={"Admin"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Liste des configs")
     * )
     */
    public function index(Request $request): JsonResponse
    {
        $this->requireRole($request, ['ADMIN', 'TRESORIER']);
        return response()->json(AssociationConfig::orderBy('group')->orderBy('key')->get());
    }

    /**
     * @OA\Post(
     *     path="/api/admin/configs",
     *     summary="Mettre à jour ou créer une configuration",
     *     tags={"Admin"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Config mise à jour")
     * )
     */
    public function store(Request $request): JsonResponse
    {
        $this->requireRole($request, ['ADMIN']);

        $data = $request->validate([
            'key'   => ['required', 'string'],
            'value' => ['nullable'],
            'type'  => ['required', 'in:string,int,boolean,json'],
            'group' => ['required', 'string'],
            'label' => ['nullable', 'string'],
        ]);

        $config = AssociationConfig::set($data['key'], $data['value'], $data['type'], $data['group'], $data['label']);

        return response()->json($config);
    }

    private function requireRole(Request $request, array $roles): void
    {
        $userRoles = $request->user()->roles ?? [];
        if (!array_intersect($roles, $userRoles)) {
            abort(403, 'Accès non autorisé.');
        }
    }
}
