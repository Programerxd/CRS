import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react'; // Importamos el hook para leer el store
import { MapPin, Phone, Mail, Clock, Send, Lock } from 'lucide-react';
import { $settings } from '../store/settingsStore'; // Importamos el store global reactivo
import { auth } from '../firebase/client';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { createQuote } from '../modules/admin/services/quotes.service';

export default function ContactSection() {
  // 1. Usamos useStore para leer la configuración en tiempo real
  // Al cambiar algo en Firebase, esta variable se actualiza sola automáticamente.
  const settings = useStore($settings); 
  
  const [user, setUser] = useState<User | null>(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState({ message: '' });

  useEffect(() => {
    // 2. Solo necesitamos escuchar la autenticación
    // La configuración ya viene manejada por el store global
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validación usando los datos del store
      if (!settings.contactPhone) {
          return alert("El teléfono de contacto no está configurado en el sistema.");
      }

      // 1. Guardar en Firebase (CRM)
      await createQuote({
          clientName: user?.displayName || "Usuario Web",
          clientEmail: user?.email || "",
          clientPhone: "N/A", 
          description: formData.message,
          bodyPart: "Consulta General",
          status: 'nueva'
      });

      // 2. Abrir WhatsApp
      const text = `Hola, soy ${user?.displayName || 'un cliente'}.%0A%0A${formData.message}`;
      window.open(`https://wa.me/${settings.contactPhone}?text=${text}`, '_blank');
      
      setFormData({ message: '' });
      // Opcional: Feedback visual
  };

  // Nota: Ya no necesitamos un estado de "loading" bloqueante para toda la sección
  // porque el store tiene valores iniciales por defecto.

  return (
    <section className="bg-gray-50 min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl md:text-5xl font-heading font-extrabold text-dark-900 mb-4">
                Visítanos o <span className="text-primary">Contáctanos</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                Estamos aquí para responder tus preguntas y ayudarte a comenzar tu próximo proyecto de arte corporal.
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* --- COLUMNA IZQUIERDA: INFORMACIÓN & MAPA --- */}
            <div className="space-y-8">
                
                {/* Tarjetas de Info */}
                <div className="grid grid-cols-1 gap-6">
                    
                    {/* Dirección */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-6 transition-transform hover:-translate-y-1 duration-300">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                            <MapPin size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-dark-900 text-lg mb-1">Dirección</h4>
                            {/* Usamos directamente la variable reactiva 'settings' */}
                            <p className="text-gray-500 leading-relaxed">{settings.address || 'Ubicación pendiente'}</p>
                        </div>
                    </div>

                    {/* Teléfono & Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-pink-50 text-primary flex items-center justify-center flex-shrink-0">
                                <Phone size={20} />
                            </div>
                            <div className="overflow-hidden">
                                <h4 className="font-bold text-dark-900 text-sm">Teléfono</h4>
                                <p className="text-gray-500 text-sm truncate">{settings.contactPhone || '--'}</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-pink-50 text-primary flex items-center justify-center flex-shrink-0">
                                <Mail size={20} />
                            </div>
                            <div className="overflow-hidden">
                                <h4 className="font-bold text-dark-900 text-sm">Email</h4>
                                <p className="text-gray-500 text-sm truncate">{settings.contactEmail || '--'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Horario */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-6">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-secondary to-purple-900 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-dark-900 text-lg mb-1">Horario de Atención</h4>
                            <p className="text-gray-500">{settings.schedule || 'Consultar disponibilidad'}</p>
                        </div>
                    </div>
                </div>

                {/* Mapa Embed */}
                {settings.googleMapsUrl && (
                    <div className="rounded-2xl overflow-hidden shadow-lg h-64 border-4 border-white">
                        <iframe 
                            src={settings.googleMapsUrl} 
                            width="100%" 
                            height="100%" 
                            style={{border:0}} 
                            loading="lazy" 
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>
                )}
            </div>

            {/* --- COLUMNA DERECHA: FORMULARIO --- */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden">
                
                <div className="text-center mb-8">
                    <h3 className="text-2xl font-heading font-bold text-dark-900">Envíanos un Mensaje</h3>
                    <p className="text-gray-500 mt-2 text-sm">Responderemos a tu consulta a la brevedad posible.</p>
                </div>

                {user ? (
                    /* VISTA LOGUEADO: FORMULARIO ACTIVO */
                    <form onSubmit={handleSendMessage} className="space-y-6 animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Tu Nombre</label>
                                <input disabled value={user.displayName || ''} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 cursor-not-allowed font-medium" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Tu Correo</label>
                                <input disabled value={user.email || ''} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 cursor-not-allowed font-medium" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Escribe tu consulta</label>
                            <textarea 
                                required
                                className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all h-40 resize-none text-dark-900 placeholder-gray-300"
                                placeholder="Hola, me gustaría cotizar un tatuaje..."
                                value={formData.message}
                                onChange={e => setFormData({...formData, message: e.target.value})}
                            ></textarea>
                        </div>

                        <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1">
                            <Send size={20} /> Enviar Mensaje
                        </button>
                        
                        <p className="text-center text-xs text-gray-400">Serás redirigido a WhatsApp para continuar el chat.</p>
                    </form>
                ) : (
                    /* VISTA NO LOGUEADO: BLOQUEO */
                    <div className="relative py-12 flex flex-col items-center justify-center text-center space-y-6">
                        {/* Fondo borroso simulado de inputs */}
                        <div className="absolute inset-0 space-y-6 opacity-20 blur-sm pointer-events-none select-none" aria-hidden="true">
                            <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
                            <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
                            <div className="h-32 bg-gray-200 rounded-xl w-full"></div>
                        </div>

                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-2 shadow-inner">
                            <Lock className="text-gray-400" size={32} />
                        </div>
                        
                        <div className="relative z-10 max-w-xs">
                            <h4 className="font-bold text-dark-900 text-lg mb-2">Inicia Sesión para Contactar</h4>
                            <p className="text-gray-500 text-sm mb-6">Para brindarte una mejor atención y seguimiento, necesitamos que te identifiques.</p>
                            
                            <div className="flex flex-col gap-3">
                                <a href="/login" className="w-full bg-dark-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-colors shadow-lg">
                                    Iniciar Sesión
                                </a>
                                <a href="/registro" className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-dark-900 font-bold py-3 rounded-xl transition-colors">
                                    Crear Cuenta
                                </a>
                            </div>
                        </div>
                    </div>
                )}

            </div>

        </div>
      </div>
    </section>
  );
}