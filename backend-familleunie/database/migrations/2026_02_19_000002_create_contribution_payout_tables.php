<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Cotisations par membre par réunion
        Schema::create('member_contributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contribution_type_id')->constrained()->cascadeOnDelete();
            $table->foreignId('meeting_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('parts')->default(1);
            $table->unsignedBigInteger('unit_amount');
            $table->unsignedBigInteger('total_amount');
            $table->timestamp('paid_at')->useCurrent();
            $table->timestamps();
        });

        // Dépôts dans les caisses
        Schema::create('fund_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('fund_type_id')->constrained()->cascadeOnDelete();
            $table->foreignId('meeting_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('amount');
            $table->string('direction')->default('in'); // in | out
            $table->text('note')->nullable();
            $table->timestamps();
        });

        // Paiements de la tontine (bénéficiaires hebdomadaires)
        Schema::create('tontine_payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('beneficiary_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('meeting_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contribution_type_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('amount');
            $table->string('status')->default('pending'); // pending | paid
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tontine_payouts');
        Schema::dropIfExists('fund_entries');
        Schema::dropIfExists('member_contributions');
    }
};
