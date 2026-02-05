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
        Schema::create('unit_neighbors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('unit_id')->constrained('units')->onDelete('cascade');
            $table->foreignId('neighbor_unit_id')->constrained('units')->onDelete('cascade');
            $table->timestamps();
            
            // Ensure unique relationship (prevent duplicate neighbor entries)
            $table->unique(['unit_id', 'neighbor_unit_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('unit_neighbors');
    }
};
