<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\MonthlyTabel;
use App\Models\Category;
use App\Models\Entry;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Redirect;

class MonthlyTabelController extends Controller
{
    /**
     * Garante que a coluna expense_type existe e atualiza Aluguel/Internet para despesas fixas.
     */
    private function ensureExpenseTypeColumn(): void
    {
        if (Schema::hasColumn('categories', 'expense_type')) {
            // Atualizar categorias existentes Aluguel e Internet para despesa fixa
            Category::whereIn('name', ['Aluguel', 'Internet'])
                ->where('type', 'expense')
                ->update(['expense_type' => 'fixed']);
            return;
        }

        Schema::table('categories', function (Blueprint $table) {
            $table->enum('expense_type', ['fixed', 'variable', 'extra'])->nullable()->after('type');
        });

        // Atualizar Aluguel e Internet para despesas fixas
        Category::whereIn('name', ['Aluguel', 'Internet'])
            ->where('type', 'expense')
            ->update(['expense_type' => 'fixed']);
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $tables = MonthlyTabel::where('user_id', $user->id)->orderBy('year', 'desc')->get();

        $selected = null;
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

        $this->ensureExpenseTypeColumn();

        $monthlyData = [];
        if ($selected) {
            $monthlyData = $this->getMonthlyData($selected);
        }

        return Inertia::render('Tabelas/monthlyTabels', [
            'tables' => $tables,
            'selected' => $selected,
            'monthlyData' => $monthlyData,
        ]);
    }

    private function getMonthlyData($table)
    {
        $months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        
        $categories = $table->categories()->with('entries')->get();
        
        $groupedByType = [
            'income' => [],
            'expense' => [
                'fixed' => [],
                'variable' => [],
                'extra' => [],
                'investment' => [],
            ],
        ];

        foreach ($categories as $category) {
            $monthlyTotals = array_fill(0, 12, 0);
            
            foreach ($category->entries as $entry) {
                $month = (int) date('n', strtotime($entry->date)) - 1;
                $monthlyTotals[$month] += $entry->amount;
            }

            $categoryData = [
                'id' => $category->id,
                'name' => $category->name,
                'type' => $category->type,
                'expense_type' => $category->expense_type,
                'monthlyTotals' => $monthlyTotals,
                'total' => array_sum($monthlyTotals),
            ];

            if ($category->type === 'income') {
                // Renda é flat, sem subcategorias
                $groupedByType['income'][] = $categoryData;
            } else {
                // Se não tiver expense_type definido, coloca em 'variable' por padrão
                $expenseType = $category->expense_type ?? 'variable';
                $groupedByType['expense'][$expenseType][] = $categoryData;
            }
        }

        // Calcular totais por mês e por tipo
        $monthlyTotalsIncome = array_fill(0, 12, 0);
        $monthlyTotalsExpense = array_fill(0, 12, 0);
        $monthlyTotalsFixed = array_fill(0, 12, 0);
        $monthlyTotalsVariable = array_fill(0, 12, 0);
        $monthlyTotalsExtra = array_fill(0, 12, 0);
        $monthlyTotalsInvestment = array_fill(0, 12, 0);

        foreach ($groupedByType['income'] as $cat) {
            for ($i = 0; $i < 12; $i++) {
                $monthlyTotalsIncome[$i] += $cat['monthlyTotals'][$i];
            }
        }

        foreach ($groupedByType['expense']['fixed'] as $cat) {
            for ($i = 0; $i < 12; $i++) {
                $monthlyTotalsFixed[$i] += $cat['monthlyTotals'][$i];
                $monthlyTotalsExpense[$i] += $cat['monthlyTotals'][$i];
            }
        }

        foreach ($groupedByType['expense']['variable'] as $cat) {
            for ($i = 0; $i < 12; $i++) {
                $monthlyTotalsVariable[$i] += $cat['monthlyTotals'][$i];
                $monthlyTotalsExpense[$i] += $cat['monthlyTotals'][$i];
            }
        }

        foreach ($groupedByType['expense']['extra'] as $cat) {
            for ($i = 0; $i < 12; $i++) {
                $monthlyTotalsExtra[$i] += $cat['monthlyTotals'][$i];
                $monthlyTotalsExpense[$i] += $cat['monthlyTotals'][$i];
            }
        }

        foreach ($groupedByType['expense']['investment'] as $cat) {
            for ($i = 0; $i < 12; $i++) {
                $monthlyTotalsInvestment[$i] += $cat['monthlyTotals'][$i];
                $monthlyTotalsExpense[$i] += $cat['monthlyTotals'][$i];
            }
        }

        return [
            'months' => $months,
            'income' => [
                'categories' => $groupedByType['income'],
                'totals' => $monthlyTotalsIncome,
            ],
            'expense' => [
                'fixed' => [
                    'categories' => $groupedByType['expense']['fixed'],
                    'totals' => $monthlyTotalsFixed,
                ],
                'variable' => [
                    'categories' => $groupedByType['expense']['variable'],
                    'totals' => $monthlyTotalsVariable,
                ],
                'extra' => [
                    'categories' => $groupedByType['expense']['extra'],
                    'totals' => $monthlyTotalsExtra,
                ],
                'investment' => [
                    'categories' => $groupedByType['expense']['investment'],
                    'totals' => $monthlyTotalsInvestment,
                ],
                'totals' => $monthlyTotalsExpense,
            ],
            'balance' => array_map(function($inc, $exp) {
                return $inc - $exp;
            }, $monthlyTotalsIncome, $monthlyTotalsExpense),
            'expenseBreakdown' => [
                'fixed' => $monthlyTotalsFixed,
                'variable' => $monthlyTotalsVariable,
                'extra' => $monthlyTotalsExtra,
                'investment' => $monthlyTotalsInvestment,
            ],
        ];
    }

