import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, DollarSign, Tag, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ExpenseModal({ isOpen, onClose, onSave, expense = null }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'fixed', // fixed or variable
    category: '',
    due_date: new Date().toISOString().split('T')[0],
    status: 'paid'
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description,
        amount: expense.amount,
        type: expense.type,
        category: expense.category || '',
        due_date: expense.due_date || new Date().toISOString().split('T')[0],
        status: expense.status || 'paid'
      });
    } else {
      setFormData({
        description: '',
        amount: '',
        type: 'fixed',
        category: '',
        due_date: new Date().toISOString().split('T')[0],
        status: 'paid'
      });
    }
  }, [expense, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        due_date: formData.due_date,
        status: formData.status
      };

      let error;
      if (expense?.id) {
        const { error: updateError } = await supabase
          .from('expenses')
          .update(dataToSave)
          .eq('id', expense.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('expenses')
          .insert([dataToSave]);
        error = insertError;
      }

      if (error) throw error;
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Error al guardar el gasto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">
            {expense ? 'Editar Gasto' : 'Nuevo Gasto'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Ej: Renta, Luz, Papelería..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  required
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Gasto</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'fixed' })}
                className={`py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  formData.type === 'fixed'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Gasto Fijo
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'variable' })}
                className={`py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  formData.type === 'variable'
                    ? 'bg-purple-50 border-purple-200 text-purple-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Gasto Variable
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría (Opcional)</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Ej: Servicios, Marketing, Nómina..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium flex items-center gap-2"
            >
              {loading ? 'Guardando...' : (
                <>
                  <Save size={18} />
                  Guardar Gasto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}