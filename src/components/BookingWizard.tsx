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
} from "lucide-react";
import { getArtists } from "../modules/admin/services/cms.service";
import {
  createAppointment,
  getArtistAppointments,
} from "../modules/admin/services/appointments.service";
import type { Artist } from "../types/db";
import { Timestamp } from "firebase/firestore";

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
  const [errorMsg, setErrorMsg] = useState(""); // Estado para mensajes de error visuales

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

  useEffect(() => {
    getArtists().then(setArtists);
  }, []);

  // Resetear hora si cambia la fecha o el artista
  useEffect(() => {
    setFormData((prev) => ({ ...prev, time: "" }));
    setTakenSlots([]);
  }, [formData.date, formData.artistId]);

  useEffect(() => {
    if (formData.date && formData.artistId) {
      checkAvailability();
    }
  }, [formData.date, formData.artistId]);

  const checkAvailability = async () => {
    if (!formData.date) return;
    setLoading(true);
    setErrorMsg(""); // Limpiar errores previos

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
        // Convertir Timestamp de Firebase a Date de JS de forma segura
        // @ts-ignore (por si el tipo viene distinto)
        const date = appt.date.toDate
          ? appt.date.toDate()
          : new Date(appt.date.seconds * 1000);
        return `${date.getHours().toString().padStart(2, "0")}:00`;
      });

      setTakenSlots(busyTimes);
    } catch (error) {
      console.error("Error cargando disponibilidad:", error);
      // Esto es vital: Si falla, quitamos el loading para no trabar la UI
      setErrorMsg(
        "No pudimos cargar los horarios. Intenta recargar la página."
      );
    } finally {
      setLoading(false); // SIEMPRE se ejecuta, éxito o error
    }
  };

  const timeSlots = [
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
  ];

  const handleNext = () => {
    if (currentStep === 0 && !formData.artistId)
      return alert("Selecciona un artista");
    if (currentStep === 1 && (!formData.date || !formData.time))
      return alert("Selecciona fecha y hora");
    if (currentStep === 2 && (!formData.clientName || !formData.clientPhone))
      return alert("Completa tus datos");

    if (currentStep === 2) handleSubmit();
    else setCurrentStep((curr) => curr + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
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

      if (res.success) {
        setCurrentStep(3);
      } else {
        alert("Error al agendar. Revisa tu conexión.");
      }
    } catch (e) {
      console.error(e);
      alert("Error inesperado.");
    } finally {
      setLoading(false);
    }
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
                    ? "bg-primary text-white ring-4 ring-white"
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
                    onClick={() =>
                      setFormData({ ...formData, serviceType: type })
                    }
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
              <h3 className="text-2xl font-heading font-bold text-dark-900 mb-4">
                Elige a tu Artista
              </h3>
              {artists.length === 0 ? (
                <p className="text-gray-400">Cargando artistas...</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {artists.map((artist) => (
                    <div
                      key={artist.id}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          artistId: artist.id!,
                          artistName: artist.name,
                        })
                      }
                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                        formData.artistId === artist.id
                          ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary"
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <img
                        src={artist.photoUrl}
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
            </div>
          </div>
        )}

        {/* PASO 2: FECHA Y HORA */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-dark-900 mb-4 flex items-center gap-2">
                  <Calendar className="text-primary" /> Selecciona el Día
                </h3>
                <input
                  type="date"
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium text-gray-600 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                  min={new Date().toISOString().split("T")[0]}
                  // value={...} // Esta línea déjala como estaba

                  // --- AQUÍ ESTÁ LA CORRECCIÓN ---
                  onChange={(e) => {
                    if (!e.target.value) return;
                    // 1. Desglosamos la fecha en Año, Mes, Día
                    const [year, month, day] = e.target.value
                      .split("-")
                      .map(Number);

                    // 2. Creamos la fecha usando el constructor local (Mes es índice 0, por eso restamos 1)
                    // Esto asegura que sea 25 de Noviembre a las 00:00 TU HORA LOCAL
                    const localDate = new Date(year, month - 1, day);

                    setFormData({ ...formData, date: localDate, time: "" });
                  }}
                />
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-bold text-dark-900 mb-4 flex items-center gap-2">
                  <Clock className="text-primary" /> Horarios Disponibles
                </h3>

                {/* ESTADOS DE CARGA Y ERROR */}
                {!formData.date ? (
                  <div className="p-8 bg-gray-50 rounded-xl text-center text-gray-400 border border-dashed border-gray-200 flex flex-col items-center justify-center h-48">
                    <Calendar className="w-8 h-8 mb-2 opacity-20" />
                    <span className="text-sm">
                      Primero selecciona una fecha
                    </span>
                  </div>
                ) : loading ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-3 text-primary">
                    <Loader2 className="animate-spin w-8 h-8" />
                    <span className="text-sm font-bold animate-pulse">
                      Verificando agenda...
                    </span>
                  </div>
                ) : errorMsg ? (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm font-bold border border-red-100">
                    <AlertCircle size={20} /> {errorMsg}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {timeSlots.map((time) => {
                      const isTaken = takenSlots.includes(time);
                      return (
                        <button
                          key={time}
                          disabled={isTaken}
                          onClick={() => setFormData({ ...formData, time })}
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
                )}
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: DATOS (Igual que antes) */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-heading font-bold text-dark-900">
                Casi listo
              </h3>
              <p className="text-gray-500">
                Necesitamos tus datos para confirmar la reserva.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Nombre Completo
                </label>
                <input
                  required
                  className="w-full p-3 bg-gray-50 border rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData({ ...formData, clientName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Teléfono
                </label>
                <input
                  required
                  className="w-full p-3 bg-gray-50 border rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                  value={formData.clientPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, clientPhone: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Correo Electrónico
              </label>
              <input
                required
                type="email"
                className="w-full p-3 bg-gray-50 border rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                value={formData.clientEmail}
                onChange={(e) =>
                  setFormData({ ...formData, clientEmail: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Idea / Zona del cuerpo
              </label>
              <textarea
                className="w-full p-3 bg-gray-50 border rounded-lg h-24 resize-none focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                placeholder="Describe tu idea..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </div>
        )}

        {/* PASO 4: ÉXITO (Igual que antes) */}
        {currentStep === 3 && (
          <div className="text-center py-10 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle size={48} />
            </div>
            <h2 className="text-3xl font-heading font-bold text-dark-900 mb-4">
              ¡Solicitud Enviada!
            </h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
              Hemos recibido tu solicitud. Recibirás una confirmación en breve.
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

          <button
            onClick={handleNext}
            disabled={loading}
            className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-primary-hover transition-all transform hover:scale-105 disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {loading
              ? "Verificando..."
              : currentStep === 2
              ? "Confirmar Cita"
              : "Siguiente"}
            {!loading && <ChevronRight size={20} />}
          </button>
        </div>
      )}
    </div>
  );
}
