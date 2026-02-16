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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'preferred_monthly_tabel_id')) {
                $table->foreignId('preferred_monthly_tabel_id')
                    ->nullable()
                    ->constrained('monthly_tables')
                    ->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'preferred_monthly_tabel_id')) {
                $table->dropForeignIdFor('monthly_tables', 'preferred_monthly_tabel_id');
                $table->dropColumn('preferred_monthly_tabel_id');
            }
        });
    }
};
