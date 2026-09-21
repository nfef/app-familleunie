<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * @OA\Post(
     *     path="/api/register",
     *     summary="Inscription d'un nouveau membre",
     *     tags={"Auth"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"full_name","email","password","password_confirmation"},
     *             @OA\Property(property="full_name", type="string", example="Marie Dupont"),
     *             @OA\Property(property="email", type="string", format="email", example="marie@exemple.com"),
     *             @OA\Property(property="username", type="string", example="marie"),
     *             @OA\Property(property="phone", type="string", example="+22500000000"),
     *             @OA\Property(property="password", type="string", format="password", example="secret123"),
     *             @OA\Property(property="password_confirmation", type="string", example="secret123")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Inscription réussie"),
     *     @OA\Response(response=422, description="Données invalides")
     * )
     */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email'     => ['required', 'email', 'unique:users,email'],
            'username'  => ['nullable', 'string', 'max:255', 'unique:users,username'],
            'phone'     => ['nullable', 'string', 'max:30'],
            'password'  => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = User::create([
            'full_name' => $data['full_name'],
            'email'     => $data['email'],
            'username'  => $data['username'] ?? null,
            'phone'     => $data['phone'] ?? null,
            'password'  => Hash::make($data['password']),
            'roles'     => ['MEMBRE'],
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user'  => $this->formatUser($user),
            'token' => $token,
        ], 201);
    }

    /**
     * @OA\Post(
     *     path="/api/login",
     *     summary="Connexion d'un membre (par email ou par login)",
     *     tags={"Auth"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"login","password"},
     *             @OA\Property(property="login", type="string", description="Email ou nom d'utilisateur", example="etienne"),
     *             @OA\Property(property="password", type="string", format="password")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Connexion réussie"),
     *     @OA\Response(response=401, description="Identifiants incorrects")
     * )
     */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'login'    => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $field = filter_var($data['login'], FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        if (!Auth::attempt([$field => $data['login'], 'password' => $data['password']])) {
            throw ValidationException::withMessages([
                'login' => ['Identifiants incorrects.'],
            ]);
        }

        /** @var User $user */
        $user = Auth::user();
        $user->tokens()->delete(); // Supprime les anciens tokens
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user'  => $this->formatUser($user),
            'token' => $token,
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/logout",
     *     summary="Déconnexion",
     *     tags={"Auth"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Déconnecté avec succès")
     * )
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté avec succès.']);
    }

    /**
     * @OA\Post(
     *     path="/api/profile/change-password",
     *     summary="Changer le mot de passe obligatoire",
     *     tags={"Auth"},
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             required={"password"},
     *             @OA\Property(property="password", type="string", minLength=8)
     *         )
     *     ),
     *     @OA\Response(response=200, description="Mot de passe mis à jour")
     * )
     */
    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();
        $user->update([
            'password'             => \Illuminate\Support\Facades\Hash::make($data['password']),
            'must_change_password' => false,
        ]);

        return response()->json([
            'message' => 'Mot de passe mis à jour avec succès.',
            'user'    => $this->formatUser($user)
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/me",
     *     summary="Profil de l'utilisateur connecté",
     *     tags={"Auth"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Profil utilisateur")
     * )
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json($this->formatUser($request->user()));
    }

    private function formatUser(User $user): array
    {
        return [
            'id'                   => $user->id,
            'full_name'            => $user->full_name,
            'email'                => $user->email,
            'username'             => $user->username,
            'phone'                => $user->phone,
            'roles'                => $user->roles ?? ['MEMBRE'],
            'avatar_url'           => $user->avatar_url,
            'avatar_full_url'      => $user->avatar_full_url,
            'must_change_password' => (bool)$user->must_change_password,
        ];
    }
}
