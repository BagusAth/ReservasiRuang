<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Field untuk menyimpan data jadwal lama sebelum diubah admin
            $table->json('schedule_changed_data')->nullable()->after('approved_at');
            
            // Status konfirmasi user untuk perubahan jadwal
            $table->enum('user_confirmation_status', ['Belum Dikonfirmasi', 'Disetujui User', 'Ditolak User'])
                  ->nullable()
                  ->after('schedule_changed_data')
                  ->comment('Status konfirmasi user terhadap perubahan jadwal oleh admin');
            
            // Timestamp konfirmasi user
            $table->timestamp('user_confirmed_at')->nullable()->after('user_confirmation_status');
            
            // Flag untuk menandai apakah booking pernah diubah jadwalnya
            $table->boolean('is_rescheduled')->default(false)->after('user_confirmed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn([
                'schedule_changed_data',
                'user_confirmation_status',
                'user_confirmed_at',
                'is_rescheduled'
            ]);
        });
    }
};
