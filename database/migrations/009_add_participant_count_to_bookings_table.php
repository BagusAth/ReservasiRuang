<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Menambahkan field participant_count untuk menyimpan jumlah peserta yang akan menggunakan ruangan.
     */
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->unsignedInteger('participant_count')
                  ->after('pic_phone')
                  ->comment('Jumlah peserta yang akan menggunakan ruangan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('participant_count');
        });
    }
};
