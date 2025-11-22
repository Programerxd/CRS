import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  orderBy,
  addDoc,
  Timestamp
} from "firebase/firestore";
import { db } from "../../../firebase/client";

// Definimos la estructura de una Cotización
export interface Quote {
  id: string;
  clientName: string;
  clientPhone: string; // Vital para WhatsApp
  email?: string;
  description: string; // "Quiero un león en el brazo"
  bodyPart: string;
  sizeCm: string; // "15cm x 10cm"
  referenceImage?: string; // URL de la foto que subieron
  status: 'nueva' | 'negociacion' | 'agendada' | 'archivada';
  createdAt: any;
  estimatedPrice?: number; // El admin lo llena después
}

const COLLECTION = "quotes";

// --- OBTENER COTIZACIONES ---
export const getQuotes = async () => {
  try {
    // Traemos todas ordenadas por fecha (las más nuevas primero)
    const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quote));
  } catch (error) {
    console.error("Error al traer cotizaciones:", error);
    return [];
  }
};

// --- ACTUALIZAR ESTADO Y PRECIO ---
export const updateQuote = async (id: string, data: Partial<Quote>) => {
  try {
    await updateDoc(doc(db, COLLECTION, id), data);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

// --- CONVERTIR A CITA (La magia) ---
// Esto crea una entrada en la agenda y marca la cotización como "agendada"
export const convertToAppointment = async (quote: Quote, date: Date, deposit: number) => {
  try {
    // 1. Crear la Cita
    await addDoc(collection(db, "appointments"), {
      clientName: quote.clientName,
      clientPhone: quote.clientPhone,
      service: 'tatuaje', // Asumimos tatuaje por defecto
      artist: 'Por Asignar', // El admin lo cambia luego en la agenda
      status: 'confirmada', // Nace confirmada porque ya hubo anticipo
      date: Timestamp.fromDate(date),
      deposit: deposit,
      notes: `Cotización ID: ${quote.id}. Diseño: ${quote.description} en ${quote.bodyPart}.`,
      createdAt: Timestamp.now()
    });

    // 2. Actualizar la cotización a "Agendada"
    await updateDoc(doc(db, COLLECTION, quote.id), { status: 'agendada' });

    return { success: true };
  } catch (error) {
    console.error("Error convirtiendo:", error);
    return { success: false, error };
  }
};