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
        // 1. Nettoyage de contribution_types
        Schema::table('contribution_types', function (Blueprint $table) {
            $table->dropColumn('ration');
            // On ajoute un flag pour savoir s'il faut demander le nombre de parts
            $table->boolean('has_parts')->default(true)->after('amount');
            $table->boolean('is_mandatory')->default(false)->after('has_parts');
        });

        // 2. Evolution de member_contributions pour les parts fractionnaires
        Schema::table('member_contributions', function (Blueprint $table) {
            $table->decimal('parts', 5, 2)->default(1.00)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('member_contributions', function (Blueprint $table) {
            $table->unsignedInteger('parts')->default(1)->change();
        });

        Schema::table('contribution_types', function (Blueprint $table) {
            $table->decimal('ration', 10, 2)->nullable();
            $table->dropColumn(['has_parts', 'is_mandatory']);
        });
    }
};
