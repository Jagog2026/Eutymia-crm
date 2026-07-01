import { AlertTriangle, Calendar, Clock, FileText, MapPin, Plus, Tag, User, X, DollarSign } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const SERVICES = [
  'Sesión individual presencial',
  'Sesión individual en línea',
  'Sesión pareja presencial',
  'Sesión pareja en línea',
  'Sesión familiar presencial',
  'Sesión familiar en línea',
  'Sesión a domicilio',
];

const BRANCHES = ['Roma Norte', 'Qro Centro', 'En linea'];

const DURATION_OPTIONS = [
  { label: '30m', value: 30 },
  { label: '1h', value: 60 },
  { label: '1h 30m', value: 90 },
  { label: '2h', value: 120 },
];

const isOnlineService = (service) =>
  service.toLowerCase().includes('en línea') || service.toLowerCase().includes('en linea');

const inputClass =
  'block w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors';

const inputWithIconClass =
  'block w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors';

export default function NewAppointmentModal({
  isOpen,
  onClose,
  initialDetails,
  onSave,
  therapists,
  userRole,
  therapistId,
}) {
  const [appointment, setAppointment] = useState({
    patient_name: '', patient_phone: '', patient_email: '',
    date: '', time: '', therapist_id: '', service: '', branch: '', notes: '',
  });
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(true);
  const [newPatientDetails, setNewPatientDetails] = useState({ firstName: '', lastName: '' });

  const isEditMode = !!appointment.id;

  // ── Patient search ───────────────────────────────────────────────
  const searchClients = async (searchTerm) => {
    if (isNewPatient) { setSearchResults([]); setShowResults(false); return; }
    setIsSearching(true);
    try {
      const [{ data: leadsData }, { data: apptData }] = await Promise.all([
        supabase.from('leads').select('id, full_name, phone, email')
          .ilike('full_name', `%${searchTerm}%`).limit(10),
        supabase.from('appointments').select('patient_name, patient_phone, patient_email')
          .ilike('patient_name', `%${searchTerm}%`).limit(10),
      ]);

      const results = [];
      leadsData?.forEach(l => results.push({ id: l.id, name: l.full_name, phone: l.phone, email: l.email, type: 'Lead' }));
      const seen = new Set(leadsData?.map(l => l.full_name?.toLowerCase()) ?? []);
      apptData?.forEach(a => {
        if (a.patient_name && !seen.has(a.patient_name.toLowerCase())) {
          seen.add(a.patient_name.toLowerCase());
          results.push({ id: a.patient_name, name: a.patient_name, phone: a.patient_phone, email: a.patient_email, type: 'Paciente' });
        }
      });
      setSearchResults(results);
      setShowResults(true);
    } catch {
      // silent
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(() => searchClients(appointment.patient_name), 400);
    return () => clearTimeout(id);
  }, [appointment.patient_name, isNewPatient]);

  useEffect(() => {
    const id = setTimeout(async () => {
      if (!appointment.patient_name) { setSessionCount(0); return; }
      const { count } = await supabase.from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('patient_name', appointment.patient_name);
      setSessionCount(count || 0);
    }, 400);
    return () => clearTimeout(id);
  }, [appointment.patient_name]);

  // ── Reset on close ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setAppointment({ patient_name: '', patient_phone: '', patient_email: '', date: '', time: '', therapist_id: '', service: '', branch: '', notes: '' });
      setDuration(60);
      setIsNewPatient(true);
      setNewPatientDetails({ firstName: '', lastName: '' });
      setSearchResults([]);
      setShowResults(false);
      setError(null);
    }
  }, [isOpen]);

  // ── Pre-fill on open ─────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setError(null);

    const defaultTherapistId =
      userRole === 'therapist' && therapistId
        ? therapistId
        : initialDetails?.therapistId || (therapists.length > 0 ? therapists[0].id : '');

    if (initialDetails?.id) {
      // Edit mode
      const d = initialDetails.date ? new Date(initialDetails.date) : new Date();
      setAppointment({
        id: initialDetails.id,
        patient_name: initialDetails.patient_name || '',
        patient_phone: initialDetails.patient_phone || '',
        patient_email: initialDetails.patient_email || '',
        date: d.toISOString().split('T')[0],
        time: initialDetails.time || '09:00',
        therapist_id: defaultTherapistId,
        service: initialDetails.service || '',
        branch: initialDetails.branch || '',
        notes: initialDetails.notes || '',
        status: initialDetails.status || 'reservado',
        estimated_value: initialDetails.estimated_value || 0,
      });
      // Restore duration
      if (initialDetails.end_time && initialDetails.time) {
        const [sh, sm] = initialDetails.time.split(':').map(Number);
        const [eh, em] = initialDetails.end_time.split(':').map(Number);
        const dur = (eh * 60 + em) - (sh * 60 + sm);
        setDuration(dur > 0 ? dur : 60);
      } else {
        setDuration(60);
      }
      setIsNewPatient(false);
    } else if (initialDetails) {
      // New from slot
      const d = initialDetails.date ? new Date(initialDetails.date) : new Date();
      setAppointment({
        patient_name: '', patient_phone: '', patient_email: '',
        date: d.toISOString().split('T')[0],
        time: initialDetails.time || '09:00',
        therapist_id: defaultTherapistId,
        service: '', branch: '', notes: '', status: 'reservado',
      });
      setDuration(60);
      setIsNewPatient(true);
      setNewPatientDetails({ firstName: '', lastName: '' });
    } else {
      // New from button
      setAppointment({
        patient_name: '', patient_phone: '', patient_email: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        therapist_id: defaultTherapistId,
        service: '', branch: '', notes: '', status: 'reservado',
      });
      setDuration(60);
      setIsNewPatient(true);
      setNewPatientDetails({ firstName: '', lastName: '' });
    }
  }, [isOpen, initialDetails, therapists, userRole, therapistId]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAppointment(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'service' && isOnlineService(value)) next.branch = 'En linea';
      if (name === 'service' && !isOnlineService(value) && prev.branch === 'En linea') next.branch = '';
      return next;
    });
  };

  const selectClient = (client) => {
    setAppointment(prev => ({ ...prev, patient_name: client.name, patient_phone: client.phone || '', patient_email: client.email || '' }));
    setShowResults(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!appointment.therapist_id) {
      setError('Por favor selecciona un terapeuta.');
      setLoading(false);
      return;
    }

    try {
      // Time range
      const [hh, mm] = appointment.time.split(':').map(Number);
      const slotStartMin = hh * 60 + mm;
      const slotEndMin = slotStartMin + duration;
      const pad = (n) => String(n).padStart(2, '0');
      const slotStart = `${pad(Math.floor(slotStartMin / 60))}:${pad(slotStartMin % 60)}`;
      const slotEnd   = `${pad(Math.floor(slotEndMin   / 60))}:${pad(slotEndMin   % 60)}`;

      // Overlap condition (handles null end_time)
      const overlapOr = `end_time.gt.${slotStart},and(end_time.is.null,time.gte.${slotStart})`;
      const selectedBranch = appointment.branch || (isOnlineService(appointment.service) ? 'En linea' : '');

      if (selectedBranch && selectedBranch !== 'En linea') {
        let q = supabase.from('appointments').select('id, time, end_time, therapist_id, patient_name')
          .eq('date', appointment.date).eq('branch', selectedBranch)
          .neq('status', 'cancelado').neq('status', 'blocked')
          .lt('time', slotEnd).or(overlapOr);
        if (appointment.id) q = q.neq('id', appointment.id);
        const { data: conflicts } = await q;
        if (conflicts?.length) {
          const others = conflicts.filter(c => c.therapist_id !== appointment.therapist_id);
          if (others.length) {
            const names = others.map(c => therapists.find(t => t.id === c.therapist_id)?.name ?? 'Otro terapeuta');
            throw new Error(`Conflicto de espacio: "${selectedBranch}" ya tiene cita con ${names.join(', ')} en ese horario.`);
          }
          const same = conflicts.filter(c => c.therapist_id === appointment.therapist_id);
          if (same.length) throw new Error(`El terapeuta ya tiene cita a las ${same[0].time} con ${same[0].patient_name}.`);
        }
      } else if (selectedBranch === 'En linea') {
        let q = supabase.from('appointments').select('id, time, patient_name')
          .eq('date', appointment.date).eq('therapist_id', appointment.therapist_id)
          .neq('status', 'cancelado').lt('time', slotEnd).or(overlapOr);
        if (appointment.id) q = q.neq('id', appointment.id);
        const { data: conflicts } = await q;
        if (conflicts?.length) throw new Error(`El terapeuta ya tiene cita a las ${conflicts[0].time} con ${conflicts[0].patient_name}.`);
      }

      // Resolve patient name for new patients
      if (isNewPatient && !appointment.id) {
        if (!newPatientDetails.firstName || !newPatientDetails.lastName)
          throw new Error('Ingresa el nombre y apellido del paciente.');
        appointment.patient_name = `${newPatientDetails.firstName} ${newPatientDetails.lastName}`;
        supabase.from('leads').insert([{
          full_name: appointment.patient_name, phone: appointment.patient_phone,
          email: appointment.patient_email, status: 'scheduled',
          service: appointment.service, notes: 'Creado desde agenda',
        }]).then(() => {}).catch(() => {});
      }

      const { id: existingId, ...fields } = {
        ...appointment,
        branch: isOnlineService(appointment.service) ? 'En linea' : appointment.branch,
        end_time: slotEnd,
        status: appointment.status || 'reservado',
      };

      let saveError;
      if (existingId) {
        ({ error: saveError } = await supabase.from('appointments').update(fields).eq('id', existingId));
      } else {
        ({ error: saveError } = await supabase.from('appointments').insert([fields]));
      }
      if (saveError) throw saveError;

      onSave();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar la cita.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {isEditMode ? 'Editar Cita' : 'Nueva Cita'}
            </h3>
            {isEditMode && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Modifica los datos y guarda los cambios</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Patient section */}
          {!isEditMode && (
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${isNewPatient ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>
                {isNewPatient && <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 fill-white"><path d="M1 4l3 3 5-6"/></svg>}
              </div>
              <input type="checkbox" className="sr-only" checked={isNewPatient}
                onChange={(e) => { setIsNewPatient(e.target.checked); if (e.target.checked) setAppointment(p => ({ ...p, patient_name: '' })); }} />
              <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">Paciente nuevo</span>
            </label>
          )}

          {isNewPatient && !isEditMode ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nombre(s)</label>
                <input type="text" value={newPatientDetails.firstName}
                  onChange={e => setNewPatientDetails(p => ({ ...p, firstName: e.target.value }))}
                  className={inputClass} placeholder="Ana" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Apellidos</label>
                <input type="text" value={newPatientDetails.lastName}
                  onChange={e => setNewPatientDetails(p => ({ ...p, lastName: e.target.value }))}
                  className={inputClass} placeholder="García López" required />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Paciente</label>
              <div className="relative">
                <User size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input type="text" name="patient_name" value={appointment.patient_name} onChange={handleChange}
                  onFocus={() => { if (searchResults.length) setShowResults(true); else searchClients(appointment.patient_name); }}
                  onBlur={() => setTimeout(() => setShowResults(false), 180)}
                  className={inputWithIconClass} placeholder="Buscar por nombre..." required autoComplete="off" />
                {showResults && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <button type="button" onClick={() => { setIsNewPatient(true); setAppointment(p => ({ ...p, patient_name: '' })); setShowResults(false); }}
                      className="w-full px-3 py-2.5 text-left text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-700">
                      <Plus size={13} /> Registrar como nuevo paciente
                    </button>
                    {searchResults.map((r, i) => (
                      <button type="button" key={i} onClick={() => selectClient(r)}
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-50 dark:border-slate-700/50 last:border-0 transition-colors">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{r.name}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">{r.email || 'Sin email'} · {r.phone || 'Sin teléfono'}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {appointment.patient_name && (
                <p className="mt-1 text-[11px] text-indigo-500 dark:text-indigo-400 font-medium">
                  {sessionCount} sesiones previas — esta será la #{sessionCount + 1}
                </p>
              )}
            </div>
          )}

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Teléfono</label>
              <input type="tel" name="patient_phone" value={appointment.patient_phone} onChange={handleChange}
                className={inputClass} placeholder="55 1234 5678" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Email</label>
              <input type="email" name="patient_email" value={appointment.patient_email} onChange={handleChange}
                className={inputClass} placeholder="correo@ejemplo.com" />
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Fecha</label>
              <div className="relative">
                <Calendar size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input type="date" name="date" value={appointment.date} onChange={handleChange}
                  className={inputWithIconClass} required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Hora</label>
              <div className="relative">
                <Clock size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input type="time" name="time" value={appointment.time} onChange={handleChange}
                  className={inputWithIconClass} required />
              </div>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Duración</label>
            <div className="flex gap-2">
              {DURATION_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setDuration(opt.value)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    duration === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Therapist */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Terapeuta</label>
            <div className="relative">
              <User size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select name="therapist_id" value={appointment.therapist_id} onChange={handleChange}
                disabled={userRole === 'therapist'}
                className={`${inputWithIconClass} disabled:opacity-60 disabled:cursor-not-allowed`} required>
                <option value="">{therapists.length === 0 ? 'No hay terapeutas disponibles' : 'Selecciona un terapeuta'}</option>
                {therapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          {/* Service */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Servicio</label>
            <div className="relative">
              <Tag size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select name="service" value={appointment.service} onChange={handleChange}
                className={inputWithIconClass} required>
                <option value="">Selecciona un servicio</option>
                {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Branch */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Sucursal</label>
            <div className="relative">
              <MapPin size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select name="branch"
                value={isOnlineService(appointment.service) ? 'En linea' : appointment.branch}
                onChange={handleChange}
                disabled={isOnlineService(appointment.service)}
                className={`${inputWithIconClass} disabled:opacity-60 disabled:cursor-not-allowed`} required>
                <option value="">Selecciona una sucursal</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            {isOnlineService(appointment.service) && (
              <p className="mt-1 text-[11px] text-blue-500 dark:text-blue-400">Sesión en línea — sucursal no requerida</p>
            )}
          </div>

          {/* Estimated value */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Valor estimado (MXN)</label>
            <div className="relative">
              <DollarSign size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input type="number" name="estimated_value" value={appointment.estimated_value || ''}
                onChange={handleChange} min="0" step="50"
                className={inputWithIconClass} placeholder="0" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Notas</label>
            <div className="relative">
              <FileText size={15} className="absolute left-2.5 top-3 text-slate-400 pointer-events-none" />
              <textarea name="notes" rows="2" value={appointment.notes} onChange={handleChange}
                className={`${inputWithIconClass} resize-none`}
                placeholder="Notas adicionales sobre la cita" />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
            Cancelar
          </button>
          <button type="submit" form="appointment-form" disabled={loading}
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm">
            {loading ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Crear cita'}
          </button>
        </div>
      </div>
    </div>
  );
}
