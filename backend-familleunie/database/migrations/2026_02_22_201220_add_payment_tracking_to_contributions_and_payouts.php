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
        Schema::table('member_contributions', function (Blueprint $table) {
            $table->foreignId('collection_meeting_id')->nullable()->after('meeting_id')->constrained('meetings')->nullOnDelete();
        });

        Schema::table('tontine_payouts', function (Blueprint $table) {
            $table->foreignId('actual_payout_meeting_id')->nullable()->after('meeting_id')->constrained('meetings')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('member_contributions', function (Blueprint $table) {
            $table->dropForeign(['collection_meeting_id']);
            $table->dropColumn('collection_meeting_id');
        });

        Schema::table('tontine_payouts', function (Blueprint $table) {
            $table->dropForeign(['actual_payout_meeting_id']);
            $table->dropColumn('actual_payout_meeting_id');
        });
    }
};
