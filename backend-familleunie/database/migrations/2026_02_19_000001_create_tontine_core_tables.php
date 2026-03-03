<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Cycles (années/saisons de tontine)
        Schema::create('cycles', function (Blueprint $table) {
            $table->id();
            $table->string('label'); // ex: "2024", "Saison 1"
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Réunions hebdomadaires
        Schema::create('meetings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cycle_id')->constrained()->cascadeOnDelete();
            $table->date('meeting_date');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Types de cotisations
        Schema::create('contribution_types', function (Blueprint $table) {
            $table->id();
            $table->string('label');
            $table->unsignedBigInteger('amount'); // en FCFA
            $table->string('frequency')->default('weekly'); // weekly, monthly
            $table->decimal('ration', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Caisses / fonds
        Schema::create('fund_types', function (Blueprint $table) {
            $table->id();
            $table->string('label');
            $table->unsignedBigInteger('target_amount')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fund_types');
        Schema::dropIfExists('contribution_types');
        Schema::dropIfExists('meetings');
        Schema::dropIfExists('cycles');
    }
};
