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
        Schema::table('event_contributions', function (Blueprint $table) {
            $table->foreignId('meeting_id')->nullable()->after('contributor_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('event_contributions', function (Blueprint $table) {
            $table->dropForeign(['meeting_id']);
            $table->dropColumn('meeting_id');
        });
    }
};
