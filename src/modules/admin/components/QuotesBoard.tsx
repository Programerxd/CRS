import { useState, useEffect } from 'react';
import { 
  MessageSquare, CalendarCheck, Archive, Image as ImageIcon, X, 
  Clock, User, DollarSign, FileText, AlignLeft 
} from 'lucide-react';

// Servicios
import { getQuotes, updateQuote, type Quote } from '../services/quotes.service';
import { createAppointment } from '../services/appointments.service';
import { getArtists } from '../services/cms.service';

// Tipos
import type { Artist } from '../../../types/db';
import { Timestamp } from 'firebase/firestore';

export default function QuotesBoard() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showConvert, setShowConvert] = useState(false);

  // ESTADO DEL FORMULARIO DE CONVERSIÓN
  // Usamos strings para duración y anticipo para permitir borrar el "0" fácilmente
  const [convertData, setConvertData] = useState({
    date: '',
    time: '',
    duration: '3', // String para fácil edición
    deposit: '',   // String para fácil edición
    artistId: '',
    
    // Estos campos se llenarán con los datos de la cotización
    description: '',
    bodyPart: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [quotesData, artistsData] = await Promise.all([
        getQuotes(),
        getArtists()
    ]);
    setQuotes(quotesData);
    setArtists(artistsData);
    setLoading(false);
  };

  // Filtros
  const newQuotes = quotes.filter(q => q.status === 'nueva');
  const negotiationQuotes = quotes.filter(q => q.status === 'negociacion');
  const closedQuotes = quotes.filter(q => ['agendada', 'archivada'].includes(q.status));

  // WhatsApp
  const openWhatsApp = (quote: Quote) => {
    const msg = `Hola ${quote.clientName}, soy de Cuervo Rosa Studio. Revisé tu idea sobre el tatuaje de "${quote.description}". ¿Tienes un momento?`;
    window.open(`https://wa.me/${quote.clientPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    
    if (quote.status === 'nueva') {
      handleStatusChange(quote.id, 'negociacion');
    }
  };

  const handleStatusChange = async (id: string, status: Quote['status']) => {
    await updateQuote(id, { status });
    loadData();
    if (selectedQuote?.id === id) setSelectedQuote(null);
  };

  // --- ABRIR MODAL Y PRE-LLENAR DATOS ---
  const handleOpenConvert = () => {
      if (!selectedQuote) return;

      // AQUÍ OCURRE LA MAGIA: Pasamos los datos de la cotización al formulario
      setConvertData({
          date: '',
          time: '',
          duration: '3', // Valor por defecto sugerido
          deposit: '',
          artistId: '', // El admin debe elegir el artista
          
          // PRE-LLENADO DE DATOS DEL PROYECTO
          description: selectedQuote.description || '',
          bodyPart: selectedQuote.bodyPart || ''
      });
      setShowConvert(true);
  };

  // --- GUARDAR CITA ---
  const handleConvertToAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuote || !convertData.date || !convertData.time || !convertData.artistId) {
        alert("Faltan datos obligatorios (Artista, Fecha, Hora).");
        return;
    }
    
    try {
        const [y, m, d] = convertData.date.split('-').map(Number);
        const [h, min] = convertData.time.split(':').map(Number);
        const finalDate = new Date(y, m - 1, d, h, min);

        const artistName = artists.find(a => a.id === convertData.artistId)?.name || "Artista";

        // Usamos createAppointment del servicio de AGENDA, no el de quotes
        const res = await createAppointment({
            clientName: selectedQuote.clientName,
            clientEmail: selectedQuote.email || "cotizacion@studio.com",
            clientPhone: selectedQuote.clientPhone,
            
            // Usamos los datos editables del formulario, no los originales fijos
            serviceType: 'tatuaje', // Asumimos tatuaje al venir de cotización
            description: convertData.description, 
            bodyPart: convertData.bodyPart,
            
            artistId: convertData.artistId,
            artistName: artistName,
            date: Timestamp.fromDate(finalDate),
            
            // Convertimos los strings a números al momento de guardar
            durationMin: Number(convertData.duration) * 60, 
            depositAmount: Number(convertData.deposit) || 0,
            
            status: 'confirmada',
            createdAt: Timestamp.now()
        });

        if (res.success) {
            await updateQuote(selectedQuote.id, { status: 'agendada' });
            alert("¡Cita agendada correctamente!");
            setShowConvert(false);
            setSelectedQuote(null);
            loadData();
        } else {
            alert("No se pudo agendar: " + res.error); // Probable choque de horario
        }
    } catch (err) {
        console.error(err);
        alert("Error al procesar.");
    }
  };

  // Tarjeta de Cotización
  const QuoteCard = ({ quote }: { quote: Quote }) => (
    <div 
      onClick={() => { setSelectedQuote(quote); setShowConvert(false); }}
      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group mb-3 relative"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-dark-900">{quote.clientName}</h4>
        {quote.referenceImage && <ImageIcon size={16} className="text-primary" />}
      </div>
      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{quote.description}</p>
      
      {/* Badge de Zona */}
      <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500 font-bold uppercase tracking-wider">
        {quote.bodyPart || 'General'}
      </span>
    </div>
  );

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      
      {/* KANBAN */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0">
        
        {/* Columna 1 */}
        <div className="flex flex-col bg-gray-50/50 rounded-2xl border border-gray-200/60 h-full">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <h3 className="font-bold text-gray-700">Nuevas</h3>
            </div>
            <span className="bg-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm">{newQuotes.length}</span>
          </div>
          <div className="p-3 overflow-y-auto flex-1 scrollbar-hide">
            {newQuotes.map(q => <QuoteCard key={q.id} quote={q} />)}
          </div>
        </div>

        {/* Columna 2 */}
        <div className="flex flex-col bg-gray-50/50 rounded-2xl border border-gray-200/60 h-full">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <h3 className="font-bold text-gray-700">En Conversación</h3>
            </div>
            <span className="bg-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm">{negotiationQuotes.length}</span>
          </div>
          <div className="p-3 overflow-y-auto flex-1 scrollbar-hide">
            {negotiationQuotes.map(q => <QuoteCard key={q.id} quote={q} />)}
          </div>
        </div>

        {/* Columna 3 */}
        <div className="flex flex-col bg-gray-50/50 rounded-2xl border border-gray-200/60 h-full">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <h3 className="font-bold text-gray-700">Finalizadas</h3>
            </div>
            <span className="bg-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm">{closedQuotes.length}</span>
          </div>
          <div className="p-3 overflow-y-auto flex-1 scrollbar-hide">
            {closedQuotes.map(q => <QuoteCard key={q.id} quote={q} />)}
          </div>
        </div>
      </div>

      {/* --- MODAL DETALLE / CONVERSIÓN --- */}
      {selectedQuote && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-gray-100">
            
            <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-heading font-bold text-dark-900">Detalle Cotización</h2>
                <button onClick={() => setSelectedQuote(null)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
            </div>

            {/* Datos Cliente */}
            <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
                <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xl uppercase">
                        {selectedQuote.clientName[0]}
                    </div>
                    <div>
                        <h3 className="font-bold text-dark-900">{selectedQuote.clientName}</h3>
                        <p className="text-sm text-gray-500">{selectedQuote.clientPhone}</p>
                    </div>
                </div>
                <button onClick={() => openWhatsApp(selectedQuote)} className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-bold transition-colors shadow-sm">
                    <MessageSquare size={18} /> Abrir WhatsApp
                </button>
            </div>

            {/* Info Cotización Original */}
            <div className="space-y-4 mb-8">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Idea Original</label>
                    <p className="text-dark-900 font-medium mt-1 text-sm">{selectedQuote.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Zona</label>
                        <p className="text-dark-900 font-medium mt-1">{selectedQuote.bodyPart}</p>
                    </div>
                </div>
                {selectedQuote.referenceImage && (
                    <div className="rounded-xl overflow-hidden border border-gray-200 mt-2">
                        <img src={selectedQuote.referenceImage} alt="Referencia" className="w-full h-auto object-cover" />
                    </div>
                )}
            </div>

            <hr className="border-gray-100 mb-6" />

            {/* --- ZONA DE ACCIÓN --- */}
            {!showConvert ? (
                <div className="space-y-3">
                    {selectedQuote.status !== 'agendada' && (
                        <button 
                            onClick={handleOpenConvert} // Usamos la nueva función que pre-llena
                            className="w-full flex items-center justify-center gap-2 bg-dark-900 hover:bg-primary text-white py-3 rounded-xl font-bold transition-colors shadow-lg"
                        >
                            <CalendarCheck size={18} /> Agendar Cita (Cerrar)
                        </button>
                    )}
                    <button onClick={() => handleStatusChange(selectedQuote.id, 'archivada')} className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 py-3 rounded-xl font-medium transition-colors">
                        <Archive size={18} /> Archivar / Rechazar
                    </button>
                </div>
            ) : (
                // --- FORMULARIO DE AGENDAR ---
                <form onSubmit={handleConvertToAppointment} className="bg-gray-50 p-5 rounded-2xl border border-primary/20 animate-in fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-primary flex items-center gap-2"><CalendarCheck size={18}/> Finalizar Cita</h4>
                        <button type="button" onClick={() => setShowConvert(false)}><X size={16} className="text-gray-400"/></button>
                    </div>
                    
                    <div className="space-y-4">
                        {/* Artista */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Asignar Artista</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-3 text-gray-400"/>
                                <select required className="w-full pl-9 p-2 border rounded-lg bg-white text-sm" value={convertData.artistId} onChange={e => setConvertData({...convertData, artistId: e.target.value})}>
                                    <option value="">Seleccionar...</option>
                                    {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Fecha y Hora */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Fecha</label>
                                <input required type="date" className="w-full p-2 border rounded-lg bg-white text-sm" value={convertData.date} onChange={e => setConvertData({...convertData, date: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Hora</label>
                                <input required type="time" className="w-full p-2 border rounded-lg bg-white text-sm" value={convertData.time} onChange={e => setConvertData({...convertData, time: e.target.value})} />
                            </div>
                        </div>

                        {/* Duración y Depósito (INPUTS CORREGIDOS) */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Duración (Horas)</label>
                                <div className="relative">
                                    <Clock size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                                    {/* Input tipo TEXT para permitir borrar el 0 */}
                                    <input 
                                        type="number" 
                                        className="w-full pl-9 p-2 border rounded-lg bg-white text-sm" 
                                        value={convertData.duration} 
                                        onChange={e => setConvertData({...convertData, duration: e.target.value})} 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Anticipo ($)</label>
                                <div className="relative">
                                    <DollarSign size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                                    <input 
                                        type="number" 
                                        placeholder="0" 
                                        className="w-full pl-9 p-2 border rounded-lg bg-white text-sm" 
                                        value={convertData.deposit} 
                                        onChange={e => setConvertData({...convertData, deposit: e.target.value})} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* CAMPOS DE PROYECTO (EDITABLES) */}
                        <div className="pt-2 border-t border-gray-200">
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase mt-2">Zona del Cuerpo</label>
                            <input className="w-full p-2 border rounded-lg bg-white text-sm mb-2" value={convertData.bodyPart} onChange={e => setConvertData({...convertData, bodyPart: e.target.value})} />
                            
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Descripción Final</label>
                            <textarea className="w-full p-2 border rounded-lg bg-white text-sm h-20 resize-none" value={convertData.description} onChange={e => setConvertData({...convertData, description: e.target.value})} />
                        </div>
                    </div>

                    <div className="mt-4">
                        <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition-colors flex justify-center items-center gap-2">
                            Confirmar y Bloquear Agenda
                        </button>
                    </div>
                </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}