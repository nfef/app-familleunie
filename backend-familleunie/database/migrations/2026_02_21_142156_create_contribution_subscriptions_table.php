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
        Schema::create('contribution_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contribution_type_id')->constrained()->cascadeOnDelete();
            $table->decimal('parts', 5, 2)->default(1.00);
            $table->boolean('is_active')->default(true);
            $table->text('suspension_reason')->nullable();
            $table->timestamps();

            // Un seul abonnement actif par type et par membre
            $table->unique(['user_id', 'contribution_type_id'], 'user_contrib_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contribution_subscriptions');
    }
};
