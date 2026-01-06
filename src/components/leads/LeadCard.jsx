import React from 'react';
import { MoreHorizontal, Phone, Mail, Calendar, DollarSign, Tag, BookOpen, Globe, CheckSquare, Square, User } from 'lucide-react';

export default function LeadCard({ 
  lead, 
  isSelected, 
  onToggleSelect, 
  onDragStart, 
  openDropdownId, 
  setOpenDropdownId, 
  onEdit, 
  onDelete, 
  onAddTask 
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      className={`bg-white p-3 rounded-lg shadow-sm border hover:shadow-md cursor-grab active:cursor-grabbing transition-all group relative ${isSelected ? 'ring-2 ring-teal-500 border-teal-500' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(lead.id);
            }}
            className="mt-1 text-gray-400 hover:text-teal-600"
          >
            {isSelected ? (
              <CheckSquare size={16} className="text-teal-600" />
            ) : (
              <Square size={16} />
            )}
          </button>
          <h3 className="font-semibold text-gray-900">{lead.full_name || lead.name}</h3>
        </div>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenDropdownId(openDropdownId === lead.id ? null : lead.id);
            }}
            className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Opciones"
          >
            <MoreHorizontal size={16} />
          </button>
          {openDropdownId === lead.id && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border">
              <button
                onClick={() => {
                  onAddTask(lead);
                  setOpenDropdownId(null);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Tareas y Alertas
              </button>
              <button
                onClick={() => {
                  onEdit(lead);
                  setOpenDropdownId(null);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(lead.id)}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-2 text-xs text-gray-500">
        {lead.service && (
          <div className="flex items-center gap-1.5 text-teal-600 font-medium bg-teal-50 p-1.5 rounded">
            <Tag size={12} /> {lead.service}
          </div>
        )}

        {lead.assigned_therapist_name && lead.assigned_therapist_name !== 'N/A' && (
          <div className="flex items-center gap-1.5 text-purple-600 font-medium bg-purple-50 p-1.5 rounded">
            <User size={12} /> {lead.assigned_therapist_name}
          </div>
        )}

        {lead.source && (
          <div className="flex items-center gap-1.5 text-gray-600 font-medium bg-gray-50 p-1.5 rounded">
            <BookOpen size={12} /> {lead.source}
          </div>
        )}

        {lead.whatsapp_line && (
          <div className="flex items-center gap-1.5 text-green-700 font-medium bg-green-50 p-1.5 rounded border border-green-100">
            <Phone size={12} /> {lead.whatsapp_line}
          </div>
        )}

        {lead.facebook_account && (
          <div className="flex items-center gap-1.5 text-blue-700 font-medium bg-blue-50 p-1.5 rounded border border-blue-100">
            <Globe size={12} /> {lead.facebook_account}
          </div>
        )}
        
        <div className="flex items-center justify-between pt-1">
          {lead.value > 0 && (
            <div className="flex items-center gap-1 font-semibold text-gray-700">
              <DollarSign size={12} /> {lead.value}
            </div>
          )}
          <div className="flex items-center gap-1 text-gray-400">
            <Calendar size={12} /> {new Date(lead.created_at).toLocaleDateString()}
          </div>
        </div>

        {(lead.phone || lead.email) && (
          <div className="pt-2 border-t flex flex-col gap-1">
            {lead.phone && (
              <div className="flex items-center gap-1.5">
                <Phone size={12} /> {lead.phone}
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-1.5">
                <Mail size={12} /> {lead.email}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}