import React, { useEffect, useState } from 'react';
import { Users, Calendar, DollarSign, TrendingUp, Receipt, ArrowDown, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';

function getTimeAgo(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`;
  return date.toLocaleDateString();
}

export default function Dashboard({ reportsRefreshKey }) {
  const [expenses, setExpenses] = useState({ total: 0, fixed: 0, variable: 0 });
  const [branchStats, setBranchStats] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState(0);
  const [activePatients, setActivePatients] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [growth, setGrowth] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [reportsRefreshKey]);

  async function fetchData() {
    try {
      await Promise.all([
        fetchExpenses(),
        fetchBranchStats(),
        fetchTodayAppointments(),
        fetchActivePatients(),
        fetchMonthlyIncome(),
        fetchGrowth(),
        fetchUpcomingAppointments(),
        fetchRecentActivity()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBranchStats() {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('branch');
      
      if (error) throw error;

      const counts = {};
      let total = 0;
      
      data.forEach(app => {
        if (app.branch) {
          counts[app.branch] = (counts[app.branch] || 0) + 1;
          total++;
        }
      });

      const stats = Object.keys(counts).map(branch => ({
        branch,
        count: counts[branch],
        percentage: total > 0 ? Math.round((counts[branch] / total) * 100) : 0
      })).sort((a, b) => b.count - a.count);

      setBranchStats(stats);
    } catch (error) {
      console.error('Error fetching branch stats:', error);
    }
  }

  async function fetchExpenses() {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('amount, type');
      
      if (error) throw error;

      const summary = data.reduce((acc, curr) => {
        const amount = parseFloat(curr.amount) || 0;
        acc.total += amount;
        if (curr.type === 'fixed') acc.fixed += amount;
        if (curr.type === 'variable') acc.variable += amount;
        return acc;
      }, { total: 0, fixed: 0, variable: 0 });

      setExpenses(summary);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  }

  async function fetchTodayAppointments() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('appointments')
        .select('id')
        .eq('date', today)
        .neq('status', 'cancelada');
      
      if (error) throw error;
      setTodayAppointments(data?.length || 0);
    } catch (error) {
      console.error('Error fetching today appointments:', error);
    }
  }

  async function fetchActivePatients() {
    try {
      // Contar leads con status que no sean 'lost' o 'closed'
      const { data, error } = await supabase
        .from('leads')
        .select('id')
        .not('status', 'in', '(lost,closed)');
      
      if (error) throw error;
      setActivePatients(data?.length || 0);
    } catch (error) {
      console.error('Error fetching active patients:', error);
    }
  }

  async function fetchMonthlyIncome() {
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('appointments')
        .select('price')
        .gte('date', firstDay)
        .lte('date', lastDay)
        .eq('payment_status', 'paid');
      
      if (error) throw error;

      const total = data.reduce((sum, app) => sum + (parseFloat(app.price) || 0), 0);
      setMonthlyIncome(total);
    } catch (error) {
      console.error('Error fetching monthly income:', error);
    }
  }

  async function fetchGrowth() {
    try {
      const now = new Date();
      
      // Mes actual
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      // Mes anterior
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      
      const [currentMonth, lastMonth] = await Promise.all([
        supabase
          .from('appointments')
          .select('price')
          .gte('date', currentMonthStart)
          .lte('date', currentMonthEnd)
          .eq('payment_status', 'paid'),
        supabase
          .from('appointments')
          .select('price')
          .gte('date', lastMonthStart)
          .lte('date', lastMonthEnd)
          .eq('payment_status', 'paid')
      ]);

      if (currentMonth.error || lastMonth.error) throw currentMonth.error || lastMonth.error;

      const currentTotal = currentMonth.data.reduce((sum, app) => sum + (parseFloat(app.price) || 0), 0);
      const lastTotal = lastMonth.data.reduce((sum, app) => sum + (parseFloat(app.price) || 0), 0);

      const growthPercentage = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0;
      setGrowth(Math.round(growthPercentage));
    } catch (error) {
      console.error('Error fetching growth:', error);
    }
  }

  async function fetchUpcomingAppointments() {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().split(' ')[0];

      const { data, error } = await supabase
        .from('appointments')
        .select('id, patient_name, service, time, status, date')
        .gte('date', today)
        .neq('status', 'cancelada')
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(3);
      
      if (error) throw error;

      // Filtrar citas que sean de hoy pero ya pasaron
      const filtered = data.filter(app => {
        if (app.date === today) {
          return app.time >= currentTime;
        }
        return true;
      });

      setUpcomingAppointments(filtered.slice(0, 3));
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
    }
  }

  async function fetchRecentActivity() {
    try {
      // Obtener últimos leads y pagos
      const [leadsResult, paymentsResult] = await Promise.all([
        supabase
          .from('leads')
          .select('name, created_at')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('appointments')
          .select('price, payment_date, patient_name')
          .eq('payment_status', 'paid')
          .not('payment_date', 'is', null)
          .order('payment_date', { ascending: false })
          .limit(3)
      ]);

      if (leadsResult.error || paymentsResult.error) {
        throw leadsResult.error || paymentsResult.error;
      }

      // Combinar y ordenar por fecha
      const activities = [
        ...leadsResult.data.map(lead => ({
          type: 'lead',
          name: lead.name,
          date: new Date(lead.created_at)
        })),
        ...paymentsResult.data.map(payment => ({
          type: 'payment',
          amount: payment.price,
          name: payment.patient_name,
          date: new Date(payment.payment_date)
        }))
      ].sort((a, b) => b.date - a.date).slice(0, 5);

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard General</h1>
      
      {/* Resumen de Gastos */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Resumen de Gastos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase font-medium">Total Gastos</p>
                <h3 className="text-2xl font-bold text-red-600 mt-1">${expenses.total.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-red-50 rounded-full text-red-600">
                <Receipt size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase font-medium">Gastos Fijos</p>
                <h3 className="text-2xl font-bold text-orange-600 mt-1">${expenses.fixed.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-orange-50 rounded-full text-orange-600">
                <ArrowDown size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase font-medium">Gastos Variables</p>
                <h3 className="text-2xl font-bold text-yellow-600 mt-1">${expenses.variable.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-yellow-50 rounded-full text-yellow-600">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ocupación por Sucursal */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Ocupación por Sucursal</h2>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          {branchStats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {branchStats.map((stat) => (
                <div key={stat.branch} className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-teal-600" />
                      <span className="font-medium text-gray-700">{stat.branch}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{stat.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-teal-600 h-2.5 rounded-full" 
                      style={{ width: `${stat.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">{stat.count} citas</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No hay datos de sucursales disponibles aún.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase font-medium">Citas Hoy</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '...' : todayAppointments}
              </h3>
            </div>
            <div className="p-3 bg-teal-50 rounded-full text-teal-600">
              <Calendar size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase font-medium">Pacientes Activos</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '...' : activePatients}
              </h3>
            </div>
            <div className="p-3 bg-teal-50 rounded-full text-teal-600">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase font-medium">Ingresos Mes</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '...' : `$${monthlyIncome.toLocaleString()}`}
              </h3>
            </div>
            <div className="p-3 bg-teal-50 rounded-full text-teal-600">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase font-medium">Crecimiento</p>
              <h3 className={`text-2xl font-bold mt-1 ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {loading ? '...' : `${growth >= 0 ? '+' : ''}${growth}%`}
              </h3>
            </div>
            <div className={`p-3 rounded-full ${growth >= 0 ? 'bg-teal-50 text-teal-600' : 'bg-red-50 text-red-600'}`}>
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Próximas Citas</h3>
          <div className="space-y-4">
            {loading ? (
              <p className="text-gray-500 text-center py-4">Cargando...</p>
            ) : upcomingAppointments.length > 0 ? (
              upcomingAppointments.map(app => {
                const initials = app.patient_name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                
                const statusColors = {
                  'confirmada': 'bg-teal-100 text-teal-700',
                  'pendiente': 'bg-yellow-100 text-yellow-700',
                  'completada': 'bg-green-100 text-green-700'
                };

                const statusLabels = {
                  'confirmada': 'Confirmada',
                  'pendiente': 'Pendiente',
                  'completada': 'Completada'
                };

                return (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold">
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{app.patient_name}</p>
                        <p className="text-xs text-gray-500">
                          {app.service} • {app.time.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${statusColors[app.status] || 'bg-gray-100 text-gray-700'}`}>
                      {statusLabels[app.status] || app.status}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4">No hay citas próximas</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Actividad Reciente</h3>
          <div className="space-y-4">
            {loading ? (
              <p className="text-gray-500 text-center py-4">Cargando...</p>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => {
                const timeAgo = getTimeAgo(activity.date);
                return (
                  <div key={index} className="flex gap-3">
                    <div className={`w-2 h-2 mt-2 rounded-full ${activity.type === 'lead' ? 'bg-teal-500' : 'bg-green-500'}`}></div>
                    <div>
                      {activity.type === 'lead' ? (
                        <p className="text-sm text-gray-800">
                          Nuevo lead registrado: <span className="font-medium">{activity.name}</span>
                        </p>
                      ) : (
                        <p className="text-sm text-gray-800">
                          Pago recibido: <span className="font-medium">${parseFloat(activity.amount).toLocaleString()}</span>
                        </p>
                      )}
                      <p className="text-xs text-gray-500">{timeAgo}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4">No hay actividad reciente</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}