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

  // Helper to get status styles
  const getAppointmentStyle = (status) => {
    switch (status) {
      case 'blocked':
        return 'bg-gray-200 text-gray-600 border-l-4 border-gray-400';
      case 'confirmada':
        return 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-400';
      case 'asiste':
        return 'bg-[#FFB6F0] text-pink-900 border-l-4 border-pink-500'; // Pink from image
      case 'no_asistio':
        return 'bg-orange-100 text-orange-800 border-l-4 border-orange-400';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-l-4 border-red-400';
      case 'pagado':
        return 'bg-green-100 text-green-800 border-l-4 border-green-400';
      default:
        return 'bg-blue-100 text-blue-800 border-l-4 border-blue-400';
    }
  };

  // Render Day View (Resource View)
  if (view === 'day') {
    if (activeTherapists.length === 0) {
      return <div className="flex items-center justify-center h-full text-gray-500">Selecciona al menos un profesional para ver su agenda.</div>;
    }

    // Ref to sync scroll between header and body
    const headerScrollRef = React.useRef(null);
    const bodyScrollRef = React.useRef(null);

    const handleBodyScroll = (e) => {
      if (headerScrollRef.current) {
        headerScrollRef.current.scrollLeft = e.target.scrollLeft;
      }
    };

    return (
      <div className="flex flex-col h-full overflow-hidden bg-white">
        {/* Header Row */}
        <div className="flex border-b sticky top-0 bg-white z-20 shadow-sm">
          <div className="w-16 flex-shrink-0 border-r bg-white"></div> {/* Time column header */}
          <div
            ref={headerScrollRef}
            className="flex flex-grow overflow-x-hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex">
              {activeTherapists.map(therapist => (
                <div key={therapist.id} className="flex-1 min-w-[200px] p-3 border-r flex flex-col items-center justify-center bg-gray-50">
                  <div className="w-10 h-10 rounded-full bg-gray-400 text-white flex items-center justify-center font-bold text-sm mb-1 shadow-sm">
                    {getInitials(therapist.name)}
                  </div>
                  <span className="text-sm font-semibold text-gray-700 truncate w-full text-center">{therapist.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Grid Body */}
        <div
          ref={bodyScrollRef}
          className="flex-1 overflow-y-auto overflow-x-auto"
          onScroll={handleBodyScroll}
        >
          {hours.map(hour => (
            <div key={hour} className="flex min-h-[80px]">
              {/* Time Column - Fixed */}
              <div className="w-16 flex-shrink-0 border-r border-b bg-white flex items-start justify-center pt-2 sticky left-0 z-10">
                <span className="text-xs font-medium text-gray-500">{String(hour).padStart(2, '0')}:00</span>
              </div>

              {/* Therapist Columns */}
              {activeTherapists.map(therapist => {
                // Filter appointments for this cell
                const cellApps = appointments.filter(a => {
                  if (!a.date || !a.time) return false;
                  const appDate = new Date(a.date + 'T00:00:00'); // Fix timezone issue by appending time
                  // Compare dates (ignoring time)
                  const isSameDate = appDate.getDate() === date.getDate() &&
                                   appDate.getMonth() === date.getMonth() &&
                                   appDate.getFullYear() === date.getFullYear();

                  const appHour = parseInt(a.time.split(':')[0], 10);
                  return isSameDate && appHour === hour && a.therapist_id === therapist.id;
                });

                return (
                  <div
                    key={`${therapist.id}-${hour}`}
                    className="flex-1 min-w-[200px] border-r border-b relative hover:bg-gray-50 transition-colors"
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
                    {/* Grid Lines for half hours (optional visual aid) */}
                    <div className="absolute top-1/2 left-0 right-0 border-t border-gray-100 border-dashed pointer-events-none"></div>

                    {cellApps.map(app => {
                      // Calculate position and height
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

                      const isBlocked = app.status === 'blocked';

                      return (
                        <div
                          key={app.id}
                          draggable={!isBlocked}
                          onDragStart={(e) => e.dataTransfer.setData('appointmentId', app.id)}
                          onClick={(e) => onAppointmentClick(e, app)}
                          className={`absolute left-1 right-1 rounded px-2 py-1 text-xs shadow-sm cursor-pointer overflow-hidden hover:opacity-90 z-10 ${getAppointmentStyle(app.status)}`}
                          style={{ top, height, minHeight: '30px' }}
                        >
                          {isBlocked ? (
                            <div className="flex flex-col justify-center h-full">
                              <span className="font-medium">Profesional no disponible</span>
                              <span className="opacity-75">{app.time} - {app.end_time ? app.end_time.substring(0, 5) : ''}</span>
                            </div>
                          ) : (
                            <div className="flex flex-col h-full">
                              <span className="font-bold text-gray-900 truncate">{app.patient_name}</span>
                              <span className="truncate opacity-90">{app.service || 'Consulta General'}</span>
                              {(app.payment_status === 'paid' || app.payment_status === 'pagado') && (
                                <DollarSign size={12} className="absolute top-1 right-1 text-green-700" />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* CSS to hide scrollbar in header and improve sticky behavior */}
        <style>{`
          .overflow-x-hidden::-webkit-scrollbar {
            display: none;
          }

          /* Ensure sticky time column has proper background */
          .sticky.left-0 {
            box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
          }
        `}</style>
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
                    className="flex-1 min-w-[120px] border-r border-b relative hover:bg-gray-50 transition-colors"
                    onClick={(e) => onTimeClick(e, `${String(hour).padStart(2, '0')}:00`, selectedTherapists[0], d)} // Default to first therapist
                  >
                    {cellApps.map(app => {
                      // Simplified rendering for week view to avoid overlap chaos
                      const isBlocked = app.status === 'blocked';
                      return (
                        <div
                          key={app.id}
                          onClick={(e) => onAppointmentClick(e, app)}
                          className={`text-xs p-1 mb-1 rounded truncate cursor-pointer ${getAppointmentStyle(app.status)}`}
                        >
                          {isBlocked ? 'Bloqueado' : app.patient_name}
                        </div>
                      );
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

  return null;
}