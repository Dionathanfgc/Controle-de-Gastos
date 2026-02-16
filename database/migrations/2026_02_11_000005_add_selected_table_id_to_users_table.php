<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            // Apenas adicionar a chave estrangeira se ela não existir já
            if (Schema::hasColumn('users', 'selected_table_id')) {
                // Verificar se a chave estrangeira já existe
                $indexes = DB::select("SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'selected_table_id' AND REFERENCED_TABLE_NAME IS NOT NULL");
                if (empty($indexes)) {
                    $table->foreign('selected_table_id')->references('id')->on('monthly_tables')->onDelete('set null');
                }
            } else {
                $table->unsignedBigInteger('selected_table_id')->nullable()->after('remember_token');
                $table->foreign('selected_table_id')->references('id')->on('monthly_tables')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            // Apenas remover se existir
            $indexes = DB::select("SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'selected_table_id' AND REFERENCED_TABLE_NAME IS NOT NULL");
            if (!empty($indexes)) {
                $table->dropForeign(['selected_table_id']);
            }
            if (Schema::hasColumn('users', 'selected_table_id')) {
                $table->dropColumn('selected_table_id');
            }
        });
    }
};