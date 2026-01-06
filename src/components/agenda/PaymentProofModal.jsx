import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Check, AlertCircle, Loader, DollarSign } from 'lucide-react';

export default function PaymentProofModal({ isOpen, onClose, appointmentId, onProofUploaded }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleRegisterPayment = async () => {
    if (!appointmentId) {
      setError('ID de cita no válido.');
      return;
    }

    console.log('[PaymentProof] Registering payment for appointment:', appointmentId);
    setLoading(true);
    setError(null);

    try {
      // Update Appointment Record - mark as paid
      console.log('[PaymentProof] Updating appointment record with payment info');
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          payment_status: 'paid',
          payment_date: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (updateError) {
        console.error('[PaymentProof] Database update error:', updateError);
        throw updateError;
      }

      console.log('[PaymentProof] Payment registered successfully');
      // Success
      if (onProofUploaded) {
        console.log('[PaymentProof] Calling onProofUploaded callback to refresh reports');
        onProofUploaded();
      }
      onClose();

    } catch (err) {
      console.error('[PaymentProof] Error registering payment:', err);
      setError('Error al registrar el pago. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <DollarSign className="text-green-600" size={24} />
          Registrar Pago
        </h2>

        <p className="text-sm text-gray-600 mb-6">
          ¿Confirmas que esta cita ha sido <strong>pagada</strong>?
        </p>

        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleRegisterPayment}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Confirmar Pago
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}