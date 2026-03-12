import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Save, Loader, Eye, EyeOff, UserPlus, Users, AlertCircle } from 'lucide-react';

export default function UserModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'reception',
    password: '',
    therapist_id: '',
    active: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [therapists, setTherapists] = useState([]);
  const [therapistMode, setTherapistMode] = useState('existing');
  const [newTherapist, setNewTherapist] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: ''
  });

  useEffect(() => {
    fetchTherapists();
  }, []);

  async function fetchTherapists() {
    try {
      const { data, error } = await supabase
        .from('therapists')
        .select('id, name, email')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      setTherapists(data || []);
    } catch (err) {
      console.error('Error fetching therapists:', err);
    }
  }

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        full_name: user.full_name || '',
        role: user.role || 'user',
        therapist_id: user.therapist_id || '',
        active: user.active !== false,
        password: '' // Password not editable directly for existing users here
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (user) {
        // Update existing user
        let therapistId = formData.therapist_id;
        if (formData.role === 'therapist' && therapistMode === 'new') {
          if (!newTherapist.name.trim()) {
            throw new Error('El nombre del terapeuta es obligatorio');
          }
          const { data: newT, error: therapistError } = await supabase
            .from('therapists')
            .insert([{
              name: newTherapist.name.trim(),
              email: newTherapist.email.trim() || user.email,
              phone: newTherapist.phone.trim() || null,
              specialty: newTherapist.specialty.trim() || null,
              role: 'therapist',
              active: true
            }])
            .select('id')
            .single();
          if (therapistError) throw new Error('Error al crear el terapeuta: ' + therapistError.message);
          therapistId = newT.id;
        }

        const { error: updateError } = await supabase
          .from('users')
          .update({
            full_name: formData.full_name,
            role: formData.role,
            therapist_id: formData.role === 'therapist' ? therapistId : null,
            active: formData.active
          })
          .eq('id', user.id);

        if (updateError) throw updateError;
      } else {
        // Create new user directly in users table
        if (!formData.password) {
          throw new Error('La contraseña es obligatoria para nuevos usuarios');
        }

        // Validar que si es terapeuta, tenga therapist_id o datos para crear
        let therapistId = formData.therapist_id;

        if (formData.role === 'therapist') {
          if (therapistMode === 'new') {
            if (!newTherapist.name.trim()) {
              throw new Error('El nombre del terapeuta es obligatorio');
            }
            const { data: newT, error: therapistError } = await supabase
              .from('therapists')
              .insert([{
                name: newTherapist.name.trim(),
                email: newTherapist.email.trim() || formData.email,
                phone: newTherapist.phone.trim() || null,
                specialty: newTherapist.specialty.trim() || null,
                role: 'therapist',
                active: true
              }])
              .select('id')
              .single();

            if (therapistError) {
              throw new Error('Error al crear el terapeuta: ' + therapistError.message);
            }
            therapistId = newT.id;
          } else if (!therapistId) {
            throw new Error('Debes seleccionar un terapeuta o crear uno nuevo');
          }
        }

        // Generar un UUID simple para el nuevo usuario
        const userId = crypto.randomUUID();

        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            role: formData.role,
            therapist_id: formData.role === 'therapist' ? therapistId : null,
            active: true
          });

        if (insertError) {
          if (insertError.code === '23505') {
            throw new Error('Ya existe un usuario con ese email');
          }
          throw insertError;
        }
      }
      
      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving user:', err);
      setError(err.message || 'Error al guardar el usuario');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            {user ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded text-sm">
              <p className="font-bold mb-2">📋 Instrucciones para crear el usuario:</p>
              <pre className="whitespace-pre-wrap text-xs bg-white p-2 rounded border mt-2 overflow-x-auto">
                {error}
              </pre>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(error.split('SQL:\n\n')[1] || error);
                  alert('SQL copiado al portapapeles');
                }}
                className="mt-2 text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
              >
                Copiar SQL
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              disabled={!!user}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña Inicial
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol de Acceso
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="admin">Administrador</option>
              <option value="therapist">Terapeuta</option>
              <option value="reception">Recepción</option>
            </select>
          </div>

          {formData.role === 'therapist' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <label className="block text-sm font-medium text-blue-900">
                Asociar con Terapeuta *
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setTherapistMode('existing'); setFormData({ ...formData, therapist_id: '' }); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    therapistMode === 'existing'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-100'
                  }`}
                >
                  <Users size={16} /> Existente
                </button>
                <button
                  type="button"
                  onClick={() => { setTherapistMode('new'); setFormData({ ...formData, therapist_id: '' }); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    therapistMode === 'new'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-100'
                  }`}
                >
                  <UserPlus size={16} /> Crear Nuevo
                </button>
              </div>

              {therapistMode === 'existing' ? (
                <>
                  <select
                    required={therapistMode === 'existing'}
                    value={formData.therapist_id}
                    onChange={(e) => setFormData({ ...formData, therapist_id: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar terapeuta...</option>
                    {therapists.map((therapist) => (
                      <option key={therapist.id} value={therapist.id}>
                        {therapist.name} ({therapist.email})
                      </option>
                    ))}
                  </select>
                  {therapists.length === 0 && (
                    <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded flex items-start gap-1">
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                      <span>No hay terapeutas registrados. Usa "Crear Nuevo" para registrar uno.</span>
                    </p>
                  )}
                </>
              ) : (
                <div className="space-y-3 bg-white rounded-lg p-3 border border-blue-200">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del Terapeuta *</label>
                    <input
                      type="text"
                      required
                      value={newTherapist.name}
                      onChange={(e) => setNewTherapist({ ...newTherapist, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Dra. María López"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                      <input
                        type="email"
                        value={newTherapist.email}
                        onChange={(e) => setNewTherapist({ ...newTherapist, email: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Mismo del usuario si se deja vacío"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                      <input
                        type="tel"
                        value={newTherapist.phone}
                        onChange={(e) => setNewTherapist({ ...newTherapist, phone: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Especialidad / Puesto</label>
                    <input
                      type="text"
                      value={newTherapist.specialty}
                      onChange={(e) => setNewTherapist({ ...newTherapist, specialty: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Tanatóloga, Psicóloga clínica"
                    />
                  </div>
                  <p className="text-xs text-blue-600 flex items-start gap-1">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>Se creará el terapeuta automáticamente al guardar.</span>
                  </p>
                </div>
              )}

              <p className="text-xs text-blue-700 flex items-start gap-1">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>El usuario solo verá la agenda de este terapeuta</span>
              </p>
            </div>
          )}

          {user && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                Usuario Activo
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50"
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