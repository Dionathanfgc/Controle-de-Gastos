import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inicio',
        href: dashboard().url,
    },
];

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

export default function Dashboard() {
    const { props } = usePage<any>();
    const tables = props.tables ?? [];
    const selected = props.selected ?? null;
    const dashboardData = props.dashboardData ?? null;

    const [selectedTable, setSelectedTable] = useState<any>(selected);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    useEffect(() => {
        if (selected) {
            setSelectedTable(selected);
            localStorage.setItem('lastSelectedTableId', String(selected.id));
        }
    }, [selected]);

    const handleTableChange = (e: any) => {
        const tableId = e.currentTarget.value;
        window.location.href = `/dashboard?table=${tableId}`;
    };

    if (!dashboardData) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard" />
                <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                        Nenhuma tabela disponível. Crie uma nova tabela para começar.
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Seletor de Tabela */}
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <select
                        value={selectedTable?.id ?? ''}
                        onChange={handleTableChange}
                        className="px-3 py-2 border rounded text-black"
                    >
                        {tables.map((t: any) => (
                            <option key={t.id} value={t.id}>
                                {t.name ?? t.year}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Cards com Renda, Gasto e Saldo */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    {/* Card Renda */}
                    <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-blue-50 dark:bg-blue-900/20 p-6">
                        <div className="flex flex-col gap-2">
                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Renda Total</h3>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                {formatCurrency(dashboardData.totalIncome)}
                            </p>
                        </div>
                    </div>

                    {/* Card Gasto */}
                    <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-red-50 dark:bg-red-900/20 p-6">
                        <div className="flex flex-col gap-2">
                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Gasto Total</h3>
                            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(dashboardData.totalExpense)}
                            </p>
                        </div>
                    </div>

                    {/* Card Saldo */}
                    <div className={`rounded-xl border border-sidebar-border/70 dark:border-sidebar-border p-6 ${
                        dashboardData.balance >= 0
                            ? 'bg-green-50 dark:bg-green-900/20'
                            : 'bg-orange-50 dark:bg-orange-900/20'
                    }`}>
                        <div className="flex flex-col gap-2">
                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Saldo</h3>
                            <p className={`text-3xl font-bold ${
                                dashboardData.balance >= 0
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-orange-600 dark:text-orange-400'
                            }`}>
                                {formatCurrency(dashboardData.balance)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Gráfico de Gastos */}
                <div className="min-h-[400px] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border bg-white dark:bg-slate-950 p-6">
                    {dashboardData.categoryExpenses.length > 0 ? (
                        <div className="flex flex-col gap-4">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Gastos por Categoria</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={dashboardData.categoryExpenses}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {dashboardData.categoryExpenses.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <p>Nenhum gasto registrado ainda.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

