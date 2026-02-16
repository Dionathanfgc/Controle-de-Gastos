<?php

namespace App\Models;

use App\Models\MonthlyTabel;
use App\Models\Entry;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'monthly_tabel_id',
        'name',
        'type',
        'expense_type',
    ];

    public function monthlyTable()
    {
        return $this->belongsTo(MonthlyTabel::class);
    }

    public function entries()
    {
        return $this->hasMany(Entry::class);
    }
}
