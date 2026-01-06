import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, DollarSign, TrendingUp, TrendingDown, Calendar, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ExpenseModal from './ExpenseModal';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, fixed, variable
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [stats, setStats] = useState({ total: 0, fixed: 0, variable: 0 });

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [expenses]);

  async function fetchExpenses() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('due_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateStats() {
    const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const fixed = expenses
      .filter(exp => exp.type === 'fixed')
      .reduce((sum, exp) => sum + Number(exp.amount), 0);
    const variable = expenses
      .filter(exp => exp.type === 'variable')
      .reduce((sum, exp) => sum + Number(exp.amount), 0);

    setStats({ total, fixed, variable });
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este gasto?')) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedExpense(null);
    setIsModalOpen(true);
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (expense.category && expense.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || expense.type === filterType;
    return matchesSearch && matchesType;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Control de Gastos</h1>
            <p className="text-gray-500">Gestiona tus gastos fijos y variables</p>
          </div>
          <button
            onClick={handleAdd}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center gap-2 font-medium transition-colors"
          >
            <Plus size={20} />
            Nuevo Gasto
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm font-medium">Total Gastos</span>
              <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total)}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border shadow-sm border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-600 text-sm font-medium">Gastos Fijos</span>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.fixed)}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.total > 0 ? Math.round((stats.fixed / stats.total) * 100) : 0}% del total
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border shadow-sm border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-600 text-sm font-medium">Gastos Variables</span>
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                <TrendingDown size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.variable)}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.total > 0 ? Math.round((stats.variable / stats.total) * 100) : 0}% del total
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Content */}
      <div className="flex-1 p-8 overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar gastos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div className="flex bg-white rounded-lg border p-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterType === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('fixed')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterType === 'fixed' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Fijos
            </button>
            <button
              onClick={() => setFilterType('variable')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterType === 'variable' ? 'bg-purple-50 text-purple-700' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Variables
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Monto</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      Cargando gastos...
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No se encontraron gastos
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{expense.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {expense.category ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {expense.category}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          expense.type === 'fixed' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {expense.type === 'fixed' ? 'Fijo' : 'Variable'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          {new Date(expense.due_date).toLocaleDateString('es-MX')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(expense)}
                            className="text-teal-600 hover:text-teal-900 p-1 hover:bg-teal-50 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchExpenses}
        expense={selectedExpense}
      />
    </div>
  );
}