import { 
  collection, addDoc, query, where, getDocs, Timestamp, orderBy, doc, updateDoc, deleteDoc,
} from "firebase/firestore";
import { db } from "../../../firebase/client";
import type { Appointment } from "../../../types/db";

const COLLECTION = "appointments";

export const checkCollision = async (artistId: string, start: Date, durationMin: number) => {
    // Calculamos la hora fin de la NUEVA cita
    const end = new Date(start.getTime() + durationMin * 60000);

    // Buscamos citas de ese artista en ese día
    const dayStart = new Date(start); dayStart.setHours(0,0,0);
    const dayEnd = new Date(start); dayEnd.setHours(23,59,59);
    
    const appointments = await getArtistAppointments(artistId, dayStart, dayEnd);

    // Revisamos si alguna choca
    const collision = appointments.find(appt => {
        if (appt.status === 'cancelada') return false; // Ignorar canceladas
        
        const apptStart = appt.date.toDate();
        const apptEnd = new Date(apptStart.getTime() + (appt.durationMin || 60) * 60000);

        // Lógica de colisión: (NuevaInicio < ViejaFin) Y (NuevaFin > ViejaInicio)
        return start < apptEnd && end > apptStart;
    });

    return collision ? true : false; // Retorna true si HAY choque (no disponible)
};

// --- CREAR CITA ---
export const createAppointment = async (appt: Omit<Appointment, 'id'>) => {
  try {
    const startDate = appt.date instanceof Date ? appt.date : appt.date.toDate();
    
    // 1. Validar choque
    const isBusy = await checkCollision(appt.artistId, startDate, appt.durationMin);
    if (isBusy) {
        return { success: false, error: "Horario no disponible (choque con otra cita)" };
    }

    // 2. Guardar si está libre
    await addDoc(collection(db, COLLECTION), {
      ...appt,
      createdAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error };
  }
};

// --- OBTENER CITAS DE UN ARTISTA EN UN RANGO DE FECHAS ---
export const getArtistAppointments = async (artistId: string, startOfDay: Date, endOfDay: Date) => {
    const q = query(
        collection(db, COLLECTION),
        where("artistId", "==", artistId),
        where("date", ">=", Timestamp.fromDate(startOfDay)),
        where("date", "<=", Timestamp.fromDate(endOfDay))
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
};

// --- OBTENER TODAS LAS CITAS (PARA ADMIN) ---
export const getAllAppointments = async (startDate: Date, endDate: Date) => {
    const q = query(
        collection(db, COLLECTION),
        where("date", ">=", Timestamp.fromDate(startDate)),
        where("date", "<=", Timestamp.fromDate(endDate)),
        orderBy("date", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
};

// --- ACTUALIZAR CUALQUIER DATO DE LA CITA (Reprogramar, notas, etc) ---
export const updateAppointment = async (id: string, data: Partial<Appointment>) => {
    try {
        await updateDoc(doc(db, COLLECTION, id), data);
        return { success: true };
    } catch (error) {
        console.error("Error actualizando:", error);
        return { success: false, error };
    }
};

// --- ELIMINAR CITA DEFINITIVAMENTE ---
export const deleteAppointment = async (id: string) => {
    try {
        await deleteDoc(doc(db, COLLECTION, id));
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
};