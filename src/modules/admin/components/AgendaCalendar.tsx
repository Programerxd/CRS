import { useState, useEffect } from 'react';
import { 
  format, startOfWeek, addDays, isSameDay 
} from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Calendar as CalIcon, Clock, User, Filter, ChevronLeft, ChevronRight, 
  Plus, X, Edit3, Trash2, Save, Phone, Mail, FileText 
} from 'lucide-react';
// Importamos las funciones nuevas
import { 
  getAllAppointments, createAppointment, updateAppointment, deleteAppointment 
} from '../services/appointments.service';
import { getArtists } from '../services/cms.service';
import type { Appointment, Artist } from '../../../types/db';
import { Timestamp } from 'firebase/firestore';

export default function AgendaCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [filterArtist, setFilterArtist] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DE MODALES ---
  const [showManualModal, setShowManualModal] = useState(false);
  
  // NUEVO: Estado para el Modal de Detalle/Edición
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [editMode, setEditMode] = useState(false); // Para activar inputs de edición
  const [editForm, setEditForm] = useState({
      date: '',
      time: '',
      status: '',
      notes: ''
  });

  // Estado para el form manual (lo mantenemos igual que antes)
  const [manualForm, setManualForm] = useState({
      clientName: '', serviceType: 'tatuaje', artistId: '', date: '', time: '', duration: 60
  });

  // --- CARGA DE DATOS ---
  useEffect(() => {
    loadData();
  }, [currentDate]);

  const loadData = async () => {
    setLoading(true);
    const [appts, arts] = await Promise.all([
        getAllAppointments(new Date(2024, 0, 1), new Date(2025, 11, 31)), 
        getArtists()
    ]);
    setAppointments(appts);
    setArtists(arts);
    setLoading(false);
  };

  // --- LÓGICA DE GESTIÓN DE CITA ---
  
  // Abrir el modal con los datos cargados
  const handleOpenDetail = (appt: Appointment) => {
      const dateObj = appt.date.toDate();
      setSelectedAppt(appt);
      setEditForm({
          date: format(dateObj, 'yyyy-MM-dd'),
          time: format(dateObj, 'HH:mm'),
          status: appt.status,
          notes: appt.notes || '' // Si tienes notas en tu tipo
      });
      setEditMode(false); // Empezar en modo lectura
  };

  // Guardar cambios (Reprogramar o cambiar estado)
  const handleSaveChanges = async () => {
      if (!selectedAppt?.id) return;

      // Reconstruir fecha
      const [y, m, d] = editForm.date.split('-').map(Number);
      const [h, min] = editForm.time.split(':').map(Number);
      const newDate = new Date(y, m - 1, d, h, min);

      await updateAppointment(selectedAppt.id, {
          date: Timestamp.fromDate(newDate),
          status: editForm.status as any,
          // notes: editForm.notes 
      });

      alert("Cita actualizada correctamente");
      setSelectedAppt(null);
      loadData();
  };

  // Eliminar cita
  const handleDeleteAppt = async () => {
      if (!selectedAppt?.id || !confirm("¿Estás seguro de eliminar esta cita permanentemente?")) return;
      await deleteAppointment(selectedAppt.id);
      setSelectedAppt(null);
      loadData();
  };

  // Handler Manual (Mismo de antes)
  const handleManualSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const [y, m, d] = manualForm.date.split('-').map(Number);
      const [h, min] = manualForm.time.split(':').map(Number);
      const finalDate = new Date(y, m - 1, d, h, min);
      const artistName = artists.find(a => a.id === manualForm.artistId)?.name || 'Desconocido';

      await createAppointment({
          clientName: manualForm.clientName, clientEmail: "manual@studio.com", clientPhone: "0000000000",
          serviceType: manualForm.serviceType as any, artistId: manualForm.artistId, artistName,
          date: Timestamp.fromDate(finalDate), durationMin: Number(manualForm.duration),
          status: 'confirmada', depositAmount: 0, createdAt: Timestamp.now()
      });
      setShowManualModal(false);
      loadData();
  };

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
  const filteredAppts = appointments.filter(a => filterArtist === 'all' ? true : a.artistId === filterArtist);
  
  const getHeight = (duration: number) => {
      const baseHeight = 90; 
      const ratio = duration / 60;
      return Math.max(baseHeight, baseHeight * ratio);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      
      {/* TOOLBAR */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
        <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
                <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-1 hover:bg-white rounded-md shadow-sm"><ChevronLeft size={18}/></button>
                <button onClick={() => setCurrentDate(new Date())} className="px-3 text-xs font-bold text-gray-600">Hoy</button>
                <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-1 hover:bg-white rounded-md shadow-sm"><ChevronRight size={18}/></button>
            </div>
            <h2 className="text-xl font-heading font-bold text-dark-900 capitalize">{format(startDate, 'MMMM yyyy', { locale: es })}</h2>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                <Filter size={16} className="text-gray-400" />
                <select className="bg-transparent text-sm font-bold text-gray-600 outline-none cursor-pointer" value={filterArtist} onChange={(e) => setFilterArtist(e.target.value)}>
                    <option value="all">Todos los Artistas</option>
                    {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
            </div>
            <button onClick={() => setShowManualModal(true)} className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-primary-hover flex items-center gap-2">
                <Plus size={18}/> Agendar Bloqueo
            </button>
        </div>
      </div>

      {/* CALENDARIO */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 grid grid-cols-7 divide-x divide-gray-200 h-full overflow-y-auto">
            {weekDays.map((day) => {
                const isToday = isSameDay(day, new Date());
                const dayAppts = filteredAppts.filter(a => isSameDay(a.date.toDate(), day));
                dayAppts.sort((a,b) => a.date.toDate().getTime() - b.date.toDate().getTime());

                return (
                    <div key={day.toString()} className="flex flex-col min-h-[600px]">
                        <div className={`p-3 text-center border-b border-gray-100 ${isToday ? 'bg-primary/5' : ''}`}>
                            <p className="text-xs font-bold text-gray-400 uppercase">{format(day, 'EEE', { locale: es })}</p>
                            <p className={`text-lg font-bold ${isToday ? 'text-primary' : 'text-dark-900'}`}>{format(day, 'd')}</p>
                        </div>
                        <div className="flex-1 p-2 space-y-2 bg-gray-50/30">
                            {dayAppts.map(appt => {
                                const duration = appt.durationMin || 60;
                                return (
                                    <div 
                                        key={appt.id} 
                                        onClick={() => handleOpenDetail(appt)} // <--- AQUÍ ABRE EL MODAL DE DETALLE
                                        style={{ height: `${getHeight(duration)}px` }} 
                                        className={`
                                            cursor-pointer p-3 rounded-lg border shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between
                                            ${appt.status === 'cancelada' ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-white border-gray-200'}
                                            ${appt.status === 'confirmada' ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-yellow-400'}
                                        `}
                                    >
                                        <div>
                                            <p className="text-xs font-bold text-primary flex items-center gap-1 mb-1">
                                                <Clock size={10}/> {format(appt.date.toDate(), 'HH:mm')}
                                            </p>
                                            <h4 className="text-sm font-bold text-dark-900 truncate leading-tight">{appt.clientName}</h4>
                                            <span className="text-[10px] text-gray-500 uppercase mt-0.5 block">{appt.serviceType}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                                            <User size={10}/> {appt.artistName.split(' ')[0]}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* --- MODAL DETALLE / EDICIÓN (NIVEL EMPRESARIAL) --- */}
      {selectedAppt && (
        <div className="fixed inset-0 bg-secondary-dark/80 z-50 flex justify-end backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                
                {/* HEADER MODAL */}
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-heading font-bold text-xl text-dark-900">Gestión de Cita</h3>
                    <button onClick={() => setSelectedAppt(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* SECCIÓN 1: CLIENTE */}
                    <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                        <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <User size={14}/> Cliente
                        </h4>
                        <div className="space-y-3">
                            <div>
                                <p className="text-lg font-bold text-dark-900">{selectedAppt.clientName}</p>
                                <p className="text-sm text-gray-500">{selectedAppt.serviceType.toUpperCase()} • {selectedAppt.bodyPart || 'General'}</p>
                            </div>
                            <div className="flex flex-col gap-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400"/> {selectedAppt.clientPhone}</div>
                                <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400"/> {selectedAppt.clientEmail}</div>
                            </div>
                            {selectedAppt.description && (
                                <div className="mt-3 p-3 bg-white rounded-lg border border-blue-100 text-sm text-gray-600 italic">
                                    "{selectedAppt.description}"
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECCIÓN 2: OPERACIÓN (EDITABLE) */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <FileText size={14}/> Detalles de Agenda
                            </h4>
                            <button 
                                onClick={() => setEditMode(!editMode)} 
                                className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${editMode ? 'bg-gray-200 text-gray-700' : 'bg-primary/10 text-primary'}`}
                            >
                                {editMode ? 'Cancelar Edición' : 'Editar / Reprogramar'}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Fecha</label>
                                <input 
                                    type="date" 
                                    disabled={!editMode}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                                    value={editForm.date}
                                    onChange={e => setEditForm({...editForm, date: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Hora</label>
                                <input 
                                    type="time" 
                                    disabled={!editMode}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                                    value={editForm.time}
                                    onChange={e => setEditForm({...editForm, time: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Estado Actual</label>
                            <select 
                                disabled={!editMode}
                                className={`w-full p-3 border rounded-lg font-bold text-sm uppercase outline-none appearance-none disabled:opacity-80 ${
                                    editForm.status === 'confirmada' ? 'bg-green-50 border-green-200 text-green-700' :
                                    editForm.status === 'cancelada' ? 'bg-red-50 border-red-200 text-red-700' :
                                    'bg-yellow-50 border-yellow-200 text-yellow-700'
                                }`}
                                value={editForm.status}
                                onChange={e => setEditForm({...editForm, status: e.target.value})}
                            >
                                <option value="pendiente">🟡 Pendiente</option>
                                <option value="confirmada">🟢 Confirmada</option>
                                <option value="completada">🔵 Completada</option>
                                <option value="cancelada">🔴 Cancelada</option>
                                <option value="noshow">⚫ No se presentó</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Artista Asignado</label>
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 flex items-center gap-2">
                                <User size={16}/> {selectedAppt.artistName}
                            </div>
                        </div>
                    </div>

                </div>

                {/* FOOTER ACTIONS */}
                <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50">
                    {editMode ? (
                        <button 
                            onClick={handleSaveChanges}
                            className="flex-1 bg-dark-900 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-primary transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={18}/> Guardar Cambios
                        </button>
                    ) : (
                        <button 
                            onClick={handleDeleteAppt}
                            className="flex-1 bg-white border border-red-200 text-red-600 py-3 rounded-xl font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                        >
                            <Trash2 size={18}/> Eliminar Cita
                        </button>
                    )}
                </div>

            </div>
        </div>
      )}

      {/* MODAL MANUAL (Mantenemos el código anterior aquí por brevedad, es el mismo form de crear) */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
                <div className="flex justify-between mb-4"><h3 className="font-bold text-xl">Agendar Manual</h3><button onClick={()=>setShowManualModal(false)}><X/></button></div>
                <form onSubmit={handleManualSubmit} className="space-y-4">
                    {/* ... (Mismos inputs de tu código anterior para crear manual) ... */}
                    <input required className="w-full p-2 border rounded" placeholder="Cliente/Motivo" value={manualForm.clientName} onChange={e=>setManualForm({...manualForm, clientName:e.target.value})}/>
                    <div className="grid grid-cols-2 gap-2">
                        <select className="w-full p-2 border rounded" value={manualForm.artistId} onChange={e=>setManualForm({...manualForm, artistId:e.target.value})}><option value="">Artista...</option>{artists.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>
                        <select className="w-full p-2 border rounded" onChange={e=>setManualForm({...manualForm, duration:Number(e.target.value)*60})}><option value="1">1h</option><option value="3">3h</option><option value="5">5h</option></select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <input type="date" className="w-full p-2 border rounded" value={manualForm.date} onChange={e=>setManualForm({...manualForm, date:e.target.value})}/>
                        <input type="time" className="w-full p-2 border rounded" value={manualForm.time} onChange={e=>setManualForm({...manualForm, time:e.target.value})}/>
                    </div>
                    <button className="w-full bg-primary text-white py-2 rounded font-bold">Guardar</button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}