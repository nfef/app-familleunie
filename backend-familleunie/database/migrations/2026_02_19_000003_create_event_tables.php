<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Types d'événements (naissance, décès, mariage...)
        Schema::create('event_types', function (Blueprint $table) {
            $table->id();
            $table->string('label');
            $table->unsignedBigInteger('default_amount')->default(0);
            $table->timestamps();
        });

        // Événements familiaux déclarés
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('event_type_id')->constrained()->cascadeOnDelete();
            $table->date('occurred_on');
            $table->unsignedBigInteger('custom_amount')->nullable();
            $table->string('status')->default('open'); // open | closed
            $table->text('note')->nullable();
            $table->timestamps();
        });

        // Contributions exceptionnelles pour les événements
        Schema::create('event_contributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contributor_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('amount');
            $table->timestamp('paid_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_contributions');
        Schema::dropIfExists('events');
        Schema::dropIfExists('event_types');
    }
};
