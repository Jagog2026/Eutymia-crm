import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Phone, Mail, Edit2, Plus, Percent, Calendar, CheckSquare } from 'lucide-react';
import TherapistModal from './TherapistModal';

export default function Therapists() {
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState(null);

  useEffect(() => {
    fetchTherapists();
  }, []);

  const fetchTherapists = async () => {
    setLoading(true);
    const { data } = await supabase.from('therapists').select('*').order('name');
    if (data) setTherapists(data);
    setLoading(false);
  };

  const handleAdd = () => {
    setSelectedTherapist(null);
    setIsModalOpen(true);
  };

  const handleEdit = (therapist) => {
    setSelectedTherapist(therapist);
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      if (selectedTherapist) {
        const { error } = await supabase
          .from('therapists')
          .update(formData)
          .eq('id', selectedTherapist.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('therapists')
          .insert([formData]);
        if (error) throw error;
      }
      fetchTherapists();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving therapist:', error);
      alert('Error al guardar el terapeuta');
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('therapists')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      fetchTherapists();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error deleting therapist:', error);
      alert('Error al eliminar el terapeuta');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Equipo de Terapeutas</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors shadow-sm"
        >
          <Plus size={20} /> Nuevo Terapeuta
        </button>
      </div>
      
      <div className="overflow-y-auto max-h-[calc(100vh-200px)] pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {therapists.map(therapist => (
          <div key={therapist.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow group">
            <div className="h-24 bg-teal-500 relative">
              <div className="absolute -bottom-10 left-6">
                <div className="w-20 h-20 rounded-full bg-white p-1 shadow-md">
                  <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {therapist.photo_url ? (
                      <img src={therapist.photo_url} alt={therapist.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={32} className="text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleEdit(therapist)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
              >
                <Edit2 size={16} />
              </button>
            </div>
            
            <div className="pt-12 px-6 pb-6 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{therapist.name}</h3>
                <p className="text-teal-600 text-sm font-medium">{therapist.specialty || 'Terapeuta'}</p>
              </div>
              
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone size={16} className="text-gray-400" />
                  {therapist.phone || 'Sin teléfono'}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail size={16} className="text-gray-400" />
                  {therapist.email || 'Sin email'}
                </div>

              </div>

              <div className="flex gap-2 pt-2">
                <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
                    <Calendar size={12} /> Horarios
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {Object.values(therapist.schedule || {}).filter(d => d.active).length} días
                  </span>
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
                    <CheckSquare size={12} /> Servicios
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {(therapist.services || []).length} activos
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>

      <TherapistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        therapist={selectedTherapist}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}