    public function storeTable(Request $request)
    {
        $this->ensureExpenseTypeColumn();

        $data = $request->validate([
            'year' => ['required','integer'],
            'name' => ['nullable','string'],
        ]);

        // Validar se já existe tabela para esse ano
        $existingTable = MonthlyTabel::where('user_id', $request->user()->id)
            ->where('year', $data['year'])
            ->first();

        if ($existingTable) {
            return Redirect::back()->withErrors([
                'year' => "Já existe uma tabela para o ano {$data['year']}.",
            ]);
        }

        $table = MonthlyTabel::create([
            'user_id' => $request->user()->id,
            'year' => $data['year'],
            'name' => $data['name'] ?? null,
        ]);

        // Criar categorias padrão
        $defaultCategories = [
            ['name' => 'Salário', 'type' => 'income', 'expense_type' => null],
            ['name' => 'Aluguel', 'type' => 'expense', 'expense_type' => 'fixed'],
            ['name' => 'Internet', 'type' => 'expense', 'expense_type' => 'fixed'],
            ['name' => 'Energia', 'type' => 'expense', 'expense_type' => 'fixed'],
            ['name' => 'Gás', 'type' => 'expense', 'expense_type' => 'fixed'],
            ['name' => 'Mercado', 'type' => 'expense', 'expense_type' => 'variable'],
        ];

        foreach ($defaultCategories as $category) {
            Category::create([
                'monthly_tabel_id' => $table->id,
                'name' => $category['name'],
                'type' => $category['type'],
                'expense_type' => $category['expense_type'],
            ]);
        }

        return Redirect::route('monthly-tabels', ['table' => $table->id]);
    }

    public function storeCategory(Request $request)
    {
        $this->ensureExpenseTypeColumn();

        $data = $request->validate([
            'monthly_tabel_id' => ['required','exists:monthly_tables,id'],
            'name' => ['required','string'],
            'type' => ['required','in:expense,income'],
            'expense_type' => ['nullable','in:fixed,variable,extra,investment'],
        ]);

        // Se for expense e não tiver expense_type, definir como 'variable' por padrão
        if ($data['type'] === 'expense' && empty($data['expense_type'])) {
            $data['expense_type'] = 'variable';
        }

        // Validar se já existe categoria com mesmo nome e tipo
        $existingCategory = Category::where('monthly_tabel_id', $data['monthly_tabel_id'])
            ->where('name', $data['name'])
            ->where('type', $data['type'])
            ->first();

        if ($existingCategory) {
            return Redirect::back()->withErrors([
                'name' => "Já existe uma categoria '{$data['name']}' neste tipo nesta tabela.",
            ]);
        }

        Category::create($data);

        return Redirect::back();
    }

