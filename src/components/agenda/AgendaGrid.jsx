import React from 'react';
import { DollarSign } from 'lucide-react';

export default function AgendaGrid({ 
  date, 
  view, 
  appointments, 
  therapists, 
  selectedTherapists, 
  onTimeClick, 
  onAppointmentClick, 
  onDrop 
}) {
  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 to 22:00
  const hourHeight = 80;
  const columnMinWidth = 220;
  const statusConfig = {
    blocked: { label: 'Bloqueado', classes: 'bg-slate-100 text-slate-700 border border-slate-200', badge: 'bg-slate-200 text-slate-700 border-slate-300' },
    confirmada: { label: 'Confirmada', classes: 'bg-amber-50 text-amber-900 border border-amber-200', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
    asiste: { label: 'Asiste', classes: 'bg-pink-50 text-pink-900 border border-pink-200', badge: 'bg-pink-100 text-pink-800 border-pink-200' },
    no_asistio: { label: 'No asistió', classes: 'bg-orange-50 text-orange-900 border border-orange-200', badge: 'bg-orange-100 text-orange-800 border-orange-200' },
    cancelado: { label: 'Cancelado', classes: 'bg-red-50 text-red-900 border border-red-200', badge: 'bg-red-100 text-red-800 border-red-200' },
    pagado: { label: 'Pagado', classes: 'bg-emerald-50 text-emerald-900 border border-emerald-200', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    default: { label: 'Pendiente', classes: 'bg-blue-50 text-blue-900 border border-blue-200', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  };
  
  // Filter therapists based on selection
  const activeTherapists = therapists.filter(t => selectedTherapists.includes(t.id));

  // Helper to get initials
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Helper to check if a date is today
  const isToday = (d) => {
    const today = new Date();
    return d.getDate() === today.getDate() && 
           d.getMonth() === today.getMonth() && 
           d.getFullYear() === today.getFullYear();
  };

  const renderAppointmentCard = (app, { compact = false, hour, style } = {}) => {
    const config = statusConfig[app.status] || statusConfig.default;
    const accent = app?.therapists?.color || '#0ea5e9';
    const showPaid = app.payment_status === 'paid' || app.payment_status === 'pagado';
    const isBlocked = app.status === 'blocked';

    return (
      <div
        key={app.id}
        draggable={!isBlocked}
        onDragStart={(e) => e.dataTransfer.setData('appointmentId', app.id)}
        onClick={(e) => onAppointmentClick(e, app)}
        className={`absolute left-1 right-1 rounded-lg px-3 py-2 text-xs shadow-sm cursor-pointer overflow-hidden hover:shadow transition-all z-10 ${config.classes}`}
        style={{ borderLeftColor: accent, borderLeftWidth: '5px', minHeight: '34px', ...style }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className={`font-semibold truncate ${isBlocked ? 'text-slate-800' : 'text-slate-900'}`}>
            {isBlocked ? 'Profesional no disponible' : app.patient_name}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap ${config.badge}`}>
            {config.label}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-1">
          <span className="font-mono text-xs text-slate-700">{app.time}</span>
          {!compact && <span className="truncate">{app.service || 'Consulta'}</span>}
          {showPaid && (
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
              <DollarSign size={12} />
              <span className="text-[11px] font-semibold">Pago</span>
            </span>
          )}
        </div>

        {!compact && app?.therapists?.name && (
          <div className="text-[11px] text-slate-500 mt-1 truncate flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }}></span>
            {app.therapists.name}
          </div>
        )}

        {app.start_time && app.end_time && (
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {app.start_time.substring(11, 16)} - {app.end_time.substring(11, 16)}
          </div>
        )}

        {compact && hour && (
          <div className="text-[10px] text-slate-500 mt-1">{hour}</div>
        )}
      </div>
    );
  };

  const renderWeekCard = (app) => {
    const config = statusConfig[app.status] || statusConfig.default;
    const accent = app?.therapists?.color || '#0ea5e9';
    const showPaid = app.payment_status === 'paid' || app.payment_status === 'pagado';
    const isBlocked = app.status === 'blocked';

    return (
      <div
        key={app.id}
        onClick={(e) => onAppointmentClick(e, app)}
        className={`mb-2 rounded-lg px-3 py-2 text-xs shadow-sm cursor-pointer hover:shadow transition-all border-l-4 ${config.classes}`}
        style={{ borderLeftColor: accent, borderLeftWidth: '5px' }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className={`font-semibold truncate ${isBlocked ? 'text-slate-800' : 'text-slate-900'}`}>
            {isBlocked ? 'Bloqueado' : app.patient_name}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap ${config.badge}`}>
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-1">
          <span className="font-mono text-xs text-slate-700">{app.time}</span>
          <span className="truncate">{app.service || 'Consulta'}</span>
          {showPaid && (
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
              <DollarSign size={12} />
              <span className="text-[11px] font-semibold">Pago</span>
            </span>
          )}
        </div>
      </div>
    );
  };

  // Render Day View (Resource View)
  if (view === 'day') {
    if (activeTherapists.length === 0) {
      return <div className="flex items-center justify-center h-full text-gray-500">Selecciona al menos un profesional para ver su agenda.</div>;
    }

    // Single scroll container to keep header/body perfectly aligned on resize
    const scrollContainerRef = React.useRef(null);
    const minGridWidth = activeTherapists.length * columnMinWidth + 64; // 64 = time column width
    const gridColumns = {
      gridTemplateColumns: `64px repeat(${activeTherapists.length}, minmax(${columnMinWidth}px, 1fr))`,
    };
    const gridTemplate = {
      gridTemplateColumns: `repeat(${activeTherapists.length}, minmax(${columnMinWidth}px, 1fr))`,
    };
    const now = new Date();
    const isCurrentDay = isToday(date);
    const currentLineOffset = ((now.getHours() + now.getMinutes() / 60) - hours[0]) * hourHeight;

    return (
      <div className="flex flex-col h-full overflow-hidden bg-white">
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto relative"
        >
          {/* Header Row */}
          <div className="grid border-b sticky top-0 bg-white z-20 shadow-sm" style={{ minWidth: `${minGridWidth}px`, ...gridColumns }}>
            <div className="h-full border-r bg-white sticky left-0 z-20"></div>
            {activeTherapists.map(therapist => (
              <div key={therapist.id} className="p-3 border-r flex flex-col items-center justify-center bg-gray-50 min-h-[72px]">
                <div className="w-10 h-10 rounded-full bg-gray-400 text-white flex items-center justify-center font-bold text-sm mb-1 shadow-sm">
                  {getInitials(therapist.name)}
                </div>
                <span className="text-sm font-semibold text-gray-700 truncate w-full text-center">{therapist.name}</span>
              </div>
            ))}
          </div>

          {/* Grid Body */}
          {isCurrentDay && currentLineOffset >= 0 && currentLineOffset <= hours.length * hourHeight && (
            <div className="absolute left-0 right-0 pointer-events-none" style={{ top: currentLineOffset }}>
              <div className="absolute left-16 right-0 h-px bg-rose-400"></div>
              <div className="absolute left-10 -ml-1 w-3 h-3 rounded-full bg-rose-400 shadow"></div>
            </div>
          )}

          {hours.map(hour => (
            <div key={hour} className="grid min-h-[80px] border-b" style={{ minWidth: `${minGridWidth}px`, ...gridColumns }}>
              <div className="border-r bg-white flex items-start justify-center pt-2 sticky left-0 z-10">
                <span className="text-xs font-medium text-gray-500">{String(hour).padStart(2, '0')}:00</span>
              </div>

              {activeTherapists.map(therapist => {
                const cellApps = appointments.filter(a => {
                  if (!a.date || !a.time) return false;
                  const appDate = new Date(a.date + 'T00:00:00');
                  const isSameDate = appDate.getDate() === date.getDate() &&
                                   appDate.getMonth() === date.getMonth() &&
                                   appDate.getFullYear() === date.getFullYear();

                  const appHour = parseInt(a.time.split(':')[0], 10);
                  return isSameDate && appHour === hour && a.therapist_id === therapist.id;
                });

                return (
                  <div
                    key={`${therapist.id}-${hour}`}
                    className="border-r relative hover:bg-gray-50 transition-colors"
                    onClick={(e) => onTimeClick(e, `${String(hour).padStart(2, '0')}:00`, therapist.id, date)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const appId = e.dataTransfer.getData('appointmentId');
                      if (appId) {
                        const targetDate = new Date(date);
                        targetDate.setHours(hour, 0, 0, 0);
                        onDrop(appId, targetDate, therapist.id);
                      }
                    }}
                  >
                    <div className="absolute top-1/2 left-0 right-0 border-t border-gray-100 border-dashed pointer-events-none"></div>

                    {cellApps.map(app => {
                      let top = 0;
                      let height = '100%';

                      if (app.start_time && app.end_time) {
                        const start = new Date(app.start_time);
                        const end = new Date(app.end_time);
                        const startMin = start.getMinutes();
                        const durationMin = (end - start) / (1000 * 60);
                        top = `${(startMin / 60) * 100}%`;
                        height = `${(durationMin / 60) * 100}%`;
                      }

                      return renderAppointmentCard(app, { compact: false, hour: `${String(hour).padStart(2, '0')}:00`, style: { top, height } });
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render Week View
  if (view === 'week') {
    // Calculate week days
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });

    return (
      <div className="flex flex-col h-full overflow-hidden bg-white">
        {/* Header Row */}
        <div className="flex border-b sticky top-0 bg-white z-20 shadow-sm">
          <div className="w-16 flex-shrink-0 border-r bg-white"></div>
          {weekDays.map(d => (
            <div key={d.toISOString()} className={`flex-1 min-w-[120px] p-2 border-r text-center ${isToday(d) ? 'bg-teal-50' : 'bg-gray-50'}`}>
              <div className="text-xs text-gray-500 uppercase mb-1">
                {d.toLocaleDateString('es-ES', { weekday: 'short' })}
              </div>
              <div className={`text-lg font-bold ${isToday(d) ? 'text-teal-600' : 'text-gray-800'}`}>
                {d.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Grid Body */}
        <div className="flex-1 overflow-y-auto">
          {hours.map(hour => (
            <div key={hour} className="flex min-h-[80px]">
              <div className="w-16 flex-shrink-0 border-r border-b bg-white flex items-start justify-center pt-2">
                <span className="text-xs font-medium text-gray-500">{String(hour).padStart(2, '0')}:00</span>
              </div>

              {weekDays.map(d => {
                // Filter appointments for this day and hour
                // Note: In week view, we show ALL selected therapists in the same cell, or just the first one?
                // Usually week view is aggregated.
                const cellApps = appointments.filter(a => {
                  if (!a.date || !a.time) return false;
                  const appDate = new Date(a.date + 'T00:00:00');
                  const isSameDate = appDate.getDate() === d.getDate() && 
                                   appDate.getMonth() === d.getMonth() && 
                                   appDate.getFullYear() === d.getFullYear();
                  const appHour = parseInt(a.time.split(':')[0], 10);
                  return isSameDate && appHour === hour && selectedTherapists.includes(a.therapist_id);
                });

                return (
                  <div 
                    key={`${d.toISOString()}-${hour}`} 
                    className={`flex-1 min-w-[120px] border-r border-b relative hover:bg-gray-50 transition-colors ${isToday(d) ? 'bg-teal-50/60' : 'bg-white'}`}
                    onClick={(e) => onTimeClick(e, `${String(hour).padStart(2, '0')}:00`, selectedTherapists[0], d)} // Default to first therapist
                  >
                    {cellApps.map(app => renderWeekCard(app))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}