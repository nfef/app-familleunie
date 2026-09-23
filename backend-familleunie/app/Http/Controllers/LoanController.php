<?php

namespace App\Http\Controllers;

use App\Models\Loan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Loan::with(['user:id,full_name', 'parent:id,amount,due_date']);

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
            'user_id'       => ['required', 'exists:users,id'],
            'amount'        => ['required', 'integer', 'min:1'],
            'interest'      => ['nullable', 'integer', 'min:0'],
            'contracted_at' => ['nullable', 'date', 'before_or_equal:today'],
            'due_date'      => ['required', 'date'],
            'meeting_id'    => ['nullable', 'exists:meetings,id'],
        ]);

        $data['contracted_at'] ??= now()->toDateString();
        $data['status'] = 'pending';

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
            'repaid_amount'        => $loan->amount,
            'paid_at'              => now(),
            'repayment_meeting_id' => $data['payment_meeting_id'],
        ]);

        return response()->json($loan);
    }

    /**
     * Reconduire un prêt en attente (échéance non honorée).
     * - Rien saisi (capital_restant/nouvel_interet omis) : reconduction tacite, mêmes conditions.
     * - Remboursement partiel : capital_restant + nouvel_interet saisis pour le nouveau prêt.
     */
    public function renew(Request $request, int $id): JsonResponse
    {
        $this->requireRole($request, ['ADMIN', 'TRESORIER']);

        $loan = Loan::findOrFail($id);

        if ($loan->status !== 'pending') {
            abort(422, 'Seul un prêt en attente peut être reconduit.');
        }

        $data = $request->validate([
            'capital_restant'    => ['nullable', 'integer', 'min:0'],
            'nouvel_interet'     => ['nullable', 'integer', 'min:0'],
            'mois'               => ['nullable', 'integer', 'min:1'],
            'payment_meeting_id' => ['nullable', 'exists:meetings,id'],
        ]);

        $remainingCapital = $data['capital_restant'] ?? $loan->amount;

        if ($remainingCapital > $loan->amount) {
            abort(422, 'Le capital restant ne peut pas dépasser le montant du prêt initial.');
        }

        $newInterest = $data['nouvel_interet'] ?? $loan->interest;
        $months      = $data['mois'] ?? 2;
        $repaidNow   = $loan->amount - $remainingCapital;

        $loan->update([
            'status'               => 'renewed',
            'repaid_amount'        => $repaidNow,
            'paid_at'              => $repaidNow > 0 ? now() : $loan->paid_at,
            'repayment_meeting_id' => $data['payment_meeting_id'] ?? $loan->repayment_meeting_id,
        ]);

        $renewal = Loan::create([
            'user_id'        => $loan->user_id,
            'parent_loan_id' => $loan->id,
            'contracted_at'  => now()->toDateString(),
            'amount'         => $remainingCapital,
            'interest'       => $newInterest,
            'due_date'       => \Illuminate\Support\Carbon::parse($loan->due_date)->addMonths($months)->toDateString(),
            'status'         => 'pending',
            'meeting_id'     => $data['payment_meeting_id'] ?? null,
        ]);

        return response()->json([
            'message'       => 'Prêt reconduit avec succès.',
            'previous_loan' => $loan,
            'renewed_loan'  => $renewal->load('user:id,full_name'),
        ], 201);
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
