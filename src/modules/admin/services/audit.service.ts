import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../../firebase/client";

export const logAction = async (action: string, details: string) => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, "audit_logs"), {
      action: action,          // Ej: "ELIMINAR_USUARIO"
      details: details,        // Ej: "Eliminó al usuario #123"
      performedBy: user.email, // Quién lo hizo
      uid: user.uid,
      timestamp: serverTimestamp(), // Hora exacta del servidor (no manipulable)
      ip: "registrado_por_request" // (Opcional si tienes backend)
    });
    
    console.log(`📝 Auditoría guardada: ${action}`);
  } catch (error) {
    console.error("Error guardando log de auditoría", error);
  }
};