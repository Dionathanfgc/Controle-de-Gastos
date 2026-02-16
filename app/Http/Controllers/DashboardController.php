<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\MonthlyTabel;
use App\Models\Entry;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $tables = MonthlyTabel::where('user_id', $user->id)->orderBy('year', 'desc')->get();

        $selected = null;
        $dashboardData = null;

        if ($request->query('table')) {
            $selected = $tables->firstWhere('id', $request->query('table'));
            // Salvar a tabela selecionada no banco de dados
            if ($selected) {
                $user->update(['selected_table_id' => $selected->id]);
            }
        } else {
            // Usar a tabela selecionada do banco de dados
            if ($user->selected_table_id) {
                $selected = $tables->firstWhere('id', $user->selected_table_id);
            }
        }

        if (!$selected && $tables->isNotEmpty()) {
            $selected = $tables->first();
            $user->update(['selected_table_id' => $selected->id]);
        }

        if ($selected) {
            $dashboardData = $this->getDashboardData($selected);
        }

        return Inertia::render('dashboard', [
            'tables' => $tables,
            'selected' => $selected,
            'dashboardData' => $dashboardData,
        ]);
    }

    private function getDashboardData($table)
    {
        $categories = $table->categories()->with('entries')->get();

        $totalIncome = 0;
        $totalExpense = 0;
        $categoryExpenses = [];

        foreach ($categories as $category) {
            $total = $category->entries->sum('amount');

            if ($category->type === 'income') {
                $totalIncome += $total;
            } else {
                $totalExpense += $total;
                $categoryExpenses[] = [
                    'name' => $category->name,
                    'value' => $total,
                ];
            }
        }

        // Ordenar categorias por valor decrescente
        usort($categoryExpenses, function($a, $b) {
            return $b['value'] - $a['value'];
        });

        return [
            'totalIncome' => $totalIncome,
            'totalExpense' => $totalExpense,
            'balance' => $totalIncome - $totalExpense,
            'categoryExpenses' => $categoryExpenses,
            'year' => $table->year,
            'tableName' => $table->name,
        ];
    }
}
