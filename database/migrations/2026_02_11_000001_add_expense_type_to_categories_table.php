<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Apenas adiciona a coluna se ela não existir
        if (!Schema::hasColumn('categories', 'expense_type')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->enum('expense_type', ['fixed', 'variable', 'extra', 'investment'])->nullable()->after('type');
            });
        }
    }

    public function down()
    {
        if (Schema::hasColumn('categories', 'expense_type')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->dropColumn('expense_type');
            });
        }
    }
};
