import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Save, Loader, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function UserModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'user',
    password: '',
    therapist_id: '',
    active: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [therapists, setTherapists] = useState([]);

  useEffect(() => {
    fetchTherapists();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        full_name: user.full_name || '',
        role: user.role || 'user',
        therapist_id: user.therapist_id || '',
        active: user.active !== false,
        password: ''
      });
    }
  }, [user]);

  async function fetchTherapists() {
    console.log('[UserModal] Fetching therapists...');
    try {
      const { data, error } = await supabase
        .from('therapists')
        .select('id, name, email')
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('[UserModal] Error fetching therapists:', error);
        throw error;
      }

      console.log('[UserModal] Therapists fetched:', data);
      setTherapists(data || []);
    } catch (err) {
      console.error('[UserModal] Error:', err);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    console.log('[UserModal] Submitting form:', { ...formData, password: '***' });

    try {
      if (user) {
        // Update existing user
        console.log('[UserModal] Updating user:', user.id);
        const { error: updateError } = await supabase
          .from('users')
          .update({
            full_name: formData.full_name,
            role: formData.role,
            therapist_id: formData.role === 'therapist' ? formData.therapist_id : null,
            active: formData.active
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('[UserModal] Error updating user:', updateError);
          throw updateError;
        }

        console.log('[UserModal] User updated successfully');
      } else {
        // Create new user
        if (!formData.password) {
          throw new Error('La contraseña es obligatoria para nuevos usuarios');
        }

        if (formData.role === 'therapist' && !formData.therapist_id) {
          throw new Error('Debes seleccionar un terapeuta para asociar');
        }

        console.log('[UserModal] Creating new user');
        const userId = crypto.randomUUID();

        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            role: formData.role,
            therapist_id: formData.role === 'therapist' ? formData.therapist_id : null,
            active: true
          });

        if (insertError) {
          console.error('[UserModal] Error creating user:', insertError);
          if (insertError.code === '23505') {
            throw new Error('Ya existe un usuario con ese email');
          }
          throw insertError;
        }

        console.log('[UserModal] User created successfully');
      }

      onSave();
    } catch (err) {
      console.error('[UserModal] Error:', err);
      setError(err.message || 'Error al guardar el usuario');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h3 className="text-xl font-semibold text-gray-900">
            {user ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h3>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico *
            </label>
            <input
              type="email"
              required
              disabled={!!user}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              placeholder="usuario@ejemplo.com"
            />
            {user && (
              <p className="text-xs text-gray-500 mt-1">El email no se puede modificar después de crear el usuario</p>
            )}
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña Inicial *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 pr-10"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                El usuario podrá cambiar su contraseña después de iniciar sesión
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol de Acceso *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value, therapist_id: '' })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="user">Usuario Estándar</option>
              <option value="admin">Administrador</option>
              <option value="therapist">Terapeuta</option>
              <option value="reception">Recepción</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.role === 'admin' && 'Acceso completo al sistema'}
              {formData.role === 'therapist' && 'Solo puede ver su propia agenda'}
              {formData.role === 'reception' && 'Acceso limitado a funciones de recepción'}
              {formData.role === 'user' && 'Acceso básico al sistema'}
            </p>
          </div>

          {formData.role === 'therapist' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Asociar con Terapeuta *
              </label>
              <select
                required={formData.role === 'therapist'}
                value={formData.therapist_id}
                onChange={(e) => setFormData({ ...formData, therapist_id: e.target.value })}
                className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar terapeuta...</option>
                {therapists.map((therapist) => (
                  <option key={therapist.id} value={therapist.id}>
                    {therapist.name} ({therapist.email})
                  </option>
                ))}
              </select>
              <p className="text-xs text-blue-700 mt-2 flex items-start gap-1">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>Este usuario solo podrá ver y gestionar la agenda del terapeuta seleccionado</span>
              </p>
            </div>
          )}

          {user && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-5 w-5 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-900">
                Usuario Activo
              </label>
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
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading && <Loader className="animate-spin w-4 h-4" />}
              <Save size={18} />
              {user ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
