import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  User,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Lock, // Importamos el icono de candado
} from "lucide-react";
import { getArtists } from "../modules/admin/services/cms.service";
import {
  createAppointment,
  getArtistAppointments,
} from "../modules/admin/services/appointments.service";
import type { Artist } from "../types/db";
import { Timestamp } from "firebase/firestore";
import { createQuote } from "../modules/admin/services/quotes.service";
// --- NUEVO: Imports de Autenticación ---
import { auth } from "../firebase/client";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";

const STEPS = [
  "Servicio & Artista",
  "Fecha & Hora",
  "Tus Datos",
  "Confirmación",
];

export default function BookingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [artists, setArtists] = useState<Artist[]>([]);
  
  // Estados de Auth y Errores
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [serverError, setServerError] = useState(""); 
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    serviceType: "tatuaje",
    artistId: "",
    artistName: "",
    date: null as Date | null,
    time: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    description: "",
    bodyPart: "",
  });

  const [takenSlots, setTakenSlots] = useState<string[]>([]);

  // 1. Cargar Artistas
  useEffect(() => {
    getArtists().then(setArtists);
  }, []);

  // 2. Escuchar Estado de Autenticación (Nivel Empresarial)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setAuthChecking(false);
        
        // Si hay usuario, autocompletamos sus datos para agilizar el flujo
        if (currentUser) {
            setFormData(prev => ({
                ...prev,
                clientName: prev.clientName || currentUser.displayName || "",
                clientEmail: prev.clientEmail || currentUser.email || "",
            }));
        }
    });
    return () => unsubscribe();
  }, []);

  // Resetear hora si cambia la fecha o el artista
  useEffect(() => {
    setFormData((prev) => ({ ...prev, time: "" }));
    setTakenSlots([]);
    setErrors({});
  }, [formData.date, formData.artistId]);

  useEffect(() => {
    if (formData.date && formData.artistId) {
      checkAvailability();
    }
  }, [formData.date, formData.artistId]);

  const checkAvailability = async () => {
    if (!formData.date) return;
    setLoading(true);
    setServerError("");

    try {
      const start = new Date(formData.date);
      start.setHours(0, 0, 0);
      const end = new Date(formData.date);
      end.setHours(23, 59, 59);

      const appointments = await getArtistAppointments(
        formData.artistId,
        start,
        end
      );

      const busyTimes = appointments.map((appt) => {
        // @ts-ignore
        const date = appt.date.toDate
          // @ts-ignore
          ? appt.date.toDate()
          : new Date(appt.date.seconds * 1000);
        return `${date.getHours().toString().padStart(2, "0")}:00`;
      });

      setTakenSlots(busyTimes);
    } catch (error) {
      console.error("Error cargando disponibilidad:", error);
      setServerError(
        "No pudimos cargar los horarios. Intenta recargar la página."
      );
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = [
    "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
  ];

  // --- VALIDACIÓN ---
  const validateCurrentStep = () => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    // Paso 0
    if (currentStep === 0) {
      if (!formData.artistId) {
        newErrors.artistId = "Debes seleccionar un artista para continuar.";
        isValid = false;
      }
    }

    // Paso 1
    if (currentStep === 1) {
      if (!formData.date) {
        newErrors.date = "Por favor selecciona una fecha en el calendario.";
        isValid = false;
      }
      if (!formData.time) {
        newErrors.time = "Debes elegir un horario disponible.";
        isValid = false;
      }
    }

    // Paso 2 (Datos)
    if (currentStep === 2) {
      // Si NO hay usuario, no validamos campos, porque mostramos el Login Gate
      if (!user) return false; 

      const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
      if (!formData.clientName.trim()) {
        newErrors.clientName = "El nombre es obligatorio.";
        isValid = false;
      } else if (formData.clientName.length < 5) {
        newErrors.clientName = "Ingresa tu nombre completo (mínimo 5 letras).";
        isValid = false;
      } else if (!nameRegex.test(formData.clientName)) {
        newErrors.clientName = "El nombre solo puede contener letras.";
        isValid = false;
      }

      const phoneRegex = /^[0-9]{10}$/;
      const cleanPhone = formData.clientPhone.replace(/[\s-]/g, ''); 
      if (!formData.clientPhone.trim()) {
        newErrors.clientPhone = "El teléfono es obligatorio.";
        isValid = false;
      } else if (!phoneRegex.test(cleanPhone)) {
        newErrors.clientPhone = "Ingresa un número válido de 10 dígitos.";
        isValid = false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.clientEmail.trim()) {
        newErrors.clientEmail = "El correo es obligatorio.";
        isValid = false;
      } else if (!emailRegex.test(formData.clientEmail)) {
        newErrors.clientEmail = "El formato del correo no es válido.";
        isValid = false;
      }

      if (!formData.bodyPart.trim()) {
        newErrors.bodyPart = "Indica la zona del cuerpo.";
        isValid = false;
      }

      if (!formData.description.trim()) {
        newErrors.description = "Cuéntanos un poco sobre tu idea.";
        isValid = false;
      } else if (formData.description.length < 10) {
        newErrors.description = "La descripción es muy corta (mínimo 10 caracteres).";
        isValid = false;
      }
    }

    setErrors(newErrors);
    
    if (!isValid) {
        const firstError = document.querySelector('.error-focus');
        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return isValid;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    if (currentStep === 2) handleSubmit();
    else setCurrentStep((curr) => curr + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setServerError("");
    
    try {
      if (formData.serviceType === "cotizacion") {
        const quoteData = {
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          clientPhone: formData.clientPhone,
          description: formData.description,
          bodyPart: formData.bodyPart,
          preferenceDetails: `Fecha deseada: ${formData.date?.toLocaleDateString()} ${formData.time}. Artista: ${formData.artistName}`,
          artistId: formData.artistId,
        };
        const res = await createQuote(quoteData);
        if (res.success) setCurrentStep(3);
        else setServerError("Error al enviar la cotización. Intenta de nuevo.");
      } else {
        const [hours] = formData.time.split(":");
        const finalDate = new Date(formData.date!);
        finalDate.setHours(parseInt(hours), 0, 0);

        const appointmentData: any = {
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          clientPhone: formData.clientPhone,
          serviceType: formData.serviceType,
          bodyPart: formData.bodyPart,
          description: formData.description,
          artistId: formData.artistId,
          artistName: formData.artistName,
          date: Timestamp.fromDate(finalDate),
          status: "pendiente",
          durationMin: 60,
          depositAmount: 0,
        };
        const res = await createAppointment(appointmentData);
        if (res.success) setCurrentStep(3);
        else setServerError("El horario seleccionado acaba de ser ocupado. Por favor elige otro.");
      }
    } catch (e) {
      console.error(e);
      setServerError("Ocurrió un error inesperado de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
      setFormData({ ...formData, [field]: value });
      if (errors[field]) setErrors({ ...errors, [field]: "" });
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 min-h-[600px] flex flex-col">
      
      {/* HEADER PASOS */}
      <div className="bg-gray-50 p-6 border-b border-gray-100">
        <div className="flex justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-0 -translate-y-1/2 rounded-full"></div>
          <div
            className="absolute top-1/2 left-0 h-1 bg-primary -z-0 -translate-y-1/2 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          ></div>

          {STEPS.map((step, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  idx <= currentStep
                    ? "bg-primary text-white ring-4 ring-white shadow-md"
                    : "bg-gray-300 text-gray-500 ring-4 ring-white"
                }`}
              >
                {idx + 1}
              </div>
              <span
                className={`text-[10px] font-bold uppercase mt-2 tracking-wider hidden sm:block ${
                  idx <= currentStep ? "text-primary" : "text-gray-400"
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CUERPO */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto">
        
        {serverError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertTriangle size={20} />
                <span className="font-medium text-sm">{serverError}</span>
            </div>
        )}

        {/* PASO 1 */}
        {currentStep === 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
            <div>
              <h3 className="text-2xl font-heading font-bold text-dark-900 mb-4">
                ¿Qué te quieres realizar?
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {["tatuaje", "piercing", "micro", "cotizacion"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, serviceType: type })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.serviceType === type
                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className="font-bold uppercase text-sm block">
                      {type}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-heading font-bold text-dark-900 mb-4 flex items-center gap-2">
                Elige a tu Artista
                {errors.artistId && <span className="text-red-500 text-sm font-normal bg-red-50 px-2 py-0.5 rounded-full error-focus">Selecciona uno</span>}
              </h3>
              
              {artists.length === 0 ? (
                <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="animate-spin" size={20} /> Cargando artistas...
                </div>
              ) : (
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${errors.artistId ? 'p-2 border-2 border-red-100 bg-red-50/30 rounded-2xl' : ''}`}>
                  {artists.map((artist) => (
                    <div
                      key={artist.id}
                      onClick={() => {
                        setFormData({
                          ...formData,
                          artistId: artist.id!,
                          artistName: artist.name,
                        });
                        setErrors({...errors, artistId: ""});
                      }}
                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                        formData.artistId === artist.id
                          ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary"
                          : "border-gray-100 hover:border-gray-200 hover:bg-white"
                      }`}
                    >
                      <img
                        src={artist.photoUrl || "https://via.placeholder.com/100"}
                        className="w-12 h-12 rounded-full object-cover bg-gray-200 border-2 border-white shadow-sm"
                      />
                      <div>
                        <h4 className="font-bold text-dark-900">
                          {artist.name}
                        </h4>
                        <p className="text-xs text-gray-500 font-medium uppercase">
                          {artist.specialty}
                        </p>
                      </div>
                      {formData.artistId === artist.id && (
                        <CheckCircle
                          className="absolute top-4 right-4 text-primary"
                          size={20}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              {errors.artistId && <p className="text-red-500 text-xs mt-2 font-bold flex items-center gap-1"><AlertCircle size={12}/> {errors.artistId}</p>}
            </div>
          </div>
        )}

        {/* PASO 2 */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-dark-900 mb-4 flex items-center gap-2">
                  <Calendar className="text-primary" /> Selecciona el Día
                </h3>
                <input
                  type="date"
                  className={`w-full p-4 border rounded-xl outline-none font-medium text-gray-600 shadow-sm cursor-pointer transition-colors ${
                      errors.date 
                      ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200 error-focus" 
                      : "border-gray-200 focus:ring-2 focus:ring-primary/20 hover:bg-gray-50"
                  }`}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const [year, month, day] = e.target.value.split("-").map(Number);
                    const localDate = new Date(year, month - 1, day);
                    setFormData({ ...formData, date: localDate, time: "" });
                    setErrors({ ...errors, date: "" });
                  }}
                />
                {errors.date && <p className="text-red-500 text-xs mt-2 font-bold">{errors.date}</p>}
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-bold text-dark-900 mb-4 flex items-center gap-2">
                  <Clock className="text-primary" /> Horarios
                </h3>

                {!formData.date ? (
                  <div className="p-8 bg-gray-50 rounded-xl text-center text-gray-400 border border-dashed border-gray-200 flex flex-col items-center justify-center h-48">
                    <Calendar className="w-8 h-8 mb-2 opacity-20" />
                    <span className="text-sm">Primero selecciona una fecha</span>
                  </div>
                ) : loading ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-3 text-primary">
                    <Loader2 className="animate-spin w-8 h-8" />
                    <span className="text-sm font-bold animate-pulse">
                      Verificando agenda...
                    </span>
                  </div>
                ) : (
                  <div>
                      <div className={`grid grid-cols-3 gap-3 ${errors.time ? 'p-2 bg-red-50 rounded-xl border border-red-100 error-focus' : ''}`}>
                        {timeSlots.map((time) => {
                          const isTaken = takenSlots.includes(time);
                          return (
                            <button
                              key={time}
                              disabled={isTaken}
                              onClick={() => {
                                  setFormData({ ...formData, time });
                                  setErrors({ ...errors, time: "" });
                              }}
                              className={`py-3 rounded-lg font-bold text-sm transition-all ${
                                isTaken
                                  ? "bg-gray-100 text-gray-300 cursor-not-allowed decoration-slice line-through"
                                  : formData.time === time
                                  ? "bg-primary text-white shadow-lg transform scale-105 ring-2 ring-primary ring-offset-2"
                                  : "bg-white border border-gray-200 hover:border-primary text-gray-600 hover:shadow-md"
                              }`}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                      {errors.time && <p className="text-red-500 text-xs mt-2 font-bold">{errors.time}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: DATOS DEL CLIENTE (CON LOGIN GATE) */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 max-w-2xl mx-auto">
            
            {/* --- AQUÍ ESTÁ LA LÓGICA DE BLOQUEO --- */}
            {authChecking ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="animate-spin text-primary mb-2" size={32}/>
                    <p className="text-gray-400 text-sm">Verificando sesión...</p>
                </div>
            ) : !user ? (
                // --- PANTALLA DE BLOQUEO (LOGIN GATE) ---
                <div className="text-center py-8 px-6 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                        <Lock className="text-primary/60" size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-dark-900 mb-2">Inicia Sesión para Agendar</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-8 text-sm leading-relaxed">
                        Para garantizar la seguridad de tu reserva y enviarte la confirmación, necesitamos que te identifiques.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a href="/login" className="px-8 py-3 bg-dark-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2">
                            <User size={18}/> Iniciar Sesión
                        </a>
                        <a href="/registro" className="px-8 py-3 bg-white border border-gray-200 text-dark-900 font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center">
                            Crear Cuenta
                        </a>
                    </div>
                    <p className="text-xs text-gray-400 mt-6 border-t border-gray-200 pt-4">
                        Tus selecciones de fecha y hora se guardarán temporalmente.
                    </p>
                </div>
            ) : (
                // --- FORMULARIO NORMAL (SOLO SI HAY USUARIO) ---
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">
                            Nombre Completo <span className="text-red-500">*</span>
                            </label>
                            <input
                            type="text"
                            className={`w-full p-3 border rounded-lg outline-none transition-colors ${
                                errors.clientName 
                                ? "border-red-500 bg-red-50 error-focus" 
                                : "border-gray-200 focus:ring-2 focus:ring-primary/20"
                            }`}
                            value={formData.clientName}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                                handleChange('clientName', val);
                            }}
                            />
                            {errors.clientName && <p className="text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle size={10}/> {errors.clientName}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">
                            Teléfono (10 dígitos) <span className="text-red-500">*</span>
                            </label>
                            <input
                            type="tel"
                            maxLength={10}
                            className={`w-full p-3 border rounded-lg outline-none transition-colors ${
                                errors.clientPhone 
                                ? "border-red-500 bg-red-50 error-focus" 
                                : "border-gray-200 focus:ring-2 focus:ring-primary/20"
                            }`}
                            value={formData.clientPhone}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, ''); // Solo números
                                handleChange('clientPhone', val);
                            }}
                            />
                            {errors.clientPhone && <p className="text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle size={10}/> {errors.clientPhone}</p>}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">
                            Correo Electrónico <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            disabled // Deshabilitamos porque viene del login
                            className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                            value={formData.clientEmail}
                        />
                        <p className="text-[10px] text-gray-400">El correo está vinculado a tu cuenta.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">
                            Zona del Cuerpo <span className="text-red-500">*</span>
                            </label>
                            <input
                            className={`w-full p-3 border rounded-lg outline-none transition-colors ${
                                errors.bodyPart 
                                ? "border-red-500 bg-red-50 error-focus" 
                                : "border-gray-200 focus:ring-2 focus:ring-primary/20"
                            }`}
                            placeholder="Ej: Antebrazo, Espalda..."
                            value={formData.bodyPart}
                            onChange={(e) => handleChange('bodyPart', e.target.value)}
                            />
                            {errors.bodyPart && <p className="text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle size={10}/> {errors.bodyPart}</p>}
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">
                            Tamaño Aprox (cm)
                            </label>
                            <input
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                            placeholder="Ej: 15x10 cm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">
                            Descripción de tu Idea <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            className={`w-full p-3 border rounded-lg h-24 resize-none outline-none transition-colors ${
                            errors.description 
                            ? "border-red-500 bg-red-50 error-focus" 
                            : "border-gray-200 focus:ring-2 focus:ring-primary/20"
                            }`}
                            placeholder="Cuéntanos qué quieres hacerte..."
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                        />
                        {errors.description && <p className="text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle size={10}/> {errors.description}</p>}
                    </div>
                </>
            )}
          </div>
        )}

        {/* PASO 4: ÉXITO */}
        {currentStep === 3 && (
          <div className="text-center py-10 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle size={48} />
            </div>
            <h2 className="text-3xl font-heading font-bold text-dark-900 mb-4">
              ¡Solicitud Enviada!
            </h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
              Hemos recibido tu solicitud. Te contactaremos pronto para confirmar los detalles finales.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-dark-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg"
            >
              Agendar Otra Cita
            </button>
          </div>
        )}
      </div>

      {/* FOOTER */}
      {currentStep < 3 && (
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <button
            onClick={() => setCurrentStep((c) => Math.max(0, c - 1))}
            disabled={currentStep === 0 || loading}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-500 hover:text-dark-900 hover:bg-gray-100 transition-all ${
              currentStep === 0 ? "opacity-0 pointer-events-none" : ""
            }`}
          >
            <ChevronLeft size={20} /> Anterior
          </button>

          {/* Ocultamos el botón "Siguiente" si estamos en el paso 2 y NO hay usuario */}
          {(currentStep !== 2 || user) && (
              <button
                onClick={handleNext}
                disabled={loading}
                className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-primary-hover transition-all transform hover:scale-105 disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Procesando..."
                  : currentStep === 2
                  ? "Confirmar Cita"
                  : "Siguiente"}
                {!loading && <ChevronRight size={20} />}
              </button>
          )}
        </div>
      )}
    </div>
  );
}