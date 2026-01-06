import {
  Calendar,
  Clock,
  FileText,
  MapPin,
  Plus,
  Tag,
  User,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

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
    patient_name: '',
    patient_phone: '',
    patient_email: '',
    date: '',
    time: '',
    therapist_id: '',
    service: '',
    branch: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const SERVICES = [
    'Sesión individual presencial',
    'Sesión individual en línea',
    'Sesión pareja presencial',
    'Sesión pareja en línea',
    'Sesión familiar presencial',
    'Sesión familiar en línea',
    'Sesión a domicilio',
  ];

  const BRANCHES = ['Roma Norte', 'Qro Centro', 'Qro. Hospital', 'En linea'];

  const [sessionCount, setSessionCount] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newPatientDetails, setNewPatientDetails] = useState({
    firstName: '',
    lastName: '',
  });

  const searchClients = async (searchTerm) => {
    if (isNewPatient) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // Buscar en leads y en citas anteriores
      let leadsQuery = supabase
        .from('leads')
        .select('id, full_name, phone, email')
        .limit(10);

      if (searchTerm && searchTerm.length > 0) {
        leadsQuery = leadsQuery.ilike('full_name', `%${searchTerm}%`);
      }

      const { data: leadsData, error: leadsError } = await leadsQuery;

      if (leadsError) {
        console.error('Error fetching leads:', leadsError);
      }

      // También buscar en pacientes que ya tienen citas (appointments)
      let appointmentsQuery = supabase
        .from('appointments')
        .select('patient_name, patient_phone, patient_email')
        .limit(10);

      if (searchTerm && searchTerm.length > 0) {
        appointmentsQuery = appointmentsQuery.ilike(
          'patient_name',
          `%${searchTerm}%`
        );
      }

      const { data: appointmentsData, error: appointmentsError } =
        await appointmentsQuery;

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
      }

      const results = [];

      // Agregar leads
      if (leadsData) {
        leadsData.forEach((l) => {
          results.push({
            id: l.id,
            name: l.full_name,
            phone: l.phone,
            email: l.email,
            type: 'Lead',
          });
        });
      }

      // Agregar pacientes de citas (evitar duplicados)
      if (appointmentsData) {
        const uniquePatients = new Map();
        appointmentsData.forEach((a) => {
          if (a.patient_name && !uniquePatients.has(a.patient_name)) {
            uniquePatients.set(a.patient_name, {
              id: a.patient_name, // Usar el nombre como ID temporal
              name: a.patient_name,
              phone: a.patient_phone,
              email: a.patient_email,
              type: 'Paciente',
            });
          }
        });
        uniquePatients.forEach((patient) => results.push(patient));
      }

      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchClients(appointment.patient_name);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [appointment.patient_name, isNewPatient]);

  const selectClient = (client) => {
    setAppointment((prev) => ({
      ...prev,
      patient_name: client.name,
      patient_phone: client.phone || '',
      patient_email: client.email || '',
    }));
    setShowResults(false);
  };

  useEffect(() => {
    const fetchSessionCount = async () => {
      if (!appointment.patient_name) {
        setSessionCount(0);
        return;
      }

      try {
        const { count, error } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('patient_name', appointment.patient_name);

        if (!error) {
          setSessionCount(count || 0);
        }
      } catch (err) {
        console.error('Error fetching session count:', err);
      }
    };

    const timeoutId = setTimeout(fetchSessionCount, 500);
    return () => clearTimeout(timeoutId);
  }, [appointment.patient_name]);

  useEffect(() => {
    if (isOpen) {
      console.log('🔍 Terapeutas disponibles:', therapists.length, therapists);
      console.log('🔍 User Role:', userRole, 'Therapist ID:', therapistId);
    }

    if (isOpen && initialDetails) {
      const initialDate = initialDetails.date
        ? new Date(initialDetails.date)
        : new Date();
      const formattedDate = initialDate.toISOString().split('T')[0];
      const formattedTime = initialDetails.time || '09:00';

      // Si es terapeuta, usar su therapistId, sino usar el que viene en initialDetails
      const defaultTherapistId =
        userRole === 'therapist' && therapistId
          ? therapistId
          : initialDetails.therapistId ||
            (therapists.length > 0 ? therapists[0].id : '');

      setAppointment((prev) => ({
        ...prev,
        date: formattedDate,
        time: formattedTime,
        therapist_id: defaultTherapistId,
      }));
    } else if (isOpen) {
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];

      // Si es terapeuta, usar su therapistId automáticamente
      const defaultTherapistId =
        userRole === 'therapist' && therapistId
          ? therapistId
          : therapists.length > 0
          ? therapists[0].id
          : '';

      setAppointment({
        patient_name: '',
        patient_phone: '',
        patient_email: '',
        date: formattedDate,
        time: '09:00',
        therapist_id: defaultTherapistId,
        service: '',
        branch: '',
        notes: '',
      });
    }
    setError(null);
  }, [isOpen, initialDetails, therapists, userRole, therapistId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAppointment((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate therapist_id
    if (!appointment.therapist_id) {
      setError('Por favor selecciona un terapeuta.');
      setLoading(false);
      return;
    }

    try {
      // If it's a new patient, set the full name
      if (isNewPatient) {
        if (!newPatientDetails.firstName || !newPatientDetails.lastName) {
          throw new Error(
            'Por favor ingresa el nombre y apellido del nuevo paciente.'
          );
        }

        // Update appointment patient name to be the full name
        appointment.patient_name = `${newPatientDetails.firstName} ${newPatientDetails.lastName}`;

        // Opcionalmente, crear un lead para este nuevo paciente
        try {
          await supabase.from('leads').insert([
            {
              full_name: appointment.patient_name,
              phone: appointment.patient_phone,
              email: appointment.patient_email,
              status: 'scheduled',
              service: appointment.service,
              notes: 'Creado desde agenda',
            },
          ]);
        } catch (leadError) {
          console.warn(
            'No se pudo crear el lead, pero la cita se guardará:',
            leadError
          );
        }
      }

      // Calcular end_time (1 hora después por defecto)
      const [hours, minutes] = appointment.time.split(':');
      const startDateTime = new Date(appointment.date);
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
      const endTime = `${String(endDateTime.getHours()).padStart(
        2,
        '0'
      )}:${String(endDateTime.getMinutes()).padStart(2, '0')}`;

      const appointmentData = {
        ...appointment,
        end_time: endTime,
        status: appointment.status || 'pendiente',
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select();
      if (error) throw error;
      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving appointment:', err);
      setError(
        'Error al guardar la cita. Inténtalo de nuevo: ' +
          (err.message || 'Error desconocido')
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Nueva Cita</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center mb-4">
            <input
              id="is_new_patient"
              type="checkbox"
              checked={isNewPatient}
              onChange={(e) => {
                setIsNewPatient(e.target.checked);
                if (e.target.checked) {
                  setAppointment((prev) => ({ ...prev, patient_name: '' }));
                }
              }}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor="is_new_patient"
              className="ml-2 block text-sm text-gray-900"
            >
              Paciente Nuevo (Registrar en base de datos)
            </label>
          </div>

          {isNewPatient ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nombre(s)
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={newPatientDetails.firstName}
                  onChange={(e) =>
                    setNewPatientDetails((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Apellidos
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={newPatientDetails.lastName}
                  onChange={(e) =>
                    setNewPatientDetails((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
          ) : (
            <div>
              <label
                htmlFor="patient_name"
                className="block text-sm font-medium text-gray-700"
              >
                Nombre del Paciente
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="patient_name"
                  id="patient_name"
                  value={appointment.patient_name}
                  onChange={handleChange}
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowResults(true);
                    } else {
                      searchClients(appointment.patient_name);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding to allow click event on result
                    setTimeout(() => setShowResults(false), 200);
                  }}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Buscar por nombre..."
                  required
                  autoComplete="off"
                />
                {showResults && (
                  <div className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-b-md py-0 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    <div
                      className="cursor-pointer select-none relative py-3 pl-3 pr-9 hover:bg-gray-100 border-b border-gray-100 bg-gray-50"
                      onClick={() => {
                        setIsNewPatient(true);
                        setAppointment((prev) => ({
                          ...prev,
                          patient_name: '',
                        }));
                        setShowResults(false);
                      }}
                    >
                      <div className="flex items-center justify-center text-gray-700">
                        <Plus size={14} className="mr-1" />
                        <span className="text-sm underline">
                          Crear como nuevo paciente
                        </span>
                      </div>
                    </div>

                    {searchResults.map((result, index) => (
                      <div
                        key={`${result.type}-${result.id}-${index}`}
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 bg-white border-b border-gray-50 last:border-0"
                        onClick={() => selectClient(result)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 text-sm">
                            {result.name}
                          </span>
                          <span className="text-xs text-gray-500 mt-0.5">
                            {result.email || 'Sin email'} |{' '}
                            {result.phone || 'Sin teléfono'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {appointment.patient_name && (
                <p className="mt-1 text-xs text-indigo-600 font-medium">
                  Sesiones anteriores: {sessionCount} (Esta será la #
                  {sessionCount + 1})
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="patient_phone"
                className="block text-sm font-medium text-gray-700"
              >
                Teléfono
              </label>
              <input
                type="tel"
                name="patient_phone"
                id="patient_phone"
                value={appointment.patient_phone}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="55 1234 5678"
              />
            </div>
            <div>
              <label
                htmlFor="patient_email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                name="patient_email"
                id="patient_email"
                value={appointment.patient_email}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700"
              >
                Fecha
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  name="date"
                  id="date"
                  value={appointment.date}
                  onChange={handleChange}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="time"
                className="block text-sm font-medium text-gray-700"
              >
                Hora
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="time"
                  name="time"
                  id="time"
                  value={appointment.time}
                  onChange={handleChange}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="therapist_id"
              className="block text-sm font-medium text-gray-700"
            >
              Terapeuta
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <select
                name="therapist_id"
                id="therapist_id"
                value={appointment.therapist_id}
                onChange={handleChange}
                disabled={userRole === 'therapist'}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100 disabled:text-gray-700"
                required
              >
                <option value="">
                  {therapists.length === 0
                    ? '⚠️ No hay terapeutas disponibles'
                    : 'Selecciona un terapeuta'}
                </option>
                {therapists.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            {therapists.length === 0 && (
              <p className="mt-1 text-xs text-red-600">
                ⚠️ No hay terapeutas en la base de datos. Por favor, agrega
                terapeutas primero.
              </p>
            )}
            {userRole === 'therapist' && (
              <p className="mt-1 text-xs text-gray-500">
                Las citas se crean automáticamente para tu agenda
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="service"
              className="block text-sm font-medium text-gray-700"
            >
              Servicio
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag className="h-5 w-5 text-gray-400" />
              </div>
              <select
                name="service"
                id="service"
                value={appointment.service}
                onChange={handleChange}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                required
              >
                <option value="">Selecciona un servicio</option>
                {SERVICES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="branch"
              className="block text-sm font-medium text-gray-700"
            >
              Sucursal
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <select
                name="branch"
                id="branch"
                value={appointment.branch}
                onChange={handleChange}
                className="focus:ring-teal-500 focus:border-teal-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                required
              >
                <option value="">Selecciona una sucursal</option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700"
            >
              Notas
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                name="notes"
                id="notes"
                rows="3"
                value={appointment.notes}
                onChange={handleChange}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Notas adicionales sobre la cita"
              ></textarea>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
