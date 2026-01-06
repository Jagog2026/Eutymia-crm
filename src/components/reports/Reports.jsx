import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, AlertCircle, Download, FileText, PieChart, Activity, CreditCard, Check, Search } from 'lucide-react';
import PaymentControl from './PaymentControl';

export default function Reports({ reportsRefreshKey }) {
  const [activeTab, setActiveTab] = useState('financial'); // 'financial' or 'payments'
  const [stats, setStats] = useState({
    income: 0,
    expenses: 0,
    profit: 0,
    sessions: 0,
    pendingPayment: 0
  });
  const [therapistStats, setTherapistStats] = useState([]);
  const [serviceStats, setServiceStats] = useState([]);
  const [redNumbers, setRedNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayments, setProcessingPayments] = useState(new Set());
  const [successMessage, setSuccessMessage] = useState('');
  const [currentMonth, setCurrentMonth] = useState('');
  const [showPeriodSelector, setShowPeriodSelector] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    console.log('[Reports] Refreshing data - refreshKey:', reportsRefreshKey, 'activeTab:', activeTab);
    fetchData();
  }, [reportsRefreshKey, activeTab, selectedMonth, selectedYear]);

  // Auto-refresh when month changes
  useEffect(() => {
    const checkMonthChange = setInterval(() => {
      const now = new Date();
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const newMonth = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

      if (currentMonth && currentMonth !== newMonth) {
        console.log('[Reports] Month changed detected:', currentMonth, '->', newMonth);
        console.log('[Reports] Auto-refreshing data for new month');
        fetchData();
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkMonthChange);
  }, [currentMonth]);

  const fetchData = async () => {
    console.log('[Reports] Starting fetchData - showing selected period');
    setLoading(true);
    try {
      // 1. Determine Date Range - Use selected month/year or current
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0);

      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      // Set current month display name (e.g., "Enero 2026")
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      setCurrentMonth(`${monthNames[selectedMonth]} ${selectedYear}`);

      console.log('[Reports] Date range:', startStr, 'to', endStr);
      console.log('[Reports] Displaying data for:', `${monthNames[selectedMonth]} ${selectedYear}`);

      // 2. Fetch Data
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*, therapists(name, commission_percentage, commissions)')
        .gte('date', startStr)
        .lte('date', endStr);

      const { data: workshops } = await supabase
        .from('workshops')
        .select('*')
        .gte('date', startStr)
        .lte('date', endStr);

      // 3. Process Data
      let totalIncome = 0;
      let totalSessions = 0;
      let pendingPayment = 0;
      
      // Process Appointments
      const tStats = {};
      const sStats = {};
      const redList = [];

      (appointments || []).forEach(app => {
        const price = parseFloat(app.price || 0);
        
        // Income & Sessions
        // Consideramos sesiones completadas o confirmadas
        const isValidSession = ['completed', 'confirmed', 'asiste', 'confirmada'].includes(app.status);
        
        if (isValidSession) {
          totalSessions++;
          
          const isPaid = ['pagado', 'paid'].includes(app.payment_status);
          
          if (isPaid) {
            totalIncome += price;

            console.log('[Reports] Processing paid appointment:', {
              id: app.id,
              patient: app.patient_name,
              service: app.service,
              payment_status: app.payment_status,
              hasProof: !!app.payment_proof_url,
              hasPaymentDate: !!app.payment_date
            });

            // RULE: Once an appointment is marked as 'paid', it should NOT appear in red numbers
            // regardless of whether it has a payment proof or not
            // User explicitly confirmed payment by clicking "Mark Paid" button
          } else {
            pendingPayment += price;
            redList.push({
              id: app.id,
              type: 'Pendiente Pago',
              description: `${app.service} - ${app.patient_name}`,
              amount: price,
              date: app.date,
              responsible: app.therapists?.name || 'Sin asignar'
            });
          }
        }

        // Therapist Stats
        const tName = app.therapists?.name || 'Sin Asignar';
        const tCommissions = app.therapists?.commissions || {};
        
        if (!tStats[tName]) tStats[tName] = { 
          name: tName, 
          sessions: 0, 
          income: 0,
          commissionToPay: 0
        };
        
        if (isValidSession) {
          tStats[tName].sessions++;
          
          const isPaid = ['pagado', 'paid'].includes(app.payment_status);
          
          if (isPaid) {
            tStats[tName].income += price;
            
            // Calculate commission based on service
            let commissionAmount = 0;
            if (tCommissions[app.service]) {
              commissionAmount = parseFloat(tCommissions[app.service]);
            } else if (app.therapists?.commission_percentage) {
              // Fallback to percentage if defined and no specific commission
              commissionAmount = price * (app.therapists.commission_percentage / 100);
            }
            
            tStats[tName].commissionToPay += commissionAmount;
          }
        }

        // Service Stats
        const sName = app.service || 'Otro';
        if (!sStats[sName]) sStats[sName] = { name: sName, count: 0, income: 0 };
        
        if (isValidSession) {
          sStats[sName].count++;
          const isPaid = ['pagado', 'paid'].includes(app.payment_status);
          sStats[sName].income += (isPaid ? price : 0);
        }
      });

      // Process Workshops
      (workshops || []).forEach(ws => {
        const income = (parseFloat(ws.price) || 0) * (parseInt(ws.attendees) || 0);
        totalIncome += income;
        
        // Add to Service Stats
        const sName = `Taller: ${ws.title}`;
        if (!sStats[sName]) sStats[sName] = { name: sName, count: 1, income: 0 };
        sStats[sName].income += income;
      });

      // Final Calculations
      const totalStatsIncome = totalIncome; // For percentage calc
      
      const finalTStats = Object.values(tStats).map(t => ({
        ...t,
        percentage: totalStatsIncome > 0 ? ((t.income / totalStatsIncome) * 100).toFixed(1) : 0
      }));

      const finalSStats = Object.values(sStats).map(s => ({
        ...s,
        percentage: totalStatsIncome > 0 ? ((s.income / totalStatsIncome) * 100).toFixed(1) : 0
      }));

      setStats({
        income: totalIncome,
        expenses: totalIncome * 0.3, // Mock expenses (30% of income)
        profit: totalIncome * 0.7,
        sessions: totalSessions,
        pendingPayment
      });

      setTherapistStats(finalTStats);
      setServiceStats(finalSStats);
      setRedNumbers(redList);

      console.log('[Reports] ========================================');
      console.log('[Reports] DATA FETCH COMPLETE');
      console.log('[Reports] ========================================');
      console.log('  - Total Income:', totalIncome);
      console.log('  - Total Sessions:', totalSessions);
      console.log('  - Pending Payment:', pendingPayment);
      console.log('  - Red Numbers Count:', redList.length);
      console.log('[Reports] ========================================');

    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    window.print();
  };

  const handleMarkAsPaid = async (appointmentId) => {
    // Prevent duplicate processing
    if (processingPayments.has(appointmentId)) {
      console.log('[Reports] Payment already being processed:', appointmentId);
      return;
    }

    try {
      console.log('[Reports] ========================================');
      console.log('[Reports] MARKING APPOINTMENT AS PAID');
      console.log('[Reports] ID:', appointmentId);
      console.log('[Reports] ========================================');

      // Add to processing set
      setProcessingPayments(prev => new Set(prev).add(appointmentId));

      const { error, data } = await supabase
        .from('appointments')
        .update({
          payment_status: 'paid',
          payment_date: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .select();

      if (error) {
        console.error('[Reports] ❌ Error marking as paid:', error);
        alert('Error al actualizar el estado de pago');
        // Remove from processing set on error
        setProcessingPayments(prev => {
          const newSet = new Set(prev);
          newSet.delete(appointmentId);
          return newSet;
        });
        return;
      }

      console.log('[Reports] ✅ Appointment marked as paid successfully');
      console.log('[Reports] Updated data:', data);

      // Optimistic update: remove from redNumbers immediately
      setRedNumbers(prev => prev.filter(item => item.id !== appointmentId));

      // Remove from processing set
      setProcessingPayments(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });

      // Show success message
      setSuccessMessage('✓ Pago registrado exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);

      // Refresh full data in background
      setTimeout(() => fetchData(), 500);

    } catch (error) {
      console.error('[Reports] Exception marking as paid:', error);
      alert('Error al actualizar el estado de pago');
      // Remove from processing set on error
      setProcessingPayments(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const StatCard = ({ title, value, icon: Icon, color = "teal" }) => (
    <div className={`bg-white p-6 rounded-lg shadow-sm border border-${color}-100 relative group hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full bg-${color}-50 text-${color}-600`}>
          <Icon className="w-6 h-6" />
        </div>
        <button 
          onClick={handleDownload}
          className={`p-2 text-gray-400 hover:text-${color}-600 hover:bg-${color}-50 rounded-full transition-colors`}
          title="Descargar PDF"
        >
          <Download size={18} />
        </button>
      </div>
      <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );

  return (
    <div className="p-6 space-y-8 print:p-0">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <Check size={20} className="flex-shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <h1 className="text-2xl font-bold text-gray-800">Reportes y Pagos</h1>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('financial')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'financial' 
                ? 'bg-white text-teal-700 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Reportes Financieros
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'payments' 
                ? 'bg-white text-teal-700 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Control de Pagos
          </button>
        </div>
      </div>

      {activeTab === 'payments' ? (
        <PaymentControl key={reportsRefreshKey} onPaymentChanged={fetchData} />
      ) : (
        <>
          <div className="flex justify-between items-center print:hidden">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-teal-50 px-4 py-2 rounded-lg border border-teal-200">
                <Calendar className="text-teal-600" size={20} />
                <span className="text-sm font-medium text-teal-800">Período:</span>
                <span className="text-sm font-bold text-teal-900">{currentMonth}</span>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowPeriodSelector(!showPeriodSelector)}
                  className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm"
                >
                  <Search size={16} />
                  Buscar Período
                </button>

                {showPeriodSelector && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 min-w-[280px]">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Mes</label>
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value={0}>Enero</option>
                          <option value={1}>Febrero</option>
                          <option value={2}>Marzo</option>
                          <option value={3}>Abril</option>
                          <option value={4}>Mayo</option>
                          <option value={5}>Junio</option>
                          <option value={6}>Julio</option>
                          <option value={7}>Agosto</option>
                          <option value={8}>Septiembre</option>
                          <option value={9}>Octubre</option>
                          <option value={10}>Noviembre</option>
                          <option value={11}>Diciembre</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Año</label>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          {[...Array(5)].map((_, i) => {
                            const year = new Date().getFullYear() - 2 + i;
                            return <option key={year} value={year}>{year}</option>;
                          })}
                        </select>
                      </div>

                      <button
                        onClick={() => setShowPeriodSelector(false)}
                        className="w-full bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors text-sm font-medium"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors text-sm"
            >
              <Download size={16} />
              Descargar Todo
            </button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Ingresos Totales" 
          value={`${stats.income.toLocaleString()}`} 
          icon={DollarSign} 
        />
        <StatCard 
          title="Sesiones" 
          value={stats.sessions} 
          icon={Calendar} 
        />
        <StatCard 
          title="Utilidad Estimada" 
          value={`${stats.profit.toLocaleString()}`} 
          icon={TrendingUp} 
        />
        <StatCard 
          title="Por Cobrar" 
          value={`${stats.pendingPayment.toLocaleString()}`} 
          icon={AlertCircle} 
          color="red"
        />
      </div>

      {/* Red Numbers Report */}
      {redNumbers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-red-100 overflow-hidden">
          <div className="p-4 bg-red-50 border-b border-red-100 flex justify-between items-center">
            <h3 className="font-bold text-red-800 flex items-center gap-2">
              <AlertCircle size={20} />
              Reporte de Números Rojos (Pendientes de Pago)
            </h3>
            <button onClick={handleDownload} className="text-red-600 hover:text-red-800"><Download size={18}/></button>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-96">
            <table className="w-full text-sm text-left">
              <thead className="bg-red-50 text-red-900 font-medium sticky top-0 z-10">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Descripción</th>
                  <th className="p-3">Responsable</th>
                  <th className="p-3 text-right">Monto</th>
                  <th className="p-3 text-center print:hidden">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {redNumbers.map((item, idx) => (
                  <tr key={idx} className="hover:bg-red-50/50">
                    <td className="p-3">{item.date}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.type === 'Falta Comprobante' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="p-3">{item.description}</td>
                    <td className="p-3">{item.responsible}</td>
                    <td className="p-3 text-right font-bold text-red-600">${item.amount.toLocaleString()}</td>
                    <td className="p-3 text-center print:hidden">
                      {item.type === 'Falta Comprobante' && (
                        processingPayments.has(item.id) ? (
                          <button
                            disabled
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-500 text-white text-xs font-medium rounded cursor-wait opacity-75"
                            title="Procesando..."
                          >
                            <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Procesando...
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkAsPaid(item.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded hover:bg-teal-700 transition-all duration-200 hover:shadow-md active:scale-95"
                            title="Marcar como pagado"
                          >
                            <Check size={14} />
                            Marcar Pagado
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Therapist Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-teal-100 overflow-hidden">
          <div className="p-4 bg-teal-50 border-b border-teal-100 flex justify-between items-center">
            <h3 className="font-bold text-teal-800 flex items-center gap-2">
              <Users size={20} />
              Rendimiento y Comisiones
            </h3>
            <button onClick={handleDownload} className="text-teal-600 hover:text-teal-800"><Download size={18}/></button>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-96">
            <table className="w-full text-sm text-left">
              <thead className="bg-teal-50 text-teal-900 font-medium sticky top-0 z-10">
                <tr>
                  <th className="p-3">Terapeuta</th>
                  <th className="p-3 text-center">Sesiones</th>
                  <th className="p-3 text-right">Ingresos</th>
                  <th className="p-3 text-right">A Pagar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-100">
                {therapistStats.map((t, idx) => (
                  <tr key={idx} className="hover:bg-teal-50/50">
                    <td className="p-3 font-medium text-gray-900">{t.name}</td>
                    <td className="p-3 text-center">{t.sessions}</td>
                    <td className="p-3 text-right">${t.income.toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-teal-600">
                      ${t.commissionToPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {therapistStats.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-gray-500">No hay datos en este periodo</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Income by Service */}
        <div className="bg-white rounded-lg shadow-sm border border-teal-100 overflow-hidden">
          <div className="p-4 bg-teal-50 border-b border-teal-100 flex justify-between items-center">
            <h3 className="font-bold text-teal-800 flex items-center gap-2">
              <PieChart size={20} />
              Ingresos por Servicio
            </h3>
            <button onClick={handleDownload} className="text-teal-600 hover:text-teal-800"><Download size={18}/></button>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-96">
            <table className="w-full text-sm text-left">
              <thead className="bg-teal-50 text-teal-900 font-medium sticky top-0 z-10">
                <tr>
                  <th className="p-3">Servicio</th>
                  <th className="p-3 text-center">Cantidad</th>
                  <th className="p-3 text-right">Ingresos</th>
                  <th className="p-3 text-right">% Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-100">
                {serviceStats.map((s, idx) => (
                  <tr key={idx} className="hover:bg-teal-50/50">
                    <td className="p-3 font-medium text-gray-900">{s.name}</td>
                    <td className="p-3 text-center">{s.count}</td>
                    <td className="p-3 text-right">${s.income.toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <span className="inline-block px-2 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold">
                        {s.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
                {serviceStats.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-gray-500">No hay datos en este periodo</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}