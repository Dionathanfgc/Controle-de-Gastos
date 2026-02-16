import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Form, usePage, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tabela Mensal',
        href: '/monthly-tabels',
    },
];

interface MonthlyData {
    months: string[];
    income: {
        categories: any[];
        totals: number[];
        receipt: {
            categories: any[];
            totals: number[];
        };
        investment: {
            categories: any[];
            totals: number[];
        };
    };
    expense: {
        fixed: {
            categories: any[];
            totals: number[];
        };
        variable: {
            categories: any[];
            totals: number[];
        };
        extra: {
            categories: any[];
            totals: number[];
        };
        investment: {
            categories: any[];
            totals: number[];
        };
        totals: number[];
    };
    balance: number[];
    expenseBreakdown: {
        fixed: number[];
        variable: number[];
        extra: number[];
        investment: number[];
    };
}

export default function MonthlyTabels() {
    const { props } = usePage<any>();
    const tables = props.tables ?? [];
    const selected = props.selected ?? null;
    const monthlyData = props.monthlyData as MonthlyData | {};
    const errors = (props.errors as any) ?? {};

    const [newYear, setNewYear] = useState(new Date().getFullYear());
    const [newTableName, setNewTableName] = useState('');
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [showAddEntry, setShowAddEntry] = useState(false);
    const [showCreateTable, setShowCreateTable] = useState(false);
    const [catName, setCatName] = useState('');
    const [catType, setCatType] = useState('expense');
    const [catExpenseType, setCatExpenseType] = useState('variable');
    const [editingCell, setEditingCell] = useState<{ catId: number; monthIdx: number } | null>(null);
    const [editValue, setEditValue] = useState('');
    const [categoryMenu, setCategoryMenu] = useState<{ catId: number; catName: string } | null>(null);
    const [renamingCategory, setRenamingCategory] = useState<{ catId: number; newName: string } | null>(null);
    const [addCategoryModal, setAddCategoryModal] = useState<{ type: string; expenseType?: string } | null>(null);

    const hasData = Object.keys(monthlyData).length > 0;
    const currentMonthIndex = new Date().getMonth(); // 0-11 (janeiro = 0, dezembro = 11)

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const handleCellEdit = (catId: number, monthIdx: number, currentValue: number) => {
        setEditingCell({ catId, monthIdx });
        setEditValue(String(currentValue));
    };

    const handleCellSave = async (catId: number, monthIdx: number) => {
        const amount = parseFloat(editValue);
        if (isNaN(amount)) {
            alert('Digite um valor válido');
            return;
        }

    

        const month = String(monthIdx + 1).padStart(2, '0');
        
        router.post('/monthly-tabels/entries', {
            monthly_tabel_id: selected?.id,
            category_id: catId,
            month,
            amount,
            mode: 'replace',
        }, {
            onSuccess: () => {
                setEditingCell(null);
            },
            onError: (errors: any) => {
                alert('Erro ao salvar: ' + JSON.stringify(errors));
                setEditingCell(null);
            },
        });
    };

    const handleRenameCategory = (catId: number) => {
        if (!renamingCategory?.newName) {
            alert('Digite um novo nome');
            return;
        }

        router.put(`/monthly-tabels/categories/${catId}`, {
            name: renamingCategory.newName,
        }, {
            onSuccess: () => {
                setRenamingCategory(null);
                setCategoryMenu(null);
            },
            onError: (errors: any) => {
                alert('Erro ao renomear: ' + JSON.stringify(errors));
            },
        });
    };

    const handleDeleteCategory = (catId: number) => {
        if (!confirm('Tem certeza? Todos os valores desta categoria serão deletados.')) {
            return;
        }

        router.delete(`/monthly-tabels/categories/${catId}`, {
            onSuccess: () => {
                setCategoryMenu(null);
            },
            onError: (errors: any) => {
                alert('Erro ao deletar: ' + JSON.stringify(errors));
            },
        });
    };

    const handleAddEntry = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        router.post('/monthly-tabels/entries', {
            monthly_tabel_id: selected?.id,
            month: formData.get('month'),
            category_id: formData.get('category_id'),
            amount: formData.get('amount'),
        }, {
            onSuccess: () => {
                setShowAddEntry(false); // Fecha o formulário
            },
            onError: (err: any) => {
                alert('Erro ao adicionar valor: ' + JSON.stringify(err));
            }
        });
    };

    // Salvar tabela selecionada no banco de dados quando for passada via URL
    const saveSelectedTable = async (tableId: number) => {
        try {
            await fetch('/monthly-tabels/save-selected', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ table_id: tableId }),
            });
        } catch (error) {
            console.error('Erro ao salvar tabela selecionada:', error);
        }
    };

    // Função para adicionar categoria a partir do popup de seção
    const handleAddCategoryFromSection = (catName: string) => {
        if (!catName) {
            alert('Digite um nome para a categoria');
            return;
        }

        router.post('/monthly-tabels/categories', {
            monthly_tabel_id: selected?.id,
            name: catName,
            type: addCategoryModal?.type,
            expense_type: addCategoryModal?.expenseType || null,
        }, {
            onSuccess: () => {
                setAddCategoryModal(null);
            },
            onError: (errors: any) => {
                console.error('Erro:', errors);
            },
        });
    };

    // Fechar formulário de criar tabela após sucesso
    useEffect(() => {
        if (showCreateTable) {
            // Don't close on mount, only on actual form submission (detected by page reload)
        }
    }, [tables]);

    // Salvar tabela selecionada quando for selecionada
    useEffect(() => {
        if (selected && window.location.search.includes(`table=${selected.id}`)) {
            saveSelectedTable(selected.id);
        }
    }, [selected]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tabela Mensal" />

            <div className="space-y-6 relative pb-24">
                {/* Header com seletor de ano e tabela */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold">Tabela Mensal</h1>
                        <div className="flex items-center gap-2">
                            <select
                                value={selected?.id ?? ''}
                                onChange={(e) => {
                                    window.location.href = `/monthly-tabels?table=${e.target.value}`;
                                }}
                                className="px-3 py-2 border rounded border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
                            >
                                {tables.map((t: any) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name ?? t.year}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowCreateTable(!showCreateTable)}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded font-bold text-lg"
                        >
                            + Nova Tabela
                        </button>

                        <button
                            onClick={() => setShowAddCategory(!showAddCategory)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            + Adicionar Categoria
                        </button>

                        <button
                            onClick={() => setShowAddEntry(!showAddEntry)}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                        >
                            + Adicionar Valor
                        </button>
                    </div>
                </div>

                {/* Formulário de criar tabela */}
                {showCreateTable && (
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        router.post('/monthly-tabels/tables', {
                            year: newYear,
                            name: newTableName,
                        }, {
                            onSuccess: () => {
                                setShowCreateTable(false);
                                setNewTableName('');
                                setNewYear(new Date().getFullYear());
                            },
                            onError: (errors: any) => {
                                console.error('Erro:', errors);
                            },
                        });
                    }} className="bg-gray-100 dark:bg-slate-900 p-4 rounded space-y-3 border border-sidebar-border/70 dark:border-sidebar-border">
                        {errors.year && (
                            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                                {errors.year}
                            </div>
                        )}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-1 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setNewYear(newYear - 1)}
                                    className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-2 rounded font-bold"
                                >
                                    −
                                </button>
                                <input 
                                    type="number" 
                                    name="year" 
                                    value={newYear} 
                                    onChange={(e) => setNewYear(Number(e.target.value))} 
                                    placeholder="Ano" 
                                    className="flex-1 px-3 py-2 border rounded border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-slate-950 text-gray-900 dark:text-white text-center" 
                                    required 
                                />
                                <button
                                    type="button"
                                    onClick={() => setNewYear(newYear + 1)}
                                    className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-2 rounded font-bold"
                                >
                                    +
                                </button>
                            </div>
                            <input name="name" value={newTableName} onChange={(e) => setNewTableName(e.target.value)} placeholder="Nome da tabela (opcional)" className="col-span-1 px-3 py-2 border rounded border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-slate-950 text-gray-900 dark:text-white" />
                            <button type="submit" className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded">Criar Tabela</button>
                        </div>
                    </form>
                )}

                {/* Formulário de categoria */}
                {showAddCategory && (
                    <>
                        {!selected ? (
                            <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded">
                                Selecione uma tabela antes de adicionar categorias.
                            </div>
                        ) : (
                            <div className="bg-gray-100 dark:bg-slate-900 p-4 rounded space-y-3 border border-sidebar-border/70 dark:border-sidebar-border">
                                {errors.name && (
                                    <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                                        {errors.name}
                                    </div>
                                )}
                                <div className="grid grid-cols-4 gap-3">
                                    <input 
                                        id="cat_name" 
                                        name="name" 
                                        placeholder="Nome da categoria" 
                                        className="col-span-1 px-3 py-2 border rounded border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-slate-950 text-gray-900 dark:text-white" 
                                        required 
                                    />
                                    <select 
                                        id="cat_type" 
                                        name="type" 
                                        className="col-span-1 px-3 py-2 border rounded border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
                                        value={catType}
                                        onChange={(e) => setCatType(e.target.value)}
                                    >
                                        <option value="income">Renda</option>
                                        <option value="expense">Despesa</option>
                                    </select>
                                    {catType === 'expense' && (
                                        <select 
                                            id="cat_expense_type" 
                                            name="expense_type" 
                                            className="col-span-1 px-3 py-2 border rounded border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
                                            value={catExpenseType}
                                            onChange={(e) => setCatExpenseType(e.target.value)}
                                        >
                                            <option value="fixed">Despesa Fixa</option>
                                            <option value="variable">Despesa Variável</option>
                                            <option value="extra">Despesa Extra</option>
                                            <option value="investment">Investimento</option>
                                        </select>
                                    )}
                                    {catType === 'income' && <div className="col-span-1"></div>}
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const name = (document.getElementById('cat_name') as HTMLInputElement)?.value;
                                            
                                            if (!name) {
                                                alert('Digite um nome para a categoria');
                                                return;
                                            }
                                            
                                            router.post('/monthly-tabels/categories', {
                                                monthly_tabel_id: selected?.id,
                                                name,
                                                type: catType,
                                                expense_type: catType === 'expense' ? catExpenseType : null,
                                            }, {
                                                onSuccess: () => {
                                                    (document.getElementById('cat_name') as HTMLInputElement).value = '';
                                                    setCatType('expense');
                                                    setCatExpenseType('variable');
                                                    setShowAddCategory(false);
                                                },
                                                onError: (errors: any) => {
                                                    console.error('Erro:', errors);
                                                },
                                            });
                                        }}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                                    >
                                        Criar
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Tabela principal */}
                {!hasData ? (
                    <div className="bg-gray-50 dark:bg-slate-900 p-8 rounded text-center border border-sidebar-border/70 dark:border-sidebar-border">
                        <p className="text-gray-500 dark:text-gray-400">Nenhuma tabela selecionada ou tabela vazia.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto border rounded border-sidebar-border/70 dark:border-sidebar-border">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-800 dark:bg-slate-800 text-white">
                                    <th className="px-4 py-3 text-left w-48">Categoria</th>
                                    {(monthlyData as MonthlyData).months.map((month: string, idx: number) => (
                                        <th key={idx} className="px-3 py-3 text-right min-w-24">{month.slice(0, 3).toUpperCase()}</th>
                                    ))}
                                    <th className="px-3 py-3 text-right min-w-24 bg-blue-600 dark:bg-blue-700 font-bold border-l-2 border-blue-400 dark:border-blue-500">MÊS ATUAL</th>
                                    <th className="px-3 py-3 text-right min-w-24 bg-purple-600 dark:bg-purple-700 font-bold border-l-2 border-purple-400 dark:border-purple-500">TOTAL ANO</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Seção RENDA */}
                                <tr 
                                    className="bg-green-900 dark:bg-green-950 text-white font-bold cursor-pointer hover:bg-green-800 dark:hover:bg-green-900"
                                    onClick={() => setAddCategoryModal({ type: 'income' })}
                                >
                                    <td colSpan={15} className="px-4 py-3">RENDA</td>
                                </tr>
                                {(monthlyData as MonthlyData).income.categories.map((cat: any) => (
                                    <tr key={`income-${cat.id}`} className="border-b border-sidebar-border/70 dark:border-sidebar-border hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                        <td 
                                            className="px-4 py-3 font-medium cursor-pointer text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400"
                                            onClick={() => setCategoryMenu({ catId: cat.id, catName: cat.name })}
                                        >
                                            {cat.name}
                                        </td>
                                        {cat.monthlyTotals.map((total: number, idx: number) => (
                                            <td 
                                                key={idx} 
                                                className="px-3 py-3 text-right text-sm cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-green-100 dark:hover:bg-green-900/30"
                                                onClick={() => handleCellEdit(cat.id, idx, total)}
                                            >
                                                {editingCell?.catId === cat.id && editingCell?.monthIdx === idx ? (
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onBlur={() => handleCellSave(cat.id, idx)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleCellSave(cat.id, idx);
                                                            if (e.key === 'Escape') setEditingCell(null);
                                                        }}
                                                        className="w-full px-2 py-1 border rounded border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-slate-950 text-gray-900 dark:text-white text-right"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    formatCurrency(total)
                                                )}
                                            </td>
                                        ))}
                                        <td className="px-3 py-3 text-right text-sm font-bold bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100 border-l-2 border-blue-400 dark:border-blue-500">
                                            {formatCurrency(cat.monthlyTotals[currentMonthIndex] || 0)}
                                        </td>
                                        <td className="px-3 py-3 text-right text-sm font-bold bg-purple-50 dark:bg-purple-900/20 text-gray-900 dark:text-gray-100 border-l-2 border-purple-400 dark:border-purple-500">
                                            {formatCurrency(cat.monthlyTotals.reduce((sum: number, val: number) => sum + val, 0))}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-green-700 dark:bg-green-800 text-white font-bold">
                                    <td className="px-4 py-3">TOTAL RENDA</td>
                                    {(monthlyData as MonthlyData).income.totals.map((total: number, idx: number) => (
                                        <td key={idx} className="px-3 py-3 text-right">{formatCurrency(total)}</td>
                                    ))}
                                    <td className="px-3 py-3 text-right bg-blue-600 dark:bg-blue-700 border-l-2 border-blue-400 dark:border-blue-500">
                                        {formatCurrency((monthlyData as MonthlyData).income.totals[currentMonthIndex] || 0)}
                                    </td>
                                    <td className="px-3 py-3 text-right bg-purple-600 dark:bg-purple-700 border-l-2 border-purple-400 dark:border-purple-500">
                                        {formatCurrency((monthlyData as MonthlyData).income.totals.reduce((sum: number, val: number) => sum + val, 0))}
                                    </td>
                                </tr>

                                {/* Seção DESPESAS */}
                                <tr className="bg-gray-700 dark:bg-gray-800 text-white font-bold">
                                    <td colSpan={15} className="px-4 py-3">DESPESAS</td>
                                </tr>

                                {/* Despesas Fixas */}
                                <tr 
                                    className="bg-gray-600 dark:bg-gray-700 text-white font-bold cursor-pointer hover:bg-gray-500 dark:hover:bg-gray-600"
                                    onClick={() => setAddCategoryModal({ type: 'expense', expenseType: 'fixed' })}
                                >
                                    <td colSpan={15} className="px-4 py-2 text-sm">DESPESAS FIXAS</td>
                                </tr>
                                {(monthlyData as MonthlyData).expense.fixed.categories.map((cat: any) => (
                                    <tr key={`expense-fixed-${cat.id}`} className="border-b border-sidebar-border/70 dark:border-sidebar-border hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                        <td 
                                            className="px-4 py-3 font-medium cursor-pointer text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                                            onClick={() => setCategoryMenu({ catId: cat.id, catName: cat.name })}
                                        >
                                            {cat.name}
                                        </td>
                                        {cat.monthlyTotals.map((total: number, idx: number) => (
                                            <td 
                                                key={idx} 
                                                className="px-3 py-3 text-right text-sm cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-slate-700/50"
                                                onClick={() => handleCellEdit(cat.id, idx, total)}
                                            >
                                                {editingCell?.catId === cat.id && editingCell?.monthIdx === idx ? (
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onBlur={() => handleCellSave(cat.id, idx)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleCellSave(cat.id, idx);
                                                            if (e.key === 'Escape') setEditingCell(null);
                                                        }}
                                                        className="w-full px-2 py-1 border rounded border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-slate-950 text-gray-900 dark:text-white text-right"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    formatCurrency(total)
                                                )}
                                            </td>
                                        ))}
                                        <td className="px-3 py-3 text-right text-sm font-bold bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100 border-l-2 border-blue-400 dark:border-blue-500">
                                            {formatCurrency(cat.monthlyTotals[currentMonthIndex] || 0)}
                                        </td>
                                        <td className="px-3 py-3 text-right text-sm font-bold bg-purple-50 dark:bg-purple-900/20 text-gray-900 dark:text-gray-100 border-l-2 border-purple-400 dark:border-purple-500">
                                            {formatCurrency(cat.monthlyTotals.reduce((sum: number, val: number) => sum + val, 0))}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-500 dark:bg-gray-600 text-white font-bold text-sm">
                                    <td className="px-4 py-2">TOTAL DESPESAS FIXAS</td>
                                    {(monthlyData as MonthlyData).expense.fixed.totals.map((total: number, idx: number) => (
                                        <td key={idx} className="px-3 py-2 text-right">{formatCurrency(total)}</td>
                                    ))}
                                    <td className="px-3 py-2 text-right bg-blue-600 dark:bg-blue-700 border-l-2 border-blue-400 dark:border-blue-500">
                                        {formatCurrency((monthlyData as MonthlyData).expense.fixed.totals[currentMonthIndex] || 0)}
                                    </td>
                                    <td className="px-3 py-2 text-right bg-purple-600 dark:bg-purple-700 border-l-2 border-purple-400 dark:border-purple-500">
                                        {formatCurrency((monthlyData as MonthlyData).expense.fixed.totals.reduce((sum: number, val: number) => sum + val, 0))}
                                    </td>
                                </tr>
                                {/* Despesas Variáveis */}
                                <tr 
                                    className="bg-gray-600 dark:bg-gray-700 text-white font-bold cursor-pointer hover:bg-gray-500 dark:hover:bg-gray-600"
                                    onClick={() => setAddCategoryModal({ type: 'expense', expenseType: 'variable' })}
                                >
                                    <td colSpan={15} className="px-4 py-2 text-sm">DESPESAS VARIÁVEIS</td>
                                </tr>
                                {(monthlyData as MonthlyData).expense.variable.categories.map((cat: any) => (
                                    <tr key={`expense-variable-${cat.id}`} className="border-b border-sidebar-border/70 dark:border-sidebar-border hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                        <td 
                                            className="px-4 py-3 font-medium cursor-pointer text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                                            onClick={() => setCategoryMenu({ catId: cat.id, catName: cat.name })}
                                        >
                                            {cat.name}
                                        </td>
                                        {cat.monthlyTotals.map((total: number, idx: number) => (
                                            <td 
                                                key={idx} 
                                                className="px-3 py-3 text-right text-sm cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-slate-700/50"
                                                onClick={() => handleCellEdit(cat.id, idx, total)}
                                            >
                                                {editingCell?.catId === cat.id && editingCell?.monthIdx === idx ? (
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onBlur={() => handleCellSave(cat.id, idx)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleCellSave(cat.id, idx);
                                                            if (e.key === 'Escape') setEditingCell(null);
                                                        }}
                                                        className="w-full px-2 py-1 border rounded border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-slate-950 text-gray-900 dark:text-white text-right"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    formatCurrency(total)
                                                )}
                                            </td>
                                        ))}
                                        <td className="px-3 py-3 text-right text-sm font-bold bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100 border-l-2 border-blue-400 dark:border-blue-500">
                                            {formatCurrency(cat.monthlyTotals[currentMonthIndex] || 0)}
                                        </td>
                                        <td className="px-3 py-3 text-right text-sm font-bold bg-purple-50 dark:bg-purple-900/20 text-gray-900 dark:text-gray-100 border-l-2 border-purple-400 dark:border-purple-500">
                                            {formatCurrency(cat.monthlyTotals.reduce((sum: number, val: number) => sum + val, 0))}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-500 dark:bg-gray-600 text-white font-bold text-sm">
                                    <td className="px-4 py-2">TOTAL DESPESAS VARIÁVEIS</td>
                                    {(monthlyData as MonthlyData).expense.variable.totals.map((total: number, idx: number) => (
                                        <td key={idx} className="px-3 py-2 text-right">{formatCurrency(total)}</td>
                                    ))}
                                    <td className="px-3 py-2 text-right bg-blue-600 dark:bg-blue-700 border-l-2 border-blue-400 dark:border-blue-500">
                                        {formatCurrency((monthlyData as MonthlyData).expense.variable.totals[currentMonthIndex] || 0)}
                                    </td>
                                    <td className="px-3 py-2 text-right bg-purple-600 dark:bg-purple-700 border-l-2 border-purple-400 dark:border-purple-500">
                                        {formatCurrency((monthlyData as MonthlyData).expense.variable.totals.reduce((sum: number, val: number) => sum + val, 0))}
                                    </td>
                                </tr>
                                {/* Despesas Extras */}
                                <tr 
                                    className="bg-gray-600 dark:bg-gray-700 text-white font-bold cursor-pointer hover:bg-gray-500 dark:hover:bg-gray-600"
                                    onClick={() => setAddCategoryModal({ type: 'expense', expenseType: 'extra' })}
                                >
                                    <td colSpan={15} className="px-4 py-2 text-sm">DESPESAS EXTRAS</td>
                                </tr>
                                {(monthlyData as MonthlyData).expense.extra.categories.map((cat: any) => (
                                    <tr key={`expense-extra-${cat.id}`} className="border-b border-sidebar-border/70 dark:border-sidebar-border hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                        <td 
                                            className="px-4 py-3 font-medium cursor-pointer text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                                            onClick={() => setCategoryMenu({ catId: cat.id, catName: cat.name })}
                                        >
                                            {cat.name}
                                        </td>
                                        {cat.monthlyTotals.map((total: number, idx: number) => (
                                            <td 
                                                key={idx} 
                                                className="px-3 py-3 text-right text-sm cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-slate-700/50"
                                                onClick={() => handleCellEdit(cat.id, idx, total)}
                                            >
                                                {editingCell?.catId === cat.id && editingCell?.monthIdx === idx ? (
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onBlur={() => handleCellSave(cat.id, idx)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleCellSave(cat.id, idx);
                                                            if (e.key === 'Escape') setEditingCell(null);
                                                        }}
                                                        className="w-full px-2 py-1 border rounded border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-slate-950 text-gray-900 dark:text-white text-right"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    formatCurrency(total)
                                                )}
                                            </td>
                                        ))}
                                        <td className="px-3 py-3 text-right text-sm font-bold bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100 border-l-2 border-blue-400 dark:border-blue-500">
                                            {formatCurrency(cat.monthlyTotals[currentMonthIndex] || 0)}
                                        </td>
                                        <td className="px-3 py-3 text-right text-sm font-bold bg-purple-50 dark:bg-purple-900/20 text-gray-900 dark:text-gray-100 border-l-2 border-purple-400 dark:border-purple-500">
                                            {formatCurrency(cat.monthlyTotals.reduce((sum: number, val: number) => sum + val, 0))}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-500 dark:bg-gray-600 text-white font-bold text-sm">
                                    <td className="px-4 py-2">TOTAL DESPESAS EXTRAS</td>
                                    {(monthlyData as MonthlyData).expense.extra.totals.map((total: number, idx: number) => (
                                        <td key={idx} className="px-3 py-2 text-right">{formatCurrency(total)}</td>
                                    ))}
                                    <td className="px-3 py-2 text-right bg-blue-600 dark:bg-blue-700 border-l-2 border-blue-400 dark:border-blue-500">
                                        {formatCurrency((monthlyData as MonthlyData).expense.extra.totals[currentMonthIndex] || 0)}
                                    </td>
                                    <td className="px-3 py-2 text-right bg-purple-600 dark:bg-purple-700 border-l-2 border-purple-400 dark:border-purple-500">
                                        {formatCurrency((monthlyData as MonthlyData).expense.extra.totals.reduce((sum: number, val: number) => sum + val, 0))}
                                    </td>
                                </tr>

                                {/* Investimentos */}
                                <tr 
                                    className="bg-gray-600 dark:bg-gray-700 text-white font-bold text-sm cursor-pointer hover:bg-gray-500 dark:hover:bg-gray-600"
                                    onClick={() => setAddCategoryModal({ type: 'expense', expenseType: 'investment' })}
                                >
                                    <td colSpan={15} className="px-4 py-2">INVESTIMENTOS</td>
                                </tr>
                                {(monthlyData as MonthlyData).expense.investment.categories.map((cat: any) => (
                                    <tr key={`expense-investment-${cat.id}`} className="border-b border-sidebar-border/70 dark:border-sidebar-border hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                        <td 
                                            className="px-4 py-3 font-medium cursor-pointer text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                                            onClick={() => setCategoryMenu({ catId: cat.id, catName: cat.name })}
                                        >
                                            {cat.name}
                                        </td>
                                        {cat.monthlyTotals.map((total: number, idx: number) => (
                                            <td 
                                                key={idx} 
                                                className="px-3 py-3 text-right text-sm cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-slate-700/50"
                                                onClick={() => handleCellEdit(cat.id, idx, total)}
                                            >
                                                {editingCell?.catId === cat.id && editingCell?.monthIdx === idx ? (
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onBlur={() => handleCellSave(cat.id, idx)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleCellSave(cat.id, idx);
                                                            if (e.key === 'Escape') setEditingCell(null);
                                                        }}
                                                        className="w-full px-2 py-1 border rounded border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-slate-950 text-gray-900 dark:text-white text-right"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    formatCurrency(total)
                                                )}
                                            </td>
                                        ))}
                                        <td className="px-3 py-3 text-right text-sm font-bold bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100 border-l-2 border-blue-400 dark:border-blue-500">
                                            {formatCurrency(cat.monthlyTotals[currentMonthIndex] || 0)}
                                        </td>
                                        <td className="px-3 py-3 text-right text-sm font-bold bg-purple-50 dark:bg-purple-900/20 text-gray-900 dark:text-gray-100 border-l-2 border-purple-400 dark:border-purple-500">
                                            {formatCurrency(cat.monthlyTotals.reduce((sum: number, val: number) => sum + val, 0))}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-500 dark:bg-gray-600 text-white font-bold text-sm">
                                    <td className="px-4 py-2">TOTAL INVESTIMENTOS</td>
                                    {(monthlyData as MonthlyData).expense.investment.totals.map((total: number, idx: number) => (
                                        <td key={idx} className="px-3 py-2 text-right">{formatCurrency(total)}</td>
                                    ))}
                                    <td className="px-3 py-2 text-right bg-blue-600 dark:bg-blue-700 border-l-2 border-blue-400 dark:border-blue-500">
                                        {formatCurrency((monthlyData as MonthlyData).expense.investment.totals[currentMonthIndex] || 0)}
                                    </td>
                                    <td className="px-3 py-2 text-right bg-purple-600 dark:bg-purple-700 border-l-2 border-purple-400 dark:border-purple-500">
                                        {formatCurrency((monthlyData as MonthlyData).expense.investment.totals.reduce((sum: number, val: number) => sum + val, 0))}
                                    </td>
                                </tr>

                                {/* Total Geral de Despesas */}
                                <tr className="bg-gray-600 dark:bg-gray-700 text-white font-bold">
                                    <td className="px-4 py-3">TOTAL DESPESAS</td>
                                    {(monthlyData as MonthlyData).expense.totals.map((total: number, idx: number) => (
                                        <td key={idx} className="px-3 py-3 text-right">{formatCurrency(total)}</td>
                                    ))}
                                    <td className="px-3 py-3 text-right bg-blue-600 dark:bg-blue-700 border-l-2 border-blue-400 dark:border-blue-500">
                                        {formatCurrency((monthlyData as MonthlyData).expense.totals[currentMonthIndex] || 0)}
                                    </td>
                                    <td className="px-3 py-3 text-right bg-purple-600 dark:bg-purple-700 border-l-2 border-purple-400 dark:border-purple-500">
                                        {formatCurrency((monthlyData as MonthlyData).expense.totals.reduce((sum: number, val: number) => sum + val, 0))}
                                    </td>
                                </tr>

                                {/* SALDO DETALHADO */}
                                <tr className="bg-blue-100 dark:bg-blue-900/20 font-bold text-sm">
                                    <td className="px-4 py-3">RECEITAS</td>
                                    {(monthlyData as MonthlyData).income.totals.map((total: number, idx: number) => (
                                        <td key={idx} className="px-3 py-3 text-right text-sm">{formatCurrency(total)}</td>
                                    ))}
                                    <td className="px-3 py-3 text-right text-sm border-l-2 border-blue-400 dark:border-blue-500">
                                        {formatCurrency((monthlyData as MonthlyData).income.totals[currentMonthIndex] || 0)}
                                    </td>
                                    <td className="px-3 py-3 text-right bg-purple-600 dark:bg-purple-700 border-l-2 border-purple-400 dark:border-purple-500">
                                        {formatCurrency((monthlyData as MonthlyData).income.totals.reduce((sum: number, val: number) => sum + val, 0))}
                                    </td>
                                </tr>

                                <tr className="bg-blue-100 dark:bg-blue-900/20 font-bold text-sm">
                                    <td className="px-4 py-3">INVESTIMENTOS</td>
                                    {(monthlyData as MonthlyData).expenseBreakdown.investment.map((total: number, idx: number) => (
                                        <td key={idx} className="px-3 py-3 text-right text-sm">{formatCurrency(total)}</td>
                                    ))}
                                    <td className="px-3 py-3 text-right text-sm border-l-2 border-blue-400 dark:border-blue-500">
                                        {formatCurrency((monthlyData as MonthlyData).expenseBreakdown.investment[currentMonthIndex] || 0)}
                                    </td>
                                    <td className="px-3 py-3 text-right bg-purple-600 dark:bg-purple-700 border-l-2 border-purple-400 dark:border-purple-500">
                                        {formatCurrency((monthlyData as MonthlyData).expenseBreakdown.investment.reduce((sum: number, val: number) => sum + val, 0))}
                                    </td>
                                </tr>

                                <tr className="bg-blue-100 dark:bg-blue-900/20 font-bold text-sm">
                                    <td className="px-4 py-3">DESPESAS FIXAS</td>
                                    {(monthlyData as MonthlyData).expenseBreakdown.fixed.map((total: number, idx: number) => (
                                        <td key={idx} className="px-3 py-3 text-right text-sm">{formatCurrency(-total)}</td>
                                    ))}
                                    <td className="px-3 py-3 text-right text-sm border-l-2 border-blue-400 dark:border-blue-500">
                                        {formatCurrency(-((monthlyData as MonthlyData).expenseBreakdown.fixed[currentMonthIndex] || 0))}
                                    </td>
                                    <td className="px-3 py-3 text-right bg-purple-600 dark:bg-purple-700 border-l-2 border-purple-400 dark:border-purple-500">
                                        {formatCurrency(-(monthlyData as MonthlyData).expenseBreakdown.fixed.reduce((sum: number, val: number) => sum + val, 0))}
                                    </td>
                                </tr>

                                <tr className="bg-blue-100 dark:bg-blue-900/20 font-bold text-sm">
                                    <td className="px-4 py-3">DESPESAS VARIÁVEIS</td>
                                    {(monthlyData as MonthlyData).expenseBreakdown.variable.map((total: number, idx: number) => (
                                        <td key={idx} className="px-3 py-3 text-right text-sm">{formatCurrency(-total)}</td>
                                    ))}
                                    <td className="px-3 py-3 text-right text-sm border-l-2 border-blue-400 dark:border-blue-500">
                                        {formatCurrency(-((monthlyData as MonthlyData).expenseBreakdown.variable[currentMonthIndex] || 0))}
                                    </td>
                                    <td className="px-3 py-3 text-right bg-purple-600 dark:bg-purple-700 border-l-2 border-purple-400 dark:border-purple-500">
                                        {formatCurrency(-(monthlyData as MonthlyData).expenseBreakdown.variable.reduce((sum: number, val: number) => sum + val, 0))}
                                    </td>
                                </tr>

                                <tr className="bg-blue-100 dark:bg-blue-900/20 font-bold text-sm">
                                    <td className="px-4 py-3">DESPESAS EXTRAS</td>
                                    {(monthlyData as MonthlyData).expenseBreakdown.extra.map((total: number, idx: number) => (
                                        <td key={idx} className="px-3 py-3 text-right text-sm">{formatCurrency(-total)}</td>
                                    ))}
                                    <td className="px-3 py-3 text-right text-sm border-l-2 border-blue-400 dark:border-blue-500">
                                        {formatCurrency(-((monthlyData as MonthlyData).expenseBreakdown.extra[currentMonthIndex] || 0))}
                                    </td>
                                    <td className="px-3 py-3 text-right bg-purple-600 dark:bg-purple-700 border-l-2 border-purple-400 dark:border-purple-500">
                                        {formatCurrency(-(monthlyData as MonthlyData).expenseBreakdown.extra.reduce((sum: number, val: number) => sum + val, 0))}
                                    </td>
                                </tr>

                                {/* SALDO FINAL */}
                                <tr className="bg-blue-100 dark:bg-blue-900/20 font-bold text-lg">
                                    <td className="px-4 py-3">SALDO</td>
                                    {(monthlyData as MonthlyData).balance.map((total: number, idx: number) => {
                                        const isPositive = total >= 0;
                                        return (
                                            <td key={idx} className={`px-3 py-3 text-right ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                                {formatCurrency(total)}
                                            </td>
                                        );
                                    })}
                                    {(() => {
                                        const currentBalance = (monthlyData as MonthlyData).balance[currentMonthIndex] || 0;
                                        const isPositive = currentBalance >= 0;
                                        return (
                                            <td className={`px-3 py-3 text-right bg-blue-600 dark:bg-blue-700 border-l-2 border-blue-400 dark:border-blue-500 ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
                                                {formatCurrency(currentBalance)}
                                            </td>
                                        );
                                    })()}
                                    {(() => {
                                        const yearlyTotal = (monthlyData as MonthlyData).balance.reduce((sum: number, val: number) => sum + val, 0);
                                        const isPositive = yearlyTotal >= 0;
                                        return (
                                            <td className={`px-3 py-3 text-right bg-purple-600 dark:bg-purple-700 border-l-2 border-purple-400 dark:border-purple-500 ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
                                                {formatCurrency(yearlyTotal)}
                                            </td>
                                        );
                                    })()}
                                </tr>
                            </tbody>
                        </table>
                        {/* Botão de deletar tabela */}
                        {selected && (
                            <div className="flex justify-end p-4 border-t border-sidebar-border/70 dark:border-sidebar-border">
                                <button
                                    onClick={() => {
                                        if (confirm(`Tem certeza que deseja deletar a tabela "${selected.name ?? selected.year}"? Esta ação não pode ser desfeita.`)) {
                                            router.delete(`/monthly-tabels/${selected.id}`);
                                        }
                                    }}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded font-semibold"
                                >
                                    🗑 Deletar Tabela
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Formulário de entrada */}
                {showAddEntry && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 border border-sidebar-border/70 dark:border-sidebar-border">
                            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Adicionar Valor</h3>
                            {!selected ? (
                                <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded">
                                    Selecione uma tabela antes de adicionar valores.
                                </div>
                            ) : (
                                <form onSubmit={handleAddEntry} className="space-y-4">
                                    <input type="hidden" name="monthly_tabel_id" value={selected.id} />
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mês</label>
                                            <select name="month" required className="w-full px-3 py-2 border rounded border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-slate-950 text-gray-900 dark:text-white">
                                                <option value="">Selecione o mês</option>
                                                {(monthlyData as MonthlyData).months && (monthlyData as MonthlyData).months.map((month: string, idx: number) => (
                                                    <option key={idx} value={String(idx + 1).padStart(2, '0')}>
                                                        {month}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categoria</label>
                                            <select name="category_id" required className="w-full px-3 py-2 border rounded border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-slate-950 text-gray-900 dark:text-white">
                                                <option value="">Selecione a categoria</option>
                                                {hasData && [
                                                    ...(monthlyData as MonthlyData).income.receipt.categories.map((cat: any) => ({ ...cat, type: 'income', income_type: 'receipt' })),
                                                    ...(monthlyData as MonthlyData).income.investment.categories.map((cat: any) => ({ ...cat, type: 'income', income_type: 'investment' })),
                                                    ...(monthlyData as MonthlyData).expense.fixed.categories.map((cat: any) => ({ ...cat, type: 'expense' })),
                                                    ...(monthlyData as MonthlyData).expense.variable.categories.map((cat: any) => ({ ...cat, type: 'expense' })),
                                                    ...(monthlyData as MonthlyData).expense.extra.categories.map((cat: any) => ({ ...cat, type: 'expense' })),
                                                ].map((cat: any) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name} ({cat.type === 'income' ? (cat.income_type === 'investment' ? 'Investimento' : 'Receita') : 'Despesa'})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Valor</label>
                                            <input name="amount" placeholder="0.00" step="0.01" required className="w-full px-3 py-2 border rounded border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-slate-950 text-gray-900 dark:text-white text-right" />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 justify-end">
                                        <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded">Adicionar</button>
                                        <button type="button" onClick={() => setShowAddEntry(false)} className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded">Cancelar</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}

                {/* Modal de ações de categoria */}
                {categoryMenu && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 max-w-md w-full mx-4 border border-sidebar-border/70 dark:border-sidebar-border">
                            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                                {renamingCategory ? 'Renomear Categoria' : 'Opções da Categoria'}
                            </h3>

                            {renamingCategory ? (
                                <>
                                    <input
                                        type="text"
                                        value={renamingCategory.newName}
                                        onChange={(e) => setRenamingCategory({ ...renamingCategory, newName: e.target.value })}
                                        placeholder="Novo nome"
                                        className="w-full px-3 py-2 border rounded border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-slate-950 text-gray-900 dark:text-white mb-4"
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRenameCategory(renamingCategory.catId)}
                                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                                        >
                                            Salvar
                                        </button>
                                        <button
                                            onClick={() => setRenamingCategory(null)}
                                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">Categoria: <strong className="text-gray-900 dark:text-white">{categoryMenu.catName}</strong></p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setRenamingCategory({ catId: categoryMenu.catId, newName: categoryMenu.catName })}
                                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                                        >
                                            ✏️ Renomear
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCategory(categoryMenu.catId)}
                                            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                                        >
                                            🗑 Deletar
                                        </button>
                                        <button
                                            onClick={() => setCategoryMenu(null)}
                                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                        >
                                            Fechar
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Modal de adicionar categoria via seção */}
                {addCategoryModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 max-w-md w-full mx-4 border border-sidebar-border/70 dark:border-sidebar-border">
                            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                                Criar Categoria
                            </h3>
                            <div className="space-y-4">
                                <input
                                    id="modal_cat_name"
                                    type="text"
                                    placeholder="Nome da categoria"
                                    className="w-full px-3 py-2 border rounded border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            const name = (document.getElementById('modal_cat_name') as HTMLInputElement)?.value;
                                            handleAddCategoryFromSection(name);
                                        }}
                                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                                    >
                                        Criar
                                    </button>
                                    <button
                                        onClick={() => setAddCategoryModal(null)}
                                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}