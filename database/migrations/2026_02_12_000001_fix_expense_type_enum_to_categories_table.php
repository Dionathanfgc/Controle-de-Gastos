<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Usar raw SQL para alterar o enum sem tentar recriar a coluna
        DB::statement("ALTER TABLE categories MODIFY COLUMN expense_type ENUM('fixed', 'variable', 'extra', 'investment') NULL");
    }

    public function down()
    {
        // Revert para o enum anterior (sem 'investment')
        DB::statement("ALTER TABLE categories MODIFY COLUMN expense_type ENUM('fixed', 'variable', 'extra') NULL");
    }
};
