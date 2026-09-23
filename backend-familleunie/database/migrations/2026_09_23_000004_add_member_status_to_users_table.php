<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // active | pause | exclu | demissionnaire — seul "active" compte dans les calculs
            // par membre (répartition des enveloppes mariage/décès, etc.)
            $table->string('member_status')->default('active')->after('roles');
            $table->text('status_note')->nullable()->after('member_status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['member_status', 'status_note']);
        });
    }
};
