import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

export default function AgendaSidebar({ 
  currentDate, 
  onDateChange, 
  therapists, 
  selectedTherapists, 
  onToggleTherapist,
  canViewAllTherapists = true
}) {
  const [showTherapists, setShowTherapists] = useState(true);
  // Mini Calendar Logic
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(currentDate);
  const daysArray = Array.from({ length: days }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const isToday = (d) => {
    const today = new Date();
    return d === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (d) => {
    return d === currentDate.getDate();
  };

  return (
    <div className="w-64 bg-white dark:bg-slate-900 border-r flex-shrink-0 flex flex-col h-full hidden md:flex">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">
            {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
          </span>
          <div className="flex gap-1">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
              <ChevronLeft size={16} />
            </button>
            <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 text-center text-xs mb-2 text-slate-500 dark:text-slate-400">
          <div>D</div><div>L</div><div>M</div><div>M</div><div>J</div><div>V</div><div>S</div>
        </div>
        <div className="grid grid-cols-7 text-center text-sm gap-y-2">
          {emptyDays.map(i => <div key={`empty-${i}`} />)}
          {daysArray.map(d => (
            <button
              key={d}
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setDate(d);
                onDateChange(newDate);
              }}
              className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto transition-colors
                ${isSelected(d) ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}
                ${isToday(d) && !isSelected(d) ? 'text-teal-600 font-bold' : ''}
              `}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {canViewAllTherapists && (
          <div className="border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:bg-slate-800/50 rounded-t-lg"
              onClick={() => setShowTherapists(prev => !prev)}
            >
              <span className="text-xs uppercase tracking-wider">Profesionales ({selectedTherapists.length})</span>
              <ChevronDown size={16} className={`transition-transform ${showTherapists ? 'rotate-180' : ''}`} />
            </button>

            {showTherapists && (
              <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                {therapists.map(therapist => (
                  <label key={therapist.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:bg-slate-800/50">
                    <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${selectedTherapists.includes(therapist.id) ? 'bg-teal-600 border-teal-600' : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900'}`}>
                      {selectedTherapists.includes(therapist.id) && <div className="w-2 h-2 bg-white dark:bg-slate-900 rounded-full" />}
                    </div>
                    <span className="text-sm text-slate-700 dark:text-slate-300">{therapist.name}</span>
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={selectedTherapists.includes(therapist.id)}
                      onChange={() => onToggleTherapist(therapist.id)}
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}