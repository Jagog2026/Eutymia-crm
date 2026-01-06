import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Users, DollarSign, Clock, Plus, CheckCircle, UserPlus, X } from 'lucide-react';
import WorkshopModal from './WorkshopModal';

export default function Workshops() {
  const [workshops, setWorkshops] = useState([]);
  const [paidLeads, setPaidLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [workshopForRegistration, setWorkshopForRegistration] = useState(null);
  const [registeredLeads, setRegisteredLeads] = useState({});

  useEffect(() => {
    fetchWorkshops();
    fetchPaidLeads();
    fetchAllRegistrations();
  }, []);

  const fetchWorkshops = async () => {
    try {
      const { data, error } = await supabase.from('workshops').select('*, therapists(name)').order('date', { ascending: true });
      if (error) throw error;
      if (data) setWorkshops(data);
    } catch (error) {
      console.error('Error fetching workshops:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaidLeads = async () => {
    try {
      const { data, error } = await supabase.from('leads').select('*').eq('status', 'paid');
      if (error) throw error;
      if (data) setPaidLeads(data);
    } catch (error) {
      console.error('Error fetching paid leads:', error);
    }
  };

  const fetchAllRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('workshop_registrations')
        .select('*, leads!inner(id, name, full_name, email, phone)');
      
      if (error) throw error;
      
      console.log('Registrations data:', data); // Debug log
      
      // Organize registrations by workshop_id
      const registrationsByWorkshop = {};
      data?.forEach(reg => {
        if (!registrationsByWorkshop[reg.workshop_id]) {
          registrationsByWorkshop[reg.workshop_id] = [];
        }
        const leadName = reg.leads?.full_name || reg.leads?.name || 'Sin nombre';
        console.log('Processing registration:', reg, 'Lead name:', leadName); // Debug log
        registrationsByWorkshop[reg.workshop_id].push({
          lead_id: reg.lead_id,
          name: leadName,
          full_name: leadName,
          email: reg.leads?.email,
          phone: reg.leads?.phone
        });
      });
      
      console.log('Organized registrations:', registrationsByWorkshop); // Debug log
      setRegisteredLeads(registrationsByWorkshop);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const handleEditClick = (workshop) => {
    setSelectedWorkshop(workshop);
    setShowModal(true);
  };

  const handleNewWorkshopClick = () => {
    setSelectedWorkshop(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedWorkshop(null);
  };

  const handleWorkshopSaved = () => {
    fetchWorkshops();
  };

  const handleWorkshopDeleted = () => {
    fetchWorkshops();
  };

  const openRegisterModal = (workshop, e) => {
    e.stopPropagation();
    setWorkshopForRegistration(workshop);
    setShowRegisterModal(true);
  };

  const closeRegisterModal = () => {
    setShowRegisterModal(false);
    setWorkshopForRegistration(null);
  };

  const registerLead = async (workshopId, lead) => {
    try {
      const { error } = await supabase.from('workshop_registrations').insert({
        workshop_id: workshopId,
        lead_id: lead.id,
        status: 'registered',
        payment_status: 'paid',
        payment_amount: workshopForRegistration?.price || 0
      });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          alert(`⚠️ ${lead.full_name || lead.name || 'Este lead'} ya está inscrito en este taller`);
        } else {
          throw error;
        }
      } else {
        alert(`✅ ${lead.full_name || lead.name || 'Lead'} inscrito correctamente`);
        fetchWorkshops();
        fetchAllRegistrations();
        fetchPaidLeads();
      }
    } catch (error) {
      console.error('Error registering lead:', error);
      alert('❌ Error al inscribir el lead. Por favor intenta de nuevo.');
    }
  };

  const unregisterLead = async (workshopId, leadId, leadName) => {
    if (!confirm(`¿Deseas eliminar a ${leadName} de este taller?`)) return;
    
    try {
      const { error } = await supabase
        .from('workshop_registrations')
        .delete()
        .eq('workshop_id', workshopId)
        .eq('lead_id', leadId);

      if (error) throw error;
      
      alert(`✅ ${leadName} eliminado del taller`);
      fetchWorkshops();
      fetchAllRegistrations();
    } catch (error) {
      console.error('Error unregistering lead:', error);
      alert('❌ Error al eliminar el lead. Por favor intenta de nuevo.');
    }
  };

  return (
    <div className="flex h-full">
      {/* Main Content - Workshops List */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Talleres y Eventos</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-8 text-gray-500">Cargando talleres...</div>
          ) : workshops.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No hay talleres disponibles. <button onClick={handleNewWorkshopClick} className="text-teal-600 hover:underline">Crea uno nuevo</button>.
            </div>
          ) : (
            workshops.map(workshop => {
              const workshopRegistrations = registeredLeads[workshop.id] || [];
              return (
                <div 
                  key={workshop.id} 
                  className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleEditClick(workshop)}
                  >
                    <div className="h-32 bg-teal-100 relative">
                      {workshop.image_url ? (
                        <img src={workshop.image_url} alt={workshop.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-teal-300">
                          <Calendar size={48} />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-xs font-bold text-teal-600 shadow-sm">
                        ${workshop.price}
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{workshop.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{workshop.description}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={16} className="text-teal-500" />
                          {new Date(workshop.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock size={16} className="text-teal-500" />
                          {new Date(workshop.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({workshop.duration_minutes} min)
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users size={16} className="text-teal-500" />
                          {workshop.current_attendees || 0} / {workshop.max_attendees} inscritos
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full">
                          {workshop.type}
                        </span>
                        <span className="px-3 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full">
                          {workshop.modality}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Registered Leads Section */}
                  {workshopRegistrations.length > 0 && (
                    <div className="px-6 pb-4 border-t pt-4">
                      <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">
                        Inscritos ({workshopRegistrations.length})
                      </h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {workshopRegistrations.map(reg => (
                          <div 
                            key={reg.lead_id} 
                            className="flex items-center justify-between bg-green-50 px-3 py-2 rounded text-xs"
                          >
                            <span className="font-medium text-green-900">{reg.name || reg.full_name || 'Sin nombre'}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                unregisterLead(workshop.id, reg.lead_id, reg.name || reg.full_name || 'Sin nombre');
                              }}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Eliminar inscripción"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Register Button */}
                  <div className="px-6 pb-6">
                    <button
                      onClick={(e) => openRegisterModal(workshop, e)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      <UserPlus size={18} />
                      Inscribir Lead Pagado
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-8 text-center">
          <button 
            onClick={handleNewWorkshopClick}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 mx-auto"
          >
            <Plus size={20} /> Nuevo Taller
          </button>
        </div>

        {showModal && (
          <WorkshopModal 
            workshop={selectedWorkshop}
            onClose={handleModalClose}
            onSave={handleWorkshopSaved}
            onDelete={handleWorkshopDeleted}
          />
        )}

        {/* Registration Modal */}
        {showRegisterModal && workshopForRegistration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Inscribir Lead Pagado</h2>
                  <p className="text-sm text-gray-600 mt-1">{workshopForRegistration.title}</p>
                </div>
                <button
                  onClick={closeRegisterModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
                {paidLeads.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg font-medium">No hay leads pagados disponibles</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Los leads deben tener el estado "Pagado" para poder inscribirse en talleres.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paidLeads.map(lead => {
                      const alreadyRegistered = registeredLeads[workshopForRegistration.id]?.some(
                        reg => reg.lead_id === lead.id
                      );
                      
                      return (
                        <div
                          key={lead.id}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            alreadyRegistered
                              ? 'border-gray-200 bg-gray-50 opacity-60'
                              : 'border-green-200 bg-green-50 hover:border-green-400 hover:shadow-md cursor-pointer'
                          }`}
                          onClick={() => !alreadyRegistered && registerLead(workshopForRegistration.id, lead)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900">{lead.full_name || lead.name || 'Sin nombre'}</h3>
                              {lead.email && (
                                <p className="text-xs text-gray-600 mt-1">{lead.email}</p>
                              )}
                              {lead.phone && (
                                <p className="text-xs text-gray-600">{lead.phone}</p>
                              )}
                            </div>
                            {alreadyRegistered && (
                              <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                                Ya inscrito
                              </span>
                            )}
                          </div>
                          
                          {!alreadyRegistered && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                registerLead(workshopForRegistration.id, lead);
                              }}
                              className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                              <Plus size={16} />
                              Inscribir
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={closeRegisterModal}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar - Paid Leads */}
      <div className="w-80 bg-gray-50 border-l p-6 overflow-y-auto hidden xl:block">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <CheckCircle size={20} className="text-green-600" />
          Leads Pagados
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Estos prospectos ya han pagado y están listos para ser asignados a un taller.
        </p>

        <div className="space-y-3">
          {paidLeads.map(lead => (
            <div key={lead.id} className="bg-white p-3 rounded border shadow-sm">
              <div className="font-medium text-gray-900">{lead.name || lead.full_name}</div>
              {lead.email && <div className="text-xs text-gray-500 mt-1">{lead.email}</div>}
              {lead.phone && <div className="text-xs text-gray-500">{lead.phone}</div>}
              <div className="mt-2 flex justify-end">
                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                  Listo para asignar
                </span>
              </div>
            </div>
          ))}
          {paidLeads.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No hay leads pendientes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}