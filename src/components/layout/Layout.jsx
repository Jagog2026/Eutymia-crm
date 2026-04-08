import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  Calendar,
  Users,
  BarChart2,
  LayoutDashboard,
  BookOpen,
  Receipt,
  Database,
  Settings,
  LogOut,
  User,
  Shield,
  MessageCircle,
  Menu,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';

import SettingsModal from './SettingsModal';
import { useTheme } from '../ThemeProvider';

export default function Layout({ children, userRole, userEmail }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const { theme, setTheme } = useTheme();

  const companySettings = {
    name: 'Eutymia',
    logo: null,
  };

  // Definir menú según rol
  const allMenuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'reception'] },
    { path: '/agenda', icon: Calendar, label: 'Agenda', roles: ['admin', 'therapist', 'reception'] },
    { path: '/leads', icon: Users, label: 'Leads (CRM)', roles: ['admin', 'reception'] },
    { path: '/database', icon: Database, label: 'Base de Datos', roles: ['admin', 'reception'] },
    { path: '/expenses', icon: Receipt, label: 'Gastos', roles: ['admin'] },
    { path: '/therapists', icon: Users, label: 'Terapeutas', roles: ['admin', 'reception'] },
    { path: '/workshops', icon: BookOpen, label: 'Talleres', roles: ['admin', 'reception'] },
    { path: '/reports', icon: BarChart2, label: 'Reportes', roles: ['admin'] },
    { path: '/whatsapp', icon: MessageCircle, label: 'WhatsApp', roles: ['admin', 'reception'] },
    { path: '/admin', icon: Shield, label: 'Administración', roles: ['admin'] },
  ];

  // Filtrar menú según rol del usuario
  const menuItems = allMenuItems.filter(item => 
    item.roles.includes(userRole)
  );

  const handleLogout = async () => {
    try {
      console.log('[LOGOUT] Cerrando sesión...');
      
      // Verificar si es sesión legacy
      const legacySession = localStorage.getItem('user_session');
      if (legacySession) {
        try {
          const userData = JSON.parse(legacySession);
          if (userData.legacy_auth) {
            console.log('[LOGOUT] Cerrando sesión legacy');
            localStorage.removeItem('user_session');
            navigate('/login');
            return;
          }
        } catch (e) {
          console.error('[LOGOUT] Error al verificar sesión legacy:', e);
        }
      }
      
      // Cerrar sesión en Supabase Auth
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[LOGOUT] Error al cerrar sesión:', error);
      }
      
      console.log('[LOGOUT] Sesión cerrada exitosamente');
      
      // Redirigir al login
      navigate('/login');
    } catch (error) {
      console.error('[LOGOUT] Error logging out:', error);
      // Forzar redirección al login de todas formas
      navigate('/login');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-sans selection:bg-teal-100 dark:selection:bg-teal-900">
      {/* Sidebar */}
      <div 
        className={`relative bg-white dark:bg-slate-900 shadow-sm border-r border-slate-100 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out z-10 ${
          isExpanded ? 'w-64' : 'w-20'
        } shrink-0`}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -right-3 top-8 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-200 shadow-sm z-20"
        >
          {isExpanded ? <ChevronLeft size={14} strokeWidth={2.5} /> : <ChevronRight size={14} strokeWidth={2.5} />}
        </button>

        <div className={`p-5 flex items-center ${isExpanded ? 'justify-start gap-3' : 'justify-center'} h-20`}>
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 shadow-teal-500/20 shadow-lg rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0">
            {companySettings.name.charAt(0)}
          </div>
          {isExpanded && (
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-700 dark:from-teal-400 to-teal-900 dark:to-teal-600 tracking-tight whitespace-nowrap overflow-hidden">
              {companySettings.name}
            </span>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto no-scrollbar">
          {menuItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={!isExpanded ? item.label : undefined}
                className={`flex items-center ${isExpanded ? 'justify-start px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 shadow-sm shadow-teal-100/50 dark:shadow-none'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <item.icon 
                  size={20} 
                  className={`shrink-0 transition-transform ${isActive ? 'scale-110 text-teal-600 dark:text-teal-400' : 'group-hover:scale-110'}`} 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
                {isExpanded && (
                  <span className="ml-3 whitespace-nowrap truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 mt-auto flex flex-col gap-1.5 border-t border-slate-100 dark:border-slate-800">
          
          {/* Theme Toggle */}
          <div className={`flex items-center ${isExpanded ? 'justify-between px-3' : 'justify-center px-0'} py-2 mb-1`}>
            {isExpanded && <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Apariencia</span>}
            <div className={`flex items-center ${isExpanded ? 'flex-row gap-1' : 'flex-col gap-1'} bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700`}>
              <button
                onClick={() => setTheme('light')}
                title={!isExpanded ? "Claro" : undefined}
                className={`p-1.5 rounded-lg transition-all ${theme === 'light' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <Sun size={14} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => setTheme('system')}
                title={!isExpanded ? "Sistema" : undefined}
                className={`p-1.5 rounded-lg transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <Laptop size={14} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => setTheme('dark')}
                title={!isExpanded ? "Oscuro" : undefined}
                className={`p-1.5 rounded-lg transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <Moon size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* User Info Button/Area */}
          <div className={`flex items-center ${isExpanded ? 'gap-3 px-3' : 'justify-center px-0'} py-3 mb-1 rounded-xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700`}>
            <div className="relative w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900 border border-teal-200 dark:border-teal-700 flex items-center justify-center text-teal-700 dark:text-teal-400 shrink-0 shadow-sm">
              <User size={16} strokeWidth={2.5} />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
            </div>
            {isExpanded && (
              <div className="flex-1 min-w-0 flex flex-col">
                <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">{userEmail?.split('@')[0] || 'Usuario'}</p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 capitalize tracking-wide">
                  {userRole === 'admin' ? 'Administrador' : userRole === 'therapist' ? 'Terapeuta' : userRole === 'reception' ? 'Recepción' : 'Usuario'}
                </p>
              </div>
            )}
          </div>

          {/* Configuración (solo admin) */}
          {userRole === 'admin' && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              title={!isExpanded ? "Configuración" : undefined}
              className={`w-full flex items-center ${isExpanded ? 'justify-start px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-[14px] font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-colors group`}
            >
              <Settings size={20} className="shrink-0 group-hover:rotate-45 transition-transform duration-300" />
              {isExpanded && <span className="ml-3">Configuración</span>}
            </button>
          )}

          {/* Cerrar sesión */}
          <button
            onClick={handleLogout}
            title={!isExpanded ? "Cerrar Sesión" : undefined}
            className={`w-full flex items-center ${isExpanded ? 'justify-start px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-[14px] font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors group`}
          >
            <LogOut size={20} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
            {isExpanded && <span className="ml-3">Cerrar Sesión</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 relative">
        {/* Agregamos un ligero fade/blur detrás del contenido principal como detalle decorativo (opcional) */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-teal-50/40 dark:from-teal-900/10 to-transparent pointer-events-none -z-10"></div>
        <div className="h-full w-full max-w-[1600px] mx-auto p-4 md:p-8 animate-fade-in z-0">
          {children}
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdate={() => {}}
      />
    </div>
  );
}
