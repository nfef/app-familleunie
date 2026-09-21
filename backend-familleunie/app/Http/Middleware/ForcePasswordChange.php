<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForcePasswordChange
{
    /**
     * Routes accessibles même quand must_change_password est true.
     */
    private array $exemptPaths = [
        'api/logout',
        'api/me',
        'api/profile/change-password',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->must_change_password && !$request->is(...$this->exemptPaths)) {
            abort(428, 'Vous devez changer votre mot de passe avant de continuer.');
        }

        return $next($request);
    }
}
