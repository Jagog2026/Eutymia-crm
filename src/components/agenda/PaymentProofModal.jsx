import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Check, AlertCircle, Loader, DollarSign, User, Calendar, Clock } from 'lucide-react';

export default function PaymentProofModal({ isOpen, onClose, appointment, onProofUploaded }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState('');

  if (!isOpen) return null;

  const appointmentId = appointment?.id;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long' });
  };

  const handleRegisterPayment = async () => {
    if (!appointmentId) { setError('ID de cita no válido.'); return; }
    setLoading(true);
    setError(null);
    try {
      const updates = {
        payment_status: 'paid',
        payment_date: new Date().toISOString(),
      };
      if (amount && !isNaN(parseFloat(amount))) {
        updates.estimated_value = parseFloat(amount);
      }

      const { error: updateError } = await supabase
        .from('appointments').update(updates).eq('id', appointmentId);
      if (updateError) throw updateError;

      if (onProofUploaded) onProofUploaded();
      onClose();
    } catch (err) {
      setError('Error al registrar el pago. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <DollarSign size={18} className="text-emerald-500" />
            Registrar Pago
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Appointment summary */}
        {appointment && (
          <div className="mx-5 mt-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <User size={14} className="text-slate-400 shrink-0" />
              <span className="font-semibold truncate">{appointment.patient_name}</span>
            </div>
            {appointment.service && (
              <div className="text-xs text-slate-500 dark:text-slate-400 pl-5">{appointment.service}</div>
            )}
            <div className="flex items-center gap-4 pl-5">
              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Calendar size={12} /> {formatDate(appointment.date)}
              </span>
              {appointment.time && (
                <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <Clock size={12} /> {appointment.time}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Amount */}
        <div className="px-5 mt-4">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Monto cobrado (MXN) <span className="font-normal text-slate-400">— opcional</span>
          </label>
          <div className="relative">
            <DollarSign size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="number" min="0" step="50"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={appointment?.estimated_value ? String(appointment.estimated_value) : '0'}
              className="block w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mt-3 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 px-5 py-4 mt-2">
          <button onClick={onClose} disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            Cancelar
          </button>
          <button onClick={handleRegisterPayment} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm">
            {loading ? <><Loader size={14} className="animate-spin" /> Registrando...</> : <><Check size={14} /> Confirmar pago</>}
          </button>
        </div>
      </div>
    </div>
  );
}
