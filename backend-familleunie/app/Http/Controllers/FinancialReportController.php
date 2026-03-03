<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use App\Models\ContributionType;
use App\Models\FundType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinancialReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $meetings = Meeting::orderBy('meeting_date', 'desc')
            ->limit(10)
            ->get(['id', 'meeting_date']);

        return response()->json($meetings);
    }

    public function show(int $meetingId): JsonResponse
    {
        $meeting = Meeting::findOrFail($meetingId);

        // Fetch everything that happened DURING this specific meeting session
        // (Not just what was scheduled for this date)

        $report = [];
        $globalTotalIn = 0;
        $globalTotalOut = 0;

        // 1. Matrice des Cotisations Régulières (Le grand livre)
        $contributionTypes = ContributionType::where('is_active', true)->get();
        $allMembers = \App\Models\User::orderBy('full_name')->get(['id', 'full_name']);
        
        $matrix = [];
        $totalCollected = 0;
        $totalFailure = 0;

        foreach ($allMembers as $member) {
            $memberRow = [
                'id' => $member->id,
                'name' => $member->full_name,
                'contributions' => []
            ];

            foreach ($contributionTypes as $type) {
                // Est-ce que ce membre est abonné à cette cotisation ?
                $sub = \App\Models\ContributionSubscription::where('user_id', $member->id)
                    ->where('contribution_type_id', $type->id)
                    ->where('is_active', true)
                    ->first();

                if ($sub) {
                    $payment = \App\Models\MemberContribution::where('meeting_id', $meetingId)
                        ->where('user_id', $member->id)
                        ->where('contribution_type_id', $type->id)
                        ->first();

                    $expectedAmount = $sub->parts * $type->amount;
                    
                    if ($payment) {
                        $totalCollected += $payment->total_amount;
                        $memberRow['contributions'][] = [
                            'type_id' => $type->id,
                            'status' => 'paid',
                            'amount' => $payment->total_amount,
                        ];
                    } else {
                        $totalFailure += $expectedAmount;
                        $memberRow['contributions'][] = [
                            'type_id' => $type->id,
                            'status' => 'failure',
                            'amount' => $expectedAmount,
                        ];
                    }
                } else {
                    // Pas abonné
                    $memberRow['contributions'][] = [
                        'type_id' => $type->id,
                        'status' => 'none',
                        'amount' => 0,
                    ];
                }
            }
            $matrix[] = $memberRow;
        }

        // 2. Autres Entrées (Fonds, Sanctions, Prêts, Evénements)
        $otherReport = [];
        
        // Fonds
        $fundEntries = \App\Models\FundEntry::where('meeting_id', $meetingId)
            ->where('direction', 'in')
            ->with(['user', 'fundType'])
            ->get();
        if ($fundEntries->count() > 0) {
            $total = $fundEntries->sum('amount');
            $totalCollected += $total;
            $otherReport[] = [
                'label' => 'Divers fonds',
                'type' => 'in',
                'total' => $total,
                'details' => $fundEntries->map(fn($e) => ['name' => $e->user->full_name ?? 'Anonyme', 'amount' => $e->amount, 'info' => $e->fundType->label])
            ];
        }

        // Sanctions
        $paidSanctions = \App\Models\Sanction::where('payment_meeting_id', $meetingId)->with('user')->get();
        if ($paidSanctions->count() > 0) {
            $total = $paidSanctions->sum('amount');
            $totalCollected += $total;
            $otherReport[] = [
                'label' => 'Sanctions perçues',
                'type' => 'in',
                'total' => $total,
                'details' => $paidSanctions->map(fn($s) => ['name' => $s->user->full_name, 'amount' => $s->amount, 'info' => $s->label])
            ];
        }

        // Remboursements
        $repaidLoans = \App\Models\Loan::where('repayment_meeting_id', $meetingId)->with('user')->get();
        if ($repaidLoans->count() > 0) {
            $total = $repaidLoans->sum('amount') + $repaidLoans->sum('interest');
            $totalCollected += $total;
            $otherReport[] = [
                'label' => 'Remboursements Prêts',
                'type' => 'in',
                'total' => $total,
                'details' => $repaidLoans->map(fn($l) => ['name' => $l->user->full_name, 'amount' => $l->amount + $l->interest, 'info' => 'Principal + Intérêt'])
            ];
        }

        // Evénements
        $eventContributions = \App\Models\EventContribution::where('meeting_id', $meetingId)->with(['contributor', 'event.eventType'])->get();
        if ($eventContributions->count() > 0) {
            $total = $eventContributions->sum('amount');
            $totalCollected += $total;
            $otherReport[] = [
                'label' => 'Collectes Evénements',
                'type' => 'in',
                'total' => $total,
                'details' => $eventContributions->map(fn($ec) => ['name' => $ec->contributor->full_name, 'amount' => $ec->amount, 'info' => $ec->event->eventType->label])
            ];
        }

        // 3. SORTIES
        $totalOut = 0;
        
        // Prêts accordés
        $disbursedLoans = \App\Models\Loan::where('meeting_id', $meetingId)->with('user')->get();
        if ($disbursedLoans->count() > 0) {
            $total = $disbursedLoans->sum('amount');
            $totalOut += $total;
            $otherReport[] = [
                'label' => 'Prêts accordés',
                'type' => 'out',
                'total' => $total,
                'details' => $disbursedLoans->map(fn($l) => ['name' => $l->user->full_name, 'amount' => $l->amount, 'info' => "Échéance: {$l->due_date}"])
            ];
        }

        // Payouts Tontine
        $payouts = \App\Models\TontinePayout::where('actual_payout_meeting_id', $meetingId)->where('status', 'paid')->with(['beneficiary', 'contributionType'])->get();
        if ($payouts->count() > 0) {
            $total = $payouts->sum('amount');
            $totalOut += $total;
            $otherReport[] = [
                'label' => 'Paiements Bénéficiaires',
                'type' => 'out',
                'total' => $total,
                'details' => $payouts->map(fn($p) => ['name' => $p->beneficiary->full_name, 'amount' => $p->amount, 'info' => $p->contributionType->label])
            ];
        }

        // Sorties Fonds
        $fundOut = \App\Models\FundEntry::where('meeting_id', $meetingId)->where('direction', 'out')->with(['user', 'fundType'])->get();
        if ($fundOut->count() > 0) {
            $total = $fundOut->sum('amount');
            $totalOut += $total;
            $otherReport[] = [
                'label' => 'Retraits de caisse',
                'type' => 'out',
                'total' => $total,
                'details' => $fundOut->map(fn($e) => ['name' => $e->user->full_name ?? 'Anonyme', 'amount' => $e->amount, 'info' => $e->fundType->label])
            ];
        }

        return response()->json([
            'meeting' => [
                'id' => $meeting->id,
                'date' => $meeting->meeting_date->format('d/m/Y'),
            ],
            'contribution_headers' => $contributionTypes->map(fn($t) => ['id' => $t->id, 'label' => $t->label]),
            'matrix' => $matrix,
            'other_flows' => $otherReport,
            'summary' => [
                'total_collected' => $totalCollected,
                'total_failure'   => $totalFailure,
                'total_out'       => $totalOut,
                'net_cash'        => $totalCollected - $totalOut
            ]
        ]);
    }
}
