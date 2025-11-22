import { useState, useEffect } from 'react';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameDay, isToday, addMonths, subMonths, getDay 
} from 'date-fns';
import { es } from 'date-fns/locale'; // Para español
import { ChevronLeft, ChevronRight, Plus, Clock, User, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { getAppointmentsByMonth, createAppointment, type Appointment } from '../services/appointments.service';

export default function AgendaCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- ESTADOS DEL FORMULARIO ---
  const [newAppt, setNewAppt] = useState<Partial<Appointment>>({
    service: 'tatuaje',
    status: 'pendiente',
    deposit: 0
  });
  const [time, setTime] = useState('12:00'); // Hora separada para facilitar input

  // Cargar citas cuando cambia el mes
  useEffect(() => {
    loadMonthData();
  }, [currentDate]);

  const loadMonthData = async () => {
    setLoading(true);
    const data = await getAppointmentsByMonth(currentDate.getFullYear(), currentDate.getMonth());
    setAppointments(data);
    setLoading(false);
  };

  // Generar días del calendario
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  // Relleno para que el calendario empiece en el día correcto de la semana
  const startingDayIndex = getDay(startOfMonth(currentDate)); // 0 dom, 1 lun...

  // Filtrar citas del día seleccionado
  const selectedAppointments = appointments.filter(appt => isSameDay(appt.date, selectedDate));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combinar fecha seleccionada con hora ingresada
    const [hours, minutes] = time.split(':').map(Number);
    const finalDate = new Date(selectedDate);
    finalDate.setHours(hours, minutes);

    await createAppointment({
      clientName: newAppt.clientName!,
      clientPhone: newAppt.clientPhone!,
      service: newAppt.service as any,
      artist: newAppt.artist || 'General',
      status: newAppt.status as any,
      date: finalDate,
      deposit: Number(newAppt.deposit),
      notes: newAppt.notes || ''
    });

    setIsModalOpen(false);
    loadMonthData(); // Recargar para ver el puntito nuevo
  };

  // Colores por estado
  const statusColor = {
    pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    confirmada: 'bg-green-100 text-green-700 border-green-200',
    completada: 'bg-gray-100 text-gray-600 border-gray-200',
    cancelada: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 h-[calc(100vh-140px)]">
      
      {/* --- COLUMNA 1: CALENDARIO MES --- */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
        
        {/* Header Calendario */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-heading font-bold text-dark-900 capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft size={20}/></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm font-bold text-primary hover:bg-primary/5 rounded-lg">Hoy</button>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight size={20}/></button>
          </div>
        </div>

        {/* Grid Días Semana */}
        <div className="grid grid-cols-7 mb-2">
          {['Do','Lu','Ma','Mi','Ju','Vi','Sá'].map(d => (
            <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase">{d}</div>
          ))}
        </div>

        {/* Grid Días Mes */}
        <div className="grid grid-cols-7 gap-2 flex-1 content-start">
          {/* Espacios vacíos iniciales */}
          {Array.from({ length: startingDayIndex }).map((_, i) => <div key={`empty-${i}`}></div>)}

          {daysInMonth.map((day) => {
            const dayAppts = appointments.filter(a => isSameDay(a.date, day));
            const isSelected = isSameDay(day, selectedDate);
            
            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className={`
                  h-24 rounded-xl border flex flex-col items-start justify-between p-2 transition-all relative
                  ${isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-gray-100 hover:border-gray-300 bg-white'}
                  ${isToday(day) ? 'bg-gray-50' : ''}
                `}
              >
                <span className={`text-sm font-bold ${isToday(day) ? 'text-primary' : 'text-gray-700'}`}>
                  {format(day, 'd')}
                </span>
                
                {/* Puntitos de citas */}
                <div className="flex flex-wrap gap-1 content-end w-full">
                  {dayAppts.slice(0, 4).map((appt, i) => (
                    <div 
                      key={i} 
                      title={appt.clientName}
                      className={`h-1.5 w-1.5 rounded-full ${appt.status === 'confirmada' ? 'bg-primary' : 'bg-yellow-400'}`}
                    ></div>
                  ))}
                  {dayAppts.length > 4 && <span className="text-[10px] text-gray-400">+</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- COLUMNA 2: DETALLE DEL DÍA --- */}
      <div className="w-full xl:w-96 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-heading font-bold text-dark-900 capitalize">
            {format(selectedDate, 'EEEE, d MMMM', { locale: es })}
          </h3>
          <p className="text-sm text-gray-500">{selectedAppointments.length} citas programadas</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {selectedAppointments.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No hay citas para este día.</p>
              <p className="text-xs">¡Día libre para diseñar! 🎨</p>
            </div>
          ) : (
            selectedAppointments.map(appt => (
              <div key={appt.id} className="p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow bg-white group">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono font-bold text-dark-900 text-lg">
                    {format(appt.date, 'HH:mm')}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold border ${statusColor[appt.status]}`}>
                    {appt.status}
                  </span>
                </div>
                
                <h4 className="font-bold text-dark-900">{appt.clientName}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <User size={12}/> {appt.artist}
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="capitalize">{appt.service}</span>
                </div>
                
                {appt.deposit > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-50 flex items-center gap-1 text-xs text-green-600 font-bold">
                    <DollarSign size={12}/> Anticipo: ${appt.deposit}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-dark-900 hover:bg-primary text-white py-3 rounded-xl font-bold transition-colors shadow-lg"
          >
            <Plus size={18} /> Nueva Cita
          </button>
        </div>
      </div>

      {/* --- MODAL NUEVA CITA --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-4 text-dark-900">Agendar Cita</h3>
            <p className="text-sm text-gray-500 mb-6">Para el {format(selectedDate, 'dd/MM/yyyy')}</p>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Hora</label>
                  <input required type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Artista</label>
                  <select className="w-full p-2 border rounded-lg" onChange={e => setNewAppt({...newAppt, artist: e.target.value})}>
                    <option>General</option>
                    <option>María</option>
                    <option>Juan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Cliente</label>
                <input required placeholder="Nombre completo" className="w-full p-2 border rounded-lg mb-2" onChange={e => setNewAppt({...newAppt, clientName: e.target.value})} />
                <input required placeholder="Teléfono (WhatsApp)" className="w-full p-2 border rounded-lg" onChange={e => setNewAppt({...newAppt, clientPhone: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Servicio</label>
                  <select className="w-full p-2 border rounded-lg" onChange={e => setNewAppt({...newAppt, service: e.target.value as any})}>
                    <option value="tatuaje">Tatuaje</option>
                    <option value="piercing">Piercing</option>
                    <option value="cotizacion">Consulta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Anticipo ($)</label>
                  <input type="number" className="w-full p-2 border rounded-lg" onChange={e => setNewAppt({...newAppt, deposit: Number(e.target.value)})} />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold text-sm">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary-hover shadow-lg">Guardar Cita</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}