<?php

use App\Http\Controllers\MonthlyTabelController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('monthly-tabels', [MonthlyTabelController::class, 'index'])->name('monthly-tabels');
    Route::post('monthly-tabels/tables', [MonthlyTabelController::class, 'storeTable'])->name('monthly-tabels.tables.store');
    Route::delete('monthly-tabels/{id}', [MonthlyTabelController::class, 'deleteTable'])->name('monthly-tabels.destroy');
    Route::post('monthly-tabels/categories', [MonthlyTabelController::class, 'storeCategory'])->name('monthly-tabels.categories.store');
    Route::put('monthly-tabels/categories/{id}', [MonthlyTabelController::class, 'updateCategory'])->name('monthly-tabels.categories.update');
    Route::delete('monthly-tabels/categories/{id}', [MonthlyTabelController::class, 'deleteCategory'])->name('monthly-tabels.categories.destroy');
    Route::post('monthly-tabels/entries', [MonthlyTabelController::class, 'storeEntry'])->name('monthly-tabels.entries.store');
    Route::post('monthly-tabels/save-selected', [MonthlyTabelController::class, 'saveSelectedTable'])->name('monthly-tabels.save-selected');
    Route::get('monthly-tabels/get-selected', [MonthlyTabelController::class, 'getSelectedTable'])->name('monthly-tabels.get-selected');
});

require __DIR__.'/settings.php';
