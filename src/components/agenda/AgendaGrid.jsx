import React, { useEffect, useRef } from 'react';
import { DollarSign, Clock, User } from 'lucide-react';

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
  const hourHeight = 72;
  const timeColumnWidth = 64;
  const columnMinWidth = 200;

  const statusConfig = {
    blocked:    { label: 'Bloqueado',  dot: 'bg-slate-400',   card: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 ring-slate-200/50 dark:ring-slate-700/50',  badge: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600' },
    confirmada: { label: 'Confirmada', dot: 'bg-amber-400',   card: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 ring-amber-200/50 dark:ring-amber-900/50',  badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    asiste:     { label: 'Asiste',     dot: 'bg-pink-400',    card: 'bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-800 ring-pink-200/50 dark:ring-pink-900/50',   badge: 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800' },
    no_asistio: { label: 'No asistió', dot: 'bg-orange-400',  card: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 ring-orange-200/50 dark:ring-orange-900/50', badge: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
    cancelado:  { label: 'Cancelado',  dot: 'bg-red-400',     card: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 ring-red-200/50 dark:ring-red-900/50',    badge: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' },
    pagado:     { label: 'Pagado',     dot: 'bg-emerald-400', card: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 ring-emerald-200/50 dark:ring-emerald-900/50', badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    default:    { label: 'Pendiente',  dot: 'bg-blue-400',    card: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 ring-blue-200/50 dark:ring-blue-900/50',   badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  };

  const activeTherapists = therapists.filter(t => selectedTherapists.includes(t.id));

  const getInitials = (name) =>
    name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const isToday = (d) => {
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const formatAmPm = (h) => {
    const suffix = h >= 12 ? 'PM' : 'AM';
    const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return { display: String(display), suffix };
  };

  // Hooks at top level (must not be inside conditionals)
  const scrollContainerRef = useRef(null);
  const nowLineRef = useRef(null);

  const now = new Date();
  const isCurrentDay = isToday(date);
  const currentMinuteOffset = ((now.getHours() + now.getMinutes() / 60) - hours[0]) * hourHeight;

  // Auto-scroll to current time on mount / date change
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollTarget = Math.max(0, currentMinuteOffset - 120);
      scrollContainerRef.current.scrollTo({ top: scrollTarget, behavior: 'smooth' });
    }
  }, [date, view]);

  // ── Appointment Card (day view) ──────────────────────────────
  const renderAppointmentCard = (app, { compact = false, hour, style } = {}) => {
    const config = statusConfig[app.status] || statusConfig.default;
    const accent = app?.therapists?.color || '#6366f1';
    const showPaid = app.payment_status === 'paid' || app.payment_status === 'pagado';
    const isBlocked = app.status === 'blocked';

    return (
      <div
        key={app.id}
        draggable={!isBlocked}
        onDragStart={(e) => e.dataTransfer.setData('appointmentId', app.id)}
        onClick={(e) => { e.stopPropagation(); onAppointmentClick(e, app); }}
        className={`absolute inset-x-1.5 rounded-md border shadow-sm cursor-pointer overflow-hidden
          hover:shadow-md hover:ring-2 transition-all duration-150 z-[2] group ${config.card}`}
        style={{ borderLeftColor: accent, borderLeftWidth: '4px', minHeight: '30px', ...style }}
      >
        <div className="px-2.5 py-1.5 h-full flex flex-col justify-center gap-0.5">
          {/* Row 1: name + badge */}
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <span className="text-[12px] font-semibold leading-tight truncate text-slate-800 dark:text-slate-200">
              {isBlocked ? 'No disponible' : app.patient_name}
            </span>
            <span className={`shrink-0 text-[9px] leading-none px-1.5 py-0.5 rounded-full border font-semibold ${config.badge}`}>
              {config.label}
            </span>
          </div>

          {/* Row 2: time + service + paid */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="shrink-0 text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums">{app.time}</span>
            {!compact && <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{app.service || 'Consulta'}</span>}
            {showPaid && (
              <span className="shrink-0 inline-flex items-center gap-0.5 text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-px rounded-full">
                <DollarSign size={10} />
                <span className="text-[10px] font-semibold">Pago</span>
              </span>
            )}
          </div>

          {/* Row 3: therapist (only when not compact) */}
          {!compact && app?.therapists?.name && (
            <div className="flex items-center gap-1.5 min-w-0 mt-px">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accent }} />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{app.therapists.name}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Week Card ────────────────────────────────────────────────
  const renderWeekCard = (app) => {
    const config = statusConfig[app.status] || statusConfig.default;
    const accent = app?.therapists?.color || '#6366f1';
    const showPaid = app.payment_status === 'paid' || app.payment_status === 'pagado';
    const isBlocked = app.status === 'blocked';

    return (
      <div
        key={app.id}
        onClick={(e) => { e.stopPropagation(); onAppointmentClick(e, app); }}
        className={`mx-1 mb-1 rounded-md border shadow-sm cursor-pointer
          hover:shadow-md hover:ring-2 transition-all duration-150 ${config.card}`}
        style={{ borderLeftColor: accent, borderLeftWidth: '3px' }}
      >
        <div className="px-2 py-1.5">
          <div className="flex items-center justify-between gap-1 min-w-0">
            <span className="text-[11px] font-semibold truncate text-slate-800 dark:text-slate-200">
              {isBlocked ? 'Bloqueado' : app.patient_name}
            </span>
            <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${config.dot}`} title={config.label} />
          </div>
          <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
            <Clock size={10} className="shrink-0 text-slate-400 dark:text-slate-500" />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">{app.time}</span>
            {showPaid && <DollarSign size={10} className="shrink-0 text-emerald-500" />}
          </div>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  //  DAY VIEW
  // ══════════════════════════════════════════════════════════════
  if (view === 'day') {
    if (activeTherapists.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 dark:text-slate-500">
          <User size={40} strokeWidth={1.5} />
          <span className="text-sm">Selecciona al menos un profesional para ver su agenda.</span>
        </div>
      );
    }

    const minGridWidth = activeTherapists.length * columnMinWidth + timeColumnWidth;
    const gridColumns = {
      gridTemplateColumns: `${timeColumnWidth}px repeat(${activeTherapists.length}, minmax(${columnMinWidth}px, 1fr))`,
    };

    return (
      <div className="flex flex-col h-full overflow-hidden bg-gradient-to-b from-slate-50/80 dark:from-slate-900 to-white dark:to-slate-900">
        <div ref={scrollContainerRef} className="flex-1 overflow-auto relative">

          {/* ── Therapist Header ── */}
          <div
            className="grid border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 bg-white dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white dark:bg-slate-900/80"
            style={{ minWidth: `${minGridWidth}px`, ...gridColumns }}
          >
            {/* Time-column corner */}
            <div className="border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky left-0 z-30" />

            {activeTherapists.map(therapist => {
              const color = therapist.color || '#6366f1';
              return (
                <div key={therapist.id} className="border-r border-slate-100 dark:border-slate-800 flex items-center gap-3 px-4 py-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {getInitials(therapist.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight">{therapist.name}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">{therapist.specialty || 'Terapeuta'}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Time Grid Body ── */}
          <div className="relative" style={{ minWidth: `${minGridWidth}px` }}>

            {/* Current-time indicator */}
            {isCurrentDay && currentMinuteOffset >= 0 && currentMinuteOffset <= hours.length * hourHeight && (
              <div
                ref={nowLineRef}
                className="absolute pointer-events-none z-20"
                style={{ top: currentMinuteOffset, left: 0, right: 0 }}
              >
                {/* Time label in the gutter */}
                <span
                  className="absolute text-[10px] font-bold text-rose-500 bg-rose-50 rounded px-1 py-px tabular-nums"
                  style={{ left: 4, top: -8 }}
                >
                  {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
                </span>
                {/* Line */}
                <div className="absolute h-[2px] bg-rose-400/80 rounded-full" style={{ left: timeColumnWidth, right: 0 }} />
                {/* Dot */}
                <div
                  className="absolute w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm ring-2 ring-rose-200"
                  style={{ left: timeColumnWidth - 5, top: -4 }}
                />
              </div>
            )}

            {/* Hour rows */}
            {hours.map((hour, idx) => {
              const { display, suffix } = formatAmPm(hour);
              const isEven = idx % 2 === 0;

              return (
                <div
                  key={hour}
                  className="grid"
                  style={{ minHeight: `${hourHeight}px`, ...gridColumns }}
                >
                  {/* Time gutter */}
                  <div className={`border-r border-slate-100 dark:border-slate-800 flex flex-col items-center pt-1 sticky left-0 z-10
                    ${isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/60 dark:bg-slate-800/40'}`}>
                    <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 leading-none tabular-nums">{display}</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none mt-0.5">{suffix}</span>
                  </div>

                  {/* Therapist columns */}
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
                        className={`border-r border-slate-100 dark:border-slate-800 relative group/cell transition-colors
                          ${isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/40 dark:bg-slate-800/20'}
                          hover:bg-indigo-50/40`}
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
                        {/* Half-hour line */}
                        <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-slate-100 dark:border-slate-800 pointer-events-none" />
                        {/* Bottom border */}
                        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100 dark:border-slate-800 pointer-events-none" />

                        {/* Hover hint */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none z-[1]">
                          <span className="text-[10px] text-indigo-300 font-medium">+ Nuevo</span>
                        </div>

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
                          return renderAppointmentCard(app, {
                            compact: false,
                            hour: `${String(hour).padStart(2, '0')}:00`,
                            style: { top, height },
                          });
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  //  WEEK VIEW
  // ══════════════════════════════════════════════════════════════
  if (view === 'week') {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });

    const isCurrentWeek = weekDays.some(d => isToday(d));

    return (
      <div className="flex flex-col h-full overflow-hidden bg-gradient-to-b from-slate-50/80 dark:from-slate-900 to-white dark:to-slate-900">

        {/* ── Day Header ── */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 bg-white dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white dark:bg-slate-900/80">
          <div className="flex-shrink-0 border-r border-slate-100 dark:border-slate-800" style={{ width: timeColumnWidth }} />
          {weekDays.map(d => {
            const today = isToday(d);
            return (
              <div
                key={d.toISOString()}
                className={`flex-1 min-w-[110px] py-2.5 px-2 border-r border-slate-100 dark:border-slate-800 text-center
                  ${today ? 'bg-indigo-50/60' : ''}`}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  {d.toLocaleDateString('es-ES', { weekday: 'short' })}
                </div>
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                  ${today ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300'}`}>
                  {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Grid Body ── */}
        <div className="flex-1 overflow-y-auto relative" ref={scrollContainerRef}>

          {/* Current-time line (week view) */}
          {isCurrentWeek && currentMinuteOffset >= 0 && currentMinuteOffset <= hours.length * hourHeight && (
            <div className="absolute pointer-events-none z-10" style={{ top: currentMinuteOffset, left: 0, right: 0 }}>
              <div className="absolute h-[2px] bg-rose-400/70 rounded-full" style={{ left: timeColumnWidth, right: 0 }} />
              <div className="absolute w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-200" style={{ left: timeColumnWidth - 4, top: -3 }} />
            </div>
          )}

          {hours.map((hour, idx) => {
            const { display, suffix } = formatAmPm(hour);
            const isEven = idx % 2 === 0;

            return (
              <div key={hour} className="flex" style={{ minHeight: `${hourHeight}px` }}>
                {/* Time gutter */}
                <div
                  className={`flex-shrink-0 border-r border-slate-100 dark:border-slate-800 flex flex-col items-center pt-1
                    ${isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/60 dark:bg-slate-800/40'}`}
                  style={{ width: timeColumnWidth }}
                >
                  <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 leading-none tabular-nums">{display}</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none mt-0.5">{suffix}</span>
                </div>

                {weekDays.map(d => {
                  const today = isToday(d);
                  const cellApps = appointments.filter(a => {
                    if (!a.date || !a.time) return false;
                    const appDate = new Date(a.date + 'T00:00:00');
                    const isSameDate =
                      appDate.getDate() === d.getDate() &&
                      appDate.getMonth() === d.getMonth() &&
                      appDate.getFullYear() === d.getFullYear();
                    const appHour = parseInt(a.time.split(':')[0], 10);
                    return isSameDate && appHour === hour && selectedTherapists.includes(a.therapist_id);
                  });

                  return (
                    <div
                      key={`${d.toISOString()}-${hour}`}
                      className={`flex-1 min-w-[110px] border-r border-slate-100 dark:border-slate-800 relative group/cell transition-colors
                        ${today ? 'bg-indigo-50/30' : isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/40 dark:bg-slate-800/20'}
                        hover:bg-indigo-50/40`}
                      onClick={(e) => onTimeClick(e, `${String(hour).padStart(2, '0')}:00`, selectedTherapists[0], d)}
                    >
                      {/* Half-hour line */}
                      <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-slate-100 dark:border-slate-800 pointer-events-none" />
                      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100 dark:border-slate-800 pointer-events-none" />

                      {/* Content */}
                      <div className="relative p-0.5">
                        {cellApps.map(app => renderWeekCard(app))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}