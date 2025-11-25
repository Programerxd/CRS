import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../firebase/client";
import type { UserProfile } from "../../../types/db";

// --- INTERFAZ DE CONFIGURACIÓN DEL SISTEMA ---
export interface SystemSettings {
  studioName: string;
  contactPhone: string;     // Para WhatsApp y mostrar
  contactEmail: string;     // Nuevo: Para mostrar en la tarjeta
  address: string;
  schedule: string;         // Nuevo: "Lun-Vie: 9am..."
  googleMapsUrl: string;    // Nuevo: La URL del iframe del mapa
  instagramUrl: string;
  facebookUrl: string;
  depositAmount: number;
}
// --- OBTENER CONFIGURACIÓN ---
export const getSettings = async () => {
  try {
    const docRef = doc(db, "settings", "general"); // Un solo documento global
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SystemSettings;
    }
    return null;
  } catch (error) {
    console.error("Error cargando configuración:", error);
    return null;
  }
};

// --- GUARDAR CONFIGURACIÓN ---
export const saveSettings = async (settings: SystemSettings) => {
  try {
    // setDoc con merge:true crea el documento si no existe
    await setDoc(doc(db, "settings", "general"), settings, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

// --- BUSCAR USUARIO POR EMAIL (Para promoverlo) ---
export const findUserByEmail = async (email: string) => {
  const q = query(collection(db, "users"), where("email", "==", email));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const doc = snap.docs[0];
    return { uid: doc.id, ...doc.data() } as UserProfile;
  }
  return null;
};

// --- CAMBIAR ROL DE USUARIO ---
export const updateUserRole = async (uid: string, newRole: 'admin' | 'artist' | 'client') => {
  try {
    await updateDoc(doc(db, "users", uid), { role: newRole });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};