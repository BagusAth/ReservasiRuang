<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Symfony\Component\HttpFoundation\Response;

class RememberSession
{
    /**
     * Session lifetime for remembered users (2 day in minutes).
     */
    private const REMEMBER_SESSION_LIFETIME = 2 * 1440;

    /**
     * Handle an incoming request.
     *
     * This middleware extends the session cookie lifetime when a user
     * is authenticated via the "remember me" cookie. This ensures that
     * the session doesn't expire when the browser is closed.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Check if user is authenticated via remember token
        if (Auth::check() && Auth::viaRemember()) {
            // User was authenticated via remember cookie - extend session
            $this->extendSessionCookie($request, $response);
        } elseif ($request->session()->has('remember_me')) {
            // User just logged in with remember me - extend session
            $this->extendSessionCookie($request, $response);
        }

        return $response;
    }

    /**
     * Extend the session cookie lifetime.
     */
    private function extendSessionCookie(Request $request, Response $response): void
    {
        // Get the session cookie name
        $sessionCookieName = config('session.cookie');
        
        // Get current session ID
        $sessionId = $request->session()->getId();
        
        // Create a new session cookie with extended lifetime
        $cookie = Cookie::make(
            $sessionCookieName,
            $sessionId,
            self::REMEMBER_SESSION_LIFETIME,
            config('session.path'),
            config('session.domain'),
            config('session.secure'),
            config('session.http_only'),
            false,
            config('session.same_site')
        );

        // Attach the cookie to the response
        $response->headers->setCookie($cookie);
    }
}