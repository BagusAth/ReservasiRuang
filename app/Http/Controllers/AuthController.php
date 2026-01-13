<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Cookie;

class AuthController extends Controller
{
    /**
     * Session lifetime when "remember me" is checked (1 day in minutes).
     */
    private const REMEMBER_SESSION_LIFETIME = 1440; // 1 day = 24 hours * 60 minutes

    /**
     * Handle login request via AJAX.
     */
    public function login(Request $request): JsonResponse
    {
        // Validate request
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
            'remember' => 'boolean',
        ]);

        // Rate limiting - max 5 attempts per minute
        $throttleKey = 'login:' . $request->ip();
        
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'success' => false,
                'message' => "Terlalu banyak percobaan login. Silakan coba lagi dalam {$seconds} detik."
            ], 429);
        }

        // Attempt login
        $credentials = $request->only('email', 'password');
        $remember = $request->boolean('remember');

        if (Auth::attempt($credentials, $remember)) {
            // Clear rate limiter on successful login
            RateLimiter::clear($throttleKey);
            
            // Regenerate session
            $request->session()->regenerate();

            // If "remember me" is checked, extend session lifetime to 1 day
            if ($remember) {
                $request->session()->put('remember_session', true);
                
                // Set session lifetime to 1 day
                config(['session.lifetime' => self::REMEMBER_SESSION_LIFETIME]);
                
                // Regenerate session with new lifetime
                $sessionId = $request->session()->getId();
                $request->session()->getHandler()->write(
                    $sessionId,
                    serialize($request->session()->all())
                );
            }

            $user = Auth::user();
            
            // Determine redirect based on user role
            $redirect = $this->getRedirectUrl($user);

            return response()->json([
                'success' => true,
                'message' => 'Login berhasil!',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role->role_name ?? null,
                ],
                'redirect' => $redirect
            ]);
        }

        // Increment rate limiter on failed attempt
        RateLimiter::hit($throttleKey, 60);

        return response()->json([
            'success' => false,
            'message' => 'Email atau password salah.'
        ], 401);
    }

    /**
     * Handle logout request.
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil!',
            'redirect' => route('guest.index')
        ]);
    }

    /**
     * Get redirect URL based on user role.
     */
    private function getRedirectUrl($user): string
    {
        $roleName = $user->role->role_name ?? null;

        return match ($roleName) {
            'super_admin' => '/admin/dashboard',
            'admin_unit' => '/unit/dashboard',
            'admin_gedung' => '/building/dashboard',
            'user' => '/user/dashboard',
            default => '/'
        };
    }
}
