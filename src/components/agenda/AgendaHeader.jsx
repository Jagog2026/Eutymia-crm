import React from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Plus, Home } from 'lucide-react';

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
    <div className="px-4 sm:px-6 py-4 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 sticky top-0 z-30 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-3 md:gap-4 lg:items-center lg:justify-between w-full">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Agenda</span>
            <h2 className="text-2xl font-semibold text-slate-900 capitalize leading-tight">{formatDate(currentDate)}</h2>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              {selectedTherapistName && (
                <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 text-teal-800 px-3 py-1 text-sm font-medium border border-teal-100">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  {selectedTherapistName}
                </span>
              )}
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold">
                {view === 'day' ? 'Vista por profesional' : 'Vista semanal'}
              </span>
            </div>

            <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
              <Home size={12} />
              <span>Eutymia</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-center sm:justify-start lg:justify-end w-full">
          <div className="flex items-center gap-2 justify-start lg:justify-end w-full sm:w-auto">
            <div className="flex items-center rounded-full border border-slate-200 bg-white shadow-sm overflow-hidden">
              <button onClick={onPrev} className="px-3 py-2 text-slate-600 hover:bg-slate-50 transition-colors" title="Día anterior">
                <ChevronLeft size={18} />
              </button>
              <div className="h-8 w-px bg-slate-200" aria-hidden="true"></div>
              <button onClick={onNext} className="px-3 py-2 text-slate-600 hover:bg-slate-50 transition-colors" title="Día siguiente">
                <ChevronRight size={18} />
              </button>
            </div>

            <button 
              onClick={onToday}
              className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-semibold shadow-sm hover:bg-slate-800 transition-colors"
            >
              Hoy
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end w-full sm:w-auto">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white shadow-sm">
              <button
                onClick={() => setView('day')}
                className={`px-3 py-2 text-sm font-medium rounded-full transition-colors ${view === 'day' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Día
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-3 py-2 text-sm font-medium rounded-full transition-colors ${view === 'week' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Semana
              </button>
            </div>

            <button onClick={onRefresh} className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50" title="Actualizar">
              <RefreshCw size={18} />
            </button>

            <button 
              onClick={() => onNewAppointment()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-full font-semibold shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus size={18} />
              <span>Nueva cita</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}