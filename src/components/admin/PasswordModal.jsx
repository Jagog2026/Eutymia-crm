import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Save, Loader, Eye, EyeOff, Key, AlertCircle, CheckCircle } from 'lucide-react';

export default function PasswordModal({ user, onClose, onSave }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    console.log('[PasswordModal] Changing password for user:', user.email);

    try {
      // Validaciones
      if (newPassword.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      // Actualizar contraseña en la base de datos
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', user.id);

      if (updateError) {
        console.error('[PasswordModal] Error updating password:', updateError);
        throw updateError;
      }

      console.log('[PasswordModal] Password updated successfully');
      setSuccess(true);

      // Cerrar modal después de 1.5 segundos
      setTimeout(() => {
        onSave();
      }, 1500);
    } catch (err) {
      console.error('[PasswordModal] Error:', err);
      setError(err.message || 'Error al cambiar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Key className="text-amber-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Cambiar Contraseña
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-1 rounded-lg hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">¡Contraseña actualizada!</p>
                <p className="text-sm text-green-700 mt-1">
                  La contraseña ha sido cambiada exitosamente.
                </p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Usuario:</strong> {user?.full_name || user?.email}
            </p>
            <p className="text-sm text-blue-700 mt-2">
              Establece una nueva contraseña para este usuario.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nueva Contraseña *
            </label>
            <div className="relative">
              <input
                type={showPasswords ? "text" : "password"}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={success}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 pr-10 disabled:bg-gray-100"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Contraseña *
            </label>
            <input
              type={showPasswords ? "text" : "password"}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={success}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100"
              placeholder="Repite la contraseña"
            />
          </div>

          {newPassword && confirmPassword && (
            <div className={`p-3 rounded-lg text-sm ${
              newPassword === confirmPassword
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {newPassword === confirmPassword ? (
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>Las contraseñas coinciden</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>Las contraseñas no coinciden</span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || success || newPassword !== confirmPassword}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading && <Loader className="animate-spin w-4 h-4" />}
              <Key size={18} />
              Cambiar Contraseña
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
