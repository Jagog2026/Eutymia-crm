import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
    const x = e.clientX;
    const y = e.clientY;
    const menuWidth = 192; // w-48
    const menuHeight = 110; // 2 buttons + padding + spacing

    // Clamp values to stay within viewport with a 10px margin
    const adjustedX = Math.max(10, Math.min(x, window.innerWidth - menuWidth - 10));
    const adjustedY = Math.max(10, Math.min(y, window.innerHeight - menuHeight - 10));

    setShowMenu({ x: adjustedX, y: adjustedY, time, therapistId, date });
    setAppointmentMenu(null);
  };

  const handleAppointmentClick = (e, appointment) => {
    e.stopPropagation();
    const x = e.clientX;
    const y = e.clientY;
    const menuWidth = 192; // w-48
    const menuHeight = 420; // 10+ items + borders + padding

    // Clamp values to stay within viewport with a 10px margin
    const adjustedX = Math.max(10, Math.min(x, window.innerWidth - menuWidth - 10));
    const adjustedY = Math.max(10, Math.min(y, window.innerHeight - menuHeight - 10));

    setAppointmentMenu({ x: adjustedX, y: adjustedY, appointment });
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
    <div className="flex h-full bg-gradient-to-br from-slate-50 dark:from-slate-900 via-white dark:via-slate-900 to-slate-100 dark:to-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xl" onClick={() => { setShowMenu(null); setAppointmentMenu(null); }}>
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
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
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
              <div className="animate-spin rounded-full h-8 w-8 border-b border-slate-200 dark:border-slate-800-2 border-teal-600"></div>
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
      {showMenu && createPortal(
        <div className="fixed bg-white dark:bg-slate-900 rounded-md shadow-xl border border-gray-200 dark:border-slate-800 py-1 z-[9999] w-48" style={{ top: showMenu.y, left: showMenu.x }}>
          <button onClick={() => handleNewAppointment(showMenu.time, showMenu.therapistId, showMenu.date)} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors">
            <Plus size={16} /> Nueva Cita
          </button>
          <button onClick={() => handleBlockSchedule(showMenu.time, showMenu.therapistId, showMenu.date)} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors">
            <Lock size={16} /> Bloquear Horario
          </button>
        </div>,
        document.body
      )}

      {appointmentMenu && createPortal(
        <div className="fixed bg-white dark:bg-slate-900 rounded-md shadow-xl border border-gray-200 dark:border-slate-800 py-1 z-[9999] w-48" style={{ top: appointmentMenu.y, left: appointmentMenu.x }}>
          <div className="flex bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-gray-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 mb-1">Acciones</div>
          <button onClick={handleEdit} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors">
            <Pencil size={16} /> Editar
          </button>

          {appointmentMenu.appointment.status !== 'blocked' && (
            <>
              <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
              <button onClick={() => updateStatus('reservado')} className="w-full text-left px-4 py-2 text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/40 flex items-center gap-2 transition-colors">
                <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"></div> Reservar
              </button>
              <button onClick={() => updateStatus('confirmada')} className="w-full text-left px-4 py-2 text-sm text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/40 flex items-center gap-2 transition-colors">
                <div className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400"></div> Confirmar
              </button>
              <button onClick={() => updateStatus('asiste')} className="w-full text-left px-4 py-2 text-sm text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/40 flex items-center gap-2 transition-colors">
                <div className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400"></div> Asiste
              </button>
              <button onClick={() => updateStatus('no_asistio')} className="w-full text-left px-4 py-2 text-sm text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/40 flex items-center gap-2 transition-colors">
                <div className="w-2 h-2 rounded-full bg-orange-500 dark:bg-orange-400"></div> No asistió
              </button>
              <button onClick={() => updateStatus('cancelado')} className="w-full text-left px-4 py-2 text-sm text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/40 flex items-center gap-2 transition-colors">
                <div className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400"></div> Cancelar
              </button>
              <button onClick={() => updateStatus('pendiente')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors">
                <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500"></div> Pendiente
              </button>
              <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
              <button onClick={() => updatePayment('paid')} className="w-full text-left px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 flex items-center gap-2 transition-colors">
                <DollarSign size={16} /> Registrar Pago
              </button>
            </>
          )}

          <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
          <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 flex items-center gap-2 transition-colors">
            <Trash2 size={16} /> Eliminar
          </button>
        </div>,
        document.body
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