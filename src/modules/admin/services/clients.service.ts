import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  limit, 
  where 
} from "firebase/firestore";
import { db } from "../../../firebase/client";
import type { UserProfile } from "../../../types/db";

const COLLECTION = "users";

// --- OBTENER LISTA DE CLIENTES ---
export const getClients = async () => {
  try {
    // Traemos los últimos 50 usuarios registrados para no saturar
    // (En un futuro agregaríamos paginación real)
    const q = query(
      collection(db, COLLECTION), 
      orderBy("createdAt", "desc"), 
      limit(50)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    return [];
  }
};