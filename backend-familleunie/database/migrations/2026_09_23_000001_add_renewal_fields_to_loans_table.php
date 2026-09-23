<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->date('contracted_at')->nullable()->after('user_id');
            $table->foreignId('parent_loan_id')->nullable()->after('user_id')->constrained('loans')->nullOnDelete();
            $table->unsignedBigInteger('repaid_amount')->default(0)->after('interest');
        });
    }

    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropForeign(['parent_loan_id']);
            $table->dropColumn(['contracted_at', 'parent_loan_id', 'repaid_amount']);
        });
    }
};
