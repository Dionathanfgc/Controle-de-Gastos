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
    };
    expense: {
        categories: any[];
        totals: number[];
    };
    balance: number[];
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
    const [editingCell, setEditingCell] = useState<{ catId: number; monthIdx: number } | null>(null);
    const [editValue, setEditValue] = useState('');
    const [categoryMenu, setCategoryMenu] = useState<{ catId: number; catName: string } | null>(null);
    const [renamingCategory, setRenamingCategory] = useState<{ catId: number; newName: string } | null>(null);

    const hasData = Object.keys(monthlyData).length > 0;

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

    // Salvar última tabela selecionada em localStorage
    useEffect(() => {
        if (selected) {
            localStorage.setItem('lastSelectedTableId', String(selected.id));
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
                                className="px-3 py-2 border rounded text-black"
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
                    <Form method="post" action="/monthly-tabels/tables" className="bg-gray-100 p-4 rounded space-y-3">
                        {errors.year && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                {errors.year}
                            </div>
                        )}
                        <div className="grid grid-cols-3 gap-3">
                            <input type="number" name="year" value={newYear} onChange={(e) => setNewYear(Number(e.target.value))} placeholder="Ano" className="col-span-1 px-3 py-2 border rounded text-black" required />
                            <input name="name" value={newTableName} onChange={(e) => setNewTableName(e.target.value)} placeholder="Nome da tabela (opcional)" className="col-span-1 px-3 py-2 border rounded text-black" />
                            <button type="submit" className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded">Criar Tabela</button>
                        </div>
                    </Form>
                )}

                {/* Formulário de categoria */}
                {showAddCategory && (
                    <>
                        {!selected ? (
                            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                                Selecione uma tabela antes de adicionar categorias.
                            </div>
                        ) : (
                            <div className="bg-gray-100 p-4 rounded space-y-3">
                                {errors.name && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                        {errors.name}
                                    </div>
                                )}
                                <div className="grid grid-cols-3 gap-3">
                                    <input 
                                        id="cat_name" 
                                        name="name" 
                                        placeholder="Nome da categoria" 
                                        className="col-span-1 px-3 py-2 border rounded text-black" 
                                        required 
                                    />
                                    <select 
                                        id="cat_type" 
                                        name="type" 
                                        className="col-span-1 px-3 py-2 border rounded text-black"
                                        defaultValue="expense"
                                    >
                                        <option value="income">Renda</option>
                                        <option value="expense">Gasto</option>
                                    </select>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const name = (document.getElementById('cat_name') as HTMLInputElement)?.value;
                                            const type = (document.getElementById('cat_type') as HTMLSelectElement)?.value;
                                            
                                            if (!name) {
                                                alert('Digite um nome para a categoria');
                                                return;
                                            }
                                            
                                            router.post('/monthly-tabels/categories', {
                                                monthly_tabel_id: selected?.id,
                                                name,
                                                type,
                                            }, {
                                                onSuccess: () => {
                                                    (document.getElementById('cat_name') as HTMLInputElement).value = '';
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
                    <div className="bg-gray-50 p-8 rounded text-center">
                        <p className="text-gray-500">Nenhuma tabela selecionada ou tabela vazia.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto border rounded">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-800 text-white">
                                    <th className="px-4 py-3 text-left w-48">Categoria</th>
                                    {(monthlyData as MonthlyData).months.map((month: string, idx: number) => (
                                        <th key={idx} className="px-3 py-3 text-right min-w-24">{month.slice(0, 3).toUpperCase()}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {/* Seção RENDA */}
                                <tr className="bg-blue-900 text-white font-bold">
                                    <td colSpan={13} className="px-4 py-3">RENDA</td>
                                </tr>
                                {(monthlyData as MonthlyData).income.categories.map((cat: any) => (
                                    <tr key={`income-${cat.id}`} className="border-b hover:bg-gray-50">
                                        <td 
                                            className="px-4 py-3 font-medium cursor-pointer hover:text-blue-600"
                                            onClick={() => setCategoryMenu({ catId: cat.id, catName: cat.name })}
                                        >
                                            {cat.name}
                                        </td>
                                        {cat.monthlyTotals.map((total: number, idx: number) => (
                                            <td 
                                                key={idx} 
                                                className="px-3 py-3 text-right text-sm cursor-pointer hover:bg-blue-100"
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
                                                        className="w-full px-2 py-1 border rounded text-black text-right"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    formatCurrency(total)
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                <tr className="bg-blue-700 text-white font-bold">
                                    <td className="px-4 py-3">TOTAL RENDA</td>
                                    {(monthlyData as MonthlyData).income.totals.map((total: number, idx: number) => (
                                        <td key={idx} className="px-3 py-3 text-right">{formatCurrency(total)}</td>
                                    ))}
                                </tr>

                                {/* Seção GASTOS */}
                                <tr className="bg-gray-700 text-white font-bold">
                                    <td colSpan={13} className="px-4 py-3">GASTOS</td>
                                </tr>
                                {(monthlyData as MonthlyData).expense.categories.map((cat: any) => (
                                    <tr key={`expense-${cat.id}`} className="border-b hover:bg-gray-50">
                                        <td 
                                            className="px-4 py-3 font-medium cursor-pointer hover:text-blue-600"
                                            onClick={() => setCategoryMenu({ catId: cat.id, catName: cat.name })}
                                        >
                                            {cat.name}
                                        </td>
                                        {cat.monthlyTotals.map((total: number, idx: number) => (
                                            <td 
                                                key={idx} 
                                                className="px-3 py-3 text-right text-sm cursor-pointer hover:bg-gray-200"
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
                                                        className="w-full px-2 py-1 border rounded text-black text-right"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    formatCurrency(total)
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                <tr className="bg-gray-600 text-white font-bold">
                                    <td className="px-4 py-3">TOTAL GASTOS</td>
                                    {(monthlyData as MonthlyData).expense.totals.map((total: number, idx: number) => (
                                        <td key={idx} className="px-3 py-3 text-right">{formatCurrency(total)}</td>
                                    ))}
                                </tr>

                                {/* Linha SALDO */}
                                <tr className="bg-blue-500 text-white font-bold text-lg">
                                    <td className="px-4 py-3">SALDO</td>
                                    {(monthlyData as MonthlyData).balance.map((total: number, idx: number) => (
                                        <td key={idx} className="px-3 py-3 text-right">{formatCurrency(total)}</td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Formulário de entrada */}
                {showAddEntry && (
                    <>
                        {!selected ? (
                            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                                Selecione uma tabela antes de adicionar valores.
                            </div>
                        ) : (
                            <form onSubmit={handleAddEntry} className="bg-gray-100 p-4 rounded space-y-3">
                                <input type="hidden" name="monthly_tabel_id" value={selected.id} />
                                <div className="grid grid-cols-4 gap-3">
                                    <select name="month" required className="col-span-1 px-3 py-2 border rounded text-black">
                                        <option value="">Selecione o mês</option>
                                        {(monthlyData as MonthlyData).months && (monthlyData as MonthlyData).months.map((month: string, idx: number) => (
                                            <option key={idx} value={String(idx + 1).padStart(2, '0')}>
                                                {month}
                                            </option>
                                        ))}
                                    </select>
                                    <select name="category_id" required className="col-span-1 px-3 py-2 border rounded text-black">
                                        <option value="">Selecione a categoria</option>
                                        {hasData && [...(monthlyData as MonthlyData).income.categories, ...(monthlyData as MonthlyData).expense.categories].map((cat: any) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name} ({cat.type === 'income' ? 'Renda' : 'Gasto'})
                                            </option>
                                        ))}
                                    </select>
                                    <input name="amount" placeholder="0.00" step="0.01" required className="col-span-1 px-3 py-2 border rounded text-right text-black" />
                                    <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Adicionar</button>
                                </div>
                            </form>
                        )}
                    </>
                )}

                {/* Botão de deletar tabela - posição fixa inferior direita */}
                {selected && (
                    <div className="fixed bottom-8 right-8">
                        <button
                            onClick={() => {
                                if (confirm(`Tem certeza que deseja deletar a tabela "${selected.name ?? selected.year}"? Esta ação não pode ser desfeita.`)) {
                                    router.delete(`/monthly-tabels/${selected.id}`);
                                }
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded shadow-lg font-semibold"
                        >
                            🗑 Deletar Tabela
                        </button>
                    </div>
                )}

                {/* Modal de ações de categoria */}
                {categoryMenu && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-bold mb-4 text-black">
                                {renamingCategory ? 'Renomear Categoria' : 'Opções da Categoria'}
                            </h3>

                            {renamingCategory ? (
                                <>
                                    <input
                                        type="text"
                                        value={renamingCategory.newName}
                                        onChange={(e) => setRenamingCategory({ ...renamingCategory, newName: e.target.value })}
                                        placeholder="Novo nome"
                                        className="w-full px-3 py-2 border rounded text-black mb-4"
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
                                    <p className="text-gray-600 mb-4">Categoria: <strong>{categoryMenu.catName}</strong></p>
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
                )}            </div>
        </AppLayout>
    );
}