    public function storeEntry(Request $request)
    {
        $data = $request->validate([
            'monthly_tabel_id' => ['required', 'exists:monthly_tables,id'],
            'category_id' => ['required', 'exists:categories,id'],
            'month' => ['required', 'numeric', 'min:1', 'max:12'],
            'amount' => ['required', 'numeric'],
            'mode' => ['nullable', 'string'], // Validamos o novo campo
        ]);

        $month = (int) $data['month'];
        $table = MonthlyTabel::findOrFail($data['monthly_tabel_id']);
        
        // Gerar a data padrão (dia 15)
        $date = sprintf('%d-%s-15', $table->year, str_pad($month, 2, '0', STR_PAD_LEFT));

        // Procura se já existe um registro para essa categoria e mês
        $entry = Entry::where([
            'monthly_tabel_id' => $data['monthly_tabel_id'],
            'category_id'      => $data['category_id'],
            'date'             => $date,
        ])->first();

        if ($entry) {
            // Se o modo for 'replace', SUBSTITUÍMOS o valor
            if ($request->mode === 'replace') {
                $entry->update(['amount' => $data['amount']]);
            } else {
                // Caso contrário (botão "+"), SOMAMOS ao valor atual
                $entry->increment('amount', $data['amount']);
            }
        } else {
            // Se não existir registro anterior, criamos um novo
            Entry::create([
                'monthly_tabel_id' => $data['monthly_tabel_id'],
                'category_id'      => $data['category_id'],
                'date'             => $date,
                'amount'           => $data['amount'],
                'description'      => null,
            ]);
        }

        return Redirect::back();
    }

    public function updateCategory(Request $request, $id)
    {
        $category = Category::findOrFail($id);
        $table = MonthlyTabel::findOrFail($category->monthly_tabel_id);

        // Verificar se a tabela pertence ao usuário
        if ($table->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }

        $data = $request->validate([
            'name' => ['required','string'],
        ]);

        // Validar se já existe categoria com mesmo nome e tipo
        $existingCategory = Category::where('monthly_tabel_id', $table->id)
            ->where('name', $data['name'])
            ->where('type', $category->type)
            ->where('id', '!=', $id)
            ->first();

        if ($existingCategory) {
            return Redirect::back()->withErrors([
                'name' => "Já existe uma categoria '{$data['name']}' nesta tabela.",
            ]);
        }

        $category->update($data);

        return Redirect::back();
    }

    public function deleteCategory(Request $request, $id)
    {
        $category = Category::findOrFail($id);
        $table = MonthlyTabel::findOrFail($category->monthly_tabel_id);

        // Verificar se a tabela pertence ao usuário
        if ($table->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }

        // Deletar todas as entradas associadas
        Entry::where('category_id', $id)->delete();

        // Deletar a categoria
        $category->delete();

        return Redirect::back();
    }

    public function deleteTable(Request $request, $id)
    {
        $table = MonthlyTabel::findOrFail($id);

        // Verificar se a tabela pertence ao usuário
        if ($table->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }

        $table->delete();

        return Redirect::route('monthly-tabels');
    }

    /**
     * Salvar a tabela selecionada no banco de dados
     */
    public function saveSelectedTable(Request $request)
    {
        $user = $request->user();
        $tableId = $request->input('table_id');

        // Validar se a tabela pertence ao usuário
        if ($tableId) {
            $table = MonthlyTabel::where('id', $tableId)->where('user_id', $user->id)->first();
            if (!$table) {
                return response()->json(['error' => 'Table not found'], 404);
            }
        }

        // Salvar a tabela selecionada
        $user->update(['selected_table_id' => $tableId]);

        return response()->json(['success' => true]);
    }

    /**
     * Recuperar a tabela selecionada do banco de dados
     */
    public function getSelectedTable(Request $request)
    {
        $user = $request->user();
        return response()->json(['table_id' => $user->selected_table_id]);
    }
}
