<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Meeting;
use App\Models\User;
use App\Models\Sanction;
use App\Models\AssociationConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/meetings/{meetingId}/attendance",
     *     summary="Liste de présence pour une réunion",
     *     tags={"Attendance"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Liste des présences")
     * )
     */
    public function index(int $meetingId): JsonResponse
    {
        $meeting = Meeting::findOrFail($meetingId);
        $members = User::orderBy('full_name')->get(['id', 'full_name']);
        
        $attendances = Attendance::where('meeting_id', $meetingId)->get()->keyBy('user_id');
        
        $threshold = AssociationConfig::get('consecutive_absences_threshold', 3);

        $data = $members->map(function($m) use ($attendances, $meeting, $threshold) {
            $status = $attendances->has($m->id) ? $attendances[$m->id]->status : 'present';
            
            $consecutiveAbsences = 0;
            if ($status === 'absent') {
                // Calculation of consecutive absences ending at this meeting
                $recentMeetings = Meeting::orderBy('meeting_date', 'desc')
                    ->where('meeting_date', '<=', $meeting->meeting_date)
                    ->limit($threshold)
                    ->pluck('id');

                $consecutiveAbsences = Attendance::where('user_id', $m->id)
                    ->whereIn('meeting_id', $recentMeetings)
                    ->where('status', 'absent')
                    ->count();
            }

            return [
                'user_id'              => $m->id,
                'full_name'            => $m->full_name,
                'status'               => $status,
                'note'                 => $attendances->has($m->id) ? $attendances[$m->id]->note : null,
                'consecutive_absences' => $consecutiveAbsences,
            ];
        });

        return response()->json([
            'meeting'    => $meeting,
            'attendance' => $data,
            'threshold'  => $threshold
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/meetings/{meetingId}/attendance",
     *     summary="Marquer la présence d'un membre",
     *     tags={"Attendance"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Présence enregistrée")
     * )
     */
    public function store(Request $request, int $meetingId): JsonResponse
    {
        $this->requireRole($request, ['ADMIN', 'CENSEUR']);
        $meeting = Meeting::findOrFail($meetingId);

        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'status'  => ['required', 'in:present,absent,late,excused'],
            'note'    => ['nullable', 'string'],
        ]);

        $attendance = Attendance::updateOrCreate(
            ['meeting_id' => $meetingId, 'user_id' => $data['user_id']],
            [
                'status'   => $data['status'],
                'note'     => $data['note'] ?? null,
                'noted_by' => $request->user()->id
            ]
        );

        // Si le membre est absent, on vérifie s'il doit être sanctionné
        if ($data['status'] === 'absent') {
            $this->checkConsecutiveAbsences($data['user_id'], $meeting);
        }

        return response()->json($attendance);
    }

    private function checkConsecutiveAbsences(int $userId, Meeting $meeting)
    {
        $enabled = AssociationConfig::get('attendance_sanctions_enabled', false);
        if (!$enabled) return;

        $threshold = AssociationConfig::get('consecutive_absences_threshold', 3);
        $amount    = AssociationConfig::get('absence_sanction_amount', 5000);

        // On compte les absences consécutives en remontant dans le temps
        $recentMeetings = Meeting::orderBy('meeting_date', 'desc')
            ->where('meeting_date', '<=', $meeting->meeting_date)
            ->limit($threshold)
            ->pluck('id');

        if ($recentMeetings->count() < $threshold) return;

        $absencesCount = Attendance::where('user_id', $userId)
            ->whereIn('meeting_id', $recentMeetings)
            ->where('status', 'absent')
            ->count();

        if ($absencesCount >= $threshold) {
            // Créer une sanction si elle n'existe pas déjà pour cette série
            // Pour éviter les doublons on peut checker si une sanction d'absence existe pour ce meeting
            $exists = Sanction::where('user_id', $userId)
                ->where('meeting_id', $meetingId)
                ->where('label', 'like', '%Absences consécutives%')
                ->exists();

            if (!$exists) {
                Sanction::create([
                    'user_id'    => $userId,
                    'meeting_id' => $meetingId,
                    'label'      => "Sanction pour {$threshold} absences consécutives",
                    'amount'     => $amount,
                    'status'     => 'pending',
                ]);
            }
        }
    }

    private function requireRole(Request $request, array $roles): void
    {
        $userRoles = $request->user()->roles ?? [];
        if (!array_intersect($roles, $userRoles)) {
            abort(403, 'Accès non autorisé.');
        }
    }
}
