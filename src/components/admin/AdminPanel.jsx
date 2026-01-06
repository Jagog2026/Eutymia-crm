import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Users,
  UserPlus,
  Shield,
  Activity,
  Search,
  Edit2,
  Trash2,
  UserX,
  UserCheck,
  Key,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';

import UserModal from './UserModal';
import PasswordModal from './PasswordModal';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [users]);

  async function fetchUsers() {
    console.log('[AdminPanel] Fetching users...');
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          therapist:therapist_id (
            id,
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[AdminPanel] Error fetching users:', error);
        throw error;
      }

      console.log('[AdminPanel] Users fetched:', data);
      setUsers(data || []);
    } catch (err) {
      console.error('[AdminPanel] Error:', err);
      alert('Error al cargar usuarios: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function calculateStats() {
    const total = users.length;
    const active = users.filter(u => u.active !== false).length;
    const inactive = total - active;
    const admins = users.filter(u => u.role === 'admin').length;

    setStats({ total, active, inactive, admins });
  }

  async function toggleUserStatus(userId, currentStatus) {
    console.log('[AdminPanel] Toggling user status:', userId, currentStatus);
    try {
      const { error } = await supabase
        .from('users')
        .update({ active: !currentStatus })
        .eq('id', userId);

      if (error) {
        console.error('[AdminPanel] Error toggling status:', error);
        throw error;
      }

      setUsers(users.map(user =>
        user.id === userId ? { ...user, active: !currentStatus } : user
      ));

      console.log('[AdminPanel] User status toggled successfully');
    } catch (err) {
      console.error('[AdminPanel] Error:', err);
      alert('Error al actualizar el estado del usuario: ' + err.message);
    }
  }

  async function deleteUser(userId, userEmail) {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el usuario ${userEmail}? Esta acción no se puede deshacer.`)) {
      return;
    }

    console.log('[AdminPanel] Deleting user:', userId);
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('[AdminPanel] Error deleting user:', error);
        throw error;
      }

      setUsers(users.filter(user => user.id !== userId));
      console.log('[AdminPanel] User deleted successfully');
    } catch (err) {
      console.error('[AdminPanel] Error:', err);
      alert('Error al eliminar el usuario: ' + err.message);
    }
  }

  function handleOpenPasswordModal(user) {
    setSelectedUser(user);
    setIsPasswordModalOpen(true);
  }

  function handleOpenUserModal(user = null) {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.active !== false) ||
      (filterStatus === 'inactive' && user.active === false);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role) => {
    const badges = {
      admin: { label: 'Administrador', color: 'bg-purple-100 text-purple-800' },
      therapist: { label: 'Terapeuta', color: 'bg-blue-100 text-blue-800' },
      reception: { label: 'Recepción', color: 'bg-green-100 text-green-800' },
      user: { label: 'Usuario', color: 'bg-gray-100 text-gray-800' }
    };
    return badges[role] || badges.user;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="animate-spin text-teal-600 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="text-teal-600" size={28} />
                Panel de Administración
              </h1>
              <p className="text-gray-600 mt-1">Gestiona usuarios y permisos del sistema</p>
            </div>
            <button
              onClick={() => handleOpenUserModal()}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
            >
              <UserPlus size={20} />
              Nuevo Usuario
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Usuarios</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <Users className="text-blue-500" size={32} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Usuarios Activos</p>
                  <p className="text-2xl font-bold text-green-900">{stats.active}</p>
                </div>
                <CheckCircle className="text-green-500" size={32} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Usuarios Inactivos</p>
                  <p className="text-2xl font-bold text-red-900">{stats.inactive}</p>
                </div>
                <AlertCircle className="text-red-500" size={32} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Administradores</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.admins}</p>
                </div>
                <Shield className="text-purple-500" size={32} />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="therapist">Terapeuta</option>
              <option value="reception">Recepción</option>
              <option value="user">Usuario</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg border shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Terapeuta Asociado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contraseña
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const roleBadge = getRoleBadge(user.role);
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold">
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || 'Sin nombre'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${roleBadge.color}`}>
                        {roleBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.therapist ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{user.therapist.name}</div>
                          <div className="text-gray-500">{user.therapist.email}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.active !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.active !== false ? (
                          <span className="flex items-center gap-1">
                            <Activity size={12} />
                            Activo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <UserX size={12} />
                            Suspendido
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-xs font-mono">
                        {user.password}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenUserModal(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar usuario"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleOpenPasswordModal(user)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Cambiar contraseña"
                        >
                          <Key size={18} />
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user.id, user.active !== false)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.active !== false
                              ? 'text-orange-600 hover:bg-orange-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={user.active !== false ? "Suspender usuario" : "Activar usuario"}
                        >
                          {user.active !== false ? <UserX size={18} /> : <UserCheck size={18} />}
                        </button>
                        <button
                          onClick={() => deleteUser(user.id, user.email)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <Users className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 text-lg">No se encontraron usuarios</p>
              <p className="text-gray-400 text-sm mt-2">Intenta ajustar los filtros de búsqueda</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isUserModalOpen && (
        <UserModal
          user={selectedUser}
          onClose={() => {
            setIsUserModalOpen(false);
            setSelectedUser(null);
          }}
          onSave={() => {
            fetchUsers();
            setIsUserModalOpen(false);
            setSelectedUser(null);
          }}
        />
      )}

      {isPasswordModalOpen && (
        <PasswordModal
          user={selectedUser}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setSelectedUser(null);
          }}
          onSave={() => {
            fetchUsers();
            setIsPasswordModalOpen(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}
