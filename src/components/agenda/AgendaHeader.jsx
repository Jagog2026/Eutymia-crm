import React from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Layout, Maximize, Plus, Home } from 'lucide-react';

export default function AgendaHeader({ 
  currentDate, 
  onPrev, 
  onNext, 
  onToday, 
  onRefresh, 
  onNewAppointment,
  view,
  setView,
  selectedTherapistName
}) {
  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="px-6 py-4 border-b bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <button 
          onClick={onToday}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors"
        >
          Hoy
        </button>
        
        <div className="flex items-center bg-white border rounded-md shadow-sm">
          <button onClick={onPrev} className="p-2 hover:bg-gray-50 text-gray-600 border-r">
            <ChevronLeft size={20} />
          </button>
          <button onClick={onNext} className="p-2 hover:bg-gray-50 text-gray-600">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-gray-900 capitalize leading-tight">
            {formatDate(currentDate)}
          </h2>
          {selectedTherapistName && (
            <div className="mt-1 px-3 py-1 bg-teal-50 border border-teal-100 rounded-md inline-block">
              <p className="text-base font-bold text-teal-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                {selectedTherapistName}
              </p>
            </div>
          )}
          <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
            <Home size={12} />
            <span>Eutymia</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        <div className="flex items-center gap-2 text-gray-400 text-xs mr-2 hidden lg:flex">
          <div className="w-4 h-4 rounded-full border flex items-center justify-center">?</div>
          <span>Actualizado hace 0 min</span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onRefresh} className="p-2 border rounded-md text-gray-600 hover:bg-gray-50" title="Actualizar">
            <RefreshCw size={18} />
          </button>
          <button 
            onClick={() => setView(view === 'day' ? 'week' : 'day')} 
            className={`p-2 border rounded-md text-gray-600 hover:bg-gray-50 ${view === 'week' ? 'bg-gray-100' : ''}`} 
            title="Cambiar Vista"
          >
            <Layout size={18} />
          </button>
          <button className="p-2 border rounded-md text-gray-600 hover:bg-gray-50 hidden sm:block" title="Pantalla Completa">
            <Maximize size={18} />
          </button>
        </div>

        <button 
          onClick={() => onNewAppointment()}
          className="flex items-center gap-2 px-4 py-2 bg-[#7A42D6] hover:bg-[#6938b8] text-white rounded-md font-medium shadow-sm transition-colors"
        >
          <span>Nuevo</span>
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}