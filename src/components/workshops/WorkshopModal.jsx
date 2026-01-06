import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Calendar, Users, DollarSign, Clock, Image, Trash2, Save, Type, Globe } from 'lucide-react';

export default function WorkshopModal({ workshop, onClose, onSave, onDelete }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    duration_minutes: 60,
    max_attendees: 10,
    price: 0,
    image_url: '',
    type: 'Taller',
    modality: 'Presencial',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (workshop) {
      setFormData({
        title: workshop.title || '',
        description: workshop.description || '',
        date: workshop.date ? new Date(workshop.date).toISOString().slice(0, 16) : '',
        duration_minutes: workshop.duration_minutes || 60,
        max_attendees: workshop.max_attendees || 10,
        price: workshop.price || 0,
        image_url: workshop.image_url || '',
        type: workshop.type || 'Taller',
        modality: workshop.modality || 'Presencial',
      });
    }
  }, [workshop]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    if (!formData.date) {
      setError('Por favor selecciona una fecha y hora.');
      setLoading(false);
      return;
    }

    try {
      const workshopData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        price: formData.price ? parseFloat(formData.price) : 0,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : 60,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : 10,
      };

      if (workshop && workshop.id) {
        const { error } = await supabase.from('workshops').update(workshopData).eq('id', workshop.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('workshops').insert(workshopData);
        if (error) throw error;
      }
      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving workshop:', err);
      setError('Error al guardar el taller: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!workshop || !workshop.id) return;
    if (window.confirm('¿Estás seguro de que quieres eliminar este taller?')) {
      setLoading(true);
      setError(null);
      try {
        await supabase.from('workshops').delete().eq('id', workshop.id);
        onDelete();
        onClose();
      } catch (err) {
        console.error('Error deleting workshop:', err);
        setError('Error al eliminar el taller. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-teal-600 mb-6">{workshop ? 'Editar Taller' : 'Nuevo Taller'}</h2>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Fecha y Hora</label>
            <input
              type="datetime-local"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700">Duración (minutos)</label>
            <input
              type="number"
              id="duration_minutes"
              name="duration_minutes"
              value={formData.duration_minutes}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label htmlFor="max_attendees" className="block text-sm font-medium text-gray-700">Máx. Asistentes</label>
            <input
              type="number"
              id="max_attendees"
              name="max_attendees"
              value={formData.max_attendees}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Precio</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label htmlFor="image_url" className="block text-sm font-medium text-gray-700">URL Imagen</label>
            <input
              type="text"
              id="image_url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipo</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="Taller">Taller</option>
              <option value="Conferencia">Conferencia</option>
              <option value="Curso">Curso</option>
            </select>
          </div>
          <div>
            <label htmlFor="modality" className="block text-sm font-medium text-gray-700">Modalidad</label>
            <select
              id="modality"
              name="modality"
              value={formData.modality}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="Presencial">Presencial</option>
              <option value="En línea">En línea</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          ></textarea>
        </div>

        <div className="flex justify-between items-center">
          {workshop && workshop.id && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
            >
              <Trash2 size={20} /> Eliminar
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 ml-auto"
          >
            <Save size={20} /> {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}