import React, { useState, useEffect } from 'react';
import { X, Lock, Calendar, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function BlockScheduleModal({ isOpen, onClose, onSave, initialDetails }) {
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (initialDetails?.id) { // Editing an existing block
        setReason(initialDetails.reason || '');
        setStartDate(formatDateTimeLocal(new Date(initialDetails.startDate)));
        setEndDate(formatDateTimeLocal(new Date(initialDetails.endDate)));
      } else { // Creating a new block
        const now = new Date();
        
        // Default start date/time
        let start = now;
        if (initialDetails.date) {
          start = new Date(initialDetails.date);
          if (initialDetails.time) {
            const [hours, minutes] = initialDetails.time.split(':');
            start.setHours(parseInt(hours), parseInt(minutes));
          }
        }
        
        // Default end date/time (1 hour later)
        const end = new Date(start);
        end.setHours(end.getHours() + 1);

        setStartDate(formatDateTimeLocal(start));
        setEndDate(formatDateTimeLocal(end));
        setReason('');
      }
      setError(null);
    }
  }, [isOpen, initialDetails]);

  const formatDateTimeLocal = (date) => {
    const d = new Date(date);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!reason.trim()) throw new Error('Por favor ingresa un motivo para el bloqueo.');
      if (!startDate) throw new Error('La fecha de inicio es requerida.');
      if (!endDate) throw new Error('La fecha de fin es requerida.');
      if (new Date(startDate) >= new Date(endDate)) throw new Error('La fecha de fin debe ser posterior a la fecha de inicio.');

      const start = new Date(startDate);
      const end = new Date(endDate);

      const appointmentData = {
        therapist_id: initialDetails?.therapistId || null, // If null, it might block for all or need handling
        patient_name: 'BLOQUEO',
        service: 'Bloqueo de Agenda',
        date: start.toISOString().split('T')[0],
        time: start.toTimeString().split(' ')[0].substring(0, 5),
        start_time: start.toISOString(),
        end_date: end.toISOString().split('T')[0],
        end_time: end.toISOString(),
        status: 'blocked',
        notes: reason,
        payment_status: 'na'
      };

      let error;
      if (initialDetails?.id) {
        const { error: updateError } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', initialDetails.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('appointments')
          .insert([appointmentData]);
        error = insertError;
      }

      if (error) throw error;

      onSave();
      onClose();
    } catch (err) {
      console.error('Error blocking schedule:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isEditing = initialDetails?.id;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Lock size={20} className="text-red-500" />
            {isEditing ? 'Modificar Bloqueo' : 'Bloquear Horario'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo del bloqueo
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              rows="3"
              placeholder="Ej: Vacaciones, Asuntos personales, Mantenimiento..."
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha y Hora de Inicio
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha y Hora de Fin
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                const s = new Date(startDate);
                s.setHours(8, 0, 0, 0);
                const e = new Date(startDate);
                e.setHours(19, 0, 0, 0);
                setStartDate(formatDateTimeLocal(s));
                setEndDate(formatDateTimeLocal(e));
              }}
              className="text-xs text-teal-600 hover:text-teal-800 underline"
            >
              Usar horario laboral (8:00 AM - 7:00 PM)
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Bloquear Horario')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}