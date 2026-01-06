import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Database as DatabaseIcon, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ImportLeadsModal from './ImportLeadsModal';
import * as XLSX from 'xlsx';

export default function Database() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchLeads();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  async function fetchLeads() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      (lead.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (lead.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (lead.phone?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalValue = filteredLeads.reduce((sum, lead) => sum + (Number(lead.value) || 0), 0);
  
  // Pagination logic
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      scheduled: 'bg-purple-100 text-purple-800',
      paid: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
      general_base: 'bg-gray-100 text-gray-800',
      partners: 'bg-teal-100 text-teal-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      new: 'Nuevo',
      contacted: 'Contactado',
      scheduled: 'Agendado',
      paid: 'Pagado',
      lost: 'Perdido',
      general_base: 'Base General',
      partners: 'Aliados/Proveedores'
    };
    return labels[status] || status;
  };

  const handleExport = () => {
    try {
      // Prepare data for export with the same format as import
      const exportData = filteredLeads.map(lead => {
        // Split full_name into first and last name
        const nameParts = (lead.full_name || lead.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Parse birth date if available
        let day = '';
        let month = '';
        let year = '';
        if (lead.birth_date) {
          const date = new Date(lead.birth_date);
          day = date.getDate();
          month = date.getMonth() + 1;
          year = date.getFullYear();
        }
        
        // Map gender back to number
        let genderValue = '';
        if (lead.gender === 'Femenino') genderValue = 1;
        else if (lead.gender === 'Masculino') genderValue = 2;
        
        return {
          "Email": lead.email || '',
          "Nombres": firstName,
          "Apellidos": lastName,
          "DNI o RFC": lead.dni || '',
          "Número de cliente": lead.client_number || '',
          "Teléfono": lead.phone || '',
          "Teléfono secundario del cliente": lead.secondary_phone || '',
          "Dirección": lead.address || '',
          "comuna": lead.comuna || '',
          "Ciudad": lead.city || '',
          "Edad": lead.age || '',
          "Género. 1 = Femenino, 2 = Masculino": genderValue,
          "Día del nacimiento": day,
          "Mes del nacimiento": month,
          "Año de nacimiento.": year,
          "Fecha de creación.": lead.created_at ? new Date(lead.created_at).toISOString().split('T')[0] : ''
        };
      });
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
      
      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `leads_export_${date}.xlsx`;
      
      // Download file
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Error exporting leads:', error);
      alert('Error al exportar los datos. Por favor, intenta de nuevo.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto overflow-y-auto max-h-[calc(100vh-100px)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DatabaseIcon className="w-8 h-8 text-teal-600" />
            Base de Datos
          </h1>
          <p className="text-gray-500 mt-1">Gestión completa de todos los contactos y leads</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Upload size={20} />
            Importar Excel
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Download size={20} />
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Total Registros</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{filteredLeads.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Valor Estimado Total</p>
          <p className="text-3xl font-bold text-teal-600 mt-2">
            ${totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Nuevos Leads</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {filteredLeads.filter(l => l.status === 'new').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredLeads.length)} de {filteredLeads.length} registros
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Siguiente
            </button>
          </div>
        </div>
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="new">Nuevo</option>
              <option value="contacted">Contactado</option>
              <option value="scheduled">Agendado</option>
              <option value="paid">Pagado</option>
              <option value="lost">Perdido</option>
              <option value="general_base">Base General</option>
              <option value="partners">Aliados/Proveedores</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Servicio</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Origen</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    Cargando datos...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No se encontraron registros
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{lead.full_name || lead.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{lead.email}</div>
                      <div className="text-sm text-gray-500">{lead.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{lead.service || lead.service_interest || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{lead.source || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        ${(Number(lead.value) || 0).toLocaleString('es-MX')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {getStatusLabel(lead.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ImportLeadsModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchLeads}
      />
    </div>
  );
}