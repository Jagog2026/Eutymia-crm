import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Lock, Trash2, Pencil, DollarSign } from 'lucide-react';
import NewAppointmentModal from './NewAppointmentModal';
import BlockScheduleModal from './BlockScheduleModal';
import PaymentProofModal from './PaymentProofModal';
import AgendaSidebar from './AgendaSidebar';
import AgendaHeader from './AgendaHeader';
import AgendaGrid from './AgendaGrid';

export default function Agenda({ onReportsRefresh, userRole, userEmail, therapistId }) {
  // State
  const [view, setView] = useState('day'); // 'day' | 'week'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapists, setSelectedTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canViewAllTherapists, setCanViewAllTherapists] = useState(false);
  
  // Modals & Menus
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showPaymentProofModal, setShowPaymentProofModal] = useState(false);
  const [newAppointmentDetails, setNewAppointmentDetails] = useState(null);
  const [currentAppointmentForProof, setCurrentAppointmentForProof] = useState(null);
  const [appointmentMenu, setAppointmentMenu] = useState(null);
  const [showMenu, setShowMenu] = useState(null); // Context menu for empty slots

  // Initial Load
  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch appointments when dependencies change
  useEffect(() => {
    if (!loading && therapists.length > 0) {
      fetchAppointments();
    }
  }, [currentDate, view, selectedTherapists, loading]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // 1. Get Therapists
      const { data: therapistsData } = await supabase
        .from('therapists')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (therapistsData) {
        setTherapists(therapistsData);
        
        // 2. Determine User Role & Selection based on props
        const isAdmin = userRole === 'admin';
        setCanViewAllTherapists(isAdmin);

        // 3. Set selected therapists based on role
        if (isAdmin) {
          // Admin sees all therapists by default
          setSelectedTherapists(therapistsData.map(t => t.id));
        } else if (therapistId) {
          // Therapist sees only themselves (no puede cambiar)
          setSelectedTherapists([therapistId]);
        } else {
          // Usuario regular no debería estar aquí, pero por si acaso
          setSelectedTherapists([]);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async (baseDate = currentDate) => {
    if (selectedTherapists.length === 0) {
      setAppointments([]);
      return;
    }

    try {
      let query = supabase
        .from('appointments')
        .select('*, therapists(name, color)')
        .in('therapist_id', selectedTherapists);

      // Date Range Calculation
      const start = new Date(baseDate);
      const end = new Date(baseDate);

      if (view === 'week') {
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      } else {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      }

      const startDateStr = start.toISOString().split('T')[0];
      const endDateStr = end.toISOString().split('T')[0];

      query = query.gte('date', startDateStr).lte('date', endDateStr);

      const { data, error } = await query;
      
      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  // Date Navigation
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    if (view !== 'day') setView('day');
    fetchAppointments(today);
  };

  // Interactions
  const handleTimeClick = (e, time, therapistId, date) => {
    e.stopPropagation();
    setShowMenu({ x: e.clientX, y: e.clientY, time, therapistId, date });
    setAppointmentMenu(null);
  };

  const handleAppointmentClick = (e, appointment) => {
    e.stopPropagation();
    setAppointmentMenu({ x: e.clientX, y: e.clientY, appointment });
    setShowMenu(null);
  };

  const handleNewAppointment = (time = null, therapistId = null, date = null) => {
    setNewAppointmentDetails({ 
      time, 
      therapistId: therapistId || (selectedTherapists.length === 1 ? selectedTherapists[0] : null), 
      date: date || currentDate 
    });
    setShowNewAppointmentModal(true);
    setShowMenu(null);
  };

  const handleBlockSchedule = (time = null, therapistId = null, date = null) => {
    setNewAppointmentDetails({ 
      time, 
      therapistId: therapistId || (selectedTherapists.length === 1 ? selectedTherapists[0] : null), 
      date: date || currentDate 
    });
    setShowBlockModal(true);
    setShowMenu(null);
  };

  const handleDrop = async (appointmentId, newDate, newTherapistId) => {
    try {
      const dateStr = newDate.toISOString().split('T')[0];
      const timeStr = newDate.toTimeString().substring(0, 5);
      
      const updates = { date: dateStr, time: timeStr };
      if (newTherapistId) updates.therapist_id = newTherapistId;

      const { error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', appointmentId);

      if (error) throw error;
      fetchAppointments();
    } catch (error) {
      console.error('Error moving appointment:', error);
    }
  };

  // Menu Actions
  const updateStatus = async (status) => {
    if (!appointmentMenu?.appointment) return;
    await supabase.from('appointments').update({ status }).eq('id', appointmentMenu.appointment.id);
    fetchAppointments();
    setAppointmentMenu(null);
  };

  const updatePayment = async (status) => {
    if (!appointmentMenu?.appointment) return;
    if (status === 'paid') {
      setCurrentAppointmentForProof(appointmentMenu.appointment);
      setShowPaymentProofModal(true);
    } else {
      await supabase.from('appointments').update({ payment_status: status }).eq('id', appointmentMenu.appointment.id);
      fetchAppointments();
    }
    setAppointmentMenu(null);
  };

  const handleDelete = async () => {
    if (!appointmentMenu?.appointment) return;
    if (confirm('¿Estás seguro de eliminar esta cita?')) {
      await supabase.from('appointments').delete().eq('id', appointmentMenu.appointment.id);
      fetchAppointments();
      setAppointmentMenu(null);
    }
  };

  const handleEdit = () => {
    if (!appointmentMenu?.appointment) return;
    const app = appointmentMenu.appointment;
    setNewAppointmentDetails({
      id: app.id,
      patient_name: app.patient_name,
      service: app.service,
      date: new Date(app.date + 'T00:00:00'), // Fix timezone
      time: app.time,
      therapistId: app.therapist_id,
      notes: app.notes,
      status: app.status,
      payment_status: app.payment_status,
      estimated_value: app.estimated_value,
    });
    
    if (app.status === 'blocked') {
      setShowBlockModal(true);
    } else {
      setShowNewAppointmentModal(true);
    }
    setAppointmentMenu(null);
  };

  const selectedTherapistName = useMemo(() => {
    if (selectedTherapists.length === 1) {
      const therapist = therapists.find(t => t.id === selectedTherapists[0]);
      return therapist ? therapist.name : '';
    } else if (selectedTherapists.length > 1) {
      return 'Múltiples Terapeutas';
    }
    return 'Ningún Terapeuta Seleccionado';
  }, [selectedTherapists, therapists]);

  return (
    <div className="flex h-full bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-xl" onClick={() => { setShowMenu(null); setAppointmentMenu(null); }}>
      {/* Sidebar */}
      <AgendaSidebar 
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        therapists={therapists}
        selectedTherapists={selectedTherapists}
        canViewAllTherapists={canViewAllTherapists}
        onToggleTherapist={(id) => {
          if (!canViewAllTherapists) return; // Prevent toggling if not allowed
          setSelectedTherapists(prev => 
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
          );
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <AgendaHeader 
          currentDate={currentDate}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          onRefresh={fetchAppointments}
          onNewAppointment={() => handleNewAppointment()}
          view={view}
          setView={setView}
          selectedTherapistName={selectedTherapistName}
        />

        <div className="flex-1 overflow-hidden relative">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <AgendaGrid 
              date={currentDate}
              view={view}
              appointments={appointments}
              therapists={therapists}
              selectedTherapists={selectedTherapists}
              onTimeClick={handleTimeClick}
              onAppointmentClick={handleAppointmentClick}
              onDrop={handleDrop}
            />
          )}
        </div>
      </div>

      {/* Context Menus */}
      {showMenu && (
        <div className="fixed bg-white rounded-md shadow-xl border py-1 z-50 w-48" style={{ top: showMenu.y, left: showMenu.x }}>
          <button onClick={() => handleNewAppointment(showMenu.time, showMenu.therapistId, showMenu.date)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
            <Plus size={16} /> Nueva Cita
          </button>
          <button onClick={() => handleBlockSchedule(showMenu.time, showMenu.therapistId, showMenu.date)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
            <Lock size={16} /> Bloquear Horario
          </button>
        </div>
      )}

      {appointmentMenu && (
        <div className="fixed bg-white rounded-md shadow-xl border py-1 z-50 w-48" style={{ top: appointmentMenu.y, left: appointmentMenu.x }}>
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b mb-1">Acciones</div>
          <button onClick={handleEdit} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2">
            <Pencil size={16} /> Editar
          </button>
          
          {appointmentMenu.appointment.status !== 'blocked' && (
            <>
              <div className="border-t my-1"></div>
              <button onClick={() => updateStatus('confirmada')} className="w-full text-left px-4 py-2 text-sm hover:bg-yellow-50 text-yellow-800 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div> Confirmar
              </button>
              <button onClick={() => updateStatus('asiste')} className="w-full text-left px-4 py-2 text-sm hover:bg-pink-50 text-pink-800 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-pink-400"></div> Asiste
              </button>
              <button onClick={() => updateStatus('cancelado')} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-800 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400"></div> Cancelar
              </button>
              <div className="border-t my-1"></div>
              <button onClick={() => updatePayment('paid')} className="w-full text-left px-4 py-2 text-sm hover:bg-green-50 text-green-800 flex items-center gap-2">
                <DollarSign size={16} /> Registrar Pago
              </button>
            </>
          )}
          
          <div className="border-t my-1"></div>
          <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-800 flex items-center gap-2">
            <Trash2 size={16} /> Eliminar
          </button>
        </div>
      )}

      {/* Modals */}
      <NewAppointmentModal 
        isOpen={showNewAppointmentModal} 
        onClose={() => setShowNewAppointmentModal(false)} 
        initialDetails={newAppointmentDetails} 
        onSave={fetchAppointments} 
        therapists={therapists}
        userRole={userRole}
        therapistId={therapistId}
      />
      <BlockScheduleModal 
        isOpen={showBlockModal} 
        onClose={() => setShowBlockModal(false)} 
        initialDetails={newAppointmentDetails} 
        onSave={fetchAppointments} 
      />
      <PaymentProofModal
        isOpen={showPaymentProofModal}
        onClose={() => setShowPaymentProofModal(false)}
        appointmentId={currentAppointmentForProof?.id}
        onProofUploaded={() => {
          console.log('[Agenda] Payment proof uploaded, refreshing appointments and reports');
          fetchAppointments();
          if (onReportsRefresh) {
            console.log('[Agenda] Calling onReportsRefresh to trigger reports update');
            onReportsRefresh();
          }
        }}
      />
    </div>
  );
}