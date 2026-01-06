import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, Save, Clock, CheckSquare, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const DAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
];

const SERVICES_LIST = [
  'Sesión individual presencial',
  'Sesión individual en línea',
  'Sesión pareja presencial',
  'Sesión pareja en línea',
  'Sesión familiar presencial',
  'Sesión familiar en línea',
  'Sesión a domicilio',
  'Taller',
  'Conferencia',
  'Curso'
];

const HOURS = Array.from({ length: 29 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7; // Start at 7:00
  const minute = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}`;
});

export default function TherapistModal({ isOpen, onClose, therapist, onSave, onDelete }) {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    role: 'therapist',
    photo_url: '',
    schedule: {},
    services: [],
    commissions: {}
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (therapist) {
      setFormData({
        name: therapist.name || '',
        email: therapist.email || '',
        phone: therapist.phone || '',
        specialty: therapist.specialty || '',
        role: therapist.role || 'therapist',
        photo_url: therapist.photo_url || '',
        schedule: therapist.schedule || {},
        services: Array.isArray(therapist.services) ? therapist.services : [],
        commissions: therapist.commissions || {}
      });
    } else {
      // Default schedule
      const defaultSchedule = {};
      DAYS.forEach(day => {
        defaultSchedule[day.key] = { active: true, start: '09:00', end: '18:00' };
      });
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'therapist',
        photo_url: '',
        schedule: defaultSchedule,
        services: [],
        commissions: {}
      });
    }
  }, [therapist, isOpen]);

  const handlePhotoUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('therapist-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('therapist-photos').getPublicUrl(filePath);
      setFormData({ ...formData, photo_url: data.publicUrl });
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error al subir la foto');
    } finally {
      setUploading(false);
    }
  };

  const handleScheduleChange = (dayKey, field, value) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [dayKey]: {
          ...prev.schedule[dayKey],
          [field]: value
        }
      }
    }));
  };

  const toggleService = (service) => {
    setFormData(prev => {
      const services = prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service];
      return { ...prev, services };
    });
  };

  const handleCommissionChange = (service, amount) => {
    setFormData(prev => ({
      ...prev,
      commissions: {
        ...prev.commissions,
        [service]: amount
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {therapist ? 'Editar Terapeuta' : 'Nuevo Terapeuta'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${activeTab === 'general' ? 'border-b-2 border-teal-500 text-teal-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <User size={16} /> Datos Básicos
            </div>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${activeTab === 'schedule' ? 'border-b-2 border-teal-500 text-teal-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock size={16} /> Horarios
            </div>
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${activeTab === 'services' ? 'border-b-2 border-teal-500 text-teal-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <CheckSquare size={16} /> Servicios
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                    {formData.photo_url ? (
                      <img src={formData.photo_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User size={48} />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-teal-500 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-teal-600 transition-colors">
                    <Upload size={16} />
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Puesto (ej. Tanatólogo/a)</label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol de Acceso</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="admin">Administrador (Acceso Total)</option>
                    <option value="reception">Recepción (Sin Reportes/Gastos)</option>
                    <option value="therapist">Terapeuta (Solo Agenda)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-4">
              {DAYS.map((day) => (
                <div key={day.key} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-32 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.schedule[day.key]?.active || false}
                      onChange={(e) => handleScheduleChange(day.key, 'active', e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="font-medium text-gray-700">{day.label}</span>
                  </div>
                  
                  {formData.schedule[day.key]?.active && (
                    <div className="flex items-center gap-2 flex-1">
                      <select
                        value={formData.schedule[day.key]?.start || '09:00'}
                        onChange={(e) => handleScheduleChange(day.key, 'start', e.target.value)}
                        className="p-2 border rounded-md text-sm"
                      >
                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <span className="text-gray-400">-</span>
                      <select
                        value={formData.schedule[day.key]?.end || '18:00'}
                        onChange={(e) => handleScheduleChange(day.key, 'end', e.target.value)}
                        className="p-2 border rounded-md text-sm"
                      >
                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-3">
              {SERVICES_LIST.map((service) => (
                <div key={service} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={formData.services.includes(service)}
                      onChange={() => toggleService(service)}
                      className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-gray-700">{service}</span>
                  </label>
                  
                  {formData.services.includes(service) && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Comisión: $</span>
                      <input
                        type="number"
                        value={formData.commissions[service] || ''}
                        onChange={(e) => handleCommissionChange(service, e.target.value)}
                        placeholder="0.00"
                        className="w-24 p-1 border rounded text-right focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          {therapist && onDelete ? (
            <button
              onClick={() => {
                if (window.confirm('¿Estás seguro de eliminar este terapeuta?')) {
                  onDelete(therapist.id);
                }
              }}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 size={18} /> Eliminar
            </button>
          ) : <div></div>}
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors shadow-sm"
            >
              <Save size={18} /> Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}