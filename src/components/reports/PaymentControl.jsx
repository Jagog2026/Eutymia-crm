import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, CheckCircle, AlertCircle, FileText, Calendar } from 'lucide-react';

export default function PaymentControl({ onPaymentChanged }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'paid'
  const [currentMonth, setCurrentMonth] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Auto-refresh when month changes
  useEffect(() => {
    const checkMonthChange = setInterval(() => {
      const now = new Date();
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const newMonth = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

      if (currentMonth && currentMonth !== newMonth) {
        console.log('[PaymentControl] Month changed detected:', currentMonth, '->', newMonth);
        console.log('[PaymentControl] Auto-refreshing data for new month');
        fetchAppointments();
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkMonthChange);
  }, [currentMonth]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      console.log('[PaymentControl] Fetching appointments for current month only');

      // Calculate current month date range
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      // Set current month display name
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      setCurrentMonth(`${monthNames[now.getMonth()]} ${now.getFullYear()}`);

      console.log('[PaymentControl] Date range (Current Month):', startStr, 'to', endStr);

      // Fetch only appointments in current month
      const { data, error } = await supabase
        .from('appointments')
        .select('*, therapists(name)')
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date', { ascending: false });

      if (error) throw error;

      console.log('[PaymentControl] Loaded', (data || []).length, 'appointments for current month');
      setAppointments(data || []);
    } catch (err) {
      console.error('[PaymentControl] Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };


  const filteredAppointments = appointments.filter(app => {
    const matchesSearch = app.patient_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' 
      ? true 
      : filterStatus === 'pending' 
        ? app.payment_status !== 'paid' && app.payment_status !== 'pagado'
        : app.payment_status === 'paid' || app.payment_status === 'pagado';
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="text-teal-600" />
          Control de Pagos
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Visualiza y gestiona los pagos de las sesiones.
        </p>
      </div>

      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre del paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${filterStatus === 'all' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${filterStatus === 'pending' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setFilterStatus('paid')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${filterStatus === 'paid' ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
            >
              Pagados
            </button>
          </div>
        </div>

        {/* Current Month Indicator */}
        <div className="flex items-center gap-2 bg-teal-50 px-4 py-2 rounded-lg border border-teal-200 w-fit">
          <Calendar className="text-teal-600" size={18} />
          <span className="text-sm font-medium text-teal-800">Mostrando:</span>
          <span className="text-sm font-bold text-teal-900">{currentMonth}</span>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicio / Terapeuta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Pago</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <span>Cargando citas...</span>
                  </div>
                </td>
              </tr>
            ) : filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                  No se encontraron citas con los filtros actuales.
                </td>
              </tr>
            ) : (
              filteredAppointments.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(app.date).toLocaleDateString()}
                    <div className="text-xs text-gray-400">{app.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{app.patient_name}</div>
                    <div className="text-xs text-gray-500">{app.patient_phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{app.service}</div>
                    <div className="text-xs text-gray-500">{app.therapists?.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${app.price || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {app.payment_status === 'paid' || app.payment_status === 'pagado' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-teal-100 text-teal-800">
                        <CheckCircle size={14} className="mr-1" />
                        Pagado
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        <AlertCircle size={14} className="mr-1" />
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {app.payment_date ? (
                      <span>{new Date(app.payment_date).toLocaleDateString()}</span>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Sin fecha</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}