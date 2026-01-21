<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Please login.'
                ], 401);
            }
            return redirect()->route('guest.index');
        }

        $user = Auth::user();
        $userRole = $user->role?->role_name;

        // Check if user has one of the required roles
        if (!in_array($userRole, $roles)) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. You do not have permission to access this resource.'
                ], 403);
            }
            
            // Redirect to appropriate dashboard based on user's actual role
            return redirect($this->getRedirectUrl($userRole));
        }

        return $next($request);
    }

    /**
     * Get redirect URL based on user role.
     */
    private function getRedirectUrl(?string $roleName): string
    {
        return match ($roleName) {
            'super_admin' => '/super/dashboard',
            'admin_unit' => '/admin/dashboard',
            'admin_gedung' => '/admin/dashboard',
            'user' => '/user/dashboard',
            default => '/'
        };
    }
}