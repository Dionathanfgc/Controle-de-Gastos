<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MonthlyTabel extends Model
{
    use HasFactory;

    protected $table = 'monthly_tables';

    protected $fillable = [
        'user_id',
        'year',
        'name',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    public function entries()
    {
        return $this->hasMany(Entry::class);
    }
}
