<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventContribution;
use App\Models\EventType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/events",
     *     summary="Liste des événements familiaux",
     *     tags={"Événements"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Liste des événements")
     * )
     */
    public function index(): JsonResponse
    {
        $events = Event::with([
            'member:id,full_name',
            'eventType:id,label,default_amount',
        ])
            ->orderBy('occurred_on', 'desc')
            ->limit(20)
            ->get();

        return response()->json($events);
    }

    /**
     * @OA\Get(
     *     path="/api/event-types",
     *     summary="Types d'événements",
     *     tags={"Événements"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Liste des types")
     * )
     */
    public function types(): JsonResponse
    {
        return response()->json(EventType::all());
    }

    /**
     * @OA\Post(
     *     path="/api/events",
     *     summary="Déclarer un événement",
     *     tags={"Événements"},
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             required={"event_type_id","occurred_on"},
     *             @OA\Property(property="event_type_id", type="integer"),
     *             @OA\Property(property="occurred_on", type="string", format="date"),
     *             @OA\Property(property="custom_amount", type="integer"),
     *             @OA\Property(property="note", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Événement créé")
     * )
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'event_type_id' => ['required', 'exists:event_types,id'],
            'occurred_on'   => ['required', 'date'],
            'custom_amount' => ['nullable', 'integer', 'min:0'],
            'note'          => ['nullable', 'string'],
            'member_id'     => ['nullable', 'exists:users,id'],
        ]);

        $event = Event::create([
            'member_id'     => $data['member_id'] ?? $request->user()->id,
            'event_type_id' => $data['event_type_id'],
            'occurred_on'   => $data['occurred_on'],
            'custom_amount' => $data['custom_amount'] ?? null,
            'note'          => $data['note'] ?? null,
        ]);

        $event->load(['member:id,full_name', 'eventType:id,label,default_amount']);

        return response()->json($event, 201);
    }

    /**
     * @OA\Post(
     *     path="/api/event-contributions",
     *     summary="Enregistrer une contribution pour un événement",
     *     tags={"Événements"},
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             required={"event_id","amount"},
     *             @OA\Property(property="event_id", type="integer"),
     *             @OA\Property(property="amount", type="integer"),
     *             @OA\Property(property="contributor_id", type="integer")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Contribution enregistrée")
     * )
     */
    public function storeContribution(Request $request): JsonResponse
    {
        $data = $request->validate([
            'event_id'       => ['required', 'exists:events,id'],
            'amount'         => ['required', 'integer', 'min:1'],
            'contributor_id' => ['nullable', 'exists:users,id'],
            'meeting_id'     => ['nullable', 'exists:meetings,id'],
        ]);

        $contribution = EventContribution::create([
            'event_id'       => $data['event_id'],
            'contributor_id' => $data['contributor_id'] ?? $request->user()->id,
            'amount'         => $data['amount'],
            'meeting_id'     => $data['meeting_id'],
        ]);

        return response()->json($contribution->load('contributor:id,full_name'), 201);
    }
}
