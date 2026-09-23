<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/members",
     *     summary="Liste de tous les membres",
     *     tags={"Membres"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Liste des membres")
     * )
     */
    public function index(): JsonResponse
    {
        $members = User::orderBy('full_name')
            ->get(['id', 'full_name', 'email', 'username', 'phone', 'roles', 'member_status', 'status_note', 'avatar_url', 'created_at']);

        return response()->json($members);
    }

    /**
     * @OA\Get(
     *     path="/api/members/{id}",
     *     summary="Profil d'un membre",
     *     tags={"Membres"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Profil du membre"),
     *     @OA\Response(response=404, description="Membre introuvable")
     * )
     */
    public function show(int $id): JsonResponse
    {
        $member = User::findOrFail($id);
        return response()->json([
            'id'              => $member->id,
            'full_name'       => $member->full_name,
            'email'           => $member->email,
            'username'        => $member->username,
            'phone'           => $member->phone,
            'roles'           => $member->roles,
            'member_status'   => $member->member_status,
            'status_note'     => $member->status_note,
            'avatar_url'      => $member->avatar_url,
            'avatar_full_url' => $member->avatar_full_url,
            'created_at'      => $member->created_at,
        ]);
    }

    /**
     * @OA\Put(
     *     path="/api/profile",
     *     summary="Mettre à jour le profil de l'utilisateur connecté",
     *     tags={"Membres"},
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             @OA\Property(property="full_name", type="string"),
     *             @OA\Property(property="phone", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Profil mis à jour")
     * )
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'full_name' => ['sometimes', 'string', 'max:255'],
            'phone'     => ['sometimes', 'nullable', 'string', 'max:30'],
        ]);

        $request->user()->update($data);

        return response()->json([
            'message' => 'Profil mis à jour.',
            'user'    => $request->user()->only(['id', 'full_name', 'email', 'phone', 'roles', 'avatar_url', 'avatar_full_url']),
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/profile/avatar",
     *     summary="Mettre à jour la photo de profil",
     *     tags={"Membres"},
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         @OA\MediaType(
     *             mediaType="multipart/form-data",
     *             @OA\Schema(
     *                 @OA\Property(property="avatar", type="string", format="binary")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=200, description="Avatar mis à jour")
     * )
     */
    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:5120'], // 5MB max
        ]);

        $user = $request->user();

        if ($user->avatar_url) {
            \Storage::disk('public')->delete($user->avatar_url);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar_url' => $path]);

        return response()->json([
            'message'         => 'Photo de profil mise à jour.',
            'avatar_url'      => $path,
            'avatar_full_url' => $user->avatar_full_url,
        ]);
    }

    public function subscriptions(int $id): JsonResponse
    {
        $member = User::findOrFail($id);
        return response()->json($member->subscriptions()->with('contributionType')->get());
    }

    public function updateSubscriptions(Request $request, int $id): JsonResponse
    {
        // Seul un admin ou commissaire aux comptes (ou le concerné ?) peut modifier. 
        // Disons ADMIN pour l'instant.
        if (!$request->user()->hasAnyRole(['ADMIN', 'TRESORIER'])) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $data = $request->validate([
            'subscriptions' => ['required', 'array'],
            'subscriptions.*.contribution_type_id' => ['required', 'exists:contribution_types,id'],
            'subscriptions.*.parts'                => ['required', 'numeric', 'min:0'],
            'subscriptions.*.is_active'            => ['required', 'boolean'],
            'subscriptions.*.suspension_reason'    => ['nullable', 'string'],
        ]);

        $member = User::findOrFail($id);

        foreach ($data['subscriptions'] as $subData) {
            \App\Models\ContributionSubscription::updateOrCreate(
                [
                    'user_id'              => $member->id,
                    'contribution_type_id' => $subData['contribution_type_id']
                ],
                [
                    'parts'             => $subData['parts'],
                    'is_active'         => $subData['is_active'],
                    'suspension_reason' => $subData['suspension_reason'] ?? null
                ]
            );
        }

        return response()->json(['message' => 'Abonnements mis à jour.', 'subscriptions' => $member->subscriptions()->get()]);
    }
}
