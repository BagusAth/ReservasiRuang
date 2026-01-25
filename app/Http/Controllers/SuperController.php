<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Building;
use App\Models\Room;
use App\Models\Unit;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class SuperController extends Controller
{
    /**
     * Display the Master Admin dashboard.
     *
     * @return \Illuminate\View\View
     */
    public function dashboard()
    {
        $user = Auth::user();
        
        return view('super.dashboardM', compact('user'));
    }

    /**
     * Get dashboard statistics for accounts.
     *
     * @return JsonResponse
     */
    public function getStats(): JsonResponse
    {
        try {
            // Get role IDs
            $userRole = Role::where('role_name', 'user')->first();
            $adminUnitRole = Role::where('role_name', 'admin_unit')->first();
            $adminGedungRole = Role::where('role_name', 'admin_gedung')->first();
            $superAdminRole = Role::where('role_name', 'super_admin')->first();

            // Calculate statistics (excluding super_admin from counts)
            $totalAccounts = User::whereNotIn('role_id', [$superAdminRole->id ?? 0])->count();
            $userCount = User::where('role_id', $userRole->id ?? 0)->count();
            $adminCount = User::whereIn('role_id', [
                $adminUnitRole->id ?? 0,
                $adminGedungRole->id ?? 0
            ])->count();
            $activeUsers = User::whereNotIn('role_id', [$superAdminRole->id ?? 0])
                ->where('is_active', true)
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_accounts' => $totalAccounts,
                    'user_count' => $userCount,
                    'admin_count' => $adminCount,
                    'active_users' => $activeUsers,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat statistik: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get list of all users (excluding super admin).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getUsers(Request $request): JsonResponse
    {
        try {
            $superAdminRole = Role::where('role_name', 'super_admin')->first();
            
            $query = User::with(['role', 'unit', 'building'])
                ->whereNotIn('role_id', [$superAdminRole->id ?? 0]);

            // Search filter
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Role filter
            if ($request->has('role') && !empty($request->role)) {
                $roleFilter = Role::where('role_name', $request->role)->first();
                if ($roleFilter) {
                    $query->where('role_id', $roleFilter->id);
                }
            }

            // Status filter
            if ($request->has('status') && $request->status !== '') {
                $query->where('is_active', $request->status === 'active');
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 10);
            $users = $query->paginate($perPage);

            // Transform data for response
            $transformedUsers = $users->getCollection()->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role->role_name ?? 'N/A',
                    'role_display' => $this->getRoleDisplayName($user->role->role_name ?? ''),
                    'unit' => $user->unit->unit_name ?? null,
                    'building' => $user->building->building_name ?? null,
                    'is_active' => $user->is_active,
                    'created_at' => $user->created_at->format('d M Y'),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $transformedUsers,
                'pagination' => [
                    'current_page' => $users->currentPage(),
                    'last_page' => $users->lastPage(),
                    'per_page' => $users->perPage(),
                    'total' => $users->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat data pengguna: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user details by ID.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function getUserDetail(int $id): JsonResponse
    {
        try {
            $user = User::with(['role', 'unit', 'building'])->findOrFail($id);
            
            // Prevent viewing super admin details
            if ($user->isSuperAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat mengakses data super admin.'
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role_id' => $user->role_id,
                    'role' => $user->role->role_name ?? 'N/A',
                    'role_display' => $this->getRoleDisplayName($user->role->role_name ?? ''),
                    'unit_id' => $user->unit_id,
                    'unit' => $user->unit->unit_name ?? null,
                    'building_id' => $user->building_id,
                    'building' => $user->building->building_name ?? null,
                    'is_active' => $user->is_active,
                    'created_at' => $user->created_at->format('d M Y H:i'),
                    'updated_at' => $user->updated_at->format('d M Y H:i'),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna tidak ditemukan.'
            ], 404);
        }
    }

    /**
     * Create a new user account.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function createUser(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|string|in:user,admin_unit,admin_gedung',
            'unit_id' => 'nullable|exists:units,id',
            'building_id' => 'nullable|exists:buildings,id',
        ], [
            'name.required' => 'Nama harus diisi.',
            'email.required' => 'Email harus diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email sudah terdaftar.',
            'password.required' => 'Password harus diisi.',
            'password.min' => 'Password minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
            'role.required' => 'Role harus dipilih.',
            'role.in' => 'Role tidak valid.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $role = Role::where('role_name', $request->role)->firstOrFail();

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role_id' => $role->id,
                'unit_id' => $request->unit_id,
                'building_id' => $request->building_id,
                'is_active' => true,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Akun berhasil dibuat.',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat akun: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update user information.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function updateUser(Request $request, int $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            
            // Prevent editing super admin
            if ($user->isSuperAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat mengedit akun super admin.'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'email' => ['sometimes', 'required', 'email', Rule::unique('users')->ignore($id)],
                'role' => 'sometimes|required|string|in:user,admin_unit,admin_gedung',
                'unit_id' => 'nullable|exists:units,id',
                'building_id' => 'nullable|exists:buildings,id',
            ], [
                'name.required' => 'Nama harus diisi.',
                'email.required' => 'Email harus diisi.',
                'email.email' => 'Format email tidak valid.',
                'email.unique' => 'Email sudah terdaftar.',
                'role.in' => 'Role tidak valid.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal.',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update fields
            if ($request->has('name')) {
                $user->name = $request->name;
            }
            if ($request->has('email')) {
                $user->email = $request->email;
            }
            if ($request->has('role')) {
                $role = Role::where('role_name', $request->role)->first();
                if ($role) {
                    $user->role_id = $role->id;
                }
            }
            if ($request->has('unit_id')) {
                $user->unit_id = $request->unit_id;
            }
            if ($request->has('building_id')) {
                $user->building_id = $request->building_id;
            }

            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Data pengguna berhasil diperbarui.',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role->role_name ?? 'N/A',
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update user role.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function updateRole(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'role' => 'required|string|in:user,admin_unit,admin_gedung',
        ], [
            'role.required' => 'Role harus dipilih.',
            'role.in' => 'Role tidak valid.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::findOrFail($id);
            
            // Prevent editing super admin role
            if ($user->isSuperAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat mengubah role super admin.'
                ], 403);
            }

            $role = Role::where('role_name', $request->role)->firstOrFail();
            $user->role_id = $role->id;

            // Clear unit/building if changing to regular user
            if ($request->role === 'user') {
                $user->unit_id = null;
                $user->building_id = null;
            }

            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Role berhasil diperbarui.',
                'data' => [
                    'id' => $user->id,
                    'role' => $role->role_name,
                    'role_display' => $this->getRoleDisplayName($role->role_name),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui role: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle user active status.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            
            // Prevent deactivating super admin
            if ($user->isSuperAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat mengubah status super admin.'
                ], 403);
            }

            $user->is_active = !$user->is_active;
            $user->save();

            $statusText = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';

            return response()->json([
                'success' => true,
                'message' => "Akun berhasil {$statusText}.",
                'data' => [
                    'id' => $user->id,
                    'is_active' => $user->is_active,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengubah status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset user password.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function resetPassword(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'password' => 'required|string|min:8|confirmed',
        ], [
            'password.required' => 'Password baru harus diisi.',
            'password.min' => 'Password minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::findOrFail($id);
            
            // Prevent resetting super admin password (except self)
            if ($user->isSuperAdmin() && $user->id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat mereset password super admin lain.'
                ], 403);
            }

            $user->password = Hash::make($request->password);
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Password berhasil direset.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mereset password: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete user account.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function deleteUser(int $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            
            // Prevent deleting super admin
            if ($user->isSuperAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat menghapus akun super admin.'
                ], 403);
            }

            // Prevent self-deletion
            if ($user->id === Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat menghapus akun sendiri.'
                ], 403);
            }

            $userName = $user->name;
            $user->delete();

            return response()->json([
                'success' => true,
                'message' => "Akun {$userName} berhasil dihapus.",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus akun: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available roles for dropdown.
     *
     * @return JsonResponse
     */
    public function getRoles(): JsonResponse
    {
        try {
            $roles = Role::whereNotIn('role_name', ['super_admin'])
                ->get()
                ->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->role_name,
                        'display' => $this->getRoleDisplayName($role->role_name),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $roles
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat data role: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get units for dropdown.
     *
     * @return JsonResponse
     */
    public function getUnits(): JsonResponse
    {
        try {
            $units = Unit::orderBy('unit_name')->get(['id', 'unit_name']);

            return response()->json([
                'success' => true,
                'data' => $units
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat data unit: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get buildings for dropdown.
     *
     * @return JsonResponse
     */
    public function getBuildings(): JsonResponse
    {
        try {
            $buildings = Building::orderBy('building_name')->get(['id', 'building_name']);

            return response()->json([
                'success' => true,
                'data' => $buildings
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat data gedung: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get human-readable role display name.
     *
     * @param string $roleName
     * @return string
     */
    private function getRoleDisplayName(string $roleName): string
    {
        $displayNames = [
            'user' => 'User',
            'admin_unit' => 'Admin Unit',
            'admin_gedung' => 'Admin Gedung',
            'super_admin' => 'Super Admin',
        ];

        return $displayNames[$roleName] ?? $roleName;
    }
}