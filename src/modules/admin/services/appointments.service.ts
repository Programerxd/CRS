import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  Timestamp, 
  orderBy 
} from "firebase/firestore";
import { db } from "../../../firebase/client";

export interface Appointment {
  id?: string;
  clientName: string;
  clientPhone: string;
  service: 'tatuaje' | 'piercing' | 'cotizacion';
  artist: string;
  date: Date; // En la app usamos Date, en BD Timestamp
  status: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  notes?: string;
  deposit: number; // Anticipo
}

const COLLECTION = "appointments";

// --- CREAR CITA ---
export const createAppointment = async (appointment: Omit<Appointment, 'id'>) => {
  try {
    // Convertimos la fecha JS a Timestamp de Firestore
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...appointment,
      date: Timestamp.fromDate(appointment.date),
      createdAt: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creando cita:", error);
    return { success: false, error };
  }
};

// --- OBTENER CITAS POR MES ---
// Traemos todo el mes para pintar los puntitos en el calendario
export const getAppointmentsByMonth = async (year: number, month: number) => {
  try {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    const q = query(
      collection(db, COLLECTION),
      where("date", ">=", Timestamp.fromDate(startDate)),
      where("date", "<=", Timestamp.fromDate(endDate)),
      orderBy("date", "asc")
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date.toDate() // Convertimos de vuelta a JS Date
      } as Appointment;
    });
  } catch (error) {
    console.error("Error obteniendo citas:", error);
    return [];
  }
};