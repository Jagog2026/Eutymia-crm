import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Save, User, Phone, Mail, FileText, DollarSign, Globe } from 'lucide-react';

const SERVICES = [
  "Sesión individual presencial",
  "Sesión individual en línea",
  "Sesión pareja presencial",
  "Sesión pareja en línea",
  "Sesión familiar en línea",
  "Sesión familiar presencial",
  "Sesión a domicilio",
  "Taller",
  "Conferencia",
  "Curso"
];

const SOURCES = [
  "Facebook",
  "Instagram",
  "TikTok",
  "Google Ads",
  "Referido",
  "Orgánico",
  "Base General"
];

const WHATSAPP_LINES = [
  "WhatsApp 1",
  "WhatsApp 2",
  "WhatsApp 3"
];

const FACEBOOK_ACCOUNTS = [
  "Facebook 1",
  "Facebook 2",
  "Facebook 3"
];

export default function NewLeadModal({ isOpen, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    value: '',
    service: SERVICES[0],
    notes: '',
    source: SOURCES[0],
    whatsapp_line: WHATSAPP_LINES[0],
    facebook_account: FACEBOOK_ACCOUNTS[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [therapists, setTherapists] = useState([]);

  useEffect(() => {
    fetchTherapists();
  }, []);

  async function fetchTherapists() {
    try {
      const { data, error } = await supabase
        .from('therapists')
        .select('id, name')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      setTherapists(data || []);
    } catch (err) {
      console.error('Error fetching therapists:', err);
    }
  }

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          full_name: initialData.full_name || '',
          phone: initialData.phone || '',
          email: initialData.email || '',
          value: initialData.value || '',
          service: initialData.service || SERVICES[0],
          assigned_therapist_id: initialData.assigned_therapist_id || '',
          notes: initialData.notes || '',
          source: initialData.source || SOURCES[0],
          whatsapp_line: initialData.whatsapp_line || WHATSAPP_LINES[0],
          facebook_account: initialData.facebook_account || FACEBOOK_ACCOUNTS[0]
        });
      } else {
        setFormData({
          full_name: '',
          phone: '',
          email: '',
          value: '',
          service: SERVICES[0],
          assigned_therapist_id: '',
          notes: '',
          source: SOURCES[0],
          whatsapp_line: WHATSAPP_LINES[0],
          facebook_account: FACEBOOK_ACCOUNTS[0]
        });
      }
      setError(null);
      setLoading(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const dataToSave = {
        ...formData,
        value: formData.value === '' ? null : formData.value,
        assigned_therapist_id: formData.assigned_therapist_id === '' ? null : formData.assigned_therapist_id
      };
      await onSave(dataToSave);
      setFormData({
        full_name: '',
        phone: '',
        email: '',
        service: SERVICES[0],
        value: '',
        notes: '',
        source: SOURCES[0]
      });
      onClose();
    } catch (err) {
      console.error("Error al guardar el lead:", err);
      setError(err.message || 'Error al crear el lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">{initialData ? 'Editar Lead' : 'Nuevo Lead'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Paciente</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                required
                type="text"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Nombre completo"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="tel"
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="55 1234 5678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Estimado</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="number"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Servicio de Interés</label>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
            >
              {SERVICES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {formData.service && formData.service.toLowerCase().includes('sesión') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Terapeuta Asignado</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <select
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.assigned_therapist_id}
                  onChange={(e) => setFormData({ ...formData, assigned_therapist_id: e.target.value })}
                >
                  <option value="">Seleccionar terapeuta...</option>
                  {therapists.map(therapist => (
                    <option key={therapist.id} value={therapist.id}>{therapist.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origen (Source)</label>
            <div className="relative">
              <Globe className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <select
                required
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              >
                {SOURCES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Línea de WhatsApp</label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <select
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={formData.whatsapp_line}
                onChange={(e) => setFormData({ ...formData, whatsapp_line: e.target.value })}
              >
                {WHATSAPP_LINES.map(line => (
                  <option key={line} value={line}>{line}</option>
                ))}
              </select>
            </div>
          </div>

          {['Facebook', 'Instagram', 'TikTok'].includes(formData.source) && !formData.service.toLowerCase().includes('sesión') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta de Facebook</label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <select
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.facebook_account}
                  onChange={(e) => setFormData({ ...formData, facebook_account: e.target.value })}
                >
                  {FACEBOOK_ACCOUNTS.map(acc => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>
              </div>
            </div>
          )}



          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <textarea
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows="3"
                placeholder="Detalles adicionales..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Guardando...' : (<><Save size={18} /> {initialData ? 'Actualizar Lead' : 'Guardar Lead'}</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}