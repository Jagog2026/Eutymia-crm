import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';

import SettingsModal from './SettingsModal';

export default function Layout({ children, userRole, userEmail }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const companySettings = {
    name: 'Eutymia',
    logo: null,
  };

  // Definir menú según rol
  const allMenuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin'] },
    { path: '/agenda', icon: Calendar, label: 'Agenda', roles: ['admin', 'therapist', 'user'] },
    { path: '/leads', icon: Users, label: 'Leads (CRM)', roles: ['admin'] },
    { path: '/database', icon: Database, label: 'Base de Datos', roles: ['admin'] },
    { path: '/expenses', icon: Receipt, label: 'Gastos', roles: ['admin'] },
    { path: '/therapists', icon: Users, label: 'Terapeutas', roles: ['admin'] },
    { path: '/workshops', icon: BookOpen, label: 'Talleres', roles: ['admin'] },
    { path: '/reports', icon: BarChart2, label: 'Reportes', roles: ['admin'] },
    { path: '/admin', icon: Shield, label: 'Administración', roles: ['admin'] },
  ];

  // Filtrar menú según rol del usuario
  const menuItems = allMenuItems.filter(item => 
    item.roles.includes(userRole)
  );

  const handleLogout = () => {
    try {
      // Limpiar sesión de localStorage
      localStorage.removeItem('user_session');
      // Redirigir al login
      navigate('/login');
      // Recargar para limpiar el estado
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-16 md:w-64 bg-white border-r flex flex-col">
        <div className="p-4 md:p-6 border-b">
          <h1 className="text-xl md:text-2xl font-bold text-teal-600 flex items-center justify-center md:justify-start gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white text-sm">
              {companySettings.name.charAt(0)}
            </div>
            <span className="hidden md:inline">{companySettings.name}</span>
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-center md:justify-start px-2 md:px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon size={20} />
              <span className="hidden md:inline ml-3">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-2 md:p-4 border-t space-y-1">
          {/* Información del usuario */}
          <div className="px-2 md:px-4 py-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                <User size={16} />
              </div>
              <div className="hidden md:block flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{userEmail}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {userRole === 'admin' ? 'Administrador' : userRole === 'therapist' ? 'Terapeuta' : 'Usuario'}
                </p>
              </div>
            </div>
          </div>

          {/* Configuración (solo admin) */}
          {userRole === 'admin' && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center justify-center md:justify-start px-2 md:px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Settings size={20} />
              <span className="hidden md:inline ml-3">Configuración</span>
            </button>
          )}

          {/* Cerrar sesión */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center md:justify-start px-2 md:px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut size={20} />
            <span className="hidden md:inline ml-3">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">{children}</div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdate={() => {}}
      />
    </div>
  );
}
