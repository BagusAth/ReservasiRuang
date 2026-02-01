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
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('room_id')->constrained('rooms')->onDelete('cascade');
            $table->date('start_date');
            $table->date('end_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('agenda_name');
            $table->string('pic_name');
            $table->string('pic_phone');
            $table->text('agenda_detail');
            $table->enum('status', ['Menunggu', 'Disetujui', 'Ditolak'])->default('Menunggu');
            $table->text('rejection_reason')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            
            // Field untuk menyimpan data jadwal lama sebelum diubah admin
            $table->json('schedule_changed_data')->nullable();
            
            // Status konfirmasi user untuk perubahan jadwal
            $table->enum('user_confirmation_status', ['Belum Dikonfirmasi', 'Disetujui User', 'Ditolak User'])
                  ->nullable()
                  ->comment('Status konfirmasi user terhadap perubahan jadwal oleh admin');
            
            // Timestamp konfirmasi user
            $table->timestamp('user_confirmed_at')->nullable();
            
            // Flag untuk menandai apakah booking pernah diubah jadwalnya
            $table->boolean('is_rescheduled')->default(false);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
