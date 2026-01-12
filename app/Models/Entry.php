<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Entry extends Model
{
    use HasFactory;

    protected $fillable = [
        'monthly_tabel_id',
        'category_id',
        'date',
        'description',
        'amount',
    ];

    public function monthlyTable()
    {
        return $this->belongsTo(MonthlyTabel::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
