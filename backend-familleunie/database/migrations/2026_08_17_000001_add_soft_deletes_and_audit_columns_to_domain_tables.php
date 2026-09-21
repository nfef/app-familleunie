<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tables métier concernées par le soft delete + la traçabilité
     * (created_by / updated_by). Les tables techniques Laravel/Sanctum
     * (cache, jobs, personal_access_tokens...) ne sont pas concernées.
     */
    private array $tables = [
        'users',
        'cycles',
        'meetings',
        'attendances',
        'contribution_types',
        'contribution_subscriptions',
        'member_contributions',
        'fund_types',
        'fund_entries',
        'sanctions',
        'loans',
        'tontine_payouts',
        'event_types',
        'events',
        'event_contributions',
        'association_configs',
    ];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->softDeletes();
                $blueprint->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $blueprint->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        foreach (array_reverse($this->tables) as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropConstrainedForeignId('created_by');
                $blueprint->dropConstrainedForeignId('updated_by');
                $blueprint->dropSoftDeletes();
            });
        }
    }
};
