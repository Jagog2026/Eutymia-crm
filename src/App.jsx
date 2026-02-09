import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import Agenda from './components/agenda/Agenda';
import Leads from './components/leads/Leads';
import Database from './components/database/Database';
import Therapists from './components/therapists/Therapists';
import Workshops from './components/workshops/Workshops';
import Reports from './components/reports/Reports';
import Expenses from './components/expenses/Expenses';
import AdminPanel from './components/admin/AdminPanel';
import WhatsAppInbox from './components/whatsapp/WhatsAppInbox';
import Login from './components/auth/Login';
import AuthCallback from './components/auth/AuthCallback';

export default function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [therapistId, setTherapistId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportsRefreshKey, setReportsRefreshKey] = useState(0);

  useEffect(() => {
    checkSession();
  }, []);

  function checkSession() {
    try {
      // Verificar sesión en localStorage
      const sessionData = localStorage.getItem('user_session');
      
      if (sessionData) {
        const userData = JSON.parse(sessionData);
        
        // Verificar que la sesión no sea muy antigua (24 horas)
        const sessionAge = Date.now() - userData.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas
        
        if (sessionAge > maxAge) {
          // Sesión expirada
          localStorage.removeItem('user_session');
          setSession(null);
          setUserRole(null);
          setUserEmail(null);
        } else {
          // Sesión válida
          setSession(userData);
          setUserRole(userData.role);
          setUserEmail(userData.email);
          setTherapistId(userData.therapist_id || null);
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
      localStorage.removeItem('user_session');
    } finally {
      setLoading(false);
    }
  }

  const triggerReportsRefresh = () => {
    console.log('[App] Triggering reports refresh, current key:', reportsRefreshKey);
    setReportsRefreshKey(prev => prev + 1);
  };

  // Componente de ruta protegida
  const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      );
    }

    if (!session) {
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return <Navigate to="/agenda" replace />;
    }

    return children;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route
          path="/login"
          element={session ? <Navigate to="/" replace /> : <Login />}
        />
        <Route path="/auth/supabase-auth-callback" element={<AuthCallback />} />

        {/* Rutas protegidas */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout userRole={userRole} userEmail={userEmail}>
                <Routes>
                  <Route
                    path="/"
                    element={
                      userRole === 'admin'
                        ? <Dashboard reportsRefreshKey={reportsRefreshKey} />
                        : <Navigate to="/agenda" replace />
                    }
                  />
                  <Route
                    path="/agenda"
                    element={<Agenda onReportsRefresh={triggerReportsRefresh} userRole={userRole} userEmail={userEmail} therapistId={therapistId} />}
                  />
                  <Route
                    path="/leads"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <Leads />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/database"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <Database />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/expenses"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <Expenses />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/therapists"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <Therapists />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/workshops"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <Workshops />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <Reports reportsRefreshKey={reportsRefreshKey} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminPanel />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/whatsapp"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <WhatsAppInbox />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
