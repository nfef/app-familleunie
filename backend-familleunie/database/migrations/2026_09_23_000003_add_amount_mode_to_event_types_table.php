<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_types', function (Blueprint $table) {
            // per_member : default_amount facturé tel quel à chaque membre contribuant
            // envelope   : default_amount est le total de l'enveloppe, divisé par le nombre de membres
            $table->string('amount_mode')->default('per_member')->after('category');
        });
    }

    public function down(): void
    {
        Schema::table('event_types', function (Blueprint $table) {
            $table->dropColumn('amount_mode');
        });
    }
};
