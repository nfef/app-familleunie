<?php

namespace App\Http\Controllers;

use App\Models\Sanction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SanctionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Sanction::with(['user:id,full_name', 'meeting:id,meeting_date']);

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $this->requireRole($request, ['ADMIN', 'TRESORIER', 'CENSEUR', 'SECRETAIRE']);

        $data = $request->validate([
            'user_id'    => ['required', 'exists:users,id'],
            'meeting_id' => ['nullable', 'exists:meetings,id'],
            'label'      => ['required', 'string', 'max:255'],
            'amount'     => ['required', 'integer', 'min:0'],
        ]);

        $sanction = Sanction::create($data);
        $sanction->load(['user:id,full_name', 'meeting:id,meeting_date']);

        return response()->json($sanction, 201);
    }

    public function markAsPaid(Request $request, int $id): JsonResponse
    {
        $this->requireRole($request, ['ADMIN', 'TRESORIER']);

        $data = $request->validate([
            'payment_meeting_id' => ['required', 'exists:meetings,id']
        ]);

        $sanction = Sanction::findOrFail($id);
        $sanction->update([
            'status'             => 'paid',
            'paid_at'            => now(),
            'payment_meeting_id' => $data['payment_meeting_id'],
        ]);

        return response()->json($sanction);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->requireRole($request, ['ADMIN']);

        Sanction::findOrFail($id)->delete();

        return response()->json(['message' => 'Sanction supprimée.']);
    }

    private function requireRole(Request $request, array $roles): void
    {
        $userRoles = $request->user()->roles ?? [];
        if (!array_intersect($roles, $userRoles)) {
            abort(403, 'Accès non autorisé.');
        }
    }
}
