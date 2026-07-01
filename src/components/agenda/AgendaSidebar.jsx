import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function AgendaSidebar({
  currentDate,
  onDateChange,
  therapists,
  selectedTherapists,
  onToggleTherapist,
  canViewAllTherapists = true,
}) {
  const [showTherapists, setShowTherapists] = useState(true);
  const [calMonth, setCalMonth] = useState(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));

  // Keep calMonth in sync when currentDate jumps to a different month (e.g., "Hoy")
  React.useEffect(() => {
    const target = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    if (target.getTime() !== calMonth.getTime()) setCalMonth(target);
  }, [currentDate]);

  const year  = calMonth.getFullYear();
  const month = calMonth.getMonth();

  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const rawFirstDay  = new Date(year, month, 1).getDay(); // 0=Sun..6=Sat
  const mondayOffset = (rawFirstDay + 6) % 7;            // 0=Mon..6=Sun

  const cells = [
    ...Array(mondayOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const today = new Date();
  const isToday   = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const isSelected = (d) => d === currentDate.getDate() && month === currentDate.getMonth() && year === currentDate.getFullYear();

  const selectDay = (d) => {
    const next = new Date(year, month, d);
    onDateChange(next);
  };

  const allSelected  = therapists.every(t => selectedTherapists.includes(t.id));
  const noneSelected = therapists.every(t => !selectedTherapists.includes(t.id));

  const handleSelectAll = () => {
    therapists.forEach(t => { if (!selectedTherapists.includes(t.id)) onToggleTherapist(t.id); });
  };
  const handleSelectNone = () => {
    therapists.forEach(t => { if (selectedTherapists.includes(t.id)) onToggleTherapist(t.id); });
  };

  return (
    <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 flex flex-col h-full hidden md:flex">
      {/* Mini Calendar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize">
            {calMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
          </span>
          <div className="flex gap-0.5">
            <button
              onClick={() => setCalMonth(new Date(year, month - 1, 1))}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setCalMonth(new Date(year, month + 1, 1))}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Day labels — Monday first */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map((l, i) => (
            <div key={i} className="text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 py-0.5">{l}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map((d, i) =>
            d === null ? (
              <div key={`empty-${i}`} />
            ) : (
              <button
                key={d}
                onClick={() => selectDay(d)}
                className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs transition-colors
                  ${isSelected(d)
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold'
                    : isToday(d)
                    ? 'text-teal-600 dark:text-teal-400 font-bold hover:bg-teal-50 dark:hover:bg-teal-900/30'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                {d}
              </button>
            )
          )}
        </div>
      </div>

      {/* Therapist Filters */}
      <div className="flex-1 overflow-y-auto p-4">
        {canViewAllTherapists && therapists.length > 0 && (
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              onClick={() => setShowTherapists(prev => !prev)}
            >
              <span>Profesionales ({selectedTherapists.length}/{therapists.length})</span>
              <ChevronDown size={14} className={`transition-transform ${showTherapists ? 'rotate-180' : ''}`} />
            </button>

            {showTherapists && (
              <>
                {/* Quick select */}
                <div className="flex border-t border-slate-100 dark:border-slate-700/50">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    disabled={allSelected}
                    className="flex-1 py-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-r border-slate-100 dark:border-slate-700/50"
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectNone}
                    disabled={noneSelected}
                    className="flex-1 py-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Ninguno
                  </button>
                </div>

                {/* Therapist list */}
                <div className="divide-y divide-slate-100 dark:divide-slate-700/50 max-h-64 overflow-y-auto border-t border-slate-100 dark:border-slate-700/50">
                  {therapists.map(therapist => {
                    const checked = selectedTherapists.includes(therapist.id);
                    const color = therapist.color || '#6366f1';
                    return (
                      <label
                        key={therapist.id}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {/* Color checkbox */}
                        <div
                          className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                          style={checked
                            ? { backgroundColor: color, borderColor: color }
                            : { backgroundColor: 'transparent', borderColor: '#cbd5e1' }
                          }
                        >
                          {checked && (
                            <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 fill-white">
                              <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>

                        {/* Color dot */}
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />

                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{therapist.name}</span>

                        <input type="checkbox" className="sr-only" checked={checked} onChange={() => onToggleTherapist(therapist.id)} />
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
