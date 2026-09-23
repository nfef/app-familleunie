<?php

namespace App\Http\Controllers;

use App\Models\Loan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Loan::with('user:id,full_name');

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('due_date', 'asc')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $this->requireRole($request, ['ADMIN', 'TRESORIER']);

        $data = $request->validate([
            'user_id'    => ['required', 'exists:users,id'],
            'amount'     => ['required', 'integer', 'min:1'],
            'interest'   => ['nullable', 'integer', 'min:0'],
            'due_date'   => ['required', 'date', 'after_or_equal:today'],
            'meeting_id' => ['nullable', 'exists:meetings,id'],
        ]);

        $loan = Loan::create($data);
        $loan->load('user:id,full_name');

        return response()->json($loan, 201);
    }

    public function markAsPaid(Request $request, int $id): JsonResponse
    {
        $this->requireRole($request, ['ADMIN', 'TRESORIER']);

        $data = $request->validate([
            'payment_meeting_id' => ['required', 'exists:meetings,id']
        ]);

        $loan = Loan::findOrFail($id);
        $loan->update([
            'status'               => 'paid',
            'paid_at'              => now(),
            'repayment_meeting_id' => $data['payment_meeting_id'],
        ]);

        return response()->json($loan);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->requireRole($request, ['ADMIN']);

        Loan::findOrFail($id)->delete();

        return response()->json(['message' => 'Prêt supprimé.']);
    }

    private function requireRole(Request $request, array $roles): void
    {
        $userRoles = $request->user()->roles ?? [];
        if (!array_intersect($roles, $userRoles)) {
            abort(403, 'Accès non autorisé.');
        }
    }
}
