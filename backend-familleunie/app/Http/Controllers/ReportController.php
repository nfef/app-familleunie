<?php

namespace App\Http\Controllers;

use App\Models\MemberContribution;
use App\Models\FundEntry;
use App\Models\TontinePayout;
use App\Models\Sanction;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function yearly(Request $request): JsonResponse
    {
        $this->requireRole($request, ['ADMIN', 'TRESORIER', 'COMMISSAIRE']);
        
        $year = $request->input('year', date('Y'));

        // Entrées : Cotisations régulières
        $contributions = MemberContribution::whereYear('paid_at', $year)->sum('total_amount');
        
        // Entrées & Sorties : Fonds (Caisses)
        $fundIn = FundEntry::whereYear('created_at', $year)->where('direction', 'in')->sum('amount');
        $fundOut = FundEntry::whereYear('created_at', $year)->where('direction', 'out')->sum('amount');
        
        // Sorties : Payouts Tontine (on utilise updated_at comme date de paiement car paid_at n'existe pas dans cette table)
        $payouts = TontinePayout::whereYear('updated_at', $year)->where('status', 'paid')->sum('amount');
        
        // Entrées : Sanctions payées
        $sanctions = Sanction::whereYear('paid_at', $year)->where('status', 'paid')->sum('amount');
        
        // Prêts (les reconductions — parent_loan_id renseigné — ne sont pas un nouveau décaissement)
        $loansDisbursed = Loan::whereYear('created_at', $year)->whereNull('parent_loan_id')->sum('amount');
        $loansRepaidPrincipal = Loan::whereYear('paid_at', $year)->sum('repaid_amount');
        $loansRepaidInterest = Loan::whereYear('paid_at', $year)->where('status', 'paid')->sum('interest');

        return response()->json([
            'year' => $year,
            'summary' => [
                'total_contributions' => (int)$contributions,
                'total_fund_in'       => (int)$fundIn,
                'total_fund_out'      => (int)$fundOut,
                'total_payouts'       => (int)$payouts,
                'total_sanctions'     => (int)$sanctions,
                'loans_disbursed'     => (int)$loansDisbursed,
                'loans_repaid'        => (int)$loansRepaidPrincipal,
                'total_interests'     => (int)$loansRepaidInterest,
            ],
            'net_cash_flow' => (int)($contributions + $fundIn + $sanctions + $loansRepaidPrincipal + $loansRepaidInterest - $fundOut - $payouts - $loansDisbursed)
        ]);
    }

    public function memberReport(Request $request, int $userId): JsonResponse
    {
        // On permet au membre de voir son propre rapport, ou aux admins de voir celui des autres
        if ($request->user()->id !== $userId) {
            $this->requireRole($request, ['ADMIN', 'TRESORIER', 'COMMISSAIRE']);
        }
        
        $user = User::findOrFail($userId);
        return $this->generateMemberStats($user, $request->input('year', date('Y')));
    }

    public function myReport(Request $request): JsonResponse
    {
        return $this->generateMemberStats($request->user(), $request->input('year', date('Y')));
    }

    private function generateMemberStats(User $user, $year): JsonResponse
    {
        $userId = $user->id;

        // Cotisations
        $contributions = MemberContribution::where('user_id', $userId)->whereYear('paid_at', $year)->sum('total_amount');
        
        // Sanctions
        $sanctionsPaid = Sanction::where('user_id', $userId)->where('status', 'paid')->whereYear('paid_at', $year)->sum('amount');
        $sanctionsPending = Sanction::where('user_id', $userId)->where('status', 'pending')->sum('amount');
        $sanctionsList = Sanction::where('user_id', $userId)->where('status', 'pending')->get();
        
        // Prêts (un prêt "renewed" est remplacé par sa reconduction, qui seule compte comme actif)
        $loansActive = Loan::where('user_id', $userId)->where('status', 'pending')->get();
        $payoutsReceived = TontinePayout::where('beneficiary_id', $userId)->where('status', 'paid')->whereYear('updated_at', $year)->sum('amount');

        // Fonds / Caisses (Assurance, Fonds de caisse, etc.)
        $fundTypes = \App\Models\FundType::where('is_active', true)->get();
        $fundsStats = [];

        foreach ($fundTypes as $ft) {
            // Somme des entrées pour ce membre pour ce type de fonds
            $totalIn = FundEntry::where('member_id', $userId)
                ->where('fund_type_id', $ft->id)
                ->where('direction', 'in')
                ->sum('amount');
            
            $totalOut = FundEntry::where('member_id', $userId)
                ->where('fund_type_id', $ft->id)
                ->where('direction', 'out')
                ->sum('amount');
            
            $balance = $totalIn - $totalOut;
            $percent = $ft->target_amount > 0 ? min(100, round(($balance / $ft->target_amount) * 100)) : null;

            $fundsStats[] = [
                'fund_type_id' => $ft->id,
                'label'        => $ft->label,
                'balance'      => (int)$balance,
                'target'       => (int)$ft->target_amount,
                'percentage'   => $percent,
                'is_completed' => $ft->target_amount > 0 && $balance >= $ft->target_amount,
            ];
        }

        return response()->json([
            'member' => $user->full_name,
            'year'   => $year,
            'stats'  => [
                'contributions_total' => (int)$contributions,
                'sanctions_paid'      => (int)$sanctionsPaid,
                'sanctions_pending'   => (int)$sanctionsPending,
                'sanctions_list'      => $sanctionsList,
                'payouts_received'    => (int)$payoutsReceived,
                'active_loans_count'  => $loansActive->count(),
                'active_loans_amount' => (int)$loansActive->sum('amount'),
                'active_loans_list'   => $loansActive,
                'funds'               => $fundsStats,
            ]
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
