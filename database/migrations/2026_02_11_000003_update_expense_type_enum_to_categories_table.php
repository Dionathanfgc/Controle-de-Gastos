<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Use raw SQL to modify the enum
        DB::statement("ALTER TABLE categories MODIFY COLUMN expense_type ENUM('fixed', 'variable', 'extra', 'investment') NULL");
    }

    public function down()
    {
        // Revert to the previous enum
        DB::statement("ALTER TABLE categories MODIFY COLUMN expense_type ENUM('fixed', 'variable', 'extra') NULL");
    }
};
