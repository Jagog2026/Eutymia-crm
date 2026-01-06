import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Plus, Phone, Mail, CheckSquare, Square } from 'lucide-react';
import NewLeadModal from './NewLeadModal';
import BulkEmailModal from './BulkEmailModal';
import BulkWhatsAppModal from './BulkWhatsAppModal';
import LeadTasksModal from './LeadTasksModal';
import LeadCard from './LeadCard';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedLead, setDraggedLead] = useState(null);
  const [draggedStage, setDraggedStage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkEmailModalOpen, setIsBulkEmailModalOpen] = useState(false);
  const [isBulkWhatsAppModalOpen, setIsBulkWhatsAppModalOpen] = useState(false);
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [tasksLead, setTasksLead] = useState(null);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [editingLead, setEditingLead] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Configuración de columnas (Stages)
  // 'contacted' eliminado. 'general_base' movido al final.
  const [stages, setStages] = useState([
    { id: 'new', name: 'Nuevo', color: 'bg-teal-100 text-teal-800' },
    { id: 'scheduled', name: 'Agendado', color: 'bg-purple-100 text-purple-800' },
    { id: 'paid', name: 'Pagado', color: 'bg-green-100 text-green-800' },
    { id: 'lost', name: 'Perdido', color: 'bg-red-100 text-red-800' },
    { id: 'partners', name: 'Aliados/Proveedores', color: 'bg-blue-100 text-blue-800' },
    { id: 'px_agpro', name: 'Px AgPro', color: 'bg-indigo-100 text-indigo-800' },
    { id: 'general_base', name: 'Base General', color: 'bg-gray-100 text-gray-800' }
  ]);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Intento 1: Consulta robusta incluyendo la relación con terapeutas
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*, therapists(name)')
          .order('created_at', { ascending: false });
        
        if (error) throw error;

        if (data) {
          const leadsWithTherapistNames = data.map(lead => ({
            ...lead,
            assigned_therapist_name: lead.therapists ? lead.therapists.name : 'N/A'
          }));
          setLeads(leadsWithTherapistNames);
        } else {
          setLeads([]);
        }
      } catch (relationError) {
        console.warn('Error fetching leads with relation, trying simple fetch:', relationError);
        
        // Intento 2: Fallback sin relación (si falla la tabla therapists o la FK)
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          // Sin nombres de terapeutas
          const leadsSimple = data.map(lead => ({
            ...lead,
            assigned_therapist_name: 'N/A (Error de carga)'
          }));
          setLeads(leadsSimple);
        } else {
          setLeads([]);
        }
      }
    } catch (err) {
      console.error('Critical error fetching leads:', err);
      setError('Error al cargar los leads. Por favor, verifica tu conexión o contacta soporte.');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, lead) => {
    e.stopPropagation();
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleStageDragStart = (e, stage) => {
    setDraggedStage(stage);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetStageId) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedLead) {
      if (draggedLead.status === targetStageId) return;

      // Optimistic update
      const updatedLeads = leads.map(l => 
        l.id === draggedLead.id ? { ...l, status: targetStageId } : l
      );
      setLeads(updatedLeads);

      const { error } = await supabase
        .from('leads')
        .update({ status: targetStageId })
        .eq('id', draggedLead.id);

      if (error) {
        console.error('Error updating lead status:', error);
        fetchLeads(); // Revert on error
        alert('Error al mover el lead. Se revertirán los cambios.');
      }
      setDraggedLead(null);
    } 
    else if (draggedStage) {
      if (draggedStage.id === targetStageId) return;

      const newStages = [...stages];
      const dragIndex = newStages.findIndex(s => s.id === draggedStage.id);
      const hoverIndex = newStages.findIndex(s => s.id === targetStageId);

      const [removed] = newStages.splice(dragIndex, 1);
      newStages.splice(hoverIndex, 0, removed);

      setStages(newStages);
      setDraggedStage(null);
    }
  };

  const handleSaveLead = async (leadData) => {
    try {
      if (editingLead) {
        const { data, error } = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', editingLead.id)
          .select('*, therapists(name)');

        if (error) throw error;

        const updatedLead = {
          ...data[0],
          assigned_therapist_name: data[0].therapists ? data[0].therapists.name : 'N/A'
        };

        setLeads(leads.map(l => (l.id === updatedLead.id ? updatedLead : l)));
        setEditingLead(null);
      } else {
        const { data, error } = await supabase
          .from('leads')
          .insert([{ ...leadData, status: 'new' }])
          .select('*, therapists(name)');

        if (error) throw error;

        const newLead = {
          ...data[0],
          assigned_therapist_name: data[0].therapists ? data[0].therapists.name : 'N/A'
        };

        setLeads([newLead, ...leads]);
      }
      return true;
    } catch (err) {
      console.error('Error saving lead:', err);
      alert('Error al guardar el lead: ' + err.message);
      throw err;
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este lead?')) {
      try {
        const { error } = await supabase.from('leads').delete().eq('id', leadId);
        if (error) throw error;
        setLeads(leads.filter(l => l.id !== leadId));
        setOpenDropdownId(null);
      } catch (err) {
        console.error('Error deleting lead:', err);
        alert('Error al eliminar el lead.');
      }
    }
  };

  const handleOpenEditModal = (lead) => {
    setEditingLead(lead);
    setIsModalOpen(true);
  };

  const handleOpenTasksModal = (lead) => {
    setTasksLead(lead);
    setIsTasksModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLead(null);
  };

  const toggleSelectLead = (leadId) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAllInStage = (stageId) => {
    const leadsInStage = leads.filter(l => l.status === stageId).map(l => l.id);
    const allSelected = leadsInStage.every(id => selectedLeads.includes(id));
    
    if (allSelected) {
      setSelectedLeads(prev => prev.filter(id => !leadsInStage.includes(id)));
    } else {
      setSelectedLeads(prev => [...new Set([...prev, ...leadsInStage])]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('.relative')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Eutymia Ventas</h1>
        {selectedLeads.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsBulkWhatsAppModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <Phone size={18} />
              Enviar WhatsApp ({selectedLeads.length})
            </button>
            <button
              onClick={() => setIsBulkEmailModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Mail size={18} />
              Enviar Correo ({selectedLeads.length})
            </button>
          </div>
        )}
      </div>

      <NewLeadModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveLead}
        initialData={editingLead}
      />

      <BulkEmailModal
        isOpen={isBulkEmailModalOpen}
        onClose={() => setIsBulkEmailModalOpen(false)}
        selectedLeads={selectedLeads}
        leads={leads}
      />

      <BulkWhatsAppModal
        isOpen={isBulkWhatsAppModalOpen}
        onClose={() => setIsBulkWhatsAppModalOpen(false)}
        selectedLeads={selectedLeads}
        leads={leads}
      />

      <LeadTasksModal
        isOpen={isTasksModalOpen}
        onClose={() => setIsTasksModalOpen(false)}
        lead={tasksLead}
      />

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      )}

      {error && (
        <div className="flex-1 flex items-center justify-center text-red-600 text-lg font-medium p-4 bg-red-50 rounded-lg m-4 border border-red-200">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="flex-1 overflow-x-scroll pb-4">
          <div className="flex gap-4 h-full min-w-[1000px]">
            {stages.map(stage => (
              <div 
                key={stage.id} 
                className="flex-1 flex flex-col bg-gray-50 rounded-lg border min-w-[280px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div 
                  className={`p-3 font-semibold text-sm uppercase tracking-wide border-b flex justify-between items-center ${stage.color.replace('bg-', 'border-').replace('text-', 'text-')} cursor-move`}
                  draggable
                  onDragStart={(e) => handleStageDragStart(e, stage)}
                >
                  <div className="flex items-center gap-2 pointer-events-none">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAllInStage(stage.id);
                      }}
                      className="pointer-events-auto text-gray-500 hover:text-gray-700"
                    >
                      {leads.filter(l => l.status === stage.id).length > 0 && leads.filter(l => l.status === stage.id).every(l => selectedLeads.includes(l.id)) ? (
                        <CheckSquare size={16} className="text-teal-600" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                    {stage.name}
                    <span className="bg-white px-2 py-0.5 rounded-full text-xs shadow-sm border">
                      {leads.filter(l => l.status === stage.id).length}
                    </span>
                  </div>
                  {stage.id === 'new' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsModalOpen(true);
                      }}
                      className="p-1 hover:bg-white rounded-full transition-colors text-gray-600 hover:text-teal-600 pointer-events-auto"
                      title="Añadir nuevo lead"
                    >
                      <Plus size={18} />
                    </button>
                  )}
                </div>
                
                <div className="flex-1 p-2 overflow-y-auto space-y-2">
                  {leads.filter(l => l.status === stage.id).map(lead => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      isSelected={selectedLeads.includes(lead.id)}
                      onToggleSelect={toggleSelectLead}
                      onDragStart={handleDragStart}
                      openDropdownId={openDropdownId}
                      setOpenDropdownId={setOpenDropdownId}
                      onEdit={handleOpenEditModal}
                      onDelete={handleDeleteLead}
                      onAddTask={handleOpenTasksModal}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}