import { useState, useEffect } from 'react';
import { getQuotes, updateQuote, convertToAppointment, type Quote } from '../services/quotes.service';
import { MessageSquare, CalendarCheck, Archive, DollarSign, ExternalLink, Image as ImageIcon, X } from 'lucide-react';

export default function QuotesBoard() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  
  // Estados para el Modal de Acción
  const [priceEstimate, setPriceEstimate] = useState('');
  const [showConvert, setShowConvert] = useState(false); // Mostrar form de agendar
  const [apptDate, setApptDate] = useState('');
  const [apptDeposit, setApptDeposit] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getQuotes();
    setQuotes(data);
    setLoading(false);
  };

  // Filtrar por columnas
  const newQuotes = quotes.filter(q => q.status === 'nueva');
  const negotiationQuotes = quotes.filter(q => q.status === 'negociacion');
  const closedQuotes = quotes.filter(q => ['agendada', 'archivada'].includes(q.status));

  // Abrir WhatsApp Web con mensaje predefinido
  const openWhatsApp = (quote: Quote) => {
    const msg = `Hola ${quote.clientName}, soy de Cuervo Rosa Studio. Revisé tu idea sobre el tatuaje de "${quote.description}". ¿Tienes un momento?`;
    window.open(`https://wa.me/${quote.clientPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    
    // Automáticamente mover a "Negociación" si es nueva
    if (quote.status === 'nueva') {
      handleStatusChange(quote.id, 'negociacion');
    }
  };

  const handleStatusChange = async (id: string, status: Quote['status']) => {
    await updateQuote(id, { status });
    loadData();
    if (selectedQuote?.id === id) setSelectedQuote(null); // Cerrar modal
  };

  const handleConvertToAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuote) return;
    
    await convertToAppointment(selectedQuote, new Date(apptDate), Number(apptDeposit));
    alert("¡Cita creada con éxito!");
    loadData();
    setSelectedQuote(null);
    setShowConvert(false);
  };

  // Sub-componente para la Tarjeta (Card)
  const QuoteCard = ({ quote }: { quote: Quote }) => (
    <div 
      onClick={() => { setSelectedQuote(quote); setShowConvert(false); }}
      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group mb-3"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-dark-900">{quote.clientName}</h4>
        {quote.referenceImage && <ImageIcon size={16} className="text-primary" />}
      </div>
      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{quote.description}</p>
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500 font-bold uppercase">{quote.bodyPart}</span>
        <span className="text-xs text-gray-400 font-mono">{new Date(quote.createdAt?.seconds * 1000).toLocaleDateString()}</span>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      
      {/* --- TABLERO DE 3 COLUMNAS --- */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0">
        
        {/* Columna 1: Nuevas */}
        <div className="flex flex-col bg-gray-50/50 rounded-2xl border border-gray-200/60 h-full">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <h3 className="font-bold text-gray-700">Solicitudes Nuevas</h3>
            </div>
            <span className="bg-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm">{newQuotes.length}</span>
          </div>
          <div className="p-3 overflow-y-auto flex-1 scrollbar-hide">
            {newQuotes.map(q => <QuoteCard key={q.id} quote={q} />)}
          </div>
        </div>

        {/* Columna 2: En Negociación */}
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

        {/* Columna 3: Historial */}
        <div className="flex flex-col bg-gray-50/50 rounded-2xl border border-gray-200/60 h-full">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <h3 className="font-bold text-gray-700">Agendadas / Fin</h3>
            </div>
            <span className="bg-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm">{closedQuotes.length}</span>
          </div>
          <div className="p-3 overflow-y-auto flex-1 scrollbar-hide">
            {closedQuotes.map(q => <QuoteCard key={q.id} quote={q} />)}
          </div>
        </div>

      </div>

      {/* --- MODAL DE DETALLE (Slide-over o Centrado) --- */}
      {selectedQuote && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            
            <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-heading font-bold text-dark-900">Detalle de Solicitud</h2>
                <button onClick={() => setSelectedQuote(null)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
            </div>

            {/* Información del Cliente */}
            <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
                <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xl">
                        {selectedQuote.clientName[0]}
                    </div>
                    <div>
                        <h3 className="font-bold text-dark-900">{selectedQuote.clientName}</h3>
                        <p className="text-sm text-gray-500">{selectedQuote.clientPhone}</p>
                    </div>
                </div>
                <button 
                    onClick={() => openWhatsApp(selectedQuote)}
                    className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-bold transition-colors shadow-sm"
                >
                    <MessageSquare size={18} /> Responder por WhatsApp
                </button>
            </div>

            {/* Detalles del Tatuaje */}
            <div className="space-y-4 mb-8">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Idea / Descripción</label>
                    <p className="text-dark-900 font-medium mt-1">{selectedQuote.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Zona</label>
                        <p className="text-dark-900 font-medium mt-1">{selectedQuote.bodyPart}</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Tamaño Aprox.</label>
                        <p className="text-dark-900 font-medium mt-1">{selectedQuote.sizeCm}</p>
                    </div>
                </div>
                {/* Aquí iría la imagen de referencia si existiera */}
                {selectedQuote.referenceImage && (
                    <div className="rounded-xl overflow-hidden border border-gray-200">
                        <img src={selectedQuote.referenceImage} alt="Ref" className="w-full h-48 object-cover" />
                    </div>
                )}
            </div>

            {/* Acciones de Negocio */}
            <div className="border-t border-gray-100 pt-6 space-y-3">
                
                {!showConvert ? (
                    <>
                        {selectedQuote.status !== 'agendada' && (
                            <button 
                                onClick={() => setShowConvert(true)}
                                className="w-full flex items-center justify-center gap-2 bg-dark-900 hover:bg-primary text-white py-3 rounded-xl font-bold transition-colors shadow-lg"
                            >
                                <CalendarCheck size={18} /> Convertir a Cita
                            </button>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => handleStatusChange(selectedQuote.id, 'archivada')}
                                className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-600 py-3 rounded-xl font-medium transition-colors"
                            >
                                <Archive size={18} /> Archivar
                            </button>
                            {/* Podrías agregar botón para enviar cotización formal por PDF aquí */}
                        </div>
                    </>
                ) : (
                    // --- FORMULARIO RÁPIDO DE AGENDAR ---
                    <form onSubmit={handleConvertToAppointment} className="bg-gray-50 p-4 rounded-xl border border-primary/20 animate-in fade-in">
                        <h4 className="font-bold text-primary mb-4">Finalizar Reserva</h4>
                        
                        <div className="space-y-3 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Fecha y Hora</label>
                                <input required type="datetime-local" onChange={e => setApptDate(e.target.value)} className="w-full p-2 border rounded-lg bg-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Anticipo Recibido ($)</label>
                                <input required type="number" placeholder="0.00" onChange={e => setApptDeposit(e.target.value)} className="w-full p-2 border rounded-lg bg-white" />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button type="button" onClick={() => setShowConvert(false)} className="flex-1 py-2 text-gray-500 font-bold hover:bg-gray-200 rounded-lg">Cancelar</button>
                            <button type="submit" className="flex-1 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover">Confirmar</button>
                        </div>
                    </form>
                )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}