<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Remember cookie lifetime in minutes (2 day = 2 * 1440 minutes).
     */
    private const REMEMBER_COOKIE_MINUTES = 2 * 1440;

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
            
            // Regenerate session for security
            $request->session()->regenerate();

            $user = Auth::user();
            
            // Determine redirect based on user role
            $redirect = $this->getRedirectUrl($user);

            // Build response
            $response = response()->json([
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

            // If remember me is checked, set a longer-lived session cookie
            if ($remember) {
                // Set remember flag in session for middleware to extend cookie
                $request->session()->put('remember_me', true);
            }
            return $response;
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
        // Get current user before logout
        $user = Auth::user();
        
        // Clear remember token if exists
        if ($user) {
            $user->setRememberToken(null);
            $user->save();
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Clear all auth-related cookies
        $response = response()->json([
            'success' => true,
            'message' => 'Logout berhasil!',
            'redirect' => route('guest.index')
        ]);

        // Forget the remember cookie
        $response->withCookie(Cookie::forget(Auth::getRecallerName()));

        return $response;
    }

    /**
     * Handle logout request with redirect (for form-based logout).
     */
    public function logoutRedirect(Request $request)
    {
        // Get current user before logout
        $user = Auth::user();
        
        // Clear remember token if exists
        if ($user) {
            $user->setRememberToken(null);
            $user->save();
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Redirect and forget remember cookie
        return redirect()
            ->route('guest.index')
            ->withCookie(Cookie::forget(Auth::getRecallerName()))
            ->with('message', 'Anda telah logout.');
    }

    /**
     * Get redirect URL based on user role.
     */
    private function getRedirectUrl($user): string
    {
        $roleName = $user->role->role_name ?? null;

        return match ($roleName) {
            'super_admin' => '/super/dashboard',
            'admin_unit' => '/admin/dashboard',
            'admin_gedung' => '/admin/dashboard',
            'user' => '/user/dashboard',
            default => '/'
        };
    }
}