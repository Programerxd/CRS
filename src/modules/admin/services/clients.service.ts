import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  limit
} from "firebase/firestore";
import { db } from "../../../firebase/client";
import type { UserProfile } from "../../../types/db";

// Definimos una interfaz extendida para visualización
export interface ClientRow extends UserProfile {
  source: 'registro' | 'cita';
  lastVisit?: Date;
  totalAppointments?: number;
}

// --- OBTENER LISTA UNIFICADA DE CLIENTES ---
export const getClients = async (): Promise<ClientRow[]> => {
  try {
    const clientsMap = new Map<string, ClientRow>();

    // 1. OBTENER USUARIOS REGISTRADOS (Colección 'users')
    // Quitamos el orderBy temporalmente para evitar errores de índice si faltan campos
    const usersSnap = await getDocs(collection(db, "users"));
    
    usersSnap.docs.forEach(doc => {
      const data = doc.data() as UserProfile;
      const email = data.email ? data.email.toLowerCase() : `no-email-${doc.id}`;
      
      clientsMap.set(email, {
        ...data,
        uid: doc.id,
        source: 'registro',
        totalAppointments: 0
      });
    });

    // 2. OBTENER CLIENTES DESDE CITAS (Colección 'appointments')
    // Para descubrir clientes que agendaron manual o como invitados
    const appointmentsSnap = await getDocs(query(collection(db, "appointments"), orderBy("createdAt", "desc"), limit(100)));

    appointmentsSnap.docs.forEach(doc => {
      const appt = doc.data();
      const email = appt.clientEmail ? appt.clientEmail.toLowerCase() : null;
      
      if (email) {
        // Si ya existe el usuario, actualizamos sus métricas
        if (clientsMap.has(email)) {
          const existing = clientsMap.get(email)!;
          existing.totalAppointments = (existing.totalAppointments || 0) + 1;
          // Actualizar última visita si esta cita es más reciente
          const apptDate = appt.date?.toDate ? appt.date.toDate() : new Date();
          if (!existing.lastVisit || apptDate > existing.lastVisit) {
            existing.lastVisit = apptDate;
          }
          clientsMap.set(email, existing);
        } 
        // Si NO existe (es un cliente solo de agenda), lo creamos "al vuelo"
        else {
          clientsMap.set(email, {
            uid: `guest-${doc.id}`,
            email: appt.clientEmail,
            displayName: appt.clientName || "Cliente de Agenda",
            phoneNumber: appt.clientPhone,
            role: 'client',
            photoURL: '', // Sin foto
            createdAt: appt.createdAt, // Usamos la fecha de la cita como registro
            source: 'cita',
            totalAppointments: 1,
            lastVisit: appt.date?.toDate ? appt.date.toDate() : new Date()
          });
        }
      }
    });

    // Convertir el mapa a array
    return Array.from(clientsMap.values());

  } catch (error) {
    console.error("Error obteniendo clientes unificados:", error);
    return [];
  }
};